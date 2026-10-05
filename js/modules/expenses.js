/**
 * Nexa ERP - Módulo 10: Control de Gastos Operativos
 * Registro categorizado de egresos (Servicios, Nómina, Combustible, Mensajería, Arriendos)
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters, esc } from '../utils/formatters.js';
import { ExpenseService, CASH_EXPENSE_METHOD } from '../services/expense-service.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const EXPENSE_CATEGORIES = [
  'Transporte y Fletes',
  'Combustible y Vehículos',
  'Servicios Públicos',
  'Nómina y Prestaciones',
  'Arriendo de Bodega / Local',
  'Materia Prima / Insumos Menores',
  'Empaque y Cajas',
  'Publicidad y Marketing Digital',
  'Mensajería y Envíos',
  'Mantenimiento de Maquinaria',
  'Impuestos y Tasas',
  'Comisiones de Ventas',
  'Otros Gastos Administrativos'
];

export const ExpensesModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const expenses = await DB.getAll(STORES.EXPENSES, tenantId);
    const totalGastos = expenses.reduce((acc, e) => acc + Number(e.valor || 0), 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Gastos Operativos & Egresos</h1>
          <p>Control y categorización de costos indirectos, nómina, logística y gastos administrativos</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-new-expense">🏷️ Registrar Gasto</button>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Total Gastos Registrados</div>
          <div class="kpi-value text-danger">${Formatters.currency(totalGastos)}</div>
          <div class="kpi-footer">${expenses.length} registros contables</div>
        </div>
      </div>

      <div id="expenses-table-container"></div>
    `;

    new DataTable({
      containerId: 'expenses-table-container',
      data: expenses.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
      columns: [
        {
          key: 'fecha',
          title: 'Fecha',
          render: val => Formatters.date(val)
        },
        {
          key: 'categoria',
          title: 'Categoría',
          render: val => `<span class="badge badge-neutral font-bold">${esc(val)}</span>`
        },
        {
          key: 'concepto',
          title: 'Concepto / Detalle',
          render: (val, row) => `
            <div>
              <strong>${esc(val)}</strong>
              <div class="text-xs text-muted">Beneficiario: ${esc(row.proveedor || '-')}</div>
            </div>
          `
        },
        {
          key: 'valor',
          title: 'Valor Pagado',
          render: val => `<strong class="text-danger">-${Formatters.currency(val)}</strong>`
        },
        {
          key: 'formaPago',
          title: 'Medio de Pago',
          render: val => `<span class="badge badge-info">${esc(val || '-')}</span>`
        },
        {
          key: 'responsableNombre',
          title: 'Responsable',
          render: val => esc(val || '-')
        }
      ]
    });

    container.querySelector('#btn-new-expense').addEventListener('click', () => {
      this.openExpenseModal(tenantId, () => this.render(container));
    });
  },

  openExpenseModal(tenantId, onSaved) {
    const content = `
      <form id="expense-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categoría del Gasto</label>
            <select class="form-select" name="categoria" required>
              ${EXPENSE_CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valor del Gasto ($ COP)</label>
            <input type="number" class="form-control" name="valor" required min="1" step="any" placeholder="Ej: 85000">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Concepto o Descripción</label>
          <input type="text" class="form-control" name="concepto" required placeholder="Ej: Factura de agua y luz o gasolina para camioneta de reparto">
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Beneficiario / Proveedor</label>
            <input type="text" class="form-control" name="proveedor" placeholder="Ej: EPM o Estación Primax">
          </div>
          <div class="form-group">
            <label class="form-label">Forma de Pago</label>
            <select class="form-select" name="formaPago">
              <option value="${CASH_EXPENSE_METHOD}">Efectivo de caja (descuenta la caja abierta)</option>
              <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
              <option value="Nequi / Daviplata">Nequi / Daviplata</option>
              <option value="Tarjeta Corporativa">Tarjeta Corporativa</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones / Soporte</label>
          <textarea class="form-control" name="observacion" rows="2" placeholder="No. de factura física o soporte de transferencia"></textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Registrar Nuevo Gasto Operativo',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Gasto',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#expense-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            try {
              await ExpenseService.registerExpense({
                tenantId,
                categoria: formData.get('categoria'),
                valor: Number(formData.get('valor')),
                concepto: formData.get('concepto'),
                proveedor: formData.get('proveedor'),
                formaPago: formData.get('formaPago'),
                observacion: formData.get('observacion')
              });
            } catch (err) {
              Toast.error(err.message);
              return;
            }
            Toast.success('Gasto registrado exitosamente.');
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  }
};
