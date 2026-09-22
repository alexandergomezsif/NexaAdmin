/**
 * Nexa ERP - Módulo 6: Compras & Gestión de Proveedores
 * Órdenes de compra, recepción de materias primas/mercancía, afectación de Kardex y CXP
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { KardexService } from '../services/kardex-service.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const PurchasesModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [purchases, suppliers, products, warehouses] = await Promise.all([
      DB.getAll(STORES.PURCHASES, tenantId),
      DB.getAll(STORES.SUPPLIERS, tenantId),
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.WAREHOUSES, tenantId)
    ]);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Compras & Abastecimiento</h1>
          <p>Recepción de materias primas, insumos de empaque y actualización automática de costos en Kardex</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-manage-suppliers">👥 Directorio Proveedores</button>
          <button class="btn btn-primary btn-sm" id="btn-new-purchase">🛍️ Registrar Compra</button>
        </div>
      </div>

      <div id="purchases-table-container"></div>
    `;

    new DataTable({
      containerId: 'purchases-table-container',
      data: purchases,
      columns: [
        {
          key: 'consecutivo',
          title: 'Factura / Doc.',
          render: val => `<strong style="color: var(--brand-primary);">${val}</strong>`
        },
        {
          key: 'proveedorNombre',
          title: 'Proveedor',
          render: val => `<strong>${val || 'Proveedor General'}</strong>`
        },
        {
          key: 'fecha',
          title: 'Fecha Emisión',
          render: val => Formatters.date(val)
        },
        {
          key: 'total',
          title: 'Valor Total',
          render: val => `<strong>${Formatters.currency(val)}</strong>`
        },
        {
          key: 'condicionPago',
          title: 'Condición',
          render: val => `<span class="badge ${val === 'Crédito' ? 'badge-warning' : 'badge-success'}">${val || 'Contado'}</span>`
        },
        {
          key: 'estado',
          title: 'Estado Recepción',
          render: val => `<span class="badge badge-success">${val || 'RECIBIDA'}</span>`
        }
      ]
    });

    // Nuevo registro de compra
    container.querySelector('#btn-new-purchase').addEventListener('click', () => {
      this.openPurchaseModal(tenantId, suppliers, products, warehouses, () => this.render(container));
    });

    // Directorio de proveedores
    container.querySelector('#btn-manage-suppliers').addEventListener('click', () => {
      this.openSuppliersModal(tenantId, suppliers, () => this.render(container));
    });
  },

  openPurchaseModal(tenantId, suppliers, products, warehouses, onSaved) {
    let purchaseItems = [];

    const content = `
      <form id="purchase-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Proveedor</label>
            <select class="form-select" id="purch-supplier" name="proveedorId" required>
              ${suppliers.map(s => `<option value="${s.id}">${s.razonSocial} (NIT: ${s.nitCc}-${s.dv || 0})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">No. Factura de Compra / Remisión</label>
            <input type="text" class="form-control" name="consecutivo" required value="FAC-PROV-${Math.floor(1000 + Math.random() * 9000)}">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Destino de Almacenamiento</label>
            <select class="form-select" name="bodegaDestinoId">
              ${warehouses.map(w => `<option value="${w.id}">${w.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Forma de Pago</label>
            <select class="form-select" name="condicionPago" id="purch-payment-term">
              <option value="Contado">Contado Inmediato (Transferencia / Banco)</option>
              <option value="Crédito">Crédito a Proveedor (Genera Cuenta por Pagar)</option>
            </select>
          </div>
        </div>

        <!-- AGREGAR ÍTEMS A LA COMPRA -->
        <div class="card mb-3" style="background: #f8fafc; border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">📦 Ítems Comprados / Materias Primas</div>
          </div>
          <div class="card-body" style="padding: 12px;">
            <div class="form-row mb-2">
              <div class="form-group mb-0" style="flex: 2;">
                <select class="form-select" id="purch-item-prod">
                  ${products.map(p => `<option value="${p.id}" data-cost="${p.costoPromedio}">${p.nombre} (${p.unidadMedida})</option>`).join('')}
                </select>
              </div>
              <div class="form-group mb-0">
                <input type="number" step="any" min="0.1" class="form-control" id="purch-item-qty" placeholder="Cantidad" value="10">
              </div>
              <div class="form-group mb-0">
                <input type="number" class="form-control" id="purch-item-cost" placeholder="Costo Unit.">
              </div>
              <div class="form-group mb-0">
                <button type="button" class="btn btn-secondary" id="btn-add-purch-item">➕ Añadir</button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table" style="font-size: 11px;">
                <thead>
                  <tr>
                    <th>Ítem</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-right">Costo Unit.</th>
                    <th class="text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="purch-items-tbody">
                  <tr><td colspan="5" class="text-center text-muted" style="padding: 12px;">Sin ítems agregados.</td></tr>
                </tbody>
              </table>
            </div>
            <div class="d-flex justify-between items-center text-xs mt-2" style="border-top: 1px solid #cbd5e1; padding-top: 6px;">
              <span class="font-bold">TOTAL COMPRA:</span>
              <strong id="purch-total-lbl" style="font-size: 15px; color: var(--brand-primary);">$ 0</strong>
            </div>
          </div>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Registrar Entrada de Mercancía / Compra',
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Ingresar Compra a Kardex',
          class: 'btn-primary',
          onClick: async () => {
            if (purchaseItems.length === 0) {
              Toast.warning('Debe agregar al menos un producto a la compra.');
              return;
            }

            const form = dialog.querySelector('#purchase-form');
            const formData = new FormData(form);
            const proveedorId = formData.get('proveedorId');
            const supp = suppliers.find(s => s.id === proveedorId);
            const consecutivo = formData.get('consecutivo');
            const bodegaId = formData.get('bodegaDestinoId');
            const condicionPago = formData.get('condicionPago');
            const totalCompra = purchaseItems.reduce((acc, i) => acc + (i.cantidad * i.costoUnitario), 0);

            // 1. Guardar compra
            const purchaseRecord = {
              tenantId,
              consecutivo,
              proveedorId,
              proveedorNombre: supp ? supp.razonSocial : 'Proveedor',
              fecha: new Date().toISOString(),
              total: totalCompra,
              condicionPago,
              estado: 'RECIBIDA',
              items: purchaseItems
            };

            await DB.add(STORES.PURCHASES, purchaseRecord);

            // 2. Afectar Kardex y Costo Promedio
            for (const item of purchaseItems) {
              await KardexService.registerMovement({
                tenantId,
                productoId: item.productoId,
                bodegaId,
                documentoTipo: 'COMPRA',
                documentoNumero: consecutivo,
                cantidad: item.cantidad,
                costoUnitario: item.costoUnitario,
                observacion: `Entrada compra fac. ${consecutivo} de ${supp?.razonSocial}`
              });
            }

            // 3. Si fue a crédito, generar Cuenta por Pagar (CXP)
            if (condicionPago === 'Crédito') {
              await DB.add(STORES.PAYABLES_CXP, {
                tenantId,
                compraId: purchaseRecord.id,
                documento: consecutivo,
                proveedorId,
                proveedorNombre: supp.razonSocial,
                fechaEmision: new Date().toISOString().split('T')[0],
                fechaVencimiento: new Date(Date.now() + (supp.diasCredito || 30) * 86400000).toISOString().split('T')[0],
                valorTotal: totalCompra,
                abonos: 0,
                saldo: totalCompra,
                diasMora: 0,
                estado: 'AL_DIA'
              });
            }

            Toast.success('Compra procesada exitosamente. Se actualizaron existencias en Kardex.');
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });

    // Manejo de agregar ítems en el modal
    const updatePurchTable = () => {
      const tbody = dialog.querySelector('#purch-items-tbody');
      const totalLbl = dialog.querySelector('#purch-total-lbl');
      if (purchaseItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 12px;">Sin ítems agregados.</td></tr>`;
        totalLbl.textContent = '$ 0';
        return;
      }

      let total = 0;
      tbody.innerHTML = purchaseItems.map((it, idx) => {
        const sub = it.cantidad * it.costoUnitario;
        total += sub;
        return `
          <tr>
            <td><strong>${it.nombre}</strong></td>
            <td class="text-center">${it.cantidad}</td>
            <td class="text-right">${Formatters.currency(it.costoUnitario)}</td>
            <td class="text-right"><strong>${Formatters.currency(sub)}</strong></td>
            <td class="text-right"><button type="button" class="btn btn-danger btn-sm purch-del-item" data-idx="${idx}">&times;</button></td>
          </tr>
        `;
      }).join('');

      totalLbl.textContent = Formatters.currency(total);
    };

    const prodSelect = dialog.querySelector('#purch-item-prod');
    const costInput = dialog.querySelector('#purch-item-cost');
    const setCostFromSelect = () => {
      const selected = prodSelect.options[prodSelect.selectedIndex];
      costInput.value = selected.getAttribute('data-cost') || 0;
    };
    prodSelect.addEventListener('change', setCostFromSelect);
    setCostFromSelect();

    dialog.querySelector('#btn-add-purch-item').addEventListener('click', () => {
      const pId = prodSelect.value;
      const prod = products.find(p => p.id === pId);
      const qty = Number(dialog.querySelector('#purch-item-qty').value) || 1;
      const cost = Number(costInput.value) || 0;

      purchaseItems.push({
        productoId: pId,
        nombre: prod.nombre,
        cantidad: qty,
        costoUnitario: cost
      });
      updatePurchTable();
    });

    dialog.querySelector('#purch-items-tbody').addEventListener('click', (e) => {
      if (e.target.classList.contains('purch-del-item')) {
        const idx = Number(e.target.getAttribute('data-idx'));
        purchaseItems.splice(idx, 1);
        updatePurchTable();
      }
    });
  },

  openSuppliersModal(tenantId, suppliers, onUpdated) {
    const content = `
      <div class="d-flex justify-between items-center mb-3">
        <h4 class="text-sm font-bold">Directorio de Proveedores Comerciales</h4>
        <button class="btn btn-primary btn-sm" id="btn-add-supplier-inner">➕ Nuevo Proveedor</button>
      </div>
      <div class="table-responsive">
        <table class="data-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Razón Social</th>
              <th>NIT</th>
              <th>Contacto</th>
              <th>Días Crédito</th>
              <th>Categoría</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.map(s => `
              <tr>
                <td><strong>${s.razonSocial}</strong></td>
                <td>${s.nitCc}-${s.dv || 0}</td>
                <td>${s.contacto || '-'} (${s.telefono || '-'})</td>
                <td>${s.diasCredito || 0} días</td>
                <td><span class="badge badge-neutral">${s.categoria || 'Insumos'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const suppDialog = Modal.show({
      title: 'Gestión de Proveedores',
      content,
      size: 'lg',
      footerButtons: [{ label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }]
    });

    // Botón "Nuevo Proveedor" dentro del modal
    const btnAddInner = suppDialog.querySelector('#btn-add-supplier-inner');
    if (btnAddInner) {
      btnAddInner.addEventListener('click', () => {
        this.openAddSupplierForm(tenantId, async () => {
          // Recargar proveedores y volver al directorio
          const updatedSuppliers = await DB.getAll(STORES.SUPPLIERS, tenantId);
          Modal.close();
          this.openSuppliersModal(tenantId, updatedSuppliers, onUpdated);
          if (onUpdated) onUpdated();
        });
      });
    }
  },

  openAddSupplierForm(tenantId, onSaved) {
    const content = `
      <form id="new-supplier-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Razón Social / Nombre *</label>
            <input type="text" class="form-control" name="razonSocial" required placeholder="Ej: Distribuidora Química S.A.S">
          </div>
          <div class="form-group">
            <label class="form-label">NIT / Cédula</label>
            <input type="text" class="form-control" name="nitCc" placeholder="Ej: 900123456">
          </div>
        </div>
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Persona de Contacto</label>
            <input type="text" class="form-control" name="contacto" placeholder="Ej: María González">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono / WhatsApp</label>
            <input type="text" class="form-control" name="telefono" placeholder="3001234567">
          </div>
        </div>
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" name="email" placeholder="proveedor@empresa.com">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad</label>
            <input type="text" class="form-control" name="ciudad" value="Medellín">
          </div>
        </div>
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categoría de Insumos</label>
            <select class="form-select" name="categoria">
              <option value="Insumos Químicos">Insumos Químicos</option>
              <option value="Empaque y Envases">Empaque y Envases</option>
              <option value="Materias Primas">Materias Primas</option>
              <option value="Servicios">Servicios</option>
              <option value="Logística">Logística</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Días de Crédito</label>
            <input type="number" class="form-control" name="diasCredito" value="30" min="0">
          </div>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: '➕ Nuevo Proveedor',
      content,
      size: 'md',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Proveedor',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#new-supplier-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }
            const fd = new FormData(form);
            const payload = {
              tenantId,
              razonSocial: fd.get('razonSocial'),
              nitCc: fd.get('nitCc') || '0',
              dv: '0',
              contacto: fd.get('contacto'),
              telefono: fd.get('telefono'),
              email: fd.get('email'),
              ciudad: fd.get('ciudad'),
              categoria: fd.get('categoria'),
              diasCredito: Number(fd.get('diasCredito')) || 30,
              estado: 'ACTIVO',
              creadoEn: new Date().toISOString()
            };
            await DB.add(STORES.SUPPLIERS, payload);
            Toast.success(`Proveedor "${payload.razonSocial}" registrado.`);
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  }
};
