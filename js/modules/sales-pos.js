/**
 * Nexa ERP - Módulo 7: Terminal de Ventas y POS Rápido
 * Facturación de mostrador, cotizaciones, remisiones, pagos locales (Nequi, Daviplata, Efectivo) y crédito
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

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [products, clients, priceLists, currentShift] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.CUSTOMERS, tenantId),
      DB.getAll(STORES.PRICE_LISTS, tenantId),
      CashService.getCurrentShift(tenantId)
    ]);

    // Filtrar solo productos comercializables (Terminados y Mercancía)
    const sellableProducts = products.filter(p => p.tipoItem !== 'MATERIA_PRIMA');

    this.cart = [];
    this.selectedClient = clients[0] || null;
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
          <button class="btn btn-secondary btn-sm" id="btn-view-sales-history">📜 Historial Ventas</button>
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
                  const price = (p.precios && p.precios[this.selectedPriceListId]) || p.costoPromedio * 1.5;
                  const isAvailable = p.stock > 0;
                  return `
                    <div class="pos-product-card card" data-product-id="${p.id}" style="cursor: ${isAvailable ? 'pointer' : 'not-allowed'}; margin-bottom: 0; padding: 8px 10px; border: 1px solid ${isAvailable ? 'var(--border-color)' : 'rgba(239, 68, 68, 0.3)'}; background: ${isAvailable ? 'var(--bg-surface)' : 'rgba(239, 68, 68, 0.08)'}; transition: transform 0.15s ease;">
                      <div class="text-xs font-bold" style="color: var(--brand-primary); font-size: 11px;">${p.sku}</div>
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
                <select class="form-select" id="pos-doc-type" style="width: auto; font-size: 11.5px; padding: 3px 6px;">
                  <option value="POS">Venta POS / Mostrador</option>
                  <option value="VENTA_CREDITO">Venta a Crédito Comercial</option>
                  <option value="COTIZACION">Cotización / Presupuesto</option>
                  <option value="REMISION">Remisión de Entrega</option>
                </select>
              </div>

              <!-- SELECTOR DE CLIENTE -->
              <div class="d-flex items-center gap-2 mb-1">
                <select class="form-select" id="pos-select-client" style="font-size: 11.5px; padding: 4px 8px;">
                  ${clients.map(c => `
                    <option value="${c.id}" ${this.selectedClient && this.selectedClient.id === c.id ? 'selected' : ''}>
                      ${c.nombre} (${c.tipoCliente}) - Saldo: ${Formatters.currency(c.saldoPendiente || 0)}
                    </option>
                  `).join('')}
                </select>
                <button class="btn btn-secondary btn-sm" id="btn-pos-add-client" title="Nuevo Cliente" style="padding: 4px 8px;">👤+</button>
              </div>

              <!-- BADGE INFORMATIVO DE RÉGIMEN TRIBUTARIO DEL CLIENTE -->
              <div id="pos-client-tax-badge" style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 113, 227, 0.05); border: 1px solid rgba(0, 113, 227, 0.15); border-radius: 6px; padding: 3px 6px; font-size: 10.5px;">
                <span id="pos-fe-status">⚡ Facturación Electrónica: <strong>Sí</strong></span>
                <span id="pos-iva-status" class="badge badge-success" style="font-size: 10px;">Con IVA (19%)</span>
              </div>
            </div>
          </div>

          <!-- TABLA DE ITEMS EN CARRITO -->
          <div class="card-body" style="padding: 6px 10px; flex: 1; overflow-y: auto; max-height: 220px;">
            <div class="table-responsive">
              <table class="data-table" style="font-size: 11.5px;" id="pos-cart-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-center" style="width: 55px;">Cant.</th>
                    <th class="text-right" style="width: 80px;">Precio</th>
                    <th class="text-right" style="width: 85px;">Total</th>
                    <th style="width: 25px;"></th>
                  </tr>
                </thead>
                <tbody id="pos-cart-tbody">
                  <tr><td colspan="5" class="text-center text-muted" style="padding: 16px;">Carrito vacío. Seleccione productos de la izquierda.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- LIQUIDACIÓN TRIBUTARIA Y TOTALES COMPACTOS -->
          <div class="card-footer" style="background: var(--bg-surface); padding: 10px 14px; border-top: 1px solid var(--border-color);">
            <div class="d-flex justify-between text-xs mb-1" style="font-size: 11.5px; color: var(--text-secondary);">
              <span>Subtotal Neto:</span>
              <strong id="pos-lbl-subtotal" style="color: var(--text-main);">$ 0</strong>
            </div>
            <div class="d-flex justify-between text-xs mb-1" style="font-size: 11.5px; color: var(--text-secondary);">
              <span>IVA Calculado:</span>
              <span id="pos-lbl-iva" style="color: var(--text-main);">$ 0</span>
            </div>
            <div class="d-flex justify-between text-base font-bold mb-2" style="font-size: 16px; color: var(--brand-primary); border-top: 1px solid var(--brand-primary); padding-top: 4px;">
              <span>TOTAL A PAGAR:</span>
              <span id="pos-lbl-total">$ 0</span>
            </div>

            <!-- FORMA DE PAGO & BOTÓN COBRAR -->
            <div class="form-row mb-2">
              <div class="form-group mb-0">
                <label class="form-label text-xs">Medio de Pago:</label>
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
                <label class="form-label text-xs">Pago Recibido ($ COP):</label>
                <input type="number" class="form-control" id="pos-inp-received" placeholder="Monto entregado" style="padding: 4px 8px; font-size: 11.5px;">
              </div>
            </div>

            <div class="d-flex justify-between items-center text-xs mb-2" id="pos-change-row" style="background: var(--bg-surface-solid); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-main);">
              <span>Cambio / Vueltas:</span>
              <strong class="text-success" id="pos-lbl-change" style="font-size: 13px;">$ 0</strong>
            </div>

            <button class="btn btn-primary w-100" id="btn-process-sale" style="padding: 9px; font-size: 14px; font-weight: 700;">
              ⚡ COBRAR Y FACTURAR (F4)
            </button>
          </div>
        </div>

      </div>
    `;

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

      // Opciones tributarias según configuración del cliente
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

      // Calcular cambio
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
      const unitPrice = (prod.precios && prod.precios[this.selectedPriceListId]) || prod.costoPromedio * 1.5;

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
      // Actualizar precios del carrito
      this.cart.forEach(item => {
        const p = sellableProducts.find(prod => prod.id === item.productoId);
        if (p && p.precios && p.precios[this.selectedPriceListId]) {
          item.precioUnitario = p.precios[this.selectedPriceListId];
        }
      });
      updateCartView();
      // Re-render productos
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

    // Crear nuevo cliente en tiempo real desde el POS (Módulo 2 Clientes)
    const btnPosAddClient = container.querySelector('#btn-pos-add-client');
    if (btnPosAddClient) {
      btnPosAddClient.addEventListener('click', () => {
        ClientsModule.openClientModal(null, tenantId, priceLists, async (newClient) => {
          // Recargar clientes actualizados desde IndexedDB
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
            if (newClient.listaPreciosId) {
              this.selectedPriceListId = newClient.listaPreciosId;
              const plSel = container.querySelector('#pos-select-pricelist');
              if (plSel) plSel.value = newClient.listaPreciosId;
              this.cart.forEach(item => {
                const p = sellableProducts.find(prod => prod.id === item.productoId);
                if (p && p.precios && p.precios[this.selectedPriceListId]) {
                  item.precioUnitario = p.precios[this.selectedPriceListId];
                }
              });
            }
            updateClientTaxBadge();
            updateCartView();
            Toast.success(`¡Cliente "${newClient.nombre}" creado y vinculado a la venta!`);
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

    // Limpiar carrito
    container.querySelector('#btn-clear-cart').addEventListener('click', () => {
      this.cart = [];
      updateCartView();
    });

    // PROCESAR VENTA
    container.querySelector('#btn-process-sale').addEventListener('click', async () => {
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
      const consecutivo = 'RP-' + Math.floor(10000 + Math.random() * 90000);
      const isCredit = metodoPago === 'Crédito' || tipoDoc === 'VENTA_CREDITO';

      // Si es a crédito, verificar cupo del cliente
      if (isCredit && this.selectedClient) {
        const nuevoSaldo = (this.selectedClient.saldoPendiente || 0) + totals.total;
        if (this.selectedClient.cupoCredito > 0 && nuevoSaldo > this.selectedClient.cupoCredito) {
          Toast.warning(`El cupo de crédito ($ ${Formatters.currency(this.selectedClient.cupoCredito)}) sería excedido. Saldo actual: ${Formatters.currency(this.selectedClient.saldoPendiente)}`);
          return;
        }
      }

      const received = Number(container.querySelector('#pos-inp-received').value || totals.total);
      const change = Math.max(0, received - totals.total);

      // 1. Guardar Venta
      const sale = {
        tenantId,
        consecutivo,
        tipoDoc,
        facturaElectronica: tieneFE,
        aplicaIva: cobraIva,
        clienteId: this.selectedClient ? this.selectedClient.id : 'cli_mostrador',
        clienteNombre: this.selectedClient ? this.selectedClient.nombre : 'Cliente Mostrador',
        clienteNit: this.selectedClient ? this.selectedClient.nitCc : '222222222222',
        vendedorId: 'usr_ventas',
        vendedorNombre: 'Valentina Restrepo',
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
        }))
      };

      await DB.add(STORES.SALES, sale);

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

      // 3. Si no es a crédito y hay turno de caja abierto, sumar al turno
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

      // 4. Si es crédito, registrar en CXC y actualizar saldo del cliente
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

      // 6. Preparar instantáneas para impresión y despacho (inmunes a la limpieza de carrito)
      const cartSnapshot = JSON.parse(JSON.stringify(this.cart));
      const clientSnapshot = this.selectedClient ? { ...this.selectedClient } : null;
      const totalUnidades = cartSnapshot.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
      const cajasTotal = Math.max(1, Math.ceil(totalUnidades / 12));
      const transportadoraDefecto = 'Coordinadora Mercantil';

      // 7. Registrar automáticamente el Despacho Logístico en ORDERS_SHIPPING (Módulo 4 y 8)
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
        observaciones: 'Manejar con precaución. Productos de mantenimiento y embellecimiento automotriz Rayo Pro. No volcar.'
      };

      try {
        await DB.add(STORES.ORDERS_SHIPPING, shippingRecord);
      } catch (err) {
        console.warn('Registro de orden de despacho automático:', err);
      }

      // 8. Generar HTML para comprobantes usando las plantillas oficiales membretadas
      const invoiceHtml = PrintTemplates.saleInvoice(sale, sale.items);
      const labelHtml = PrintTemplates.shippingBoxLabel(shippingRecord);

      // 9. Modal con vista previa interactiva por pestañas (Factura y Rótulo de Envío)
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
          <div id="view-preview-invoice" style="display: block; max-height: 420px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
            ${invoiceHtml}
          </div>

          <!-- CONTENEDOR VISTA PREVIA RÓTULO -->
          <div id="view-preview-shipping" style="display: none; max-height: 420px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
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

      // Switcher dinámico de pestañas dentro del modal
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

      this.cart = [];
      this.render(container);
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
  }
};
