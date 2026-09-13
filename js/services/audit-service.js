/**
 * Nexa ERP - Servicio Centralizado de Auditoría
 * Registra todas las transacciones críticas para cumplimiento y trazabilidad
 */

import { DB, STORES } from './db-service.js';

class AuditServiceManager {
  /**
   * Registra una acción de auditoría
   */
  async log({ modulo, accion, registroId, campoModificado, valorAnterior, valorNuevo }) {
    try {
      const tenantId = localStorage.getItem('nexa_active_tenant') || 'tenant_rayopro';
      const now = new Date();
      const hora = now.toLocaleTimeString('es-CO', { hour12: false });
      const fecha = now.toISOString().split('T')[0];
      
      const activeUserId = localStorage.getItem('nexa_active_user') || 'usr_admin';
      let usuarioNombre = 'Usuario Sistema';
      
      const user = await DB.getById(STORES.USERS, activeUserId);
      if (user) {
        usuarioNombre = user.nombre;
      }

      const logEntry = {
        tenantId,
        fecha,
        hora,
        usuarioId: activeUserId,
        usuarioNombre,
        modulo,
        accion,
        registroId: registroId || '-',
        campoModificado: campoModificado || 'Operación General',
        valorAnterior: valorAnterior !== undefined && valorAnterior !== null ? String(valorAnterior) : '-',
        valorNuevo: valorNuevo !== undefined && valorNuevo !== null ? String(valorNuevo) : '-',
        ipUserAgent: navigator.userAgent.substring(0, 50)
      };

      await DB.add(STORES.AUDIT_LOGS, logEntry);
      return logEntry;
    } catch (err) {
      console.warn('No se pudo registrar la entrada de auditoría:', err);
    }
  }

  /**
   * Obtiene la bitácora de auditoría para la empresa activa
   */
  async getLogs(tenantId) {
    const logs = await DB.getAll(STORES.AUDIT_LOGS, tenantId);
    return logs.sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));
  }
}

export const AuditService = new AuditServiceManager();
