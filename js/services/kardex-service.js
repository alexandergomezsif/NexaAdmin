/**
 * Nexa ERP - Servicio de Inventario y Kardex Ponderado Multibodega
 * Registra entradas, salidas, traslados, ajustes y actualiza costo promedio
 */

import { DB, STORES } from './db-service.js';
import { AuditService } from './audit-service.js';

export const MOVEMENT_TYPES = {
  COMPRA: { label: 'Compra de Mercancía/Insumos', type: 'IN' },
  VENTA: { label: 'Venta Facturada / POS', type: 'OUT' },
  DEVOLUCION_VENTA: { label: 'Devolución en Venta', type: 'IN' },
  DEVOLUCION_COMPRA: { label: 'Devolución a Proveedor', type: 'OUT' },
  AJUSTE_POS: { label: 'Ajuste de Inventario (+)', type: 'IN' },
  AJUSTE_NEG: { label: 'Ajuste de Inventario (-)', type: 'OUT' },
  TRASLADO_ENTRADA: { label: 'Traslado entre Bodegas (Entrada)', type: 'IN' },
  TRASLADO_SALIDA: { label: 'Traslado entre Bodegas (Salida)', type: 'OUT' },
  PRODUCCION_ENTRADA: { label: 'Entrada de Producto Terminado', type: 'IN' },
  CONSUMO_PRODUCCION: { label: 'Consumo de Materia Prima', type: 'OUT' },
  MERMA: { label: 'Baja por Merma Técnica', type: 'OUT' },
  DANO: { label: 'Baja por Daño / Vencimiento', type: 'OUT' },
  INVENTARIO_FISICO: { label: 'Ajuste Conteo Físico', type: 'AUDIT' }
};

export const KardexService = {
  /**
   * Registra un movimiento en Kardex y actualiza las existencias del producto
   */
  async registerMovement({
    tenantId,
    productoId,
    bodegaId,
    documentoTipo,
    documentoNumero,
    cantidad,
    costoUnitario,
    usuarioId,
    observacion
  }) {
    const product = await DB.getById(STORES.PRODUCTS, productoId);
    if (!product) throw new Error(`Producto con ID ${productoId} no encontrado.`);

    const warehouse = bodegaId ? await DB.getById(STORES.WAREHOUSES, bodegaId) : null;
    const warehouseName = warehouse ? warehouse.nombre : 'Bodega Principal';

    const isEntry = MOVEMENT_TYPES[documentoTipo]?.type === 'IN';
    const isExit = MOVEMENT_TYPES[documentoTipo]?.type === 'OUT';

    const cantEntrada = isEntry ? Number(cantidad) : 0;
    const cantSalida = isExit ? Number(cantidad) : 0;
    const unitCost = Number(costoUnitario || product.costoPromedio || 0);

    const prevStock = Number(product.stock || 0);
    const newStock = isEntry ? prevStock + cantEntrada : prevStock - cantSalida;

    // Cálculo de costo promedio ponderado si es entrada
    let newAvgCost = Number(product.costoPromedio || 0);
    if (isEntry && newStock > 0 && cantEntrada > 0) {
      const prevTotalCost = prevStock * newAvgCost;
      const entryTotalCost = cantEntrada * unitCost;
      newAvgCost = Math.round((prevTotalCost + entryTotalCost) / newStock);
    }

    // Actualizar producto
    product.stock = Math.max(0, newStock);
    product.costoPromedio = newAvgCost;
    if (isEntry && unitCost > 0) {
      product.ultimoCosto = unitCost;
    }
    await DB.update(STORES.PRODUCTS, product);

    // Registrar en Kardex
    const movement = {
      tenantId,
      fecha: new Date().toISOString(),
      productoId,
      productoNombre: product.nombre,
      sku: product.sku,
      bodegaId: bodegaId || 'wh_1',
      bodegaNombre: warehouseName,
      documentoTipo,
      documentoNumero: documentoNumero || '-',
      cantidadEntrada: cantEntrada,
      cantidadSalida: cantSalida,
      saldoCantidad: product.stock,
      costoUnitario: unitCost,
      costoTotal: Math.round(Number(cantidad) * unitCost),
      usuarioId: usuarioId || localStorage.getItem('nexa_active_user') || 'usr_admin',
      usuarioNombre: 'Usuario Sistema',
      observacion: observacion || ''
    };

    const savedMovement = await DB.add(STORES.KARDEX, movement);

    await AuditService.log({
      modulo: 'Inventario',
      accion: isEntry ? 'ENTRADA' : 'SALIDA',
      registroId: product.sku,
      campoModificado: `Movimiento: ${documentoTipo}`,
      valorAnterior: `${prevStock} ${product.unidadMedida}`,
      valorNuevo: `${product.stock} ${product.unidadMedida}`
    });

    return savedMovement;
  },

  /**
   * Obtiene los movimientos de Kardex con filtros opcionales
   */
  async getMovements(tenantId, filters = {}) {
    let list = await DB.getAll(STORES.KARDEX, tenantId);
    if (filters.productoId) {
      list = list.filter(m => m.productoId === filters.productoId);
    }
    if (filters.bodegaId) {
      list = list.filter(m => m.bodegaId === filters.bodegaId);
    }
    if (filters.documentoTipo) {
      list = list.filter(m => m.documentoTipo === filters.documentoTipo);
    }
    return list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }
};
