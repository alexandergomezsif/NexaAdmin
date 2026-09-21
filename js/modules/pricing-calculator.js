/**
 * Nexa ERP - Calculadora Fácil de Costos y Ganancias
 * Diseñada en paneles tipo tarjeta (Card Grid) para máxima claridad visual y distribución armónica.
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const PricingCalculatorModule = {
  state: {
    selectedProductId: null,
    productName: 'Mi Producto',
    
    // Insumo Químico
    costoQuimico: 3500,
    
    // Tarjetas de Empaque
    costoEnvase: 1200,
    costoTapa: 400,
    costoEtiqueta: 350,
    costoCajaMasterUnit: 250,
    
    // Trabajo y Servicios
    costoManoObraUnit: 500,
    costoServiciosUnit: 300,
    pctMerma: 2.0,

    // Estrategia
    modoCalculo: 'QUIERO_MARGEN',
    margenDeseadoPct: 35,
    precioVentaManual: 11000,
    aplicaIva: true,
    tasaIva: 19
  },

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [products, recipes] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.RECIPES_BOM, tenantId)
    ]);

    const incomingRaw = sessionStorage.getItem('nexa_target_pricing_formula');
    if (incomingRaw) {
      try {
        const formula = JSON.parse(incomingRaw);
        sessionStorage.removeItem('nexa_target_pricing_formula');
        this.loadFromRecipe(formula, products);
      } catch (e) {
        console.error(e);
      }
    }

    this.renderView(container, tenantId, products, recipes);
  },

  loadFromRecipe(formula, products) {
    const rawMaterials = products.filter(p => p.tipoItem === 'MATERIA_PRIMA');
    let totalCost = 0;
    (formula.insumos || []).forEach(ins => {
      const mp = rawMaterials.find(m => m.id === ins.productoId) || {};
      const unitCost = mp.costo || mp.precioCompra || 0;
      totalCost += (ins.cantidad * unitCost);
    });

    const batchQty = Number(formula.cantidadProducir) || 1;
    const unitChemCost = batchQty > 0 ? Math.round(totalCost / batchQty) : Math.round(totalCost);

    this.state.costoQuimico = unitChemCost;
    this.state.productName = formula.nombreFormula || 'Producto de Receta';
    this.state.selectedProductId = formula.productoTerminadoId || null;
    Toast.success(`¡Costo cargado desde receta! ($${Formatters.currency(unitChemCost)})`);
  },

  renderView(container, tenantId, products, recipes) {
    const finishedGoods = products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO');

    // Cálculos
    const costoEmpaqueTotal = this.state.costoEnvase + this.state.costoTapa + this.state.costoEtiqueta + this.state.costoCajaMasterUnit;
    const costoTrabajoTotal = this.state.costoManoObraUnit + this.state.costoServiciosUnit;
    const subtotalDirecto = this.state.costoQuimico + costoEmpaqueTotal + costoTrabajoTotal;
    const costoDesperdicio = Math.round(subtotalDirecto * (this.state.pctMerma / 100));
    const costoTotalFinal = subtotalDirecto + costoDesperdicio;

    // Porcentajes de la barra
    const pctQuimico = costoTotalFinal > 0 ? Math.round((this.state.costoQuimico / costoTotalFinal) * 100) : 0;
    const pctEmpaque = costoTotalFinal > 0 ? Math.round((costoEmpaqueTotal / costoTotalFinal) * 100) : 0;
    const pctTrabajo = costoTotalFinal > 0 ? Math.max(0, 100 - pctQuimico - pctEmpaque) : 0;

    let precioSinIva = 0;
    let gananciaLimpiaDinero = 0;
    let porcentajeGananciaReal = 0;

    if (this.state.modoCalculo === 'QUIERO_MARGEN') {
      const margenFrac = (this.state.margenDeseadoPct || 0) / 100;
      precioSinIva = margenFrac >= 0.95 ? (costoTotalFinal * 2) : Math.round(costoTotalFinal / (1 - margenFrac));
      gananciaLimpiaDinero = precioSinIva - costoTotalFinal;
      porcentajeGananciaReal = this.state.margenDeseadoPct;
      this.state.precioVentaManual = precioSinIva;
    } else {
      precioSinIva = Math.round(this.state.precioVentaManual || 0);
      gananciaLimpiaDinero = precioSinIva - costoTotalFinal;
      porcentajeGananciaReal = precioSinIva > 0 ? Math.round(((gananciaLimpiaDinero / precioSinIva) * 100) * 10) / 10 : 0;
      this.state.margenDeseadoPct = Math.max(0, porcentajeGananciaReal);
    }

    const valorIva = this.state.aplicaIva ? Math.round(precioSinIva * (this.state.tasaIva / 100)) : 0;
    const precioFinalConIva = precioSinIva + valorIva;

    let semaforo = {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      border: '#10b981',
      icon: '🟢',
      titulo: '¡Excelente Ganancia!',
      desc: 'Muy buen margen para venta al detalle / mostrador.'
    };
    if (porcentajeGananciaReal < 15) {
      semaforo = {
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.1)',
        border: '#ef4444',
        icon: '🔴',
        titulo: 'Alerta: Ganancia Peligrosamente Baja',
        desc: 'A este precio cualquier imprevisto te deja en pérdida.'
      };
    } else if (porcentajeGananciaReal < 30) {
      semaforo = {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.1)',
        border: '#f59e0b',
        icon: '🟡',
        titulo: 'Ganancia Moderada (Ideal Mayorista)',
        desc: 'Margen ajustado para compras en volumen / cajas completas.'
      };
    }

    const calcTier = (m) => {
      const p = Math.round(costoTotalFinal / (1 - (m / 100)));
      const g = p - costoTotalFinal;
      const iva = this.state.aplicaIva ? Math.round(p * 0.19) : 0;
      return { p, g, iva, conIva: p + iva, m };
    };

    const tiers = {
      t1: calcTier(50),
      t2: calcTier(38),
      t3: calcTier(28),
      t4: calcTier(18)
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Calculadora Fácil de Costos y Ganancias</h1>
            <span class="badge badge-success">SISTEMA POR TARJETAS</span>
          </div>
          <p>Conoce exactamente cuánto cuesta fabricar tu producto y fija precios inteligentes con un solo clic</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-explicar-sencillo">❓ ¿Cómo funciona?</button>
          <button class="btn btn-primary btn-sm" id="btn-guardar-catalogo">💾 Guardar en Catálogo</button>
        </div>
      </div>

      <!-- Selector de Producto Destacado -->
      <div class="card p-3 mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px;">
        <div class="d-flex justify-between items-center gap-3">
          <div class="d-flex items-center gap-2" style="flex: 1;">
            <span style="font-size: 24px;">🏷️</span>
            <div style="flex: 1;">
              <div class="text-xs font-bold text-muted">SELECCIONA UN PRODUCTO PARA CARGAR SUS DATOS:</div>
              <select class="form-select form-select-sm font-bold" id="sel-calc-product" style="font-size: 13.5px;">
                <option value="">-- Modo Libre (Calcular cualquier producto nuevo) --</option>
                ${finishedGoods.map(fg => `
                  <option value="${fg.id}" ${this.state.selectedProductId === fg.id ? 'selected' : ''}>
                    ${fg.nombre} (${fg.sku}) - Costo registrado: ${Formatters.currency(fg.costo || 0)}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div>
            <a href="#formulas-vault" class="btn btn-secondary btn-sm">🧪 Importar de Bóveda</a>
          </div>
        </div>
      </div>

      <!-- DOS COLUMNAS PRINCIPALES LADO A LADO -->
      <div class="nexa-two-columns">

        <!-- ========================================================== -->
        <!-- COLUMNA 1: ¿CUÁNTO CUESTA FABRICARLO? (TARJETAS DE INGRESO) -->
        <!-- ========================================================== -->
        <div class="card p-4" style="margin-bottom: 0; border-radius: 14px;">
          
          <div class="d-flex justify-between items-center mb-3">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
              <span>1️⃣</span> ¿Cuánto cuesta fabricar 1 unidad?
            </h3>
            <span class="badge badge-primary font-bold">Costo Real</span>
          </div>

          <!-- Tarjeta Insumo Químico -->
          <div class="input-card-box mb-3" style="border-left: 4px solid #0284c7;">
            <div class="box-label">
              <span style="color: #0284c7;">🧪 Lo que va por dentro (Líquido / Químico):</span>
              <span class="badge badge-info">${pctQuimico}% del total</span>
            </div>
            <div class="box-input-wrap">
              <span class="font-bold text-muted">$</span>
              <input type="number" step="any" min="0" id="inp-cost-chem" value="${this.state.costoQuimico}">
            </div>
            <span class="text-xs text-muted mt-1" style="font-size: 11px;">El valor del químico que cabe exactamente en una botella.</span>
          </div>

          <!-- Cuadros Tarjeta: Empaque (Grid de 2x2) -->
          <div class="mb-3">
            <div class="d-flex justify-between items-center mb-2">
              <span class="text-xs font-bold" style="color: #d97706;">🧴 El Empaque (Tarro, Tapa y Etiquetas):</span>
              <strong style="color: #d97706; font-size: 12px;">Subtotal: ${Formatters.currency(costoEmpaqueTotal)} (${pctEmpaque}%)</strong>
            </div>

            <div class="nexa-grid-2">
              <div class="input-card-box">
                <div class="box-label">Tarro / Botella:</div>
                <div class="box-input-wrap">
                  <span class="font-bold text-muted">$</span>
                  <input type="number" step="any" min="0" id="inp-cost-bottle" value="${this.state.costoEnvase}">
                </div>
              </div>

              <div class="input-card-box">
                <div class="box-label">Tapa o Atomizador:</div>
                <div class="box-input-wrap">
                  <span class="font-bold text-muted">$</span>
                  <input type="number" step="any" min="0" id="inp-cost-cap" value="${this.state.costoTapa}">
                </div>
              </div>

              <div class="input-card-box">
                <div class="box-label">Etiqueta:</div>
                <div class="box-input-wrap">
                  <span class="font-bold text-muted">$</span>
                  <input type="number" step="any" min="0" id="inp-cost-label" value="${this.state.costoEtiqueta}">
                </div>
              </div>

              <div class="input-card-box">
                <div class="box-label">Caja x unidad:</div>
                <div class="box-input-wrap">
                  <span class="font-bold text-muted">$</span>
                  <input type="number" step="any" min="0" id="inp-cost-box" value="${this.state.costoCajaMasterUnit}">
                </div>
              </div>
            </div>
          </div>

          <!-- Cuadros Tarjeta: Trabajo y Servicios -->
          <div class="mb-3">
            <div class="d-flex justify-between items-center mb-2">
              <span class="text-xs font-bold" style="color: #7c3aed;">⚡ Trabajo, Servicios y Desperdicio:</span>
              <strong style="color: #7c3aed; font-size: 12px;">Subtotal: ${Formatters.currency(costoTrabajoTotal + costoDesperdicio)} (${pctTrabajo}%)</strong>
            </div>

            <div class="nexa-grid-2 mb-2">
              <div class="input-card-box">
                <div class="box-label">Pago por envasar:</div>
                <div class="box-input-wrap">
                  <span class="font-bold text-muted">$</span>
                  <input type="number" step="any" min="0" id="inp-cost-mod" value="${this.state.costoManoObraUnit}">
                </div>
              </div>

              <div class="input-card-box">
                <div class="box-label">Luz, agua y máquinas:</div>
                <div class="box-input-wrap">
                  <span class="font-bold text-muted">$</span>
                  <input type="number" step="any" min="0" id="inp-cost-serv" value="${this.state.costoServiciosUnit}">
                </div>
              </div>
            </div>

            <!-- Merma / Desperdicio -->
            <div class="input-card-box">
              <div class="box-label">
                <span>Desperdicio inevitable (Merma):</span>
                <strong class="text-danger">${this.state.pctMerma}% (+${Formatters.currency(costoDesperdicio)})</strong>
              </div>
              <input type="range" min="0" max="8" step="0.5" id="range-cost-merma" value="${this.state.pctMerma}" class="form-range w-100">
            </div>
          </div>

          <!-- Barra Gráfica de Distribución de Costo -->
          <div class="p-3 mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 10px;">
            <div class="d-flex justify-between items-center text-xs font-bold mb-2">
              <span>¿En qué se va tu dinero por botella?</span>
              <span class="text-primary">${Formatters.currency(costoTotalFinal)}</span>
            </div>
            <div style="height: 16px; width: 100%; display: flex; border-radius: 8px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);">
              <div style="width: ${pctQuimico}%; background: #0284c7;" title="Químicos: ${pctQuimico}%"></div>
              <div style="width: ${pctEmpaque}%; background: #f59e0b;" title="Empaque: ${pctEmpaque}%"></div>
              <div style="width: ${pctTrabajo}%; background: #8b5cf6;" title="Trabajo: ${pctTrabajo}%"></div>
            </div>
            <div class="d-flex justify-between text-xs mt-2" style="font-size: 11px;">
              <span style="color: #0284c7;">● Químicos: <strong>${pctQuimico}%</strong></span>
              <span style="color: #d97706;">● Empaque: <strong>${pctEmpaque}%</strong></span>
              <span style="color: #7c3aed;">● Trabajo: <strong>${pctTrabajo}%</strong></span>
            </div>
          </div>

          <!-- Tarjeta Grande: COSTO TOTAL -->
          <div class="p-3 text-center" style="background: rgba(16, 185, 129, 0.1); border: 2px dashed #10b981; border-radius: 12px;">
            <span class="text-xs text-muted font-bold">COSTO TOTAL DE CADA BOTELLA TERMINADA:</span>
            <div style="font-size: 30px; font-weight: 900; color: #047857; margin-top: 2px;">
              ${Formatters.currency(costoTotalFinal)} COP
            </div>
            <span class="text-xs text-muted">Es lo que te cuesta tener la botella lista para entregar.</span>
          </div>

        </div>

        <!-- ========================================================== -->
        <!-- COLUMNA 2: ¿CUÁNTO QUIERES GANAR? (SIMULADOR Y GANANCIAS) -->
        <!-- ========================================================== -->
        <div class="d-flex flex-col gap-3">
          
          <div class="card p-4" style="margin-bottom: 0; border-radius: 14px;">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>2️⃣</span> ¿Cuánto quieres ganar o a cuánto quieres vender?
            </h3>

            <!-- 2 Botones de Selección Gigantes -->
            <div class="nexa-grid-2 mb-3">
              <button class="btn ${this.state.modoCalculo === 'QUIERO_MARGEN' ? 'btn-primary' : 'btn-secondary'} p-3 text-left mode-btn" data-mode="QUIERO_MARGEN" style="border-radius: 10px; height: auto;">
                <div class="font-bold" style="font-size: 13px;">🟢 OPCIÓN A: Quiero ganar un %</div>
                <div class="text-xs opacity-80" style="margin-top: 2px;">"Quiero ganarme el 35% de la venta"</div>
              </button>

              <button class="btn ${this.state.modoCalculo === 'TENGO_PRECIO' ? 'btn-primary' : 'btn-secondary'} p-3 text-left mode-btn" data-mode="TENGO_PRECIO" style="border-radius: 10px; height: auto;">
                <div class="font-bold" style="font-size: 13px;">🔵 OPCIÓN B: Ya tengo un precio</div>
                <div class="text-xs opacity-80" style="margin-top: 2px;">"Quiero venderla a $11.000 fijos"</div>
              </button>
            </div>

            <!-- Entrada de Datos -->
            ${this.state.modoCalculo === 'QUIERO_MARGEN' ? `
              <div class="input-card-box mb-3" style="background: rgba(0, 113, 227, 0.04); border-color: rgba(0, 113, 227, 0.25);">
                <div class="box-label">
                  <span class="text-primary font-bold">Porcentaje de Ganancia que deseas:</span>
                  <span class="badge badge-primary" style="font-size: 13px;">${this.state.margenDeseadoPct}%</span>
                </div>
                <input type="range" min="10" max="70" step="1" id="range-num-margen" value="${this.state.margenDeseadoPct}" class="form-range w-100 my-2">
                <div class="d-flex justify-between text-xs text-muted">
                  <span>15% (Distribuidor)</span>
                  <span>35% (Estándar Negocio)</span>
                  <span>50% (Venta al Público)</span>
                </div>
              </div>
            ` : `
              <div class="input-card-box mb-3" style="background: rgba(0, 113, 227, 0.04); border-color: rgba(0, 113, 227, 0.25);">
                <div class="box-label text-primary font-bold">Escribe el precio de venta en la calle ($ COP sin IVA):</div>
                <div class="box-input-wrap">
                  <span style="font-size: 22px; font-weight: 800; color: var(--brand-primary);">$</span>
                  <input type="number" step="100" min="${costoTotalFinal + 100}" id="inp-precio-calle" value="${precioSinIva}" style="font-size: 20px; color: var(--brand-primary); height: 44px;">
                </div>
              </div>
            `}

            <!-- TARJETÓN RESULTADO: PRECIO VS GANANCIA LIMPIA -->
            <div class="nexa-grid-2 mb-3">
              <div class="p-3" style="background: var(--bg-surface-solid); border: 2px solid var(--border-color); border-radius: 12px; text-align: center;">
                <span class="text-xs text-muted font-bold">PRECIO DE VENTA:</span>
                <div style="font-size: 22px; font-weight: 900; color: var(--brand-primary); margin: 4px 0;">
                  ${Formatters.currency(precioSinIva)}
                </div>
                <span class="text-xs text-muted">Antes de cobrar el IVA</span>
              </div>

              <div class="p-3" style="background: rgba(16, 185, 129, 0.08); border: 2px solid #10b981; border-radius: 12px; text-align: center;">
                <span class="text-xs text-muted font-bold">TU GANANCIA LIMPIA:</span>
                <div style="font-size: 22px; font-weight: 900; color: #047857; margin: 4px 0;">
                  +${Formatters.currency(gananciaLimpiaDinero)}
                </div>
                <span class="badge badge-success font-bold" style="font-size: 11px;">
                  Margen: ${porcentajeGananciaReal}% en tu bolsillo
                </span>
              </div>
            </div>

            <!-- SEMÁFORO DE SALUD DE GANANCIA -->
            <div class="p-3 mb-3" style="background: ${semaforo.bg}; border: 1px solid ${semaforo.border}; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 26px;">${semaforo.icon}</div>
              <div>
                <strong style="color: ${semaforo.color}; font-size: 13px;">${semaforo.titulo}</strong>
                <div style="font-size: 11.5px; color: var(--text-main); margin-top: 2px;">${semaforo.desc}</div>
              </div>
            </div>

            <!-- Checkbox IVA -->
            <div class="d-flex justify-between items-center p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px; font-size: 12px;">
              <div class="d-flex items-center gap-2">
                <input type="checkbox" id="chk-iva-simple" ${this.state.aplicaIva ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                <label for="chk-iva-simple" class="font-bold" style="cursor: pointer; margin: 0;">¿Cobras IVA a tus clientes? (19%)</label>
              </div>
              <div>
                ${this.state.aplicaIva ? `
                  <span>Precio final con IVA: <strong style="font-size: 14px; color: var(--brand-primary);">${Formatters.currency(precioFinalConIva)}</strong></span>
                ` : `
                  <span class="badge badge-secondary">Sin IVA</span>
                `}
              </div>
            </div>

          </div>

          <!-- TABLA DE LOS 4 PRECIOS DE TU NEGOCIO -->
          <div class="card p-3" style="margin-bottom: 0; border-radius: 14px;">
            <div class="d-flex justify-between items-center mb-2">
              <h4 style="font-size: 13.5px; font-weight: 800; margin: 0;">📋 Los 4 Precios Sugeridos para tu Negocio</h4>
              <span class="text-xs text-muted">Calculados para ganar siempre</span>
            </div>

            <div class="table-responsive">
              <table class="table table-sm text-xs" style="margin-bottom: 0;">
                <thead>
                  <tr>
                    <th>¿A quién le vendes?</th>
                    <th class="text-center">Tu Ganancia</th>
                    <th class="text-right">Precio Sin IVA</th>
                    <th class="text-right">Precio Con IVA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>1. Cliente Mostrador</strong> <span class="text-muted">(Detal)</span></td>
                    <td class="text-center"><span class="badge badge-success font-bold">+${Formatters.currency(tiers.t1.g)} (50%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.t1.p)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.t1.conIva)}</td>
                  </tr>
                  <tr>
                    <td><strong>2. Talleres & Lavaderos</strong></td>
                    <td class="text-center"><span class="badge badge-info font-bold">+${Formatters.currency(tiers.t2.g)} (38%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.t2.p)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.t2.conIva)}</td>
                  </tr>
                  <tr>
                    <td><strong>3. Mayorista</strong> <span class="text-muted">(Cajas x 12)</span></td>
                    <td class="text-center"><span class="badge badge-warning font-bold">+${Formatters.currency(tiers.t3.g)} (28%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.t3.p)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.t3.conIva)}</td>
                  </tr>
                  <tr>
                    <td><strong>4. Distribuidor</strong> <span class="text-muted">(Por volumen)</span></td>
                    <td class="text-center"><span class="badge badge-secondary font-bold">+${Formatters.currency(tiers.t4.g)} (18%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.t4.p)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.t4.conIva)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;

    this.bindEvents(container, tenantId, products, recipes, {
      costoTotalFinal,
      precioSinIva,
      precioFinalConIva,
      tiers
    });
  },

  bindEvents(container, tenantId, products, recipes, calc) {
    const refresh = () => this.renderView(container, tenantId, products, recipes);

    const sel = container.querySelector('#sel-calc-product');
    sel.addEventListener('change', () => {
      const pid = sel.value;
      if (!pid) {
        this.state.selectedProductId = null;
        refresh();
        return;
      }
      const p = products.find(prod => prod.id === pid);
      if (p) {
        this.state.selectedProductId = p.id;
        this.state.productName = p.nombre;
        if (p.costo > 0) {
          this.state.costoQuimico = Math.round(p.costo * 0.6);
          this.state.costoEnvase = Math.round(p.costo * 0.25);
          this.state.costoTapa = Math.round(p.costo * 0.08);
          this.state.costoEtiqueta = Math.round(p.costo * 0.07);
        }
        if (p.precioVenta > 0) {
          this.state.precioVentaManual = p.precioVenta;
        }
        Toast.info(`Datos cargados de: ${p.nombre}`);
        refresh();
      }
    });

    const wire = (sel, k) => {
      const el = container.querySelector(sel);
      if (el) el.addEventListener('input', () => {
        this.state[k] = Number(el.value) || 0;
        refresh();
      });
    };

    wire('#inp-cost-chem', 'costoQuimico');
    wire('#inp-cost-bottle', 'costoEnvase');
    wire('#inp-cost-cap', 'costoTapa');
    wire('#inp-cost-label', 'costoEtiqueta');
    wire('#inp-cost-box', 'costoCajaMasterUnit');
    wire('#inp-cost-mod', 'costoManoObraUnit');
    wire('#inp-cost-serv', 'costoServiciosUnit');
    wire('#range-cost-merma', 'pctMerma');

    container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.modoCalculo = btn.getAttribute('data-mode');
        refresh();
      });
    });

    const rngM = container.querySelector('#range-num-margen');
    if (rngM) rngM.addEventListener('input', () => { this.state.margenDeseadoPct = Number(rngM.value) || 0; refresh(); });

    const inpP = container.querySelector('#inp-precio-calle');
    if (inpP) inpP.addEventListener('input', () => { this.state.precioVentaManual = Number(inpP.value) || 0; refresh(); });

    const chkIva = container.querySelector('#chk-iva-simple');
    if (chkIva) chkIva.addEventListener('change', () => { this.state.aplicaIva = chkIva.checked; refresh(); });

    container.querySelector('#btn-explicar-sencillo').addEventListener('click', () => {
      this.openExplainer(calc);
    });

    container.querySelector('#btn-guardar-catalogo').addEventListener('click', () => {
      this.saveToCatalog(tenantId, products, calc);
    });
  },

  openExplainer(calc) {
    Modal.show({
      title: '💡 Explicación Sencilla de tus Ganancias',
      content: `
        <div style="font-size: 13.5px; line-height: 1.5; color: var(--text-main);">
          <div class="card p-3 mb-3" style="background: rgba(0, 113, 227, 0.05); border-left: 4px solid var(--brand-primary);">
            <h4 style="font-size: 14px; font-weight: 800; color: var(--brand-primary); margin-bottom: 4px;">
              1. La Trampa del Porcentaje
            </h4>
            <p>
              Si fabricar la botella te costó <strong>$10.000</strong> y le sumas el 30% ($13.000), tu ganancia real en el bolsillo es de apenas el <strong>23%</strong>, porque $3.000 dividido en $13.000 da 23%.
            </p>
            <p style="margin-bottom: 0;">
              El sistema de Nexa calcula el precio real para que te quede el 30% neto de cada venta en la caja.
            </p>
          </div>

          <div class="card p-3 mb-0" style="background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981;">
            <h4 style="font-size: 14px; font-weight: 800; color: #047857; margin-bottom: 4px;">
              2. Tu Ganancia en este Producto
            </h4>
            <p style="margin-bottom: 0;">
              Por cada botella vendida a <strong>${Formatters.currency(calc.precioSinIva)}</strong>:<br>
              - Se te van <strong>${Formatters.currency(calc.costoTotalFinal)}</strong> en reponer insumos y envasado.<br>
              - Te quedan limpios <strong>+${Formatters.currency(calc.precioSinIva - calc.costoTotalFinal)} COP</strong> libres.
            </p>
          </div>
        </div>
      `,
      footerButtons: [{ label: '¡Entendido!', class: 'btn-primary', onClick: () => Modal.close() }]
    });
  },

  saveToCatalog(tenantId, products, calc) {
    const finished = products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO');
    Modal.show({
      title: 'Guardar Precios en el Catálogo',
      content: `
        <p class="text-xs text-muted mb-3">Elige a qué producto deseas aplicarle estos precios:</p>
        <div class="form-group mb-3">
          <select class="form-select font-bold" id="modal-sel-save-prod">
            ${finished.map(p => `
              <option value="${p.id}" ${this.state.selectedProductId === p.id ? 'selected' : ''}>
                ${p.nombre} (${p.sku})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="p-2 text-xs" style="background: var(--bg-surface-solid); border-radius: 6px;">
          Se guardará el Costo en <strong>${Formatters.currency(calc.costoTotalFinal)}</strong> y el Precio Mostrador en <strong>${Formatters.currency(calc.precioSinIva)}</strong>.
        </div>
      `,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Precios',
          class: 'btn-primary',
          onClick: async () => {
            const pid = document.getElementById('modal-sel-save-prod').value;
            const target = products.find(p => p.id === pid);
            if (target) {
              target.costo = calc.costoTotalFinal;
              target.precioVenta = calc.precioSinIva;
              target.preciosEspeciales = {
                ...(target.preciosEspeciales || {}),
                plist_1: calc.tiers.t1.p,
                plist_2: calc.tiers.t2.p,
                plist_3: calc.tiers.t3.p,
                plist_4: calc.tiers.t4.p
              };
              target.fechaModificacion = new Date().toISOString();
              await DB.update(STORES.PRODUCTS, target);
              Toast.success(`¡Precios guardados con éxito para ${target.nombre}!`);
              Modal.close();
            }
          }
        }
      ]
    });
  }
};
