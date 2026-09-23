/**
 * Nexa ERP - Módulo 3: Catálogo de Productos y 5 Listas de Precios
 * Soporta Materias Primas, Productos Terminados (Rayo Pro), Márgenes y Multibodega
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { AuditService } from '../services/audit-service.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const ProductsModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [products, priceLists, warehouses] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.PRICE_LISTS, tenantId),
      DB.getAll(STORES.WAREHOUSES, tenantId)
    ]);

    container.innerHTML = `
            <div class="view-header">
        <div class="view-title-wrap">
          <h1>Catálogo de Productos & Insumos</h1>
          <p>Control de materias primas, productos terminados, 5 listas de precios y niveles de stock</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-products">📊 Exportar</button>
          <button class="btn btn-primary btn-sm" id="btn-new-product">➕ Nuevo Producto</button>
        </div>
      </div>

      <!-- FILTROS DE TIPO -->
      <div class="card mb-3" style="padding: 10px 16px;">
        <div class="d-flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold text-muted">FILTRAR POR TIPO:</span>
          <button class="btn btn-secondary btn-sm filter-type-btn active" data-type="ALL">Todos (${products.length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="PRODUCTO_TERMINADO">⚡ Terminados Fabricados (${products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO').length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="MATERIA_PRIMA">🧪 Materias Primas Químicas (${products.filter(p => p.tipoItem === 'MATERIA_PRIMA').length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="MERCANCIA">🛍️ Mercancía Reventa (${products.filter(p => p.tipoItem === 'MERCANCIA').length})</button>
        </div>
      </div>

      <div id="products-table-container"></div>
    `;

    // Instancia de DataTable
    let currentFiltered = [...products];

    const dataTable = new DataTable({
      containerId: 'products-table-container',
      data: currentFiltered,
      columns: [
        {
          key: 'sku',
          title: 'SKU / Código',
          width: '120px',
          render: (val, row) => `
            <div>
              <strong style="color: var(--brand-primary);">${val || row.codigoInterno}</strong>
              <div class="text-xs text-muted">${row.codigoBarras || ''}</div>
            </div>
          `
        },
        {
          key: 'nombre',
          title: 'Descripción / Presentación',
          render: (val, row) => `
            <div>
              <div class="font-bold">${val}</div>
              <div class="text-xs text-muted">${row.categoria} • ${row.presentacion || row.unidadMedida}</div>
            </div>
          `
        },
        {
          key: 'tipoItem',
          title: 'Tipo',
          render: val => {
            const map = {
              PRODUCTO_TERMINADO: { label: 'Terminado', class: 'badge-info' },
              MATERIA_PRIMA: { label: 'Materia Prima', class: 'badge-warning' },
              MERCANCIA: { label: 'Mercancía', class: 'badge-neutral' },
              SERVICIO: { label: 'Servicio', class: 'badge-success' }
            };
            const item = map[val] || { label: val, class: 'badge-neutral' };
            return `<span class="badge ${item.class}">${item.label}</span>`;
          }
        },
        {
          key: 'stock',
          title: 'Existencias',
          render: (val, row) => {
            const stock = Number(val || 0);
            const min = Number(row.stockMinimo || 10);
            let badge = 'badge-success';
            if (stock <= 0) badge = 'badge-danger';
            else if (stock <= min) badge = 'badge-warning';

            return `
              <div>
                <span class="badge ${badge}">${stock} ${row.unidadMedida}</span>
                <div class="text-xs text-muted" style="margin-top: 2px;">Mín: ${min} | Máx: ${row.stockMaximo || 100}</div>
              </div>
            `;
          }
        },
        {
          key: 'costoPromedio',
          title: 'Costo Promedio',
          render: val => Formatters.currency(val)
        },
        {
          key: 'precios',
          title: 'Precio 1 (Público)',
          render: (val, row) => {
            const p1 = (row.precios && row.precios.plist_1) || 0;
            return `<strong>${Formatters.currency(p1)}</strong>`;
          }
        },
        {
          key: 'estado',
          title: 'Estado',
          render: val => `<span class="badge ${val === 'ACTIVO' ? 'badge-success' : 'badge-danger'}">${val}</span>`
        }
      ],
      actions: (row) => `
        <button class="btn btn-secondary btn-sm btn-edit-product" data-id="${row.id}" title="Editar">✏️ Editar</button>
      `
    });

    // Filtro por tipo de producto
    container.querySelectorAll('.filter-type-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.filter-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        if (type === 'ALL') {
          currentFiltered = [...products];
        } else {
          currentFiltered = products.filter(p => p.tipoItem === type);
        }
        dataTable.updateData(currentFiltered);
      });
    });

    // Eventos
    const exportProdBtn = container.querySelector('#btn-export-products');
    if (exportProdBtn) {
      exportProdBtn.addEventListener('click', async () => {
        const { ExportService } = await import('../services/export-service.js');
        ExportService.exportToCSV(products, 'Catalogo_Productos_RayoPro');
      });
    }

    const newProdBtn = container.querySelector('#btn-new-product');
    if (newProdBtn) {
      newProdBtn.addEventListener('click', () => {
        this.openProductModal(null, tenantId, priceLists, warehouses, () => this.render(container));
      });
    }

    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-product');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const product = products.find(p => p.id === id);
        this.openProductModal(product, tenantId, priceLists, warehouses, () => this.render(container));
      }
    });
  },

  /**
   * Modal de Creación / Edición de Producto con las 5 Listas de Precios
   */
  openProductModal(product = null, tenantId, priceLists, warehouses, onSaved) {
    const isEdit = !!product;

    const content = `
      <form id="product-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tipo de Ítem</label>
            <select class="form-select" name="tipoItem">
              <option value="PRODUCTO_TERMINADO" ${product && product.tipoItem === 'PRODUCTO_TERMINADO' ? 'selected' : ''}>Producto Terminado (Fabricado)</option>
              <option value="MATERIA_PRIMA" ${product && product.tipoItem === 'MATERIA_PRIMA' ? 'selected' : ''}>Materia Prima / Químico / Insumo</option>
              <option value="MERCANCIA" ${product && product.tipoItem === 'MERCANCIA' ? 'selected' : ''}>Mercancía para Reventa</option>
              <option value="SERVICIO" ${product && product.tipoItem === 'SERVICIO' ? 'selected' : ''}>Servicio</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">SKU / Referencia</label>
            <input type="text" class="form-control" name="sku" required value="${product ? product.sku : 'SKU-' + Math.floor(1000 + Math.random() * 9000)}" placeholder="Ej: RAYO-SHAMP-1G">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Nombre Comercial del Producto</label>
            <input type="text" class="form-control" name="nombre" required value="${product ? product.nombre : ''}" placeholder="Ej: Shampoo Automotriz pH Neutro 1 Galón">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <input type="text" class="form-control" name="categoria" required value="${product ? product.categoria : 'Lavado Exterior'}" placeholder="Ej: Lavado Exterior">
          </div>
          <div class="form-group">
            <label class="form-label">Unidad de Medida</label>
            <select class="form-select" name="unidadMedida">
              <option value="Unidad" ${product && product.unidadMedida === 'Unidad' ? 'selected' : ''}>Unidad</option>
              <option value="Galón" ${product && product.unidadMedida === 'Galón' ? 'selected' : ''}>Galón (3785 ml)</option>
              <option value="Litro" ${product && product.unidadMedida === 'Litro' ? 'selected' : ''}>Litro</option>
              <option value="Kg" ${product && product.unidadMedida === 'Kg' ? 'selected' : ''}>Kilogramo (Kg)</option>
              <option value="Gramo" ${product && product.unidadMedida === 'Gramo' ? 'selected' : ''}>Gramo</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Costo Promedio ($ COP)</label>
            <input type="number" class="form-control" name="costoPromedio" id="prod-costo" value="${product ? product.costoPromedio : 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Margen Esperado (%)</label>
            <input type="number" class="form-control" name="margenEsperado" value="${product ? product.margenEsperado : 50}">
          </div>
        </div>

        <!-- 5 LISTAS DE PRECIOS CONFIGURABLES -->
        <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px; background: rgba(0, 113, 227, 0.06); border-bottom: 1px solid var(--border-color);">
            <div class="card-title" style="font-size: 13px; font-weight: 700; color: var(--brand-primary);">💰 5 Listas de Precios de Venta (COP)</div>
          </div>
          <div class="card-body" style="padding: 14px;">
            <div class="form-row">
              ${priceLists.map(pl => `
                <div class="form-group mb-2">
                  <label class="form-label text-xs font-bold" style="color: var(--text-main);">${pl.nombre}</label>
                  <input type="number" class="form-control font-bold" name="precio_${pl.id}" value="${(product && product.precios && product.precios[pl.id]) || 0}" style="color: var(--brand-primary);">
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Stock Mínimo Alerta</label>
            <input type="number" class="form-control" name="stockMinimo" value="${product ? product.stockMinimo : 15}">
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Habitual</label>
            <select class="form-select" name="bodegaId">
              ${warehouses.map(w => `
                <option value="${w.id}" ${product && product.bodegaId === w.id ? 'selected' : ''}>${w.nombre}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Descripción Técnica</label>
          <textarea class="form-control" name="descripcion" rows="2">${product ? (product.descripcion || '') : ''}</textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: isEdit ? `Editar Producto: ${product.nombre}` : 'Nuevo Producto / Referencia',
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: isEdit ? 'Guardar Cambios' : 'Crear Producto',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#product-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const precios = {};
            priceLists.forEach(pl => {
              precios[pl.id] = Number(formData.get(`precio_${pl.id}`) || 0);
            });

            const payload = {
              tenantId,
              tipoItem: formData.get('tipoItem'),
              sku: formData.get('sku'),
              codigoInterno: formData.get('sku'),
              nombre: formData.get('nombre'),
              categoria: formData.get('categoria'),
              unidadMedida: formData.get('unidadMedida'),
              costoPromedio: Number(formData.get('costoPromedio') || 0),
              margenEsperado: Number(formData.get('margenEsperado') || 0),
              stockMinimo: Number(formData.get('stockMinimo') || 0),
              bodegaId: formData.get('bodegaId'),
              descripcion: formData.get('descripcion'),
              precios,
              estado: 'ACTIVO'
            };

            if (isEdit) {
              payload.id = product.id;
              payload.stock = product.stock || 0;
              await DB.update(STORES.PRODUCTS, payload);
              await AuditService.log({
                modulo: 'Productos',
                accion: 'MODIFICAR',
                registroId: payload.sku,
                campoModificado: 'Ficha y Precios',
                valorAnterior: product.nombre,
                valorNuevo: `${payload.nombre} (P1: $ ${precios.plist_1 || 0})`
              });
              Toast.success('Producto actualizado con éxito.');
            } else {
              payload.stock = 0;
              await DB.add(STORES.PRODUCTS, payload);
              await AuditService.log({
                modulo: 'Productos',
                accion: 'CREAR',
                registroId: payload.sku,
                campoModificado: 'Producto Creado',
                valorAnterior: '-',
                valorNuevo: payload.nombre
              });
              Toast.success('Producto registrado exitosamente.');
            }

            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  }
};
