/**
 * Nexa ERP - Servicio de Gastos Operativos
 * Un gasto pagado en efectivo de caja menor descuenta la caja abierta en la MISMA transacción,
 * y un "gasto" registrado desde Caja también aparece en el módulo de Gastos (reportes de utilidad).
 */

import { DB, STORES } from './db-service.js';
import { CashService } from './cash-service.js';
import { AuditService } from './audit-service.js';
import { Session } from '../utils/session.js';
import { EventBus } from '../utils/event-bus.js';

export const CASH_EXPENSE_METHOD = 'Efectivo Caja Menor';

export const ExpenseService = {
  async registerExpense({ tenantId, categoria, valor, concepto, proveedor, formaPago, observacion, fecha }) {
    const monto = Number(valor);
    if (!Number.isFinite(monto) || monto <= 0) throw new Error('El valor del gasto debe ser mayor a cero.');
    if (!concepto || !String(concepto).trim()) throw new Error('Indique el concepto del gasto.');
    const afectaCaja = formaPago === CASH_EXPENSE_METHOD;

    const saved = await DB.runTransaction(
      [STORES.EXPENSES, STORES.CASH_SHIFTS, STORES.CASH_MOVEMENTS, STORES.AUDIT_LOGS],
      async (tx) => {
        let turno = null;
        if (afectaCaja) {
          const shifts = await tx.getAll(STORES.CASH_SHIFTS, tenantId);
          turno = shifts.find(s => s.estado === 'ABIERTA');
          if (!turno) throw new Error('Para pagar con efectivo de caja menor debe haber un turno de caja abierto.');
        }
        const exp = await tx.put(STORES.EXPENSES, {
          tenantId,
          fecha: fecha || new Date().toISOString(),
          categoria: categoria || 'Gastos Varios',
          valor: monto,
          concepto: String(concepto).trim(),
          proveedor: proveedor || '',
          formaPago: formaPago || 'Otro',
          responsableId: Session.userId(),
          responsableNombre: Session.userName(),
          observacion: observacion || '',
          turnoId: turno ? turno.id : null
        });
        if (turno) {
          const mov = await CashService.applyMovementTx(tx, {
            tenantId, turnoId: turno.id, tipo: 'GASTO', monto,
            concepto: `${exp.categoria}: ${exp.concepto}`, tercero: proveedor, refTipo: 'GASTO', refId: exp.id
          });
          exp.movimientoCajaId = mov.id;
          await tx.put(STORES.EXPENSES, exp);
        }
        await AuditService.logTx(tx, {
          tenantId, modulo: 'Gastos', accion: 'CREAR', registroId: exp.id,
          campoModificado: exp.categoria, valorNuevo: `$ ${monto} - ${exp.concepto} (${exp.formaPago})`
        });
        return exp;
      }
    );
    if (afectaCaja) EventBus.emit('cash:shiftChanged');
    return saved;
  }
};
