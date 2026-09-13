/**
 * Nexa ERP - Módulo 12: Cuentas por Pagar (Pasivos con Proveedores)
 * Vencimientos, abonos a facturas de compra y programación de pagos
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const CxpModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const payables = await DB.getAll(STORES.PAYABLES_CXP, tenantId);
    const totalPasivo = payables.reduce((acc, p) => acc + Number(p.saldo || 0), 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cuentas por Pagar (Proveedores)</h1>
          <p>Control de compromisos comerciales por compra de materias primas y servicios</p>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Pasivo Total con Proveedores</div>
          <div class="kpi-value text-danger">${Formatters.currency(totalPasivo)}</div>
          <div class="kpi-footer">${payables.filter(p => p.saldo > 0).length} facturas pendientes de pago</div>
        </div>
      </div>

      <div id="cxp-table-container"></div>
    `;

    new DataTable({
      containerId: 'cxp-table-container',
      data: payables.filter(p => p.saldo > 0),
      columns: [
        {
          key: 'documento',
          title: 'Factura Proveedor',
          render: val => `<strong style="color: var(--brand-primary);">${val}</strong>`
        },
        {
          key: 'proveedorNombre',
          title: 'Proveedor',
          render: val => `<strong>${val}</strong>`
        },
        {
          key: 'fechaEmision',
          title: 'Emisión',
          render: val => Formatters.date(val)
        },
        {
          key: 'fechaVencimiento',
          title: 'Vencimiento',
          render: val => Formatters.date(val)
        },
        {
          key: 'valorTotal',
          title: 'Valor Total',
          render: val => Formatters.currency(val)
        },
        {
          key: 'saldo',
          title: 'Saldo Pendiente',
          render: val => `<strong class="text-danger">${Formatters.currency(val)}</strong>`
        },
        {
          key: 'estado',
          title: 'Estado',
          render: val => `<span class="badge ${val === 'AL_DIA' ? 'badge-success' : 'badge-danger'}">${val}</span>`
        }
      ],
      actions: (row) => `
        <button class="btn btn-primary btn-sm btn-cxp-pay" data-id="${row.id}">💳 Pagar a Proveedor</button>
      `
    });

    container.addEventListener('click', (e) => {
      const payBtn = e.target.closest('.btn-cxp-pay');
      if (payBtn) {
        const id = payBtn.getAttribute('data-id');
        const cxpItem = payables.find(p => p.id === id);
        this.openPaySupplierModal(cxpItem, () => this.render(container));
      }
    });
  },

  openPaySupplierModal(cxpItem, onSaved) {
    const content = `
      <div class="mb-3" style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">Pago a Proveedor: <strong>${cxpItem.proveedorNombre}</strong></div>
        <div style="font-size: 15px; font-weight: 700; margin: 2px 0;">Factura: ${cxpItem.documento}</div>
        <div class="text-xs text-danger font-bold mt-1">Saldo a Liquidar: ${Formatters.currency(cxpItem.saldo)}</div>
      </div>

      <form id="cxp-pay-form">
        <div class="form-group mb-3">
          <label class="form-label">Monto del Pago ($ COP)</label>
          <input type="number" step="any" min="1" max="${cxpItem.saldo}" class="form-control" name="monto" value="${cxpItem.saldo}" required>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Cuenta Bancaria de Origen / Medio</label>
          <select class="form-select" name="medio">
            <option value="Bancolombia Cuenta Corriente">Bancolombia Cuenta Corriente</option>
            <option value="Davivienda Ahorros">Davivienda Ahorros</option>
            <option value="Transferencia Nequi">Transferencia Nequi</option>
            <option value="Efectivo Caja">Efectivo Caja</option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Número de Comprobante / Aprobación</label>
          <input type="text" class="form-control" name="comprobante" required placeholder="Ej: TRANSF-982347">
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Registrar Pago a Proveedor',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Confirmar Pago',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#cxp-pay-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const pago = Number(formData.get('monto'));

            cxpItem.abonos = (cxpItem.abonos || 0) + pago;
            cxpItem.saldo = Math.max(0, cxpItem.saldo - pago);
            if (cxpItem.saldo === 0) cxpItem.estado = 'PAGADA';
            await DB.update(STORES.PAYABLES_CXP, cxpItem);

            Toast.success(`Pago por ${Formatters.currency(pago)} registrado con éxito.`);
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  }
};
