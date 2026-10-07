/**
 * Nexa ERP - Módulo 7: Terminal de Ventas (POS)
 *
 * - Búsqueda por SKU / nombre / lector de código de barras (Enter agrega coincidencia exacta)
 * - Listas de precios P1..P5 (con o sin IVA incluido según la lista)
 * - Precios especiales por cliente, vendedor freelance con comisión en vivo
 * - Venta de contado (exige caja abierta), venta a crédito (exige cupo) y cotización
 * - Historial con reimpresión, comprobantes de pago y ANULACIÓN auditada
 *
 * La lógica transaccional vive en services/sales-service.js; este módulo es solo interfaz.
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters, esc } from '../utils/formatters.js';
import { TaxService } from '../services/tax-service.js';
import { CashService } from '../services/cash-service.js';
import { ExportService } from '../services/export-service.js';
import { PricingService } from '../services/pricing-service.js';
import { SalesService, DOC_TYPES, LEGACY_DOC_LABELS } from '../services/sales-service.js';
import { AuthServiceInstance, PERMISSIONS, ROLES } from '../services/auth-service.js';
import { PrintTemplates } from '../components/print-template.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';
import { ClientsModule } from './clients.js';

const MOSTRADOR_NIT = '222222222222';

export const SalesPosModule = {
  cart: [],
  selectedClientId: null,
  selectedPriceListId: null,
  selectedFreelancerId: null,
  currentReceipt: null,
  processing: false,
  _keysBound: false,
  _ctx: null,

  canAnnul() {
    const u = AuthServiceInstance.getCurrentUser();
    return AuthServiceInstance.isDeveloper() || (u && u.rol === ROLES.GERENTE) || AuthServiceInstance.hasPermission(PERMISSIONS.AUTORIZAR);
  },

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant.id;

    const [allProducts, clients, priceLists, currentShift, suppliers] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.CUSTOMERS, tenantId),
      DB.getAll(STORES.PRICE_LISTS, tenantId),
      CashService.getCurrentShift(tenantId),
      DB.getAll(STORES.SUPPLIERS, tenantId)
    ]);
    priceLists.sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const freelancers = suppliers.filter(s => s.tipo === 'FREELANCER' && s.estado === 'ACTIVO');
    const products = allProducts.filter(p => (p.tipoItem === 'PRODUCTO_TERMINADO' || !p.tipoItem) && p.estado !== 'INACTIVO');

    if (this._ctx && this._ctx.tenantId !== tenantId) {
      this.cart = []; this.selectedClientId = null; this.selectedPriceListId = null; this.selectedFreelancerId = null;
    }
    if (!this.selectedClientId || !clients.find(c => c.id === this.selectedClientId)) {
      const mostrador = clients.find(c => c.nitCc === MOSTRADOR_NIT);
      this.selectedClientId = mostrador ? mostrador.id : (clients[0] ? clients[0].id : null);
      this.applyClientDefaults(clients, priceLists, freelancers);
    }
    if (!this.selectedPriceListId || !priceLists.find(pl => pl.id === this.selectedPriceListId)) {
      this.selectedPriceListId = (PricingService.defaultList(priceLists) || {}).id || null;
    }
    this._ctx = { tenantId, tenant, products, clients, priceLists, freelancers, currentShift, container };

    const shiftSales = currentShift
      ? ['totalVentasEfectivo', 'totalVentasTransferencia', 'totalVentasNequiDaviplata', 'totalVentasTarjeta'].reduce((a, k) => a + Number(currentShift[k] || 0), 0)
      : 0;

    container.innerHTML = `
      <div class="pos-kpi-bar">
        <div class="pos-kpi-card">
          <div class="pos-kpi-title">Ventas del turno</div>
          <div class="pos-kpi-amount" style="color: var(--text-main);">${Formatters.currency(shiftSales)}</div>
          <div class="text-xs" style="color: var(--text-secondary);">${currentShift ? `🟢 Turno de ${esc(currentShift.usuarioNombre || '-')}` : '🔴 Caja cerrada'}</div>
        </div>
        <div class="pos-kpi-card">
          <div class="pos-kpi-title">Efectivo esperado en caja</div>
          <div class="pos-kpi-amount text-financial">${Formatters.currency(currentShift ? currentShift.saldoEsperado : 0)}</div>
          <div class="text-xs" style="color: var(--text-secondary);">Base + ventas en efectivo + movimientos</div>
        </div>
        <div class="pos-kpi-card" style="cursor: pointer;" id="pos-open-history" title="Ver historial de ventas">
          <div class="pos-kpi-title">Historial de ventas</div>
          <div class="pos-kpi-amount" style="color: var(--brand-primary); font-size: 18px;">📜 Abrir</div>
          <div class="text-xs" style="color: var(--text-secondary);">Reimprimir, comprobantes, anular</div>
        </div>
      </div>

      ${currentShift ? '' : `
        <div class="alert alert-warning mb-3" style="font-size: 12.5px;">
          ⚠️ No hay turno de caja abierto. Solo puede registrar <strong>cotizaciones</strong> y <strong>ventas a crédito</strong>.
          <a href="#cash" style="font-weight: 700; margin-left: 6px;">Abrir caja →</a>
        </div>`}

      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;" class="pos-layout">
        <div class="d-flex flex-col gap-3">
          <div class="card" style="margin-bottom: 0;">
            <div class="card-body" style="padding: 14px 16px;">
              <div class="form-row">
                <div class="form-group mb-0" style="flex: 2;">
                  <label class="form-label text-xs font-bold">BUSCAR PRODUCTO (SKU / CÓDIGO / NOMBRE) — F2</label>
                  <input type="text" id="pos-search-product" class="form-control" placeholder="Escriba o escanee y presione Enter..." autocomplete="off">
                </div>
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold">LISTA DE PRECIOS</label>
                  <select class="form-select" id="pos-select-pricelist">
                    ${priceLists.map(pl => `<option value="${esc(pl.id)}" ${pl.id === this.selectedPriceListId ? 'selected' : ''}>${esc(pl.nombre)}${pl.incluyeIva ? ' (IVA incl.)' : ''}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 0; flex: 1;">
            <div class="card-header" style="padding: 10px 16px;">
              <div class="card-title" style="font-size: 13px;">⚡ Catálogo (${products.length})</div>
            </div>
            <div class="card-body" style="padding: 10px 12px;">
              <div id="pos-product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; max-height: 420px; overflow-y: auto;"></div>
            </div>
          </div>
        </div>

        <div class="card d-flex flex-col" style="margin-bottom: 0;">
          <div class="card-header" style="padding: 10px 14px;">
            <div style="width: 100%;">
              <div class="d-flex justify-between items-center mb-1">
                <div class="card-title" style="font-size: 13px;">🛒 Detalle de la venta</div>
                <div class="d-flex gap-1">
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-clear-cart" style="padding: 2px 8px; font-size: 11px;">🗑️ Limpiar</button>
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-pos-add-client" style="padding: 2px 8px; font-size: 11px;">+ Cliente</button>
                </div>
              </div>
              <select class="form-select mb-1" id="pos-select-client" style="font-size: 12px; font-weight: 700; padding: 4px 8px;">
                ${clients.map(c => `<option value="${esc(c.id)}" ${c.id === this.selectedClientId ? 'selected' : ''}>${esc(c.nombre)} (${esc(c.tipoCliente || '-')}) · Saldo ${Formatters.currency(c.saldoPendiente || 0)}</option>`).join('')}
              </select>
              <div class="d-flex justify-between items-center text-xs text-muted" style="font-size: 10.5px;">
                <span id="pos-client-credit"></span>
                <span id="pos-iva-status" class="badge badge-success"></span>
              </div>
            </div>
          </div>

          <div class="card-body p-0" style="flex: 1; max-height: 280px; overflow-y: auto;">
            <table class="table table-sm text-xs">
              <thead>
                <tr>
                  <th>Ítem</th>
                  <th class="text-center" style="width: 60px;">Cant</th>
                  <th class="text-right" style="width: 150px;">Precio</th>
                  <th class="text-right" style="width: 85px;">Total</th>
                  <th style="width: 30px;"></th>
                </tr>
              </thead>
              <tbody id="pos-cart-tbody"></tbody>
            </table>
          </div>

          <div class="card-footer" style="padding: 12px 14px;">
            <div class="d-flex justify-between text-xs mb-1"><span>Base (antes de IVA):</span><strong id="pos-lbl-subtotal">$ 0</strong></div>
            <div class="d-flex justify-between text-xs mb-1"><span>IVA:</span><span id="pos-lbl-iva">$ 0</span></div>
            <div class="d-flex justify-between mb-2" style="font-size: 16px; font-weight: 800; color: var(--brand-primary); border-top: 1px dashed var(--border-color); padding-top: 4px;">
              <span>TOTAL:</span><span id="pos-lbl-total">$ 0</span>
            </div>

            <div class="form-group mb-2">
              <label class="form-label text-xs font-bold">TIPO DE DOCUMENTO</label>
              <select class="form-select" id="pos-doc-type" style="padding: 4px 8px; font-size: 11.5px; font-weight: 700;">
                ${Object.entries(DOC_TYPES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('')}
              </select>
            </div>

            <div class="form-row mb-2" id="pos-payment-row">
              <div class="form-group mb-0" style="flex: 1.2;">
                <label class="form-label text-xs font-bold">MÉTODO DE PAGO</label>
                <select class="form-select" id="pos-payment-method" style="padding: 4px 8px; font-size: 11.5px;">
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Nequi">📱 Nequi</option>
                  <option value="Daviplata">📱 Daviplata</option>
                  <option value="Transferencia">🏦 Transferencia</option>
                  <option value="Tarjeta">💳 Tarjeta</option>
                </select>
              </div>
              <div class="form-group mb-0" id="pos-received-wrap">
                <label class="form-label text-xs font-bold">Recibido ($)</label>
                <input type="number" min="0" step="100" class="form-control" id="pos-inp-received" placeholder="= total" style="padding: 4px 8px; font-size: 11.5px;">
              </div>
            </div>
            <div class="d-flex justify-between items-center text-xs mb-2" id="pos-change-row" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
              <span>Cambio:</span><strong class="text-success" id="pos-lbl-change">$ 0</strong>
            </div>

            <div id="pos-attachment-row" style="display: none; padding: 8px 10px; border-radius: 8px; border: 1px dashed var(--brand-primary); margin-bottom: 8px;">
              <div class="d-flex justify-between items-center mb-1">
                <span class="text-xs font-bold" style="color: var(--brand-primary);">📸 Comprobante de pago (opcional)</span>
              </div>
              <div class="d-flex gap-2 mb-1">
                <button type="button" class="btn btn-secondary btn-sm" id="pos-btn-upload-file" style="flex: 1; font-size: 11px;">📁 Subir imagen</button>
                <button type="button" class="btn btn-primary btn-sm" id="pos-btn-open-cam" style="flex: 1; font-size: 11px;">📷 Tomar foto</button>
                <input type="file" id="pos-inp-receipt-file" accept="image/*" style="display: none;">
              </div>
              <div id="pos-receipt-preview" style="display: none; align-items: center; justify-content: space-between; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); margin-top: 4px;">
                <div class="d-flex items-center gap-2">
                  <img id="pos-img-receipt-thumb" alt="Comprobante" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; cursor: pointer;">
                  <span class="text-xs font-bold text-success">✓ Comprobante listo</span>
                </div>
                <button type="button" class="btn btn-danger btn-sm" id="pos-btn-remove-receipt" style="padding: 2px 6px; font-size: 11px;">🗑️</button>
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="form-label text-xs font-bold">🤝 VENDEDOR FREELANCE</label>
              <select class="form-select" id="pos-select-freelancer" style="font-size: 11.5px; padding: 4px 8px; font-weight: 700;">
                <option value="">— Venta directa (sin vendedor freelance) —</option>
                ${freelancers.map(fl => {
                  const baseId = PricingService.freelanceBaseListId(priceLists, fl);
                  const base = priceLists.find(pl => pl.id === baseId);
                  return `<option value="${esc(fl.id)}" ${fl.id === this.selectedFreelancerId ? 'selected' : ''}>${esc(fl.nombre)} (${esc(fl.zona || 'Freelance')}) · base ${esc(PricingService.codeOf(base) || '-')}</option>`;
                }).join('')}
              </select>
            </div>

            <div id="pos-comision-panel" style="display: none; background: rgba(79, 197, 138, 0.12); border: 1.5px solid #4FC58A; border-radius: 10px; padding: 8px 12px; margin-bottom: 10px;">
              <div class="d-flex justify-between items-center">
                <div class="font-bold text-xs" style="color: #2f9e6a;">💰 Comisión del vendedor</div>
                <strong id="pos-lbl-comision" style="font-size: 18px; color: #2f9e6a;">$ 0</strong>
              </div>
              <div id="pos-comision-detalle" class="text-xs text-muted" style="margin-top: 4px;"></div>
            </div>

            <label class="d-flex items-center gap-2 text-xs mb-2" id="pos-shipping-wrap">
              <input type="checkbox" id="pos-chk-shipping"> Crear orden de despacho / rótulo de envío
            </label>

            <button class="btn btn-primary w-100" id="btn-process-sale" style="padding: 9px; font-size: 14px; font-weight: 700;">⚡ REGISTRAR (F4)</button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(container);
    this.renderProductGrid('');
    this.refreshClientInfo();
    this.updateDocTypeUI();
    this.bindKeys();
  },

  // ------------------------------------------------------------------ helpers de estado
  client() {
    return this._ctx ? this._ctx.clients.find(c => c.id === this.selectedClientId) || null : null;
  },

  freelancer() {
    return this._ctx ? this._ctx.freelancers.find(f => f.id === this.selectedFreelancerId) || null : null;
  },

  applyClientDefaults(clients, priceLists, freelancers) {
    const cli = clients.find(c => c.id === this.selectedClientId);
    const listId = cli ? PricingService.resolveListId(priceLists, cli.listaPreciosId) : null;
    this.selectedPriceListId = listId || (PricingService.defaultList(priceLists) || {}).id || null;
    const fl = cli && cli.vendedorFreelanceId ? freelancers.find(f => f.id === cli.vendedorFreelanceId) : null;
    this.selectedFreelancerId = fl ? fl.id : null;
  },

  /** Precio de un producto para el cliente/lista actuales. 0 = sin precio configurado. */
  priceFor(prod) {
    const cli = this.client();
    const esp = cli && cli.preciosEspeciales ? Number(cli.preciosEspeciales[prod.id]) : 0;
    if (esp > 0) return { price: esp, special: true };
    return { price: PricingService.priceFor(prod, this.selectedPriceListId), special: false };
  },

  repriceCart() {
    const { products } = this._ctx;
    this.cart.forEach(item => {
      const prod = products.find(p => p.id === item.productoId);
      if (!prod) return;
      const { price, special } = this.priceFor(prod);
      if (price > 0) { item.precioUnitario = price; item.precioEspecial = special; }
    });
  },

  // ------------------------------------------------------------------ catálogo
  renderProductGrid(query) {
    const { products, container } = this._ctx;
    const grid = container.querySelector('#pos-product-grid');
    const q = String(query || '').toLowerCase().trim();
    const list = q ? products.filter(p => String(p.nombre).toLowerCase().includes(q) || String(p.sku || '').toLowerCase().includes(q) || String(p.codigoBarras || '').includes(q)) : products;
    grid.innerHTML = list.length ? list.map(p => {
      const { price } = this.priceFor(p);
      const ok = Number(p.stock) > 0;
      return `
        <div class="pos-product-card card" data-product-id="${esc(p.id)}" style="cursor: ${ok ? 'pointer' : 'not-allowed'}; margin-bottom: 0; padding: 8px 10px; ${ok ? '' : 'opacity: 0.55;'}">
          <div class="text-xs font-bold" style="color: var(--brand-primary); font-size: 11px;">${esc(p.sku || '-')}</div>
          <div class="font-bold text-xs" style="margin: 2px 0; line-height: 1.2; height: 26px; overflow: hidden; font-size: 11.5px; color: var(--text-main);">${esc(p.nombre)}</div>
          <div class="d-flex justify-between items-center mt-1">
            <span class="text-xs font-bold" style="color: ${price > 0 ? 'var(--text-main)' : 'var(--color-danger)'};">${price > 0 ? Formatters.currency(price) : 'Sin precio'}</span>
            <span class="badge ${ok ? 'badge-success' : 'badge-danger'}" style="font-size: 9.5px; padding: 1px 5px;">${esc(p.stock)} un</span>
          </div>
        </div>`;
    }).join('') : '<div class="text-xs text-muted" style="padding: 16px;">Sin coincidencias.</div>';
  },

  addProductToCart(prodId) {
    const prod = this._ctx.products.find(p => p.id === prodId);
    if (!prod) return;
    const isQuote = this._ctx.container.querySelector('#pos-doc-type').value === 'COTIZACION';
    if (!isQuote && Number(prod.stock) <= 0) {
      Toast.warning(`${prod.nombre} está agotado.`);
      return;
    }
    const { price, special } = this.priceFor(prod);
    if (!(price > 0)) {
      Toast.warning(`"${prod.nombre}" no tiene precio en la lista seleccionada. Configúrelo en Catálogo.`);
      return;
    }
    const existing = this.cart.find(i => i.productoId === prod.id);
    if (existing) {
      if (!isQuote && existing.cantidad + 1 > Number(prod.stock)) {
        Toast.warning(`Solo hay ${prod.stock} unidades de ${prod.nombre}.`);
        return;
      }
      existing.cantidad += 1;
    } else {
      this.cart.push({ productoId: prod.id, sku: prod.sku, nombre: prod.nombre, precioUnitario: price, precioEspecial: special, cantidad: 1 });
    }
    this.updateCartView();
  },

  // ------------------------------------------------------------------ carrito y totales
  /** Tarifa de IVA del producto (19 % si no se definió). */
  ivaOf(productoId) {
    const p = (this._ctx.products || []).find(x => x.id === productoId);
    const v = p && p.ivaPct !== undefined && p.ivaPct !== null && p.ivaPct !== '' ? Number(p.ivaPct) : 19;
    return Number.isFinite(v) ? v : 19;
  },

  computeTotals() {
    const cli = this.client();
    const incl = PricingService.listIncludesIva(this._ctx.priceLists, this.selectedPriceListId);
    const items = this.cart.map(i => ({ ...i, precioIncluyeIva: incl, ivaPct: this.ivaOf(i.productoId) }));
    return TaxService.calculateTotals(items, 0, { aplicaIva: !cli || cli.aplicaIva !== false });
  },

  updateCartView() {
    const { container, products, priceLists } = this._ctx;
    const tbody = container.querySelector('#pos-cart-tbody');
    const isQuote = container.querySelector('#pos-doc-type').value === 'COTIZACION';
    const incl = PricingService.listIncludesIva(priceLists, this.selectedPriceListId);

    if (this.cart.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">Carrito vacío. Seleccione productos.</td></tr>';
    } else {
      tbody.innerHTML = this.cart.map((item, idx) => {
        const prod = products.find(p => p.id === item.productoId) || {};
        const netUnit = incl ? item.precioUnitario / (1 + this.ivaOf(item.productoId) / 100) : item.precioUnitario;
        const bajoCosto = Number(prod.costoPromedio || 0) > 0 && netUnit < Number(prod.costoPromedio);
        const sinStock = !isQuote && item.cantidad > Number(prod.stock || 0);
        return `
          <tr>
            <td style="vertical-align: middle;">
              <div class="font-bold" style="font-size: 11.5px; line-height: 1.2;">${esc(item.nombre)}</div>
              <div class="text-xs text-muted" style="font-size: 10px;">
                ${esc(item.sku)} · stock ${esc(prod.stock)}
                ${item.precioEspecial ? '<span class="badge badge-info" style="font-size: 9px;">precio acordado</span>' : ''}
                ${bajoCosto ? '<span class="badge badge-danger" style="font-size: 9px;">bajo costo</span>' : ''}
                ${sinStock ? '<span class="badge badge-danger" style="font-size: 9px;">excede stock</span>' : ''}
              </div>
            </td>
            <td class="text-center" style="vertical-align: middle;">
              <input type="number" min="1" step="1" class="form-control pos-item-qty" data-idx="${idx}" value="${esc(item.cantidad)}" style="width: 52px; padding: 2px 4px; text-align: center; font-size: 11.5px; font-weight: 700;">
            </td>
            <td class="text-right" style="vertical-align: middle;">
              <div style="display: inline-flex; align-items: center; gap: 2px;">
                <button type="button" class="btn btn-secondary btn-sm pos-price-step" data-idx="${idx}" data-step="-100" title="- $100" style="padding: 1px 5px; font-size: 10px; font-weight: 800;">−</button>
                <input type="number" min="0" step="100" class="form-control pos-item-price-input" data-idx="${idx}" value="${esc(item.precioUnitario)}" style="width: 82px; padding: 2px 3px; text-align: right; font-weight: 800; font-size: 11px;">
                <button type="button" class="btn btn-secondary btn-sm pos-price-step" data-idx="${idx}" data-step="100" title="+ $100" style="padding: 1px 5px; font-size: 10px; font-weight: 800;">+</button>
              </div>
            </td>
            <td class="text-right" style="vertical-align: middle;"><strong style="font-size: 12px;">${Formatters.currency(item.cantidad * item.precioUnitario)}</strong></td>
            <td class="text-right" style="vertical-align: middle;"><button class="btn btn-danger btn-sm pos-btn-remove" data-idx="${idx}" style="padding: 2px 6px;">&times;</button></td>
          </tr>`;
      }).join('');
    }
    this.updateTotals();
  },

  updateTotals() {
    const { container } = this._ctx;
    const t = this.computeTotals();
    container.querySelector('#pos-lbl-subtotal').textContent = Formatters.currency(t.baseGravable);
    container.querySelector('#pos-lbl-iva').textContent = t.aplicaIva ? Formatters.currency(t.totalIva) : '$ 0 (cliente sin IVA)';
    container.querySelector('#pos-lbl-total').textContent = Formatters.currency(t.total);

    const recInp = container.querySelector('#pos-inp-received');
    const received = recInp.value === '' ? t.total : Number(recInp.value);
    const change = received - t.total;
    const lbl = container.querySelector('#pos-lbl-change');
    lbl.textContent = change < 0 ? `Faltan ${Formatters.currency(-change)}` : Formatters.currency(change);
    lbl.className = change < 0 ? 'text-danger' : 'text-success';

    this.updateCommission();
  },

  updateCommission() {
    const { container, products, priceLists } = this._ctx;
    const panel = container.querySelector('#pos-comision-panel');
    const fl = this.freelancer();
    if (!fl) { panel.style.display = 'none'; return; }
    const incl = PricingService.listIncludesIva(priceLists, this.selectedPriceListId);
    const items = this.cart.map(i => ({ ...i, precioIncluyeIva: incl, ivaPct: this.ivaOf(i.productoId) }));
    const com = SalesService.computeCommission(items, products, priceLists, fl, incl);
    panel.style.display = 'block';
    container.querySelector('#pos-lbl-comision').textContent = Formatters.currency(com.comision);
    const base = priceLists.find(pl => pl.id === com.baseListId);
    const sinBase = com.detalle.filter(d => d.sinPrecioBase).map(d => d.nombre);
    container.querySelector('#pos-comision-detalle').innerHTML =
      `${esc(fl.nombre)} · base ${esc(PricingService.label(base))} · calculada sin IVA` +
      (sinBase.length ? `<br><span class="text-danger">Sin precio base: ${esc(sinBase.join(', '))}</span>` : '');
  },

  refreshClientInfo() {
    const { container } = this._ctx;
    const cli = this.client();
    const cupo = Number((cli && cli.cupoCredito) || 0);
    container.querySelector('#pos-client-credit').textContent = cli
      ? (cupo > 0 ? `Cupo disponible: ${Formatters.currency(Math.max(0, cupo - Number(cli.saldoPendiente || 0)))}` : 'Sin cupo de crédito')
      : '';
    const aplica = !cli || cli.aplicaIva !== false;
    const iva = container.querySelector('#pos-iva-status');
    iva.textContent = aplica ? 'Con IVA' : 'Sin IVA';
    iva.className = aplica ? 'badge badge-success' : 'badge badge-warning';
    container.querySelector('#pos-chk-shipping').checked = !!(cli && cli.nitCc !== MOSTRADOR_NIT && cli.direccion);
  },

  updateDocTypeUI() {
    const { container } = this._ctx;
    const doc = container.querySelector('#pos-doc-type').value;
    const metodo = container.querySelector('#pos-payment-method').value;
    const contado = doc === 'VENTA';
    container.querySelector('#pos-payment-row').style.display = contado ? '' : 'none';
    container.querySelector('#pos-change-row').style.display = contado && metodo === 'Efectivo' ? '' : 'none';
    container.querySelector('#pos-received-wrap').style.display = contado && metodo === 'Efectivo' ? '' : 'none';
    container.querySelector('#pos-attachment-row').style.display = contado && metodo !== 'Efectivo' ? 'block' : 'none';
    container.querySelector('#pos-shipping-wrap').style.display = doc === 'COTIZACION' ? 'none' : '';
    const labels = { VENTA: '⚡ REGISTRAR VENTA (F4)', VENTA_CREDITO: '📑 REGISTRAR VENTA A CRÉDITO (F4)', COTIZACION: '📋 GUARDAR COTIZACIÓN (F4)' };
    const btn = container.querySelector('#btn-process-sale');
    btn.textContent = labels[doc];
    btn.disabled = false;
    this.updateCartView();
  },

  setReceipt(dataUrl) {
    const { container } = this._ctx;
    this.currentReceipt = dataUrl;
    const wrap = container.querySelector('#pos-receipt-preview');
    if (dataUrl) {
      container.querySelector('#pos-img-receipt-thumb').src = dataUrl;
      wrap.style.display = 'flex';
    } else {
      wrap.style.display = 'none';
      container.querySelector('#pos-inp-receipt-file').value = '';
    }
  },

  // ------------------------------------------------------------------ eventos
  bindEvents(container) {
    const $ = (sel) => container.querySelector(sel);
    const ctx = this._ctx;
    const search = $('#pos-search-product');

    search.addEventListener('input', () => this.renderProductGrid(search.value));
    search.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const q = search.value.trim().toLowerCase();
      if (!q) return;
      const exact = ctx.products.find(p => String(p.sku || '').toLowerCase() === q || String(p.codigoBarras || '').toLowerCase() === q);
      const matches = ctx.products.filter(p => String(p.nombre).toLowerCase().includes(q) || String(p.sku || '').toLowerCase().includes(q));
      const target = exact || (matches.length === 1 ? matches[0] : null);
      if (target) {
        this.addProductToCart(target.id);
        search.value = '';
        this.renderProductGrid('');
      } else {
        Toast.info(matches.length ? 'Varias coincidencias: elija en el catálogo.' : 'Sin coincidencias.');
      }
    });

    $('#pos-product-grid').addEventListener('click', (e) => {
      const card = e.target.closest('.pos-product-card');
      if (card) this.addProductToCart(card.getAttribute('data-product-id'));
    });

    $('#pos-select-pricelist').addEventListener('change', (e) => {
      this.selectedPriceListId = e.target.value;
      this.repriceCart();
      this.renderProductGrid(search.value);
      this.updateCartView();
    });

    $('#pos-select-client').addEventListener('change', (e) => {
      this.selectedClientId = e.target.value;
      this.applyClientDefaults(ctx.clients, ctx.priceLists, ctx.freelancers);
      $('#pos-select-pricelist').value = this.selectedPriceListId;
      $('#pos-select-freelancer').value = this.selectedFreelancerId || '';
      const cli = this.client();
      if (cli && cli.preciosEspeciales && Object.keys(cli.preciosEspeciales).length) {
        Toast.info('Cliente con precios acordados: se aplican automáticamente.');
      }
      this.repriceCart();
      this.refreshClientInfo();
      this.renderProductGrid(search.value);
      this.updateCartView();
    });

    $('#pos-select-freelancer').addEventListener('change', (e) => {
      this.selectedFreelancerId = e.target.value || null;
      const fl = this.freelancer();
      if (fl) {
        const baseId = PricingService.freelanceBaseListId(ctx.priceLists, fl);
        if (baseId) {
          this.selectedPriceListId = baseId;
          $('#pos-select-pricelist').value = baseId;
          this.repriceCart();
          this.renderProductGrid(search.value);
          Toast.info(`Precios en la lista base de ${fl.nombre}. Suba el precio de venta para ver la comisión.`);
        }
      }
      this.updateCartView();
    });

    $('#btn-pos-add-client').addEventListener('click', () => {
      ClientsModule.openClientModal(null, ctx.tenantId, ctx.priceLists, ctx.products, ctx.freelancers, async (newClient) => {
        if (newClient) {
          this.selectedClientId = newClient.id;
          this.applyClientDefaults([newClient], ctx.priceLists, ctx.freelancers);
        }
        await this.render(container);
      });
    });

    const tbody = $('#pos-cart-tbody');
    tbody.addEventListener('change', (e) => {
      const idx = Number(e.target.getAttribute('data-idx'));
      const item = this.cart[idx];
      if (!item) return;
      if (e.target.classList.contains('pos-item-qty')) {
        const qty = Math.floor(Number(e.target.value));
        item.cantidad = qty >= 1 ? qty : 1;
        const prod = ctx.products.find(p => p.id === item.productoId);
        if ($('#pos-doc-type').value !== 'COTIZACION' && prod && item.cantidad > Number(prod.stock)) {
          Toast.warning(`Solo hay ${prod.stock} unidades de ${prod.nombre}.`);
          item.cantidad = Math.max(1, Number(prod.stock));
        }
        this.updateCartView();
      }
      if (e.target.classList.contains('pos-item-price-input')) {
        const price = Math.round(Number(e.target.value));
        if (price > 0) { item.precioUnitario = price; item.precioEspecial = false; }
        this.updateCartView();
      }
    });
    tbody.addEventListener('click', (e) => {
      const rm = e.target.closest('.pos-btn-remove');
      if (rm) {
        this.cart.splice(Number(rm.getAttribute('data-idx')), 1);
        this.updateCartView();
        return;
      }
      const step = e.target.closest('.pos-price-step');
      if (step) {
        const item = this.cart[Number(step.getAttribute('data-idx'))];
        if (!item) return;
        item.precioUnitario = Math.max(100, Math.round((item.precioUnitario + Number(step.getAttribute('data-step'))) / 100) * 100);
        item.precioEspecial = false;
        this.updateCartView();
      }
    });

    $('#pos-inp-received').addEventListener('input', () => this.updateTotals());
    $('#pos-doc-type').addEventListener('change', () => this.updateDocTypeUI());
    $('#pos-payment-method').addEventListener('change', () => this.updateDocTypeUI());

    $('#btn-clear-cart').addEventListener('click', () => {
      this.cart = [];
      this.setReceipt(null);
      this.updateCartView();
    });

    $('#pos-btn-upload-file').addEventListener('click', () => $('#pos-inp-receipt-file').click());
    $('#pos-inp-receipt-file').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) this.compressImage(f, (b64) => { this.setReceipt(b64); Toast.success('Comprobante adjuntado.'); });
    });
    $('#pos-btn-open-cam').addEventListener('click', () => this.openCameraCaptureModal((b64) => this.setReceipt(b64)));
    $('#pos-btn-remove-receipt').addEventListener('click', () => this.setReceipt(null));
    $('#pos-img-receipt-thumb').addEventListener('click', () => this.showImageModal('Comprobante (venta en curso)', this.currentReceipt));

    $('#pos-open-history').addEventListener('click', () => this.openSalesHistoryModal(ctx.tenantId));
    $('#btn-process-sale').addEventListener('click', () => this.confirmAndProcess());
  },

  /** Atajos F2/F4 registrados UNA sola vez; solo actúan con el POS en pantalla y sin modales abiertos */
  bindKeys() {
    if (this._keysBound) return;
    this._keysBound = true;
    window.addEventListener('keydown', (e) => {
      const ctx = this._ctx;
      if (!ctx || !document.body.contains(ctx.container.querySelector('#btn-process-sale'))) return;
      if (document.querySelector('.modal-backdrop')) return;
      if (e.key === 'F4') { e.preventDefault(); this.confirmAndProcess(); }
      if (e.key === 'F2') { e.preventDefault(); const s = ctx.container.querySelector('#pos-search-product'); if (s) s.focus(); }
    });
  },

  // ------------------------------------------------------------------ registrar
  confirmAndProcess() {
    const { container } = this._ctx;
    if (this.processing) return;
    if (this.cart.length === 0) { Toast.warning('El carrito está vacío.'); return; }
    const tipoDoc = container.querySelector('#pos-doc-type').value;
    const metodoPago = tipoDoc === 'VENTA' ? container.querySelector('#pos-payment-method').value : 'Crédito';
    const t = this.computeTotals();
    const cli = this.client();
    const recInp = container.querySelector('#pos-inp-received');

    if (tipoDoc === 'VENTA' && metodoPago === 'Efectivo' && recInp.value !== '' && Number(recInp.value) < t.total) {
      Toast.warning('El valor recibido es menor que el total.');
      return;
    }

    const docLabel = DOC_TYPES[tipoDoc].short;
    Modal.confirm({
      title: `Confirmar ${docLabel.toLowerCase()}`,
      message: `${esc(docLabel)} a <strong>${esc(cli ? cli.nombre : 'Cliente Mostrador')}</strong> por <strong>${Formatters.currency(t.total)}</strong>${tipoDoc === 'VENTA' ? ` (${esc(metodoPago)})` : ''}.`,
      confirmText: 'Sí, registrar',
      cancelText: 'Revisar',
      onConfirm: () => this.processSale(tipoDoc, metodoPago, recInp.value === '' ? t.total : Number(recInp.value))
    });
  },

  async processSale(tipoDoc, metodoPago, pagoRecibido) {
    const { container, tenantId } = this._ctx;
    if (this.processing) return;
    const btn = container.querySelector('#btn-process-sale');
    this.processing = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
    try {
      const sale = await SalesService.createSale({
        tenantId,
        tipoDoc,
        cliente: this.client(),
        items: this.cart.map(i => ({ productoId: i.productoId, nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario })),
        listaPreciosId: this.selectedPriceListId,
        metodoPago,
        pagoRecibido,
        freelancer: this.freelancer(),
        crearDespacho: tipoDoc !== 'COTIZACION' && container.querySelector('#pos-chk-shipping').checked,
        comprobanteDataUrl: tipoDoc === 'VENTA' && metodoPago !== 'Efectivo' ? this.currentReceipt : null
      });

      Toast.success(`${DOC_TYPES[tipoDoc].short} ${sale.consecutivo} registrada.`);
      this.cart = [];
      this.currentReceipt = null;
      this.processing = false;
      await this.render(container);
      this.showPostSaleModal(sale);
    } catch (err) {
      console.error(err);
      Toast.error(err.message || 'No se pudo registrar la venta.');
      this.processing = false;
      if (btn && document.body.contains(btn)) this.updateDocTypeUI();
    }
  },

  async showPostSaleModal(sale) {
    const shipping = sale.despachoId ? await DB.getById(STORES.ORDERS_SHIPPING, sale.despachoId) : null;
    const invoiceHtml = PrintTemplates.saleInvoice(sale, sale.items);
    const labelHtml = shipping ? PrintTemplates.shippingBoxLabel(shipping) : '';
    const nonCash = sale.tipoDoc === 'VENTA' && sale.metodoPago !== 'Efectivo';

    const buttons = [];
    if (shipping) buttons.push({ label: '🏷️ Imprimir rótulo', class: 'btn-secondary', onClick: () => ExportService.printDocument(labelHtml, `Rotulo_${sale.consecutivo}`) });
    buttons.push({ label: '🖨️ Imprimir documento', class: 'btn-primary', onClick: () => ExportService.printDocument(invoiceHtml, sale.consecutivo) });
    if (nonCash && !sale.comprobanteId) buttons.push({ label: '📷 Adjuntar comprobante', class: 'btn-secondary', onClick: () => this.openAttachDialog(sale) });
    buttons.push({ label: '✨ Nueva venta', class: 'btn-secondary', onClick: () => Modal.close() });

    Modal.show({
      title: `✅ ${DOC_TYPES[sale.tipoDoc] ? DOC_TYPES[sale.tipoDoc].short : 'Documento'} ${sale.consecutivo}`,
      size: 'lg',
      content: `
        <div class="d-flex justify-between items-center mb-3" style="flex-wrap: wrap; gap: 8px;">
          <div><span class="text-xs text-muted font-bold">TOTAL:</span> <strong style="font-size: 16px; color: var(--brand-primary);">${Formatters.currency(sale.total)}</strong>
            ${sale.cambio > 0 ? `<span class="badge badge-success" style="margin-left: 6px;">Cambio ${Formatters.currency(sale.cambio)}</span>` : ''}</div>
          <div class="text-xs">Cliente: <strong>${esc(sale.clienteNombre)}</strong></div>
        </div>
        <div style="max-height: 420px; overflow-y: auto; background: #fff; color: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">${invoiceHtml}</div>
      `,
      footerButtons: buttons
    });
  },

  // ------------------------------------------------------------------ historial
  async openSalesHistoryModal(tenantId) {
    const sales = (await DB.getAll(STORES.SALES, tenantId)).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
    const canAnnul = this.canAnnul();

    const dialog = Modal.show({
      title: '📜 Historial de ventas y cotizaciones',
      size: 'xl',
      content: `
        <div class="d-flex gap-2 mb-3" style="flex-wrap: wrap;">
          <input type="text" id="hist-q" class="form-control form-control-sm" placeholder="🔍 Número, cliente o NIT" style="flex: 2; min-width: 200px;">
          <select id="hist-estado" class="form-select form-select-sm" style="flex: 1; min-width: 150px;">
            <option value="">Todos los estados</option>
            <option value="PAGADA">Pagadas</option>
            <option value="CREDITO_PENDIENTE">Crédito pendiente</option>
            <option value="COTIZACION">Cotizaciones</option>
            <option value="ANULADA">Anuladas</option>
          </select>
          <select id="hist-metodo" class="form-select form-select-sm" style="flex: 1; min-width: 150px;">
            <option value="">Todos los métodos</option>
            ${['Efectivo', 'Nequi', 'Daviplata', 'Transferencia', 'Tarjeta', 'Crédito'].map(m => `<option>${m}</option>`).join('')}
          </select>
        </div>
        <div id="hist-summary" class="text-xs text-muted mb-2"></div>
        <div class="table-responsive" style="max-height: 440px; overflow-y: auto;">
          <table class="table table-sm text-xs" style="margin-bottom: 0;">
            <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th class="text-right">Total</th><th class="text-right">Acciones</th></tr></thead>
            <tbody id="hist-tbody"></tbody>
          </table>
        </div>
      `,
      footerButtons: [{ label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }]
    });

    const q = dialog.querySelector('#hist-q');
    const est = dialog.querySelector('#hist-estado');
    const met = dialog.querySelector('#hist-metodo');
    const tbody = dialog.querySelector('#hist-tbody');
    const summary = dialog.querySelector('#hist-summary');

    const badge = (s) => {
      const map = { PAGADA: 'badge-success', CREDITO_PENDIENTE: 'badge-warning', COTIZACION: 'badge-info', ANULADA: 'badge-danger' };
      return `<span class="badge ${map[s.estado] || 'badge-neutral'}" style="font-size: 9px;">${esc(s.estado)}</span>${s.requiereRevision ? ` <span class="badge badge-danger" style="font-size: 9px;" title="${esc(s.requiereRevision)}">revisar</span>` : ''}`;
    };

    const draw = () => {
      const text = q.value.toLowerCase().trim();
      const list = sales.filter(s =>
        (!text || [s.consecutivo, s.clienteNombre, s.clienteNit].some(v => String(v || '').toLowerCase().includes(text))) &&
        (!est.value || s.estado === est.value) &&
        (!met.value || s.metodoPago === met.value));
      const efectivas = list.filter(s => SalesService.isEffectiveSale(s));
      summary.textContent = `${list.length} documentos · Ventas efectivas: ${efectivas.length} por ${Formatters.currency(efectivas.reduce((a, s) => a + Number(s.total || 0), 0))}`;
      tbody.innerHTML = list.length ? list.map(s => `
        <tr>
          <td><strong style="color: var(--brand-primary);">${esc(s.consecutivo)}</strong><div>${badge(s)}</div></td>
          <td>${esc(Formatters.dateTime(s.fecha))}</td>
          <td><strong>${esc(s.clienteNombre || 'Mostrador')}</strong><div class="text-muted" style="font-size: 10px;">${esc(s.clienteNit || '-')}</div></td>
          <td>${esc(s.metodoPago || '-')}</td>
          <td class="text-right font-bold">${Formatters.currency(s.total || 0)}</td>
          <td class="text-right" style="white-space: nowrap;">
            <button class="btn btn-secondary btn-sm h-act" data-act="print" data-id="${esc(s.id)}" title="Imprimir">🧾</button>
            <button class="btn btn-secondary btn-sm h-act" data-act="detail" data-id="${esc(s.id)}" title="Detalle">👁️</button>
            ${(s.comprobanteId || s.comprobantePagoUrl) ? `<button class="btn btn-secondary btn-sm h-act" data-act="voucher" data-id="${esc(s.id)}" title="Ver comprobante">📸</button>` :
              (SalesService.isEffectiveSale(s) && s.metodoPago !== 'Efectivo' && s.metodoPago !== 'Crédito' ? `<button class="btn btn-secondary btn-sm h-act" data-act="attach" data-id="${esc(s.id)}" title="Adjuntar comprobante">📷</button>` : '')}
            ${s.estado === 'COTIZACION' ? `<button class="btn btn-secondary btn-sm h-act" data-act="load" data-id="${esc(s.id)}" title="Cargar al carrito">🛒</button>` : ''}
            ${canAnnul && s.estado !== 'ANULADA' ? `<button class="btn btn-danger btn-sm h-act" data-act="annul" data-id="${esc(s.id)}" title="Anular">⛔</button>` : ''}
          </td>
        </tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted p-4">Sin resultados.</td></tr>';
    };

    q.addEventListener('input', draw);
    est.addEventListener('change', draw);
    met.addEventListener('change', draw);
    tbody.addEventListener('click', async (e) => {
      const b = e.target.closest('.h-act');
      if (!b) return;
      const s = sales.find(x => x.id === b.getAttribute('data-id'));
      if (!s) return;
      const act = b.getAttribute('data-act');
      if (act === 'print') ExportService.printDocument(PrintTemplates.saleInvoice(s, s.items || []), s.consecutivo);
      if (act === 'detail') this.showSaleDetail(s);
      if (act === 'voucher') this.showImageModal(`Comprobante ${s.consecutivo}`, await SalesService.getReceipt(s));
      if (act === 'attach') this.openAttachDialog(s);
      if (act === 'load') this.loadQuoteIntoCart(s);
      if (act === 'annul') this.openAnnulDialog(s);
    });
    draw();
  },

  showSaleDetail(s) {
    Modal.show({
      title: `Detalle ${s.consecutivo}`,
      size: 'md',
      content: `
        <div class="text-xs mb-3">
          <div>Cliente: <strong>${esc(s.clienteNombre)}</strong> · ${esc(Formatters.dateTime(s.fecha))}</div>
          <div>Tipo: <strong>${esc((DOC_TYPES[s.tipoDoc] || {}).label || LEGACY_DOC_LABELS[s.tipoDoc] || s.tipoDoc)}</strong> · Estado: <strong>${esc(s.estado)}</strong></div>
          <div>Atendió: ${esc(s.vendedorNombre || '-')}${s.freelancerNombre ? ` · Freelance: ${esc(s.freelancerNombre)} (comisión ${Formatters.currency(s.comisionFreelance)})` : ''}</div>
          ${s.anulacion ? `<div class="text-danger mt-1">Anulada por ${esc(s.anulacion.usuarioNombre)} — ${esc(s.anulacion.motivo)}${s.anulacion.notaCaja ? ' · ' + esc(s.anulacion.notaCaja) : ''}</div>` : ''}
          ${s.requiereRevision ? `<div class="text-danger mt-1">⚠️ ${esc(s.requiereRevision)}</div>` : ''}
        </div>
        <table class="table table-sm text-xs mb-3">
          <thead><tr><th>Producto</th><th class="text-center">Cant</th><th class="text-right">Unitario</th><th class="text-right">Total</th></tr></thead>
          <tbody>${(s.items || []).map(i => `<tr><td>${esc(i.nombre)} <span class="text-muted">(${esc(i.sku)})</span></td><td class="text-center">${esc(i.cantidad)}</td><td class="text-right">${Formatters.currency(i.precioUnitario)}</td><td class="text-right">${Formatters.currency(i.total !== undefined ? i.total : i.cantidad * i.precioUnitario)}</td></tr>`).join('')}</tbody>
        </table>
        <div class="d-flex justify-between text-xs"><span>Base</span><span>${Formatters.currency(s.subtotal)}</span></div>
        <div class="d-flex justify-between text-xs"><span>IVA</span><span>${Formatters.currency(s.impuestos)}</span></div>
        <div class="d-flex justify-between font-bold" style="font-size: 14px;"><span>Total</span><span>${Formatters.currency(s.total)}</span></div>
        ${s.costoTotal ? `<div class="d-flex justify-between text-xs text-muted mt-1"><span>Costo de la mercancía</span><span>${Formatters.currency(s.costoTotal)}</span></div>` : ''}
      `,
      footerButtons: [{ label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }]
    });
  },

  loadQuoteIntoCart(quote) {
    const ctx = this._ctx;
    this.cart = (quote.items || []).filter(i => ctx.products.find(p => p.id === i.productoId)).map(i => ({
      productoId: i.productoId, sku: i.sku, nombre: i.nombre, cantidad: Number(i.cantidad), precioUnitario: Number(i.precioUnitario), precioEspecial: false
    }));
    if (quote.clienteId && ctx.clients.find(c => c.id === quote.clienteId)) this.selectedClientId = quote.clienteId;
    if (quote.listaPreciosId && ctx.priceLists.find(pl => pl.id === quote.listaPreciosId)) this.selectedPriceListId = quote.listaPreciosId;
    Modal.close();
    this.render(ctx.container).then(() => Toast.success(`Cotización ${quote.consecutivo} cargada. Revise existencias antes de registrar la venta.`));
  },

  openAnnulDialog(sale) {
    const dialog = Modal.show({
      title: `Anular ${sale.consecutivo}`,
      size: 'sm',
      content: `
        <p class="text-xs mb-2">Se devolverá el inventario, se revertirá la caja o la cartera y se anularán la comisión y el despacho. Queda registrado en la auditoría y no se puede deshacer.</p>
        <div class="form-group"><label class="form-label">Motivo de la anulación</label>
          <textarea class="form-control" id="annul-reason" rows="3" placeholder="Ej: error en cantidades, el cliente devolvió la mercancía..."></textarea></div>
      `,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Anular documento', class: 'btn-danger', onClick: async (dlg, ev) => {
            const btn = ev.target;
            btn.disabled = true;
            try {
              const res = await SalesService.annulSale(sale.id, dialog.querySelector('#annul-reason').value);
              Modal.close();
              Toast.success(`${res.consecutivo} anulada. ${res.anulacion.notaCaja || ''}`);
              await this.render(this._ctx.container);
              this.openSalesHistoryModal(this._ctx.tenantId);
            } catch (err) {
              Toast.error(err.message);
              btn.disabled = false;
            }
          }
        }
      ]
    });
  },

  openAttachDialog(sale) {
    const dialog = Modal.show({
      title: `Comprobante de pago · ${sale.consecutivo}`,
      size: 'sm',
      content: `
        <div class="d-flex flex-col gap-2">
          <button type="button" class="btn btn-secondary" id="att-file">📁 Subir imagen</button>
          <button type="button" class="btn btn-primary" id="att-cam">📷 Tomar foto</button>
          <input type="file" id="att-input" accept="image/*" style="display: none;">
        </div>`,
      footerButtons: [{ label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() }]
    });
    const save = async (b64) => {
      try {
        await SalesService.attachReceipt(sale.id, b64);
        Toast.success('Comprobante guardado.');
      } catch (err) {
        Toast.error(err.message);
      }
    };
    const inp = dialog.querySelector('#att-input');
    dialog.querySelector('#att-file').addEventListener('click', () => inp.click());
    inp.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) this.compressImage(f, (b64) => { Modal.close(); save(b64); });
    });
    dialog.querySelector('#att-cam').addEventListener('click', () => this.openCameraCaptureModal(save));
  },

  showImageModal(title, dataUrl) {
    if (!dataUrl) { Toast.info('No hay imagen para mostrar.'); return; }
    Modal.show({
      title,
      size: 'md',
      content: `<div style="text-align: center; background: #1e293b; padding: 10px; border-radius: 8px;"><img src="${esc(dataUrl)}" alt="Comprobante" style="max-width: 100%; max-height: 460px; object-fit: contain;"></div>`,
      footerButtons: [
        { label: '🖨️ Imprimir', class: 'btn-primary', onClick: () => ExportService.printDocument(`<div style="text-align:center;"><h3>${esc(title)}</h3><img src="${esc(dataUrl)}" style="max-width: 90%;"></div>`, title) },
        { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }
      ]
    });
  },

  // ------------------------------------------------------------------ cámara e imágenes
  openCameraCaptureModal(onCaptured) {
    const fallback = () => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.setAttribute('capture', 'environment');
      inp.onchange = (e) => { const f = e.target.files[0]; if (f) this.compressImage(f, onCaptured); };
      inp.click();
    };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { fallback(); return; }

    let stream = null;
    let facing = 'environment';
    const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };

    const dialog = Modal.show({
      title: '📷 Foto del comprobante',
      size: 'md',
      content: `
        <div style="text-align: center;">
          <div style="background: #000; border-radius: 10px; overflow: hidden;"><video id="cam-video" autoplay playsinline style="width: 100%; max-height: 380px; object-fit: contain;"></video></div>
          <div class="d-flex justify-between items-center mt-3">
            <button type="button" class="btn btn-secondary btn-sm" id="cam-switch">🔄 Cambiar cámara</button>
            <button type="button" class="btn btn-primary btn-sm font-bold" id="cam-snap">📸 Capturar</button>
          </div>
        </div>`,
      footerButtons: [{ label: 'Cancelar', class: 'btn-secondary', onClick: () => { stop(); Modal.close(); } }],
      onClose: stop
    });
    const video = dialog.querySelector('#cam-video');

    const start = async () => {
      try {
        stop();
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        video.srcObject = stream;
      } catch (err) {
        Modal.close();
        Toast.warning('No se pudo abrir la cámara. Seleccione una imagen.');
        fallback();
      }
    };
    start();
    dialog.querySelector('#cam-switch').addEventListener('click', () => { facing = facing === 'environment' ? 'user' : 'environment'; start(); });
    dialog.querySelector('#cam-snap').addEventListener('click', () => {
      if (!video.videoWidth) { Toast.warning('Esperando la cámara...'); return; }
      const b64 = this.scaleToJpeg(video, video.videoWidth, video.videoHeight);
      stop();
      Modal.close();
      onCaptured(b64);
    });
  },

  /** Escala a máximo 1200 px y JPEG al 70 % (≈100–200 KB por imagen) */
  scaleToJpeg(source, w, h, maxDim = 1200, quality = 0.7) {
    const ratio = Math.min(1, maxDim / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * ratio);
    canvas.height = Math.round(h * ratio);
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  },

  compressImage(file, callback) {
    if (!file.type || !file.type.startsWith('image/')) { Toast.warning('El archivo debe ser una imagen.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => callback(this.scaleToJpeg(img, img.width, img.height));
      img.onerror = () => Toast.error('No se pudo leer la imagen.');
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};
