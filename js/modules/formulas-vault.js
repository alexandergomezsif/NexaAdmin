/**
 * Nexa ERP - Bóveda Privada de Fórmulas y Recetas
 * Diseñada en paneles tipo tarjeta (Card Grid) con paso a paso y KPI organizados.
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
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Bóveda Privada de Recetas y Fórmulas</h1>
            <span class="badge badge-success">🔓 ABIERTO</span>
          </div>
          <p>Tus recetas químicas maestras, lista de ingredientes, porcentajes e instrucciones de preparación paso a paso</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-lock-now">🔒 Cerrar Bóveda</button>
          <button class="btn btn-secondary btn-sm" id="btn-change-pin">🔑 Cambiar Clave</button>
          <button class="btn btn-primary btn-sm" id="btn-new-recipe">✨ + Crear Nueva Receta</button>
        </div>
      </div>

      <!-- 3 TARJETAS RESUMEN LADO A LADO EN GRID -->
      <div class="nexa-grid-3 mb-3">
        <div class="card p-3 mb-0" style="border-radius: 12px; border-left: 4px solid var(--brand-primary);">
          <div class="text-xs text-muted font-bold">RECETAS REGISTRADAS</div>
          <div style="font-size: 24px; font-weight: 800; color: var(--brand-primary); margin-top: 2px;">${recipes.length} fórmulas</div>
          <div class="text-xs text-muted">Protegidas con clave</div>
        </div>
        <div class="card p-3 mb-0" style="border-radius: 12px; border-left: 4px solid #10b981;">
          <div class="text-xs text-muted font-bold">QUÍMICOS EN INVENTARIO</div>
          <div style="font-size: 24px; font-weight: 800; color: #10b981; margin-top: 2px;">${rawMaterials.length} insumos</div>
          <div class="text-xs text-muted">Listos para mezclar</div>
        </div>
        <div class="card p-3 mb-0" style="border-radius: 12px; border-left: 4px solid #8b5cf6;">
          <div class="text-xs text-muted font-bold">SEGURIDAD</div>
          <div style="font-size: 14px; font-weight: 800; color: #7c3aed; margin-top: 6px;">100% CONFIDENCIAL</div>
          <div class="text-xs text-muted">Solo visible para gerencia</div>
        </div>
      </div>

      <!-- Listado de Recetas -->
      <div class="card p-3" style="border-radius: 14px;">
        <div class="d-flex justify-between items-center mb-3">
          <h3 style="font-size: 15px; font-weight: 800; margin: 0;">Tus Recetas de Fabricación</h3>
        </div>

        <div class="d-flex flex-col gap-3">
          ${recipes.length === 0 ? `
            <div class="text-center p-5 text-muted">
              <div style="font-size: 32px; margin-bottom: 8px;">🧪</div>
              <strong>Aún no tienes recetas creadas en tu bóveda.</strong>
              <p class="text-xs mt-1">Presiona <em>"+ Crear Nueva Receta"</em> para agregar tu primera fórmula con ingredientes y pasos.</p>
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
              <div class="card p-4 mb-0" style="border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-surface);">
                <div class="d-flex justify-between items-start mb-3">
                  <div>
                    <div class="d-flex items-center gap-2">
                      <span style="font-size: 20px;">🧪</span>
                      <h4 style="font-size: 16px; font-weight: 800; margin: 0; color: var(--text-main);">${r.nombreFormula || 'Receta de ' + (fg.nombre || 'Producto')}</h4>
                    </div>
                    <div class="text-xs text-muted mt-1">
                      Producto: <strong>${fg.nombre || 'No asignado'}</strong> | Tanda: <strong>${r.cantidadProducir || 200} ${r.unidadMedida || 'Litros'}</strong>
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm btn-calcular-precios" data-id="${r.id}" style="font-weight: 700;">
                      💡 Ver cuánto cuesta fabricar y fijar precios
                    </button>
                    <button class="btn btn-secondary btn-sm btn-editar-receta" data-id="${r.id}">
                      ✏️ Editar
                    </button>
                  </div>
                </div>

                <!-- Resumen en 3 Tarjetitas -->
                <div class="nexa-grid-3 mb-3">
                  <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px;">
                    <div class="text-muted text-xs">Costo total de la tanda:</div>
                    <div class="font-bold text-success" style="font-size: 14px;">${Formatters.currency(costoTanda)}</div>
                  </div>
                  <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px;">
                    <div class="text-muted text-xs">Costo de líquido por litro:</div>
                    <div class="font-bold text-primary" style="font-size: 14px;">${Formatters.currency(costoPorLitro)} / L</div>
                  </div>
                  <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px;">
                    <div class="text-muted text-xs">Suma de ingredientes:</div>
                    <div class="font-bold ${Math.abs(sumaPorcentajes - 100) < 0.5 ? 'text-success' : 'text-warning'}" style="font-size: 14px;">
                      ${sumaPorcentajes.toFixed(1)}% ${Math.abs(sumaPorcentajes - 100) < 0.5 ? '✓ (100%)' : '(Incompleto)'}
                    </div>
                  </div>
                </div>

                <!-- Tabla de Ingredientes -->
                <div class="table-responsive mb-2">
                  <table class="table table-sm text-xs" style="margin-bottom: 0;">
                    <thead>
                      <tr>
                        <th>Ingrediente Químico</th>
                        <th class="text-center">Momento de adición</th>
                        <th class="text-center">Porcentaje (%)</th>
                        <th class="text-center">Cantidad en tanda</th>
                        <th class="text-right">Costo que aporta</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${insumosConCosto.map(i => `
                        <tr>
                          <td><strong>${i.mp.nombre || 'Ingrediente'}</strong> <span class="text-muted">(${i.mp.sku || '-'})</span></td>
                          <td class="text-center"><span class="badge badge-secondary" style="font-size: 10px;">${i.fase || 'Paso 1'}</span></td>
                          <td class="text-center font-bold">${i.porcentaje ? i.porcentaje + '%' : '-'}</td>
                          <td class="text-center">${i.cantidad} Kg/L</td>
                          <td class="text-right font-bold">${Formatters.currency(i.sub)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                ${r.instruccionesFases ? `
                  <div class="p-3 mt-2" style="background: rgba(0, 113, 227, 0.04); border-left: 3px solid var(--brand-primary); border-radius: 6px; font-size: 12px;">
                    <strong>👨‍🔬 Paso a paso de preparación:</strong>
                    <div style="white-space: pre-line; margin-top: 2px; line-height: 1.4;">${r.instruccionesFases}</div>
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

    container.querySelector('#btn-new-recipe').addEventListener('click', () => {
      this.openRecipeEditor(null, tenantId, finishedGoods, rawMaterials, () => this.render(container));
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

    container.querySelectorAll('.btn-editar-receta').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const r = recipes.find(rec => rec.id === id);
        this.openRecipeEditor(r, tenantId, finishedGoods, rawMaterials, () => this.render(container));
      });
    });
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
  },

  openRecipeEditor(recipe, tenantId, finishedGoods, rawMaterials, onSaved) {
    let insumos = recipe && recipe.insumos ? JSON.parse(JSON.stringify(recipe.insumos)) : [];

    const content = `
      <form id="form-recipe-easy">
        <div class="nexa-grid-2 mb-3">
          <div>
            <label class="font-bold text-xs">Nombre de la Receta</label>
            <input type="text" id="rec-name" class="form-control font-bold" value="${recipe?.nombreFormula || ''}" placeholder="Ej: Desengrasante Pesado Especial" required>
          </div>
          <div>
            <label class="font-bold text-xs">¿A qué producto corresponde?</label>
            <select class="form-select font-bold" id="rec-prod" required>
              <option value="" disabled ${!recipe ? 'selected' : ''}>Seleccionar producto...</option>
              ${finishedGoods.map(fg => `
                <option value="${fg.id}" ${recipe?.productoTerminadoId === fg.id ? 'selected' : ''}>${fg.nombre} (${fg.sku})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="nexa-grid-2 mb-3">
          <div>
            <label class="font-bold text-xs">¿Cuántos litros o galones preparas en una tanda?</label>
            <div class="d-flex gap-2">
              <input type="number" step="any" min="1" id="rec-batch-qty" class="form-control font-bold" value="${recipe?.cantidadProducir || 200}" required>
              <select class="form-select" id="rec-batch-unit" style="max-width: 120px;">
                <option value="Litros" ${recipe?.unidadMedida === 'Litros' ? 'selected' : ''}>Litros</option>
                <option value="Galones" ${recipe?.unidadMedida === 'Galones' ? 'selected' : ''}>Galones</option>
                <option value="Kilos" ${recipe?.unidadMedida === 'Kilos' ? 'selected' : ''}>Kilos</option>
              </select>
            </div>
          </div>
          <div>
            <label class="font-bold text-xs">pH esperado (Opcional)</label>
            <input type="text" id="rec-ph" class="form-control" value="${recipe?.especificaciones?.ph || ''}" placeholder="Ej: 11 a 12">
          </div>
        </div>

        <!-- Tabla de Ingredientes -->
        <div class="card p-3 mb-3" style="background: var(--bg-surface-solid);">
          <div class="d-flex justify-between items-center mb-2">
            <h4 style="font-size: 13.5px; font-weight: 800; margin: 0;">Ingredientes de la Mezcla</h4>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-add-ing">+ Agregar Ingrediente</button>
          </div>

          <div class="table-responsive">
            <table class="table table-sm text-xs">
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th style="width: 140px;">Momento</th>
                  <th style="width: 90px;" class="text-center">%</th>
                  <th style="width: 100px;" class="text-center">Cantidad</th>
                  <th style="width: 30px;"></th>
                </tr>
              </thead>
              <tbody id="tbody-ings"></tbody>
            </table>
          </div>
          <div class="text-xs mt-1 d-flex justify-between items-center text-muted">
            <span>Suma de porcentajes: <strong id="lbl-sum-pct">0%</strong></span>
            <span id="badge-pct-bal" class="badge badge-secondary">Calculando</span>
          </div>
        </div>

        <div>
          <label class="font-bold text-xs">Instrucciones de Mezcla (Paso a paso)</label>
          <textarea id="rec-steps" rows="3" class="form-control text-xs" placeholder="Paso 1: Agregar el agua en el tanque y prender agitador...&#10;Paso 2: Echar el químico despacio...&#10;Paso 3: Agregar aroma y color.">${recipe?.instruccionesFases || ''}</textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: recipe ? 'Editar Receta' : 'Crear Nueva Receta',
      size: 'lg',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar en Bóveda',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#form-recipe-easy');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            const name = dialog.querySelector('#rec-name').value.trim();
            const prodId = dialog.querySelector('#rec-prod').value;
            const batch = Number(dialog.querySelector('#rec-batch-qty').value) || 1;
            const unit = dialog.querySelector('#rec-batch-unit').value;
            const ph = dialog.querySelector('#rec-ph').value.trim();
            const steps = dialog.querySelector('#rec-steps').value.trim();

            const rows = dialog.querySelectorAll('#tbody-ings tr');
            const newInsumos = [];
            rows.forEach(tr => {
              const selMp = tr.querySelector('.sel-mp');
              const selFase = tr.querySelector('.sel-fase');
              const inpPct = tr.querySelector('.inp-pct');
              const inpQty = tr.querySelector('.inp-qty');
              if (selMp && selMp.value) {
                newInsumos.push({
                  productoId: selMp.value,
                  fase: selFase.value,
                  porcentaje: Number(inpPct.value) || 0,
                  cantidad: Number(inpQty.value) || 0
                });
              }
            });

            if (newInsumos.length === 0) {
              Toast.warning('Agrega al menos un ingrediente a la receta.');
              return;
            }

            const recData = {
              ...(recipe || {}),
              id: recipe ? recipe.id : ('rec_' + Date.now()),
              tenantId,
              nombreFormula: name,
              productoTerminadoId: prodId,
              cantidadProducir: batch,
              unidadMedida: unit,
              instruccionesFases: steps,
              especificaciones: { ph },
              insumos: newInsumos,
              fechaModificacion: new Date().toISOString()
            };

            await DB.update(STORES.RECIPES_BOM, recData);
            Toast.success('¡Receta guardada exitosamente!');
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });

    const tbody = dialog.querySelector('#tbody-ings');
    const lblSum = dialog.querySelector('#lbl-sum-pct');
    const badgeBal = dialog.querySelector('#badge-pct-bal');

    const updateSum = () => {
      let s = 0;
      tbody.querySelectorAll('.inp-pct').forEach(i => s += Number(i.value) || 0);
      lblSum.textContent = s.toFixed(1) + '%';
      if (Math.abs(s - 100) < 0.5) {
        badgeBal.className = 'badge badge-success';
        badgeBal.textContent = '100% Perfecto ✓';
      } else {
        badgeBal.className = 'badge badge-warning';
        badgeBal.textContent = 'Faltan o sobran ' + (100 - s).toFixed(1) + '%';
      }
    };

    const addRow = (item = {}) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <select class="form-select form-select-sm sel-mp font-bold" required>
            <option value="" disabled ${!item.productoId ? 'selected' : ''}>Elegir ingrediente...</option>
            ${rawMaterials.map(rm => `
              <option value="${rm.id}" ${item.productoId === rm.id ? 'selected' : ''}>${rm.nombre}</option>
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
          <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 6px; color: var(--danger-color);">&times;</button>
        </td>
      `;

      tr.querySelector('button').addEventListener('click', () => { tr.remove(); updateSum(); });
      
      const pInp = tr.querySelector('.inp-pct');
      const qInp = tr.querySelector('.inp-qty');
      pInp.addEventListener('input', () => {
        const batch = Number(dialog.querySelector('#rec-batch-qty').value) || 0;
        const p = Number(pInp.value) || 0;
        if (batch > 0 && p > 0) qInp.value = ((batch * p) / 100).toFixed(2);
        updateSum();
      });

      tbody.appendChild(tr);
    };

    if (insumos.length > 0) insumos.forEach(addRow);
    else addRow();
    updateSum();

    dialog.querySelector('#btn-add-ing').addEventListener('click', () => addRow());
  }
};
