/**
 * Nexa ERP - Calculadora Fácil de Costos y Ganancias
 * Versión Optimizada en Espacio:
 * - 3 Mini-Widgets KPI Ejecutivos alineados horizontalmente (sin desperdicio vertical)
 * - Cuadrícula Compacta de 4 Columnas para Insumos de Fabricación
 * - Simulador de Precios y Ganancia Rápida
 * - 4 Tarjetas Horizontales Esbeltas para Canales Comerciales
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

    // Cálculos de costos
    const costoEmpaqueTotal = this.state.costoEnvase + this.state.costoTapa + this.state.costoEtiqueta + this.state.costoCajaMasterUnit;
    const costoTrabajoTotal = this.state.costoManoObraUnit + this.state.costoServiciosUnit;
    const subtotalDirecto = this.state.costoQuimico + costoEmpaqueTotal + costoTrabajoTotal;
    const costoDesperdicio = Math.round(subtotalDirecto * (this.state.pctMerma / 100));
    const costoTotalFinal = subtotalDirecto + costoDesperdicio;

    // Porcentajes para barra gráfica
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
      bg: 'rgba(16, 185, 129, 0.08)',
      border: '#10b981',
      icon: '🟢',
      titulo: 'Excelente Ganancia',
      desc: 'Margen saludable para venta comercial y mostrador.'
    };
    if (porcentajeGananciaReal < 15) {
      semaforo = {
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.08)',
        border: '#ef4444',
        icon: '🔴',
        titulo: 'Ganancia Muy Baja',
        desc: 'Margen estrecho con alto riesgo ante imprevistos.'
      };
    } else if (porcentajeGananciaReal < 30) {
      semaforo = {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.08)',
        border: '#f59e0b',
        icon: '🟡',
        titulo: 'Ganancia Moderada',
        desc: 'Ideal para ventas mayoristas o por volumen.'
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
      <div class="view-header mb-2" style="padding-bottom: 8px;">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1 style="font-size: 20px;">Calculadora Fácil de Costos y Ganancias</h1>
            <span class="badge badge-primary font-bold">PRECIOS INTELIGENTES</span>
          </div>
          <p class="text-xs text-muted mb-0">Costeo unitario exacto y fijación de precios comerciales con rentabilidad blindada</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-explicar-sencillo">❓ ¿Cómo funciona?</button>
          <button class="btn btn-primary btn-sm" id="btn-guardar-catalogo">💾 Guardar en Catálogo</button>
        </div>
      </div>

      <!-- Barra Compacta: Selector de Producto -->
      <div class="card p-2 mb-2" style="background: var(--bg-surface); border-radius: 10px;">
        <div class="d-flex justify-between items-center gap-2">
          <div class="d-flex items-center gap-2" style="flex: 1;">
            <span style="font-size: 18px;">🏷️</span>
            <span class="text-xs font-bold text-muted" style="white-space: nowrap;">PRODUCTO:</span>
            <select class="form-select form-select-sm font-bold" id="sel-calc-product" style="font-size: 13px; height: 32px;">
              <option value="">-- Modo Libre (Calcular cualquier producto nuevo) --</option>
              ${finishedGoods.map(fg => `
                <option value="${fg.id}" ${this.state.selectedProductId === fg.id ? 'selected' : ''}>
                  ${fg.nombre} (${fg.sku}) - Costo actual: ${Formatters.currency(fg.costo || 0)}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <a href="#formulas-vault" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 11.5px;">🧪 Bóveda</a>
          </div>
        </div>
      </div>

      <!-- ================================================================ -->
      <!-- 3 MINI-WIDGETS KPI EJECUTIVOS (COMPACTOS, ALINEADOS Y ELEGANTES) -->
      <!-- ================================================================ -->
      <div class="pricing-kpi-grid">
        
        <!-- KPI 1: Costo Total -->
        <div class="pricing-kpi-card kpi-cost">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label">
              <span>🏭</span> Costo Total
            </span>
            <span class="pricing-kpi-sub">Insumo + Empaque + Labor</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: #0284c7;">${Formatters.currency(costoTotalFinal)}</span>
            <span class="badge badge-info" style="font-size: 9.5px; padding: 2px 6px;">100% Costo Base</span>
          </div>
        </div>

        <!-- KPI 2: Precio de Venta -->
        <div class="pricing-kpi-card kpi-price">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label">
              <span>🏷️</span> Venta Sugerida
            </span>
            <span class="pricing-kpi-sub">${this.state.aplicaIva ? `Con IVA: <strong>${Formatters.currency(precioFinalConIva)}</strong>` : 'Precio sin IVA'}</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: var(--brand-primary);">${Formatters.currency(precioSinIva)}</span>
            <span class="badge badge-primary" style="font-size: 9.5px; padding: 2px 6px;">${this.state.modoCalculo === 'QUIERO_MARGEN' ? 'Margen Deseado' : 'Precio Fijo'}</span>
          </div>
        </div>

        <!-- KPI 3: Ganancia Limpia -->
        <div class="pricing-kpi-card kpi-profit">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label">
              <span>💰</span> Ganancia Neta
            </span>
            <span class="pricing-kpi-sub">Utilidad libre en caja</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: #047857;">+${Formatters.currency(gananciaLimpiaDinero)}</span>
            <span class="badge badge-success font-bold" style="font-size: 10px; padding: 2px 7px;">
              ${semaforo.icon} ${porcentajeGananciaReal}% Margen
            </span>
          </div>
        </div>

      </div>

      <!-- ================================================================ -->
      <!-- DOS PANELES PRINCIPALES: FÁBRICA Y ESTRATEGIA (ESPACIO ÓPTIMO)   -->
      <!-- ================================================================ -->
      <div class="nexa-two-columns mb-2">

        <!-- PANEL IZQUIERDO: INPUTS DE COSTOS (CUADRÍCULA COMPACTA DE 4 COL) -->
        <div class="card p-3" style="margin-bottom: 0; border-radius: 12px;">
          <div class="d-flex justify-between items-center mb-2">
            <h3 style="font-size: 13.5px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
              <span>1️⃣</span> Costos de Fabricación (1 Unidad)
            </h3>
            <span class="text-xs text-muted">Empaque: <strong>${Formatters.currency(costoEmpaqueTotal)}</strong></span>
          </div>

          <!-- CUADRÍCULA COMPACTA DE INPUTS -->
          <div class="cost-inputs-grid mb-2">
            
            <!-- Insumo Químico (Span 2) -->
            <div class="input-card-box-compact cost-input-span-2" style="border-left: 3px solid #0284c7;">
              <div class="box-label">
                <span style="color: #0284c7; font-weight: 800;">🧪 Químico / Líquido:</span>
                <span class="badge badge-info" style="font-size: 9px; padding: 1px 5px;">${pctQuimico}%</span>
              </div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted" style="font-size: 11px;">$</span>
                <input type="number" step="any" min="0" id="inp-cost-chem" value="${this.state.costoQuimico}">
              </div>
            </div>

            <!-- Botella / Tarro -->
            <div class="input-card-box-compact">
              <div class="box-label">🧴 Tarro / Botella:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted" style="font-size: 11px;">$</span>
                <input type="number" step="any" min="0" id="inp-cost-bottle" value="${this.state.costoEnvase}">
              </div>
            </div>

            <!-- Tapa / Atomizador -->
            <div class="input-card-box-compact">
              <div class="box-label">🔘 Tapa/Atomizador:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted" style="font-size: 11px;">$</span>
                <input type="number" step="any" min="0" id="inp-cost-cap" value="${this.state.costoTapa}">
              </div>
            </div>

            <!-- Etiqueta -->
            <div class="input-card-box-compact">
              <div class="box-label">🏷️ Etiqueta:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted" style="font-size: 11px;">$</span>
                <input type="number" step="any" min="0" id="inp-cost-label" value="${this.state.costoEtiqueta}">
              </div>
            </div>

            <!-- Caja máster unitaria -->
            <div class="input-card-box-compact">
              <div class="box-label">📦 Caja x unidad:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted" style="font-size: 11px;">$</span>
                <input type="number" step="any" min="0" id="inp-cost-box" value="${this.state.costoCajaMasterUnit}">
              </div>
            </div>

            <!-- Mano de Obra -->
            <div class="input-card-box-compact">
              <div class="box-label">👷 Labor/Envasado:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted" style="font-size: 11px;">$</span>
                <input type="number" step="any" min="0" id="inp-cost-mod" value="${this.state.costoManoObraUnit}">
              </div>
            </div>

            <!-- Servicios y Luz -->
            <div class="input-card-box-compact">
              <div class="box-label">⚡ Luz/Máquinas:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted" style="font-size: 11px;">$</span>
                <input type="number" step="any" min="0" id="inp-cost-serv" value="${this.state.costoServiciosUnit}">
              </div>
            </div>

            <!-- Merma Técnica (deslizador horizontal span 4) -->
            <div class="input-card-box-compact cost-input-span-4" style="padding: 4px 10px;">
              <div class="box-label" style="margin-bottom: 2px;">
                <span>💧 Desperdicio inevitable (Merma): <strong class="text-danger">${this.state.pctMerma}%</strong> (+${Formatters.currency(costoDesperdicio)})</span>
                <span class="text-muted text-xs">Ajuste técnico</span>
              </div>
              <input type="range" min="0" max="8" step="0.5" id="range-cost-merma" value="${this.state.pctMerma}" class="form-range w-100" style="height: 18px;">
            </div>

          </div>

          <!-- Barra Gráfica de Distribución Compacta -->
          <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px;">
            <div style="height: 8px; width: 100%; display: flex; border-radius: 4px; overflow: hidden;">
              <div style="width: ${pctQuimico}%; background: #0284c7;" title="Químicos: ${pctQuimico}%"></div>
              <div style="width: ${pctEmpaque}%; background: #f59e0b;" title="Empaque: ${pctEmpaque}%"></div>
              <div style="width: ${pctTrabajo}%; background: #8b5cf6;" title="Labor: ${pctTrabajo}%"></div>
            </div>
            <div class="d-flex justify-between text-xs mt-1" style="font-size: 10.5px;">
              <span style="color: #0284c7;">● Químico: <strong>${pctQuimico}%</strong></span>
              <span style="color: #d97706;">● Empaque: <strong>${pctEmpaque}%</strong></span>
              <span style="color: #7c3aed;">● Labor/Merma: <strong>${pctTrabajo}%</strong></span>
            </div>
          </div>

        </div>

        <!-- PANEL DERECHO: ESTRATEGIA Y SIMULADOR DE GANANCIA -->
        <div class="card p-3" style="margin-bottom: 0; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="d-flex justify-between items-center mb-2">
              <h3 style="font-size: 13.5px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
                <span>2️⃣</span> Estrategia y Ganancia
              </h3>
              <span class="badge badge-success font-bold" style="font-size: 10.5px;">Simulador</span>
            </div>

            <!-- Botones Compactos de Selección de Modo -->
            <div class="nexa-grid-2 mb-2">
              <button class="btn ${this.state.modoCalculo === 'QUIERO_MARGEN' ? 'btn-primary' : 'btn-secondary'} p-2 text-left mode-btn" data-mode="QUIERO_MARGEN" style="border-radius: 8px; height: auto;">
                <div class="font-bold" style="font-size: 12px;">🟢 Opción A: Quiero ganar un %</div>
                <div class="text-xs opacity-80" style="font-size: 10.5px;">Fijar margen deseado (ej: 35%)</div>
              </button>

              <button class="btn ${this.state.modoCalculo === 'TENGO_PRECIO' ? 'btn-primary' : 'btn-secondary'} p-2 text-left mode-btn" data-mode="TENGO_PRECIO" style="border-radius: 8px; height: auto;">
                <div class="font-bold" style="font-size: 12px;">🔵 Opción B: Tengo un precio fijo</div>
                <div class="text-xs opacity-80" style="font-size: 10.5px;">Cálculo inverso desde precio</div>
              </button>
            </div>

            <!-- Entrada de Datos Dinámica -->
            ${this.state.modoCalculo === 'QUIERO_MARGEN' ? `
              <div class="input-card-box-compact mb-2" style="background: rgba(0, 113, 227, 0.04); border-color: rgba(0, 113, 227, 0.2);">
                <div class="box-label">
                  <span class="text-primary font-bold">Porcentaje de Margen Deseado:</span>
                  <span class="badge badge-primary font-bold" style="font-size: 12px;">${this.state.margenDeseadoPct}%</span>
                </div>
                <input type="range" min="10" max="70" step="1" id="range-num-margen" value="${this.state.margenDeseadoPct}" class="form-range w-100 my-1">
                <div class="d-flex justify-between text-xs text-muted" style="font-size: 10px;">
                  <span>15% Distribuidor</span>
                  <span>35% Negocio</span>
                  <span>50% Detal</span>
                </div>
              </div>
            ` : `
              <div class="input-card-box-compact mb-2" style="background: rgba(0, 113, 227, 0.04); border-color: rgba(0, 113, 227, 0.2);">
                <div class="box-label text-primary font-bold">Precio de Venta Sugerido ($ COP sin IVA):</div>
                <div class="box-input-wrap">
                  <span style="font-size: 18px; font-weight: 800; color: var(--brand-primary);">$</span>
                  <input type="number" step="100" min="${costoTotalFinal + 100}" id="inp-precio-calle" value="${precioSinIva}" style="font-size: 16px; color: var(--brand-primary); height: 34px;">
                </div>
              </div>
            `}

            <!-- Semáforo de Salud Compacto -->
            <div class="p-2 mb-2" style="background: ${semaforo.bg}; border: 1px solid ${semaforo.border}; border-radius: 8px; display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">${semaforo.icon}</span>
              <div style="line-height: 1.2;">
                <strong style="color: ${semaforo.color}; font-size: 11.5px;">${semaforo.titulo}:</strong>
                <span style="font-size: 11px; color: var(--text-main);"> ${semaforo.desc}</span>
              </div>
            </div>
          </div>

          <!-- Checkbox IVA Compacto -->
          <div class="d-flex justify-between items-center p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px; font-size: 11.5px;">
            <div class="d-flex items-center gap-2">
              <input type="checkbox" id="chk-iva-simple" ${this.state.aplicaIva ? 'checked' : ''} style="width: 14px; height: 14px; cursor: pointer;">
              <label for="chk-iva-simple" class="font-bold" style="cursor: pointer; margin: 0;">¿Cobras IVA a tus clientes? (19%)</label>
            </div>
            <div>
              ${this.state.aplicaIva ? `
                <span>Final con IVA: <strong style="color: var(--brand-primary); font-size: 12.5px;">${Formatters.currency(precioFinalConIva)}</strong></span>
              ` : `
                <span class="badge badge-secondary" style="font-size: 10px;">Sin IVA</span>
              `}
            </div>
          </div>

        </div>

      </div>

      <!-- ================================================================ -->
      <!-- 4 TARJETAS HORIZONTALES ESBELTAS PARA PRECIOS SUGERIDOS          -->
      <!-- ================================================================ -->
      <div class="card p-3" style="border-radius: 12px;">
        <div class="d-flex justify-between items-center mb-2">
          <div>
            <h3 style="font-size: 13.5px; font-weight: 800; color: var(--text-main); margin: 0; display: flex; align-items: center; gap: 6px;">
              <span>📋</span> Los 4 Precios Sugeridos para tu Negocio
            </h3>
            <span class="text-xs text-muted">Precios escalonados calculados para garantizar rentabilidad en cada canal</span>
          </div>
          <span class="badge badge-info font-bold" style="font-size: 10.5px;">4 Canales</span>
        </div>

        <div class="pricing-horizontal-tiers">
          
          <!-- Tarjeta 1: Mostrador / Detal -->
          <div class="pricing-tier-card tier-p1">
            <div class="tier-col-segment">
              <div class="d-flex items-center gap-2">
                <span>🛒</span>
                <div>
                  <strong style="font-size: 12.5px; color: var(--text-main);">1. Cliente Mostrador</strong>
                  <div class="text-xs text-muted" style="font-size: 10px;">Venta directa al detal</div>
                </div>
              </div>
            </div>
            <div class="tier-col-profit">
              <span class="badge badge-success font-bold" style="font-size: 11px; padding: 3px 8px;">
                +${Formatters.currency(tiers.t1.g)} (50%)
              </span>
            </div>
            <div class="tier-col-net">
              <span class="text-xs text-muted">Base:</span>
              <strong style="font-size: 13.5px; color: var(--text-main);"> ${Formatters.currency(tiers.t1.p)}</strong>
            </div>
            <div class="tier-col-gross">
              <span class="text-xs text-muted">Con IVA:</span>
              <strong style="font-size: 14px; color: #10b981;"> ${Formatters.currency(tiers.t1.conIva)}</strong>
            </div>
          </div>

          <!-- Tarjeta 2: Talleres & Lavaderos -->
          <div class="pricing-tier-card tier-p2">
            <div class="tier-col-segment">
              <div class="d-flex items-center gap-2">
                <span>🚗</span>
                <div>
                  <strong style="font-size: 12.5px; color: var(--text-main);">2. Talleres & Lavaderos</strong>
                  <div class="text-xs text-muted" style="font-size: 10px;">Consumo comercial continuo</div>
                </div>
              </div>
            </div>
            <div class="tier-col-profit">
              <span class="badge badge-info font-bold" style="font-size: 11px; padding: 3px 8px;">
                +${Formatters.currency(tiers.t2.g)} (38%)
              </span>
            </div>
            <div class="tier-col-net">
              <span class="text-xs text-muted">Base:</span>
              <strong style="font-size: 13.5px; color: var(--text-main);"> ${Formatters.currency(tiers.t2.p)}</strong>
            </div>
            <div class="tier-col-gross">
              <span class="text-xs text-muted">Con IVA:</span>
              <strong style="font-size: 14px; color: #0284c7;"> ${Formatters.currency(tiers.t2.conIva)}</strong>
            </div>
          </div>

          <!-- Tarjeta 3: Mayorista -->
          <div class="pricing-tier-card tier-p3">
            <div class="tier-col-segment">
              <div class="d-flex items-center gap-2">
                <span>📦</span>
                <div>
                  <strong style="font-size: 12.5px; color: var(--text-main);">3. Mayorista</strong>
                  <div class="text-xs text-muted" style="font-size: 10px;">Por cajas x 12 unidades</div>
                </div>
              </div>
            </div>
            <div class="tier-col-profit">
              <span class="badge badge-warning font-bold" style="font-size: 11px; padding: 3px 8px;">
                +${Formatters.currency(tiers.t3.g)} (28%)
              </span>
            </div>
            <div class="tier-col-net">
              <span class="text-xs text-muted">Base:</span>
              <strong style="font-size: 13.5px; color: var(--text-main);"> ${Formatters.currency(tiers.t3.p)}</strong>
            </div>
            <div class="tier-col-gross">
              <span class="text-xs text-muted">Con IVA:</span>
              <strong style="font-size: 14px; color: #d97706;"> ${Formatters.currency(tiers.t3.conIva)}</strong>
            </div>
          </div>

          <!-- Tarjeta 4: Distribuidor -->
          <div class="pricing-tier-card tier-p4">
            <div class="tier-col-segment">
              <div class="d-flex items-center gap-2">
                <span>🚛</span>
                <div>
                  <strong style="font-size: 12.5px; color: var(--text-main);">4. Distribuidor</strong>
                  <div class="text-xs text-muted" style="font-size: 10px;">Volumen alto por pallets</div>
                </div>
              </div>
            </div>
            <div class="tier-col-profit">
              <span class="badge badge-secondary font-bold" style="font-size: 11px; padding: 3px 8px;">
                +${Formatters.currency(tiers.t4.g)} (18%)
              </span>
            </div>
            <div class="tier-col-net">
              <span class="text-xs text-muted">Base:</span>
              <strong style="font-size: 13.5px; color: var(--text-main);"> ${Formatters.currency(tiers.t4.p)}</strong>
            </div>
            <div class="tier-col-gross">
              <span class="text-xs text-muted">Con IVA:</span>
              <strong style="font-size: 14px; color: #7c3aed;"> ${Formatters.currency(tiers.t4.conIva)}</strong>
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
