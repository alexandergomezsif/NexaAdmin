/**
 * Nexa ERP - Calculadora Fácil de Costos y Ganancias
 * Diseñada para ser 100% intuitiva, visual y comprensible sin conocimientos contables.
 * Utiliza gráficos visuales SVG, termómetro de rentabilidad y lenguaje del día a día.
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
    
    // 1. Lo que va por dentro (Líquido/Químicos)
    costoQuimico: 3500,
    
    // 2. El Empaque
    costoEnvase: 1200,      // Tarro / Botella
    costoTapa: 400,         // Tapa o atomizador
    costoEtiqueta: 350,     // Etiqueta
    costoCajaMasterUnit: 250,// Caja de cartón (parte que le toca a esta botella)
    
    // 3. Trabajo y Servicios
    costoManoObraUnit: 500, // Lo que pagas por envasar cada botella
    costoServiciosUnit: 300,// Luz, agua, desgaste de máquinas
    pctMerma: 2.0,          // Lo que se riega o evapora (2%)

    // Modo de Simulación
    modoCalculo: 'QUIERO_MARGEN', // 'QUIERO_MARGEN' o 'TENGO_PRECIO'
    margenDeseadoPct: 35,         // Quiero ganarme el 35%
    precioVentaManual: 11000,     // O quiero venderlo a $11.000
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

    // Si viene transferido desde la Bóveda de Recetas
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
    Toast.success(`¡Costo de ingredientes cargado desde la receta! ($${Formatters.currency(unitChemCost)})`);
  },

  renderView(container, tenantId, products, recipes) {
    const finishedGoods = products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO');

    // === 1. MATEMÁTICA Y COSTOS CLAROS ===
    const costoEmpaqueTotal = this.state.costoEnvase + this.state.costoTapa + this.state.costoEtiqueta + this.state.costoCajaMasterUnit;
    const costoTrabajoTotal = this.state.costoManoObraUnit + this.state.costoServiciosUnit;
    const subtotalDirecto = this.state.costoQuimico + costoEmpaqueTotal + costoTrabajoTotal;
    const costoDesperdicio = Math.round(subtotalDirecto * (this.state.pctMerma / 100));
    const costoTotalFinal = subtotalDirecto + costoDesperdicio; // Lo que cuesta fabricar 1 unidad

    // Porcentajes de en qué se gasta el dinero
    const pctQuimico = costoTotalFinal > 0 ? Math.round((this.state.costoQuimico / costoTotalFinal) * 100) : 0;
    const pctEmpaque = costoTotalFinal > 0 ? Math.round((costoEmpaqueTotal / costoTotalFinal) * 100) : 0;
    const pctTrabajo = costoTotalFinal > 0 ? Math.max(0, 100 - pctQuimico - pctEmpaque) : 0;

    // === 2. CÁLCULO DE GANANCIAS Y PRECIOS ===
    let precioSinIva = 0;
    let gananciaLimpiaDinero = 0;
    let porcentajeGananciaReal = 0;

    if (this.state.modoCalculo === 'QUIERO_MARGEN') {
      // Fórmula correcta de margen: Precio = Costo / (1 - Margen)
      const margenFrac = (this.state.margenDeseadoPct || 0) / 100;
      if (margenFrac >= 0.95) {
        precioSinIva = costoTotalFinal * 2;
      } else {
        precioSinIva = Math.round(costoTotalFinal / (1 - margenFrac));
      }
      gananciaLimpiaDinero = precioSinIva - costoTotalFinal;
      porcentajeGananciaReal = this.state.margenDeseadoPct;
      this.state.precioVentaManual = precioSinIva;
    } else {
      // Cálculo inverso a partir del precio que el usuario escribe
      precioSinIva = Math.round(this.state.precioVentaManual || 0);
      gananciaLimpiaDinero = precioSinIva - costoTotalFinal;
      porcentajeGananciaReal = precioSinIva > 0 ? Math.round(((gananciaLimpiaDinero / precioSinIva) * 100) * 10) / 10 : 0;
      this.state.margenDeseadoPct = Math.max(0, porcentajeGananciaReal);
    }

    // Impuesto IVA
    const valorIva = this.state.aplicaIva ? Math.round(precioSinIva * (this.state.tasaIva / 100)) : 0;
    const precioFinalConIva = precioSinIva + valorIva;

    // Semáforo de ganancia visual
    let saludGanancia = {
      color: '#10b981',
      fondo: 'rgba(16, 185, 129, 0.1)',
      borde: '#10b981',
      icono: '🟢',
      titulo: '¡Excelente Ganancia!',
      mensaje: 'Estás ganando un muy buen porcentaje por cada unidad que vendes.'
    };
    if (porcentajeGananciaReal < 15) {
      saludGanancia = {
        color: '#ef4444',
        fondo: 'rgba(239, 68, 68, 0.1)',
        borde: '#ef4444',
        icono: '🔴',
        titulo: 'Cuidado: Ganancia muy baja',
        mensaje: 'A este precio te queda muy poco dinero. Cualquier imprevisto te dejará en pérdidas.'
      };
    } else if (porcentajeGananciaReal < 30) {
      saludGanancia = {
        color: '#f59e0b',
        fondo: 'rgba(245, 158, 11, 0.1)',
        borde: '#f59e0b',
        icono: '🟡',
        titulo: 'Ganancia Moderada (Ideal para Mayoristas)',
        mensaje: 'Buen precio para vender por cajas completas o distribuidores que compran en volumen.'
      };
    }

    // Cálculo de los 4 Precios Típicos de un Negocio (Mostrador, Taller, Mayorista, Distribuidor)
    const calcularPrecioCanal = (margenCanal) => {
      const p = Math.round(costoTotalFinal / (1 - (margenCanal / 100)));
      const gan = p - costoTotalFinal;
      const iva = this.state.aplicaIva ? Math.round(p * 0.19) : 0;
      return { precioSinIva: p, ganancia: gan, conIva: p + iva, margen: margenCanal };
    };

    const preciosCanales = {
      p1: calcularPrecioCanal(50), // 50% Mostrador
      p2: calcularPrecioCanal(38), // 38% Talleres / Lavaderos
      p3: calcularPrecioCanal(28), // 28% Mayorista
      p4: calcularPrecioCanal(18)  // 18% Distribuidor
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Calculadora Fácil de Costos y Ganancias</h1>
            <span class="badge badge-success">INTUITIVO & VISUAL</span>
          </div>
          <p>Conoce exactamente cuánto te cuesta fabricar cada producto y cuánto dinero limpio te queda en el bolsillo</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-explicar-sencillo">❓ ¿Cómo funciona esta matemática?</button>
          <button class="btn btn-primary btn-sm" id="btn-guardar-catalogo">💾 Guardar Precios en el Catálogo</button>
        </div>
      </div>

      <!-- Selector Fácil de Producto -->
      <div class="card p-3 mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 12px;">
        <div class="d-flex justify-between items-center gap-3">
          <div class="d-flex items-center gap-2" style="flex: 1;">
            <span style="font-size: 24px;">🏷️</span>
            <div style="flex: 1;">
              <label class="text-xs font-bold text-muted">¿ESTÁS CALCULANDO UN PRODUCTO YA REGISTRADO?</label>
              <select class="form-select form-select-sm font-bold" id="sel-calc-product">
                <option value="">-- No, estoy calculando una idea libre desde cero --</option>
                ${finishedGoods.map(fg => `
                  <option value="${fg.id}" ${this.state.selectedProductId === fg.id ? 'selected' : ''}>
                    ${fg.nombre} (${fg.sku}) - Costo registrado: ${Formatters.currency(fg.costo || 0)}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div>
            <a href="#formulas-vault" class="btn btn-secondary btn-sm">🧪 Traer de mi Bóveda de Recetas</a>
          </div>
        </div>
      </div>

      <!-- CONTENEDOR PRINCIPAL: PASO A PASO -->
      <div class="grid grid-cols-12 gap-3">
        
        <!-- PASO 1: CUÁNTO CUESTA FABRICARLO (5 columnas) -->
        <div class="col-span-5 d-flex flex-col gap-3">
          
          <div class="card p-3" style="margin-bottom: 0; border-radius: 12px;">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>1️⃣</span> ¿Cuánto cuesta fabricar 1 unidad?
            </h3>

            <!-- Químicos -->
            <div class="mb-3 p-2" style="background: rgba(2, 132, 199, 0.05); border-radius: 8px; border: 1px solid rgba(2, 132, 199, 0.2);">
              <div class="d-flex justify-between items-center mb-1">
                <span class="font-bold text-xs" style="color: #0284c7;">🧪 Lo que va por dentro (Líquido / Químico):</span>
                <strong style="color: #0284c7; font-size: 14px;">$ <input type="number" step="any" min="0" id="inp-cost-chem" value="${this.state.costoQuimico}" style="width: 85px; font-weight: 800; text-align: right; border: 1px solid #93c5fd; border-radius: 4px; padding: 2px 4px;"></strong>
              </div>
              <span class="text-xs text-muted">El valor del líquido que cabe exactamente en 1 botella.</span>
            </div>

            <!-- Empaque -->
            <div class="mb-3 p-2" style="background: rgba(245, 158, 11, 0.05); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.2);">
              <div class="d-flex justify-between items-center mb-2">
                <span class="font-bold text-xs" style="color: #d97706;">🧴 El Empaque (Tarro, Tapa y Etiquetas):</span>
                <strong style="color: #d97706;">${Formatters.currency(costoEmpaqueTotal)}</strong>
              </div>
              
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span class="text-muted">Tarro / Botella:</span>
                  <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-bottle" value="${this.state.costoEnvase}">
                </div>
                <div>
                  <span class="text-muted">Tapa o Atomizador:</span>
                  <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-cap" value="${this.state.costoTapa}">
                </div>
                <div>
                  <span class="text-muted">Etiqueta:</span>
                  <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-label" value="${this.state.costoEtiqueta}">
                </div>
                <div>
                  <span class="text-muted">Caja de cartón (x unid):</span>
                  <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-box" value="${this.state.costoCajaMasterUnit}">
                </div>
              </div>
            </div>

            <!-- Trabajo y Desperdicio -->
            <div class="mb-3 p-2" style="background: rgba(139, 92, 246, 0.05); border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.2);">
              <div class="d-flex justify-between items-center mb-2">
                <span class="font-bold text-xs" style="color: #7c3aed;">⚡ Trabajo, Servicios y Desperdicio:</span>
                <strong style="color: #7c3aed;">${Formatters.currency(costoTrabajoTotal + costoDesperdicio)}</strong>
              </div>
              
              <div class="grid grid-cols-2 gap-2 text-xs mb-2">
                <div>
                  <span class="text-muted">Pago por envasar (Mano de obra):</span>
                  <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-mod" value="${this.state.costoManoObraUnit}">
                </div>
                <div>
                  <span class="text-muted">Luz, agua y máquinas:</span>
                  <input type="number" step="any" min="0" class="form-control form-control-sm" id="inp-cost-serv" value="${this.state.costoServiciosUnit}">
                </div>
              </div>
              <div class="text-xs">
                <div class="d-flex justify-between items-center">
                  <span class="text-muted">Lo que se riega o evapora (Merma):</span>
                  <strong class="text-danger">${this.state.pctMerma}% (+${Formatters.currency(costoDesperdicio)})</strong>
                </div>
                <input type="range" min="0" max="8" step="0.5" class="form-range w-100" id="range-cost-merma" value="${this.state.pctMerma}">
              </div>
            </div>

            <!-- GRÁFICO VISUAL: EN QUÉ SE VA TU DINERO (Barra Multicolor) -->
            <div class="mb-3">
              <div class="d-flex justify-between items-center text-xs font-bold mb-1">
                <span>¿En qué se va tu dinero por botella?</span>
                <span>Total: ${Formatters.currency(costoTotalFinal)}</span>
              </div>
              <div style="height: 18px; width: 100%; display: flex; border-radius: 9px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);">
                <div style="width: ${pctQuimico}%; background: #0284c7;" title="Químicos: ${pctQuimico}%"></div>
                <div style="width: ${pctEmpaque}%; background: #f59e0b;" title="Empaque: ${pctEmpaque}%"></div>
                <div style="width: ${pctTrabajo}%; background: #8b5cf6;" title="Trabajo y Luz: ${pctTrabajo}%"></div>
              </div>
              <div class="d-flex justify-between text-xs mt-1 text-muted" style="font-size: 11px;">
                <span style="color: #0284c7;">● Químicos: <strong>${pctQuimico}%</strong> (${Formatters.currency(this.state.costoQuimico)})</span>
                <span style="color: #d97706;">● Empaque: <strong>${pctEmpaque}%</strong> (${Formatters.currency(costoEmpaqueTotal)})</span>
                <span style="color: #7c3aed;">● Trabajo: <strong>${pctTrabajo}%</strong> (${Formatters.currency(costoTrabajoTotal + costoDesperdicio)})</span>
              </div>
            </div>

            <!-- Tarjeta Total Destacada -->
            <div class="p-3 text-center" style="background: rgba(16, 185, 129, 0.1); border: 2px dashed #10b981; border-radius: 10px;">
              <span class="text-xs text-muted font-bold">COSTO TOTAL DE CADA UNIDAD TERMINADA:</span>
              <div style="font-size: 28px; font-weight: 900; color: #047857; line-height: 1.2; margin-top: 2px;">
                ${Formatters.currency(costoTotalFinal)} COP
              </div>
              <span class="text-xs text-muted">Esto es lo mínimo que te cuesta tener la botella lista para vender.</span>
            </div>

          </div>

        </div>

        <!-- PASO 2: SIMULADOR DE GANANCIA Y PRECIO (7 columnas) -->
        <div class="col-span-7 d-flex flex-col gap-3">
          
          <div class="card p-4" style="margin-bottom: 0; border-radius: 12px;">
            <h3 style="font-size: 15px; font-weight: 800; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>2️⃣</span> ¿Cuánto quieres ganar o a cuánto quieres vender?
            </h3>

            <!-- Selector de Modo Gigante y Amigable -->
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button class="btn ${this.state.modoCalculo === 'QUIERO_MARGEN' ? 'btn-primary' : 'btn-secondary'} p-3 text-left mode-btn" data-mode="QUIERO_MARGEN" style="border-radius: 10px;">
                <div class="font-bold" style="font-size: 13px;">🟢 OPCIÓN A: Quiero ganar un %</div>
                <div class="text-xs opacity-80" style="margin-top: 2px;">"Quiero asegurarme de ganarle el 35% a cada venta"</div>
              </button>

              <button class="btn ${this.state.modoCalculo === 'TENGO_PRECIO' ? 'btn-primary' : 'btn-secondary'} p-3 text-left mode-btn" data-mode="TENGO_PRECIO" style="border-radius: 10px;">
                <div class="font-bold" style="font-size: 13px;">🔵 OPCIÓN B: Ya tengo un precio fijo</div>
                <div class="text-xs opacity-80" style="margin-top: 2px;">"Quiero venderla a $12.000, ¿cuánto me queda limpio?"</div>
              </button>
            </div>

            <!-- Entrada de Datos según la Opción Elegida -->
            ${this.state.modoCalculo === 'QUIERO_MARGEN' ? `
              <div class="p-3 mb-3" style="background: rgba(0, 113, 227, 0.05); border-radius: 10px; border: 1px solid rgba(0, 113, 227, 0.2);">
                <div class="d-flex justify-between items-center mb-2">
                  <label class="font-bold text-xs text-primary" style="margin: 0;">Mueve la barra para elegir qué porcentaje quieres ganar:</label>
                  <div class="d-flex items-center gap-1">
                    <input type="number" min="5" max="85" step="1" id="inp-num-margen" value="${this.state.margenDeseadoPct}" class="form-control form-control-sm text-center font-bold" style="width: 70px; font-size: 15px;">
                    <span class="font-bold text-primary">%</span>
                  </div>
                </div>
                <input type="range" min="10" max="70" step="1" id="range-num-margen" value="${this.state.margenDeseadoPct}" class="form-range w-100">
                <div class="d-flex justify-between text-xs text-muted mt-1" style="font-size: 11px;">
                  <span>15% (Para Distribuidores)</span>
                  <span>35% (Normal Empresas)</span>
                  <span>50% (Venta al Público)</span>
                </div>
              </div>
            ` : `
              <div class="p-3 mb-3" style="background: rgba(0, 113, 227, 0.05); border-radius: 10px; border: 1px solid rgba(0, 113, 227, 0.2);">
                <label class="font-bold text-xs text-primary mb-1">Escribe el precio al que quieres vender en la calle ($ COP sin IVA):</label>
                <div class="d-flex items-center gap-2">
                  <span style="font-size: 22px; font-weight: 800; color: var(--brand-primary);">$</span>
                  <input type="number" step="100" min="${costoTotalFinal + 100}" id="inp-precio-calle" value="${precioSinIva}" class="form-control font-bold" style="font-size: 20px; color: var(--brand-primary); height: 44px;">
                </div>
                <span class="text-xs text-muted mt-1 d-block">El sistema te dirá al instante si estás ganando o perdiendo plata.</span>
              </div>
            `}

            <!-- TARJETÓN DE RESULTADO CLARO (Lo que entra vs lo que queda) -->
            <div class="grid grid-cols-2 gap-3 p-3 mb-3" style="background: var(--bg-surface); border: 2px solid var(--border-color); border-radius: 12px;">
              <div class="p-2">
                <span class="text-xs text-muted font-bold">PRECIO DE VENTA SUGERIDO:</span>
                <div style="font-size: 24px; font-weight: 900; color: var(--brand-primary);">${Formatters.currency(precioSinIva)} COP</div>
                <span class="text-xs text-muted">Antes de cobrar el IVA</span>
              </div>
              <div class="p-2" style="border-left: 2px dashed var(--border-color);">
                <span class="text-xs text-muted font-bold">TU GANANCIA LIMPIA POR BOTELLA:</span>
                <div style="font-size: 24px; font-weight: 900; color: #10b981;">+${Formatters.currency(gananciaLimpiaDinero)} COP</div>
                <span class="badge badge-success font-bold" style="font-size: 12px;">
                  Margen: ${porcentajeGananciaReal}% en tu bolsillo
                </span>
              </div>
            </div>

            <!-- SEMÁFORO DE SALUD DE GANANCIA -->
            <div class="p-3 mb-3" style="background: ${saludGanancia.fondo}; border: 1px solid ${saludGanancia.borde}; border-radius: 10px; display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 28px;">${saludGanancia.icono}</div>
              <div>
                <strong style="color: ${saludGanancia.color}; font-size: 13.5px;">${saludGanancia.titulo}</strong>
                <div style="font-size: 12px; color: var(--text-main); margin-top: 1px;">${saludGanancia.mensaje}</div>
              </div>
            </div>

            <!-- Checkbox de IVA sencillo -->
            <div class="d-flex justify-between items-center p-2" style="background: rgba(0,0,0,0.02); border-radius: 8px; font-size: 12px;">
              <div class="d-flex items-center gap-2">
                <input type="checkbox" id="chk-iva-simple" ${this.state.aplicaIva ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer;">
                <label for="chk-iva-simple" class="font-bold" style="cursor: pointer; margin: 0;">¿Cobras IVA a tus clientes? (19%)</label>
              </div>
              <div>
                ${this.state.aplicaIva ? `
                  <span>Precio final al cliente con IVA: <strong style="font-size: 14px; color: var(--brand-primary);">${Formatters.currency(precioFinalConIva)}</strong></span>
                ` : `
                  <span class="badge badge-secondary">Exento de IVA</span>
                `}
              </div>
            </div>

          </div>

          <!-- TABLA DE PRECIOS SUGERIDOS PARA TU NEGOCIO -->
          <div class="card p-3" style="margin-bottom: 0; border-radius: 12px;">
            <div class="d-flex justify-between items-center mb-2">
              <h4 style="font-size: 14px; font-weight: 800; margin: 0;">📋 Los 4 Precios Sugeridos para tu Negocio</h4>
              <span class="text-xs text-muted">Calculados automáticamente</span>
            </div>

            <div class="table-responsive">
              <table class="table table-sm text-xs" style="margin-bottom: 0;">
                <thead>
                  <tr>
                    <th>¿A quién le vendes?</th>
                    <th class="text-center">Tu Ganancia Limpia ($ y %)</th>
                    <th class="text-right">Precio Sin IVA</th>
                    <th class="text-right">Precio Final con IVA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>1. Cliente Mostrador / Calle</strong> <span class="text-muted">(Detal)</span></td>
                    <td class="text-center"><span class="badge badge-success font-bold">+${Formatters.currency(preciosCanales.p1.ganancia)} (50%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(preciosCanales.p1.precioSinIva)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(preciosCanales.p1.conIva)}</td>
                  </tr>
                  <tr>
                    <td><strong>2. Talleres & Lavaderos</strong> <span class="text-muted">(Profesional)</span></td>
                    <td class="text-center"><span class="badge badge-info font-bold">+${Formatters.currency(preciosCanales.p2.ganancia)} (38%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(preciosCanales.p2.precioSinIva)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(preciosCanales.p2.conIva)}</td>
                  </tr>
                  <tr>
                    <td><strong>3. Mayorista</strong> <span class="text-muted">(Cajas x 12 completas)</span></td>
                    <td class="text-center"><span class="badge badge-warning font-bold">+${Formatters.currency(preciosCanales.p3.ganancia)} (28%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(preciosCanales.p3.precioSinIva)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(preciosCanales.p3.conIva)}</td>
                  </tr>
                  <tr>
                    <td><strong>4. Distribuidor</strong> <span class="text-muted">(Reventa por volumen)</span></td>
                    <td class="text-center"><span class="badge badge-secondary font-bold">+${Formatters.currency(preciosCanales.p4.ganancia)} (18%)</span></td>
                    <td class="text-right font-bold">${Formatters.currency(preciosCanales.p4.precioSinIva)}</td>
                    <td class="text-right text-primary font-bold">${Formatters.currency(preciosCanales.p4.conIva)}</td>
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
      preciosCanales
    });
  },

  bindEvents(container, tenantId, products, recipes, calculated) {
    const refresh = () => this.renderView(container, tenantId, products, recipes);

    // Selector de producto existente
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

    // Inputs de costos
    const wireInput = (selector, key) => {
      const el = container.querySelector(selector);
      if (el) el.addEventListener('input', () => {
        this.state[key] = Number(el.value) || 0;
        refresh();
      });
    };

    wireInput('#inp-cost-chem', 'costoQuimico');
    wireInput('#inp-cost-bottle', 'costoEnvase');
    wireInput('#inp-cost-cap', 'costoTapa');
    wireInput('#inp-cost-label', 'costoEtiqueta');
    wireInput('#inp-cost-box', 'costoCajaMasterUnit');
    wireInput('#inp-cost-mod', 'costoManoObraUnit');
    wireInput('#inp-cost-serv', 'costoServiciosUnit');
    wireInput('#range-cost-merma', 'pctMerma');

    // Botones de Modo
    container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.state.modoCalculo = btn.getAttribute('data-mode');
        refresh();
      });
    });

    // Inputs de modo A (Margen)
    const inpM = container.querySelector('#inp-num-margen');
    const rngM = container.querySelector('#range-num-margen');
    if (inpM) inpM.addEventListener('input', () => { this.state.margenDeseadoPct = Number(inpM.value) || 0; refresh(); });
    if (rngM) rngM.addEventListener('input', () => { this.state.margenDeseadoPct = Number(rngM.value) || 0; refresh(); });

    // Input de modo B (Precio en calle)
    const inpP = container.querySelector('#inp-precio-calle');
    if (inpP) inpP.addEventListener('input', () => { this.state.precioVentaManual = Number(inpP.value) || 0; refresh(); });

    // Checkbox IVA
    const chkIva = container.querySelector('#chk-iva-simple');
    if (chkIva) chkIva.addEventListener('change', () => { this.state.aplicaIva = chkIva.checked; refresh(); });

    // Modal Explicativo Sencillo
    container.querySelector('#btn-explicar-sencillo').addEventListener('click', () => {
      this.openSimpleExplainer(calculated);
    });

    // Guardar en Catálogo
    container.querySelector('#btn-guardar-catalogo').addEventListener('click', () => {
      this.saveToCatalog(tenantId, products, calculated);
    });
  },

  openSimpleExplainer(calc) {
    Modal.show({
      title: '💡 Explicación Sencilla de tus Ganancias',
      content: `
        <div style="font-size: 13.5px; line-height: 1.5; color: var(--text-main);">
          
          <div class="card p-3 mb-3" style="background: rgba(0, 113, 227, 0.05); border-left: 4px solid var(--brand-primary);">
            <h4 style="font-size: 14px; font-weight: 800; color: var(--brand-primary); margin-bottom: 6px;">
              1. La Trampa del Porcentaje (Por qué muchos dueños pierden dinero)
            </h4>
            <p>
              Mucha gente dice: <em>"Fabricar la botella me costó $10.000, le voy a ganar el 30%, entonces la vendo en $13.000"</em>.
            </p>
            <p>
              <strong>¡Ese cálculo está mal!</strong> Porque si vendes en $13.000 y te ganas $3.000, $3.000 dividido en $13.000 es apenas el <strong>23% de ganancia real</strong>, perdiste casi 7 puntos de plata.
            </p>
            <p style="margin-bottom: 0;">
              El sistema de Nexa calcula con la fórmula de las grandes empresas: para ganarte el 30% real de lo que te entra a la caja, debes venderla a <strong>$14.285</strong>.
            </p>
          </div>

          <div class="card p-3 mb-3" style="background: rgba(16, 185, 129, 0.05); border-left: 4px solid #10b981;">
            <h4 style="font-size: 14px; font-weight: 800; color: #047857; margin-bottom: 6px;">
              2. Tu Ganancia Limpia en este Producto
            </h4>
            <p style="margin-bottom: 0;">
              Por cada botella que vendas a <strong>${Formatters.currency(calc.precioSinIva)}</strong>:<br>
              - Se te van <strong>${Formatters.currency(calc.costoTotalFinal)}</strong> en reponer líquido, tarro, tapa y pagar al personal.<br>
              - Te quedan limpios en tu bolsillo <strong>+${Formatters.currency(calc.precioSinIva - calc.costoTotalFinal)} COP</strong> libres.
            </p>
          </div>

          <div class="card p-3 mb-0" style="background: rgba(245, 158, 11, 0.05); border-left: 4px solid #f59e0b;">
            <h4 style="font-size: 14px; font-weight: 800; color: #b45309; margin-bottom: 6px;">
              3. ¿Por qué el IVA no se cuenta como ganancia?
            </h4>
            <p style="margin-bottom: 0;">
              El IVA del 19% no es plata tuya; tú solo se la guardas unos días al cliente para entregársela al gobierno (la DIAN). Por eso, tus ganancias siempre las calculamos sobre el precio <strong>sin IVA</strong>.
            </p>
          </div>

        </div>
      `,
      footerButtons: [{ label: '¡Ahora sí entendí perfecto!', class: 'btn-primary', onClick: () => Modal.close() }]
    });
  },

  saveToCatalog(tenantId, products, calc) {
    const finished = products.filter(p => p.tipoItem === 'PRODUCTO_TERMINADO');
    
    Modal.show({
      title: 'Guardar estos precios en tu Catálogo',
      content: `
        <p class="text-xs text-muted mb-3">Elige a qué producto de tu inventario deseas aplicarle este nuevo costo y su lista de precios:</p>
        <div class="form-group mb-3">
          <select class="form-select font-bold" id="modal-sel-final-prod">
            ${finished.map(p => `
              <option value="${p.id}" ${this.state.selectedProductId === p.id ? 'selected' : ''}>
                ${p.nombre} (${p.sku})
              </option>
            `).join('')}
          </select>
        </div>
        <div class="p-2 text-xs" style="background: rgba(0,0,0,0.03); border-radius: 6px;">
          Se guardará el Costo en <strong>${Formatters.currency(calc.costoTotalFinal)}</strong> y el precio de venta en <strong>${Formatters.currency(calc.precioSinIva)}</strong>.
        </div>
      `,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Precios',
          class: 'btn-primary',
          onClick: async () => {
            const pid = document.getElementById('modal-sel-final-prod').value;
            const target = products.find(p => p.id === pid);
            if (target) {
              target.costo = calc.costoTotalFinal;
              target.precioVenta = calc.precioSinIva;
              target.preciosEspeciales = {
                ...(target.preciosEspeciales || {}),
                plist_1: calc.preciosCanales.p1.precioSinIva,
                plist_2: calc.preciosCanales.p2.precioSinIva,
                plist_3: calc.preciosCanales.p3.precioSinIva,
                plist_4: calc.preciosCanales.p4.precioSinIva
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
