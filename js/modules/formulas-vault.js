/**
 * Nexa ERP - Bóveda Privada de Fórmulas y Recetas
 * Flujo Guiado con Asistente Modal Paso a Paso (Wizard)
 * - Protección por PIN para secretos de fabricación
 * - Vista principal: Listado de fórmulas con KPIs y opciones
 * - Asistente Modal (Wizard): 4 pasos didácticos para crear o editar recetas maestras
 */

import { AuditService } from '../services/audit-service.js';
import { CryptoUtil } from '../utils/crypto.js';
import { DB, STORES } from '../services/db-service.js';
import { Formatters, esc } from '../utils/formatters.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

/** Costo unitario de un insumo: costo promedio del Kardex (los campos 'costo'/'precioCompra' no existen en el catálogo actual). */
const mpCost = (mp) => Number((mp && (mp.costoPromedio || mp.costo || mp.precioCompra)) || 0);

/** Las recetas de la semilla y las creadas en la Bóveda usaban nombres de campo distintos; se unifican al leer. */
function normalizeRecipe(r) {
  return {
    ...r,
    nombreFormula: r.nombreFormula || r.nombreReceta || 'Receta',
    cantidadProducir: Number(r.cantidadProducir || r.rendimientoLote) || 1,
    unidadMedida: r.unidadMedida || r.unidadMedidaLote || 'Unidades',
    volumenTanda: Number(r.volumenTanda) || (/^(litros|galones|kilos)$/i.test(r.unidadMedida || '') ? Number(r.cantidadProducir || r.rendimientoLote) || 0 : 0),
    unidadTanda: r.unidadTanda || (/^(litros|galones|kilos)$/i.test(r.unidadMedida || '') ? r.unidadMedida : 'Litros'),
    insumos: (r.insumos || []).map(i => ({ ...i, productoId: i.productoId || i.materiaPrimaId, mermaEsperada: Number(i.mermaEsperada) || 0 }))
  };
}

export const FormulasVaultModule = {
  _pin: null,   // PIN en memoria mientras la bóveda está abierta (nunca se guarda en claro)

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    if (!this._pin) {
      const hasPin = !!(await DB.getParam(this.pinParam(tenantId), null));
      this.renderLockScreen(container, tenantId, hasPin);
      return;
    }

    await this.renderVault(container, tenantId);
  },

  pinParam(tenantId) {
    return `vault_pin_${tenantId}`;
  },

  /** Cifra el texto secreto (protocolo de mezcla y especificaciones) de una receta */
  async sealRecipe(r, pin) {
    const secret = { instruccionesFases: r.instruccionesFases || '', especificaciones: r.especificaciones || {} };
    const out = { ...r, secreto: await CryptoUtil.encryptJSON(secret, pin) };
    delete out.instruccionesFases;
    delete out.especificaciones;
    return out;
  },

  /** Descifra en memoria (no modifica la BD) */
  async openRecipe(r, pin) {
    if (!r.secreto) return r;
    const sec = await CryptoUtil.decryptJSON(r.secreto, pin);
    return { ...r, instruccionesFases: sec.instruccionesFases, especificaciones: sec.especificaciones };
  },

  /** Cifra recetas que aún tengan el secreto en texto plano (datos de versiones anteriores) */
  async sealLegacy(tenantId, pin) {
    const recipes = await DB.getAll(STORES.RECIPES_BOM, tenantId);
    for (const r of recipes) {
      if (!r.secreto && (r.instruccionesFases || r.especificaciones)) {
        await DB.update(STORES.RECIPES_BOM, await this.sealRecipe(r, pin));
      }
    }
  },

  renderLockScreen(container, tenantId, hasPin) {
    container.innerHTML = `
      <div class="d-flex items-center justify-center" style="min-height: 70vh;">
        <div class="card" style="max-width: 440px; width: 100%; padding: 32px; text-align: center; border-radius: 16px;">
          <div style="font-size: 40px; margin-bottom: 12px;">🔒</div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">Bóveda de recetas</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; line-height: 1.45;">
            ${hasPin
              ? 'El protocolo de mezcla y las especificaciones están cifrados. Ingrese la clave de la bóveda.'
              : 'Defina la clave de la bóveda. Con ella se cifran el protocolo de mezcla y las especificaciones de cada receta.'}
          </p>
          <form id="vault-pin-form" autocomplete="off">
            <input type="password" id="vault-pin-inp" class="form-control text-center font-bold mb-2" placeholder="${hasPin ? 'PIN de la bóveda' : 'Nuevo PIN (4 dígitos)'}" inputmode="numeric" maxlength="4" required autofocus style="font-size: 16px; height: 44px;">
            ${hasPin ? '' : '<input type="password" id="vault-pin-inp2" class="form-control text-center font-bold mb-2" placeholder="Repetir PIN" inputmode="numeric" maxlength="4" required style="font-size: 16px; height: 44px;">'}
            <div id="vault-pin-err" class="alert alert-danger mb-3 text-xs" style="display: none; padding: 8px;"></div>
            ${hasPin ? '' : '<div class="alert alert-warning text-xs mb-3" style="text-align: left;">⚠️ Si olvida esta clave, el texto cifrado de las recetas <strong>no se puede recuperar</strong> (ni siquiera el desarrollador). Anótela en un lugar seguro. Las cantidades de insumos no se cifran porque Producción las necesita.</div>'}
            <button type="submit" class="btn btn-primary w-100 font-bold" style="height: 42px;">${hasPin ? '🔓 Abrir bóveda' : '🔐 Crear clave y abrir'}</button>
          </form>
        </div>
      </div>
    `;

    const form = container.querySelector('#vault-pin-form');
    const err = container.querySelector('#vault-pin-err');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.style.display = 'none';
      const val = container.querySelector('#vault-pin-inp').value;
      try {
        if (hasPin) {
          const stored = await DB.getParam(this.pinParam(tenantId), null);
          if (!(await CryptoUtil.verifyPassword(val, stored))) throw new Error('Clave incorrecta.');
        } else {
          if (!/^\d{4}$/.test(val)) throw new Error('El PIN de la bóveda debe tener 4 dígitos numéricos.');
          if (val !== container.querySelector('#vault-pin-inp2').value) throw new Error('Las claves no coinciden.');
          await DB.setParam(this.pinParam(tenantId), await CryptoUtil.hashPassword(val), tenantId);
          await AuditService.log({ modulo: 'Bóveda', accion: 'CREAR', campoModificado: 'Clave de bóveda', valorNuevo: 'Definida' });
        }
        this._pin = val;
        await this.sealLegacy(tenantId, val);
        Toast.success('Bóveda abierta.');
        this.render(container);
      } catch (ex) {
        err.textContent = ex.message;
        err.style.display = 'block';
      }
    });
  },

  async renderVault(container, tenantId) {
    const [sealed, rawMaterials, finishedGoods] = await Promise.all([
      DB.getAll(STORES.RECIPES_BOM, tenantId),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'MATERIA_PRIMA'),
      (await DB.getAll(STORES.PRODUCTS, tenantId)).filter(p => p.tipoItem === 'PRODUCTO_TERMINADO')
    ]);
    const recipes = [];
    for (const r of sealed) {
      try {
        recipes.push(await this.openRecipe(r, this._pin));
      } catch (e) {
        recipes.push({ ...r, instruccionesFases: '⚠️ No se pudo descifrar con la clave actual.' });
      }
    }

    recipes.forEach((r, i) => { recipes[i] = normalizeRecipe(r); });

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Bóveda de fórmulas <span class="badge badge-success" style="vertical-align: middle;">Abierta</span></h1>
          <p>${recipes.length} fórmula(s). El protocolo de mezcla y las especificaciones se guardan cifrados.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-lock-now">Cerrar bóveda</button>
          <button class="btn btn-secondary btn-sm" id="btn-change-pin">Cambiar PIN</button>
          <button class="btn btn-primary btn-sm" id="btn-nueva-receta-asistente">Nueva fórmula</button>
        </div>
      </div>

      <div class="d-flex flex-col gap-3">
        ${recipes.length === 0 ? `
          <div class="card text-center p-5 text-muted">
            <strong>Aún no hay fórmulas en la bóveda.</strong>
            <p class="text-xs mt-1">Cree la primera con el botón <em>Nueva fórmula</em>.</p>
            <button class="btn btn-primary btn-sm mt-2" id="btn-receta-vacia">Nueva fórmula</button>
          </div>
        ` : recipes.map(r => {
          const fg = finishedGoods.find(p => p.id === r.productoTerminadoId) || {};
          let costoTanda = 0;
          let sumaPorcentajes = 0;
          let conPorcentaje = false;
          const insumosConCosto = r.insumos.map(ins => {
            const mp = rawMaterials.find(m => m.id === ins.productoId) || {};
            const costoUnit = mpCost(mp);
            const cant = Number(ins.cantidad || 0) * (1 + Number(ins.mermaEsperada || 0) / 100);
            const sub = cant * costoUnit;
            costoTanda += sub;
            if (ins.porcentaje) { conPorcentaje = true; sumaPorcentajes += Number(ins.porcentaje); }
            return { ...ins, mp, costoUnit, sub, unidad: ins.unidadMedida || mp.unidadMedida || '' };
          });
          costoTanda += Number(r.costosIndirectosEstimados || 0);
          const lote = r.cantidadProducir;
          const costoUnidad = lote > 0 ? costoTanda / lote : costoTanda;
          const sinCosto = insumosConCosto.some(i => !(i.costoUnit > 0));

          return `
            <div class="card recipe-card">
              <div class="recipe-head">
                <div>
                  <h3 class="recipe-title">${esc(r.nombreFormula)}</h3>
                  <div class="text-xs text-muted">Producto: <strong>${esc(fg.nombre || 'sin vincular')}</strong> · Rinde: <strong>${esc(lote)} ${esc(fg.unidadMedida || r.unidadMedida)}</strong> por lote${r.volumenTanda ? ` · tanda ${esc(r.volumenTanda)} ${esc(r.unidadTanda)}` : ''}</div>
                </div>
                <div class="recipe-costs">
                  <div><span class="ps-label">Costo del lote</span><strong>${Formatters.currency(costoTanda)}</strong></div>
                  <div><span class="ps-label">Costo por unidad</span><strong>${Formatters.currency(costoUnidad)}</strong></div>
                  ${conPorcentaje ? `<div><span class="ps-label">Suma de %</span><strong class="${Math.abs(sumaPorcentajes - 100) < 0.5 ? 'text-success' : 'text-warning'}">${sumaPorcentajes.toFixed(1)}%</strong></div>` : ''}
                </div>
                <div class="recipe-actions">
                  ${r.productoTerminadoId ? `<button class="btn btn-secondary btn-sm btn-calcular-precios" data-id="${esc(r.id)}">Precios</button>` : ''}
                  <button class="btn btn-secondary btn-sm btn-editar-receta" data-id="${esc(r.id)}">Editar</button>
                </div>
              </div>
              ${sinCosto ? '<div class="text-xs text-warning mt-1">Algún insumo no tiene costo todavía (registre una compra); el costo del lote está incompleto.</div>' : ''}
              <details class="recipe-details">
                <summary>Ingredientes (${insumosConCosto.length})${r.instruccionesFases ? ' y protocolo de mezcla' : ''}</summary>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead><tr><th>Insumo</th><th>Momento</th>${conPorcentaje ? '<th class="text-right">%</th>' : ''}<th class="text-right">Cantidad en el lote</th><th class="text-right">Costo</th></tr></thead>
                    <tbody>
                      ${insumosConCosto.map(i => `
                        <tr>
                          <td><strong>${esc(i.mp.nombre || 'Insumo no encontrado')}</strong> <span class="text-muted text-xs">${esc(i.mp.sku || '')}</span></td>
                          <td class="text-xs">${esc(i.fase || '—')}</td>
                          ${conPorcentaje ? `<td class="text-right">${i.porcentaje ? esc(i.porcentaje) + '%' : '—'}</td>` : ''}
                          <td class="text-right">${esc(i.cantidad)} ${esc(i.unidad)}</td>
                          <td class="text-right">${Formatters.currency(i.sub)}</td>
                        </tr>`).join('')}
                      ${Number(r.costosIndirectosEstimados || 0) > 0 ? `<tr><td colspan="${conPorcentaje ? 4 : 3}" class="text-muted">Costos indirectos del lote</td><td class="text-right">${Formatters.currency(r.costosIndirectosEstimados)}</td></tr>` : ''}
                    </tbody>
                  </table>
                </div>
                ${r.instruccionesFases ? `<div class="recipe-protocol"><strong>Protocolo de mezcla</strong><div>${esc(r.instruccionesFases)}</div></div>` : ''}
              </details>
            </div>`;
        }).join('')}
      </div>
    `;

    // Eventos
    container.querySelector('#btn-lock-now').addEventListener('click', () => {
      this._pin = null;
      Toast.info('Bóveda cerrada');
      this.render(container);
    });

    container.querySelector('#btn-change-pin').addEventListener('click', () => {
      this.openChangePin(tenantId, () => this.render(container));
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
          const { instruccionesFases, especificaciones, secreto, ...publica } = r;
          sessionStorage.setItem('nexa_target_pricing_formula', JSON.stringify(publica));
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
      unidadMedida: 'Unidades',
      volumenTanda: Number(existingRecipe?.volumenTanda) || 0,
      unidadTanda: existingRecipe?.unidadTanda || 'Litros',
      ph: existingRecipe?.especificaciones?.ph || '',
      cif: Number(existingRecipe?.costosIndirectosEstimados || 0),
      insumos: existingRecipe?.insumos ? JSON.parse(JSON.stringify(existingRecipe.insumos)) : [
        { productoId: '', fase: 'Paso 1 (Al inicio)', porcentaje: 0, cantidad: 0, mermaEsperada: 0 }
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

    const calcTotals = () => {
      let costoTanda = 0;
      let sumaPct = 0;
      wiz.insumos.forEach(i => {
        const mp = rawMaterials.find(m => m.id === i.productoId) || {};
        costoTanda += (Number(i.cantidad || 0) * (1 + (Number(i.mermaEsperada) || 0) / 100) * mpCost(mp));
        sumaPct += Number(i.porcentaje || 0);
      });
      const batch = Number(wiz.cantidadProducir) || 1;
      return { costoTanda, sumaPct, costoPorLitro: batch > 0 ? Math.round(costoTanda / batch) : costoTanda };
    };
    const unidadSingular = () => String(wiz.unidadMedida || 'unidad').replace(/es$/i, '').replace(/s$/i, '').toLowerCase();
    const balanceHtml = (sumaPct) => wiz.insumos.some(i => Number(i.porcentaje) > 0)
      ? `<span class="badge ${Math.abs(sumaPct - 100) < 0.5 ? 'badge-success' : 'badge-warning'} font-bold">${sumaPct.toFixed(1)}% ${Math.abs(sumaPct - 100) < 0.5 ? '✓' : `(faltan o sobran ${(100 - sumaPct).toFixed(1)}%)`}</span>`
      : '<span class="text-xs text-muted">Opcional: escriba el % de cada insumo para calcular la cantidad automáticamente.</span>';

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
      const { costoTanda, sumaPct, costoPorLitro } = calcTotals();

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
              <input type="text" id="wiz-rec-name" class="form-control font-bold" value="${esc(wiz.nombreFormula)}" placeholder="Ej: Desengrasante Pesado Industrial" required>
            </div>
            <div>
              <label class="font-bold text-xs">¿A qué Producto Terminado corresponde?</label>
              <select class="form-select font-bold" id="wiz-rec-prod">
                <option value="">-- Sin vincular aún (Solo fórmula) --</option>
                ${finishedGoods.map(fg => `
                  <option value="${fg.id}" ${wiz.productoTerminadoId === fg.id ? 'selected' : ''}>
                    ${esc(fg.nombre)} (${esc(fg.sku || '-')})
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <div class="nexa-grid-2 mb-3">
            <div>
              <label class="font-bold text-xs">Rendimiento: ¿cuántas unidades del producto salen de un lote?</label>
              <input type="number" step="any" min="1" id="wiz-rec-batch" class="form-control font-bold" value="${wiz.cantidadProducir}" required>
              <div class="text-xs text-muted mt-1">En la unidad del producto (botellas, galones envasados, garrafas). Producción descuenta los insumos en esa proporción.</div>
            </div>
            <div>
              <label class="font-bold text-xs">Tamaño de la tanda (opcional, para calcular con %):</label>
              <div class="d-flex gap-2">
                <input type="number" step="any" min="0" id="wiz-rec-vol" class="form-control" value="${wiz.volumenTanda || ''}" placeholder="Ej: 100">
                <select class="form-select" id="wiz-rec-unit" style="max-width: 120px;">
                  ${['Litros', 'Galones', 'Kilos'].map(u => `<option value="${u}" ${wiz.unidadTanda === u ? 'selected' : ''}>${u}</option>`).join('')}
                </select>
              </div>
            </div>
            <div>
              <label class="font-bold text-xs">pH esperado (Opcional):</label>
              <input type="text" id="wiz-rec-ph" class="form-control" value="${wiz.ph}" placeholder="Ej: 11 a 12 (Alcalino)">
            </div>
            <div>
              <label class="font-bold text-xs">Costos indirectos por lote (opcional):</label>
              <input type="number" min="0" step="100" id="wiz-rec-cif" class="form-control" value="${wiz.cif || ''}" placeholder="Mano de obra, energía, agua…">
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
            <strong>Paso 2 de 4:</strong> Agregue todos los insumos del lote (químicos, envases, cajas) con la cantidad que usa.
            El costo se calcula al instante con el costo promedio de cada insumo.
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
                  <th style="width: 110px;" class="text-center">Cantidad en el lote</th>
                  <th style="width: 60px;">Unidad</th>
                  <th style="width: 80px;" class="text-center" title="Pérdida esperada del insumo en el proceso">Merma %</th>
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
                            ${esc(rm.nombre)} (${Formatters.currency(mpCost(rm))}/${esc(rm.unidadMedida || 'u')})
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
                      <input type="number" step="0.1" min="0" max="100" class="form-control form-control-sm text-center font-bold inp-pct" value="${item.porcentaje || ''}" placeholder="%"
                        ${(!(wiz.volumenTanda > 0) || /^(unidad|unidades|und)$/i.test((rawMaterials.find(m => m.id === item.productoId) || {}).unidadMedida || '')) ? 'disabled title="El % aplica solo a químicos y requiere el tamaño de la tanda (paso 1)"' : ''}>
                    </td>
                    <td>
                      <input type="number" step="any" min="0" class="form-control form-control-sm text-center font-bold inp-qty" value="${item.cantidad || ''}" placeholder="Cantidad">
                    </td>
                    <td class="text-xs text-muted">${esc((rawMaterials.find(m => m.id === item.productoId) || {}).unidadMedida || '')}</td>
                    <td><input type="number" step="0.5" min="0" max="50" class="form-control form-control-sm text-center inp-merma" value="${item.mermaEsperada || ''}" placeholder="0"></td>
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
                <span class="text-xs text-muted font-bold">Proporciones (%):</span>
                <div class="d-flex items-center gap-2 mt-1" id="wiz-sum-balance">${balanceHtml(sumaPct)}</div>
              </div>

              <div class="text-right">
                <span class="text-xs text-muted font-bold">Costo de insumos por ${esc(unidadSingular())}:</span>
                <div style="font-size: 18px; font-weight: 900; color: var(--brand-primary);" id="wiz-sum-unit">${Formatters.currency(costoPorLitro)}</div>
                <span class="text-xs text-muted" id="wiz-sum-total">Total del lote: ${Formatters.currency(costoTanda)}</span>
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
            <textarea id="wiz-rec-steps" rows="6" class="form-control text-xs" style="font-size: 12px; line-height: 1.4;" placeholder="Paso 1: Llenar el tanque con el agua base y encender el agitador a media velocidad...&#10;Paso 2: Agregar el químico activo lentamente para evitar salpicaduras...&#10;Paso 3: Incorporar el color y la fragancia hasta homogenizar...&#10;Paso 4: Tomar muestra de pH antes del envasado.">${esc(wiz.instruccionesFases)}</textarea>
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
                <h4 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text-main);">🧪 ${esc(wiz.nombreFormula)}</h4>
                <div class="text-xs text-muted">
                  Producto Asociado: <strong>${prodAsoc ? prodAsoc.nombre : 'Sin vincular'}</strong> | Rinde: <strong>${esc(wiz.cantidadProducir)} unidades por lote</strong>${wiz.volumenTanda ? ` (tanda de ${esc(wiz.volumenTanda)} ${esc(wiz.unidadTanda)})` : ''}
                </div>
              </div>
              <span class="badge badge-success font-bold">100% Confidencial</span>
            </div>

            <div class="nexa-grid-3 mt-2">
              <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Reactivos en la mezcla:</div>
                <strong style="font-size: 14px; color: var(--text-main);">${wiz.insumos.length} ingredientes</strong>
              </div>
              <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Costo Total Tanda:</div>
                <strong style="font-size: 14px; color: #047857;">${Formatters.currency(costoTanda)}</strong>
              </div>
              <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
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
        selU.addEventListener('change', () => { wiz.unidadTanda = selU.value; });
        const inpV = root.querySelector('#wiz-rec-vol');
        inpV.addEventListener('input', () => { wiz.volumenTanda = Number(inpV.value) || 0; });
        inpPh.addEventListener('input', () => { wiz.ph = inpPh.value; });
        const inpCif = root.querySelector('#wiz-rec-cif');
        inpCif.addEventListener('input', () => { wiz.cif = Number(inpCif.value) || 0; });
      }

      // Paso 2
      if (wiz.step === 2) {
        const tbody = root.querySelector('#wiz-tbody-ings');

        const updateSummary = () => {
          const t = calcTotals();
          const bal = root.querySelector('#wiz-sum-balance');
          if (bal) bal.innerHTML = balanceHtml(t.sumaPct);
          const u = root.querySelector('#wiz-sum-unit');
          if (u) u.textContent = Formatters.currency(t.costoPorLitro);
          const tot = root.querySelector('#wiz-sum-total');
          if (tot) tot.textContent = `Total del lote: ${Formatters.currency(t.costoTanda)}`;
        };

        // rerender=false al escribir: volver a dibujar la tabla le quitaba el foco al campo en cada tecla
        const syncRows = (rerender = true) => {
          wiz.insumos = [];
          tbody.querySelectorAll('tr').forEach(tr => {
            const selMp = tr.querySelector('.sel-mp');
            const selFase = tr.querySelector('.sel-fase');
            const inpPct = tr.querySelector('.inp-pct');
            const inpQty = tr.querySelector('.inp-qty');
            const inpMer = tr.querySelector('.inp-merma');
            if (selMp && selMp.value) {
              wiz.insumos.push({
                productoId: selMp.value,
                fase: selFase.value,
                porcentaje: inpPct.disabled ? 0 : (Number(inpPct.value) || 0),
                cantidad: Number(inpQty.value) || 0,
                mermaEsperada: Number(inpMer.value) || 0
              });
            }
          });
          if (rerender) renderStep(); else updateSummary();
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
            const b = Number(wiz.volumenTanda) || 0;
            if (b > 0 && p > 0) inpQty.value = ((b * p) / 100).toFixed(2);
            syncRows(false);
          });

          selMp.addEventListener('change', syncRows);
          selFase.addEventListener('change', syncRows);
          inpQty.addEventListener('input', () => syncRows(false));
          tr.querySelector('.inp-merma').addEventListener('input', () => syncRows(false));
        });

        const btnAdd = root.querySelector('#wiz-btn-add-ing');
        btnAdd.addEventListener('click', () => {
          wiz.insumos.push({ productoId: '', fase: 'Paso 2 (En el medio)', porcentaje: 0, cantidad: 0, mermaEsperada: 0 });
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
          const existing = (await DB.getById(STORES.RECIPES_BOM, wiz.id)) || {};
          const nombre = wiz.nombreFormula.trim() || 'Fórmula sin nombre';
          const lote = Number(wiz.cantidadProducir) || 1;
          const recData = {
            ...existing,
            id: wiz.id,
            tenantId,
            nombreFormula: nombre,
            nombreReceta: nombre,
            productoTerminadoId: wiz.productoTerminadoId,
            cantidadProducir: lote,
            rendimientoLote: lote,
            unidadMedida: 'Unidades',
            unidadMedidaLote: 'Unidades',
            volumenTanda: Number(wiz.volumenTanda) || 0,
            unidadTanda: wiz.unidadTanda,
            instruccionesFases: wiz.instruccionesFases,
            especificaciones: { ph: wiz.ph },
            costosIndirectosEstimados: Number(wiz.cif) || 0,
            insumos: wiz.insumos.map(i => ({ ...i, materiaPrimaId: i.productoId, unidadMedida: i.unidadMedida || (rawMaterials.find(m => m.id === i.productoId) || {}).unidadMedida || '' })),
            estado: existing.estado || 'ACTIVO'
          };

          if (!this._pin) { Toast.error('La bóveda se cerró. Ábrala de nuevo para guardar.'); return; }
          await DB.update(STORES.RECIPES_BOM, await this.sealRecipe(recData, this._pin));
          Toast.success(`¡Receta "${recData.nombreFormula}" guardada en Bóveda!`);
          Modal.close();

          if (goToPricing) {
            const { instruccionesFases, especificaciones, ...publica } = recData;
            sessionStorage.setItem('nexa_target_pricing_formula', JSON.stringify(publica));
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

  openChangePin(tenantId, onDone) {
    const dialog = Modal.show({
      title: 'Cambiar clave de la bóveda',
      size: 'sm',
      content: `
        <form id="vault-change-form" autocomplete="off">
          <div class="form-group mb-3"><label class="font-bold text-xs">Clave actual</label>
            <input type="password" name="cur" class="form-control" required></div>
          <div class="form-group mb-3"><label class="font-bold text-xs">Nuevo PIN (4 dígitos)</label>
            <input type="password" name="n1" class="form-control" required></div>
          <div class="form-group mb-3"><label class="font-bold text-xs">Repetir nueva clave</label>
            <input type="password" name="n2" class="form-control" required></div>
          <p class="text-xs text-muted">Todas las recetas se volverán a cifrar con la nueva clave.</p>
        </form>`,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar clave', class: 'btn-primary', onClick: async (dlg, ev) => {
            const fd = new FormData(dialog.querySelector('#vault-change-form'));
            const cur = fd.get('cur'); const n1 = fd.get('n1');
            const stored = await DB.getParam(this.pinParam(tenantId), null);
            if (!(await CryptoUtil.verifyPassword(cur, stored))) { Toast.error('La clave actual no es correcta.'); return; }
            if (!/^\d{4}$/.test(n1)) { Toast.warning('El PIN debe tener 4 dígitos numéricos.'); return; }
            if (n1 !== fd.get('n2')) { Toast.warning('Las claves no coinciden.'); return; }
            ev.target.disabled = true;
            try {
              const recipes = await DB.getAll(STORES.RECIPES_BOM, tenantId);
              const resealed = [];
              for (const r of recipes) resealed.push(r.secreto ? await this.sealRecipe(await this.openRecipe(r, cur), n1) : r);
              const hash = await CryptoUtil.hashPassword(n1);
              await DB.runTransaction([STORES.RECIPES_BOM, STORES.SYSTEM_PARAMS], async (tx) => {
                for (const r of resealed) await tx.put(STORES.RECIPES_BOM, r);
                const row = (await tx.get(STORES.SYSTEM_PARAMS, this.pinParam(tenantId))) || { id: this.pinParam(tenantId), tenantId };
                row.valor = hash;
                await tx.put(STORES.SYSTEM_PARAMS, row);
              });
              this._pin = n1;
              await AuditService.log({ modulo: 'Bóveda', accion: 'MODIFICAR', campoModificado: 'Clave de bóveda', valorNuevo: 'Cambiada' });
              Toast.success('Clave actualizada y recetas cifradas de nuevo.');
              Modal.close();
              if (onDone) onDone();
            } catch (err) {
              Toast.error(err.message);
              ev.target.disabled = false;
            }
          }
        }
      ]
    });
  }
};
