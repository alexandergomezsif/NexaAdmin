/**
 * Nexa ERP - Módulo 14: Auditoría y Bitácora Transaccional Inmutable
 * Registro detallado de operaciones, cambios de precios, autorizaciones y trazabilidad de usuarios
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { ExportService } from '../services/export-service.js';
import { DataTable } from '../components/data-table.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const AuditModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const logs = (await DB.getAll(STORES.AUDIT_LOGS, tenantId)).sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Bitácora de Auditoría Transaccional</h1>
          <p>Trazabilidad estricta de cambios de precios, modificaciones de inventario, accesos y operaciones críticas</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-audit">📊 Exportar Bitácora (CSV)</button>
        </div>
      </div>

      <div class="card mb-4" style="background: #f8fafc; padding: 12px 16px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">
          ℹ️ Todos los eventos son registrados de forma automática con marca de tiempo, usuario autenticado, valores anteriores y nuevos para cumplimiento normativo.
        </div>
      </div>

      <div id="audit-table-container"></div>
    `;

    new DataTable({
      containerId: 'audit-table-container',
      data: logs,
      columns: [
        {
          key: 'fecha',
          title: 'Fecha y Hora',
          render: (val, row) => `
            <div>
              <strong>${Formatters.date(val)}</strong>
              <div class="text-xs text-muted">${row.hora || ''}</div>
            </div>
          `
        },
        {
          key: 'usuarioNombre',
          title: 'Usuario Operador',
          render: val => `<strong>${val || 'Sistema'}</strong>`
        },
        {
          key: 'modulo',
          title: 'Módulo',
          render: val => `<span class="badge badge-info">${val}</span>`
        },
        {
          key: 'accion',
          title: 'Acción',
          render: val => {
            const map = {
              CREAR: 'badge-success',
              MODIFICAR: 'badge-warning',
              ELIMINAR: 'badge-danger',
              AUTORIZAR: 'badge-primary',
              LOGIN: 'badge-neutral'
            };
            return `<span class="badge ${map[val] || 'badge-neutral'}">${val}</span>`;
          }
        },
        {
          key: 'registroId',
          title: 'Registro Afectado',
          render: val => `<code>${val || '-'}</code>`
        },
        {
          key: 'campoModificado',
          title: 'Detalle / Campo',
          render: val => `<strong>${val || '-'}</strong>`
        },
        {
          key: 'valorAnterior',
          title: 'Valor Anterior',
          render: val => `<span class="text-muted" style="text-decoration: line-through;">${val || '-'}</span>`
        },
        {
          key: 'valorNuevo',
          title: 'Valor Nuevo',
          render: val => `<strong class="text-primary">${val || '-'}</strong>`
        }
      ]
    });

    container.querySelector('#btn-export-audit').addEventListener('click', () => {
      ExportService.exportToCSV(logs, 'Bitacora_Auditoria', {
        fecha: 'Fecha',
        hora: 'Hora',
        usuarioNombre: 'Usuario',
        modulo: 'Módulo',
        accion: 'Acción',
        registroId: 'Registro',
        campoModificado: 'Detalle',
        valorAnterior: 'Valor Anterior',
        valorNuevo: 'Valor Nuevo'
      });
    });
  }
};
