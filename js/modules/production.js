/**
 * Nexa ERP - Módulo 5: Producción & Fórmulas Químicas BOM (Core Rayo Pro)
 * Fórmulas maestras, explosión de materiales, órdenes de fabricación, costeo real y lotes
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { ProductionService } from '../services/production-service.js';
import { ExportService } from '../services/export-service.js';
import { PrintTemplates } from '../components/print-template.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const ProductionModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [recipes, orders, rawMaterials, finishedGoods] = await Promise.all([
      DB.getAll(STORES.RECIPES_BOM, tenantId),
      DB.getAll(STORES.PRODUCTION_ORDERS, tenantId),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'MATERIA_PRIMA'),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'PRODUCTO_TERMINADO')
    ]);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Módulo de Producción & Fórmulas (BOM)</h1>
            <span class="badge-demo">FABRICACIÓN AUTOMOTRIZ</span>
          </div>
          <p>Control de recetas químicas, explosión de insumos, costeo por lote y fabricación en planta</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-new-recipe">🧪 Nueva Fórmula / Receta</button>
          <button class="btn btn-primary btn-sm" id="btn-execute-production">⚡ Ejecutar Orden de Producción</button>
        </div>
      </div>

      <!-- TABS: ÓRDENES REALIZADAS VS FÓRMULAS ACTIVAS + BÓVEDA + COSTOS -->
      <div class="card mb-3" style="padding: 6px 14px;">
        <div class="d-flex justify-between items-center" style="flex-wrap: wrap; gap: 8px;">
          <div class="d-flex gap-2">
            <button class="btn btn-secondary btn-sm tab-prod-btn active" data-tab="orders">📋 Órdenes de Producción (${orders.length})</button>
            <button class="btn btn-secondary btn-sm tab-prod-btn" data-tab="recipes">🧪 Fórmulas Maestras BOM (${recipes.length})</button>
          </div>
          <div class="d-flex gap-2">
            <a href="#formulas-vault" class="btn btn-secondary btn-sm" style="border-color: #6366f1; color: #6366f1; text-decoration: none;">🔒 Bóveda de Fórmulas</a>
            <a href="#pricing-calculator" class="btn btn-secondary btn-sm" style="border-color: var(--brand-primary); color: var(--brand-primary); text-decoration: none;">💡 Costos & Precios IA</a>
          </div>
        </div>
      </div>

      <div id="production-content-area"></div>
    `;

    const renderOrdersTable = () => {
      const target = container.querySelector('#production-content-area');
      target.innerHTML = '<div id="orders-table-container"></div>';

      new DataTable({
        containerId: 'orders-table-container',
        data: orders.sort((a, b) => new Date(b.fechaInicio || b.fechaProgramada) - new Date(a.fechaInicio || a.fechaProgramada)),
        columns: [
          {
            key: 'numeroOrden',
            title: 'No. Orden / Lote',
            render: (val, row) => `
              <div>
                <strong style="color: var(--brand-primary);">${val}</strong>
                <div class="text-xs text-muted">Lote: <strong>${row.loteCodigo}</strong></div>
              </div>
            `
          },
          {
            key: 'productoTerminadoNombre',
            title: 'Producto Fabricado',
            render: (val, row) => `
              <div>
                <div class="font-bold">${val}</div>
                <div class="text-xs text-muted">Cant: <strong>${row.cantidadProducida} unidades</strong></div>
              </div>
            `
          },
          {
            key: 'fechaInicio',
            title: 'Fecha Fabricación',
            render: val => Formatters.date(val)
          },
          {
            key: 'costoRealTotal',
            title: 'Costo Total Lote',
            render: val => Formatters.currency(val)
          },
          {
            key: 'costoUnitarioReal',
            title: 'Costo Unit. Real',
            render: val => `<strong class="text-success">${Formatters.currency(val)}</strong>`
          },
          {
            key: 'responsableNombre',
            title: 'Responsable',
            render: val => `<span class="badge badge-neutral">${val || 'Planta'}</span>`
          },
          {
            key: 'estado',
            title: 'Estado',
            render: val => `<span class="badge badge-success">${val}</span>`
          }
        ],
        actions: (row) => `
          <button class="btn btn-secondary btn-sm btn-print-order" data-id="${row.id}" title="Imprimir Orden">🖨️ Imprimir</button>
        `
      });
    };

    const renderRecipesTable = () => {
      const target = container.querySelector('#production-content-area');
      target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">Fórmulas Químicas y Estructura de Materiales (BOM)</div>
          </div>
          <div class="card-body">
            <div class="d-flex flex-col gap-3">
              ${recipes.map(r => {
                const pt = finishedGoods.find(p => p.id === r.productoTerminadoId);
                return `
                  <div class="card" style="border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="card-header" style="background: #f8fafc;">
                      <div>
                        <strong style="color: var(--brand-primary); font-size: 15px;">${r.nombreReceta}</strong>
                        <div class="text-xs text-muted">Producto Resultante: <strong>${pt ? pt.nombre : 'Producto Terminado'}</strong> | Rendimiento Lote: <strong>${r.rendimientoLote} ${r.unidadMedidaLote}</strong></div>
                      </div>
                      <button class="btn btn-primary btn-sm btn-quick-produce" data-receta-id="${r.id}">⚡ Fabricar Este Lote</button>
                    </div>
                    <div class="card-body" style="padding: 12px 16px;">
                      <div class="text-xs font-bold text-muted mb-2">INSUMOS Y MATERIAS PRIMAS CONSUMIDAS POR LOTE:</div>
                      <div class="table-responsive">
                        <table class="data-table" style="font-size: 12px;">
                          <thead>
                            <tr>
                              <th>Materia Prima / Insumo</th>
                              <th class="text-center">Cant. Lote</th>
                              <th class="text-center">Unidad</th>
                              <th class="text-center">Merma Esp.</th>
                              <th class="text-right">Stock Disponible</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${r.insumos.map(ins => {
                              const mp = rawMaterials.find(m => m.id === ins.materiaPrimaId);
                              const stock = mp ? mp.stock : 0;
                              const isSufficient = stock >= ins.cantidad;
                              return `
                                <tr>
                                  <td><strong>${mp ? mp.nombre : 'Insumo'}</strong> <span class="text-xs text-muted">(${mp ? mp.sku : '-'})</span></td>
                                  <td class="text-center font-bold">${ins.cantidad}</td>
                                  <td class="text-center">${ins.unidadMedida}</td>
                                  <td class="text-center">${ins.mermaEsperada || 0}%</td>
                                  <td class="text-right">
                                    <span class="badge ${isSufficient ? 'badge-success' : 'badge-danger'}">
                                      ${stock} ${ins.unidadMedida}
                                    </span>
                                  </td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
                      </div>
                      ${r.observaciones ? `<div class="text-xs text-muted mt-2"><strong>Instrucciones de Mezcla:</strong> ${r.observaciones}</div>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    };

    renderOrdersTable();

    // Tabs
    container.querySelectorAll('.tab-prod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-prod-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        if (tab === 'orders') renderOrdersTable();
        else renderRecipesTable();
      });
    });

    // Eventos
    container.querySelector('#btn-execute-production').addEventListener('click', () => {
      this.openExecuteProductionModal(tenantId, recipes, finishedGoods, rawMaterials, () => this.render(container));
    });

    container.addEventListener('click', (e) => {
      const quickBtn = e.target.closest('.btn-quick-produce');
      if (quickBtn) {
        const recetaId = quickBtn.getAttribute('data-receta-id');
        this.openExecuteProductionModal(tenantId, recipes, finishedGoods, rawMaterials, () => this.render(container), recetaId);
        return;
      }

      const printBtn = e.target.closest('.btn-print-order');
      if (printBtn) {
        const orderId = printBtn.getAttribute('data-id');
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const html = PrintTemplates.productionOrder(order);
          ExportService.printDocument(html, `Orden_Produccion_${order.numeroOrden}`);
        }
      }
    });
  },

  /**
   * Modal de Explosión y Ejecución de Orden de Producción
   */
  openExecuteProductionModal(tenantId, recipes, finishedGoods, rawMaterials, onCompleted, preselectedRecipeId = null) {
    if (recipes.length === 0) {
      Toast.warning('No hay recetas BOM registradas. Debe crear una receta primero.');
      return;
    }

    const selectedRecipe = preselectedRecipeId ? recipes.find(r => r.id === preselectedRecipeId) : recipes[0];

    const content = `
      <form id="execute-production-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Seleccionar Fórmula Maestra (BOM)</label>
            <select class="form-select" id="sel-production-recipe" name="recetaId">
              ${recipes.map(r => `
                <option value="${r.id}" ${r.id === selectedRecipe.id ? 'selected' : ''}>${r.nombreReceta}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad a Fabricar (Unidades)</label>
            <input type="number" step="1" min="1" class="form-control" id="inp-prod-qty" name="cantidad" value="${selectedRecipe.rendimientoLote || 50}" required>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Código de Lote</label>
            <input type="text" class="form-control" name="loteCodigo" value="LOTE-RP${new Date().getMonth() + 1}-${Math.floor(100 + Math.random() * 900)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Costos Indirectos Adicionales (CIF COP)</label>
            <input type="number" class="form-control" id="inp-prod-cif" name="costosIndirectos" value="${selectedRecipe.costosIndirectosEstimados || 35000}">
          </div>
        </div>

        <!-- EXPLOSIÓN DINÁMICA DE INSUMOS -->
        <div class="card mb-3" style="background: #f8fafc; border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">💥 Explosión de Insumos & Verificación de Stock</div>
          </div>
          <div class="card-body" style="padding: 12px;" id="explosion-preview-area">
            <div class="text-xs text-muted">Calculando insumos requeridos...</div>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones / Registro de Calidad</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Control de pH, viscosidad o densidad verificado"></textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Ejecutar Fabricación en Planta',
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Fabricar & Ingresar a Inventario',
          class: 'btn-primary',
          id: 'btn-confirm-production',
          onClick: async () => {
            const form = dialog.querySelector('#execute-production-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const recetaId = formData.get('recetaId');
            const cantidad = Number(formData.get('cantidad'));
            const loteCodigo = formData.get('loteCodigo');
            const cif = Number(formData.get('costosIndirectos') || 0);
            const observaciones = formData.get('observaciones');

            const receta = recipes.find(r => r.id === recetaId);

            try {
              dialog.querySelector('#btn-confirm-production').disabled = true;
              dialog.querySelector('#btn-confirm-production').textContent = 'Procesando fabricación...';

              await ProductionService.executeProductionOrder({
                tenantId,
                recetaId,
                productoTerminadoId: receta.productoTerminadoId,
                cantidadProducida: cantidad,
                loteCodigo,
                costosIndirectosReales: cif,
                responsableId: 'usr_planta',
                responsableNombre: 'Julián Montoya (Planta)',
                observaciones
              });

              Toast.success(`¡Lote ${loteCodigo} fabricado con éxito! Se consumieron las materias primas e ingresó el producto terminado a Kardex.`);
              Modal.close();
              if (onCompleted) onCompleted();
            } catch (err) {
              console.error(err);
              Toast.error(`Error al procesar la producción: ${err.message}`);
              dialog.querySelector('#btn-confirm-production').disabled = false;
              dialog.querySelector('#btn-confirm-production').textContent = 'Fabricar & Ingresar a Inventario';
            }
          }
        }
      ]
    });

    // Función para actualizar la previsualización de la explosión de materiales
    const updateExplosion = async () => {
      const recId = dialog.querySelector('#sel-production-recipe').value;
      const qty = Number(dialog.querySelector('#inp-prod-qty').value) || 1;
      const previewArea = dialog.querySelector('#explosion-preview-area');
      const submitBtn = dialog.querySelector('#btn-confirm-production');

      try {
        const est = await ProductionService.calculateEstimatedCost(recId, qty);
        
        previewArea.innerHTML = `
          <div class="table-responsive mb-2">
            <table class="data-table" style="font-size: 11px;">
              <thead>
                <tr>
                  <th>Insumo Químico / Empaque</th>
                  <th class="text-center">Requerido</th>
                  <th class="text-right">Stock Disponible</th>
                  <th class="text-right">Costo Estimado</th>
                </tr>
              </thead>
              <tbody>
                ${est.desgloseInsumos.map(ins => `
                  <tr>
                    <td><strong>${ins.nombre}</strong></td>
                    <td class="text-center font-bold">${ins.cantidadRequerida} ${ins.unidadMedida}</td>
                    <td class="text-right">
                      <span class="badge ${ins.stockSuficiente ? 'badge-success' : 'badge-danger'}">
                        ${ins.stockDisponible} ${ins.unidadMedida}
                      </span>
                    </td>
                    <td class="text-right">${Formatters.currency(ins.costoTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-between items-center text-xs mt-2" style="border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <div>
              <span>Costo Total Estimado: <strong>${Formatters.currency(est.costoTotalEstimado)}</strong></span>
              <span class="ml-2 text-muted">| Costo Unitario: <strong class="text-success">${Formatters.currency(est.costoUnitarioEstimado)} / un</strong></span>
            </div>
            ${!est.todosConStock ? `
              <span class="badge badge-danger">⚠️ Stock insuficiente en uno o más insumos</span>
            ` : `
              <span class="badge badge-success">✓ Stock disponible para producir</span>
            `}
          </div>
        `;

        if (!est.todosConStock) {
          submitBtn.disabled = true;
          submitBtn.title = 'Insumos insuficientes en bodega';
        } else {
          submitBtn.disabled = false;
        }
      } catch (e) {
        previewArea.innerHTML = `<div class="text-danger text-xs">${e.message}</div>`;
      }
    };

    dialog.querySelector('#sel-production-recipe').addEventListener('change', updateExplosion);
    dialog.querySelector('#inp-prod-qty').addEventListener('input', updateExplosion);
    updateExplosion();
  }
};
