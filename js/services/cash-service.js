/**
 * Nexa ERP - Servicio de Caja y Control de Turnos / Arqueos
 * Aperturas, cierres, ingresos, egresos y conciliación de diferencias.
 * El cajero es SIEMPRE el usuario de la sesión activa.
 */

import { DB, STORES } from './db-service.js';
import { AuditService } from './audit-service.js';
import { EventBus } from '../utils/event-bus.js';
import { Session } from '../utils/session.js';

export const CASH_TX_STORES = [STORES.CASH_SHIFTS, STORES.CASH_MOVEMENTS, STORES.AUDIT_LOGS];

/** Campo del turno que acumula cada método de pago */
export const PAYMENT_FIELD = {
  'Efectivo': 'totalVentasEfectivo',
  'Transferencia': 'totalVentasTransferencia',
  'Nequi': 'totalVentasNequiDaviplata',
  'Daviplata': 'totalVentasNequiDaviplata',
  'Tarjeta': 'totalVentasTarjeta'
};

const MOV_SIGN = { INGRESO: 1, EGRESO: -1, RETIRO: -1, GASTO: -1 };
const MOV_FIELD = { INGRESO: 'totalIngresos', EGRESO: 'totalEgresos', RETIRO: 'totalRetiros', GASTO: 'totalGastos' };

export const CashService = {
  async getCurrentShift(tenantId) {
    const shifts = await DB.getAll(STORES.CASH_SHIFTS, tenantId);
    return shifts.find(s => s.estado === 'ABIERTA') || null;
  },

  async openShift({ tenantId, montoApertura, observaciones }) {
    const monto = Number(montoApertura);
    if (!Number.isFinite(monto) || monto < 0) throw new Error('La base de apertura debe ser un valor igual o mayor a cero.');

    const saved = await DB.runTransaction(CASH_TX_STORES, async (tx) => {
      const shifts = await tx.getAll(STORES.CASH_SHIFTS, tenantId);
      if (shifts.some(s => s.estado === 'ABIERTA')) {
        throw new Error('Ya existe un turno de caja abierto. Debe cerrarlo antes de abrir uno nuevo.');
      }
      const shift = await tx.put(STORES.CASH_SHIFTS, {
        tenantId,
        usuarioId: Session.userId(),
        usuarioNombre: Session.userName(),
        fechaApertura: new Date().toISOString(),
        fechaCierre: null,
        montoApertura: monto,
        totalVentasEfectivo: 0,
        totalVentasTransferencia: 0,
        totalVentasNequiDaviplata: 0,
        totalVentasTarjeta: 0,
        totalVentasCredito: 0,
        totalIngresos: 0,
        totalEgresos: 0,
        totalGastos: 0,
        totalRetiros: 0,
        saldoEsperado: monto,
        saldoContado: 0,
        diferencia: 0,
        estado: 'ABIERTA',
        observaciones: observaciones || ''
      });
      await AuditService.logTx(tx, {
        tenantId, modulo: 'Caja', accion: 'CREAR', registroId: shift.id,
        campoModificado: 'Apertura de Turno', valorNuevo: `Base: $ ${monto}`
      });
      return shift;
    });

    EventBus.emit('cash:shiftChanged', saved);
    return saved;
  },

  /**
   * Movimiento manual dentro de una transacción.
   * Las salidas no pueden superar el efectivo esperado en gaveta.
   */
  async applyMovementTx(tx, { tenantId, turnoId, tipo, monto, concepto, tercero, formaPago, refTipo, refId }) {
    const shift = await tx.get(STORES.CASH_SHIFTS, turnoId);
    if (!shift || shift.estado !== 'ABIERTA') {
      throw new Error('No hay un turno de caja abierto válido para registrar este movimiento.');
    }
    const val = Number(monto);
    if (!Number.isFinite(val) || val <= 0) throw new Error('El monto del movimiento debe ser mayor a cero.');
    if (!MOV_SIGN[tipo]) throw new Error(`Tipo de movimiento de caja inválido: ${tipo}`);
    if (MOV_SIGN[tipo] < 0 && val > Number(shift.saldoEsperado || 0)) {
      throw new Error(`No hay suficiente efectivo en caja: esperado ${shift.saldoEsperado}, salida ${val}.`);
    }

    shift[MOV_FIELD[tipo]] = Number(shift[MOV_FIELD[tipo]] || 0) + val;
    shift.saldoEsperado = Number(shift.saldoEsperado || 0) + MOV_SIGN[tipo] * val;
    await tx.put(STORES.CASH_SHIFTS, shift);

    const movement = await tx.put(STORES.CASH_MOVEMENTS, {
      tenantId,
      turnoId,
      tipo,
      monto: val,
      concepto: concepto || '-',
      tercero: tercero || '-',
      formaPago: formaPago || 'Efectivo',
      refTipo: refTipo || null,
      refId: refId || null,
      fecha: new Date().toISOString(),
      usuarioId: Session.userId(),
      usuarioNombre: Session.userName()
    });

    await AuditService.logTx(tx, {
      tenantId, modulo: 'Caja', accion: 'CREAR', registroId: turnoId,
      campoModificado: `Movimiento Caja: ${tipo}`, valorNuevo: `$ ${val} - ${concepto || ''}`
    });
    return movement;
  },

  async addMovement(params) {
    const mov = await DB.runTransaction(CASH_TX_STORES, (tx) => this.applyMovementTx(tx, params));
    EventBus.emit('cash:shiftChanged');
    return mov;
  },

  /**
   * Suma (signo +1) o revierte (signo -1) el valor de una venta en el turno.
   * Solo los pagos en efectivo afectan el saldo esperado en gaveta.
   */
  async applySaleTx(tx, turnoId, metodoPago, total, signo = 1) {
    const shift = await tx.get(STORES.CASH_SHIFTS, turnoId);
    if (!shift || shift.estado !== 'ABIERTA') throw new Error('El turno de caja de la venta no está abierto.');
    const field = PAYMENT_FIELD[metodoPago];
    if (!field) return shift;
    const val = Number(total) * signo;
    if (metodoPago === 'Efectivo' && signo < 0 && Number(total) > Number(shift.saldoEsperado || 0)) {
      throw new Error('No hay suficiente efectivo en caja para devolver esta venta.');
    }
    shift[field] = Number(shift[field] || 0) + val;
    if (metodoPago === 'Efectivo') shift.saldoEsperado = Number(shift.saldoEsperado || 0) + val;
    await tx.put(STORES.CASH_SHIFTS, shift);
    return shift;
  },

  async closeShift({ turnoId, saldoContado, observacionesCierre }) {
    const contado = Number(saldoContado);
    if (!Number.isFinite(contado) || contado < 0) throw new Error('El efectivo contado debe ser un valor igual o mayor a cero.');

    const shift = await DB.runTransaction(CASH_TX_STORES, async (tx) => {
      const s = await tx.get(STORES.CASH_SHIFTS, turnoId);
      if (!s) throw new Error('Turno de caja no encontrado.');
      if (s.estado !== 'ABIERTA') throw new Error('El turno ya está cerrado.');
      s.fechaCierre = new Date().toISOString();
      s.saldoContado = contado;
      s.diferencia = contado - Number(s.saldoEsperado || 0);
      s.observacionesCierre = observacionesCierre || '';
      s.cerradoPorId = Session.userId();
      s.cerradoPorNombre = Session.userName();
      s.estado = 'CERRADA';
      await tx.put(STORES.CASH_SHIFTS, s);
      await AuditService.logTx(tx, {
        tenantId: s.tenantId, modulo: 'Caja', accion: 'MODIFICAR', registroId: turnoId,
        campoModificado: 'Cierre y Arqueo de Caja',
        valorAnterior: `Esperado: $ ${s.saldoEsperado}`,
        valorNuevo: `Contado: $ ${contado} (Diferencia: $ ${s.diferencia})`
      });
      return s;
    });

    EventBus.emit('cash:shiftChanged', null);
    return shift;
  }
};
