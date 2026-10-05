/**
 * Nexa ERP - Servicio de Ventas (núcleo transaccional del POS)
 *
 * Una venta se graba en UNA transacción: documento + Kardex + caja + cartera +
 * comisión freelance + despacho + adjunto + auditoría. Si algo falla, no queda nada a medias.
 *
 * Tipos de documento:
 *  - VENTA          Documento interno de venta de contado (no es factura electrónica)
 *  - VENTA_CREDITO  Venta a crédito: genera cuenta por cobrar
 *  - COTIZACION     No afecta inventario, caja, cartera ni despachos
 */

import { DB, STORES } from './db-service.js';
import { KardexService } from './kardex-service.js';
import { CashService } from './cash-service.js';
import { AuditService } from './audit-service.js';
import { TaxService } from './tax-service.js';
import { PricingService } from './pricing-service.js';
import { Session } from '../utils/session.js';
import { EventBus } from '../utils/event-bus.js';

export const DOC_TYPES = {
  VENTA: { label: 'Venta de contado (documento interno)', short: 'Venta', seq: 'VENTA' },
  VENTA_CREDITO: { label: 'Venta a crédito (cuenta por cobrar)', short: 'Venta a crédito', seq: 'VENTA' },
  COTIZACION: { label: 'Cotización (no afecta inventario)', short: 'Cotización', seq: 'COTIZACION' }
};

/** Etiquetas para documentos antiguos */
export const LEGACY_DOC_LABELS = {
  FACTURA_ELECTRONICA: 'Venta (registrada antes como "Factura Electrónica")',
  DOCUMENTO_EQUIVALENTE_POS: 'Venta (registrada antes como "Documento Equivalente POS")',
  VENTA_CREDITO: 'Venta a crédito',
  COTIZACION: 'Cotización'
};

export const PAYMENT_METHODS = ['Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Tarjeta', 'Crédito'];

export const SALE_TX_STORES = [
  STORES.SALES, STORES.PRODUCTS, STORES.KARDEX, STORES.WAREHOUSES, STORES.AUDIT_LOGS,
  STORES.CASH_SHIFTS, STORES.CASH_MOVEMENTS, STORES.CUSTOMERS, STORES.RECEIVABLES_CXC,
  STORES.PAYABLES_CXP, STORES.SUPPLIERS, STORES.ORDERS_SHIPPING, STORES.SYSTEM_PARAMS,
  STORES.ATTACHMENTS, STORES.TENANTS, STORES.PRICE_LISTS
];

const IVA_DEFAULT = 19;

export function formatConsecutivo(prefix, n) {
  return `${prefix}-${String(n).padStart(6, '0')}`;
}

export function salePrefix(tenant, docType) {
  if (docType === 'COTIZACION') return (tenant && tenant.prefijoCotizacion) || 'COT';
  return (tenant && tenant.prefijoVenta) || 'V';
}

/** Valor unitario sin IVA (para comparar precios de listas con distinta configuración de IVA) */
function netUnit(price, includesIva, ivaPct = IVA_DEFAULT) {
  return includesIva ? Number(price) / (1 + ivaPct / 100) : Number(price);
}

export const SalesService = {
  /**
   * Comisión freelance = Σ max(0, precioVendido − precioBase) × cantidad, comparando SIN IVA.
   */
  computeCommission(items, products, priceLists, freelancer, saleListIncludesIva) {
    if (!freelancer) return { comision: 0, base: 0, baseListId: null, detalle: [] };
    const baseListId = PricingService.freelanceBaseListId(priceLists, freelancer);
    const baseIncl = PricingService.listIncludesIva(priceLists, baseListId);
    let comision = 0;
    let base = 0;
    const detalle = [];
    items.forEach(it => {
      const prod = products.find(p => p.id === it.productoId);
      const pBase = PricingService.priceFor(prod, baseListId);
      const vendidoNeto = netUnit(it.precioUnitario, it.precioIncluyeIva ?? saleListIncludesIva, it.ivaPct ?? IVA_DEFAULT);
      const baseNeto = netUnit(pBase, baseIncl, it.ivaPct ?? IVA_DEFAULT);
      const c = pBase > 0 ? Math.max(0, (vendidoNeto - baseNeto) * Number(it.cantidad)) : 0;
      comision += c;
      base += baseNeto * Number(it.cantidad);
      detalle.push({ productoId: it.productoId, nombre: it.nombre, comision: Math.round(c), sinPrecioBase: pBase <= 0 });
    });
    return { comision: Math.round(comision), base: Math.round(base), baseListId, detalle };
  },

  /**
   * Crea una venta o cotización.
   * @param {Object} p
   * @param {string} p.tenantId
   * @param {string} p.tipoDoc - VENTA | VENTA_CREDITO | COTIZACION
   * @param {Object} p.cliente - registro de cliente (se relee dentro de la transacción)
   * @param {Array}  p.items - { productoId, cantidad, precioUnitario }
   * @param {string} p.listaPreciosId
   * @param {string} p.metodoPago
   * @param {number} p.pagoRecibido
   * @param {Object|null} p.freelancer
   * @param {boolean} p.crearDespacho
   * @param {string|null} p.comprobanteDataUrl
   */
  async createSale(p) {
    const tipoDoc = DOC_TYPES[p.tipoDoc] ? p.tipoDoc : 'VENTA';
    const esCotizacion = tipoDoc === 'COTIZACION';
    const esCredito = tipoDoc === 'VENTA_CREDITO' || p.metodoPago === 'Crédito';
    if (!p.items || p.items.length === 0) throw new Error('El carrito de venta está vacío.');
    if (!esCotizacion && !esCredito && !PAYMENT_METHODS.includes(p.metodoPago)) {
      throw new Error('Seleccione un método de pago válido.');
    }

    const result = await DB.runTransaction(SALE_TX_STORES, async (tx) => {
      const tenant = await tx.get(STORES.TENANTS, p.tenantId);
      const priceLists = await tx.getAll(STORES.PRICE_LISTS, p.tenantId);
      const listIncl = PricingService.listIncludesIva(priceLists, p.listaPreciosId);

      // 1. Releer productos y validar existencias con datos frescos
      const products = [];
      for (const it of p.items) {
        const prod = await tx.get(STORES.PRODUCTS, it.productoId);
        if (!prod) throw new Error(`Producto no encontrado: ${it.nombre || it.productoId}`);
        const qty = Number(it.cantidad);
        if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Cantidad inválida para ${prod.nombre}.`);
        if (!(Number(it.precioUnitario) > 0)) throw new Error(`El precio de ${prod.nombre} debe ser mayor a cero.`);
        products.push(prod);
      }
      if (!esCotizacion) {
        const requerido = {};
        p.items.forEach(it => { requerido[it.productoId] = (requerido[it.productoId] || 0) + Number(it.cantidad); });
        for (const prod of products) {
          if (requerido[prod.id] > Number(prod.stock || 0)) {
            throw new Error(`Stock insuficiente de "${prod.nombre}": disponible ${prod.stock}, solicitado ${requerido[prod.id]}.`);
          }
        }
      }

      // 2. Cliente fresco y validación de crédito
      const cliente = p.cliente ? await tx.get(STORES.CUSTOMERS, p.cliente.id) : null;
      const aplicaIva = !cliente || cliente.aplicaIva !== false;
      const lineItems = p.items.map((it, i) => ({
        productoId: it.productoId,
        sku: products[i].sku,
        nombre: products[i].nombre,
        cantidad: Number(it.cantidad),
        precioUnitario: Math.round(Number(it.precioUnitario)),
        precioIncluyeIva: listIncl,
        ivaPct: products[i].ivaPct !== undefined ? Number(products[i].ivaPct) : IVA_DEFAULT
      }));
      const totals = TaxService.calculateTotals(lineItems, 0, { aplicaIva });
      lineItems.forEach((li, i) => Object.assign(li, {
        base: totals.lineas[i].base, iva: totals.lineas[i].iva, total: totals.lineas[i].total
      }));

      if (esCredito && !esCotizacion) {
        if (!cliente) throw new Error('Una venta a crédito requiere un cliente registrado.');
        const cupo = Number(cliente.cupoCredito || 0);
        if (cupo <= 0) throw new Error(`El cliente ${cliente.nombre} no tiene cupo de crédito asignado.`);
        const nuevoSaldo = Number(cliente.saldoPendiente || 0) + totals.total;
        if (nuevoSaldo > cupo) {
          throw new Error(`Cupo de crédito excedido: cupo ${cupo}, saldo actual ${cliente.saldoPendiente || 0}, esta venta ${totals.total}.`);
        }
      }

      // 3. Caja: obligatoria para ventas de contado
      let turno = null;
      if (!esCotizacion && !esCredito) {
        const shifts = await tx.getAll(STORES.CASH_SHIFTS, p.tenantId);
        turno = shifts.find(s => s.estado === 'ABIERTA') || null;
        if (!turno) throw new Error('No hay turno de caja abierto. Abra la caja antes de registrar ventas de contado.');
        if (p.metodoPago === 'Efectivo' && Number(p.pagoRecibido || totals.total) < totals.total) {
          throw new Error('El pago recibido en efectivo es menor que el total de la venta.');
        }
      }

      // 4. Consecutivo secuencial
      const seqKey = DOC_TYPES[tipoDoc].seq;
      const n = await tx.nextSequence(p.tenantId, seqKey);
      const consecutivo = formatConsecutivo(salePrefix(tenant, tipoDoc), n);

      // 5. Comisión freelance
      const com = esCotizacion ? { comision: 0, base: 0 } :
        this.computeCommission(lineItems, products, priceLists, p.freelancer, listIncl);

      const pagoRecibido = esCredito || esCotizacion ? 0 : Number(p.pagoRecibido || totals.total);
      const sale = {
        tenantId: p.tenantId,
        consecutivo,
        numero: n,
        tipoDoc,
        facturaElectronica: false,
        aplicaIva,
        clienteId: cliente ? cliente.id : null,
        clienteNombre: cliente ? cliente.nombre : 'Cliente Mostrador',
        clienteNit: cliente ? cliente.nitCc : '222222222222',
        vendedorId: Session.userId(),
        vendedorNombre: Session.userName(),
        esVentaFreelance: !!p.freelancer && !esCotizacion,
        freelancerId: p.freelancer ? p.freelancer.id : null,
        freelancerNombre: p.freelancer ? p.freelancer.nombre : null,
        listaPreciosId: p.listaPreciosId,
        preciosIncluyenIva: listIncl,
        fecha: new Date().toISOString(),
        estado: esCotizacion ? 'COTIZACION' : (esCredito ? 'CREDITO_PENDIENTE' : 'PAGADA'),
        subtotal: totals.baseGravable,
        descuentos: totals.totalDescuentos,
        impuestos: totals.totalIva,
        total: totals.total,
        metodoPago: esCotizacion ? '-' : (esCredito ? 'Crédito' : p.metodoPago),
        pagoRecibido,
        cambio: Math.max(0, pagoRecibido - totals.total),
        saldoCredito: esCredito && !esCotizacion ? totals.total : 0,
        turnoId: turno ? turno.id : null,
        items: lineItems,
        costoTotal: 0,
        comprobanteId: null,
        comisionFreelance: com.comision,
        precioBaseFreelance: com.base
      };
      await tx.put(STORES.SALES, sale);

      if (esCotizacion) {
        await AuditService.logTx(tx, {
          tenantId: p.tenantId, modulo: 'Ventas POS', accion: 'CREAR', registroId: consecutivo,
          campoModificado: 'Cotización emitida', valorNuevo: `$ ${totals.total}`
        });
        return sale;
      }

      // 6. Inventario (al costo promedio)
      let costoTotal = 0;
      for (const li of sale.items) {
        const mov = await KardexService.applyMovement(tx, {
          tenantId: p.tenantId,
          productoId: li.productoId,
          bodegaId: null,
          documentoTipo: 'VENTA',
          documentoNumero: consecutivo,
          cantidad: li.cantidad,
          observacion: `Venta ${consecutivo} a ${sale.clienteNombre}`
        });
        li.costoUnitario = mov.costoUnitario;
        costoTotal += mov.costoTotal;
      }
      sale.costoTotal = Math.round(costoTotal);

      // 7. Caja o cartera
      if (esCredito) {
        cliente.saldoPendiente = Number(cliente.saldoPendiente || 0) + totals.total;
        const cxc = await tx.put(STORES.RECEIVABLES_CXC, {
          tenantId: p.tenantId,
          ventaId: sale.id,
          documento: consecutivo,
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          fechaEmision: new Date().toISOString().split('T')[0],
          fechaVencimiento: new Date(Date.now() + (Number(cliente.diasCredito) || 30) * 86400000).toISOString().split('T')[0],
          valorTotal: totals.total,
          abonos: 0,
          saldo: totals.total,
          diasMora: 0,
          estado: 'AL_DIA',
          historialPagos: []
        });
        sale.cxcId = cxc.id;
      } else {
        await CashService.applySaleTx(tx, turno.id, p.metodoPago, totals.total, 1);
      }

      if (cliente) {
        cliente.totalComprado = Number(cliente.totalComprado || 0) + totals.total;
        cliente.numeroCompras = Number(cliente.numeroCompras || 0) + 1;
        cliente.ultimaCompra = sale.fecha;
        await tx.put(STORES.CUSTOMERS, cliente);
      }

      // 8. Comisión freelance → cuenta por pagar
      if (p.freelancer && com.comision > 0) {
        const hoy = new Date();
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        const cxp = await tx.put(STORES.PAYABLES_CXP, {
          tenantId: p.tenantId,
          documento: `COM-${consecutivo}`,
          proveedorNombre: p.freelancer.nombre,
          proveedorId: p.freelancer.id,
          tipoDocumento: 'COMISION_FREELANCE',
          ventaId: sale.id,
          ventaConsecutivo: consecutivo,
          fechaEmision: hoy.toISOString().split('T')[0],
          fechaVencimiento: finMes.toISOString().split('T')[0],
          valorTotal: com.comision,
          saldo: com.comision,
          abonos: 0,
          estado: 'AL_DIA',
          historialPagos: []
        });
        sale.comisionCxpId = cxp.id;
        const fl = await tx.get(STORES.SUPPLIERS, p.freelancer.id);
        if (fl) {
          fl.comisionesTotalesGanadas = Number(fl.comisionesTotalesGanadas || 0) + com.comision;
          await tx.put(STORES.SUPPLIERS, fl);
        }
      }

      // 9. Despacho (solo si se solicita)
      if (p.crearDespacho) {
        const totalUnidades = sale.items.reduce((a, i) => a + Number(i.cantidad || 0), 0);
        const desp = await tx.put(STORES.ORDERS_SHIPPING, {
          tenantId: p.tenantId,
          ventaId: sale.id,
          documentoNumero: consecutivo,
          clienteId: cliente ? cliente.id : null,
          clienteNombre: sale.clienteNombre,
          nitCc: sale.clienteNit,
          telefono: cliente ? (cliente.telefono || cliente.whatsapp || '') : '',
          whatsapp: cliente ? (cliente.whatsapp || cliente.telefono || '') : '',
          email: cliente ? (cliente.email || '') : '',
          ciudad: cliente ? (cliente.ciudad || '') : '',
          departamento: cliente ? (cliente.departamento || '') : '',
          barrio: cliente ? (cliente.barrio || '') : '',
          direccion: cliente ? (cliente.direccion || '') : '',
          transportadora: (tenant && tenant.transportadoraDefecto) || '',
          numeroGuia: '',
          costoEnvio: 0,
          fechaDespacho: null,
          fechaEntregaEstimada: null,
          estadoCiclo: 'RECIBIDO',
          responsable: '',
          cajasTotal: Math.max(1, Math.ceil(totalUnidades / 12)),
          contenidoDescripcion: (tenant && tenant.descripcionContenidoEnvio) || 'Productos de mantenimiento y embellecimiento automotriz',
          observaciones: ''
        });
        sale.despachoId = desp.id;
      }

      // 10. Comprobante de pago (almacén aparte)
      if (p.comprobanteDataUrl) {
        const att = await tx.put(STORES.ATTACHMENTS, {
          tenantId: p.tenantId, refTipo: 'VENTA', refId: sale.id,
          descripcion: `Comprobante ${consecutivo}`, dataUrl: p.comprobanteDataUrl
        });
        sale.comprobanteId = att.id;
        sale.comprobanteFecha = new Date().toISOString();
      }

      await tx.put(STORES.SALES, sale);
      await AuditService.logTx(tx, {
        tenantId: p.tenantId, modulo: 'Ventas POS', accion: 'CREAR', registroId: consecutivo,
        campoModificado: DOC_TYPES[tipoDoc].short, valorNuevo: `$ ${totals.total} (${sale.metodoPago})`
      });
      return sale;
    });

    if (!esCotizacion) EventBus.emit('cash:shiftChanged');
    return result;
  },

  /**
   * Anula una venta: devuelve inventario al costo original, revierte caja/cartera/comisión,
   * anula el despacho. Bloquea si hay abonos o pagos de comisión ya realizados.
   */
  async annulSale(saleId, motivo) {
    if (!motivo || String(motivo).trim().length < 5) throw new Error('Indique el motivo de la anulación (mínimo 5 caracteres).');

    const res = await DB.runTransaction(SALE_TX_STORES, async (tx) => {
      const sale = await tx.get(STORES.SALES, saleId);
      if (!sale) throw new Error('Venta no encontrada.');
      if (sale.estado === 'ANULADA') throw new Error('La venta ya está anulada.');

      const esCotizacion = sale.tipoDoc === 'COTIZACION' || sale.estado === 'COTIZACION';
      let notaCaja = '';

      if (!esCotizacion) {
        // Validaciones de bloqueo antes de escribir
        const cxc = (await tx.getAll(STORES.RECEIVABLES_CXC, sale.tenantId)).find(c => c.ventaId === sale.id || c.documento === sale.consecutivo);
        if (cxc && Number(cxc.abonos || 0) > 0) {
          throw new Error('La venta tiene abonos registrados en cartera. Reverse primero los abonos con el cliente.');
        }
        const comCxp = sale.comisionCxpId ? await tx.get(STORES.PAYABLES_CXP, sale.comisionCxpId) : null;
        if (comCxp && Number(comCxp.abonos || 0) > 0) {
          throw new Error('La comisión de esta venta ya fue pagada (total o parcialmente) al vendedor freelance.');
        }

        // Inventario
        for (const li of (sale.items || [])) {
          const prod = await tx.get(STORES.PRODUCTS, li.productoId);
          if (!prod) continue;
          await KardexService.applyMovement(tx, {
            tenantId: sale.tenantId,
            productoId: li.productoId,
            documentoTipo: 'DEVOLUCION_VENTA',
            documentoNumero: sale.consecutivo,
            cantidad: li.cantidad,
            costoUnitario: li.costoUnitario !== undefined ? li.costoUnitario : prod.costoPromedio,
            observacion: `Anulación ${sale.consecutivo}: ${motivo}`
          });
        }

        // Caja / cartera
        const esCredito = sale.estado === 'CREDITO_PENDIENTE' || sale.metodoPago === 'Crédito';
        if (esCredito) {
          if (cxc) {
            cxc.saldo = 0;
            cxc.estado = 'ANULADA';
            await tx.put(STORES.RECEIVABLES_CXC, cxc);
          }
        } else {
          const turnoOrig = sale.turnoId ? await tx.get(STORES.CASH_SHIFTS, sale.turnoId) : null;
          if (turnoOrig && turnoOrig.estado === 'ABIERTA') {
            await CashService.applySaleTx(tx, turnoOrig.id, sale.metodoPago, sale.total, -1);
            notaCaja = 'Revertida en el turno de caja original.';
          } else if (sale.metodoPago === 'Efectivo') {
            const shifts = await tx.getAll(STORES.CASH_SHIFTS, sale.tenantId);
            const abierto = shifts.find(s => s.estado === 'ABIERTA');
            if (!abierto) throw new Error('Para devolver dinero en efectivo de un turno ya cerrado, abra un turno de caja.');
            await CashService.applyMovementTx(tx, {
              tenantId: sale.tenantId, turnoId: abierto.id, tipo: 'EGRESO', monto: sale.total,
              concepto: `Devolución por anulación ${sale.consecutivo}`, tercero: sale.clienteNombre,
              refTipo: 'ANULACION_VENTA', refId: sale.id
            });
            notaCaja = 'Devolución registrada como egreso en el turno actual.';
          } else {
            notaCaja = `El reembolso por ${sale.metodoPago} debe hacerse por fuera de la caja.`;
          }
        }

        // Cliente
        if (sale.clienteId) {
          const cli = await tx.get(STORES.CUSTOMERS, sale.clienteId);
          if (cli) {
            if (esCredito) cli.saldoPendiente = Math.max(0, Number(cli.saldoPendiente || 0) - Number(sale.total));
            cli.totalComprado = Math.max(0, Number(cli.totalComprado || 0) - Number(sale.total));
            cli.numeroCompras = Math.max(0, Number(cli.numeroCompras || 0) - 1);
            await tx.put(STORES.CUSTOMERS, cli);
          }
        }

        // Comisión
        if (comCxp) {
          comCxp.saldo = 0;
          comCxp.estado = 'ANULADA';
          await tx.put(STORES.PAYABLES_CXP, comCxp);
          const fl = await tx.get(STORES.SUPPLIERS, comCxp.proveedorId);
          if (fl) {
            fl.comisionesTotalesGanadas = Math.max(0, Number(fl.comisionesTotalesGanadas || 0) - Number(comCxp.valorTotal || 0));
            await tx.put(STORES.SUPPLIERS, fl);
          }
        }

        // Despacho
        const despachos = (await tx.getAll(STORES.ORDERS_SHIPPING, sale.tenantId)).filter(d => d.ventaId === sale.id);
        for (const d of despachos) {
          d.estadoCiclo = 'CANCELADO';
          await tx.put(STORES.ORDERS_SHIPPING, d);
        }
      }

      sale.estadoAnterior = sale.estado;
      sale.estado = 'ANULADA';
      sale.saldoCredito = 0;
      sale.anulacion = {
        fecha: new Date().toISOString(),
        motivo: String(motivo).trim(),
        usuarioId: Session.userId(),
        usuarioNombre: Session.userName(),
        notaCaja
      };
      await tx.put(STORES.SALES, sale);
      await AuditService.logTx(tx, {
        tenantId: sale.tenantId, modulo: 'Ventas POS', accion: 'ANULAR', registroId: sale.consecutivo,
        campoModificado: 'Estado', valorAnterior: sale.estadoAnterior, valorNuevo: `ANULADA — ${motivo}`
      });
      return sale;
    });

    EventBus.emit('cash:shiftChanged');
    return res;
  },

  /** Guarda o reemplaza el comprobante de una venta existente */
  async attachReceipt(saleId, dataUrl) {
    return DB.runTransaction([STORES.SALES, STORES.ATTACHMENTS, STORES.AUDIT_LOGS], async (tx) => {
      const sale = await tx.get(STORES.SALES, saleId);
      if (!sale) throw new Error('Venta no encontrada.');
      if (sale.comprobanteId) await tx.delete(STORES.ATTACHMENTS, sale.comprobanteId);
      const att = await tx.put(STORES.ATTACHMENTS, {
        tenantId: sale.tenantId, refTipo: 'VENTA', refId: sale.id,
        descripcion: `Comprobante ${sale.consecutivo}`, dataUrl
      });
      sale.comprobanteId = att.id;
      sale.comprobanteFecha = new Date().toISOString();
      delete sale.comprobantePagoUrl;
      await tx.put(STORES.SALES, sale);
      await AuditService.logTx(tx, {
        tenantId: sale.tenantId, modulo: 'Ventas POS', accion: 'MODIFICAR', registroId: sale.consecutivo,
        campoModificado: 'Comprobante de pago', valorNuevo: 'Adjuntado'
      });
      return sale;
    });
  },

  /** Devuelve el dataUrl del comprobante (compatible con ventas antiguas) */
  async getReceipt(sale) {
    if (!sale) return null;
    if (sale.comprobanteId) {
      const att = await DB.getById(STORES.ATTACHMENTS, sale.comprobanteId);
      return att ? att.dataUrl : null;
    }
    return sale.comprobantePagoUrl || null;
  },

  /** Ventas que cuentan como ingreso (excluye cotizaciones y anuladas) */
  isEffectiveSale(s) {
    return s && s.estado !== 'ANULADA' && s.estado !== 'COTIZACION' && s.tipoDoc !== 'COTIZACION';
  }
};
