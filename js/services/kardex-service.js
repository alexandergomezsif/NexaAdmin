/**
 * Nexa ERP - Servicio de Inventario y Kardex (costo promedio ponderado)
 *
 * Reglas:
 * - Las SALIDAS se valoran SIEMPRE al costo promedio vigente (nunca al precio de venta).
 * - Las ENTRADAS recalculan el costo promedio ponderado.
 * - Una salida mayor al stock disponible se rechaza (salvo `permitirNegativo`).
 *   Antes el stock se "recortaba" a 0 y el Kardex dejaba de cuadrar.
 * - Costos con 2 decimales (materias primas por kg/ml).
 * - Todas las operaciones pueden ejecutarse dentro de una transacción (`tx`) para que
 *   un documento (venta, compra, producción) se grabe completo o no se grabe.
 */

import { DB, STORES } from './db-service.js';
import { AuditService } from './audit-service.js';
import { Session } from '../utils/session.js';

export const MOVEMENT_TYPES = {
  COMPRA: { label: 'Compra de Mercancía/Insumos', type: 'IN' },
  VENTA: { label: 'Venta Facturada / POS', type: 'OUT' },
  DEVOLUCION_VENTA: { label: 'Devolución / Anulación de Venta', type: 'IN' },
  DEVOLUCION_COMPRA: { label: 'Devolución a Proveedor', type: 'OUT' },
  AJUSTE_POS: { label: 'Ajuste de Inventario (+)', type: 'IN' },
  AJUSTE_NEG: { label: 'Ajuste de Inventario (-)', type: 'OUT' },
  TRASLADO_ENTRADA: { label: 'Traslado entre Bodegas (Entrada)', type: 'IN' },
  TRASLADO_SALIDA: { label: 'Traslado entre Bodegas (Salida)', type: 'OUT' },
  PRODUCCION_ENTRADA: { label: 'Entrada de Producto Terminado', type: 'IN' },
  CONSUMO_PRODUCCION: { label: 'Consumo de Materia Prima', type: 'OUT' },
  MERMA: { label: 'Baja por Merma Técnica', type: 'OUT' },
  DANO: { label: 'Baja por Daño / Vencimiento', type: 'OUT' }
};

/** Almacenes que debe incluir una transacción que use applyMovement */
export const KARDEX_TX_STORES = [STORES.PRODUCTS, STORES.KARDEX, STORES.WAREHOUSES, STORES.AUDIT_LOGS];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const round3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000;
const today = () => new Date().toISOString().split('T')[0];

/**
 * LOTES Y VENCIMIENTOS
 * - `product.lotes` = [{ codigo, cantidad, fecha, vence }]. La suma nunca supera el stock;
 *   la diferencia es existencia "sin lote" (inventario anterior a esta función o compras sin lote).
 * - Entradas con `lote` (producción) crean o suman a ese lote; con `lotes` (anulación, traslado)
 *   devuelven exactamente lo que salió.
 * - Salidas: primero lo "sin lote" (es lo más antiguo), luego lotes vigentes por fecha de vencimiento
 *   (FEFO) y por último los vencidos. Las bajas por daño/vencimiento toman primero los vencidos.
 * - Cada movimiento guarda `lotes: [{codigo, cantidad}]` para poder rastrear un lote hasta el cliente.
 */
export const LotService = {
  isExpired(l, ref = today()) { return !!(l && l.vence && l.vence < ref); },
  daysToExpire(l, ref = new Date()) {
    if (!l || !l.vence) return null;
    return Math.floor((new Date(l.vence + 'T00:00:00') - new Date(ref.toISOString().split('T')[0] + 'T00:00:00')) / 86400000);
  },
  lotted(product) { return round3((product.lotes || []).reduce((a, l) => a + Number(l.cantidad || 0), 0)); },
  unlotted(product) { return Math.max(0, round3(Number(product.stock || 0) - this.lotted(product))); },

  addLot(product, { codigo, cantidad, fecha, vence }) {
    if (!codigo || !(cantidad > 0)) return;
    product.lotes = product.lotes || [];
    const ex = product.lotes.find(l => l.codigo === codigo);
    if (ex) {
      ex.cantidad = round3(Number(ex.cantidad || 0) + cantidad);
      if (vence && !ex.vence) ex.vence = vence;
    } else {
      product.lotes.push({ codigo, cantidad: round3(cantidad), fecha: fecha || today(), vence: vence || null });
    }
  },

  /** Descuenta `qty` (ya validada contra el stock previo) y devuelve la asignación por lote. */
  consume(product, qty, { expiredFirst = false } = {}) {
    const lots = product.lotes || [];
    const prevStock = Number(product.stock || 0);
    const alloc = [];
    let rest = qty;
    const sinLote = Math.max(0, round3(prevStock - this.lotted(product)));
    if (sinLote > 0 && rest > 0 && !expiredFirst) {
      const take = Math.min(sinLote, rest); rest = round3(rest - take);
    }
    const ref = today();
    const key = (l) => [this.isExpired(l, ref) === expiredFirst ? 0 : 1, l.vence || '9999-12-31', l.fecha || ''].join('|');
    for (const l of [...lots].sort((a, b) => key(a).localeCompare(key(b)))) {
      if (rest <= 0) break;
      const take = Math.min(Number(l.cantidad || 0), rest);
      if (take <= 0) continue;
      l.cantidad = round3(Number(l.cantidad) - take);
      rest = round3(rest - take);
      alloc.push({ codigo: l.codigo, cantidad: round3(take), vence: l.vence || null });
    }
    if (rest > 0 && expiredFirst && sinLote > 0) rest = round3(rest - Math.min(sinLote, rest));
    product.lotes = lots.filter(l => Number(l.cantidad) > 0);
    return alloc;
  }
};

export const KardexService = {
  /**
   * Aplica un movimiento dentro de una transacción abierta.
   * @returns {Promise<Object>} movimiento guardado (incluye costoUnitario aplicado)
   */
  async applyMovement(tx, {
    tenantId,
    productoId,
    bodegaId,
    documentoTipo,
    documentoNumero,
    cantidad,
    costoUnitario,
    observacion,
    permitirNegativo = false,
    lote = null,          // entrada: código de lote nuevo (producción)
    vence = null,         // entrada: fecha de vencimiento AAAA-MM-DD
    lotes = null          // entrada: devolver lotes exactos [{codigo, cantidad, vence}]
  }) {
    const def = MOVEMENT_TYPES[documentoTipo];
    if (!def) throw new Error(`Tipo de movimiento desconocido: ${documentoTipo}`);

    const qty = Number(cantidad);
    if (!Number.isFinite(qty) || qty <= 0) throw new Error('La cantidad del movimiento debe ser mayor a cero.');

    const product = await tx.get(STORES.PRODUCTS, productoId);
    if (!product) throw new Error(`Producto con ID ${productoId} no encontrado.`);

    const warehouse = bodegaId ? await tx.get(STORES.WAREHOUSES, bodegaId) : null;
    const isEntry = def.type === 'IN';

    const prevStock = Number(product.stock || 0);
    const prevAvg = Number(product.costoPromedio || 0);

    if (!isEntry && qty > prevStock + 1e-9 && !permitirNegativo) {
      throw new Error(`Stock insuficiente de "${product.nombre}": disponible ${prevStock}, requerido ${qty}.`);
    }

    // Salidas al costo promedio (excepto devolución a proveedor, que sale al costo de la compra si se indica)
    let unitCost;
    if (isEntry) {
      unitCost = round2(costoUnitario !== undefined && costoUnitario !== null ? costoUnitario : prevAvg);
    } else {
      unitCost = documentoTipo === 'DEVOLUCION_COMPRA' && costoUnitario ? round2(costoUnitario) : prevAvg;
    }

    const newStock = round2(isEntry ? prevStock + qty : prevStock - qty);

    let newAvg = prevAvg;
    if (isEntry && newStock > 0) {
      const prevValue = Math.max(0, prevStock) * prevAvg;
      newAvg = round2((prevValue + qty * unitCost) / newStock);
    }

    // Lotes
    let lotesMov = [];
    if (isEntry) {
      if (Array.isArray(lotes) && lotes.length) {
        lotes.forEach(l => LotService.addLot(product, { codigo: l.codigo, cantidad: Number(l.cantidad), vence: l.vence }));
        lotesMov = lotes.map(l => ({ codigo: l.codigo, cantidad: Number(l.cantidad), vence: l.vence || null }));
      } else if (lote) {
        LotService.addLot(product, { codigo: lote, cantidad: qty, vence });
        lotesMov = [{ codigo: lote, cantidad: qty, vence: vence || null }];
      }
    } else if ((product.lotes || []).length) {
      lotesMov = LotService.consume(product, qty, { expiredFirst: documentoTipo === 'DANO' });
    }

    product.stock = newStock;
    product.costoPromedio = newAvg;
    if (isEntry && unitCost > 0 && (documentoTipo === 'COMPRA' || documentoTipo === 'PRODUCCION_ENTRADA')) {
      product.ultimoCosto = unitCost;
    }
    await tx.put(STORES.PRODUCTS, product);

    const movement = await tx.put(STORES.KARDEX, {
      tenantId,
      fecha: new Date().toISOString(),
      productoId,
      productoNombre: product.nombre,
      sku: product.sku,
      bodegaId: bodegaId || product.bodegaId || null,
      bodegaNombre: warehouse ? warehouse.nombre : 'Bodega Principal',
      documentoTipo,
      documentoNumero: documentoNumero || '-',
      cantidadEntrada: isEntry ? qty : 0,
      cantidadSalida: isEntry ? 0 : qty,
      saldoCantidad: newStock,
      costoUnitario: unitCost,
      costoTotal: round2(qty * unitCost),
      costoPromedioResultante: newAvg,
      lotes: lotesMov,
      usuarioId: Session.userId(),
      usuarioNombre: Session.userName(),
      observacion: observacion || ''
    });

    await AuditService.logTx(tx, {
      tenantId,
      modulo: 'Inventario',
      accion: isEntry ? 'ENTRADA' : 'SALIDA',
      registroId: product.sku,
      campoModificado: `Movimiento: ${documentoTipo} (${documentoNumero || '-'})`,
      valorAnterior: `${prevStock} ${product.unidadMedida || ''}`.trim(),
      valorNuevo: `${newStock} ${product.unidadMedida || ''}`.trim()
    });

    return movement;
  },

  /** Registra un movimiento aislado en su propia transacción */
  async registerMovement(params) {
    return DB.runTransaction(KARDEX_TX_STORES, (tx) => this.applyMovement(tx, params));
  },

  async getMovements(tenantId, filters = {}) {
    let list = await DB.getAll(STORES.KARDEX, tenantId);
    if (filters.productoId) list = list.filter(m => m.productoId === filters.productoId);
    if (filters.bodegaId) list = list.filter(m => m.bodegaId === filters.bodegaId);
    if (filters.documentoTipo) list = list.filter(m => m.documentoTipo === filters.documentoTipo);
    return list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }
};
