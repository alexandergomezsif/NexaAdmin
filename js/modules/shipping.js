/**
 * Nexa ERP - Módulo 8: Pedidos, Despachos & Logística de Envíos
 * Ciclo visual del pedido (Preparación -> Empaque -> Despacho -> Entrega) y guías de transporte
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { PrintTemplates } from '../components/print-template.js';
import { ExportService } from '../services/export-service.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const SHIPPING_STATUSES = {
  RECIBIDO: { label: 'Pedido Recibido', class: 'badge-info', icon: '📥' },
  PREPARACION: { label: 'En Preparación', class: 'badge-warning', icon: '📦' },
  EMPACADO: { label: 'Empacado / Zunchado', class: 'badge-warning', icon: '🏷️' },
  LISTO_DESPACHO: { label: 'Listo p/ Despacho', class: 'badge-primary', icon: '🚚' },
  ENVIADO: { label: 'En Ruta / Transportadora', class: 'badge-info', icon: '🛣️' },
  ENTREGADO: { label: 'Entregado a Cliente', class: 'badge-success', icon: '✓' },
  DEVUELTO: { label: 'Devuelto a Planta', class: 'badge-danger', icon: '↩️' },
  CANCELADO: { label: 'Cancelado', class: 'badge-danger', icon: '✕' }
};

export const ShippingModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [shipments, clients] = await Promise.all([
      DB.getAll(STORES.ORDERS_SHIPPING, tenantId),
      DB.getAll(STORES.CUSTOMERS, tenantId)
    ]);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Logística de Pedidos & Envíos</h1>
          <p>Control de despacho de mercancía, transportadoras nacionales (Servientrega, Coordinadora, Envia) y estado de entrega</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-new-shipping">🚚 Registrar Nuevo Envío</button>
        </div>
      </div>

      <!-- KANBAN SUMMARY DE CICLO LOGÍSTICO -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
        ${Object.entries(SHIPPING_STATUSES).slice(0, 6).map(([key, meta]) => {
          const count = shipments.filter(s => s.estadoCiclo === key).length;
          return `
            <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 3px solid var(--brand-primary);">
              <div class="d-flex justify-between items-center">
                <span class="text-xs font-bold text-muted">${meta.label}</span>
                <span>${meta.icon}</span>
              </div>
              <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">${count}</div>
            </div>
          `;
        }).join('')}
      </div>

      <div id="shipping-table-container"></div>
    `;

    new DataTable({
      containerId: 'shipping-table-container',
      data: shipments,
      columns: [
        {
          key: 'numeroGuia',
          title: 'Guía / Transportadora',
          render: (val, row) => `
            <div>
              <strong style="color: var(--brand-primary);">${val || 'POR ASIGNAR'}</strong>
              <div class="text-xs text-muted">${row.transportadora}</div>
            </div>
          `
        },
        {
          key: 'clienteNombre',
          title: 'Destinatario',
          render: (val, row) => `
            <div>
              <div class="font-bold">${val}</div>
              <div class="text-xs text-muted">📍 ${row.direccion || '-'}</div>
            </div>
          `
        },
        {
          key: 'estadoCiclo',
          title: 'Estado del Envío',
          render: val => {
            const meta = SHIPPING_STATUSES[val] || { label: val, class: 'badge-neutral', icon: '' };
            return `<span class="badge ${meta.class}">${meta.icon} ${meta.label}</span>`;
          }
        },
        {
          key: 'fechaDespacho',
          title: 'Fecha Despacho',
          render: val => Formatters.date(val)
        },
        {
          key: 'fechaEntregaEstimada',
          title: 'Fecha Estimada',
          render: val => Formatters.date(val)
        },
        {
          key: 'costoEnvio',
          title: 'Flete / Valor',
          render: val => Number(val) > 0 ? Formatters.currency(val) : '<span class="text-success">Gratis / Propio</span>'
        }
      ],
      actions: (row) => `
        <button class="btn btn-primary btn-sm btn-print-label" data-id="${row.id}" title="Imprimir Rótulo Adhesivo con Código de Barras">🏷️ Rótulo Envío</button>
        <button class="btn btn-secondary btn-sm btn-update-ship-status" data-id="${row.id}">🔄 Estado</button>
      `
    });

    // Nuevo envío
    container.querySelector('#btn-new-shipping').addEventListener('click', () => {
      this.openNewShippingModal(tenantId, clients, () => this.render(container));
    });

    // Eventos de tabla
    container.addEventListener('click', (e) => {
      const printLabelBtn = e.target.closest('.btn-print-label');
      if (printLabelBtn) {
        const id = printLabelBtn.getAttribute('data-id');
        const ship = shipments.find(s => s.id === id);
        if (ship) {
          const html = PrintTemplates.shippingBoxLabel(ship);
          ExportService.printDocument(html, `Rotulo_Envio_${ship.numeroGuia}`);
        }
        return;
      }

      const updateBtn = e.target.closest('.btn-update-ship-status');
      if (updateBtn) {
        const id = updateBtn.getAttribute('data-id');
        const ship = shipments.find(s => s.id === id);
        this.openUpdateStatusModal(ship, () => this.render(container));
      }
    });
  },

  openNewShippingModal(tenantId, clients, onSaved) {
    const content = `
      <form id="shipping-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Cliente Destinatario</label>
            <select class="form-select" name="clienteId" id="ship-client-select" required>
              ${clients.map(c => `<option value="${c.id}" data-addr="${c.direccion || ''}">${c.nombre} (${c.ciudad || ''})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Transportadora / Operador</label>
            <select class="form-select" name="transportadora">
              <option value="Servientrega Mercancía">Servientrega</option>
              <option value="Coordinadora Mercantil">Coordinadora</option>
              <option value="Envia Colvanes">Envía</option>
              <option value="TCC Carga">TCC</option>
              <option value="Flota Propia Rayo Pro">Flota Propia Rayo Pro (Medellín/Área Metro)</option>
              <option value="Recoge en Planta Mostrador">Recoge en Planta Mostrador</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Número de Guía / Consecutivo</label>
            <input type="text" class="form-control" name="numeroGuia" required value="GUIA-${Math.floor(100000 + Math.random() * 900000)}" placeholder="Ej: 21987364501">
          </div>
          <div class="form-group">
            <label class="form-label">Costo Flete ($ COP)</label>
            <input type="number" class="form-control" name="costoEnvio" value="0">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Dirección Completa de Destino</label>
          <input type="text" class="form-control" id="ship-address" name="direccion" required value="${clients[0]?.direccion || ''}">
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Fecha de Despacho</label>
            <input type="date" class="form-control" name="fechaDespacho" value="${Formatters.toInputDate()}">
          </div>
          <div class="form-group">
            <label class="form-label">Estado Inicial</label>
            <select class="form-select" name="estadoCiclo">
              <option value="PREPARACION">En Preparación</option>
              <option value="EMPACADO">Empacado / Listo para Despacho</option>
              <option value="ENVIADO">Despachado / En Ruta</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones para el Conductor / Bodega</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Estiba zunchada con cajas rotuladas con líquido frágil"></textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Generar Despacho y Guía de Transporte',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Registrar Despacho',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#shipping-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const client = clients.find(c => c.id === formData.get('clienteId'));

            const payload = {
              tenantId,
              clienteId: client.id,
              clienteNombre: client.nombre,
              nitCc: client.nitCc || '',
              telefono: client.telefono || client.whatsapp || '',
              whatsapp: client.whatsapp || client.telefono || '',
              email: client.email || '',
              ciudad: client.ciudad || 'Medellín',
              departamento: client.departamento || 'Antioquia',
              barrio: client.barrio || '',
              direccion: formData.get('direccion') || client.direccion || '',
              transportadora: formData.get('transportadora'),
              numeroGuia: formData.get('numeroGuia'),
              costoEnvio: Number(formData.get('costoEnvio') || 0),
              fechaDespacho: formData.get('fechaDespacho'),
              fechaEntregaEstimada: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
              estadoCiclo: formData.get('estadoCiclo'),
              responsable: 'Valentina Restrepo',
              cajasTotal: 1,
              contenidoDescripcion: 'Productos de mantenimiento y embellecimiento automotriz',
              observaciones: formData.get('observaciones') || 'Manejar con precaución. Productos de mantenimiento y embellecimiento automotriz.'
            };

            await DB.add(STORES.ORDERS_SHIPPING, payload);
            Toast.success('Despacho registrado correctamente.');
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });

    dialog.querySelector('#ship-client-select').addEventListener('change', (e) => {
      const selected = e.target.options[e.target.selectedIndex];
      dialog.querySelector('#ship-address').value = selected.getAttribute('data-addr') || '';
    });
  },

  openUpdateStatusModal(ship, onUpdated) {
    const content = `
      <div class="form-group mb-3">
        <label class="form-label">Guía de Transporte: <strong>${ship.numeroGuia}</strong> (${ship.transportadora})</label>
        <div class="text-xs text-muted mb-2">Destinatario: ${ship.clienteNombre}</div>
      </div>
      <div class="form-group mb-3">
        <label class="form-label">Seleccionar Nuevo Estado del Ciclo:</label>
        <select class="form-select" id="new-ship-status">
          ${Object.entries(SHIPPING_STATUSES).map(([key, meta]) => `
            <option value="${key}" ${ship.estadoCiclo === key ? 'selected' : ''}>${meta.icon} ${meta.label}</option>
          `).join('')}
        </select>
      </div>
    `;

    const dialog = Modal.show({
      title: 'Actualizar Estado Logístico',
      content,
      size: 'sm',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Estado',
          class: 'btn-primary',
          onClick: async () => {
            const newStatus = dialog.querySelector('#new-ship-status').value;
            ship.estadoCiclo = newStatus;
            if (newStatus === 'ENTREGADO') {
              ship.fechaEntregaReal = new Date().toISOString().split('T')[0];
            }
            await DB.update(STORES.ORDERS_SHIPPING, ship);
            Toast.success(`Estado actualizado a: ${SHIPPING_STATUSES[newStatus].label}`);
            Modal.close();
            if (onUpdated) onUpdated();
          }
        }
      ]
    });
  }
};
