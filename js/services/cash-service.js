/**
 * Nexa ERP - Servicio de Caja y Control de Turnos / Arqueos
 * Administra aperturas, cierres, ingresos, egresos y control de diferencias
 */

import { DB, STORES } from './db-service.js';
import { AuditService } from './audit-service.js';

export const CashService = {
  /**
   * Obtiene el turno de caja abierto actualmente para el tenant
   */
  async getCurrentShift(tenantId) {
    const shifts = await DB.getAll(STORES.CASH_SHIFTS, tenantId);
    return shifts.find(s => s.estado === 'ABIERTA') || null;
  },

  /**
   * Abre un nuevo turno de caja
   */
  async openShift({ tenantId, usuarioId, usuarioNombre, montoApertura, observaciones }) {
    const existing = await this.getCurrentShift(tenantId);
    if (existing) {
      throw new Error('Ya existe un turno de caja abierto. Debe cerrarlo antes de aperturar uno nuevo.');
    }

    const shift = {
      tenantId,
      usuarioId,
      usuarioNombre,
      fechaApertura: new Date().toISOString(),
      fechaCierre: null,
      montoApertura: Number(montoApertura) || 0,
      totalVentasEfectivo: 0,
      totalVentasTransferencia: 0,
      totalVentasNequiDaviplata: 0,
      totalVentasTarjeta: 0,
      totalVentasCredito: 0,
      totalIngresos: 0,
      totalEgresos: 0,
      totalGastos: 0,
      totalRetiros: 0,
      saldoEsperado: Number(montoApertura) || 0,
      saldoContado: 0,
      diferencia: 0,
      estado: 'ABIERTA',
      observaciones: observaciones || ''
    };

    const saved = await DB.add(STORES.CASH_SHIFTS, shift);

    await AuditService.log({
      modulo: 'Caja',
      accion: 'CREAR',
      registroId: saved.id,
      campoModificado: 'Apertura de Turno',
      valorAnterior: '-',
      valorNuevo: `Apertura con base: $ ${montoApertura}`
    });

    return saved;
  },

  /**
   * Registra un movimiento de caja (Ingreso, Egreso, Retiro, Gasto)
   */
  async addMovement({ tenantId, turnoId, tipo, monto, concepto, tercero, formaPago }) {
    const shift = await DB.getById(STORES.CASH_SHIFTS, turnoId);
    if (!shift || shift.estado !== 'ABIERTA') {
      throw new Error('No hay turno de caja abierto válido para registrar este movimiento.');
    }

    const val = Number(monto);
    if (tipo === 'INGRESO') {
      shift.totalIngresos = (shift.totalIngresos || 0) + val;
      shift.saldoEsperado += val;
    } else if (tipo === 'EGRESO') {
      shift.totalEgresos = (shift.totalEgresos || 0) + val;
      shift.saldoEsperado -= val;
    } else if (tipo === 'RETIRO') {
      shift.totalRetiros = (shift.totalRetiros || 0) + val;
      shift.saldoEsperado -= val;
    } else if (tipo === 'GASTO') {
      shift.totalGastos = (shift.totalGastos || 0) + val;
      shift.saldoEsperado -= val;
    }

    await DB.update(STORES.CASH_SHIFTS, shift);

    const movement = {
      tenantId,
      turnoId,
      tipo,
      monto: val,
      concepto,
      tercero: tercero || '-',
      formaPago: formaPago || 'Efectivo',
      fecha: new Date().toISOString(),
      usuarioId: shift.usuarioId
    };

    const savedMovement = await DB.add(STORES.CASH_MOVEMENTS, movement);

    await AuditService.log({
      modulo: 'Caja',
      accion: 'CREAR',
      registroId: turnoId,
      campoModificado: `Movimiento Caja: ${tipo}`,
      valorAnterior: '-',
      valorNuevo: `$ ${val} - ${concepto}`
    });

    return savedMovement;
  },

  /**
   * Cierra el turno de caja y calcula arqueo
   */
  async closeShift({ turnoId, saldoContado, observacionesCierre }) {
    const shift = await DB.getById(STORES.CASH_SHIFTS, turnoId);
    if (!shift) throw new Error('Turno de caja no encontrado.');

    const contado = Number(saldoContado) || 0;
    const diferencia = contado - shift.saldoEsperado;

    shift.fechaCierre = new Date().toISOString();
    shift.saldoContado = contado;
    shift.diferencia = diferencia;
    shift.observacionesCierre = observacionesCierre || '';
    shift.estado = 'CERRADA';

    await DB.update(STORES.CASH_SHIFTS, shift);

    await AuditService.log({
      modulo: 'Caja',
      accion: 'MODIFICAR',
      registroId: turnoId,
      campoModificado: 'Cierre y Arqueo de Caja',
      valorAnterior: `Esperado: $ ${shift.saldoEsperado}`,
      valorNuevo: `Contado: $ ${contado} (Diferencia: $ ${diferencia})`
    });

    return shift;
  }
};
