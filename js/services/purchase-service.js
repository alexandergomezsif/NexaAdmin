/**
 * Nexa ERP - Servicio de Compras
 * Compra + entradas de Kardex + cuenta por pagar o egreso de caja en UNA transacción.
 */

import { DB, STORES } from './db-service.js';
import { KardexService, KARDEX_TX_STORES } from './kardex-service.js';
import { CashService } from './cash-service.js';
import { AuditService } from './audit-service.js';
import { Session } from '../utils/session.js';
import { EventBus } from '../utils/event-bus.js';

export const PURCHASE_TERMS = {
  CONTADO_BANCO: 'Contado (transferencia / banco)',
  CONTADO_CAJA: 'Contado (efectivo de caja)',
  CREDITO: 'Crédito (genera cuenta por pagar)'
};

export const PurchaseService = {
  async registerPurchase({ tenantId, proveedorId, facturaProveedor, bodegaId, condicion, items }) {
    if (!proveedorId) throw new Error('Seleccione un proveedor.');
    if (!items || items.length === 0) throw new Error('Agregue al menos un ítem a la compra.');
    for (const it of items) {
      if (!(Number(it.cantidad) > 0)) throw new Error(`Cantidad inválida para ${it.nombre}.`);
      if (!(Number(it.costoUnitario) >= 0)) throw new Error(`Costo inválido para ${it.nombre}.`);
    }
    if (!PURCHASE_TERMS[condicion]) throw new Error('Seleccione la forma de pago.');
    const total = Math.round(items.reduce((a, i) => a + Number(i.cantidad) * Number(i.costoUnitario), 0) * 100) / 100;

    const stores = [...new Set([...KARDEX_TX_STORES, STORES.PURCHASES, STORES.SUPPLIERS, STORES.PAYABLES_CXP,
      STORES.CASH_SHIFTS, STORES.CASH_MOVEMENTS, STORES.SYSTEM_PARAMS])];

    const res = await DB.runTransaction(stores, async (tx) => {
      const supp = await tx.get(STORES.SUPPLIERS, proveedorId);
      if (!supp) throw new Error('Proveedor no encontrado.');
      const fac = String(facturaProveedor || '').trim();
      if (fac) {
        const prev = (await tx.getAll(STORES.PURCHASES, tenantId)).find(p => p.proveedorId === proveedorId && String(p.facturaProveedor || p.consecutivo).trim().toLowerCase() === fac.toLowerCase() && p.estado !== 'ANULADA');
        if (prev) throw new Error(`La factura ${fac} de este proveedor ya fue registrada (${prev.consecutivo}).`);
      }

      let turno = null;
      if (condicion === 'CONTADO_CAJA') {
        turno = (await tx.getAll(STORES.CASH_SHIFTS, tenantId)).find(s => s.estado === 'ABIERTA');
        if (!turno) throw new Error('Para pagar en efectivo de caja debe haber un turno abierto.');
      }

      const n = await tx.nextSequence(tenantId, 'COMPRA');
      const consecutivo = `CP-${String(n).padStart(6, '0')}`;
      const nombreProv = supp.razonSocial || supp.nombre || 'Proveedor';

      const compra = await tx.put(STORES.PURCHASES, {
        tenantId,
        consecutivo,
        facturaProveedor: fac || null,
        proveedorId,
        proveedorNombre: nombreProv,
        fecha: new Date().toISOString(),
        total,
        condicionPago: condicion === 'CREDITO' ? 'Crédito' : 'Contado',
        condicionDetalle: PURCHASE_TERMS[condicion],
        estado: 'RECIBIDA',
        bodegaId: bodegaId || null,
        items: items.map(i => ({ productoId: i.productoId, nombre: i.nombre, cantidad: Number(i.cantidad), costoUnitario: Number(i.costoUnitario) })),
        registradoPorId: Session.userId(),
        registradoPorNombre: Session.userName()
      });

      for (const it of compra.items) {
        await KardexService.applyMovement(tx, {
          tenantId,
          productoId: it.productoId,
          bodegaId,
          documentoTipo: 'COMPRA',
          documentoNumero: consecutivo,
          cantidad: it.cantidad,
          costoUnitario: it.costoUnitario,
          observacion: `Compra ${consecutivo}${fac ? ' (fac. ' + fac + ')' : ''} a ${nombreProv}`
        });
      }

      if (condicion === 'CREDITO') {
        const cxp = await tx.put(STORES.PAYABLES_CXP, {
          tenantId,
          compraId: compra.id,
          documento: fac || consecutivo,
          proveedorId,
          proveedorNombre: nombreProv,
          tipoDocumento: 'FACTURA_COMPRA',
          fechaEmision: new Date().toISOString().split('T')[0],
          fechaVencimiento: new Date(Date.now() + (Number(supp.diasCredito) || 30) * 86400000).toISOString().split('T')[0],
          valorTotal: total,
          abonos: 0,
          saldo: total,
          diasMora: 0,
          estado: 'AL_DIA',
          historialPagos: []
        });
        compra.cxpId = cxp.id;
      } else if (turno) {
        const mov = await CashService.applyMovementTx(tx, {
          tenantId, turnoId: turno.id, tipo: 'EGRESO', monto: total,
          concepto: `Compra ${consecutivo} a ${nombreProv}`, tercero: nombreProv, refTipo: 'COMPRA', refId: compra.id
        });
        compra.movimientoCajaId = mov.id;
      }
      await tx.put(STORES.PURCHASES, compra);
      await AuditService.logTx(tx, {
        tenantId, modulo: 'Compras', accion: 'CREAR', registroId: consecutivo,
        campoModificado: PURCHASE_TERMS[condicion], valorNuevo: `$ ${total} - ${nombreProv}`
      });
      return compra;
    });
    if (condicion === 'CONTADO_CAJA') EventBus.emit('cash:shiftChanged');
    return res;
  }
};
