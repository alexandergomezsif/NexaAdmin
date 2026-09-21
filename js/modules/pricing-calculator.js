/**
 * Nexa ERP - Calculadora de Costos & Precios Inteligentes
 * Flujo Guiado con Asistente Modal Paso a Paso (Wizard)
 * - Vista principal: Catálogo de productos con métricas, precios y botones de acción rápida
 * - Asistente Modal (Wizard): 4 pasos didácticos para fijar costos, márgenes y cascada comercial
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const PricingCalculatorModule = {
  products: [],
  recipes: [],
  tenantId: 'tenant_rayopro',

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    this.tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [products, recipes] = await Promise.all([
      DB.getAll(STORES.PRODUCTS, this.tenantId),
      DB.getAll(STORES.RECIPES_BOM, this.tenantId)
    ]);
    this.products = products;
    this.recipes = recipes;

    // Verificar si se solicitó abrir el asistente con una fórmula desde la Bóveda
    const incomingRaw = sessionStorage.getItem('nexa_target_pricing_formula');
    if (incomingRaw) {
      try {
        const formula = JSON.parse(incomingRaw);
        sessionStorage.removeItem('nexa_target_pricing_formula');
        this.renderMainView(container);
        this.openPricingWizard(null, formula, () => this.render(container));
        return;
      } catch (e) {
        console.error(e);
      }
    }

    this.renderMainView(container);
  },

  renderMainView(container) {
    const finishedGoods = this.products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO');
    
    // Métricas del catálogo
    const conPrecio = finishedGoods.filter(p => p.precioVenta > 0);
    const margenPromedio = conPrecio.length > 0 
      ? Math.round(conPrecio.reduce((acc, p) => {
          const costo = p.costo || 0;
          const precio = p.precioVenta || 0;
          return acc + (precio > 0 && costo > 0 ? ((precio - costo) / precio) * 100 : 0);
        }, 0) / conPrecio.length) 
      : 35;

    container.innerHTML = `
      <div class="view-header mb-3" style="padding-bottom: 8px;">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1 style="font-size: 20px;">Costos & Precios Comerciales (IA)</h1>
            <span class="badge badge-primary font-bold">ASISTENTE GUIADO</span>
          </div>
          <p class="text-xs text-muted mb-0">Fija y optimiza precios de venta con un asistente pedagógico paso a paso</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-explicar-sencillo">❓ ¿Cómo funciona?</button>
          <button class="btn btn-primary btn-sm font-bold" id="btn-abrir-asistente-nuevo">
            ✨ + Asistente para Fijar Precios
          </button>
        </div>
      </div>

      <!-- 3 KPIs de Estado del Catálogo -->
      <div class="pricing-kpi-grid mb-3">
        <div class="pricing-kpi-card kpi-cost">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label"><span>📦</span> Productos Terminados</span>
            <span class="pricing-kpi-sub">En catálogo actual</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: #0284c7;">${finishedGoods.length}</span>
            <span class="badge badge-info" style="font-size: 9.5px;">Fabricación</span>
          </div>
        </div>

        <div class="pricing-kpi-card kpi-price">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label"><span>🏷️</span> Con Precios Fijados</span>
            <span class="pricing-kpi-sub">Listos para mostrador</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: var(--brand-primary);">${conPrecio.length} / ${finishedGoods.length}</span>
            <span class="badge badge-primary" style="font-size: 9.5px;">${Math.round((conPrecio.length / (finishedGoods.length || 1)) * 100)}% Cobertura</span>
          </div>
        </div>

        <div class="pricing-kpi-card kpi-profit">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label"><span>💰</span> Margen Promedio</span>
            <span class="pricing-kpi-sub">Rentabilidad en caja</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: #047857;">${margenPromedio}%</span>
            <span class="badge badge-success font-bold" style="font-size: 9.5px;">🟢 Saludable</span>
          </div>
        </div>
      </div>

      <!-- Catálogo de Productos con Precios y Costos -->
      <div class="card p-3" style="border-radius: 12px;">
        <div class="d-flex justify-between items-center mb-3">
          <div>
            <h3 style="font-size: 14.5px; font-weight: 800; margin: 0;">Lista de Productos y Precios Comerciales</h3>
            <span class="text-xs text-muted">Selecciona cualquier producto para abrir el asistente y ajustar sus costos y ganancias</span>
          </div>
          <a href="#formulas-vault" class="btn btn-secondary btn-sm" style="font-size: 11.5px;">🧪 Ver Bóveda de Fórmulas</a>
        </div>

        ${finishedGoods.length === 0 ? `
          <div class="text-center p-5 text-muted">
            <div style="font-size: 32px; margin-bottom: 8px;">🏷️</div>
            <strong>Aún no tienes productos terminados registrados.</strong>
            <p class="text-xs mt-1">Crea productos en tu inventario o utiliza el asistente para simular un cálculo nuevo.</p>
            <button class="btn btn-primary btn-sm mt-2" id="btn-asistente-vacio">✨ Abrir Asistente de Simulación</button>
          </div>
        ` : `
          <div class="pricing-horizontal-tiers">
            ${finishedGoods.map(p => {
              const costo = Number(p.costo || 0);
              const precio = Number(p.precioVenta || 0);
              const ganancia = Math.max(0, precio - costo);
              const pct = precio > 0 ? Math.round(((ganancia / precio) * 100) * 10) / 10 : 0;
              const tieneReceta = this.recipes.some(r => r.productoTerminadoId === p.id);

              return `
                <div class="pricing-tier-card" style="border-left: 4px solid ${pct >= 30 ? '#10b981' : (pct >= 15 ? '#f59e0b' : '#ef4444')};">
                  <div class="tier-col-segment">
                    <div class="d-flex items-center gap-2">
                      <span style="font-size: 20px;">🧴</span>
                      <div>
                        <strong style="font-size: 13.5px; color: var(--text-main);">${p.nombre}</strong>
                        <div class="text-xs text-muted">
                          SKU: ${p.sku || '-'} ${tieneReceta ? '• <span class="text-primary font-bold">🧪 Con Receta</span>' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="tier-col-profit">
                    <span class="text-xs text-muted d-block" style="font-size: 10.5px;">Costo Fabricación:</span>
                    <strong style="font-size: 13.5px; color: #0284c7;">${Formatters.currency(costo)}</strong>
                  </div>

                  <div class="tier-col-net">
                    <span class="text-xs text-muted d-block" style="font-size: 10.5px;">Precio Mostrador (sin IVA):</span>
                    <strong style="font-size: 14px; color: var(--text-main);">${Formatters.currency(precio)}</strong>
                  </div>

                  <div class="tier-col-gross">
                    <span class="text-xs text-muted d-block" style="font-size: 10.5px;">Ganancia Limpia:</span>
                    <span class="badge ${pct >= 30 ? 'badge-success' : (pct >= 15 ? 'badge-warning' : 'badge-danger')} font-bold" style="font-size: 11px;">
                      +${Formatters.currency(ganancia)} (${pct}%)
                    </span>
                  </div>

                  <div class="d-flex gap-2" style="flex-shrink: 0;">
                    <button class="btn btn-primary btn-sm btn-abrir-asistente-prod" data-id="${p.id}" style="padding: 4px 10px; font-size: 11.5px; font-weight: 700;">
                      ✨ Asistente
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    // Eventos de la vista principal
    const btnNuevo = container.querySelector('#btn-abrir-asistente-nuevo');
    if (btnNuevo) btnNuevo.addEventListener('click', () => this.openPricingWizard(null, null, () => this.render(container)));

    const btnVacio = container.querySelector('#btn-asistente-vacio');
    if (btnVacio) btnVacio.addEventListener('click', () => this.openPricingWizard(null, null, () => this.render(container)));

    container.querySelectorAll('.btn-abrir-asistente-prod').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const prod = this.products.find(p => p.id === id);
        this.openPricingWizard(prod, null, () => this.render(container));
      });
    });

    const btnExp = container.querySelector('#btn-explicar-sencillo');
    if (btnExp) btnExp.addEventListener('click', () => this.openExplainer());
  },

  /**
   * ASISTENTE MODAL GUIADO PASO A PASO (WIZARD DE PRECIOS)
   */
  openPricingWizard(targetProduct = null, targetFormula = null, onSaved = null) {
    const finishedGoods = this.products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO');
    const rawMaterials = this.products.filter(p => p.tipoItem === 'MATERIA_PRIMA');

    // Estado interno del Wizard
    const wiz = {
      step: 1,
      productId: targetProduct ? targetProduct.id : (targetFormula ? targetFormula.productoTerminadoId : ''),
      productName: targetProduct ? targetProduct.nombre : (targetFormula ? targetFormula.nombreFormula : 'Mi Producto'),
      costoQuimico: 3500,
      costoEnvase: 1200,
      costoTapa: 400,
      costoEtiqueta: 350,
      costoCajaMasterUnit: 250,
      costoManoObraUnit: 500,
      costoServiciosUnit: 300,
      pctMerma: 2.0,
      modoCalculo: 'QUIERO_MARGEN',
      margenDeseadoPct: 35,
      precioVentaManual: 11000,
      aplicaIva: true,
      tasaIva: 19
    };

    // Si viene de una fórmula o producto con datos
    if (targetFormula) {
      let totalReceta = 0;
      (targetFormula.insumos || []).forEach(ins => {
        const mp = rawMaterials.find(m => m.id === ins.productoId) || {};
        const uCost = mp.costo || mp.precioCompra || 0;
        totalReceta += (ins.cantidad * uCost);
      });
      const batch = Number(targetFormula.cantidadProducir) || 1;
      wiz.costoQuimico = batch > 0 ? Math.round(totalReceta / batch) : Math.round(totalReceta);
      wiz.step = 2; // Ir directo al paso de costos
    } else if (targetProduct && targetProduct.costo > 0) {
      wiz.costoQuimico = Math.round(targetProduct.costo * 0.6);
      wiz.costoEnvase = Math.round(targetProduct.costo * 0.25);
      wiz.costoTapa = Math.round(targetProduct.costo * 0.08);
      wiz.costoEtiqueta = Math.round(targetProduct.costo * 0.07);
      if (targetProduct.precioVenta > 0) {
        wiz.precioVentaManual = targetProduct.precioVenta;
      }
    }

    const dialog = Modal.show({
      title: '✨ Asistente Guiado: Fijación Inteligente de Precios',
      size: 'lg',
      content: '<div id="wizard-pricing-container"></div>',
      footerButtons: [] // Manejaremos los botones internamente en el wizard
    });

    const root = dialog.querySelector('#wizard-pricing-container');

    const renderStep = () => {
      // Cálculos reactivos
      const costoEmpaqueTotal = wiz.costoEnvase + wiz.costoTapa + wiz.costoEtiqueta + wiz.costoCajaMasterUnit;
      const costoTrabajoTotal = wiz.costoManoObraUnit + wiz.costoServiciosUnit;
      const subtotalDirecto = wiz.costoQuimico + costoEmpaqueTotal + costoTrabajoTotal;
      const costoDesperdicio = Math.round(subtotalDirecto * (wiz.pctMerma / 100));
      const costoTotalFinal = subtotalDirecto + costoDesperdicio;

      const pctQuimico = costoTotalFinal > 0 ? Math.round((wiz.costoQuimico / costoTotalFinal) * 100) : 0;
      const pctEmpaque = costoTotalFinal > 0 ? Math.round((costoEmpaqueTotal / costoTotalFinal) * 100) : 0;
      const pctTrabajo = costoTotalFinal > 0 ? Math.max(0, 100 - pctQuimico - pctEmpaque) : 0;

      let precioSinIva = 0;
      let gananciaLimpiaDinero = 0;
      let porcentajeGananciaReal = 0;

      if (wiz.modoCalculo === 'QUIERO_MARGEN') {
        const margenFrac = (wiz.margenDeseadoPct || 0) / 100;
        precioSinIva = margenFrac >= 0.95 ? (costoTotalFinal * 2) : Math.round(costoTotalFinal / (1 - margenFrac));
        gananciaLimpiaDinero = precioSinIva - costoTotalFinal;
        porcentajeGananciaReal = wiz.margenDeseadoPct;
        wiz.precioVentaManual = precioSinIva;
      } else {
        precioSinIva = Math.round(wiz.precioVentaManual || 0);
        gananciaLimpiaDinero = precioSinIva - costoTotalFinal;
        porcentajeGananciaReal = precioSinIva > 0 ? Math.round(((gananciaLimpiaDinero / precioSinIva) * 100) * 10) / 10 : 0;
        wiz.margenDeseadoPct = Math.max(0, porcentajeGananciaReal);
      }

      const valorIva = wiz.aplicaIva ? Math.round(precioSinIva * (wiz.tasaIva / 100)) : 0;
      const precioFinalConIva = precioSinIva + valorIva;

      let semaforo = {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.1)',
        border: '#10b981',
        icon: '🟢',
        titulo: '¡Excelente Ganancia!',
        desc: 'Margen saludable y blindado para venta al público y mostrador.'
      };
      if (porcentajeGananciaReal < 15) {
        semaforo = {
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.1)',
          border: '#ef4444',
          icon: '🔴',
          titulo: 'Ganancia Peligrosamente Baja',
          desc: 'A este precio cualquier imprevisto te deja en pérdida.'
        };
      } else if (porcentajeGananciaReal < 30) {
        semaforo = {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.1)',
          border: '#f59e0b',
          icon: '🟡',
          titulo: 'Ganancia Moderada',
          desc: 'Margen ajustado, ideal para clientes mayoristas o por volumen.'
        };
      }

      const calcTier = (m) => {
        const p = Math.round(costoTotalFinal / (1 - (m / 100)));
        const g = p - costoTotalFinal;
        const iva = wiz.aplicaIva ? Math.round(p * 0.19) : 0;
        return { p, g, iva, conIva: p + iva, m };
      };

      const tiers = {
        t1: calcTier(50),
        t2: calcTier(38),
        t3: calcTier(28),
        t4: calcTier(18)
      };

      // HTML del Stepper Superior
      const stepperHtml = `
        <div class="wizard-stepper">
          <div class="wizard-step-item ${wiz.step === 1 ? 'active' : (wiz.step > 1 ? 'completed' : '')}">
            <div class="step-circle">${wiz.step > 1 ? '✓' : '1'}</div>
            <span>1. Producto</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 2 ? 'active' : (wiz.step > 2 ? 'completed' : '')}">
            <div class="step-circle">${wiz.step > 2 ? '✓' : '2'}</div>
            <span>2. Costos Fabricación</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 3 ? 'active' : (wiz.step > 3 ? 'completed' : '')}">
            <div class="step-circle">${wiz.step > 3 ? '✓' : '3'}</div>
            <span>3. Margen & Ganancia</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 4 ? 'active' : ''}">
            <div class="step-circle">4</div>
            <span>4. Precios Comerciales</span>
          </div>
        </div>
      `;

      // HTML según el paso
      let bodyHtml = '';

      // ========================================================================
      // PASO 1: SELECCIONAR O DEFINIR PRODUCTO
      // ========================================================================
      if (wiz.step === 1) {
        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 1 de 4:</strong> Selecciona el producto al que deseas calcularle el costo y fijarle precios, o simula uno nuevo.
          </div>

          <div class="form-group mb-3">
            <label class="font-bold text-xs">Seleccionar Producto del Catálogo:</label>
            <select class="form-select font-bold" id="wiz-sel-prod" style="font-size: 14px;">
              <option value="">-- Simulación Libre (Escribir nombre abajo) --</option>
              ${finishedGoods.map(fg => `
                <option value="${fg.id}" ${wiz.productId === fg.id ? 'selected' : ''}>
                  ${fg.nombre} (${fg.sku || 'Sin SKU'}) - Costo registrado: ${Formatters.currency(fg.costo || 0)}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="form-group mb-3">
            <label class="font-bold text-xs">Nombre del Producto:</label>
            <input type="text" id="wiz-inp-prodname" class="form-control font-bold" value="${wiz.productName}" placeholder="Ej: Desengrasante Multiusos 1 Litro">
          </div>

          <div class="p-3 card mb-0" style="background: var(--bg-surface-solid); border-radius: 8px;">
            <div class="d-flex justify-between items-center">
              <div>
                <strong style="font-size: 12.5px;">🧪 ¿Fabricaste este producto con una fórmula química?</strong>
                <p class="text-xs text-muted mb-0">Podemos traer el costo exacto de los ingredientes guardados en tu Bóveda.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm font-bold" id="wiz-btn-cargar-boveda">
                Importar de Bóveda
              </button>
            </div>
          </div>
        `;
      }

      // ========================================================================
      // PASO 2: COSTOS DIRECTOS DE FABRICACIÓN
      // ========================================================================
      else if (wiz.step === 2) {
        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 2 de 4:</strong> ¿Cuánto cuesta fabricar <strong>1 sola unidad</strong> de "${wiz.productName}"? 
            Ingresa el valor del líquido, los empaques y la mano de obra.
          </div>

          <div class="cost-inputs-grid mb-3">
            <!-- Químico -->
            <div class="input-card-box-compact cost-input-span-2" style="border-left: 3px solid #0284c7;">
              <div class="box-label">
                <span style="color: #0284c7; font-weight: 800;">🧪 Químico / Líquido:</span>
                <span class="badge badge-info" style="font-size: 9.5px;">${pctQuimico}%</span>
              </div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted">$</span>
                <input type="number" step="any" min="0" id="wiz-inp-chem" value="${wiz.costoQuimico}">
              </div>
            </div>

            <!-- Botella -->
            <div class="input-card-box-compact">
              <div class="box-label">🧴 Tarro / Botella:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted">$</span>
                <input type="number" step="any" min="0" id="wiz-inp-bottle" value="${wiz.costoEnvase}">
              </div>
            </div>

            <!-- Tapa -->
            <div class="input-card-box-compact">
              <div class="box-label">🔘 Tapa / Atomizador:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted">$</span>
                <input type="number" step="any" min="0" id="wiz-inp-cap" value="${wiz.costoTapa}">
              </div>
            </div>

            <!-- Etiqueta -->
            <div class="input-card-box-compact">
              <div class="box-label">🏷️ Etiqueta adhesiva:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted">$</span>
                <input type="number" step="any" min="0" id="wiz-inp-label" value="${wiz.costoEtiqueta}">
              </div>
            </div>

            <!-- Caja -->
            <div class="input-card-box-compact">
              <div class="box-label">📦 Caja x unidad:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted">$</span>
                <input type="number" step="any" min="0" id="wiz-inp-box" value="${wiz.costoCajaMasterUnit}">
              </div>
            </div>

            <!-- Labor -->
            <div class="input-card-box-compact">
              <div class="box-label">👷 Labor / Envasado:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted">$</span>
                <input type="number" step="any" min="0" id="wiz-inp-mod" value="${wiz.costoManoObraUnit}">
              </div>
            </div>

            <!-- Luz y Servicios -->
            <div class="input-card-box-compact">
              <div class="box-label">⚡ Luz y Servicios:</div>
              <div class="box-input-wrap">
                <span class="font-bold text-muted">$</span>
                <input type="number" step="any" min="0" id="wiz-inp-serv" value="${wiz.costoServiciosUnit}">
              </div>
            </div>

            <!-- Merma -->
            <div class="input-card-box-compact cost-input-span-4" style="padding: 6px 10px;">
              <div class="box-label">
                <span>💧 Desperdicio inevitable (Merma): <strong class="text-danger">${wiz.pctMerma}%</strong> (+${Formatters.currency(costoDesperdicio)})</span>
                <span class="text-muted text-xs">Pérdidas de líquido en mangueras y filtros</span>
              </div>
              <input type="range" min="0" max="8" step="0.5" id="wiz-range-merma" value="${wiz.pctMerma}" class="form-range w-100" style="height: 18px;">
            </div>
          </div>

          <!-- Totalizador Grande del Costo -->
          <div class="p-3 text-center mb-2" style="background: rgba(2, 132, 199, 0.08); border: 2px dashed #0284c7; border-radius: 10px;">
            <div class="text-xs text-muted font-bold">COSTO TOTAL PARA TENER 1 UNIDAD LISTA:</div>
            <div style="font-size: 26px; font-weight: 900; color: #0284c7; margin: 2px 0;">
              ${Formatters.currency(costoTotalFinal)} COP
            </div>
            <div class="text-xs text-muted">
              Químico: ${Formatters.currency(wiz.costoQuimico)} (${pctQuimico}%) | Empaque: ${Formatters.currency(costoEmpaqueTotal)} (${pctEmpaque}%) | Labor/Merma: ${Formatters.currency(costoTrabajoTotal + costoDesperdicio)} (${pctTrabajo}%)
            </div>
          </div>
        `;
      }

      // ========================================================================
      // PASO 3: ESTRATEGIA Y MARGEN DE GANANCIA
      // ========================================================================
      else if (wiz.step === 3) {
        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 3 de 4:</strong> ¿Cómo quieres definir el precio de venta al público? 
            Puedes fijar qué porcentaje de margen quieres ganar, o escribir el precio al que compite en el mercado.
          </div>

          <!-- 2 Opciones Claras -->
          <div class="nexa-grid-2 mb-3">
            <div class="wizard-option-card ${wiz.modoCalculo === 'QUIERO_MARGEN' ? 'selected' : ''}" id="card-mode-margen">
              <div class="font-bold" style="font-size: 13px; color: var(--text-main);">🟢 Opción A: Quiero ganar un %</div>
              <div class="text-xs text-muted mt-1">El sistema calcula el precio para que te quede ese % neto en el bolsillo.</div>
            </div>

            <div class="wizard-option-card ${wiz.modoCalculo === 'TENGO_PRECIO' ? 'selected' : ''}" id="card-mode-precio">
              <div class="font-bold" style="font-size: 13px; color: var(--text-main);">🔵 Opción B: Ya tengo un precio fijo</div>
              <div class="text-xs text-muted mt-1">Escribes el precio de la calle y calculamos tu utilidad real.</div>
            </div>
          </div>

          <!-- Input según modo -->
          ${wiz.modoCalculo === 'QUIERO_MARGEN' ? `
            <div class="input-card-box-compact mb-3" style="background: rgba(0, 113, 227, 0.04); border-color: rgba(0, 113, 227, 0.25); padding: 12px 14px;">
              <div class="box-label">
                <span class="text-primary font-bold" style="font-size: 12.5px;">Margen de Ganancia sobre el Precio de Venta:</span>
                <span class="badge badge-primary font-bold" style="font-size: 14px;">${wiz.margenDeseadoPct}%</span>
              </div>
              <input type="range" min="10" max="70" step="1" id="wiz-range-margen" value="${wiz.margenDeseadoPct}" class="form-range w-100 my-2">
              <div class="d-flex justify-between text-xs text-muted">
                <span>15% Distribuidor</span>
                <span>35% Estándar Negocio</span>
                <span>50% Mostrador / Detal</span>
              </div>
            </div>
          ` : `
            <div class="input-card-box-compact mb-3" style="background: rgba(0, 113, 227, 0.04); border-color: rgba(0, 113, 227, 0.25); padding: 12px 14px;">
              <div class="box-label text-primary font-bold" style="font-size: 12.5px;">Precio de Venta Mostrador ($ COP sin IVA):</div>
              <div class="box-input-wrap">
                <span style="font-size: 22px; font-weight: 800; color: var(--brand-primary);">$</span>
                <input type="number" step="100" min="${costoTotalFinal + 100}" id="wiz-inp-precio-calle" value="${precioSinIva}" style="font-size: 18px; color: var(--brand-primary); height: 38px;">
              </div>
            </div>
          `}

          <!-- Resultado y Semáforo -->
          <div class="nexa-grid-2 mb-3">
            <div class="p-3 text-center" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 10px;">
              <div class="text-xs text-muted font-bold">PRECIO MOSTRADOR:</div>
              <div style="font-size: 22px; font-weight: 900; color: var(--brand-primary); margin: 2px 0;">
                ${Formatters.currency(precioSinIva)} COP
              </div>
              <span class="text-xs text-muted">${wiz.aplicaIva ? `Con IVA: ${Formatters.currency(precioFinalConIva)}` : 'Sin IVA'}</span>
            </div>

            <div class="p-3 text-center" style="background: rgba(16, 185, 129, 0.08); border: 1px solid #10b981; border-radius: 10px;">
              <div class="text-xs text-muted font-bold">TU GANANCIA LIMPIA:</div>
              <div style="font-size: 22px; font-weight: 900; color: #047857; margin: 2px 0;">
                +${Formatters.currency(gananciaLimpiaDinero)} COP
              </div>
              <span class="badge badge-success font-bold" style="font-size: 11px;">
                ${semaforo.icon} ${porcentajeGananciaReal}% Margen Neto
              </span>
            </div>
          </div>

          <!-- Semáforo explicativo -->
          <div class="p-2 mb-3" style="background: ${semaforo.bg}; border: 1px solid ${semaforo.border}; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">${semaforo.icon}</span>
            <div>
              <strong style="color: ${semaforo.color}; font-size: 12px;">${semaforo.titulo}:</strong>
              <span style="font-size: 11.5px; color: var(--text-main);"> ${semaforo.desc}</span>
            </div>
          </div>

          <!-- Checkbox IVA -->
          <div class="d-flex justify-between items-center p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px; font-size: 12px;">
            <div class="d-flex items-center gap-2">
              <input type="checkbox" id="wiz-chk-iva" ${wiz.aplicaIva ? 'checked' : ''} style="cursor: pointer;">
              <label for="wiz-chk-iva" class="font-bold" style="cursor: pointer; margin: 0;">¿Cobras IVA a tus clientes? (19%)</label>
            </div>
            <span>${wiz.aplicaIva ? `Precio final c/IVA: <strong style="color: var(--brand-primary);">${Formatters.currency(precioFinalConIva)}</strong>` : 'Precio exento de IVA'}</span>
          </div>
        `;
      }

      // ========================================================================
      // PASO 4: CASCADA DE PRECIOS SUGERIDOS Y CONFIRMACIÓN
      // ========================================================================
      else if (wiz.step === 4) {
        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 4 de 4:</strong> ¡Cálculo completado con éxito! Aquí tienes la cascada de precios recomendada para vender 
            sin pérdidas en cada canal de tu negocio.
          </div>

          <!-- 4 Tarjetas de Precios Estratégicos -->
          <div class="pricing-horizontal-tiers mb-3">
            
            <!-- Mostrador -->
            <div class="pricing-tier-card tier-p1">
              <div class="tier-col-segment">
                <div class="d-flex items-center gap-2">
                  <span>🛒</span>
                  <div>
                    <strong style="font-size: 13px; color: var(--text-main);">1. Cliente Mostrador (Detal)</strong>
                    <div class="text-xs text-muted">Venta a personas que van al local</div>
                  </div>
                </div>
              </div>
              <div class="tier-col-profit">
                <span class="badge badge-success font-bold">+${Formatters.currency(tiers.t1.g)} (50%)</span>
              </div>
              <div class="tier-col-net">
                <span class="text-xs text-muted">Base:</span>
                <strong style="font-size: 14px;">${Formatters.currency(tiers.t1.p)}</strong>
              </div>
              <div class="tier-col-gross">
                <span class="text-xs text-muted">Con IVA:</span>
                <strong style="font-size: 14.5px; color: #10b981;">${Formatters.currency(tiers.t1.conIva)}</strong>
              </div>
            </div>

            <!-- Talleres -->
            <div class="pricing-tier-card tier-p2">
              <div class="tier-col-segment">
                <div class="d-flex items-center gap-2">
                  <span>🚗</span>
                  <div>
                    <strong style="font-size: 13px; color: var(--text-main);">2. Talleres & Lavaderos</strong>
                    <div class="text-xs text-muted">Clientes comerciales frecuentes</div>
                  </div>
                </div>
              </div>
              <div class="tier-col-profit">
                <span class="badge badge-info font-bold">+${Formatters.currency(tiers.t2.g)} (38%)</span>
              </div>
              <div class="tier-col-net">
                <span class="text-xs text-muted">Base:</span>
                <strong style="font-size: 14px;">${Formatters.currency(tiers.t2.p)}</strong>
              </div>
              <div class="tier-col-gross">
                <span class="text-xs text-muted">Con IVA:</span>
                <strong style="font-size: 14.5px; color: #0284c7;">${Formatters.currency(tiers.t2.conIva)}</strong>
              </div>
            </div>

            <!-- Mayorista -->
            <div class="pricing-tier-card tier-p3">
              <div class="tier-col-segment">
                <div class="d-flex items-center gap-2">
                  <span>📦</span>
                  <div>
                    <strong style="font-size: 13px; color: var(--text-main);">3. Mayorista (Cajas x 12)</strong>
                    <div class="text-xs text-muted">Compras por volumen en empaque cerrado</div>
                  </div>
                </div>
              </div>
              <div class="tier-col-profit">
                <span class="badge badge-warning font-bold">+${Formatters.currency(tiers.t3.g)} (28%)</span>
              </div>
              <div class="tier-col-net">
                <span class="text-xs text-muted">Base:</span>
                <strong style="font-size: 14px;">${Formatters.currency(tiers.t3.p)}</strong>
              </div>
              <div class="tier-col-gross">
                <span class="text-xs text-muted">Con IVA:</span>
                <strong style="font-size: 14.5px; color: #d97706;">${Formatters.currency(tiers.t3.conIva)}</strong>
              </div>
            </div>

            <!-- Distribuidor -->
            <div class="pricing-tier-card tier-p4">
              <div class="tier-col-segment">
                <div class="d-flex items-center gap-2">
                  <span>🚛</span>
                  <div>
                    <strong style="font-size: 13px; color: var(--text-main);">4. Distribuidor</strong>
                    <div class="text-xs text-muted">Grandes pedidos por pallets / revendedores</div>
                  </div>
                </div>
              </div>
              <div class="tier-col-profit">
                <span class="badge badge-secondary font-bold">+${Formatters.currency(tiers.t4.g)} (18%)</span>
              </div>
              <div class="tier-col-net">
                <span class="text-xs text-muted">Base:</span>
                <strong style="font-size: 14px;">${Formatters.currency(tiers.t4.p)}</strong>
              </div>
              <div class="tier-col-gross">
                <span class="text-xs text-muted">Con IVA:</span>
                <strong style="font-size: 14.5px; color: #7c3aed;">${Formatters.currency(tiers.t4.conIva)}</strong>
              </div>
            </div>

          </div>

          <div class="p-3 card mb-0" style="background: rgba(16, 185, 129, 0.05); border: 1px solid #10b981; border-radius: 8px;">
            <div class="d-flex justify-between items-center">
              <div>
                <strong style="color: #047857; font-size: 13px;">¿Deseas aplicar estos precios al catálogo?</strong>
                <div class="text-xs text-muted">Se actualizará el costo unitario en <strong>${Formatters.currency(costoTotalFinal)}</strong> y el precio de venta en <strong>${Formatters.currency(precioSinIva)}</strong>.</div>
              </div>
              <span class="badge badge-success font-bold">Listo para Guardar</span>
            </div>
          </div>
        `;
      }

      // Footer de Navegación del Wizard
      const footerHtml = `
        <div class="wizard-footer">
          <div>
            ${wiz.step > 1 ? `
              <button type="button" class="btn btn-secondary btn-sm font-bold" id="wiz-btn-prev">
                ⬅️ Atrás
              </button>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" id="wiz-btn-cancel">
                Cancelar
              </button>
            `}
          </div>

          <div>
            ${wiz.step < 4 ? `
              <button type="button" class="btn btn-primary btn-sm font-bold" id="wiz-btn-next">
                Siguiente ➔
              </button>
            ` : `
              <button type="button" class="btn btn-success btn-sm font-bold" id="wiz-btn-save" style="padding: 6px 18px; font-size: 13px;">
                💾 Guardar Precios en el Producto
              </button>
            `}
          </div>
        </div>
      `;

      root.innerHTML = `
        <div class="wizard-body">
          <div class="wizard-step-content">
            ${stepperHtml}
            ${bodyHtml}
          </div>
          ${footerHtml}
        </div>
      `;

      // Eventos del Wizard
      const btnCancel = root.querySelector('#wiz-btn-cancel');
      if (btnCancel) btnCancel.addEventListener('click', () => Modal.close());

      const btnPrev = root.querySelector('#wiz-btn-prev');
      if (btnPrev) btnPrev.addEventListener('click', () => {
        wiz.step = Math.max(1, wiz.step - 1);
        renderStep();
      });

      const btnNext = root.querySelector('#wiz-btn-next');
      if (btnNext) btnNext.addEventListener('click', () => {
        wiz.step = Math.min(4, wiz.step + 1);
        renderStep();
      });

      // Eventos específicos del Paso 1
      if (wiz.step === 1) {
        const selP = root.querySelector('#wiz-sel-prod');
        const inpN = root.querySelector('#wiz-inp-prodname');
        
        selP.addEventListener('change', () => {
          wiz.productId = selP.value;
          const found = finishedGoods.find(p => p.id === selP.value);
          if (found) {
            wiz.productName = found.nombre;
            inpN.value = found.nombre;
            if (found.costo > 0) {
              wiz.costoQuimico = Math.round(found.costo * 0.6);
              wiz.costoEnvase = Math.round(found.costo * 0.25);
              wiz.costoTapa = Math.round(found.costo * 0.08);
              wiz.costoEtiqueta = Math.round(found.costo * 0.07);
            }
            if (found.precioVenta > 0) wiz.precioVentaManual = found.precioVenta;
          }
        });

        inpN.addEventListener('input', () => {
          wiz.productName = inpN.value;
        });

        const btnCargarBov = root.querySelector('#wiz-btn-cargar-boveda');
        btnCargarBov.addEventListener('click', () => {
          this.pickRecipeFromVaultModal((rec) => {
            let total = 0;
            (rec.insumos || []).forEach(ins => {
              const mp = rawMaterials.find(m => m.id === ins.productoId) || {};
              const uCost = mp.costo || mp.precioCompra || 0;
              total += (ins.cantidad * uCost);
            });
            const b = Number(rec.cantidadProducir) || 1;
            wiz.costoQuimico = b > 0 ? Math.round(total / b) : Math.round(total);
            wiz.productName = rec.nombreFormula || wiz.productName;
            inpN.value = wiz.productName;
            Toast.success(`¡Costo químico importado de "${rec.nombreFormula}"! ($${Formatters.currency(wiz.costoQuimico)})`);
          });
        });
      }

      // Eventos específicos del Paso 2
      if (wiz.step === 2) {
        const bindWizInp = (id, key) => {
          const el = root.querySelector(id);
          if (el) el.addEventListener('input', () => {
            wiz[key] = Number(el.value) || 0;
            renderStep();
          });
        };
        bindWizInp('#wiz-inp-chem', 'costoQuimico');
        bindWizInp('#wiz-inp-bottle', 'costoEnvase');
        bindWizInp('#wiz-inp-cap', 'costoTapa');
        bindWizInp('#wiz-inp-label', 'costoEtiqueta');
        bindWizInp('#wiz-inp-box', 'costoCajaMasterUnit');
        bindWizInp('#wiz-inp-mod', 'costoManoObraUnit');
        bindWizInp('#wiz-inp-serv', 'costoServiciosUnit');
        bindWizInp('#wiz-range-merma', 'pctMerma');
      }

      // Eventos específicos del Paso 3
      if (wiz.step === 3) {
        const cardM = root.querySelector('#card-mode-margen');
        const cardP = root.querySelector('#card-mode-precio');
        if (cardM) cardM.addEventListener('click', () => { wiz.modoCalculo = 'QUIERO_MARGEN'; renderStep(); });
        if (cardP) cardP.addEventListener('click', () => { wiz.modoCalculo = 'TENGO_PRECIO'; renderStep(); });

        const rngM = root.querySelector('#wiz-range-margen');
        if (rngM) rngM.addEventListener('input', () => { wiz.margenDeseadoPct = Number(rngM.value) || 0; renderStep(); });

        const inpC = root.querySelector('#wiz-inp-precio-calle');
        if (inpC) inpC.addEventListener('input', () => { wiz.precioVentaManual = Number(inpC.value) || 0; renderStep(); });

        const chkI = root.querySelector('#wiz-chk-iva');
        if (chkI) chkI.addEventListener('change', () => { wiz.aplicaIva = chkI.checked; renderStep(); });
      }

      // Evento Guardar en Paso 4
      if (wiz.step === 4) {
        const btnSave = root.querySelector('#wiz-btn-save');
        if (btnSave) btnSave.addEventListener('click', async () => {
          let target = this.products.find(p => p.id === wiz.productId);
          
          if (!target) {
            // Si es un producto nuevo simulado, crearlo en el catálogo
            target = {
              id: 'prod_' + Date.now(),
              tenantId: this.tenantId,
              nombre: wiz.productName || 'Producto Nuevo',
              sku: 'PT-' + Math.floor(1000 + Math.random() * 9000),
              tipoItem: 'PRODUCTO_TERMINADO',
              unidadMedida: 'UNIDAD',
              costo: costoTotalFinal,
              precioVenta: precioSinIva,
              stock: 0,
              preciosEspeciales: {
                plist_1: tiers.t1.p,
                plist_2: tiers.t2.p,
                plist_3: tiers.t3.p,
                plist_4: tiers.t4.p
              },
              fechaCreacion: new Date().toISOString()
            };
            await DB.update(STORES.PRODUCTS, target);
            Toast.success(`¡Producto "${target.nombre}" creado y precios guardados!`);
          } else {
            // Actualizar producto existente
            target.costo = costoTotalFinal;
            target.precioVenta = precioSinIva;
            target.preciosEspeciales = {
              ...(target.preciosEspeciales || {}),
              plist_1: tiers.t1.p,
              plist_2: tiers.t2.p,
              plist_3: tiers.t3.p,
              plist_4: tiers.t4.p
            };
            target.fechaModificacion = new Date().toISOString();
            await DB.update(STORES.PRODUCTS, target);
            Toast.success(`¡Precios actualizados para "${target.nombre}"!`);
          }

          Modal.close();
          if (onSaved) onSaved();
        });
      }
    };

    renderStep();
  },

  /**
   * Modal auxiliar para elegir una fórmula de la Bóveda
   */
  pickRecipeFromVaultModal(onPicked) {
    if (this.recipes.length === 0) {
      Toast.warning('No hay recetas guardadas en la Bóveda aún.');
      return;
    }

    Modal.show({
      title: '🧪 Importar Costo desde Bóveda de Fórmulas',
      size: 'md',
      content: `
        <p class="text-xs text-muted mb-3">Elige la fórmula química cuya tanda deseas usar para calcular el costo por unidad:</p>
        <div class="list-group">
          ${this.recipes.map(r => `
            <button type="button" class="list-group-item list-group-item-action d-flex justify-between items-center p-3 btn-pick-rec" data-id="${r.id}" style="text-align: left;">
              <div>
                <strong style="font-size: 13px;">${r.nombreFormula}</strong>
                <div class="text-xs text-muted">Tanda de ${r.cantidadProducir || 200} ${r.unidadMedida || 'Litros'}</div>
              </div>
              <span class="badge badge-primary font-bold">Seleccionar</span>
            </button>
          `).join('')}
        </div>
      `,
      footerButtons: [{ label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }]
    });

    setTimeout(() => {
      document.querySelectorAll('.btn-pick-rec').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const r = this.recipes.find(rec => rec.id === id);
          if (r) {
            Modal.close();
            onPicked(r);
          }
        });
      });
    }, 50);
  },

  /**
   * Modal Explicativo Sencillo
   */
  openExplainer() {
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
              El Asistente de Nexa calcula el precio real para que te quede exactamente el 30% neto de cada venta en la caja.
            </p>
          </div>

          <div class="card p-3 mb-0" style="background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981;">
            <h4 style="font-size: 14px; font-weight: 800; color: #047857; margin-bottom: 4px;">
              2. Los 4 Precios Sugeridos
            </h4>
            <p style="margin-bottom: 0;">
              No puedes venderle al mismo precio a quien te compra 1 botella en mostrador que a quien te compra 20 cajas. El asistente te calcula 4 escalones para que ganes siempre sin importar el volumen.
            </p>
          </div>
        </div>
      `,
      footerButtons: [{ label: '¡Entendido!', class: 'btn-primary', onClick: () => Modal.close() }]
    });
  }
};
