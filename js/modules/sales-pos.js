/**
 * Nexa ERP - Módulo 7: Terminal de Ventas y POS Rápido
 * Facturación de mostrador, cotizaciones, remisiones, pagos locales (Nequi, Daviplata, Efectivo) y crédito
 * Con Historial de Ventas interactivo, soporte para Comprobantes de Pago y Cámara en vivo
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { TaxService } from '../services/tax-service.js';
import { KardexService } from '../services/kardex-service.js';
import { CashService } from '../services/cash-service.js';
import { ExportService } from '../services/export-service.js';
import { PrintTemplates } from '../components/print-template.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { AuditService } from '../services/audit-service.js';
import { TenantServiceInstance } from '../services/tenant-service.js';
import { ClientsModule } from './clients.js';

export const SalesPosModule = {
  cart: [],
  selectedClient: null,
  selectedPriceListId: 'plist_1',
  currentReceiptB64: null,
  selectedFreelancer: null,

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [products, clients, priceLists, currentShift, allSuppliers] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.CUSTOMERS, tenantId),
      DB.getAll(STORES.PRICE_LISTS, tenantId),
      CashService.getCurrentShift(tenantId),
      DB.getAll(STORES.SUPPLIERS, tenantId)
    ]);
    const freelancers = allSuppliers.filter(s => s.tipo === 'FREELANCER' && s.estado === 'ACTIVO');
    const priceList1 = priceLists.find(pl => pl.id === 'plist_1');
    const priceList3 = priceLists.find(pl => pl.id === 'plist_3');

    // Filtrar solo productos vendibles (no insumos químicos puros)
    const sellableProducts = products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO' || !p.tipoItem);

    // Cliente por defecto (Mostrador) si no hay seleccionado
    if (!this.selectedClient && clients.length > 0) {
      this.selectedClient = clients.find(c => c.nitCc === '222222222222') || clients[0];
    }
    this.selectedPriceListId = this.selectedClient ? this.selectedClient.listaPreciosId || 'plist_1' : 'plist_1';

    container.innerHTML = `
      <div class="view-header" style="margin-bottom: 16px;">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Punto de Venta (POS) & Mostrador</h1>
            ${currentShift ? `
              <span class="badge badge-success">✓ Caja Abierta (Turno Activo)</span>
            ` : `
              <span class="badge badge-danger">⚠️ Caja Cerrada (Turno sin aperturar)</span>
            `}
          </div>
          <p>Facturación rápida de mostrador, pedidos, cotizaciones y ventas a crédito comercial</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm font-bold" id="btn-view-sales-history">📜 Historial Ventas</button>
          <button class="btn btn-secondary btn-sm" id="btn-clear-cart">🗑️ Limpiar Venta</button>
        </div>
      </div>

      <!-- INTERFAZ DIVIDIDA POS: CATÁLOGO IZQUIERDA, TICKET DERECHA -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;" class="pos-layout">
        
        <!-- COLUMNA IZQUIERDA: BUSCADOR Y CATÁLOGO DE PRODUCTOS -->
        <div class="d-flex flex-col gap-3">
          <!-- BARRA DE BÚSQUEDA RÁPIDA (CÓDIGO DE BARRAS / SKU) -->
          <div class="card" style="margin-bottom: 0;">
            <div class="card-body" style="padding: 14px 16px;">
              <div class="form-row">
                <div class="form-group mb-0" style="flex: 2;">
                  <label class="form-label text-xs font-bold">BUSCAR PRODUCTO (SKU / CÓDIGO BARRAS / NOMBRE):</label>
                  <div style="position: relative;">
                    <input type="text" id="pos-search-product" class="form-control" placeholder="Escriba o escanee con lector de barras..." autofocus>
                    <div id="pos-search-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 100; max-height: 250px; overflow-y: auto;"></div>
                  </div>
                </div>
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold">LISTA DE PRECIOS:</label>
                  <select class="form-select" id="pos-select-pricelist">
                    ${priceLists.map(pl => `
                      <option value="${pl.id}" ${pl.id === this.selectedPriceListId ? 'selected' : ''}>${pl.nombre}</option>
                    `).join('')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- GRID DE PRODUCTOS DISPONIBLES EN BOTONES TÁCTILES RÁPIDOS -->
          <div class="card" style="margin-bottom: 0; flex: 1;">
            <div class="card-header" style="padding: 10px 16px;">
              <div class="card-title" style="font-size: 13px;">⚡ Productos Más Vendidos (Acceso Rápido)</div>
            </div>
            <div class="card-body" style="padding: 10px 12px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; max-height: 340px; overflow-y: auto;">
                ${sellableProducts.map(p => {
                  const price = (p.precios && p.precios[this.selectedPriceListId]) || (p.costo || p.costoPromedio || 0) * 1.5;
                  const isAvailable = p.stock > 0;
                  return `
                    <div class="pos-product-card card" data-product-id="${p.id}" style="cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; margin-bottom: 0; padding: 8px 10px; border: 1px solid ${isAvailable ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.3)'}; background: ${isAvailable ? 'var(--bg-surface)' : 'rgba(239, 68, 68, 0.08)'}; transition: transform 0.15s ease;">
                      <div class="text-xs font-bold" style="color: var(--brand-primary); font-size: 11px;">${p.sku || '-'}</div>
                      <div class="font-bold text-xs" style="margin: 2px 0; line-height: 1.2; height: 26px; overflow: hidden; font-size: 11.5px; color: var(--text-main);">${p.nombre}</div>
                      <div class="d-flex justify-between items-center mt-1">
                        <span class="text-xs font-bold" style="color: var(--text-main);">${Formatters.currency(price)}</span>
                        <span class="badge ${isAvailable ? 'badge-success' : 'badge-danger'}" style="font-size: 9.5px; padding: 1px 5px;">${p.stock} un</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: TICKET / CARRITO DE VENTA -->
        <div class="card d-flex flex-col" style="margin-bottom: 0;">
          <div class="card-header" style="background: var(--bg-surface); padding: 10px 14px;">
            <div style="width: 100%;">
              <div class="d-flex justify-between items-center mb-1">
                <div class="card-title" style="font-size: 13px;">🛒 Detalle de la Venta</div>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-pos-add-client" style="padding: 2px 8px; font-size: 11px;">
                  + Nuevo Cliente
                </button>
              </div>
              <div class="form-group mb-1">
                <select class="form-select" id="pos-select-client" style="font-size: 12px; font-weight: 700; padding: 4px 8px;">
                  ${clients.map(c => `
                    <option value="${c.id}" ${this.selectedClient && c.id === this.selectedClient.id ? 'selected' : ''}>
                      ${c.nombre} (${c.tipoCliente}) - Saldo: ${Formatters.currency(c.saldoPendiente || 0)}
                    </option>
                  `).join('')}
                </select>
              </div>
              <div class="d-flex justify-between items-center text-xs text-muted" style="font-size: 10.5px;">
                <span id="pos-fe-status">⚡ Facturación Electrónica: <strong>Sí</strong></span>
                <span id="pos-iva-status" class="badge badge-success">Con IVA (19%)</span>
              </div>
            </div>
          </div>

          <div class="card-body p-0" style="flex: 1; max-height: 250px; overflow-y: auto;">
            <table class="table table-sm text-xs">
              <thead>
                <tr>
                  <th>Ítem</th>
                  <th class="text-center" style="width: 65px;">Cant</th>
                  <th class="text-right" style="width: 75px;">Precio</th>
                  <th class="text-right" style="width: 85px;">Subtotal</th>
                  <th style="width: 30px;"></th>
                </tr>
              </thead>
              <tbody id="pos-cart-tbody"></tbody>
            </table>
          </div>

          <div class="card-footer" style="background: var(--bg-surface); padding: 12px 14px;">
            <div class="d-flex justify-between text-xs mb-1">
              <span>Subtotal:</span>
              <strong id="pos-lbl-subtotal">$ 0</strong>
            </div>
            <div class="d-flex justify-between text-xs mb-1">
              <span>IVA (19%):</span>
              <span id="pos-lbl-iva">$ 0</span>
            </div>
            <div class="d-flex justify-between mb-2" style="font-size: 16px; font-weight: 800; color: var(--brand-primary); border-top: 1px dashed var(--border-color); padding-top: 4px;">
              <span>TOTAL A COBRAR:</span>
              <span id="pos-lbl-total">$ 0</span>
            </div>

            <!-- FORMA DE PAGO Y PAGO RECIBIDO -->
            <div class="form-row mb-2">
              <div class="form-group mb-0" style="flex: 1.2;">
                <label class="form-label text-xs font-bold">MÉTODO DE PAGO:</label>
                <select class="form-select" id="pos-payment-method" style="padding: 4px 8px; font-size: 11.5px;">
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Nequi">📱 Nequi</option>
                  <option value="Daviplata">📱 Daviplata</option>
                  <option value="Transferencia">🏦 Transferencia Bancaria</option>
                  <option value="Tarjeta">💳 Tarjeta Débito / Crédito</option>
                  <option value="Crédito">📑 Crédito Directo (Cupo)</option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs font-bold">Pago Recibido ($ COP):</label>
                <input type="number" class="form-control" id="pos-inp-received" placeholder="Monto entregado" style="padding: 4px 8px; font-size: 11.5px;">
              </div>
            </div>

            <div class="d-flex justify-between items-center text-xs mb-2" id="pos-change-row" style="background: var(--bg-surface-solid); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-main);">
              <span>Cambio / Vueltas:</span>
              <strong class="text-success" id="pos-lbl-change" style="font-size: 13px;">$ 0</strong>
            </div>

            <!-- CONTENEDOR DE COMPROBANTE DE PAGO CON CÁMARA Y ARCHIVO -->
            <div id="pos-attachment-row" style="display: none; background: rgba(0, 113, 227, 0.04); padding: 8px 10px; border-radius: 8px; border: 1px dashed var(--brand-primary); margin-bottom: 8px;">
              <div class="d-flex justify-between items-center mb-1">
                <span class="text-xs font-bold" id="pos-lbl-attachment-method" style="color: var(--brand-primary);">📸 Comprobante de Pago:</span>
                <span class="badge badge-info" style="font-size: 9.5px;">Opcional</span>
              </div>
              
              <div class="d-flex gap-2 mb-1" id="pos-voucher-buttons-wrap">
                <button type="button" class="btn btn-secondary btn-sm" id="pos-btn-upload-file" style="flex: 1; font-size: 11px; padding: 4px 6px;">
                  📁 Subir Imagen
                </button>
                <button type="button" class="btn btn-primary btn-sm" id="pos-btn-open-cam" style="flex: 1; font-size: 11px; padding: 4px 6px;">
                  📷 Tomar Foto
                </button>
                <input type="file" id="pos-inp-receipt-file" accept="image/*" style="display: none;">
              </div>

              <!-- Preview del comprobante cargado -->
              <div id="pos-receipt-preview" style="display: none; align-items: center; justify-content: space-between; background: #fff; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); margin-top: 4px;">
                <div class="d-flex items-center gap-2">
                  <img id="pos-img-receipt-thumb" src="" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc; cursor: pointer;">
                  <div>
                    <span class="text-xs font-bold text-success" style="font-size: 11px;">✓ Comprobante listo</span>
                    <div class="text-muted" style="font-size: 9.5px;">Se adjuntará a la factura</div>
                  </div>
                </div>
                <button type="button" class="btn btn-danger btn-sm" id="pos-btn-remove-receipt" style="padding: 2px 6px; font-size: 11px;" title="Quitar foto">🗑️</button>
              </div>
            </div>

            <!-- VENDEDOR FREELANCE (opcional) -->
            <div id="pos-freelancer-row" style="margin-bottom: 8px; background: rgba(0,113,227,0.04); padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color);">
              <div class="d-flex justify-between items-center mb-1">
                <label class="text-xs font-bold" style="color: var(--text-main); cursor: pointer;" for="pos-chk-freelance">
                  🤝 Venta por Vendedor Freelance
                </label>
                <input type="checkbox" id="pos-chk-freelance" style="width: 16px; height: 16px; cursor: pointer;">
              </div>
              <div id="pos-freelancer-select-wrap" style="display: none; margin-top: 6px;">
                <select class="form-select" id="pos-select-freelancer" style="font-size: 11.5px; padding: 4px 8px; font-weight: 700; margin-bottom: 6px;">
                  <option value="">-- Seleccionar vendedor --</option>
                  ${freelancers.map(fl => `<option value="${fl.id}" data-nombre="${fl.nombre}">${fl.nombre}${fl.zona ? ' (' + fl.zona + ')' : ''}</option>`).join('')}
                </select>
                <div id="pos-comision-panel" style="display: none; background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 6px 10px;">
                  <div class="d-flex justify-between items-center text-xs">
                    <span style="color: #15803d; font-weight: 600;">💰 Comisión del vendedor:</span>
                    <strong id="pos-lbl-comision" style="font-size: 14px; color: #15803d;">$ 0</strong>
                  </div>
                  <div class="text-xs text-muted" id="pos-comision-detalle" style="margin-top: 2px;">Seleccione productos para ver comisión</div>
                </div>
              </div>
            </div>

            <!-- TIPO DE DOCUMENTO COMERCIAL -->
            <div class="form-group mb-2">
              <select class="form-select" id="pos-doc-type" style="padding: 4px 8px; font-size: 11.5px; font-weight: 700;">
                <option value="FACTURA_ELECTRONICA">⚡ Factura Electrónica de Venta (DIAN)</option>
                <option value="DOCUMENTO_EQUIVALENTE_POS">🧾 Documento Equivalente POS (Ticket)</option>
                <option value="VENTA_CREDITO">📑 Factura a Crédito Comercial (CXC)</option>
                <option value="COTIZACION">📋 Cotización Comercial (No descuenta stock)</option>
              </select>
            </div>

            <button class="btn btn-primary w-100" id="btn-process-sale" style="padding: 9px; font-size: 14px; font-weight: 700;">
              ⚡ COBRAR Y FACTURAR (F4)
            </button>
          </div>
        </div>

      </div>
    `;

    // Resetear comprobante y freelancer al cargar vista
    this.currentReceiptB64 = null;
    this.selectedFreelancer = null;

    // Métodos internos del carrito
    const updateCartView = () => {
      const tbody = container.querySelector('#pos-cart-tbody');
      if (this.cart.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">Carrito vacío. Seleccione productos de la izquierda.</td></tr>`;
        container.querySelector('#pos-lbl-subtotal').textContent = '$ 0';
        container.querySelector('#pos-lbl-iva').textContent = '$ 0';
        container.querySelector('#pos-lbl-total').textContent = '$ 0';
        container.querySelector('#pos-lbl-change').textContent = '$ 0';
        return;
      }

      tbody.innerHTML = this.cart.map((item, idx) => `
        <tr>
          <td>
            <div class="font-bold">${item.nombre}</div>
            <div class="text-xs text-muted">SKU: ${item.sku}</div>
          </td>
          <td class="text-center">
            <input type="number" min="1" max="${item.stockMaximoDisponible}" class="form-control pos-item-qty" data-idx="${idx}" value="${item.cantidad}" style="width: 55px; padding: 2px 4px; text-align: center;">
          </td>
          <td class="text-right">${Formatters.currency(item.precioUnitario)}</td>
          <td class="text-right"><strong>${Formatters.currency(item.cantidad * item.precioUnitario)}</strong></td>
          <td class="text-right">
            <button class="btn btn-danger btn-sm pos-btn-remove" data-idx="${idx}" style="padding: 2px 6px;">&times;</button>
          </td>
        </tr>
      `).join('');

      const cobraIva = !this.selectedClient || this.selectedClient.aplicaIva !== false;
      const tieneFE = !this.selectedClient || this.selectedClient.facturaElectronica !== false;

      const totals = TaxService.calculateTotals(this.cart, 0, {
        aplicaIva: cobraIva,
        facturaElectronica: tieneFE
      });

      container.querySelector('#pos-lbl-subtotal').textContent = Formatters.currency(totals.baseGravable);
      const ivaLabel = container.querySelector('#pos-lbl-iva');
      if (cobraIva) {
        ivaLabel.textContent = Formatters.currency(totals.totalIva);
        ivaLabel.className = '';
      } else {
        ivaLabel.textContent = '$ 0 (Exento / Sin IVA)';
        ivaLabel.className = 'text-warning font-bold';
      }
      container.querySelector('#pos-lbl-total').textContent = Formatters.currency(totals.total);

      const received = Number(container.querySelector('#pos-inp-received').value || totals.total);
      const change = Math.max(0, received - totals.total);
      container.querySelector('#pos-lbl-change').textContent = Formatters.currency(change);
    };

    const addProductToCart = (prodId) => {
      const prod = sellableProducts.find(p => p.id === prodId);
      if (!prod) return;

      if (prod.stock <= 0) {
        Toast.warning(`El producto ${prod.nombre} se encuentra agotado.`);
        return;
      }

      const existing = this.cart.find(i => i.productoId === prod.id);
      const unitPrice = (prod.precios && prod.precios[this.selectedPriceListId]) || (prod.costo || prod.costoPromedio || 0) * 1.5;

      if (existing) {
        if (existing.cantidad + 1 > prod.stock) {
          Toast.warning(`No hay más existencias físicas de ${prod.nombre} (Stock actual: ${prod.stock}).`);
          return;
        }
        existing.cantidad += 1;
      } else {
        this.cart.push({
          productoId: prod.id,
          sku: prod.sku,
          nombre: prod.nombre,
          precioUnitario: unitPrice,
          cantidad: 1,
          stockMaximoDisponible: prod.stock,
          ivaPct: 19
        });
      }

      updateCartView();
    };

    // Listeners de catálogo táctil
    container.querySelectorAll('.pos-product-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-product-id');
        addProductToCart(id);
      });
    });

    // Cambio de lista de precios en POS
    container.querySelector('#pos-select-pricelist').addEventListener('change', (e) => {
      this.selectedPriceListId = e.target.value;
      this.cart.forEach(item => {
        const p = sellableProducts.find(prod => prod.id === item.productoId);
        if (p && p.precios && p.precios[this.selectedPriceListId]) {
          item.precioUnitario = p.precios[this.selectedPriceListId];
        }
      });
      updateCartView();
      this.render(container);
    });

    // Función auxiliar para refrescar el badge tributario del cliente
    const updateClientTaxBadge = () => {
      const feStatus = container.querySelector('#pos-fe-status');
      const ivaStatus = container.querySelector('#pos-iva-status');
      if (!feStatus || !ivaStatus) return;

      const esFE = !this.selectedClient || this.selectedClient.facturaElectronica !== false;
      const aplicaIva = !this.selectedClient || this.selectedClient.aplicaIva !== false;

      feStatus.innerHTML = `⚡ Facturación Electrónica: <strong>${esFE ? 'Sí' : 'No (Documento Interno)'}</strong>`;
      if (aplicaIva) {
        ivaStatus.textContent = 'Con IVA (19%)';
        ivaStatus.className = 'badge badge-success';
      } else {
        ivaStatus.textContent = 'Exento / Sin IVA (0%)';
        ivaStatus.className = 'badge badge-warning';
      }
    };

    updateClientTaxBadge();

    // Cambio de cliente
    container.querySelector('#pos-select-client').addEventListener('change', (e) => {
      const cli = clients.find(c => c.id === e.target.value);
      this.selectedClient = cli;
      if (cli && cli.listaPreciosId) {
        this.selectedPriceListId = cli.listaPreciosId;
        container.querySelector('#pos-select-pricelist').value = cli.listaPreciosId;
        this.cart.forEach(item => {
          const p = sellableProducts.find(prod => prod.id === item.productoId);
          if (p && p.precios && p.precios[this.selectedPriceListId]) {
            item.precioUnitario = p.precios[this.selectedPriceListId];
          }
        });
      }
      updateClientTaxBadge();
      updateCartView();
    });

    // Crear nuevo cliente
    const btnPosAddClient = container.querySelector('#btn-pos-add-client');
    if (btnPosAddClient) {
      btnPosAddClient.addEventListener('click', () => {
        ClientsModule.openClientModal(null, tenantId, priceLists, async (newClient) => {
          const updatedClients = await DB.getAll(STORES.CUSTOMERS, tenantId);
          const clientSelect = container.querySelector('#pos-select-client');
          if (clientSelect) {
            clientSelect.innerHTML = updatedClients.map(c => `
              <option value="${c.id}" ${newClient && c.id === newClient.id ? 'selected' : ''}>
                ${c.nombre} (${c.tipoCliente}) - Saldo: ${Formatters.currency(c.saldoPendiente || 0)}
              </option>
            `).join('');
          }
          if (newClient) {
            this.selectedClient = newClient;
            updateClientTaxBadge();
            updateCartView();
            Toast.success(`¡Cliente "${newClient.nombre}" creado y vinculado!`);
          }
        });
      });
    }

    // Eventos dentro de la tabla del carrito
    container.querySelector('#pos-cart-tbody').addEventListener('input', (e) => {
      if (e.target.classList.contains('pos-item-qty')) {
        const idx = Number(e.target.getAttribute('data-idx'));
        const newQty = Math.max(1, Number(e.target.value));
        if (this.cart[idx]) {
          this.cart[idx].cantidad = newQty;
          updateCartView();
        }
      }
    });

    container.querySelector('#pos-cart-tbody').addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.pos-btn-remove');
      if (removeBtn) {
        const idx = Number(removeBtn.getAttribute('data-idx'));
        this.cart.splice(idx, 1);
        updateCartView();
      }
    });

    // Input pago recibido
    container.querySelector('#pos-inp-received').addEventListener('input', updateCartView);

    // =========================================================================
    // FREELANCER: Toggle + selector + cálculo de comisión en tiempo real
    // =========================================================================
    const chkFreelance = container.querySelector('#pos-chk-freelance');
    const freelancerSelectWrap = container.querySelector('#pos-freelancer-select-wrap');
    const freelancerSelect = container.querySelector('#pos-select-freelancer');
    const comisionPanel = container.querySelector('#pos-comision-panel');
    const lblComision = container.querySelector('#pos-lbl-comision');
    const comisionDetalle = container.querySelector('#pos-comision-detalle');

    const calcularComision = () => {
      if (!this.selectedFreelancer) {
        comisionPanel.style.display = 'none';
        return;
      }
      // Comisión = suma de (precioVendido - precioP3) * cantidad por ítem
      let totalComision = 0;
      let detalles = [];
      this.cart.forEach(item => {
        const prod = (products || []).find(p => p.id === item.productoId);
        const precioP3 = prod && prod.precios && prod.precios['plist_3']
          ? prod.precios['plist_3']
          : (prod ? (prod.costo || prod.costoPromedio || 0) * 1.3 : 0);
        const comItem = Math.max(0, (item.precioUnitario - precioP3) * item.cantidad);
        totalComision += comItem;
        if (comItem > 0) detalles.push(`${item.nombre}: ${Formatters.currency(comItem)}`);
      });
      comisionPanel.style.display = 'block';
      lblComision.textContent = Formatters.currency(totalComision);
      comisionDetalle.textContent = detalles.length > 0
        ? detalles.join(' · ')
        : (totalComision === 0 && this.cart.length > 0
            ? '⚠️ Precio = Precio base (comisión $0)'
            : 'Agrega productos al carrito');
    };

    if (chkFreelance) {
      chkFreelance.addEventListener('change', () => {
        freelancerSelectWrap.style.display = chkFreelance.checked ? 'block' : 'none';
        if (!chkFreelance.checked) {
          this.selectedFreelancer = null;
          this.selectedPriceListId = this.selectedClient ? (this.selectedClient.listaPreciosId || 'plist_1') : 'plist_1';
          comisionPanel.style.display = 'none';
          freelancerSelect.value = '';
        }
      });

      freelancerSelect.addEventListener('change', () => {
        const id = freelancerSelect.value;
        this.selectedFreelancer = freelancers.find(fl => fl.id === id) || null;
        if (this.selectedFreelancer) {
          // Cambiar lista de precios a Precio 3 como mínimo
          this.selectedPriceListId = 'plist_3';
          container.querySelector('#pos-select-pricelist').value = 'plist_3';
          // Actualizar precios en carrito a P3
          this.cart.forEach(item => {
            const p = (products || []).find(prod => prod.id === item.productoId);
            if (p && p.precios && p.precios['plist_3']) {
              item.precioUnitario = p.precios['plist_3'];
            }
          });
          updateCartView();
          calcularComision();
          Toast.info(`Vendedor "${this.selectedFreelancer.nombre}" seleccionado. Precios ajustados a Precio 3.`);
        } else {
          comisionPanel.style.display = 'none';
        }
      });
    }

    // Extender updateCartView para recalcular comisión
    const _originalUpdateCartView = updateCartView;
    const updateCartViewWithComision = () => {
      _originalUpdateCartView();
      calcularComision();
    };
    // Reasignar eventos que usan updateCartView para incluir comisión
    container.querySelector('#pos-inp-received').removeEventListener('input', updateCartView);
    container.querySelector('#pos-inp-received').addEventListener('input', updateCartViewWithComision);

    // Limpiar carrito
    container.querySelector('#btn-clear-cart').addEventListener('click', () => {
      this.cart = [];
      this.currentReceiptB64 = null;
      updateCartView();
    });

    // =========================================================================
    // 1. MANEJO REACTIVO DE MÉTODO DE PAGO Y ADJUNTAR COMPROBANTE / CÁMARA
    // =========================================================================
    const paymentSel = container.querySelector('#pos-payment-method');
    const attachmentRow = container.querySelector('#pos-attachment-row');
    const lblAttachment = container.querySelector('#pos-lbl-attachment-method');
    const btnUploadFile = container.querySelector('#pos-btn-upload-file');
    const btnOpenCam = container.querySelector('#pos-btn-open-cam');
    const fileInp = container.querySelector('#pos-inp-receipt-file');
    const previewWrap = container.querySelector('#pos-receipt-preview');
    const thumbImg = container.querySelector('#pos-img-receipt-thumb');
    const btnRemoveReceipt = container.querySelector('#pos-btn-remove-receipt');

    const updatePaymentAttachmentVisibility = () => {
      const method = paymentSel.value;
      if (method !== 'Efectivo') {
        attachmentRow.style.display = 'block';
        lblAttachment.textContent = `📸 Comprobante de Pago (${method}):`;
      } else {
        attachmentRow.style.display = 'none';
        this.currentReceiptB64 = null;
        previewWrap.style.display = 'none';
      }
    };

    paymentSel.addEventListener('change', updatePaymentAttachmentVisibility);
    updatePaymentAttachmentVisibility();

    // Subir imagen desde archivo
    btnUploadFile.addEventListener('click', () => fileInp.click());
    fileInp.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.compressImage(file, (b64) => {
          this.currentReceiptB64 = b64;
          thumbImg.src = b64;
          previewWrap.style.display = 'flex';
          Toast.success('¡Comprobante adjuntado correctamente!');
        });
      }
    });

    // Abrir cámara web / dispositivo
    btnOpenCam.addEventListener('click', () => {
      this.openCameraCaptureModal((b64) => {
        this.currentReceiptB64 = b64;
        thumbImg.src = b64;
        previewWrap.style.display = 'flex';
        Toast.success('¡Foto tomada y comprobante adjuntado!');
      });
    });

    // Quitar comprobante
    btnRemoveReceipt.addEventListener('click', () => {
      this.currentReceiptB64 = null;
      fileInp.value = '';
      previewWrap.style.display = 'none';
      Toast.info('Comprobante removido.');
    });

    // Ver en grande thumbnail del ticket
    thumbImg.addEventListener('click', () => {
      if (this.currentReceiptB64) {
        this.openVoucherPreviewModal({
          consecutivo: 'Venta en Curso',
          metodoPago: paymentSel.value,
          total: container.querySelector('#pos-lbl-total').textContent,
          comprobantePagoUrl: this.currentReceiptB64
        });
      }
    });

    // =========================================================================
    // 2. BOTÓN HISTORIAL DE VENTAS
    // =========================================================================
    const btnHist = container.querySelector('#btn-view-sales-history');
    if (btnHist) {
      btnHist.addEventListener('click', () => {
        this.openSalesHistoryModal(tenantId);
      });
    }

    // =========================================================================
    // 3. PROCESAR VENTA Y POST-VENTA
    // =========================================================================
    container.querySelector('#btn-process-sale').addEventListener('click', () => {
      if (this.cart.length === 0) {
        Toast.warning('El carrito de venta está vacío.');
        return;
      }

      const cobraIva = !this.selectedClient || this.selectedClient.aplicaIva !== false;
      const tieneFE = !this.selectedClient || this.selectedClient.facturaElectronica !== false;

      const totals = TaxService.calculateTotals(this.cart, 0, {
        aplicaIva: cobraIva,
        facturaElectronica: tieneFE
      });
      const metodoPago = container.querySelector('#pos-payment-method').value;
      const tipoDoc = container.querySelector('#pos-doc-type').value;
      
      Modal.confirm({
        title: 'Confirmar Venta / Facturación',
        message: `¿Está seguro de facturar por un total de <strong>${Formatters.currency(totals.total)}</strong> mediante <strong>${metodoPago}</strong>?`,
        confirmText: 'Sí, Facturar',
        cancelText: 'Revisar',
        onConfirm: async () => {
          const consecutivo = 'RP-' + Math.floor(10000 + Math.random() * 90000);
          const isCredit = metodoPago === 'Crédito' || tipoDoc === 'VENTA_CREDITO';
          
          if (isCredit && this.selectedClient) {
            const nuevoSaldo = (this.selectedClient.saldoPendiente || 0) + totals.total;
            if (this.selectedClient.cupoCredito > 0 && nuevoSaldo > this.selectedClient.cupoCredito) {
              Toast.warning(`El cupo de crédito ($ ${Formatters.currency(this.selectedClient.cupoCredito)}) sería excedido. Saldo actual: ${Formatters.currency(this.selectedClient.saldoPendiente)}`);
              return;
            }
          }

          const received = Number(container.querySelector('#pos-inp-received').value || totals.total);
          const change = Math.max(0, received - totals.total);

          // 1. Guardar Venta en IndexedDB
          const sale = {
            tenantId,
            consecutivo,
            tipoDoc,
            facturaElectronica: tieneFE,
            aplicaIva: cobraIva,
            clienteId: this.selectedClient ? this.selectedClient.id : 'cli_mostrador',
            clienteNombre: this.selectedClient ? this.selectedClient.nombre : 'Cliente Mostrador',
            clienteNit: this.selectedClient ? this.selectedClient.nitCc : '222222222222',
            vendedorId: this.selectedFreelancer ? this.selectedFreelancer.id : 'usr_ventas',
            vendedorNombre: this.selectedFreelancer ? this.selectedFreelancer.nombre : 'Valentina Restrepo',
            esVentaFreelance: !!this.selectedFreelancer,
            freelancerId: this.selectedFreelancer ? this.selectedFreelancer.id : null,
            listaPreciosId: this.selectedPriceListId,
            fecha: new Date().toISOString(),
            estado: isCredit ? 'CREDITO_PENDIENTE' : 'PAGADA',
            subtotal: totals.baseGravable,
            descuentos: totals.totalDescuentos,
            impuestos: totals.totalIva,
            total: totals.total,
            metodoPago,
            pagoRecibido: isCredit ? 0 : received,
            cambio: isCredit ? 0 : change,
            saldoCredito: isCredit ? totals.total : 0,
            items: this.cart.map(i => ({
              productoId: i.productoId,
              sku: i.sku,
              nombre: i.nombre,
              precioUnitario: i.precioUnitario,
              cantidad: i.cantidad,
              total: i.cantidad * i.precioUnitario
            })),
            comprobantePagoUrl: this.currentReceiptB64 || null,
            comprobanteFecha: this.currentReceiptB64 ? new Date().toISOString() : null,
            comisionFreelance: (() => {
              if (!this.selectedFreelancer) return 0;
              return this.cart.reduce((acc, item) => {
                const prod = (products || []).find(p => p.id === item.productoId);
                const precioP3 = prod && prod.precios && prod.precios['plist_3']
                  ? prod.precios['plist_3']
                  : (prod ? (prod.costo || prod.costoPromedio || 0) * 1.3 : 0);
                return acc + Math.max(0, (item.precioUnitario - precioP3) * item.cantidad);
              }, 0);
            })(),
            precioBaseFreelance: (() => {
              if (!this.selectedFreelancer) return 0;
              return this.cart.reduce((acc, item) => {
                const prod = (products || []).find(p => p.id === item.productoId);
                const precioP3 = prod && prod.precios && prod.precios['plist_3']
                  ? prod.precios['plist_3']
                  : (prod ? (prod.costo || prod.costoPromedio || 0) * 1.3 : 0);
                return acc + precioP3 * item.cantidad;
              }, 0);
            })()
          };

          const savedSale = await DB.add(STORES.SALES, sale);
          sale.id = savedSale.id;

          // 1b. Si es venta freelance, crear CxP de comisión automáticamente
          if (this.selectedFreelancer && sale.comisionFreelance > 0) {
            const hoy = new Date();
            const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
            const comisionDoc = 'COM-' + hoy.getFullYear() + '-' + String(hoy.getMonth()+1).padStart(2,'0') + '-' + consecutivo;
            const cxpComision = {
              tenantId,
              documento: comisionDoc,
              proveedorNombre: this.selectedFreelancer.nombre,
              proveedorId: this.selectedFreelancer.id,
              tipoDocumento: 'COMISION_FREELANCE',
              ventaId: sale.id,
              ventaConsecutivo: consecutivo,
              fechaEmision: hoy.toISOString().split('T')[0],
              fechaVencimiento: finMes.toISOString().split('T')[0],
              valorTotal: sale.comisionFreelance,
              saldo: sale.comisionFreelance,
              abonos: 0,
              estado: 'AL_DIA'
            };
            const savedCxp = await DB.add(STORES.PAYABLES_CXP, cxpComision);
            sale.comisionCxpId = savedCxp.id;
            await DB.update(STORES.SALES, sale);

            // Actualizar comisiones acumuladas del freelancer
            const freelancerToUpdate = this.selectedFreelancer;
            freelancerToUpdate.comisionesTotalesGanadas = (freelancerToUpdate.comisionesTotalesGanadas || 0) + sale.comisionFreelance;
            await DB.update(STORES.SUPPLIERS, freelancerToUpdate);
          }

          // 2. Rebajar Inventario en Kardex
          for (const item of this.cart) {
            await KardexService.registerMovement({
              tenantId,
              productoId: item.productoId,
              bodegaId: 'wh_1',
              documentoTipo: 'VENTA',
              documentoNumero: consecutivo,
              cantidad: item.cantidad,
              costoUnitario: item.precioUnitario,
              observacion: `Venta POS No. ${consecutivo} a ${sale.clienteNombre}`
            });
          }

          // 3. Sumar a caja abierta si no es crédito
          if (!isCredit && currentShift) {
            if (metodoPago === 'Efectivo') {
              currentShift.totalVentasEfectivo = (currentShift.totalVentasEfectivo || 0) + totals.total;
              currentShift.saldoEsperado += totals.total;
            } else if (metodoPago === 'Transferencia') {
              currentShift.totalVentasTransferencia = (currentShift.totalVentasTransferencia || 0) + totals.total;
            } else if (metodoPago === 'Nequi' || metodoPago === 'Daviplata') {
              currentShift.totalVentasNequiDaviplata = (currentShift.totalVentasNequiDaviplata || 0) + totals.total;
            } else if (metodoPago === 'Tarjeta') {
              currentShift.totalVentasTarjeta = (currentShift.totalVentasTarjeta || 0) + totals.total;
            }
            await DB.update(STORES.CASH_SHIFTS, currentShift);
          }

          // 4. Registrar en cartera si es crédito
          if (isCredit && this.selectedClient) {
            this.selectedClient.saldoPendiente = (this.selectedClient.saldoPendiente || 0) + totals.total;
            this.selectedClient.totalComprado = (this.selectedClient.totalComprado || 0) + totals.total;
            this.selectedClient.numeroCompras = (this.selectedClient.numeroCompras || 0) + 1;
            await DB.update(STORES.CUSTOMERS, this.selectedClient);

            await DB.add(STORES.RECEIVABLES_CXC, {
              tenantId,
              ventaId: sale.id,
              documento: consecutivo,
              clienteId: this.selectedClient.id,
              clienteNombre: this.selectedClient.nombre,
              fechaEmision: new Date().toISOString().split('T')[0],
              fechaVencimiento: new Date(Date.now() + (this.selectedClient.diasCredito || 30) * 86400000).toISOString().split('T')[0],
              valorTotal: totals.total,
              abonos: 0,
              saldo: totals.total,
              diasMora: 0,
              estado: 'AL_DIA'
            });
          }

          // 5. Auditoría
          await AuditService.log({
            modulo: 'Ventas POS',
            accion: 'CREAR',
            registroId: consecutivo,
            campoModificado: 'Factura Emitida',
            valorAnterior: '-',
            valorNuevo: `${Formatters.currency(totals.total)} (${metodoPago})`
          });

          Toast.success(`¡Venta ${consecutivo} registrada con éxito!`);

          // 6. Preparar instantáneas para impresión y despacho
          const cartSnapshot = JSON.parse(JSON.stringify(this.cart));
          const clientSnapshot = this.selectedClient ? { ...this.selectedClient } : null;
          const totalUnidades = cartSnapshot.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
          const cajasTotal = Math.max(1, Math.ceil(totalUnidades / 12));
          const transportadoraDefecto = 'Coordinadora Mercantil';

          const shippingRecord = {
            tenantId,
            ventaId: sale.id,
            documentoNumero: consecutivo,
            clienteId: clientSnapshot ? clientSnapshot.id : 'CLI_GEN',
            clienteNombre: sale.clienteNombre,
            nitCc: sale.clienteNit || (clientSnapshot ? clientSnapshot.nitCc : ''),
            telefono: clientSnapshot ? (clientSnapshot.telefono || clientSnapshot.whatsapp || '3124567890') : '3124567890',
            whatsapp: clientSnapshot ? (clientSnapshot.whatsapp || clientSnapshot.telefono || '') : '',
            email: clientSnapshot ? (clientSnapshot.email || '') : '',
            ciudad: clientSnapshot ? (clientSnapshot.ciudad || 'Medellín') : 'Medellín',
            departamento: clientSnapshot ? (clientSnapshot.departamento || 'Antioquia') : 'Antioquia',
            barrio: clientSnapshot ? (clientSnapshot.barrio || '') : '',
            direccion: clientSnapshot ? (clientSnapshot.direccion || 'Dirección comercial') : 'Dirección comercial',
            transportadora: transportadoraDefecto,
            numeroGuia: `GUIA-${consecutivo.replace(/\D/g, '') || String(Math.floor(100000 + Math.random() * 900000))}`,
            costoEnvio: 0,
            fechaDespacho: new Date().toISOString().split('T')[0],
            fechaEntregaEstimada: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
            estadoCiclo: 'LISTO_DESPACHO',
            responsable: 'Mateo Osorio (Bodega & Despachos)',
            cajasTotal,
            contenidoDescripcion: 'Productos de mantenimiento y embellecimiento automotriz Rayo Pro',
            observaciones: 'Manejar con precaución. No volcar.'
          };

          try {
            await DB.add(STORES.ORDERS_SHIPPING, shippingRecord);
          } catch (err) {
            console.warn('Registro de orden de despacho:', err);
          }

          const invoiceHtml = PrintTemplates.saleInvoice(sale, sale.items);
          const labelHtml = PrintTemplates.shippingBoxLabel(shippingRecord);
          const isNonCash = sale.metodoPago !== 'Efectivo';

          // 7. Modal con vista previa interactiva y opción post-venta para comprobante / cámara
          const modalDialog = Modal.show({
            title: `✅ Venta ${consecutivo} Registrada con Éxito`,
            size: 'lg',
            content: `
              <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; background: rgba(0, 113, 227, 0.05); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(0, 113, 227, 0.15);">
                <div>
                  <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">TOTAL COBRADO:</span>
                  <strong style="font-size: 16px; color: var(--brand-primary); margin-left: 6px;">${Formatters.currency(totals.total)}</strong>
                  <span class="badge badge-info" style="margin-left: 6px;">${metodoPago}</span>
                </div>
                <div>
                  <span style="font-size: 12px; color: var(--text-secondary);">Cliente: <strong>${sale.clienteNombre}</strong></span>
                </div>
              </div>

              <!-- SECCIÓN COMPROBANTE POST-VENTA (CÁMARA / ARCHIVO) -->
              ${isNonCash ? `
                <div id="post-sale-voucher-wrap" class="card p-2 mb-3" style="background: ${sale.comprobantePagoUrl ? 'rgba(16, 185, 129, 0.06)' : 'rgba(245, 158, 11, 0.08)'}; border: 1px solid ${sale.comprobantePagoUrl ? '#10b981' : '#f59e0b'}; border-radius: 8px;">
                  <div class="d-flex justify-between items-center flex-wrap gap-2">
                    <div class="d-flex items-center gap-2">
                      ${sale.comprobantePagoUrl ? `
                        <img src="${sale.comprobantePagoUrl}" id="post-sale-voucher-img" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #ccc; cursor: pointer;">
                        <div>
                          <strong style="color: #047857; font-size: 12px;">✓ Comprobante de Pago Adjuntado (${sale.metodoPago})</strong>
                          <div class="text-xs text-muted" style="font-size: 10.5px;">Haz clic en la imagen o en el botón para ver en grande</div>
                        </div>
                      ` : `
                        <span style="font-size: 22px;">📱</span>
                        <div>
                          <strong style="color: #b45309; font-size: 12.5px;">Pago registrado con ${sale.metodoPago}</strong>
                          <div class="text-xs text-muted" style="font-size: 11px;">¿Deseas adjuntar la foto del váucher o captura de pantalla ahora?</div>
                        </div>
                      `}
                    </div>
                    <div class="d-flex gap-2">
                      ${sale.comprobantePagoUrl ? `
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-post-view-voucher" style="font-size: 11px;">👁️ Ver Foto</button>
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-post-change-voucher" style="font-size: 11px;">✏️ Cambiar</button>
                      ` : `
                        <button type="button" class="btn btn-secondary btn-sm font-bold" id="btn-post-upload-file" style="font-size: 11px;">
                          📁 Adjuntar Archivo
                        </button>
                        <button type="button" class="btn btn-primary btn-sm font-bold" id="btn-post-open-cam" style="font-size: 11px;">
                          📷 Activar Cámara
                        </button>
                      `}
                      <input type="file" id="post-sale-hidden-file" accept="image/*" style="display: none;">
                    </div>
                  </div>
                </div>
              ` : ''}

              <!-- PESTAÑAS DE VISTA PREVIA INTERACTIVA -->
              <div class="d-flex items-center gap-2 mb-3" style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                <button type="button" class="btn btn-sm btn-primary" id="btn-tab-preview-invoice" style="font-weight: 700;">
                  🧾 Factura / Comprobante POS
                </button>
                <button type="button" class="btn btn-sm btn-secondary" id="btn-tab-preview-shipping" style="font-weight: 700;">
                  🏷️ Rótulo de Despacho (${cajasTotal} ${cajasTotal === 1 ? 'Caja' : 'Cajas'})
                </button>
              </div>

              <!-- CONTENEDOR VISTA PREVIA FACTURA -->
              <div id="view-preview-invoice" style="display: block; max-height: 400px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
                ${invoiceHtml}
              </div>

              <!-- CONTENEDOR VISTA PREVIA RÓTULO -->
              <div id="view-preview-shipping" style="display: none; max-height: 400px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
                ${labelHtml}
              </div>
            `,
            footerButtons: [
              {
                label: '🏷️ Imprimir Rótulo de Envío',
                class: 'btn-secondary',
                onClick: () => {
                  ExportService.printDocument(labelHtml, `Rotulo_Envio_${shippingRecord.numeroGuia}`);
                }
              },
              {
                label: '🖨️ Imprimir Factura',
                class: 'btn-primary',
                onClick: () => {
                  ExportService.printDocument(invoiceHtml, `Factura_${consecutivo}`);
                }
              },
              {
                label: '✨ Nueva Venta',
                class: 'btn-secondary',
                onClick: () => Modal.close()
              }
            ]
          });

          // Conexión interactiva del comprobante en el modal de post-venta
          if (modalDialog && isNonCash) {
            const hiddenPostFile = modalDialog.querySelector('#post-sale-hidden-file');
            
            const handleVoucherSaved = async (b64) => {
              sale.comprobantePagoUrl = b64;
              sale.comprobanteFecha = new Date().toISOString();
              await DB.update(STORES.SALES, sale);
              Toast.success('¡Comprobante de pago guardado exitosamente!');
              
              // Actualizar UI del cuadro post-venta
              const wrap = modalDialog.querySelector('#post-sale-voucher-wrap');
              if (wrap) {
                wrap.style.background = 'rgba(16, 185, 129, 0.06)';
                wrap.style.borderColor = '#10b981';
                wrap.innerHTML = `
                  <div class="d-flex justify-between items-center flex-wrap gap-2">
                    <div class="d-flex items-center gap-2">
                      <img src="${b64}" id="post-sale-voucher-img" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #ccc; cursor: pointer;">
                      <div>
                        <strong style="color: #047857; font-size: 12px;">✓ Comprobante de Pago Adjuntado (${sale.metodoPago})</strong>
                        <div class="text-xs text-muted" style="font-size: 10.5px;">Haz clic en la imagen para ver en grande</div>
                      </div>
                    </div>
                    <div class="d-flex gap-2">
                      <button type="button" class="btn btn-secondary btn-sm" id="btn-post-view-voucher" style="font-size: 11px;">👁️ Ver Foto</button>
                    </div>
                  </div>
                `;
                wrap.querySelector('#btn-post-view-voucher').addEventListener('click', () => {
                  this.openVoucherPreviewModal(sale);
                });
                wrap.querySelector('#post-sale-voucher-img').addEventListener('click', () => {
                  this.openVoucherPreviewModal(sale);
                });
              }
            };

            const btnPostUpload = modalDialog.querySelector('#btn-post-upload-file');
            if (btnPostUpload && hiddenPostFile) {
              btnPostUpload.addEventListener('click', () => hiddenPostFile.click());
              hiddenPostFile.addEventListener('change', (e) => {
                const f = e.target.files[0];
                if (f) this.compressImage(f, handleVoucherSaved);
              });
            }

            const btnPostCam = modalDialog.querySelector('#btn-post-open-cam');
            if (btnPostCam) {
              btnPostCam.addEventListener('click', () => {
                this.openCameraCaptureModal((b64) => handleVoucherSaved(b64));
              });
            }

            const btnViewV = modalDialog.querySelector('#btn-post-view-voucher');
            if (btnViewV) {
              btnViewV.addEventListener('click', () => this.openVoucherPreviewModal(sale));
            }
            const imgV = modalDialog.querySelector('#post-sale-voucher-img');
            if (imgV) {
              imgV.addEventListener('click', () => this.openVoucherPreviewModal(sale));
            }
            const btnChangeV = modalDialog.querySelector('#btn-post-change-voucher');
            if (btnChangeV && hiddenPostFile) {
              btnChangeV.addEventListener('click', () => hiddenPostFile.click());
            }
          }

          // Switcher dinámico de pestañas
          if (modalDialog) {
            const tabInvBtn = modalDialog.querySelector('#btn-tab-preview-invoice');
            const tabShipBtn = modalDialog.querySelector('#btn-tab-preview-shipping');
            const viewInv = modalDialog.querySelector('#view-preview-invoice');
            const viewShip = modalDialog.querySelector('#view-preview-shipping');

            if (tabInvBtn && tabShipBtn && viewInv && viewShip) {
              tabInvBtn.addEventListener('click', () => {
                tabInvBtn.className = 'btn btn-sm btn-primary';
                tabShipBtn.className = 'btn btn-sm btn-secondary';
                viewInv.style.display = 'block';
                viewShip.style.display = 'none';
              });

              tabShipBtn.addEventListener('click', () => {
                tabShipBtn.className = 'btn btn-sm btn-primary';
                tabInvBtn.className = 'btn btn-sm btn-secondary';
                viewInv.style.display = 'none';
                viewShip.style.display = 'block';
              });
            }
          }

          // Limpiar carrito y reiniciar estado
          this.cart = [];
          this.currentReceiptB64 = null;
          this.render(container);
        }
      });
    });

    // Atajos de Teclado
    const handlePosKeys = (e) => {
      if (e.key === 'F4') {
        e.preventDefault();
        const cobrBtn = container.querySelector('#btn-process-sale');
        if (cobrBtn) cobrBtn.click();
      } else if (e.key === 'F2') {
        e.preventDefault();
        const search = container.querySelector('#pos-search-product');
        if (search) search.focus();
      }
    };
    window.addEventListener('keydown', handlePosKeys);
  },

  /**
   * MODAL: HISTORIAL COMPLETO DE VENTAS Y FACTURACIÓN
   */
  async openSalesHistoryModal(tenantId) {
    const [sales, shippingOrders] = await Promise.all([
      DB.getAll(STORES.SALES, tenantId),
      DB.getAll(STORES.ORDERS_SHIPPING, tenantId)
    ]);

    // Ordenar de más reciente a más antiguo
    sales.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    let filteredSales = [...sales];

    const historyDialog = Modal.show({
      title: '📜 Historial Completo de Ventas & Facturación Mostrador',
      size: 'xl',
      content: '<div id="sales-history-modal-container"></div>',
      footerButtons: [{ label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }]
    });

    const root = historyDialog.querySelector('#sales-history-modal-container');

    const renderHistoryContent = () => {
      const totalFacturado = filteredSales.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
      const conComprobante = filteredSales.filter(s => !!s.comprobantePagoUrl).length;

      root.innerHTML = `
        <!-- KPIs Superiores de Ventas -->
        <div class="pricing-kpi-grid mb-3">
          <div class="pricing-kpi-card kpi-price">
            <div class="pricing-kpi-info">
              <span class="pricing-kpi-label"><span>💰</span> Facturación Total</span>
              <span class="pricing-kpi-sub">${filteredSales.length} facturas</span>
            </div>
            <div class="pricing-kpi-data">
              <span class="pricing-kpi-value" style="color: var(--brand-primary);">${Formatters.currency(totalFacturado)}</span>
              <span class="badge badge-primary" style="font-size: 9.5px;">Ventas</span>
            </div>
          </div>

          <div class="pricing-kpi-card kpi-cost">
            <div class="pricing-kpi-info">
              <span class="pricing-kpi-label"><span>🧾</span> Facturas Registradas</span>
              <span class="pricing-kpi-sub">Total emitidas</span>
            </div>
            <div class="pricing-kpi-data">
              <span class="pricing-kpi-value" style="color: #0284c7;">${filteredSales.length}</span>
              <span class="badge badge-info" style="font-size: 9.5px;">Documentos</span>
            </div>
          </div>

          <div class="pricing-kpi-card kpi-profit">
            <div class="pricing-kpi-info">
              <span class="pricing-kpi-label"><span>📸</span> Con Comprobante Adjunto</span>
              <span class="pricing-kpi-sub">Vouchers verificados</span>
            </div>
            <div class="pricing-kpi-data">
              <span class="pricing-kpi-value" style="color: #047857;">${conComprobante}</span>
              <span class="badge badge-success font-bold" style="font-size: 9.5px;">Respaldados</span>
            </div>
          </div>
        </div>

        <!-- Barra de Búsqueda y Filtro por Método de Pago -->
        <div class="card p-2 mb-3" style="background: var(--bg-surface-solid); border-radius: 8px;">
          <div class="d-flex justify-between items-center gap-2 flex-wrap">
            <div style="flex: 2; min-width: 220px;">
              <input type="text" id="hist-search-inp" class="form-control form-control-sm" placeholder="🔍 Buscar por Factura, Cliente o NIT...">
            </div>
            <div style="flex: 1; min-width: 170px;">
              <select id="hist-filter-method" class="form-select form-select-sm font-bold">
                <option value="">-- Todos los Métodos de Pago --</option>
                <option value="Efectivo">💵 Efectivo</option>
                <option value="Nequi">📱 Nequi</option>
                <option value="Daviplata">📱 Daviplata</option>
                <option value="Transferencia">🏦 Transferencia Bancaria</option>
                <option value="Tarjeta">💳 Tarjeta Débito / Crédito</option>
                <option value="Crédito">📑 Crédito</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Tabla de Facturas -->
        <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
          <table class="table table-sm text-xs" style="margin-bottom: 0;">
            <thead>
              <tr>
                <th style="width: 110px;">No. Factura</th>
                <th style="width: 130px;">Fecha / Hora</th>
                <th>Cliente</th>
                <th style="width: 120px;">Método Pago</th>
                <th class="text-right" style="width: 100px;">Total</th>
                <th class="text-center" style="width: 120px;">Comprobante</th>
                <th class="text-right" style="width: 190px;">Acciones</th>
              </tr>
            </thead>
            <tbody id="hist-sales-tbody">
              ${renderRowsHtml(filteredSales)}
            </tbody>
          </table>
        </div>
        <input type="file" id="hist-hidden-attach-file" accept="image/*" style="display: none;">
      `;

      bindHistoryEvents();
    };

    const renderRowsHtml = (list) => {
      if (list.length === 0) {
        return `<tr><td colspan="7" class="text-center text-muted p-4">No se encontraron ventas con los filtros aplicados.</td></tr>`;
      }

      return list.map(s => {
        const isNonCash = s.metodoPago !== 'Efectivo';
        const d = new Date(s.fecha || Date.now());
        const fechaStr = d.toLocaleDateString('es-CO');
        const horaStr = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

        return `
          <tr>
            <td>
              <strong style="color: var(--brand-primary); font-size: 12px;">${s.consecutivo}</strong>
              <div>
                <span class="badge ${s.estado === 'PAGADA' ? 'badge-success' : 'badge-warning'}" style="font-size: 9px;">
                  ${s.estado || 'PAGADA'}
                </span>
              </div>
            </td>
            <td>
              <div>${fechaStr}</div>
              <div class="text-muted" style="font-size: 10px;">${horaStr}</div>
            </td>
            <td>
              <strong style="color: var(--text-main); font-size: 11.5px;">${s.clienteNombre || 'Mostrador'}</strong>
              <div class="text-muted" style="font-size: 10px;">NIT/CC: ${s.clienteNit || '-'}</div>
            </td>
            <td>
              <span class="badge badge-info font-bold">${s.metodoPago || 'Efectivo'}</span>
            </td>
            <td class="text-right font-bold" style="font-size: 12.5px; color: var(--text-main);">
              ${Formatters.currency(s.total || 0)}
            </td>
            <td class="text-center">
              ${s.comprobantePagoUrl ? `
                <button type="button" class="btn btn-secondary btn-sm btn-view-voucher" data-id="${s.id}" style="padding: 2px 8px; font-size: 10.5px; font-weight: 700;">
                  📸 Ver Foto
                </button>
              ` : (isNonCash ? `
                <button type="button" class="btn btn-primary btn-sm btn-attach-voucher-hist" data-id="${s.id}" style="padding: 2px 8px; font-size: 10.5px; font-weight: 700;">
                  📷 + Adjuntar
                </button>
              ` : `
                <span class="text-muted" style="font-size: 10.5px;">Efectivo</span>
              `)}
            </td>
            <td class="text-right">
              <div class="d-flex justify-end gap-1">
                <button type="button" class="btn btn-secondary btn-sm btn-hist-invoice" data-id="${s.id}" title="Imprimir Factura" style="padding: 3px 7px; font-size: 11px;">
                  🧾 Factura
                </button>
                <button type="button" class="btn btn-secondary btn-sm btn-hist-shipping" data-id="${s.id}" title="Imprimir Rótulo" style="padding: 3px 7px; font-size: 11px;">
                  🏷️ Rótulo
                </button>
                <button type="button" class="btn btn-secondary btn-sm btn-hist-detail" data-id="${s.id}" title="Ver Detalle" style="padding: 3px 7px; font-size: 11px;">
                  👁️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    };

    const bindHistoryEvents = () => {
      const searchInp = root.querySelector('#hist-search-inp');
      const methodSel = root.querySelector('#hist-filter-method');
      const tbody = root.querySelector('#hist-sales-tbody');
      const hiddenFile = root.querySelector('#hist-hidden-attach-file');
      let targetSaleForAttach = null;

      const applyFilters = () => {
        const q = (searchInp.value || '').toLowerCase().trim();
        const m = methodSel.value;

        filteredSales = sales.filter(s => {
          const matchQ = !q || 
            (s.consecutivo && s.consecutivo.toLowerCase().includes(q)) ||
            (s.clienteNombre && s.clienteNombre.toLowerCase().includes(q)) ||
            (s.clienteNit && s.clienteNit.toLowerCase().includes(q));
          const matchM = !m || s.metodoPago === m;
          return matchQ && matchM;
        });

        tbody.innerHTML = renderRowsHtml(filteredSales);
        bindRowActions();
      };

      searchInp.addEventListener('input', applyFilters);
      methodSel.addEventListener('change', applyFilters);

      const bindRowActions = () => {
        // Ver comprobante
        tbody.querySelectorAll('.btn-view-voucher').forEach(btn => {
          btn.addEventListener('click', () => {
            const sid = btn.getAttribute('data-id');
            const sale = sales.find(s => s.id === sid);
            if (sale) this.openVoucherPreviewModal(sale);
          });
        });

        // Adjuntar comprobante a venta histórica
        tbody.querySelectorAll('.btn-attach-voucher-hist').forEach(btn => {
          btn.addEventListener('click', () => {
            const sid = btn.getAttribute('data-id');
            targetSaleForAttach = sales.find(s => s.id === sid);
            if (!targetSaleForAttach) return;

            Modal.show({
              title: `📸 Adjuntar Comprobante - Factura ${targetSaleForAttach.consecutivo}`,
              size: 'sm',
              content: `
                <p class="text-xs text-muted mb-3">Elige cómo deseas adjuntar el comprobante para esta factura:</p>
                <div class="d-flex flex-col gap-2">
                  <button type="button" class="btn btn-secondary btn-sm p-3 text-left font-bold" id="btn-hist-subir-archivo">
                    📁 Subir Imagen / Captura de Pantalla
                  </button>
                  <button type="button" class="btn btn-primary btn-sm p-3 text-left font-bold" id="btn-hist-tomar-foto">
                    📷 Activar Cámara y Tomar Foto
                  </button>
                </div>
              `,
              footerButtons: [{ label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() }]
            });

            setTimeout(() => {
              const bSubir = document.getElementById('btn-hist-subir-archivo');
              const bFoto = document.getElementById('btn-hist-tomar-foto');

              if (bSubir) {
                bSubir.addEventListener('click', () => {
                  Modal.close();
                  hiddenFile.click();
                });
              }
              if (bFoto) {
                bFoto.addEventListener('click', () => {
                  Modal.close();
                  this.openCameraCaptureModal(async (b64) => {
                    targetSaleForAttach.comprobantePagoUrl = b64;
                    targetSaleForAttach.comprobanteFecha = new Date().toISOString();
                    await DB.update(STORES.SALES, targetSaleForAttach);
                    Toast.success(`¡Comprobante guardado en la factura ${targetSaleForAttach.consecutivo}!`);
                    renderHistoryContent();
                  });
                });
              }
            }, 50);
          });
        });

        // Reimprimir Factura
        tbody.querySelectorAll('.btn-hist-invoice').forEach(btn => {
          btn.addEventListener('click', () => {
            const sid = btn.getAttribute('data-id');
            const s = sales.find(sale => sale.id === sid);
            if (s) {
              const html = PrintTemplates.saleInvoice(s, s.items || []);
              ExportService.printDocument(html, `Factura_${s.consecutivo}`);
            }
          });
        });

        // Reimprimir Rótulo
        tbody.querySelectorAll('.btn-hist-shipping').forEach(btn => {
          btn.addEventListener('click', () => {
            const sid = btn.getAttribute('data-id');
            const s = sales.find(sale => sale.id === sid);
            const ship = shippingOrders.find(o => o.ventaId === sid || o.documentoNumero === s?.consecutivo);
            if (ship) {
              const html = PrintTemplates.shippingBoxLabel(ship);
              ExportService.printDocument(html, `Rotulo_${ship.numeroGuia}`);
            } else {
              // Generar rótulo instantáneo si no existe registro
              const instantShip = {
                transportadora: 'Coordinadora Mercantil',
                numeroGuia: `GUIA-${s?.consecutivo.replace(/\D/g, '') || '77092184531'}`,
                clienteNombre: s?.clienteNombre || 'Cliente General',
                nitCc: s?.clienteNit || '222222222222',
                telefono: '3124567890',
                ciudad: 'Medellín',
                departamento: 'Antioquia',
                direccion: 'Dirección Comercial',
                cajasTotal: 1,
                contenidoDescripcion: 'Productos Rayo Pro'
              };
              const html = PrintTemplates.shippingBoxLabel(instantShip);
              ExportService.printDocument(html, `Rotulo_${instantShip.numeroGuia}`);
            }
          });
        });

        // Ver Detalle
        tbody.querySelectorAll('.btn-hist-detail').forEach(btn => {
          btn.addEventListener('click', () => {
            const sid = btn.getAttribute('data-id');
            const s = sales.find(sale => sale.id === sid);
            if (s) {
              Modal.show({
                title: `Detalle de Factura ${s.consecutivo}`,
                size: 'md',
                content: `
                  <div class="mb-3 p-2 card" style="background: var(--bg-surface-solid); border-radius: 8px;">
                    <div class="d-flex justify-between text-xs">
                      <span>Cliente: <strong>${s.clienteNombre}</strong></span>
                      <span>Fecha: <strong>${new Date(s.fecha).toLocaleString('es-CO')}</strong></span>
                    </div>
                    <div class="d-flex justify-between text-xs mt-1">
                      <span>Método: <strong>${s.metodoPago}</strong></span>
                      <span>Estado: <strong class="text-success">${s.estado}</strong></span>
                    </div>
                  </div>
                  <table class="table table-sm text-xs mb-3">
                    <thead><tr><th>Producto</th><th class="text-center">Cant</th><th class="text-right">Unitario</th><th class="text-right">Subtotal</th></tr></thead>
                    <tbody>
                      ${(s.items || []).map(i => `
                        <tr>
                          <td><strong>${i.nombre}</strong> <span class="text-muted">(${i.sku})</span></td>
                          <td class="text-center font-bold">${i.cantidad}</td>
                          <td class="text-right">${Formatters.currency(i.precioUnitario)}</td>
                          <td class="text-right font-bold">${Formatters.currency(i.total)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <div class="d-flex justify-between font-bold" style="font-size: 14px; border-top: 1px solid var(--border-color); padding-top: 6px;">
                    <span>TOTAL FACTURADO:</span>
                    <span style="color: var(--brand-primary);">${Formatters.currency(s.total)}</span>
                  </div>
                `,
                footerButtons: [{ label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }]
              });
            }
          });
        });
      };

      if (hiddenFile) {
        hiddenFile.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file && targetSaleForAttach) {
            this.compressImage(file, async (b64) => {
              targetSaleForAttach.comprobantePagoUrl = b64;
              targetSaleForAttach.comprobanteFecha = new Date().toISOString();
              await DB.update(STORES.SALES, targetSaleForAttach);
              Toast.success(`¡Comprobante guardado en la factura ${targetSaleForAttach.consecutivo}!`);
              renderHistoryContent();
            });
          }
        });
      }

      bindRowActions();
    };

    renderHistoryContent();
  },

  /**
   * MODAL: VISOR DE COMPROBANTE DE PAGO EN ALTA RESOLUCIÓN
   */
  openVoucherPreviewModal(sale) {
    Modal.show({
      title: `📸 Comprobante de Pago - Factura ${sale.consecutivo}`,
      size: 'md',
      content: `
        <div style="text-align: center;">
          <div class="mb-2 p-2 card d-flex justify-between items-center text-xs" style="background: var(--bg-surface-solid); border-radius: 8px;">
            <span>Método: <strong>${sale.metodoPago}</strong></span>
            <span>Total: <strong style="color: var(--brand-primary); font-size: 13px;">${Formatters.currency(sale.total)}</strong></span>
          </div>
          <div style="max-height: 480px; overflow-y: auto; background: #1e293b; padding: 10px; border-radius: 8px;">
            <img src="${sale.comprobantePagoUrl}" style="max-width: 100%; max-height: 460px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
          </div>
        </div>
      `,
      footerButtons: [
        {
          label: '🖨️ Imprimir / Descargar',
          class: 'btn-primary',
          onClick: () => {
            const printWin = window.open('', '_blank');
            printWin.document.write(`
              <html>
                <head><title>Comprobante ${sale.consecutivo}</title></head>
                <body style="text-align:center; font-family:sans-serif; padding:20px;">
                  <h2>Comprobante de Pago - Factura ${sale.consecutivo}</h2>
                  <p>Cliente: ${sale.clienteNombre || 'Mostrador'} | Método: ${sale.metodoPago} | Total: ${Formatters.currency(sale.total)}</p>
                  <img src="${sale.comprobantePagoUrl}" style="max-width:90%; height:auto;">
                  <script>window.onload = () => { window.print(); window.close(); }<\/script>
                </body>
              </html>
            `);
            printWin.document.close();
          }
        },
        { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }
      ]
    });
  },

  /**
   * MODAL: CAPTURA DE FOTO CON CÁMARA INTERACTIVA (WEBRTC + FALLBACK)
   */
  openCameraCaptureModal(onCaptured) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Toast.info('Cámara web no soportada directamente. Abriendo cámara del dispositivo...');
      const fallbackInp = document.createElement('input');
      fallbackInp.type = 'file';
      fallbackInp.accept = 'image/*';
      fallbackInp.setAttribute('capture', 'environment');
      fallbackInp.onchange = (e) => {
        const file = e.target.files[0];
        if (file) this.compressImage(file, onCaptured);
      };
      fallbackInp.click();
      return;
    }

    let stream = null;
    let currentFacingMode = 'environment';

    const modalDialog = Modal.show({
      title: '📷 Tomar Foto del Comprobante',
      size: 'md',
      content: `
        <div style="text-align: center;">
          <p class="text-xs text-muted mb-2">Apunta la cámara al recibo, transferencia o comprobante y presiona "Capturar Foto".</p>
          <div style="position: relative; width: 100%; max-height: 380px; background: #000; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <video id="pos-cam-video" autoplay playsinline style="width: 100%; max-height: 380px; object-fit: contain;"></video>
            <canvas id="pos-cam-canvas" style="display: none;"></canvas>
          </div>
          <div class="d-flex justify-between items-center mt-3">
            <button type="button" class="btn btn-secondary btn-sm" id="pos-cam-switch">🔄 Cambiar Cámara</button>
            <button type="button" class="btn btn-primary btn-sm font-bold" id="pos-cam-snap" style="padding: 6px 18px; font-size: 13px;">
              📸 Capturar Foto
            </button>
          </div>
        </div>
      `,
      footerButtons: [
        {
          label: 'Cancelar',
          class: 'btn-secondary',
          onClick: () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
            Modal.close();
          }
        }
      ],
      onClose: () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
      }
    });

    const videoEl = modalDialog.querySelector('#pos-cam-video');
    const canvasEl = modalDialog.querySelector('#pos-cam-canvas');
    const snapBtn = modalDialog.querySelector('#pos-cam-snap');
    const switchBtn = modalDialog.querySelector('#pos-cam-switch');

    const startCamera = async (facing) => {
      try {
        if (stream) stream.getTracks().forEach(t => t.stop());
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        videoEl.srcObject = stream;
      } catch (err) {
        console.warn('Error al iniciar cámara directa:', err);
        Toast.warning('No se pudo acceder a la cámara directa. Abriendo selector de fotos...');
        Modal.close();
        const fallbackInp = document.createElement('input');
        fallbackInp.type = 'file';
        fallbackInp.accept = 'image/*';
        fallbackInp.setAttribute('capture', 'environment');
        fallbackInp.onchange = (e) => {
          const file = e.target.files[0];
          if (file) this.compressImage(file, onCaptured);
        };
        fallbackInp.click();
      }
    };

    startCamera(currentFacingMode);

    switchBtn.addEventListener('click', () => {
      currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
      startCamera(currentFacingMode);
    });

    snapBtn.addEventListener('click', () => {
      if (!videoEl.videoWidth) {
        Toast.warning('Esperando señal de la cámara...');
        return;
      }
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
      const ctx = canvasEl.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
      const b64 = canvasEl.toDataURL('image/jpeg', 0.82);
      if (stream) stream.getTracks().forEach(t => t.stop());
      Modal.close();
      onCaptured(b64);
    });
  },

  /**
   * Comprime y escala cualquier foto a un JPEG liviano (~100-200KB) para cuidar la memoria IndexedDB
   */
  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const compressedB64 = canvas.toDataURL('image/jpeg', 0.82);
        callback(compressedB64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};
