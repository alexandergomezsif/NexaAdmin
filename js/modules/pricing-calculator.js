/**
 * Nexa ERP - Precios y márgenes
 *
 * Una sola pantalla para lo que antes era un asistente de 4 pasos:
 * - Tabla editable: costo por unidad y precio de cada lista (P1..P5) con su margen real.
 *   Se edita el precio en la celda y se guarda la fila.
 * - "Calcular" (por producto): costo base (promedio del Kardex o costo de la receta) + otros costos
 *   + merma → precio sugerido para cada lista según su margen objetivo. Una sola ventana.
 * - "Ajuste masivo": subir o bajar un % los precios de una lista.
 *
 * Definiciones (se muestran al usuario):
 * - Margen = (precio sin IVA − costo) ÷ precio sin IVA.
 * - Si la lista incluye IVA, el precio guardado lo incluye; el margen se calcula sobre la base sin IVA.
 * - Los precios sugeridos se redondean HACIA ARRIBA a múltiplos de $100 para no quedar por debajo del margen objetivo.
 */

import { AuditService } from '../services/audit-service.js';
import { PricingService } from '../services/pricing-service.js';
import { ProductionService } from '../services/production-service.js';
import { TAX_RATES } from '../services/tax-service.js';
import { DB, STORES } from '../services/db-service.js';
import { Formatters, esc } from '../utils/formatters.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

/** Margen objetivo por defecto de cada lista si aún no se ha definido uno. */
const DEFAULT_MARGINS = { P1: 50, P2: 38, P3: 28, P4: 18, P5: 15 };
const LOW_MARGIN = 10;   // % por debajo del cual el margen se marca en rojo
const WARN_MARGIN = 20;  // % por debajo del cual se marca en amarillo

const money = (v) => Formatters.currency(Math.round(Number(v) || 0));
const ceil100 = (v) => Math.ceil((Number(v) || 0) / 100) * 100;
const round100 = (v) => Math.round((Number(v) || 0) / 100) * 100;

export const PricingCalculatorModule = {
  tenantId: null,
  products: [],     // vendibles (no materia prima)
  lists: [],        // listas de precios ordenadas P1..P5
  recipesByProduct: {},
  filter: 'ALL',
  query: '',

  // ------------------------------------------------------------------ cálculos puros
  ivaRate(p) {
    const pct = p && p.ivaPct !== undefined && p.ivaPct !== null && p.ivaPct !== '' ? Number(p.ivaPct) : TAX_RATES.GENERAL * 100;
    return Number.isFinite(pct) ? pct / 100 : TAX_RATES.GENERAL;
  },
  costOf(p) { return Number(p.costoPromedio || p.costoEstimadoCalculadora || 0); },
  netOf(p, list, price) {
    const v = Number(price) || 0;
    return list.incluyeIva ? v / (1 + this.ivaRate(p)) : v;
  },
  marginPct(p, list, price, cost = this.costOf(p)) {
    const net = this.netOf(p, list, price);
    if (!(net > 0) || !(cost > 0)) return null;
    return ((net - cost) / net) * 100;
  },
  suggest(p, list, cost, marginPct) {
    const m = Math.min(95, Math.max(0, Number(marginPct) || 0)) / 100;
    if (!(cost > 0)) return 0;
    const net = cost / (1 - m);
    return ceil100(list.incluyeIva ? net * (1 + this.ivaRate(p)) : net);
  },
  targetMargin(list) {
    const v = Number(list.margenObjetivo);
    return Number.isFinite(v) && v > 0 ? v : (DEFAULT_MARGINS[PricingService.codeOf(list)] ?? 30);
  },
  marginClass(m) {
    if (m === null) return 'mg-none';
    if (m < LOW_MARGIN) return 'mg-bad';
    if (m < WARN_MARGIN) return 'mg-warn';
    return 'mg-ok';
  },
  marginLabel(m) { return m === null ? '—' : `${Math.round(m)}%`; },

  // ------------------------------------------------------------------ carga
  async load() {
    const tenant = TenantServiceInstance.getActiveTenant();
    this.tenantId = tenant ? tenant.id : null;
    const [products, recipes, lists] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, this.tenantId),
      DB.getAll(STORES.RECIPES_BOM, this.tenantId),
      DB.getAll(STORES.PRICE_LISTS, this.tenantId)
    ]);
    this.products = products
      .filter(p => p.tipoItem !== 'MATERIA_PRIMA' && p.estado !== 'INACTIVO')
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
    this.lists = lists
      .filter(l => PricingService.codeOf(l))
      .sort((a, b) => String(PricingService.codeOf(a)).localeCompare(String(PricingService.codeOf(b))));
    this.recipesByProduct = {};
    recipes.filter(r => r.productoTerminadoId && r.estado !== 'INACTIVO')
      .forEach(r => { if (!this.recipesByProduct[r.productoTerminadoId]) this.recipesByProduct[r.productoTerminadoId] = r; });
  },

  async render(container) {
    await this.load();
    this.renderMainView(container);

    // Llegada desde la Bóveda con una fórmula elegida
    const incomingRaw = sessionStorage.getItem('nexa_target_pricing_formula');
    if (incomingRaw) {
      sessionStorage.removeItem('nexa_target_pricing_formula');
      try {
        const formula = JSON.parse(incomingRaw);
        const prod = this.products.find(p => p.id === formula.productoTerminadoId) || null;
        this.openCalculator(container, prod, formula);
      } catch (e) {
        console.error(e);
      }
    }
  },

  rowStatus(p) {
    const cost = this.costOf(p);
    const margins = this.lists.map(l => this.marginPct(p, l, PricingService.priceFor(p, l.id), cost));
    const missing = this.lists.some(l => !PricingService.priceFor(p, l.id));
    const low = margins.some(m => m !== null && m < LOW_MARGIN);
    return { missing, low, margins };
  },

  visibleProducts() {
    const q = this.query.trim().toLowerCase();
    return this.products.filter(p => {
      if (q && !(`${p.nombre} ${p.sku || ''}`.toLowerCase().includes(q))) return false;
      if (this.filter === 'MISSING') return this.rowStatus(p).missing;
      if (this.filter === 'LOW') return this.rowStatus(p).low;
      if (this.filter === 'NOCOST') return !(this.costOf(p) > 0);
      return true;
    });
  },

  // ------------------------------------------------------------------ vista principal
  renderMainView(container) {
    const status = this.products.map(p => this.rowStatus(p));
    const missing = status.filter(s => s.missing).length;
    const low = status.filter(s => s.low).length;
    const noCost = this.products.filter(p => !(this.costOf(p) > 0)).length;
    const p1 = this.lists[0];
    const p1Margins = p1 ? this.products.map(p => this.marginPct(p, p1, PricingService.priceFor(p, p1.id))).filter(m => m !== null) : [];
    const avgP1 = p1Margins.length ? Math.round(p1Margins.reduce((a, b) => a + b, 0) / p1Margins.length) : null;

    const chip = (key, label, n) => `<button type="button" class="chip-filter ${this.filter === key ? 'active' : ''}" data-filter="${key}">${label}${n !== undefined ? ` <span class="chip-count">${n}</span>` : ''}</button>`;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Precios y márgenes</h1>
          <p>Edite un precio y guarde la fila, o use <strong>Calcular</strong> para sugerir los precios de todas las listas según el margen.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-pricing-bulk">Ajuste masivo %</button>
          <button class="btn btn-primary btn-sm" id="btn-pricing-simulate">Simular un precio</button>
        </div>
      </div>

      <div class="pricing-summary mb-3">
        <div><span class="ps-value">${this.products.length}</span><span class="ps-label">productos a la venta</span></div>
        <div><span class="ps-value ${missing ? 'text-warning' : ''}">${missing}</span><span class="ps-label">con alguna lista sin precio</span></div>
        <div><span class="ps-value ${low ? 'text-danger' : ''}">${low}</span><span class="ps-label">con margen menor a ${LOW_MARGIN}%</span></div>
        <div><span class="ps-value">${avgP1 === null ? '—' : avgP1 + '%'}</span><span class="ps-label">margen promedio ${esc(p1 ? PricingService.codeOf(p1) : '')}</span></div>
      </div>

      <div class="card">
        <div class="pricing-toolbar">
          <input type="search" class="form-control" id="pricing-search" placeholder="Buscar producto o SKU…" value="${esc(this.query)}" style="max-width: 280px;">
          <div class="chip-group">
            ${chip('ALL', 'Todos')}
            ${chip('MISSING', 'Sin precio', missing)}
            ${chip('LOW', 'Margen bajo', low)}
            ${chip('NOCOST', 'Sin costo', noCost)}
          </div>
          <span class="text-xs text-muted pricing-legend">Margen = ganancia ÷ precio sin IVA ·
            <span class="mg mg-ok">≥${WARN_MARGIN}%</span> <span class="mg mg-warn">${LOW_MARGIN}–${WARN_MARGIN}%</span> <span class="mg mg-bad">&lt;${LOW_MARGIN}%</span></span>
        </div>
        <div class="table-responsive">
          <table class="table pricing-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Costo unit.</th>
                ${this.lists.map(l => `<th class="text-right" title="${esc(l.nombre)}">${esc(PricingService.codeOf(l))}<span class="th-sub">${l.incluyeIva ? 'con IVA' : 'sin IVA'}</span></th>`).join('')}
                <th></th>
              </tr>
            </thead>
            <tbody id="pricing-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderRows(container);

    container.querySelector('#pricing-search').addEventListener('input', (e) => { this.query = e.target.value; this.renderRows(container); });
    container.querySelectorAll('.chip-filter').forEach(b => b.addEventListener('click', () => { this.filter = b.dataset.filter; this.renderMainView(container); }));
    container.querySelector('#btn-pricing-simulate').addEventListener('click', () => this.openCalculator(container, null));
    container.querySelector('#btn-pricing-bulk').addEventListener('click', () => this.openBulkAdjust(container));
  },

  renderRows(container) {
    const tbody = container.querySelector('#pricing-tbody');
    const rows = this.visibleProducts();
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="${this.lists.length + 3}" class="text-center text-muted p-4">No hay productos con este filtro.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(p => {
      const cost = this.costOf(p);
      return `
        <tr data-pid="${esc(p.id)}">
          <td>
            <div class="pt-name">${esc(p.nombre)}</div>
            <div class="text-xs text-muted">${esc(p.sku || '')}${this.recipesByProduct[p.id] ? ' · con receta' : ''}</div>
          </td>
          <td class="text-right">${cost > 0 ? money(cost) : '<span class="mg mg-warn" title="Sin costo: registre una compra o una producción">sin costo</span>'}</td>
          ${this.lists.map(l => {
            const price = PricingService.priceFor(p, l.id);
            const m = this.marginPct(p, l, price, cost);
            return `<td class="text-right">
              <input type="number" min="0" step="100" class="price-cell" data-list="${esc(l.id)}" value="${price || ''}" placeholder="—" aria-label="${esc(l.nombre)}">
              <span class="mg ${this.marginClass(m)}">${this.marginLabel(m)}</span>
            </td>`;
          }).join('')}
          <td class="text-right nowrap">
            <button class="btn btn-primary btn-sm btn-row-save" hidden>Guardar</button>
            <button class="btn btn-secondary btn-sm btn-row-calc">Calcular</button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('tr[data-pid]').forEach(tr => {
      const p = this.products.find(x => x.id === tr.dataset.pid);
      const saveBtn = tr.querySelector('.btn-row-save');
      tr.querySelectorAll('.price-cell').forEach(inp => {
        inp.addEventListener('input', () => {
          const l = this.lists.find(x => x.id === inp.dataset.list);
          const m = this.marginPct(p, l, Number(inp.value));
          const badge = inp.nextElementSibling;
          badge.className = `mg ${this.marginClass(m)}`;
          badge.textContent = this.marginLabel(m);
          inp.classList.add('dirty');
          saveBtn.hidden = false;
        });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveBtn.click(); });
      });
      saveBtn.addEventListener('click', async () => {
        const changes = {};
        tr.querySelectorAll('.price-cell.dirty').forEach(inp => { changes[inp.dataset.list] = Math.max(0, Math.round(Number(inp.value) || 0)); });
        await this.savePrices(p.id, changes);
        Toast.success(`Precios de "${p.nombre}" guardados.`);
        await this.load();
        this.renderMainView(container);
      });
      tr.querySelector('.btn-row-calc').addEventListener('click', () => this.openCalculator(container, p));
    });
  },

  /** Guarda precios por id de lista (0 = quitar precio). */
  async savePrices(productId, changes, extra = {}) {
    const fresh = await DB.getById(STORES.PRODUCTS, productId);
    const antes = JSON.stringify(fresh.precios || {});
    const precios = { ...(fresh.precios || {}) };
    Object.entries(changes).forEach(([listId, v]) => { if (v > 0) precios[listId] = v; else delete precios[listId]; });
    Object.assign(fresh, extra, { precios });
    await DB.update(STORES.PRODUCTS, fresh);
    await AuditService.log({ modulo: 'Precios', accion: 'MODIFICAR', registroId: fresh.sku || fresh.id, campoModificado: 'Precios por lista', valorAnterior: antes, valorNuevo: JSON.stringify(precios) });
    return fresh;
  },

  // ------------------------------------------------------------------ calculadora (una sola ventana)
  async openCalculator(container, product, formula = null) {
    const p = product || { nombre: '', ivaPct: undefined, precios: {} };
    const recipe = formula || (product ? this.recipesByProduct[product.id] : null);
    let recipeCost = 0;
    if (recipe && recipe.id) {
      try {
        const lote = Number(recipe.rendimientoLote || recipe.cantidadProducir) || 1;
        recipeCost = (await ProductionService.calculateEstimatedCost(recipe.id, lote)).costoUnitarioEstimado || 0;
      } catch (e) { recipeCost = 0; }
    }
    const avgCost = product ? Number(product.costoPromedio || 0) : 0;
    const st = {
      base: formula && recipeCost ? recipeCost : (avgCost || Number(p.costoEstimadoCalculadora || 0) || recipeCost || 0),
      otros: 0,
      merma: 0,
      margins: Object.fromEntries(this.lists.map(l => [l.id, this.targetMargin(l)])),
      apply: Object.fromEntries(this.lists.map(l => [l.id, true]))
    };
    const total = () => ((Number(st.base) || 0) + (Number(st.otros) || 0)) * (1 + (Number(st.merma) || 0) / 100);

    const dialog = Modal.show({
      title: product ? `Calcular precios · ${product.nombre}` : 'Simular un precio (no se guarda)',
      size: 'lg',
      content: `
        <div class="calc-grid">
          <div class="calc-costs">
            <div class="form-group mb-2">
              <label class="form-label">Costo base por unidad</label>
              <input type="number" min="0" step="any" class="form-control" id="calc-base" value="${Math.round(st.base) || ''}" placeholder="0">
              <div class="calc-quick">
                ${avgCost > 0 ? `<button type="button" class="btn btn-secondary btn-sm" data-cost="${avgCost}">Costo promedio ${money(avgCost)}</button>` : ''}
                ${recipeCost > 0 ? `<button type="button" class="btn btn-secondary btn-sm" data-cost="${recipeCost}">Receta ${money(recipeCost)}</button>` : ''}
              </div>
            </div>
            <div class="form-group mb-2">
              <label class="form-label">Otros costos por unidad <span class="text-muted">(opcional)</span></label>
              <input type="number" min="0" step="any" class="form-control" id="calc-otros" placeholder="Empaque, mano de obra, transporte…">
            </div>
            <div class="form-group mb-2">
              <label class="form-label">Merma % <span class="text-muted">(opcional)</span></label>
              <input type="number" min="0" max="50" step="0.5" class="form-control" id="calc-merma" placeholder="0">
            </div>
            <div class="calc-total">
              <span>Costo total por unidad</span>
              <strong id="calc-total"></strong>
            </div>
          </div>
          <div class="calc-lists">
            <table class="table calc-table">
              <thead><tr>${product ? '<th></th>' : ''}<th>Lista</th><th class="text-right">Margen %</th><th class="text-right">Sugerido</th>${product ? '<th class="text-right">Actual</th>' : ''}</tr></thead>
              <tbody>
                ${this.lists.map(l => `
                  <tr data-list="${esc(l.id)}">
                    ${product ? `<td><input type="checkbox" class="calc-apply" checked aria-label="Aplicar ${esc(l.nombre)}"></td>` : ''}
                    <td><strong>${esc(PricingService.codeOf(l))}</strong> <span class="text-xs text-muted">${esc(String(l.nombre).replace(/^P\d\s*-\s*/, ''))}</span>
                      <div class="text-xs text-muted">${l.incluyeIva ? 'precio con IVA' : 'precio sin IVA'}</div></td>
                    <td class="text-right"><input type="number" min="0" max="95" step="1" class="calc-margin" value="${st.margins[l.id]}"></td>
                    <td class="text-right"><strong class="calc-sug"></strong></td>
                    ${product ? `<td class="text-right calc-cur"></td>` : ''}
                  </tr>`).join('')}
              </tbody>
            </table>
            <p class="text-xs text-muted mb-0">Margen = ganancia ÷ precio sin IVA. Los sugeridos se redondean hacia arriba a $100.
              Los márgenes que escriba quedan como objetivo de cada lista.</p>
          </div>
        </div>`,
      footerButtons: [
        { label: product ? 'Cancelar' : 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() },
        ...(product ? [{
          label: 'Aplicar precios', class: 'btn-primary', onClick: async (dlg, ev) => {
            const cost = total();
            if (!(cost > 0)) { Toast.warning('Escriba el costo por unidad.'); return; }
            ev.target.disabled = true;
            const changes = {};
            this.lists.forEach(l => { if (st.apply[l.id]) changes[l.id] = this.suggest(p, l, cost, st.margins[l.id]); });
            if (!Object.keys(changes).length) { Toast.warning('Marque al menos una lista.'); ev.target.disabled = false; return; }
            await this.savePrices(product.id, changes, { costoEstimadoCalculadora: Math.round(cost * 100) / 100 });
            for (const l of this.lists) {
              if (Number(l.margenObjetivo) !== Number(st.margins[l.id])) {
                const fresh = await DB.getById(STORES.PRICE_LISTS, l.id);
                if (fresh) { fresh.margenObjetivo = Number(st.margins[l.id]); await DB.update(STORES.PRICE_LISTS, fresh); }
              }
            }
            Modal.close();
            Toast.success(`Precios de "${product.nombre}" actualizados.`);
            await this.load();
            this.renderMainView(container);
          }
        }] : [])
      ]
    });

    const $ = (s) => dialog.querySelector(s);
    const refresh = () => {
      const cost = total();
      $('#calc-total').textContent = cost > 0 ? money(cost) : '—';
      dialog.querySelectorAll('.calc-table tbody tr').forEach(tr => {
        const l = this.lists.find(x => x.id === tr.dataset.list);
        const sug = this.suggest(p, l, cost, st.margins[l.id]);
        tr.querySelector('.calc-sug').textContent = sug ? money(sug) : '—';
        const cur = tr.querySelector('.calc-cur');
        if (cur) {
          const price = PricingService.priceFor(p, l.id);
          const m = this.marginPct(p, l, price, cost);
          cur.innerHTML = price ? `${money(price)} <span class="mg ${this.marginClass(m)}">${this.marginLabel(m)}</span>` : '<span class="text-muted">—</span>';
        }
      });
    };
    $('#calc-base').addEventListener('input', (e) => { st.base = Number(e.target.value) || 0; refresh(); });
    $('#calc-otros').addEventListener('input', (e) => { st.otros = Number(e.target.value) || 0; refresh(); });
    $('#calc-merma').addEventListener('input', (e) => { st.merma = Number(e.target.value) || 0; refresh(); });
    dialog.querySelectorAll('.calc-quick [data-cost]').forEach(b => b.addEventListener('click', () => {
      st.base = Number(b.dataset.cost); $('#calc-base').value = Math.round(st.base); refresh();
    }));
    dialog.querySelectorAll('.calc-table tbody tr').forEach(tr => {
      tr.querySelector('.calc-margin').addEventListener('input', (e) => { st.margins[tr.dataset.list] = Number(e.target.value) || 0; refresh(); });
      const chk = tr.querySelector('.calc-apply');
      if (chk) chk.addEventListener('change', () => { st.apply[tr.dataset.list] = chk.checked; });
    });
    refresh();
  },

  // ------------------------------------------------------------------ ajuste masivo
  openBulkAdjust(container) {
    if (!this.lists.length) { Toast.warning('No hay listas de precios configuradas.'); return; }
    const visible = this.visibleProducts();
    const dialog = Modal.show({
      title: 'Ajuste masivo de precios',
      size: 'md',
      content: `
        <div class="form-group mb-2">
          <label class="form-label">Lista</label>
          <select class="form-select" id="bulk-list">${this.lists.map(l => `<option value="${esc(l.id)}">${esc(l.nombre)}</option>`).join('')}</select>
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Cambio en % (use negativo para bajar)</label>
          <input type="number" step="0.5" class="form-control" id="bulk-pct" value="5">
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Aplicar a</label>
          <select class="form-select" id="bulk-scope">
            <option value="visible">Productos que se ven en la tabla (${visible.length})</option>
            <option value="all">Todos los productos a la venta (${this.products.length})</option>
          </select>
        </div>
        <p class="text-xs text-muted">Solo cambian los productos que ya tienen precio en esa lista. Se redondea a $100.</p>
        <div id="bulk-preview" class="text-xs"></div>`,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Aplicar', class: 'btn-primary', onClick: async (dlg, ev) => {
            const { listId, changes } = plan();
            if (!changes.length) { Toast.warning('No hay precios para cambiar.'); return; }
            ev.target.disabled = true;
            await DB.runTransaction([STORES.PRODUCTS], async (tx) => {
              for (const c of changes) {
                const prod = await tx.get(STORES.PRODUCTS, c.id);
                if (!prod) continue;
                prod.precios = { ...(prod.precios || {}), [listId]: c.nuevo };
                await tx.put(STORES.PRODUCTS, prod);
              }
            });
            await AuditService.log({ modulo: 'Precios', accion: 'MODIFICAR', registroId: listId, campoModificado: 'Ajuste masivo', valorNuevo: `${dlg.querySelector('#bulk-pct').value}% en ${changes.length} productos` });
            Modal.close();
            Toast.success(`${changes.length} precios actualizados.`);
            await this.load();
            this.renderMainView(container);
          }
        }
      ]
    });
    const plan = () => {
      const listId = dialog.querySelector('#bulk-list').value;
      const pct = Number(dialog.querySelector('#bulk-pct').value) || 0;
      const scope = dialog.querySelector('#bulk-scope').value === 'all' ? this.products : visible;
      const changes = scope
        .map(p => ({ id: p.id, nombre: p.nombre, actual: PricingService.priceFor(p, listId) }))
        .filter(c => c.actual > 0)
        .map(c => ({ ...c, nuevo: Math.max(100, round100(c.actual * (1 + pct / 100))) }))
        .filter(c => c.nuevo !== c.actual);
      return { listId, changes };
    };
    const preview = () => {
      const { changes } = plan();
      dialog.querySelector('#bulk-preview').innerHTML = changes.length
        ? `<strong>${changes.length} precios cambiarán.</strong> Ejemplos:<br>${changes.slice(0, 4).map(c => `${esc(c.nombre)}: ${money(c.actual)} → <strong>${money(c.nuevo)}</strong>`).join('<br>')}`
        : 'Ningún precio cambia con estos valores.';
    };
    dialog.querySelectorAll('#bulk-list, #bulk-pct, #bulk-scope').forEach(el => el.addEventListener('input', preview));
    preview();
  }
};
