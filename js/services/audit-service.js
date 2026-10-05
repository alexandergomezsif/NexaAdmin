/**
 * Nexa ERP - Servicio Centralizado de Auditoría
 * Registra las transacciones críticas con el usuario REAL de la sesión.
 */

import { DB, STORES } from './db-service.js';
import { Session } from '../utils/session.js';

class AuditServiceManager {
  /** Construye la entrada de auditoría (sin guardarla) */
  entry({ modulo, accion, registroId, campoModificado, valorAnterior, valorNuevo, tenantId }) {
    const now = new Date();
    return {
      tenantId: tenantId || Session.tenantId,
      fecha: now.toISOString().split('T')[0],
      hora: now.toLocaleTimeString('es-CO', { hour12: false }),
      usuarioId: Session.userId(),
      usuarioNombre: Session.userName(),
      modulo,
      accion,
      registroId: registroId || '-',
      campoModificado: campoModificado || 'Operación General',
      valorAnterior: valorAnterior !== undefined && valorAnterior !== null ? String(valorAnterior) : '-',
      valorNuevo: valorNuevo !== undefined && valorNuevo !== null ? String(valorNuevo) : '-',
      ipUserAgent: (typeof navigator !== 'undefined' ? navigator.userAgent : '').substring(0, 50)
    };
  }

  /** Registra una acción en su propia transacción. Nunca interrumpe el flujo si falla. */
  async log(data) {
    try {
      const logEntry = this.entry(data);
      await DB.add(STORES.AUDIT_LOGS, logEntry);
      return logEntry;
    } catch (err) {
      console.warn('No se pudo registrar la entrada de auditoría:', err);
      return null;
    }
  }

  /** Registra dentro de una transacción existente (DB.runTransaction debe incluir audit_logs) */
  async logTx(tx, data) {
    return tx.put(STORES.AUDIT_LOGS, this.entry(data));
  }

  async getLogs(tenantId) {
    const logs = await DB.getAll(STORES.AUDIT_LOGS, tenantId);
    return logs.sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));
  }
}

export const AuditService = new AuditServiceManager();
