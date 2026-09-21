/**
 * Nexa ERP - Módulo de Inteligencia de Costos & Precios (Unit Economics Engine)
 * Desglose industrial de 3 pilares (MPD + Empaque + MOD/CIF), cálculo directo e inverso,
 * representación dual (% y $ COP), simulación de listas P1-P5 y sección pedagógica explicativa.
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const PricingCalculatorModule = {
  // Estado reactivo del simulador
  state: {
    selectedProductId: null,
    productName: 'Producto Simulado',
    // 1. Materia Prima Directa (Químicos)
    costoQuimico: 3500,
    // 2. Materiales de Empaque
    costoEnvase: 1200,
    costoTapa: 400,
    costoEtiqueta: 350,
    costoCajaMasterUnit: 250, // Caja x 12 = $3000 / 12 = $250
    // 3. Conversión (MOD + CIF)
    costoManoObraUnit: 600,
    costoCifUnit: 400,
    pctMerma: 2.0, // 2% de merma técnica

    // Estrategia de Fijación
    modoCalculo: 'MARGEN_OBJETIVO', // o 'PRECIO_OBJETIVO' (inverso)
    margenDeseadoPct: 35.0, // 35% de margen
    precioVentaManual: 10000,
    aplicaIva: true,
    tasaIva: 19,

    // Listas de Precios Tiers (%)
    tierP1Margen: 45.0, // Mostrador
    tierP2Margen: 35.0, // Lavaderos
    tierP3Margen: 28.0, // Mayorista
    tierP4Margen: 20.0, // Distribuidor
    tierP5Margen: 15.0  // Convenio
  },

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [products, recipes, priceLists] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.RECIPES_BOM, tenantId),
      DB.getAll(STORES.PRICE_LISTS, tenantId)
    ]);

    // Verificar si vino transferido desde la Bóveda de Fórmulas
    const incomingFormulaRaw = sessionStorage.getItem('nexa_target_pricing_formula');
    if (incomingFormulaRaw) {
      try {
        const incomingFormula = JSON.parse(incomingFormulaRaw);
        sessionStorage.removeItem('nexa_target_pricing_formula');
        this.loadFromFormula(incomingFormula, products);
      } catch (e) {
        console.error('Error cargando fórmula transferida:', e);
      }
    }

    this.renderSimulator(container, tenantId, products, recipes, priceLists);
  },

  loadFromFormula(formula, products) {
    const rawMaterials = products.filter(p => p.tipoItem === 'MATERIA_PRIMA');
    let totalCost = 0;
    (formula.insumos || []).forEach(ins => {
      const mp = rawMaterials.find(m => m.id === ins.productoId) || {};
      const unitCost = mp.costo || mp.precioCompra || 0;
      totalCost += (ins.cantidad * unitCost);
    });

    const batchQty = Number(formula.cantidadProducir) || 1;
    const unitChemCost = batchQty > 0 ? (totalCost / batchQty) : totalCost;

    this.state.costoQuimico = Math.round(unitChemCost);
    this.state.productName = formula.nombreFormula || 'Fórmula Transferida';
    this.state.selectedProductId = formula.productoTerminadoId || null;
    Toast.info(`Costos químicos cargados desde la fórmula: ${Formatters.currency(unitChemCost)} / L`);
  },

  renderSimulator(container, tenantId, products, recipes, priceLists) {
    const finishedGoods = products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO');

    // CÁLCULOS MATEMÁTICOS Y FINANCIEROS (Core Engine)
    const empSubtotal = this.state.costoEnvase + this.state.costoTapa + this.state.costoEtiqueta + this.state.costoCajaMasterUnit;
    const modCifSubtotal = this.state.costoManoObraUnit + this.state.costoCifUnit;
    const costoBaseSuma = this.state.costoQuimico + empSubtotal + modCifSubtotal;
    const valorMerma = Math.round(costoBaseSuma * (this.state.pctMerma / 100));
    const costoTotalProduccion = costoBaseSuma + valorMerma; // CP

    // Cálculo Directo vs Inverso
    let precioBaseCalculado = 0;
    let margenRealPct = 0;
    let markupRealPct = 0;
    let utilidadBrutaDinero = 0;

    if (this.state.modoCalculo === 'MARGEN_OBJETIVO') {
      // Fórmula de Margen: P = CP / (1 - Margen)
      const margenFrac = (this.state.margenDeseadoPct || 0) / 100;
      if (margenFrac >= 1) {
        precioBaseCalculado = costoTotalProduccion * 2;
      } else {
        precioBaseCalculado = Math.round(costoTotalProduccion / (1 - margenFrac));
      }
      utilidadBrutaDinero = precioBaseCalculado - costoTotalProduccion;
      margenRealPct = precioBaseCalculado > 0 ? ((utilidadBrutaDinero / precioBaseCalculado) * 100) : 0;
      markupRealPct = costoTotalProduccion > 0 ? ((utilidadBrutaDinero / costoTotalProduccion) * 100) : 0;
      this.state.precioVentaManual = precioBaseCalculado;
    } else {
      // Cálculo Inverso a partir de Precio de Venta
      precioBaseCalculado = Math.round(this.state.precioVentaManual || 0);
      utilidadBrutaDinero = precioBaseCalculado - costoTotalProduccion;
      margenRealPct = precioBaseCalculado > 0 ? ((utilidadBrutaDinero / precioBaseCalculado) * 100) : 0;
      markupRealPct = costoTotalProduccion > 0 ? ((utilidadBrutaDinero / costoTotalProduccion) * 100) : 0;
      this.state.margenDeseadoPct = Math.round(margenRealPct * 10) / 10;
    }

    // Impuestos
    const valorIva = this.state.aplicaIva ? Math.round(precioBaseCalculado * (this.state.tasaIva / 100)) : 0;
    const precioFinalConIva = precioBaseCalculado + valorIva;

    // Tiers Escalonados (P1 a P5)
    const computeTier = (margenPct) => {
      const frac = margenPct / 100;
      const pBase = frac < 1 ? Math.round(costoTotalProduccion / (1 - frac)) : (costoTotalProduccion * 1.5);
      const util = pBase - costoTotalProduccion;
      const iva = this.state.aplicaIva ? Math.round(pBase * (this.state.tasaIva / 100)) : 0;
      const mkp = costoTotalProduccion > 0 ? ((util / costoTotalProduccion) * 100) : 0;
      return { pBase, util, iva, pFinal: pBase + iva, margenPct, markupPct: mkp };
    };

    const tiers = {
      p1: computeTier(this.state.tierP1Margen),
      p2: computeTier(this.state.tierP2Margen),
      p3: computeTier(this.state.tierP3Margen),
      p4: computeTier(this.state.tierP4Margen),
      p5: computeTier(this.state.tierP5Margen)
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Calculadora de Costos & Precios (Unit Economics)</h1>
            <span class="badge badge-primary">FINANZAS ESTRATÉGICAS</span>
          </div>
          <p>Estructuración de costos industriales en 3 pilares, simulación directa e inversa, y fijación científica de precios</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-open-explainer">💡 ¿De dónde sale cada número?</button>
          <button class="btn btn-primary btn-sm" id="btn-apply-to-catalog">💾 Aplicar Precios al Catálogo</button>
        </div>
      </div>

      <!-- Selector de Producto o Fórmula Preexistente -->
      <div class="card p-3 mb-3" style="background: var(--bg-surface-solid); border-left: 4px solid var(--brand-primary);">
        <div class="d-flex justify-between items-center gap-3">
          <div class="d-flex items-center gap-2" style="flex: 1;">
            <span style="font-size: 20px;">📦</span>
            <div style="flex: 1;">
              <label class="text-xs font-bold text-muted">CARGAR DATOS DESDE PRODUCTO O FÓRMULA:</label>
              <select class="form-select form-select-sm" id="sel-load-product" style="font-weight: 700;">
                <option value="">-- Modo Simulación Libre (Sin vincular) --</option>
                ${finishedGoods.map(fg => `
                  <option value="${fg.id}" ${this.state.selectedProductId === fg.id ? 'selected' : ''}>
                    ${fg.nombre} (${fg.sku}) - Costo Actual: ${Formatters.currency(fg.costo || 0)}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div>
            <a href="#formulas-vault" class="btn btn-secondary btn-sm">🧪 Ir a Bóveda de Fórmulas</a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-3">
        
        <!-- COLUMNA IZQUIERDA: LOS 3 PILARES DEL COSTO (5 Columnas) -->
        <div class="col-span-5 d-flex flex-col gap-3">
          
          <!-- Pilar 1: Materia Prima -->
          <div class="card p-3" style="margin-bottom: 0;">
            <div class="d-flex justify-between items-center mb-2">
              <span class="font-bold text-xs" style="color: #0284c7;">1. MATERIA PRIMA DIRECTA (QUÍMICOS)</span>
              <span class="badge badge-info">${((this.state.costoQuimico / (costoTotalProduccion || 1)) * 100).toFixed(1)}% (${Formatters.currency(this.state.costoQuimico)})</span>
            </div>
            <div class="form-group mb-2">
              <label class="text-xs text-muted">Costo Insumos Químicos por Unidad:</label>
              <div class="d-flex items-center gap-1">
                <span class="text-xs font-bold">$</span>
                <input type="number" step="any" min="0" class="form-control form-control-sm font-bold" id="inp-cost-chem" value="${this.state.costoQuimico}">
              </div>
              <span class="text-xs text-muted" style="font-size: 10.5px;">Provisto por la fórmula química o compra directa</span>
            </div>
          </div>

          <!-- Pilar 2: Material de Empaque -->
          <div class="card p-3" style="margin-bottom: 0;">
            <div class="d-flex justify-between items-center mb-2">
              <span class="font-bold text-xs" style="color: #f59e0b;">2. MATERIAL DE EMPAQUE (ME)</span>
              <span class="badge badge-warning">${((empSubtotal / (costoTotalProduccion || 1)) * 100).toFixed(1)}% (${Formatters.currency(empSubtotal)})</span>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label class="text-xs text-muted">Botella / Garrafa:</label>
                <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-bottle" value="${this.state.costoEnvase}">
              </div>
              <div>
                <label class="text-xs text-muted">Tapa / Atomizador:</label>
                <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-cap" value="${this.state.costoTapa}">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-muted">Etiqueta Autoadhesiva:</label>
                <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-label" value="${this.state.costoEtiqueta}">
              </div>
              <div>
                <label class="text-xs text-muted">Caja Master (x unidad):</label>
                <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-box" value="${this.state.costoCajaMasterUnit}">
              </div>
            </div>
          </div>

          <!-- Pilar 3: Costos de Conversión (MOD + CIF) -->
          <div class="card p-3" style="margin-bottom: 0;">
            <div class="d-flex justify-between items-center mb-2">
              <span class="font-bold text-xs" style="color: #8b5cf6;">3. CONVERSIÓN & MERMA (MOD + CIF)</span>
              <span class="badge badge-secondary">${(((modCifSubtotal + valorMerma) / (costoTotalProduccion || 1)) * 100).toFixed(1)}% (${Formatters.currency(modCifSubtotal + valorMerma)})</span>
            </div>
            <div class="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label class="text-xs text-muted">Mano de Obra Directa:</label>
                <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-mod" value="${this.state.costoManoObraUnit}">
              </div>
              <div>
                <label class="text-xs text-muted">Costos Ind. Fab (CIF):</label>
                <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-cif" value="${this.state.costoCifUnit}">
              </div>
            </div>
            <div class="form-group mb-0">
              <div class="d-flex justify-between items-center">
                <label class="text-xs text-muted">Merma Técnica Esperada (%):</label>
                <strong class="text-xs text-danger">${this.state.pctMerma}% (${Formatters.currency(valorMerma)})</strong>
              </div>
              <input type="range" min="0" max="10" step="0.5" class="form-range w-100" id="inp-cost-merma" value="${this.state.pctMerma}">
            </div>
          </div>

          <!-- Resumen del Costo Total -->
          <div class="card p-3" style="background: rgba(16, 185, 129, 0.08); border: 2px solid #10b981;">
            <div class="text-xs text-muted font-bold">COSTO TOTAL UNITARIO DE FABRICACIÓN (CP):</div>
            <div class="d-flex justify-between items-baseline mt-1">
              <span style="font-size: 26px; font-weight: 800; color: #047857;">${Formatters.currency(costoTotalProduccion)}</span>
              <span class="badge badge-success">100% Absorción</span>
            </div>
            <div class="text-xs text-muted mt-1">
              MPD: ${Formatters.currency(this.state.costoQuimico)} | Empaque: ${Formatters.currency(empSubtotal)} | Operación: ${Formatters.currency(modCifSubtotal + valorMerma)}
            </div>
          </div>

        </div>

        <!-- COLUMNA DERECHA: SIMULADOR DE MARGEN, PRECIO & TIERS (7 Columnas) -->
        <div class="col-span-7 d-flex flex-col gap-3">
          
          <!-- Panel de Fijación Estratégica -->
          <div class="card p-4" style="margin-bottom: 0;">
            <div class="d-flex justify-between items-center mb-3">
              <h3 style="font-size: 16px; font-weight: 800; margin: 0;">Estrategia de Fijación de Precios</h3>
              
              <!-- Switch de Modo: Margen vs Precio Objetivo -->
              <div class="btn-group btn-group-sm">
                <button class="btn ${this.state.modoCalculo === 'MARGEN_OBJETIVO' ? 'btn-primary' : 'btn-secondary'} btn-sm mode-btn" data-mode="MARGEN_OBJETIVO">
                  📈 Fijar Margen %
                </button>
                <button class="btn ${this.state.modoCalculo === 'PRECIO_OBJETIVO' ? 'btn-primary' : 'btn-secondary'} btn-sm mode-btn" data-mode="PRECIO_OBJETIVO">
                  🎯 Inverso: Fijar Precio $
                </button>
              </div>
            </div>

            <!-- Controles según modo -->
            ${this.state.modoCalculo === 'MARGEN_OBJETIVO' ? `
              <div class="form-group mb-3">
                <div class="d-flex justify-between items-center mb-1">
                  <label class="form-label font-bold text-xs" style="margin: 0;">Margen Bruto Deseado sobre Precio de Venta:</label>
                  <div class="d-flex items-center gap-1">
                    <input type="number" step="0.5" min="1" max="95" class="form-control form-control-sm text-center font-bold" id="inp-target-margin" value="${this.state.margenDeseadoPct}" style="width: 75px;">
                    <span class="font-bold">%</span>
                  </div>
                </div>
                <input type="range" min="5" max="80" step="0.5" class="form-range w-100" id="range-target-margin" value="${this.state.margenDeseadoPct}">
                <div class="d-flex justify-between text-xs text-muted mt-1">
                  <span>10% (Distribuidor)</span>
                  <span>35% (Estándar B2B)</span>
                  <span>50% (Mostrador Retail)</span>
                  <span>70% (Alta Gama)</span>
                </div>
              </div>
            ` : `
              <div class="form-group mb-3">
                <label class="form-label font-bold text-xs">Precio de Venta Base Objetivo ($ COP antes de IVA):</label>
                <div class="d-flex items-center gap-2">
                  <span style="font-size: 18px; font-weight: 700;">$</span>
                  <input type="number" step="50" min="${costoTotalProduccion + 100}" class="form-control font-bold" id="inp-manual-price" value="${this.state.precioVentaManual}" style="font-size: 18px; color: var(--brand-primary);">
                </div>
                <span class="text-xs text-muted">El sistema calculará automáticamente qué margen y ganancia deja este precio.</span>
              </div>
            `}

            <!-- Resultados Duales (% y $ COP simultáneos) -->
            <div class="grid grid-cols-3 gap-2 p-3 mb-3" style="background: rgba(0, 113, 227, 0.05); border-radius: 10px; border: 1px solid rgba(0, 113, 227, 0.2);">
              <div>
                <span class="text-xs text-muted font-bold">PRECIO BASE SUGERIDO:</span>
                <div style="font-size: 20px; font-weight: 800; color: var(--brand-primary);">${Formatters.currency(precioBaseCalculado)}</div>
                <span class="text-xs text-muted">Antes de IVA</span>
              </div>
              <div>
                <span class="text-xs text-muted font-bold">UTILIDAD BRUTA UNITARIA:</span>
                <div style="font-size: 20px; font-weight: 800; color: #10b981;">+${Formatters.currency(utilidadBrutaDinero)}</div>
                <span class="text-xs text-muted font-bold text-success">Margen: ${margenRealPct.toFixed(1)}% ($ COP)</span>
              </div>
              <div>
                <span class="text-xs text-muted font-bold">MARKUP EQUIVALENTE:</span>
                <div style="font-size: 20px; font-weight: 800; color: #f59e0b;">${markupRealPct.toFixed(1)}%</div>
                <span class="text-xs text-muted">Sobre el costo</span>
              </div>
            </div>

            <!-- Desglose Tributario (IVA) -->
            <div class="p-3 mb-2" style="background: var(--bg-surface-solid); border-radius: 8px; border: 1px solid var(--border-color);">
              <div class="d-flex justify-between items-center mb-2">
                <div class="d-flex items-center gap-2">
                  <input type="checkbox" id="chk-pricing-iva" ${this.state.aplicaIva ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                  <label for="chk-pricing-iva" class="font-bold text-xs" style="cursor: pointer; margin: 0;">Aplicar IVA General de Colombia (19%)</label>
                </div>
                <span class="badge ${this.state.aplicaIva ? 'badge-primary' : 'badge-secondary'}">${this.state.aplicaIva ? 'Con IVA' : 'Exento'}</span>
              </div>
              
              <div class="d-flex justify-between items-center text-xs">
                <span>Base Gravable: <strong>${Formatters.currency(precioBaseCalculado)}</strong></span>
                <span>+ IVA (19%): <strong class="text-danger">${Formatters.currency(valorIva)}</strong></span>
                <span>Precio Final Cliente: <strong class="text-primary" style="font-size: 14px;">${Formatters.currency(precioFinalConIva)}</strong></span>
              </div>
            </div>

          </div>

          <!-- Matriz de Precios por Canales (P1 a P5) -->
          <div class="card p-3" style="margin-bottom: 0;">
            <div class="d-flex justify-between items-center mb-2">
              <h4 style="font-size: 14px; font-weight: 800; margin: 0;">Cascada de Precios por Niveles (Pricing Tiers)</h4>
              <span class="text-xs text-muted font-bold">Representación Dual: % y $ COP</span>
            </div>

            <div class="table-responsive">
              <table class="table table-sm text-xs" style="margin-bottom: 0;">
                <thead>
                  <tr>
                    <th>Nivel / Canal</th>
                    <th class="text-center">Margen % y $ Ganancia</th>
                    <th class="text-center">Markup %</th>
                    <th class="text-right">Precio Base</th>
                    <th class="text-right">Precio Final (IVA)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>P1 - Mostrador / Público</strong></td>
                    <td class="text-center"><span class="badge badge-success font-bold">${tiers.p1.margenPct}% (+${Formatters.currency(tiers.p1.util)})</span></td>
                    <td class="text-center text-muted">${tiers.p1.markupPct.toFixed(1)}%</td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.p1.pBase)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.p1.pFinal)}</td>
                  </tr>
                  <tr>
                    <td><strong>P2 - Talleres & Lavaderos</strong></td>
                    <td class="text-center"><span class="badge badge-info font-bold">${tiers.p2.margenPct}% (+${Formatters.currency(tiers.p2.util)})</span></td>
                    <td class="text-center text-muted">${tiers.p2.markupPct.toFixed(1)}%</td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.p2.pBase)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.p2.pFinal)}</td>
                  </tr>
                  <tr>
                    <td><strong>P3 - Mayorista (Cajas x 12)</strong></td>
                    <td class="text-center"><span class="badge badge-warning font-bold">${tiers.p3.margenPct}% (+${Formatters.currency(tiers.p3.util)})</span></td>
                    <td class="text-center text-muted">${tiers.p3.markupPct.toFixed(1)}%</td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.p3.pBase)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.p3.pFinal)}</td>
                  </tr>
                  <tr>
                    <td><strong>P4 - Distribuidor Regional</strong></td>
                    <td class="text-center"><span class="badge badge-secondary font-bold">${tiers.p4.margenPct}% (+${Formatters.currency(tiers.p4.util)})</span></td>
                    <td class="text-center text-muted">${tiers.p4.markupPct.toFixed(1)}%</td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.p4.pBase)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.p4.pFinal)}</td>
                  </tr>
                  <tr>
                    <td><strong>P5 - Convenio Especial</strong></td>
                    <td class="text-center"><span class="badge badge-secondary font-bold">${tiers.p5.margenPct}% (+${Formatters.currency(tiers.p5.util)})</span></td>
                    <td class="text-center text-muted">${tiers.p5.markupPct.toFixed(1)}%</td>
                    <td class="text-right font-bold">${Formatters.currency(tiers.p5.pBase)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(tiers.p5.pFinal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;

    this.bindEvents(container, tenantId, products, recipes, priceLists, {
      costoTotalProduccion,
      precioBaseCalculado,
      precioFinalConIva,
      tiers
    });
  },

  bindEvents(container, tenantId, products, recipes, priceLists, computed) {
    const rerender = () => this.renderSimulator(container, tenantId, products, recipes, priceLists);

    // Cargar producto existente
    const selProd = container.querySelector('#sel-load-product');
    selProd.addEventListener('change', () => {
      const pid = selProd.value;
      if (!pid) {
        this.state.selectedProductId = null;
        rerender();
        return;
      }
      const prod = products.find(p => p.id === pid);
      if (prod) {
        this.state.selectedProductId = prod.id;
        this.state.productName = prod.nombre;
        if (prod.costo > 0) {
          this.state.costoQuimico = Math.round(prod.costo * 0.6); // 60% químico estimado
          this.state.costoEnvase = Math.round(prod.costo * 0.25);  // 25% envase
          this.state.costoTapa = Math.round(prod.costo * 0.08);
          this.state.costoEtiqueta = Math.round(prod.costo * 0.07);
        }
        if (prod.precioVenta > 0) {
          this.state.precioVentaManual = prod.precioVenta;
        }
        Toast.info(`Datos precargados desde "${prod.nombre}"`);
        rerender();
      }
    });

    // Inputs de Costos
    const bindInput = (id, prop) => {
      const el = container.querySelector(id);
      if (el) {
        el.addEventListener('input', () => {
          this.state[prop] = Number(el.value) || 0;
          rerender();
        });
      }
    };

    bindInput('#inp-cost-chem', 'costoQuimico');
    bindInput('#inp-cost-bottle', 'costoEnvase');
    bindInput('#inp-cost-cap', 'costoTapa');
    bindInput('#inp-cost-label', 'costoEtiqueta');
    bindInput('#inp-cost-box', 'costoCajaMasterUnit');
    bindInput('#inp-cost-mod', 'costoManoObraUnit');
    bindInput('#inp-cost-cif', 'costoCifUnit');
    bindInput('#inp-cost-merma', 'pctMerma');

    // Modo de cálculo (Margen vs Precio)
    container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.modoCalculo = btn.getAttribute('data-mode');
        rerender();
      });
    });

    // Control de Margen
    const inpMargin = container.querySelector('#inp-target-margin');
    const rangeMargin = container.querySelector('#range-target-margin');
    if (inpMargin) {
      inpMargin.addEventListener('input', () => {
        this.state.margenDeseadoPct = Number(inpMargin.value) || 0;
        rerender();
      });
    }
    if (rangeMargin) {
      rangeMargin.addEventListener('input', () => {
        this.state.margenDeseadoPct = Number(rangeMargin.value) || 0;
        rerender();
      });
    }

    // Control de Precio Inverso
    const inpPrice = container.querySelector('#inp-manual-price');
    if (inpPrice) {
      inpPrice.addEventListener('input', () => {
        this.state.precioVentaManual = Number(inpPrice.value) || 0;
        rerender();
      });
    }

    // Checkbox IVA
    const chkIva = container.querySelector('#chk-pricing-iva');
    if (chkIva) {
      chkIva.addEventListener('change', () => {
        this.state.aplicaIva = chkIva.checked;
        rerender();
      });
    }

    // Modal Explicativo "¿De dónde sale cada número?"
    container.querySelector('#btn-open-explainer').addEventListener('click', () => {
      this.openFinancialExplainerModal(computed);
    });

    // Botón Aplicar al Catálogo
    container.querySelector('#btn-apply-to-catalog').addEventListener('click', async () => {
      await this.applyPricesToCatalog(tenantId, products, computed);
    });
  },

  /**
   * Modal Pedagógico con Matemáticas Financieras Explicadas
   */
  openFinancialExplainerModal(computed) {
    const cp = computed.costoTotalProduccion;
    const p = computed.precioBaseCalculado;
    const util = p - cp;
    const margin = p > 0 ? ((util / p) * 100).toFixed(1) : 0;
    const markup = cp > 0 ? ((util / cp) * 100).toFixed(1) : 0;

    Modal.show({
      title: '💡 Pensamiento Financiero: ¿De dónde sale cada número?',
      size: 'lg',
      content: `
        <div style="font-size: 13px; line-height: 1.5; color: var(--text-main);">
          
          <div class="card p-3 mb-3" style="background: rgba(0, 113, 227, 0.05); border-left: 4px solid var(--brand-primary);">
            <h4 style="font-size: 14px; font-weight: 800; color: var(--brand-primary); margin-bottom: 4px;">
              1. ¿Por qué Margen NO es lo mismo que Markup? (El error común en PYMEs)
            </h4>
            <p>
              Muchas empresas cometen el error de calcular: <em>Costo ($10.000) + 30% = $13.000</em>, creyendo que su margen de rentabilidad es del 30%. 
              <strong>Esto es matemáticamente falso:</strong>
            </p>
            <ul>
              <li><strong>Markup (${markup}%):</strong> Es lo que le sumas <em>encima del costo</em>. Ganancia / Costo = ${Formatters.currency(util)} / ${Formatters.currency(cp)} = <strong>${markup}% (${Formatters.currency(util)})</strong>.</li>
              <li><strong>Margen Real (${margin}%):</strong> Es la proporción del <em>dinero que paga el cliente</em> que queda en tu bolsillo. Ganancia / Precio = ${Formatters.currency(util)} / ${Formatters.currency(p)} = <strong>${margin}% (${Formatters.currency(util)})</strong>.</li>
            </ul>
            <div class="p-2" style="background: var(--bg-surface); border-radius: 6px; font-family: monospace; font-size: 12px;">
              Fórmula de Margen Real: Precio = Costo / (1 - Margen%)<br>
              ${Formatters.currency(p)} = ${Formatters.currency(cp)} / (1 - ${(Number(margin)/100).toFixed(2)})
            </div>
          </div>

          <div class="card p-3 mb-3" style="background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981;">
            <h4 style="font-size: 14px; font-weight: 800; color: #047857; margin-bottom: 4px;">
              2. Cómo funciona el Cálculo Inverso (Target Pricing)
            </h4>
            <p>
              Si el mercado te impone vender este producto en <strong>${Formatters.currency(p)}</strong>:
            </p>
            <ul>
              <li>Tu Utilidad Bruta neta por botella es: <em>${Formatters.currency(p)} - ${Formatters.currency(cp)} = </em> <strong class="text-success">+${Formatters.currency(util)} COP</strong>.</li>
              <li>Tu Margen Porcentual resultante es: <em>(${Formatters.currency(util)} / ${Formatters.currency(p)}) × 100 = </em> <strong class="text-success">${margin}% (${Formatters.currency(util)})</strong>.</li>
            </ul>
          </div>

          <div class="card p-3 mb-0" style="background: rgba(245, 158, 11, 0.05); border-left: 4px solid #f59e0b;">
            <h4 style="font-size: 14px; font-weight: 800; color: #b45309; margin-bottom: 4px;">
              3. ¿Por qué el IVA (19%) nunca debe contarse en tus ganancias?
            </h4>
            <p style="margin-bottom: 0;">
              El IVA es un recaudo que le haces al Estado. Si vendes en <strong>${Formatters.currency(computed.precioFinalConIva)}</strong> con IVA, los <strong>${Formatters.currency(computed.precioFinalConIva - p)}</strong> no te pertenecen y debes transferirlos a la DIAN. Tus utilidades y márgenes se deben medir <em>estrictamente</em> sobre los <strong>${Formatters.currency(p)}</strong> base.
            </p>
          </div>

        </div>
      `,
      footerButtons: [{ label: 'Entendido', class: 'btn-primary', onClick: () => Modal.close() }]
    });
  },

  /**
   * Guarda los precios directamente en el Producto y Listas de Precios
   */
  async applyPricesToCatalog(tenantId, products, computed) {
    if (!this.state.selectedProductId) {
      Modal.show({
        title: 'Seleccione el Producto Destino',
        content: `
          <p class="text-xs text-muted mb-3">Para aplicar estos precios calculados, elija el producto de su catálogo que desea actualizar:</p>
          <div class="form-group">
            <select class="form-select" id="modal-sel-target-prod">
              ${products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO').map(p => `
                <option value="${p.id}">${p.nombre} (${p.sku})</option>
              `).join('')}
            </select>
          </div>
        `,
        footerButtons: [
          { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
          {
            label: 'Confirmar y Guardar',
            class: 'btn-primary',
            onClick: async () => {
              const targetId = document.getElementById('modal-sel-target-prod').value;
              this.state.selectedProductId = targetId;
              Modal.close();
              await this.executeCatalogUpdate(tenantId, targetId, products, computed);
            }
          }
        ]
      });
      return;
    }

    await this.executeCatalogUpdate(tenantId, this.state.selectedProductId, products, computed);
  },

  async executeCatalogUpdate(tenantId, productId, products, computed) {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    // Actualizar costo y precio base en el producto
    prod.costo = computed.costoTotalProduccion;
    prod.precioVenta = computed.precioBaseCalculado;
    prod.preciosEspeciales = {
      ...(prod.preciosEspeciales || {}),
      plist_1: computed.tiers.p1.pBase,
      plist_2: computed.tiers.p2.pBase,
      plist_3: computed.tiers.p3.pBase,
      plist_4: computed.tiers.p4.pBase,
      plist_5: computed.tiers.p5.pBase
    };
    prod.fechaModificacion = new Date().toISOString();

    await DB.update(STORES.PRODUCTS, prod);
    Toast.success(`¡Precios actualizados exitosamente para "${prod.nombre}"! Costo: ${Formatters.currency(prod.costo)} | P1: ${Formatters.currency(computed.tiers.p1.pBase)}`);
  }
};
