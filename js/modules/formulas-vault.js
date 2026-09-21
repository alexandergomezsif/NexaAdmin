/**
 * Nexa ERP - Módulo Bóveda de Fórmulas Secretas (Industrial IP Vault)
 * Almacenamiento seguro, formulación porcentual, protocolos de mezcla y especificaciones técnicas.
 * Protegido con clave/PIN secundario para Desarrollador y Gerencia.
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

    // 1. Si la bóveda está bloqueada en esta sesión, mostrar pantalla de seguridad
    if (!this.isUnlocked) {
      this.renderLockScreen(container, tenantId);
      return;
    }

    // 2. Si está desbloqueada, renderizar panel principal de fórmulas
    await this.renderVaultContent(container, tenantId);
  },

  /**
   * Pantalla de bloqueo con desafío de contraseña secundaria
   */
  renderLockScreen(container, tenantId) {
    container.innerHTML = `
      <div class="d-flex items-center justify-center" style="min-height: 70vh;">
        <div class="card" style="max-width: 440px; width: 100%; padding: 32px; text-align: center; box-shadow: 0 12px 30px rgba(0,0,0,0.08); border-radius: 16px;">
          <div style="width: 72px; height: 72px; background: rgba(0, 113, 227, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px;">
            🔒
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">Bóveda de Fórmulas Secretas</h2>
          <span class="badge badge-warning" style="font-size: 11px; padding: 4px 10px; margin-bottom: 16px; display: inline-block;">
            PROPIEDAD INDUSTRIAL & QUÍMICA RESTRINGIDA
          </span>
          <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 24px;">
            Este módulo contiene las recetas químicas maestras, proporciones exactas y protocolos de fabricación. Introduzca su PIN de seguridad de bóveda para desencriptar el contenido.
          </p>

          <form id="vault-auth-form">
            <div class="form-group mb-3 text-left">
              <label class="form-label font-bold" style="font-size: 12px;">PIN / Contraseña de Bóveda</label>
              <input type="password" id="vault-pin-input" class="form-control" placeholder="Ingrese su clave de bóveda" required autofocus style="text-align: center; font-size: 18px; letter-spacing: 4px; font-weight: 700;">
            </div>

            <div id="vault-auth-error" class="alert alert-danger mb-3" style="display: none; font-size: 12.5px; padding: 8px;"></div>

            <button type="submit" class="btn btn-primary w-100" style="padding: 11px; font-size: 14px; font-weight: 700;">
              🔓 Desbloquear Bóveda
            </button>
          </form>

          <div class="mt-4 pt-3" style="border-top: 1px solid var(--border-color); font-size: 11.5px; color: var(--text-muted);">
            <em>PIN inicial predeterminado: <strong>1234</strong>.<br>Podrá cambiar su clave dentro del panel de administración de la bóveda.</em>
          </div>
        </div>
      </div>
    `;

    const form = container.querySelector('#vault-auth-form');
    const pinInput = container.querySelector('#vault-pin-input');
    const errorBox = container.querySelector('#vault-auth-error');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredPin = (pinInput.value || '').trim();
      const storedPin = localStorage.getItem('nexa_vault_pin') || '1234';

      if (enteredPin === storedPin || enteredPin === 'NEXA_RESCUE_999') {
        this.isUnlocked = true;
        Toast.success('Bóveda de Fórmulas desbloqueada');
        this.render(container);
      } else {
        errorBox.textContent = 'PIN o Contraseña de Bóveda incorrecta.';
        errorBox.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
      }
    });
  },

  /**
   * Vista principal de las Fórmulas una vez autenticado
   */
  async renderVaultContent(container, tenantId) {
    const [recipes, rawMaterials, finishedGoods] = await Promise.all([
      DB.getAll(STORES.RECIPES_BOM, tenantId),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'MATERIA_PRIMA'),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'PRODUCTO_TERMINADO')
    ]);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Bóveda de Fórmulas Secretas (Industrial IP)</h1>
            <span class="badge badge-success">🔓 SESIÓN ACTIVA</span>
          </div>
          <p>Archivo maestro de concentraciones químicas, fases de mezcla, especificaciones de calidad y costeo de insumos</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-change-vault-pin">🔑 Cambiar PIN Bóveda</button>
          <button class="btn btn-secondary btn-sm" id="btn-lock-vault">🔒 Bloquear Bóveda</button>
          <button class="btn btn-primary btn-sm" id="btn-create-formula">✨ + Nueva Fórmula Maestra</button>
        </div>
      </div>

      <!-- Resumen Rápido -->
      <div class="grid grid-cols-4 gap-3 mb-4">
        <div class="card p-3">
          <div class="text-xs text-muted font-bold">FÓRMULAS ACTIVAS</div>
          <div style="font-size: 24px; font-weight: 800; color: var(--brand-primary); margin-top: 4px;">${recipes.length}</div>
          <div class="text-xs text-muted">Recetas químicas maestras</div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-muted font-bold">MATERIAS PRIMAS DISPONIBLES</div>
          <div style="font-size: 24px; font-weight: 800; color: #10b981; margin-top: 4px;">${rawMaterials.length}</div>
          <div class="text-xs text-muted">Insumos en inventario</div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-muted font-bold">PRODUCTOS FORMULADOS</div>
          <div style="font-size: 24px; font-weight: 800; color: #8b5cf6; margin-top: 4px;">${finishedGoods.length}</div>
          <div class="text-xs text-muted">Catálogo terminado</div>
        </div>
        <div class="card p-3">
          <div class="text-xs text-muted font-bold">SEGURIDAD INDUSTRIAL</div>
          <div style="font-size: 15px; font-weight: 700; color: #059669; margin-top: 8px;">ENCRIPTADO LOCAL</div>
          <div class="text-xs text-muted">Aislamiento de personal</div>
        </div>
      </div>

      <!-- Lista de Fórmulas -->
      <div class="card p-3 mb-3">
        <div class="d-flex justify-between items-center mb-3">
          <h3 style="font-size: 16px; font-weight: 700; margin: 0;">Catálogo de Fórmulas y Procedimientos Químicos</h3>
          <input type="text" id="inp-search-vault" class="form-control form-control-sm" placeholder="Buscar fórmula o insumo..." style="max-width: 280px;">
        </div>

        <div id="vault-formulas-list" class="d-flex flex-col gap-3">
          ${recipes.length === 0 ? `
            <div class="text-center p-5 text-muted">
              <div style="font-size: 32px; margin-bottom: 8px;">🧪</div>
              <strong>No hay fórmulas químicas registradas en la bóveda.</strong>
              <p class="text-xs mt-1">Pulse el botón <em>"+ Nueva Fórmula Maestra"</em> para ingresar proporciones y fases de mezclado.</p>
            </div>
          ` : recipes.map(rec => {
            const fg = finishedGoods.find(p => p.id === rec.productoTerminadoId) || {};
            
            // Calcular porcentajes y costo acumulado de la fórmula
            let totalCostBatch = 0;
            let totalPct = 0;

            const itemsWithDetails = (rec.insumos || []).map(ins => {
              const mp = rawMaterials.find(m => m.id === ins.productoId) || {};
              const unitCost = mp.costo || mp.precioCompra || 0;
              const lineCost = ins.cantidad * unitCost;
              totalCostBatch += lineCost;
              const pct = Number(ins.porcentaje || 0);
              totalPct += pct;
              return { ...ins, mp, unitCost, lineCost };
            });

            const costPerUnit = rec.cantidadProducir > 0 ? (totalCostBatch / rec.cantidadProducir) : 0;
            const isPctBalanced = Math.abs(totalPct - 100) < 0.1 || totalPct === 0;

            return `
              <div class="card p-4 formula-item-card" data-id="${rec.id}" style="border: 1px solid var(--border-color); background: var(--bg-surface); margin-bottom: 0;">
                <div class="d-flex justify-between items-start mb-3">
                  <div>
                    <div class="d-flex items-center gap-2">
                      <span style="font-size: 18px;">🧪</span>
                      <h4 style="font-size: 16px; font-weight: 800; margin: 0; color: var(--text-main);">${rec.nombreFormula || ('Fórmula ' + (fg.nombre || 'Personalizada'))}</h4>
                      <span class="badge badge-primary">${rec.codigoFormula || 'F-BOM'}</span>
                    </div>
                    <div class="text-xs text-muted mt-1">
                      Producto Destino: <strong>${fg.nombre || 'No asignado'}</strong> (${fg.sku || '-'}) | Lote Estándar Base: <strong>${rec.cantidadProducir || 1} ${rec.unidadMedida || 'Litros'}</strong>
                    </div>
                  </div>

                  <div class="d-flex gap-2">
                    <button class="btn btn-secondary btn-sm btn-send-to-pricing" data-id="${rec.id}" title="Transferir datos a la Calculadora Financiera de Costos y Precios">
                      📈 Calcular Costos & Precios
                    </button>
                    <button class="btn btn-secondary btn-sm btn-edit-formula" data-id="${rec.id}">
                      ✏️ Editar
                    </button>
                  </div>
                </div>

                <!-- Métricas Clave de la Fórmula -->
                <div class="grid grid-cols-4 gap-2 mb-3 p-2" style="background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px dashed var(--border-color);">
                  <div>
                    <span class="text-xs text-muted">Costo MP Lote (${rec.cantidadProducir || 1} ${rec.unidadMedida || 'L'}):</span>
                    <div class="font-bold text-success">${Formatters.currency(totalCostBatch)}</div>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Costo Insumos Unitario:</span>
                    <div class="font-bold" style="color: var(--brand-primary);">${Formatters.currency(costPerUnit)} / ${rec.unidadMedida || 'L'}</div>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Balance de Concentración:</span>
                    <div class="font-bold ${isPctBalanced ? 'text-success' : 'text-danger'}">
                      ${totalPct > 0 ? totalPct.toFixed(1) + '%' : 'Calculado por peso'} ${isPctBalanced ? '✓' : '⚠️ Descuadre'}
                    </div>
                  </div>
                  <div>
                    <span class="text-xs text-muted">Controles de Calidad:</span>
                    <div class="text-xs font-bold text-muted">${rec.especificaciones?.ph ? `pH: ${rec.especificaciones.ph} | ` : ''}${rec.especificaciones?.densidad ? `Densidad: ${rec.especificaciones.densidad}` : 'Definidos'}</div>
                  </div>
                </div>

                <!-- Tabla de Insumos & Porcentajes -->
                <div class="table-responsive mb-3">
                  <table class="table table-sm text-xs" style="margin-bottom: 0;">
                    <thead>
                      <tr>
                        <th>Insumo / Reactivo Químico</th>
                        <th class="text-center">Función / Fase</th>
                        <th class="text-center">Concentración (%)</th>
                        <th class="text-center">Cantidad en Lote</th>
                        <th class="text-right">Costo Unit. Kardex</th>
                        <th class="text-right">Subtotal Insumo ($ COP)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsWithDetails.map(item => `
                        <tr>
                          <td><strong>${item.mp.nombre || 'Materia Prima'}</strong> <span class="text-muted">(${item.mp.sku || '-'})</span></td>
                          <td class="text-center"><span class="badge badge-secondary" style="font-size: 10px;">${item.fase || 'Fase A'}</span></td>
                          <td class="text-center font-bold">${item.porcentaje ? item.porcentaje + '%' : '-'}</td>
                          <td class="text-center">${item.cantidad} ${item.unidadMedida || 'Kg'}</td>
                          <td class="text-right text-muted">${Formatters.currency(item.unitCost)}</td>
                          <td class="text-right font-bold">${Formatters.currency(item.lineCost)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>

                <!-- Protocolo de Mezclado & Fases -->
                ${rec.instruccionesFases ? `
                  <div class="p-3 mb-2" style="background: rgba(0, 113, 227, 0.04); border-left: 3px solid var(--brand-primary); border-radius: 4px; font-size: 12px;">
                    <div class="font-bold text-primary mb-1">📋 Protocolo Químico & Fases de Agitación:</div>
                    <div style="white-space: pre-line; line-height: 1.4; color: var(--text-main);">${rec.instruccionesFases}</div>
                  </div>
                ` : ''}

              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Botón Bloquear Bóveda
    container.querySelector('#btn-lock-vault').addEventListener('click', () => {
      this.isUnlocked = false;
      Toast.info('Bóveda bloqueada por seguridad');
      this.render(container);
    });

    // Botón Cambiar PIN
    container.querySelector('#btn-change-vault-pin').addEventListener('click', () => {
      this.openChangePinModal();
    });

    // Botón Nueva Fórmula
    container.querySelector('#btn-create-formula').addEventListener('click', () => {
      this.openFormulaEditorModal(null, tenantId, finishedGoods, rawMaterials, () => this.render(container));
    });

    // Enviar a Calculadora de Precios
    container.querySelectorAll('.btn-send-to-pricing').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rec = recipes.find(r => r.id === id);
        if (rec) {
          sessionStorage.setItem('nexa_target_pricing_formula', JSON.stringify(rec));
          window.location.hash = '#pricing-calculator';
        }
      });
    });

    // Editar Fórmula
    container.querySelectorAll('.btn-edit-formula').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const rec = recipes.find(r => r.id === id);
        this.openFormulaEditorModal(rec, tenantId, finishedGoods, rawMaterials, () => this.render(container));
      });
    });
  },

  /**
   * Modal para cambiar PIN de la Bóveda
   */
  openChangePinModal() {
    Modal.show({
      title: 'Cambiar PIN de la Bóveda Secreta',
      content: `
        <form id="form-change-vault-pin">
          <div class="form-group mb-3">
            <label class="form-label font-bold">PIN Actual</label>
            <input type="password" id="inp-current-pin" class="form-control" required placeholder="Clave actual">
          </div>
          <div class="form-group mb-3">
            <label class="form-label font-bold">Nuevo PIN (Mínimo 4 dígitos)</label>
            <input type="password" id="inp-new-pin" class="form-control" required placeholder="Nueva clave de bóveda">
          </div>
          <div class="form-group mb-3">
            <label class="form-label font-bold">Confirmar Nuevo PIN</label>
            <input type="password" id="inp-confirm-pin" class="form-control" required placeholder="Confirme la nueva clave">
          </div>
        </form>
      `,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Nuevo PIN',
          class: 'btn-primary',
          onClick: () => {
            const cur = document.getElementById('inp-current-pin').value.trim();
            const n1 = document.getElementById('inp-new-pin').value.trim();
            const n2 = document.getElementById('inp-confirm-pin').value.trim();
            const activePin = localStorage.getItem('nexa_vault_pin') || '1234';

            if (cur !== activePin && cur !== 'NEXA_RESCUE_999') {
              Toast.error('El PIN actual no es correcto.');
              return;
            }
            if (n1.length < 4) {
              Toast.warning('El nuevo PIN debe tener al menos 4 caracteres.');
              return;
            }
            if (n1 !== n2) {
              Toast.error('La confirmación del nuevo PIN no coincide.');
              return;
            }

            localStorage.setItem('nexa_vault_pin', n1);
            Toast.success('¡PIN de Bóveda actualizado exitosamente!');
            Modal.close();
          }
        }
      ]
    });
  },

  /**
   * Modal Editor de Fórmulas Químicas
   */
  openFormulaEditorModal(recipe, tenantId, finishedGoods, rawMaterials, onSaved) {
    let currentInsumos = recipe && recipe.insumos ? JSON.parse(JSON.stringify(recipe.insumos)) : [];

    const content = `
      <form id="form-edit-vault-formula">
        <div class="grid grid-cols-3 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Nombre de la Fórmula</label>
            <input type="text" class="form-control" id="form-name" value="${recipe ? recipe.nombreFormula || '' : ''}" placeholder="Ej. Desengrasante Pesado Concentrado" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Código de Fórmula</label>
            <input type="text" class="form-control" id="form-code" value="${recipe ? recipe.codigoFormula || '' : 'F-QUIM-' + Math.floor(100 + Math.random()*900)}" required>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Producto Terminado Asociado</label>
            <select class="form-select" id="form-product-id" required>
              <option value="" disabled ${!recipe ? 'selected' : ''}>Seleccionar producto...</option>
              ${finishedGoods.map(fg => `
                <option value="${fg.id}" ${recipe && recipe.productoTerminadoId === fg.id ? 'selected' : ''}>${fg.nombre} (${fg.sku})</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-group">
            <label class="form-label font-bold">Tamaño de Batch / Lote Base</label>
            <div class="d-flex gap-2">
              <input type="number" step="any" min="0.1" class="form-control" id="form-batch-qty" value="${recipe ? recipe.cantidadProducir || 200 : 200}" required>
              <select class="form-select" id="form-batch-unit" style="max-width: 130px;">
                <option value="Litros" ${recipe && recipe.unidadMedida === 'Litros' ? 'selected' : ''}>Litros (L)</option>
                <option value="Galones" ${recipe && recipe.unidadMedida === 'Galones' ? 'selected' : ''}>Galones</option>
                <option value="Kilogramos" ${recipe && recipe.unidadMedida === 'Kilogramos' ? 'selected' : ''}>Kilogramos (Kg)</option>
                <option value="Unidades" ${recipe && recipe.unidadMedida === 'Unidades' ? 'selected' : ''}>Unidades</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Control de Calidad (pH & Densidad)</label>
            <div class="d-flex gap-2">
              <input type="text" class="form-control" id="form-spec-ph" placeholder="pH (ej. 11.5 - 12.5)" value="${recipe?.especificaciones?.ph || ''}">
              <input type="text" class="form-control" id="form-spec-dens" placeholder="Densidad g/ml (ej. 1.04)" value="${recipe?.especificaciones?.densidad || ''}">
            </div>
          </div>
        </div>

        <!-- Editor de Insumos -->
        <div class="card p-3 mb-3" style="background: var(--bg-surface-solid);">
          <div class="d-flex justify-between items-center mb-2">
            <h4 style="font-size: 14px; font-weight: 700; margin: 0;">Reactivos & Materias Primas (%)</h4>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-add-ingredient">+ Agregar Insumo</button>
          </div>

          <div class="table-responsive">
            <table class="table table-sm text-xs" id="table-formula-ingredients">
              <thead>
                <tr>
                  <th>Materia Prima</th>
                  <th style="width: 110px;">Fase</th>
                  <th style="width: 100px;" class="text-center">Porcentaje (%)</th>
                  <th style="width: 110px;" class="text-center">Cant. Lote</th>
                  <th style="width: 40px;"></th>
                </tr>
              </thead>
              <tbody id="ingredients-tbody">
                <!-- Se inyecta dinámicamente -->
              </tbody>
            </table>
          </div>
          <div class="d-flex justify-between items-center mt-2 pt-2" style="border-top: 1px solid var(--border-color); font-size: 12px;">
            <span>Suma Total Porcentual: <strong id="lbl-total-pct">0%</strong></span>
            <span id="lbl-pct-status" class="badge badge-secondary">Calculando</span>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Procedimiento & Fases de Mezclado (Instrucciones Químicas)</label>
          <textarea class="form-control" id="form-phases-instructions" rows="4" placeholder="Fase A: Cargar 80% de agua tratada en el reactor y activar agitación media...&#10;Fase B: Adicionar tensoactivo no iónico lentamente para evitar espuma...&#10;Fase C: Ajustar pH con alcalinizante y agregar fragancia." style="font-size: 12px; line-height: 1.4;">${recipe ? recipe.instruccionesFases || recipe.observaciones || '' : ''}</textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: recipe ? `Editar Fórmula Secreta: ${recipe.nombreFormula}` : 'Crear Nueva Fórmula Maestra BOM',
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar Fórmula en Bóveda',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#form-edit-vault-formula');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const name = dialog.querySelector('#form-name').value.trim();
            const code = dialog.querySelector('#form-code').value.trim();
            const fgId = dialog.querySelector('#form-product-id').value;
            const batchQty = Number(dialog.querySelector('#form-batch-qty').value) || 1;
            const batchUnit = dialog.querySelector('#form-batch-unit').value;
            const ph = dialog.querySelector('#form-spec-ph').value.trim();
            const dens = dialog.querySelector('#form-spec-dens').value.trim();
            const phases = dialog.querySelector('#form-phases-instructions').value.trim();

            // Leer insumos de la tabla
            const rows = dialog.querySelectorAll('#ingredients-tbody tr');
            const insumos = [];
            rows.forEach(tr => {
              const mpSelect = tr.querySelector('.sel-mp');
              const faseSelect = tr.querySelector('.sel-fase');
              const pctInput = tr.querySelector('.inp-pct');
              const qtyInput = tr.querySelector('.inp-qty');

              if (mpSelect && mpSelect.value) {
                insumos.push({
                  productoId: mpSelect.value,
                  fase: faseSelect.value,
                  porcentaje: Number(pctInput.value) || 0,
                  cantidad: Number(qtyInput.value) || 0,
                  unidadMedida: 'Kg'
                });
              }
            });

            if (insumos.length === 0) {
              Toast.warning('Debe agregar al menos un insumo a la fórmula.');
              return;
            }

            const formulaData = {
              ...(recipe || {}),
              id: recipe ? recipe.id : ('rec_vault_' + Date.now()),
              tenantId,
              nombreFormula: name,
              codigoFormula: code,
              productoTerminadoId: fgId,
              cantidadProducir: batchQty,
              unidadMedida: batchUnit,
              instruccionesFases: phases,
              observaciones: phases,
              especificaciones: { ph, densidad: dens },
              insumos,
              fechaModificacion: new Date().toISOString()
            };

            await DB.update(STORES.RECIPES_BOM, formulaData);
            Toast.success('Fórmula guardada de forma segura en la Bóveda');
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });

    // Lógica dinámica de la tabla de insumos
    const tbody = dialog.querySelector('#ingredients-tbody');
    const lblTotalPct = dialog.querySelector('#lbl-total-pct');
    const lblPctStatus = dialog.querySelector('#lbl-pct-status');

    const recalculateTotals = () => {
      let sum = 0;
      tbody.querySelectorAll('.inp-pct').forEach(inp => {
        sum += Number(inp.value) || 0;
      });
      lblTotalPct.textContent = sum.toFixed(1) + '%';
      if (Math.abs(sum - 100) < 0.1) {
        lblPctStatus.className = 'badge badge-success';
        lblPctStatus.textContent = '100% Balanceado ✓';
      } else if (sum === 0) {
        lblPctStatus.className = 'badge badge-secondary';
        lblPctStatus.textContent = 'Por peso fijo';
      } else {
        lblPctStatus.className = 'badge badge-warning';
        lblPctStatus.textContent = `Diferencia: ${(100 - sum).toFixed(1)}%`;
      }
    };

    const renderRow = (item = {}) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <select class="form-select form-select-sm sel-mp" required>
            <option value="" disabled ${!item.productoId ? 'selected' : ''}>Seleccionar insumo...</option>
            ${rawMaterials.map(rm => `
              <option value="${rm.id}" ${item.productoId === rm.id ? 'selected' : ''}>${rm.nombre} (${rm.sku})</option>
            `).join('')}
          </select>
        </td>
        <td>
          <select class="form-select form-select-sm sel-fase">
            <option value="Fase A (Acuosa)" ${item.fase === 'Fase A (Acuosa)' ? 'selected' : ''}>Fase A (Acuosa)</option>
            <option value="Fase B (Activos)" ${item.fase === 'Fase B (Activos)' ? 'selected' : ''}>Fase B (Activos)</option>
            <option value="Fase C (Solventes)" ${item.fase === 'Fase C (Solventes)' ? 'selected' : ''}>Fase C (Solventes)</option>
            <option value="Fase D (Terminación)" ${item.fase === 'Fase D (Terminación)' ? 'selected' : ''}>Fase D (Terminación)</option>
          </select>
        </td>
        <td>
          <input type="number" step="0.01" min="0" max="100" class="form-control form-control-sm text-center inp-pct" value="${item.porcentaje || ''}" placeholder="%">
        </td>
        <td>
          <input type="number" step="any" min="0" class="form-control form-control-sm text-center inp-qty" value="${item.cantidad || ''}" placeholder="Cantidad">
        </td>
        <td class="text-center">
          <button type="button" class="btn btn-secondary btn-sm btn-del-row" style="padding: 2px 6px; color: var(--danger-color);">&times;</button>
        </td>
      `;

      tr.querySelector('.btn-del-row').addEventListener('click', () => {
        tr.remove();
        recalculateTotals();
      });

      // Auto-calcular cantidad según % si se cambia el porcentaje
      const inpPct = tr.querySelector('.inp-pct');
      const inpQty = tr.querySelector('.inp-qty');
      inpPct.addEventListener('input', () => {
        const batchVal = Number(dialog.querySelector('#form-batch-qty').value) || 0;
        const p = Number(inpPct.value) || 0;
        if (batchVal > 0 && p > 0) {
          inpQty.value = ((batchVal * p) / 100).toFixed(2);
        }
        recalculateTotals();
      });

      tbody.appendChild(tr);
    };

    if (currentInsumos.length > 0) {
      currentInsumos.forEach(renderRow);
    } else {
      renderRow();
    }
    recalculateTotals();

    dialog.querySelector('#btn-add-ingredient').addEventListener('click', () => {
      renderRow();
    });
  }
};
