/**
 * Nexa ERP - Módulo 4: Control de Inventario & Kardex Multibodega
 * Historial ponderado de movimientos, traslados entre bodegas y ajustes manuales
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters, esc } from '../utils/formatters.js';
import { KardexService, MOVEMENT_TYPES, KARDEX_TX_STORES, LotService } from '../services/kardex-service.js';
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
          <h1>Inventario y Kardex</h1>
          <p>Entradas, salidas, consumos de producción y ajustes, al costo promedio</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-inventory-adjustment">Ajuste manual</button>
          <button class="btn btn-primary btn-sm" id="btn-inventory-transfer">Traslado de bodega</button>
        </div>
      </div>

      <!-- RESUMEN -->
      <div class="pricing-summary stat-strip mb-3">
        <div><span class="ps-value">${Formatters.currency(products.reduce((a, p) => a + Math.max(0, Number(p.stock || 0)) * Number(p.costoPromedio || 0), 0))}</span><span class="ps-label">valor del inventario al costo</span></div>
        <div><span class="ps-value">${products.length}</span><span class="ps-label">referencias</span></div>
        <div><span class="ps-value ${products.some(p => Number(p.stockMinimo || 0) > 0 && Number(p.stock || 0) <= Number(p.stockMinimo || 0)) ? 'text-warning' : ''}">${products.filter(p => Number(p.stockMinimo || 0) > 0 && Number(p.stock || 0) <= Number(p.stockMinimo || 0)).length}</span><span class="ps-label">en o bajo el mínimo</span></div>
        <div><span class="ps-value ${products.some(p => Number(p.stock || 0) <= 0) ? 'text-danger' : ''}">${products.filter(p => Number(p.stock || 0) <= 0).length}</span><span class="ps-label">sin existencias</span></div>
      </div>

      <!-- TABS: KARDEX VS EXISTENCIAS -->
      <div class="chip-group mb-3">
        <button type="button" class="chip-filter tab-btn active" data-tab="kardex">Movimientos <span class="chip-count">${movements.length}</span></button>
        <button type="button" class="chip-filter tab-btn" data-tab="stocks">Existencias <span class="chip-count">${products.length}</span></button>
        <button type="button" class="chip-filter tab-btn" data-tab="lots">Lotes y vencimientos ${(() => { const n = products.reduce((a, p) => a + (p.lotes || []).filter(l => { const d = LotService.daysToExpire(l); return d !== null && d <= 30; }).length, 0); return n ? `<span class="chip-count" style="color: var(--color-danger);">${n} por vencer o vencidos</span>` : ''; })()}</button>
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
                <strong>${esc(val)}</strong>
                <div class="text-xs text-muted">SKU: ${esc(row.sku || '-')}</div>
              </div>
            `
          },
          {
            key: 'bodegaNombre',
            title: 'Bodega',
            render: val => `<span class="badge badge-neutral">${esc(val)}</span>`
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
                  <div class="text-xs text-muted">Doc: ${esc(row.documentoNumero)}</div>
                </div>
              `;
            }
          },
          {
            key: 'cantidadEntrada',
            title: 'Entrada',
            render: val => val > 0 ? `<strong class="text-success">+${esc(val)}</strong>` : '-'
          },
          {
            key: 'cantidadSalida',
            title: 'Salida',
            render: val => val > 0 ? `<strong class="text-danger">-${esc(val)}</strong>` : '-'
          },
          {
            key: 'saldoCantidad',
            title: 'Saldo Final',
            render: val => `<strong>${esc(val)}</strong>`
          },
          {
            key: 'costoUnitario',
            title: 'Costo Unit.',
            render: val => Formatters.currency(val)
          },
          {
            key: 'lotes',
            title: 'Lote',
            render: val => (val && val.length) ? val.map(l => `<span class="badge badge-neutral" title="${esc(l.cantidad)}">${esc(l.codigo)}</span>`).join(' ') : '<span class="text-muted">—</span>'
          },
          {
            key: 'observacion',
            title: 'Observaciones',
            render: val => `<span class="text-xs text-muted">${esc(val || '-')}</span>`
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
            render: val => `<strong>${esc(val)}</strong>`
          },
          {
            key: 'nombre',
            title: 'Nombre Producto',
            render: (val, row) => `${esc(val)} <span class="text-xs text-muted">(${esc(row.unidadMedida)})</span>`
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
              return `<span class="badge ${cls}">${stock} ${esc(row.unidadMedida)}</span>`;
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
        else if (tab === 'lots') this.renderLots(container.querySelector('#inventory-content-area'), tenantId, products);
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
   * Lotes en existencia, vencimientos y rastreo de un lote hasta los clientes.
   */
  async renderLots(target, tenantId, products) {
    const rows = [];
    products.forEach(p => {
      (p.lotes || []).forEach(l => rows.push({ p, l, d: LotService.daysToExpire(l) }));
      const sin = LotService.unlotted(p);
      if (sin > 0 && (p.lotes || []).length) rows.push({ p, l: { codigo: 'Sin lote', cantidad: sin }, d: null, sinLote: true });
    });
    rows.sort((a, b) => (a.d === null ? 99999 : a.d) - (b.d === null ? 99999 : b.d));
    const estado = (d) => d === null ? '<span class="text-muted">sin fecha</span>'
      : d < 0 ? `<span class="mg mg-bad">vencido hace ${-d} d</span>`
      : d <= 30 ? `<span class="mg mg-warn">vence en ${d} d</span>` : `<span class="mg mg-ok">${d} d</span>`;
    target.innerHTML = `
      <div class="card mb-3">
        <div class="pricing-toolbar">
          <strong>Rastrear un lote</strong>
          <input type="search" class="form-control" id="lot-trace-inp" placeholder="Código de lote, p. ej. LOTE-RAYO-S-0001" style="max-width: 320px;">
          <button class="btn btn-primary btn-sm" id="lot-trace-btn">Buscar</button>
          <span class="text-xs text-muted">Muestra la producción y a qué clientes se vendió.</span>
        </div>
        <div id="lot-trace-result"></div>
      </div>
      <div class="card">
        <div class="table-responsive">
          <table class="table pricing-table">
            <thead><tr><th>Producto</th><th>Lote</th><th class="text-right">Existencia</th><th>Producido</th><th>Vence</th><th>Estado</th></tr></thead>
            <tbody>
              ${rows.length ? rows.map(r => `
                <tr>
                  <td><strong>${esc(r.p.nombre)}</strong> <span class="text-xs text-muted">${esc(r.p.sku || '')}</span></td>
                  <td>${r.sinLote ? '<span class="text-muted">Sin lote (inventario anterior)</span>' : `<a href="#" class="lot-link" data-lot="${esc(r.l.codigo)}">${esc(r.l.codigo)}</a>`}</td>
                  <td class="text-right">${esc(r.l.cantidad)} ${esc(r.p.unidadMedida || '')}</td>
                  <td>${esc(r.l.fecha || '—')}</td>
                  <td>${esc(r.l.vence || '—')}</td>
                  <td>${r.sinLote ? '' : estado(r.d)}</td>
                </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted p-4">Aún no hay lotes. Se crean al registrar una producción.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
    const trace = async (code) => {
      const box = target.querySelector('#lot-trace-result');
      code = String(code || '').trim();
      if (!code) { box.innerHTML = ''; return; }
      const [orders, sales] = await Promise.all([DB.getAll(STORES.PRODUCTION_ORDERS, tenantId), DB.getAll(STORES.SALES, tenantId)]);
      const ord = orders.filter(o => String(o.loteCodigo || '').toLowerCase() === code.toLowerCase());
      const hits = [];
      sales.forEach(s => (s.items || []).forEach(it => (it.lotes || []).forEach(l => {
        if (String(l.codigo).toLowerCase() === code.toLowerCase()) hits.push({ s, it, l });
      })));
      box.innerHTML = `
        <div class="p-3 text-sm">
          ${ord.length ? ord.map(o => `<div class="mb-2">Producción <strong>${esc(o.numeroOrden)}</strong> · ${esc(o.productoTerminadoNombre)} · ${esc(o.cantidadProducida)} und · ${esc(Formatters.date(o.fechaFin || o.fechaInicio))}${o.fechaVencimiento ? ` · vence ${esc(o.fechaVencimiento)}` : ''}</div>`).join('') : '<div class="mb-2 text-muted">No se encontró una orden de producción con ese lote.</div>'}
          ${hits.length ? `
            <table class="table table-sm pricing-table">
              <thead><tr><th>Documento</th><th>Fecha</th><th>Cliente</th><th>NIT/CC</th><th class="text-right">Cantidad</th><th>Estado</th></tr></thead>
              <tbody>${hits.map(h => `<tr><td>${esc(h.s.consecutivo)}</td><td>${esc(Formatters.date(h.s.fecha))}</td><td>${esc(h.s.clienteNombre)}</td><td>${esc(h.s.clienteNit || '')}</td><td class="text-right">${esc(h.l.cantidad)}</td><td>${esc(h.s.estado)}</td></tr>`).join('')}</tbody>
            </table>` : '<div class="text-muted">Ninguna venta registrada con ese lote.</div>'}
        </div>`;
    };
    target.querySelector('#lot-trace-btn').addEventListener('click', () => trace(target.querySelector('#lot-trace-inp').value));
    target.querySelector('#lot-trace-inp').addEventListener('keydown', (e) => { if (e.key === 'Enter') trace(e.target.value); });
    target.querySelectorAll('.lot-link').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault(); target.querySelector('#lot-trace-inp').value = a.dataset.lot; trace(a.dataset.lot);
    }));
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
              <option value="${p.id}">${esc(p.nombre)} (SKU: ${esc(p.sku)} | Stock: ${p.stock} ${esc(p.unidadMedida)})</option>
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
            ${warehouses.map(w => `<option value="${w.id}">${esc(w.nombre)}</option>`).join('')}
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

            try {
              await DB.runTransaction([...KARDEX_TX_STORES, STORES.SYSTEM_PARAMS], async (tx) => {
                const n = await tx.nextSequence(tenantId, 'AJUSTE');
                await KardexService.applyMovement(tx, {
                  tenantId, productoId, bodegaId, documentoTipo: tipo,
                  documentoNumero: `AJ-${String(n).padStart(6, '0')}`, cantidad, observacion
                });
              });
            } catch (err) {
              Toast.error(err.message);
              return;
            }
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
      <div class="alert alert-info text-xs mb-3">El inventario se controla como una sola existencia por producto. El traslado deja trazabilidad de la ubicación en el Kardex pero no cambia el stock total.</div>
      <form id="transfer-form">
        <div class="form-group mb-3">
          <label class="form-label">Producto a Trasladar</label>
          <select class="form-select" name="productoId" required>
            ${products.map(p => `
              <option value="${p.id}">${esc(p.nombre)} (Stock: ${p.stock} ${esc(p.unidadMedida)})</option>
            `).join('')}
          </select>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Origen</label>
            <select class="form-select" name="bodegaOrigenId" required>
              ${warehouses.map(w => `<option value="${w.id}">${esc(w.nombre)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Destino</label>
            <select class="form-select" name="bodegaDestinoId" required>
              ${warehouses.map((w, idx) => `<option value="${w.id}" ${idx === 1 ? 'selected' : ''}>${esc(w.nombre)}</option>`).join('')}
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
      title: 'Traslado de mercancía entre bodegas',
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

            try {
              await DB.runTransaction([...KARDEX_TX_STORES, STORES.SYSTEM_PARAMS], async (tx) => {
                const n = await tx.nextSequence(tenantId, 'TRASLADO');
                const docNum = `TR-${String(n).padStart(6, '0')}`;
                const salida = await KardexService.applyMovement(tx, { tenantId, productoId, bodegaId: origenId, documentoTipo: 'TRASLADO_SALIDA', documentoNumero: docNum, cantidad, observacion: `Salida por traslado. ${obs}` });
                // Los lotes viajan con la mercancía
                await KardexService.applyMovement(tx, { tenantId, productoId, bodegaId: destinoId, documentoTipo: 'TRASLADO_ENTRADA', documentoNumero: docNum, cantidad, lotes: salida.lotes, observacion: `Entrada por traslado. ${obs}` });
              });
            } catch (err) {
              Toast.error(err.message);
              return;
            }
            Toast.success('Traslado registrado (trazabilidad entre bodegas).');
            Modal.close();
            if (onComplete) onComplete();
          }
        }
      ]
    });
  }
};
