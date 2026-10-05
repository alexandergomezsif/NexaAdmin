/**
 * Nexa ERP - Recaudos de cartera (CxC) y pagos a proveedores / comisiones (CxP)
 * Cada pago es atómico: documento + historial + caja (si es efectivo) + venta/proveedor + auditoría.
 */

import { DB, STORES } from './db-service.js';
import { CashService } from './cash-service.js';
import { AuditService } from './audit-service.js';
import { Session } from '../utils/session.js';
import { EventBus } from '../utils/event-bus.js';

export const RECEIPT_METHODS = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'Tarjeta', 'Cheque'];
export const PAYOUT_METHODS = ['Transferencia bancaria', 'Nequi / Daviplata', 'Efectivo de caja', 'Cheque'];
const CASH_PAYOUT = 'Efectivo de caja';

const TX = [STORES.RECEIVABLES_CXC, STORES.PAYABLES_CXP, STORES.CUSTOMERS, STORES.SALES, STORES.SUPPLIERS,
  STORES.CASH_SHIFTS, STORES.CASH_MOVEMENTS, STORES.SYSTEM_PARAMS, STORES.ATTACHMENTS, STORES.AUDIT_LOGS];

async function openShift(tx, tenantId) {
  const t = (await tx.getAll(STORES.CASH_SHIFTS, tenantId)).find(s => s.estado === 'ABIERTA');
  if (!t) throw new Error('Para operaciones en efectivo debe haber un turno de caja abierto.');
  return t;
}

function validAmount(monto, saldo) {
  const v = Math.round(Number(monto) * 100) / 100;
  if (!Number.isFinite(v) || v <= 0) throw new Error('El valor debe ser mayor a cero.');
  if (v > Number(saldo) + 0.009) throw new Error(`El valor supera el saldo pendiente (${saldo}).`);
  return v;
}

export const PaymentsService = {
  /** Abono a una cuenta por cobrar */
  async receivePayment({ tenantId, cxcId, monto, metodo, referencia, comprobanteDataUrl }) {
    if (!RECEIPT_METHODS.includes(metodo)) throw new Error('Seleccione un medio de pago válido.');
    const res = await DB.runTransaction(TX, async (tx) => {
      const cxc = await tx.get(STORES.RECEIVABLES_CXC, cxcId);
      if (!cxc) throw new Error('Cuenta por cobrar no encontrada.');
      if (cxc.estado === 'ANULADA') throw new Error('La cuenta por cobrar está anulada.');
      const valor = validAmount(monto, cxc.saldo);

      const n = await tx.nextSequence(tenantId, 'RECIBO_CAJA');
      const recibo = `RC-${String(n).padStart(6, '0')}`;

      let comprobanteId = null;
      if (comprobanteDataUrl) {
        const att = await tx.put(STORES.ATTACHMENTS, { tenantId, refTipo: 'ABONO_CXC', refId: cxc.id, descripcion: `${recibo} ${cxc.documento}`, dataUrl: comprobanteDataUrl });
        comprobanteId = att.id;
      }

      let movId = null;
      if (metodo === 'Efectivo') {
        const turno = await openShift(tx, tenantId);
        const mov = await CashService.applyMovementTx(tx, {
          tenantId, turnoId: turno.id, tipo: 'INGRESO', monto: valor,
          concepto: `${recibo} abono ${cxc.documento}`, tercero: cxc.clienteNombre, refTipo: 'ABONO_CXC', refId: cxc.id
        });
        movId = mov.id;
      }

      cxc.abonos = Number(cxc.abonos || 0) + valor;
      cxc.saldo = Math.max(0, Math.round((Number(cxc.saldo) - valor) * 100) / 100);
      if (cxc.saldo === 0) cxc.estado = 'PAGADA';
      cxc.historialPagos = cxc.historialPagos || [];
      cxc.historialPagos.push({
        recibo, fecha: new Date().toISOString(), monto: valor, metodo, observacion: referencia || '',
        comprobanteId, movimientoCajaId: movId, usuarioId: Session.userId(), usuarioNombre: Session.userName()
      });
      await tx.put(STORES.RECEIVABLES_CXC, cxc);

      const cli = cxc.clienteId ? await tx.get(STORES.CUSTOMERS, cxc.clienteId) : null;
      if (cli) {
        cli.saldoPendiente = Math.max(0, Number(cli.saldoPendiente || 0) - valor);
        await tx.put(STORES.CUSTOMERS, cli);
      }
      const sale = cxc.ventaId ? await tx.get(STORES.SALES, cxc.ventaId) : null;
      if (sale) {
        sale.saldoCredito = cxc.saldo;
        if (cxc.saldo === 0) { sale.estado = 'PAGADA'; sale.fechaPagoTotal = new Date().toISOString(); }
        await tx.put(STORES.SALES, sale);
      }
      await AuditService.logTx(tx, {
        tenantId, modulo: 'Cartera', accion: 'ABONO', registroId: cxc.documento,
        campoModificado: `${recibo} (${metodo})`, valorAnterior: `Saldo ${cxc.saldo + valor}`, valorNuevo: `Saldo ${cxc.saldo}`
      });
      return { cxc, recibo };
    });
    if (metodo === 'Efectivo') EventBus.emit('cash:shiftChanged');
    return res;
  },

  /** Pago (total o parcial) de una cuenta por pagar */
  async payPayable({ tenantId, cxpId, monto, metodo, referencia }) {
    return (await this.payPayables({ tenantId, pagos: [{ cxpId, monto }], metodo, referencia }))[0];
  },

  /** Paga varias cuentas por pagar en una sola transacción (liquidación de comisiones) */
  async payPayables({ tenantId, pagos, metodo, referencia }) {
    if (!PAYOUT_METHODS.includes(metodo)) throw new Error('Seleccione un medio de pago válido.');
    if (!pagos || pagos.length === 0) throw new Error('No hay cuentas por pagar seleccionadas.');
    const res = await DB.runTransaction(TX, async (tx) => {
      const out = [];
      const turno = metodo === CASH_PAYOUT ? await openShift(tx, tenantId) : null;
      for (const p of pagos) {
        const cxp = await tx.get(STORES.PAYABLES_CXP, p.cxpId);
        if (!cxp) throw new Error('Cuenta por pagar no encontrada.');
        if (cxp.estado === 'ANULADA') throw new Error(`La cuenta ${cxp.documento} está anulada.`);
        const valor = validAmount(p.monto, cxp.saldo);
        const n = await tx.nextSequence(tenantId, 'COMPROBANTE_EGRESO');
        const egreso = `CE-${String(n).padStart(6, '0')}`;

        let movId = null;
        if (turno) {
          const mov = await CashService.applyMovementTx(tx, {
            tenantId, turnoId: turno.id, tipo: 'EGRESO', monto: valor,
            concepto: `${egreso} pago ${cxp.documento}`, tercero: cxp.proveedorNombre, refTipo: 'PAGO_CXP', refId: cxp.id
          });
          movId = mov.id;
        }

        cxp.abonos = Number(cxp.abonos || 0) + valor;
        cxp.saldo = Math.max(0, Math.round((Number(cxp.saldo) - valor) * 100) / 100);
        if (cxp.saldo === 0) cxp.estado = 'PAGADA';
        cxp.historialPagos = cxp.historialPagos || [];
        cxp.historialPagos.push({
          egreso, fecha: new Date().toISOString(), monto: valor, metodo, referencia: referencia || '',
          movimientoCajaId: movId, usuarioId: Session.userId(), usuarioNombre: Session.userName()
        });
        await tx.put(STORES.PAYABLES_CXP, cxp);

        if (cxp.tipoDocumento === 'COMISION_FREELANCE' && cxp.proveedorId) {
          const fl = await tx.get(STORES.SUPPLIERS, cxp.proveedorId);
          if (fl) {
            fl.comisionesTotalesPagadas = Number(fl.comisionesTotalesPagadas || 0) + valor;
            await tx.put(STORES.SUPPLIERS, fl);
          }
        }
        await AuditService.logTx(tx, {
          tenantId, modulo: 'Cuentas por pagar', accion: 'PAGO', registroId: cxp.documento,
          campoModificado: `${egreso} (${metodo})`, valorAnterior: `Saldo ${cxp.saldo + valor}`, valorNuevo: `Saldo ${cxp.saldo}`
        });
        out.push({ cxp, egreso });
      }
      return out;
    });
    if (metodo === CASH_PAYOUT) EventBus.emit('cash:shiftChanged');
    return res;
  }
};
