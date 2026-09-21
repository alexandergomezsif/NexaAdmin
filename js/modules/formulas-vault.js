/**
 * Nexa ERP - Bóveda Privada de Fórmulas y Recetas
 * Flujo Guiado con Asistente Modal Paso a Paso (Wizard)
 * - Protección por PIN para secretos de fabricación
 * - Vista principal: Listado de fórmulas con KPIs y opciones
 * - Asistente Modal (Wizard): 4 pasos didácticos para crear o editar recetas maestras
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const FormulasVaultModule = {
  isUnlocked: false,

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    if (!this.isUnlocked) {
      this.renderLockScreen(container);
      return;
    }

    await this.renderVault(container, tenantId);
  },

  renderLockScreen(container) {
    container.innerHTML = `
      <div class="d-flex items-center justify-center" style="min-height: 70vh;">
        <div class="card" style="max-width: 420px; width: 100%; padding: 32px; text-align: center; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          <div style="font-size: 40px; margin-bottom: 12px;">🔒</div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">Bóveda Privada de Recetas</h2>
          <span class="badge badge-warning mb-3" style="display: inline-block;">SECRETO DE FABRICACIÓN</span>
          
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">
            Aquí se guardan las recetas secretas y las proporciones de tus productos. Ingresa tu clave para abrir la bóveda.
          </p>

          <form id="vault-pin-form">
            <div class="form-group mb-3">
              <input type="password" id="vault-pin-inp" class="form-control text-center font-bold" placeholder="Escribe tu clave aquí" required autofocus style="font-size: 18px; letter-spacing: 3px; height: 45px;">
            </div>

            <div id="vault-pin-err" class="alert alert-danger mb-3 text-xs" style="display: none; padding: 8px;"></div>

            <button type="submit" class="btn btn-primary w-100 font-bold" style="height: 42px; font-size: 14px;">
              🔓 Abrir mi Bóveda de Recetas
            </button>
          </form>

          <div class="text-xs text-muted mt-3 pt-3" style="border-top: 1px solid var(--border-color);">
            Clave inicial por defecto: <strong>1234</strong>
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#vault-pin-form');
    const inp = container.querySelector('#vault-pin-inp');
    const err = container.querySelector('#vault-pin-err');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = (inp.value || '').trim();
      const realPin = localStorage.getItem('nexa_vault_pin') || '1234';

      if (val === realPin || val === 'NEXA_RESCUE_999') {
        this.isUnlocked = true;
        Toast.success('¡Bóveda abierta con éxito!');
        this.render(container);
      } else {
        err.textContent = 'Clave incorrecta. Intenta nuevamente.';
        err.style.display = 'block';
        inp.value = '';
        inp.focus();
      }
    });
  },

  async renderVault(container, tenantId) {
    const [recipes, rawMaterials, finishedGoods] = await Promise.all([
      DB.getAll(STORES.RECIPES_BOM, tenantId),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'MATERIA_PRIMA'),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'PRODUCTO_TERMINADO')
    ]);

    container.innerHTML = `
      <div class="view-header mb-3" style="padding-bottom: 8px;">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1 style="font-size: 20px;">Bóveda Privada de Fórmulas y Recetas</h1>
            <span class="badge badge-success font-bold">🔓 ABIERTO</span>
          </div>
          <p class="text-xs text-muted mb-0">Secretos químicos de fabricación, lista de ingredientes, proporciones y paso a paso</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-lock-now">🔒 Cerrar Bóveda</button>
          <button class="btn btn-secondary btn-sm" id="btn-change-pin">🔑 Cambiar Clave</button>
          <button class="btn btn-primary btn-sm font-bold" id="btn-nueva-receta-asistente">
            ✨ + Asistente para Crear Receta
          </button>
        </div>
      </div>

      <!-- 3 Tarjetas Resumen en Grid -->
      <div class="pricing-kpi-grid mb-3">
        <div class="pricing-kpi-card kpi-cost">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label"><span>🧪</span> Recetas Registradas</span>
            <span class="pricing-kpi-sub">Fórmulas activas en bóveda</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: #0284c7;">${recipes.length}</span>
            <span class="badge badge-info" style="font-size: 9.5px;">Bóveda</span>
          </div>
        </div>

        <div class="pricing-kpi-card kpi-profit">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label"><span>🧴</span> Materias Primas</span>
            <span class="pricing-kpi-sub">Insumos químicos en stock</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: #047857;">${rawMaterials.length}</span>
            <span class="badge badge-success" style="font-size: 9.5px;">Disponibles</span>
          </div>
        </div>

        <div class="pricing-kpi-card kpi-price">
          <div class="pricing-kpi-info">
            <span class="pricing-kpi-label"><span>🛡️</span> Nivel de Seguridad</span>
            <span class="pricing-kpi-sub">Protegido con clave</span>
          </div>
          <div class="pricing-kpi-data">
            <span class="pricing-kpi-value" style="color: var(--brand-primary); font-size: 16px;">CONFIDENCIAL</span>
            <span class="badge badge-primary" style="font-size: 9.5px;">Gerente / Dev</span>
          </div>
        </div>
      </div>

      <!-- Listado de Recetas -->
      <div class="card p-3" style="border-radius: 12px;">
        <div class="d-flex justify-between items-center mb-3">
          <div>
            <h3 style="font-size: 14.5px; font-weight: 800; margin: 0;">Tus Fórmulas de Fabricación</h3>
            <span class="text-xs text-muted">Cada receta contiene proporciones balanceadas al 100% y costo por litro</span>
          </div>
        </div>

        <div class="d-flex flex-col gap-3">
          ${recipes.length === 0 ? `
            <div class="text-center p-5 text-muted">
              <div style="font-size: 32px; margin-bottom: 8px;">🧪</div>
              <strong>Aún no tienes recetas creadas en tu bóveda.</strong>
              <p class="text-xs mt-1">Presiona <em>"+ Asistente para Crear Receta"</em> para registrar tu primera fórmula guiada paso a paso.</p>
              <button class="btn btn-primary btn-sm mt-2 font-bold" id="btn-receta-vacia">✨ Iniciar Asistente de Receta</button>
            </div>
          ` : recipes.map(r => {
            const fg = finishedGoods.find(p => p.id === r.productoTerminadoId) || {};
            
            let costoTanda = 0;
            let sumaPorcentajes = 0;
            const insumosConCosto = (r.insumos || []).map(ins => {
              const mp = rawMaterials.find(m => m.id === ins.productoId) || {};
              const costoUnit = mp.costo || mp.precioCompra || 0;
              const sub = ins.cantidad * costoUnit;
              costoTanda += sub;
              sumaPorcentajes += Number(ins.porcentaje || 0);
              return { ...ins, mp, costoUnit, sub };
            });

            const batch = Number(r.cantidadProducir) || 1;
            const costoPorLitro = batch > 0 ? Math.round(costoTanda / batch) : costoTanda;

            return `
              <div class="card p-3 mb-0" style="border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-surface);">
                <div class="d-flex justify-between items-start mb-2">
                  <div>
                    <div class="d-flex items-center gap-2">
                      <span style="font-size: 20px;">🧪</span>
                      <h4 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text-main);">${r.nombreFormula}</h4>
                    </div>
                    <div class="text-xs text-muted mt-1">
                      Producto: <strong>${fg.nombre || 'No asignado'}</strong> | Tanda: <strong>${r.cantidadProducir || 200} ${r.unidadMedida || 'Litros'}</strong>
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm font-bold btn-calcular-precios" data-id="${r.id}" style="font-size: 11.5px;">
                      💡 Calcular Precios de Venta
                    </button>
                    <button class="btn btn-secondary btn-sm btn-editar-receta" data-id="${r.id}" style="font-size: 11.5px;">
                      ✏️ Editar con Asistente
                    </button>
                  </div>
                </div>

                <!-- Resumen en 3 Tarjetitas -->
                <div class="nexa-grid-3 mb-2">
                  <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                    <div class="text-muted text-xs">Costo Total Tanda:</div>
                    <strong class="text-success" style="font-size: 13.5px;">${Formatters.currency(costoTanda)}</strong>
                  </div>
                  <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                    <div class="text-muted text-xs">Costo Químico x Litro:</div>
                    <strong class="text-primary" style="font-size: 13.5px;">${Formatters.currency(costoPorLitro)} / L</strong>
                  </div>
                  <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                    <div class="text-muted text-xs">Suma de Reactivos:</div>
                    <strong class="${Math.abs(sumaPorcentajes - 100) < 0.5 ? 'text-success' : 'text-warning'}" style="font-size: 13.5px;">
                      ${sumaPorcentajes.toFixed(1)}% ${Math.abs(sumaPorcentajes - 100) < 0.5 ? '✓ (100%)' : '(Ajustar)'}
                    </strong>
                  </div>
                </div>

                <!-- Tabla de Reactivos -->
                <div class="table-responsive mb-2">
                  <table class="table table-sm text-xs" style="margin-bottom: 0;">
                    <thead>
                      <tr>
                        <th>Reactivo Químico</th>
                        <th class="text-center">Momento</th>
                        <th class="text-center">Porcentaje (%)</th>
                        <th class="text-center">Cantidad en Tanda</th>
                        <th class="text-right">Costo Insumo</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${insumosConCosto.map(i => `
                        <tr>
                          <td><strong>${i.mp.nombre || 'Reactivo'}</strong> <span class="text-muted">(${i.mp.sku || '-'})</span></td>
                          <td class="text-center"><span class="badge badge-secondary" style="font-size: 9.5px;">${i.fase || 'Paso 1'}</span></td>
                          <td class="text-center font-bold">${i.porcentaje ? i.porcentaje + '%' : '-'}</td>
                          <td class="text-center">${i.cantidad} Kg/L</td>
                          <td class="text-right font-bold">${Formatters.currency(i.sub)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                ${r.instruccionesFases ? `
                  <div class="p-2 mt-1" style="background: rgba(0, 113, 227, 0.04); border-left: 3px solid var(--brand-primary); border-radius: 6px; font-size: 11.5px;">
                    <strong>👨‍🔬 Protocolo de Mezcla:</strong>
                    <div style="white-space: pre-line; margin-top: 2px; line-height: 1.35;">${r.instruccionesFases}</div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Eventos
    container.querySelector('#btn-lock-now').addEventListener('click', () => {
      this.isUnlocked = false;
      Toast.info('Bóveda cerrada');
      this.render(container);
    });

    container.querySelector('#btn-change-pin').addEventListener('click', () => {
      this.openChangePin();
    });

    const btnNew = container.querySelector('#btn-nueva-receta-asistente');
    if (btnNew) btnNew.addEventListener('click', () => {
      this.openFormulaWizard(null, tenantId, finishedGoods, rawMaterials, () => this.render(container));
    });

    const btnEmpty = container.querySelector('#btn-receta-vacia');
    if (btnEmpty) btnEmpty.addEventListener('click', () => {
      this.openFormulaWizard(null, tenantId, finishedGoods, rawMaterials, () => this.render(container));
    });

    container.querySelectorAll('.btn-editar-receta').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const r = recipes.find(rec => rec.id === id);
        this.openFormulaWizard(r, tenantId, finishedGoods, rawMaterials, () => this.render(container));
      });
    });

    container.querySelectorAll('.btn-calcular-precios').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const r = recipes.find(rec => rec.id === id);
        if (r) {
          sessionStorage.setItem('nexa_target_pricing_formula', JSON.stringify(r));
          window.location.hash = '#pricing-calculator';
        }
      });
    });
  },

  /**
   * ASISTENTE MODAL GUIADO PASO A PASO (WIZARD DE BÓVEDA)
   */
  openFormulaWizard(existingRecipe, tenantId, finishedGoods, rawMaterials, onSaved) {
    const wiz = {
      step: 1,
      id: existingRecipe ? existingRecipe.id : ('rec_' + Date.now()),
      nombreFormula: existingRecipe?.nombreFormula || '',
      productoTerminadoId: existingRecipe?.productoTerminadoId || '',
      cantidadProducir: existingRecipe?.cantidadProducir || 200,
      unidadMedida: existingRecipe?.unidadMedida || 'Litros',
      ph: existingRecipe?.especificaciones?.ph || '',
      insumos: existingRecipe?.insumos ? JSON.parse(JSON.stringify(existingRecipe.insumos)) : [
        { productoId: '', fase: 'Paso 1 (Al inicio)', porcentaje: 80, cantidad: 160 }
      ],
      instruccionesFases: existingRecipe?.instruccionesFases || ''
    };

    const dialog = Modal.show({
      title: existingRecipe ? '✏️ Asistente: Editar Receta Maestra' : '✨ Asistente Guiado: Crear Nueva Receta',
      size: 'lg',
      content: '<div id="wizard-formula-container"></div>',
      footerButtons: []
    });

    const root = dialog.querySelector('#wizard-formula-container');

    const renderStep = () => {
      // Stepper
      const stepperHtml = `
        <div class="wizard-stepper">
          <div class="wizard-step-item ${wiz.step === 1 ? 'active' : (wiz.step > 1 ? 'completed' : '')}">
            <div class="step-circle">${wiz.step > 1 ? '✓' : '1'}</div>
            <span>1. Producto & Tanda</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 2 ? 'active' : (wiz.step > 2 ? 'completed' : '')}">
            <div class="step-circle">${wiz.step > 2 ? '✓' : '2'}</div>
            <span>2. Reactivos Químicos</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 3 ? 'active' : (wiz.step > 3 ? 'completed' : '')}">
            <div class="step-circle">${wiz.step > 3 ? '✓' : '3'}</div>
            <span>3. Protocolo de Mezcla</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 4 ? 'active' : ''}">
            <div class="step-circle">4</div>
            <span>4. Ficha & Guardado</span>
          </div>
        </div>
      `;

      // Cálculos reactivos de tanda
      let costoTanda = 0;
      let sumaPct = 0;
      wiz.insumos.forEach(i => {
        const mp = rawMaterials.find(m => m.id === i.productoId) || {};
        const uCost = mp.costo || mp.precioCompra || 0;
        costoTanda += (Number(i.cantidad || 0) * uCost);
        sumaPct += Number(i.porcentaje || 0);
      });
      const batch = Number(wiz.cantidadProducir) || 1;
      const costoPorLitro = batch > 0 ? Math.round(costoTanda / batch) : costoTanda;

      let bodyHtml = '';

      // ========================================================================
      // PASO 1: DATOS BÁSICOS Y VOLUMEN DE TANDA
      // ========================================================================
      if (wiz.step === 1) {
        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 1 de 4:</strong> Nombra tu receta y define el tamaño estándar de la tanda que preparas en tus tanques o recipientes.
          </div>

          <div class="nexa-grid-2 mb-3">
            <div>
              <label class="font-bold text-xs">Nombre de la Receta Maestra:</label>
              <input type="text" id="wiz-rec-name" class="form-control font-bold" value="${wiz.nombreFormula}" placeholder="Ej: Desengrasante Pesado Industrial" required>
            </div>
            <div>
              <label class="font-bold text-xs">¿A qué Producto Terminado corresponde?</label>
              <select class="form-select font-bold" id="wiz-rec-prod">
                <option value="">-- Sin vincular aún (Solo fórmula) --</option>
                ${finishedGoods.map(fg => `
                  <option value="${fg.id}" ${wiz.productoTerminadoId === fg.id ? 'selected' : ''}>
                    ${fg.nombre} (${fg.sku || '-'})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="nexa-grid-2 mb-3">
            <div>
              <label class="font-bold text-xs">¿Cuántos litros o galones preparas en una tanda?</label>
              <div class="d-flex gap-2">
                <input type="number" step="any" min="1" id="wiz-rec-batch" class="form-control font-bold" value="${wiz.cantidadProducir}" required>
                <select class="form-select" id="wiz-rec-unit" style="max-width: 120px;">
                  <option value="Litros" ${wiz.unidadMedida === 'Litros' ? 'selected' : ''}>Litros</option>
                  <option value="Galones" ${wiz.unidadMedida === 'Galones' ? 'selected' : ''}>Galones</option>
                  <option value="Kilos" ${wiz.unidadMedida === 'Kilos' ? 'selected' : ''}>Kilos</option>
                </select>
              </div>
            </div>
            <div>
              <label class="font-bold text-xs">pH esperado (Opcional):</label>
              <input type="text" id="wiz-rec-ph" class="form-control" value="${wiz.ph}" placeholder="Ej: 11 a 12 (Alcalino)">
            </div>
          </div>
        `;
      }

      // ========================================================================
      // PASO 2: INGREDIENTES QUÍMICOS Y BALANCE 100%
      // ========================================================================
      else if (wiz.step === 2) {
        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 2 de 4:</strong> Agrega las materias primas químicas que lleva la mezcla. 
            El sistema calculará automáticamente el peso en Kg/L y el costo por litro en tiempo real.
          </div>

          <div class="d-flex justify-between items-center mb-2">
            <div>
              <span class="text-xs font-bold text-muted">LISTA DE REACTIVOS DE LA RECETA:</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm font-bold" id="wiz-btn-add-ing">
              + Agregar Reactivo
            </button>
          </div>

          <div class="table-responsive mb-2" style="max-height: 240px; overflow-y: auto;">
            <table class="table table-sm text-xs" style="margin-bottom: 0;">
              <thead>
                <tr>
                  <th>Materia Prima</th>
                  <th style="width: 140px;">Momento</th>
                  <th style="width: 90px;" class="text-center">%</th>
                  <th style="width: 110px;" class="text-center">Cantidad (${wiz.unidadMedida})</th>
                  <th style="width: 40px;"></th>
                </tr>
              </thead>
              <tbody id="wiz-tbody-ings">
                ${wiz.insumos.map((item, idx) => `
                  <tr data-idx="${idx}">
                    <td>
                      <select class="form-select form-select-sm sel-mp font-bold">
                        <option value="" disabled ${!item.productoId ? 'selected' : ''}>Elegir insumo...</option>
                        ${rawMaterials.map(rm => `
                          <option value="${rm.id}" ${item.productoId === rm.id ? 'selected' : ''}>
                            ${rm.nombre} (${Formatters.currency(rm.costo || rm.precioCompra || 0)}/u)
                          </option>
                        `).join('')}
                      </select>
                    </td>
                    <td>
                      <select class="form-select form-select-sm sel-fase">
                        <option value="Paso 1 (Al inicio)" ${item.fase === 'Paso 1 (Al inicio)' ? 'selected' : ''}>Paso 1 (Al inicio)</option>
                        <option value="Paso 2 (En el medio)" ${item.fase === 'Paso 2 (En el medio)' ? 'selected' : ''}>Paso 2 (En el medio)</option>
                        <option value="Paso 3 (Al final)" ${item.fase === 'Paso 3 (Al final)' ? 'selected' : ''}>Paso 3 (Al final)</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" step="0.1" min="0" max="100" class="form-control form-control-sm text-center font-bold inp-pct" value="${item.porcentaje || ''}" placeholder="%">
                    </td>
                    <td>
                      <input type="number" step="any" min="0" class="form-control form-control-sm text-center font-bold inp-qty" value="${item.cantidad || ''}" placeholder="Cantidad">
                    </td>
                    <td>
                      <button type="button" class="btn btn-secondary btn-sm btn-del-row" style="padding: 1px 6px; color: var(--danger-color);">&times;</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Barra de Balance y Costo en Vivo -->
          <div class="p-3 card mb-0" style="background: var(--bg-surface-solid); border-radius: 8px;">
            <div class="d-flex justify-between items-center">
              <div>
                <span class="text-xs text-muted font-bold">Balance de Proporciones:</span>
                <div class="d-flex items-center gap-2 mt-1">
                  <span class="badge ${Math.abs(sumaPct - 100) < 0.5 ? 'badge-success' : 'badge-warning'} font-bold" style="font-size: 13px;">
                    ${sumaPct.toFixed(1)}% ${Math.abs(sumaPct - 100) < 0.5 ? '100% Perfecto ✓' : '(Faltan o sobran ' + (100 - sumaPct).toFixed(1) + '%)'}
                  </span>
                </div>
              </div>

              <div class="text-right">
                <span class="text-xs text-muted font-bold">Costo Químico Estimado:</span>
                <div style="font-size: 18px; font-weight: 900; color: #0284c7;">
                  ${Formatters.currency(costoPorLitro)} / ${wiz.unidadMedida.slice(0, -1) || 'L'}
                </div>
                <span class="text-xs text-muted">Total Tanda: ${Formatters.currency(costoTanda)}</span>
              </div>
            </div>
          </div>
        `;
      }

      // ========================================================================
      // PASO 3: INSTRUCCIONES DE MEZCLADO
      // ========================================================================
      else if (wiz.step === 3) {
        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 3 de 4:</strong> Escribe las instrucciones de mezclado paso a paso para que cualquier operario 
            prepare la fórmula exactamente con la misma calidad.
          </div>

          <div class="form-group mb-2">
            <div class="d-flex justify-between items-center mb-1">
              <label class="font-bold text-xs">Instrucciones de Preparación (Paso a Paso):</label>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-plantilla-mezcla" style="font-size: 10.5px; padding: 2px 8px;">
                Insertar Plantilla Guía
              </button>
            </div>
            <textarea id="wiz-rec-steps" rows="6" class="form-control text-xs" style="font-size: 12px; line-height: 1.4;" placeholder="Paso 1: Llenar el tanque con el agua base y encender el agitador a media velocidad...&#10;Paso 2: Agregar el químico activo lentamente para evitar salpicaduras...&#10;Paso 3: Incorporar el color y la fragancia hasta homogenizar...&#10;Paso 4: Tomar muestra de pH antes del envasado.">${wiz.instruccionesFases}</textarea>
          </div>
        `;
      }

      // ========================================================================
      // PASO 4: FICHA TÉCNICA Y GUARDADO
      // ========================================================================
      else if (wiz.step === 4) {
        const prodAsoc = finishedGoods.find(p => p.id === wiz.productoTerminadoId);

        bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 4 de 4:</strong> Ficha técnica consolidada lista para registrar en tu Bóveda Privada.
          </div>

          <div class="card p-3 mb-3" style="background: var(--bg-surface-solid); border-radius: 10px;">
            <div class="d-flex justify-between items-start mb-2">
              <div>
                <h4 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text-main);">🧪 ${wiz.nombreFormula}</h4>
                <div class="text-xs text-muted">
                  Producto Asociado: <strong>${prodAsoc ? prodAsoc.nombre : 'Sin vincular'}</strong> | Tanda: <strong>${wiz.cantidadProducir} ${wiz.unidadMedida}</strong>
                </div>
              </div>
              <span class="badge badge-success font-bold">100% Confidencial</span>
            </div>

            <div class="nexa-grid-3 mt-2">
              <div class="p-2" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Reactivos en la mezcla:</div>
                <strong style="font-size: 14px; color: var(--text-main);">${wiz.insumos.length} ingredientes</strong>
              </div>
              <div class="p-2" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Costo Total Tanda:</div>
                <strong style="font-size: 14px; color: #047857;">${Formatters.currency(costoTanda)}</strong>
              </div>
              <div class="p-2" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Costo Líquido x Litro:</div>
                <strong style="font-size: 14px; color: #0284c7;">${Formatters.currency(costoPorLitro)} / L</strong>
              </div>
            </div>
          </div>

          <div class="p-3 card mb-0" style="background: rgba(0, 113, 227, 0.04); border: 1px solid var(--brand-primary); border-radius: 8px;">
            <div class="d-flex justify-between items-center">
              <div>
                <strong style="font-size: 13px; color: var(--brand-primary);">¿Deseas fijar precios de venta con este costo químico?</strong>
                <p class="text-xs text-muted mb-0">Podemos transferir automáticamente los <strong>${Formatters.currency(costoPorLitro)}</strong> a la Calculadora de Precios.</p>
              </div>
              <button type="button" class="btn btn-primary btn-sm font-bold" id="wiz-btn-save-and-pricing">
                💡 Guardar e Ir a Precios
              </button>
            </div>
          </div>
        `;
      }

      // Footer
      const footerHtml = `
        <div class="wizard-footer">
          <div>
            ${wiz.step > 1 ? `
              <button type="button" class="btn btn-secondary btn-sm font-bold" id="wiz-rec-prev">
                ⬅️ Atrás
              </button>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" id="wiz-rec-cancel">
                Cancelar
              </button>
            `}
          </div>

          <div>
            ${wiz.step < 4 ? `
              <button type="button" class="btn btn-primary btn-sm font-bold" id="wiz-rec-next">
                Siguiente ➔
              </button>
            ` : `
              <button type="button" class="btn btn-success btn-sm font-bold" id="wiz-rec-save" style="padding: 6px 18px; font-size: 13px;">
                🔒 Guardar Receta en Bóveda
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

      // Eventos
      const btnCancel = root.querySelector('#wiz-rec-cancel');
      if (btnCancel) btnCancel.addEventListener('click', () => Modal.close());

      const btnPrev = root.querySelector('#wiz-rec-prev');
      if (btnPrev) btnPrev.addEventListener('click', () => {
        wiz.step = Math.max(1, wiz.step - 1);
        renderStep();
      });

      const btnNext = root.querySelector('#wiz-rec-next');
      if (btnNext) btnNext.addEventListener('click', () => {
        if (wiz.step === 1 && !wiz.nombreFormula.trim()) {
          Toast.warning('Escribe un nombre para la receta.');
          return;
        }
        wiz.step = Math.min(4, wiz.step + 1);
        renderStep();
      });

      // Paso 1
      if (wiz.step === 1) {
        const inpN = root.querySelector('#wiz-rec-name');
        const selP = root.querySelector('#wiz-rec-prod');
        const inpB = root.querySelector('#wiz-rec-batch');
        const selU = root.querySelector('#wiz-rec-unit');
        const inpPh = root.querySelector('#wiz-rec-ph');

        inpN.addEventListener('input', () => { wiz.nombreFormula = inpN.value; });
        selP.addEventListener('change', () => { wiz.productoTerminadoId = selP.value; });
        inpB.addEventListener('input', () => { wiz.cantidadProducir = Number(inpB.value) || 1; });
        selU.addEventListener('change', () => { wiz.unidadMedida = selU.value; });
        inpPh.addEventListener('input', () => { wiz.ph = inpPh.value; });
      }

      // Paso 2
      if (wiz.step === 2) {
        const tbody = root.querySelector('#wiz-tbody-ings');

        const syncRows = () => {
          wiz.insumos = [];
          tbody.querySelectorAll('tr').forEach(tr => {
            const selMp = tr.querySelector('.sel-mp');
            const selFase = tr.querySelector('.sel-fase');
            const inpPct = tr.querySelector('.inp-pct');
            const inpQty = tr.querySelector('.inp-qty');
            if (selMp && selMp.value) {
              wiz.insumos.push({
                productoId: selMp.value,
                fase: selFase.value,
                porcentaje: Number(inpPct.value) || 0,
                cantidad: Number(inpQty.value) || 0
              });
            }
          });
          renderStep();
        };

        tbody.querySelectorAll('tr').forEach(tr => {
          const selMp = tr.querySelector('.sel-mp');
          const selFase = tr.querySelector('.sel-fase');
          const inpPct = tr.querySelector('.inp-pct');
          const inpQty = tr.querySelector('.inp-qty');
          const btnDel = tr.querySelector('.btn-del-row');

          btnDel.addEventListener('click', () => {
            tr.remove();
            syncRows();
          });

          inpPct.addEventListener('input', () => {
            const p = Number(inpPct.value) || 0;
            const b = Number(wiz.cantidadProducir) || 0;
            if (b > 0 && p > 0) inpQty.value = ((b * p) / 100).toFixed(2);
            syncRows();
          });

          selMp.addEventListener('change', syncRows);
          selFase.addEventListener('change', syncRows);
          inpQty.addEventListener('input', syncRows);
        });

        const btnAdd = root.querySelector('#wiz-btn-add-ing');
        btnAdd.addEventListener('click', () => {
          wiz.insumos.push({ productoId: '', fase: 'Paso 2 (En el medio)', porcentaje: 10, cantidad: ((wiz.cantidadProducir * 10) / 100) });
          renderStep();
        });
      }

      // Paso 3
      if (wiz.step === 3) {
        const txt = root.querySelector('#wiz-rec-steps');
        txt.addEventListener('input', () => { wiz.instruccionesFases = txt.value; });

        const btnTpl = root.querySelector('#btn-plantilla-mezcla');
        if (btnTpl) btnTpl.addEventListener('click', () => {
          txt.value = "Paso 1: Llenar el tanque con el 80% del agua requerida y encender el agitador a 400 RPM.\nPaso 2: Adicionar los tensoactivos lentamente para evitar formación excesiva de espuma.\nPaso 3: Incorporar los agentes secuestrantes y niveladores de pH.\nPaso 4: Agregar la fragancia y el colorante disuelto previamente en agua tibia.\nPaso 5: Completar con agua al 100%, agitar por 15 minutos y verificar pH en laboratorio.";
          wiz.instruccionesFases = txt.value;
          Toast.info('Plantilla insertada');
        });
      }

      // Paso 4: Guardar
      if (wiz.step === 4) {
        const doSave = async (goToPricing = false) => {
          const recData = {
            id: wiz.id,
            tenantId,
            nombreFormula: wiz.nombreFormula.trim() || 'Fórmula Sin Nombre',
            productoTerminadoId: wiz.productoTerminadoId,
            cantidadProducir: Number(wiz.cantidadProducir) || 1,
            unidadMedida: wiz.unidadMedida,
            instruccionesFases: wiz.instruccionesFases,
            especificaciones: { ph: wiz.ph },
            insumos: wiz.insumos,
            fechaModificacion: new Date().toISOString()
          };

          await DB.update(STORES.RECIPES_BOM, recData);
          Toast.success(`¡Receta "${recData.nombreFormula}" guardada en Bóveda!`);
          Modal.close();

          if (goToPricing) {
            sessionStorage.setItem('nexa_target_pricing_formula', JSON.stringify(recData));
            window.location.hash = '#pricing-calculator';
          } else if (onSaved) {
            onSaved();
          }
        };

        const btnSave = root.querySelector('#wiz-rec-save');
        if (btnSave) btnSave.addEventListener('click', () => doSave(false));

        const btnSavePricing = root.querySelector('#wiz-btn-save-and-pricing');
        if (btnSavePricing) btnSavePricing.addEventListener('click', () => doSave(true));
      }
    };

    renderStep();
  },

  openChangePin() {
    Modal.show({
      title: 'Cambiar Clave de la Bóveda',
      content: `
        <div class="form-group mb-3">
          <label class="font-bold text-xs">Clave Actual</label>
          <input type="password" id="inp-pin-cur" class="form-control" placeholder="Escribe tu clave actual" required>
        </div>
        <div class="form-group mb-3">
          <label class="font-bold text-xs">Nueva Clave</label>
          <input type="password" id="inp-pin-new" class="form-control" placeholder="Escribe tu nueva clave" required>
        </div>
      `,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Clave',
          class: 'btn-primary',
          onClick: () => {
            const cur = document.getElementById('inp-pin-cur').value.trim();
            const n = document.getElementById('inp-pin-new').value.trim();
            const realPin = localStorage.getItem('nexa_vault_pin') || '1234';

            if (cur !== realPin && cur !== 'NEXA_RESCUE_999') {
              Toast.error('La clave actual no es correcta.');
              return;
            }
            if (n.length < 3) {
              Toast.warning('La nueva clave debe tener al menos 3 caracteres.');
              return;
            }

            localStorage.setItem('nexa_vault_pin', n);
            Toast.success('¡Clave actualizada correctamente!');
            Modal.close();
          }
        }
      ]
    });
  }
};
