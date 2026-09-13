/**
 * Nexa ERP - Módulo 4: Control de Inventario & Kardex Multibodega
 * Historial ponderado de movimientos, traslados entre bodegas y ajustes manuales
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { KardexService, MOVEMENT_TYPES } from '../services/kardex-service.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const InventoryModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [products, warehouses, movements] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.WAREHOUSES, tenantId),
      KardexService.getMovements(tenantId)
    ]);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Inventario & Kardex Multibodega</h1>
          <p>Trazabilidad completa de entradas, salidas, consumos de producción y traslados</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-inventory-adjustment">⚖️ Ajuste Manual</button>
          <button class="btn btn-primary btn-sm" id="btn-inventory-transfer">🔄 Traslado de Bodega</button>
        </div>
      </div>

      <!-- RESUMEN DE BODEGAS -->
      <div class="kpi-grid mb-4">
        ${warehouses.map(w => {
          const prodsInWh = products.filter(p => p.bodegaId === w.id);
          const totalStock = prodsInWh.reduce((acc, p) => acc + (p.stock || 0), 0);
          return `
            <div class="kpi-card">
              <div class="kpi-card-header">
                <span class="kpi-label">${w.codigo}</span>
                <span class="badge badge-info">${w.esPrincipal ? 'Principal' : 'Secundaria'}</span>
              </div>
              <div class="kpi-value" style="font-size: 18px;">${w.nombre}</div>
              <div class="kpi-footer">
                <span><strong>${prodsInWh.length}</strong> referencias • <strong>${totalStock}</strong> unidades físicas</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- TABS: KARDEX VS EXISTENCIAS -->
      <div class="card mb-3" style="padding: 6px 14px;">
        <div class="d-flex gap-2">
          <button class="btn btn-secondary btn-sm tab-btn active" data-tab="kardex">📑 Movimientos de Kardex (${movements.length})</button>
          <button class="btn btn-secondary btn-sm tab-btn" data-tab="stocks">📦 Existencias Actuales (${products.length})</button>
        </div>
      </div>

      <div id="inventory-content-area"></div>
    `;

    const renderKardexTable = () => {
      const target = container.querySelector('#inventory-content-area');
      target.innerHTML = '<div id="kardex-table-container"></div>';

      new DataTable({
        containerId: 'kardex-table-container',
        data: movements,
        columns: [
          {
            key: 'fecha',
            title: 'Fecha y Hora',
            render: val => Formatters.dateTime(val)
          },
          {
            key: 'productoNombre',
            title: 'Producto / Insumo',
            render: (val, row) => `
              <div>
                <strong>${val}</strong>
                <div class="text-xs text-muted">SKU: ${row.sku || '-'}</div>
              </div>
            `
          },
          {
            key: 'bodegaNombre',
            title: 'Bodega',
            render: val => `<span class="badge badge-neutral">${val}</span>`
          },
          {
            key: 'documentoTipo',
            title: 'Tipo Movimiento',
            render: (val, row) => {
              const meta = MOVEMENT_TYPES[val] || { label: val, type: 'OTHER' };
              const badgeClass = meta.type === 'IN' ? 'badge-success' : meta.type === 'OUT' ? 'badge-danger' : 'badge-warning';
              return `
                <div>
                  <span class="badge ${badgeClass}">${meta.label}</span>
                  <div class="text-xs text-muted">Doc: ${row.documentoNumero}</div>
                </div>
              `;
            }
          },
          {
            key: 'cantidadEntrada',
            title: 'Entrada',
            render: val => val > 0 ? `<strong class="text-success">+${val}</strong>` : '-'
          },
          {
            key: 'cantidadSalida',
            title: 'Salida',
            render: val => val > 0 ? `<strong class="text-danger">-${val}</strong>` : '-'
          },
          {
            key: 'saldoCantidad',
            title: 'Saldo Final',
            render: val => `<strong>${val}</strong>`
          },
          {
            key: 'costoUnitario',
            title: 'Costo Unit.',
            render: val => Formatters.currency(val)
          },
          {
            key: 'observacion',
            title: 'Observaciones',
            render: val => `<span class="text-xs text-muted">${val || '-'}</span>`
          }
        ]
      });
    };

    const renderStocksTable = () => {
      const target = container.querySelector('#inventory-content-area');
      target.innerHTML = '<div id="stocks-table-container"></div>';

      new DataTable({
        containerId: 'stocks-table-container',
        data: products,
        columns: [
          {
            key: 'sku',
            title: 'SKU',
            render: val => `<strong>${val}</strong>`
          },
          {
            key: 'nombre',
            title: 'Nombre Producto',
            render: (val, row) => `${val} <span class="text-xs text-muted">(${row.unidadMedida})</span>`
          },
          {
            key: 'stock',
            title: 'Existencia Actual',
            render: (val, row) => {
              const stock = Number(val || 0);
              const min = Number(row.stockMinimo || 10);
              let cls = 'badge-success';
              if (stock <= 0) cls = 'badge-danger';
              else if (stock <= min) cls = 'badge-warning';
              return `<span class="badge ${cls}">${stock} ${row.unidadMedida}</span>`;
            }
          },
          {
            key: 'costoPromedio',
            title: 'Costo Promedio',
            render: val => Formatters.currency(val)
          },
          {
            key: 'stock',
            title: 'Valor Total Stock',
            render: (val, row) => Formatters.currency(Number(val || 0) * Number(row.costoPromedio || 0))
          },
          {
            key: 'ubicacionBodega',
            title: 'Ubicación',
            render: val => val || 'No especificada'
          }
        ]
      });
    };

    renderKardexTable();

    // Eventos de tabs
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        if (tab === 'kardex') renderKardexTable();
        else renderStocksTable();
      });
    });

    // Ajuste manual de inventario
    container.querySelector('#btn-inventory-adjustment').addEventListener('click', () => {
      this.openAdjustmentModal(tenantId, products, warehouses, () => this.render(container));
    });

    // Traslado entre bodegas
    container.querySelector('#btn-inventory-transfer').addEventListener('click', () => {
      this.openTransferModal(tenantId, products, warehouses, () => this.render(container));
    });
  },

  /**
   * Modal de Ajuste de Inventario (+ / -)
   */
  openAdjustmentModal(tenantId, products, warehouses, onComplete) {
    const content = `
      <form id="adjustment-form">
        <div class="form-group mb-3">
          <label class="form-label">Seleccionar Producto o Insumo</label>
          <select class="form-select" name="productoId" required>
            ${products.map(p => `
              <option value="${p.id}">${p.nombre} (SKU: ${p.sku} | Stock: ${p.stock} ${p.unidadMedida})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tipo de Ajuste</label>
            <select class="form-select" name="documentoTipo" required>
              <option value="AJUSTE_POS">Ajuste Positivo (+) Entrada física encontrada</option>
              <option value="AJUSTE_NEG">Ajuste Negativo (-) Salida o faltante</option>
              <option value="MERMA">Baja por Merma Técnica (-)</option>
              <option value="DANO">Baja por Daño / Vencimiento (-)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad a Ajustar</label>
            <input type="number" step="any" min="0.01" class="form-control" name="cantidad" required placeholder="Ej: 5">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Bodega Afectada</label>
          <select class="form-select" name="bodegaId">
            ${warehouses.map(w => `<option value="${w.id}">${w.nombre}</option>`).join('')}
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Motivo o Justificación del Ajuste</label>
          <textarea class="form-control" name="observacion" required rows="2" placeholder="Ej: Conteo físico fin de mes o frasco quebrado en estiba"></textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Registrar Ajuste Manual de Inventario',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Aplicar Ajuste a Kardex',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#adjustment-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const productoId = formData.get('productoId');
            const cantidad = Number(formData.get('cantidad'));
            const tipo = formData.get('documentoTipo');
            const bodegaId = formData.get('bodegaId');
            const observacion = formData.get('observacion');

            const prod = products.find(p => p.id === productoId);

            await KardexService.registerMovement({
              tenantId,
              productoId,
              bodegaId,
              documentoTipo: tipo,
              documentoNumero: 'AJUSTE-' + Math.floor(1000 + Math.random() * 9000),
              cantidad,
              costoUnitario: prod.costoPromedio,
              observacion
            });

            Toast.success('Ajuste de inventario registrado en Kardex.');
            Modal.close();
            if (onComplete) onComplete();
          }
        }
      ]
    });
  },

  /**
   * Modal de Traslado entre Bodegas
   */
  openTransferModal(tenantId, products, warehouses, onComplete) {
    const content = `
      <form id="transfer-form">
        <div class="form-group mb-3">
          <label class="form-label">Producto a Trasladar</label>
          <select class="form-select" name="productoId" required>
            ${products.map(p => `
              <option value="${p.id}">${p.nombre} (Stock: ${p.stock} ${p.unidadMedida})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Origen</label>
            <select class="form-select" name="bodegaOrigenId" required>
              ${warehouses.map(w => `<option value="${w.id}">${w.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Destino</label>
            <select class="form-select" name="bodegaDestinoId" required>
              ${warehouses.map((w, idx) => `<option value="${w.id}" ${idx === 1 ? 'selected' : ''}>${w.nombre}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Cantidad a Trasladar</label>
          <input type="number" step="any" min="0.01" class="form-control" name="cantidad" required placeholder="Ej: 10">
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" name="observacion" rows="2" placeholder="Reabastecimiento de punto de venta"></textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Traslado de Mercancía entre Bodegas',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Ejecutar Traslado',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#transfer-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const productoId = formData.get('productoId');
            const origenId = formData.get('bodegaOrigenId');
            const destinoId = formData.get('bodegaDestinoId');
            const cantidad = Number(formData.get('cantidad'));
            const obs = formData.get('observacion') || 'Traslado entre bodegas';

            if (origenId === destinoId) {
              Toast.warning('La bodega de origen y destino no pueden ser la misma.');
              return;
            }

            const prod = products.find(p => p.id === productoId);
            const docNum = 'TR-' + Math.floor(1000 + Math.random() * 9000);

            // Registrar salida de bodega origen
            await KardexService.registerMovement({
              tenantId,
              productoId,
              bodegaId: origenId,
              documentoTipo: 'TRASLADO_SALIDA',
              documentoNumero: docNum,
              cantidad,
              costoUnitario: prod.costoPromedio,
              observacion: `Salida traslado hacia otra bodega. ${obs}`
            });

            // Registrar entrada en bodega destino
            await KardexService.registerMovement({
              tenantId,
              productoId,
              bodegaId: destinoId,
              documentoTipo: 'TRASLADO_ENTRADA',
              documentoNumero: docNum,
              cantidad,
              costoUnitario: prod.costoPromedio,
              observacion: `Entrada traslado desde bodega origen. ${obs}`
            });

            Toast.success('Traslado completado exitosamente.');
            Modal.close();
            if (onComplete) onComplete();
          }
        }
      ]
    });
  }
};
