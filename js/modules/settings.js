/**
 * Nexa ERP - Módulo 16: Centro de Configuración General & Multiempresa
 * Personalización dinámica de identidad (NIT, DV, Logo, Colores CSS), 5 listas de precios y bodegas
 */

import { DB, STORES } from '../services/db-service.js';
import { TenantServiceInstance } from '../services/tenant-service.js';
import { DianDV } from '../utils/dian-dv.js';
import { Toast } from '../components/toast.js';
import { AuthServiceInstance } from '../services/auth-service.js';
import { Modal } from '../components/modal.js';

export const SettingsModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const allTenants = await TenantServiceInstance.getAllTenants();
    const priceLists = await DB.getAll(STORES.PRICE_LISTS, tenant.id);
    const warehouses = await DB.getAll(STORES.WAREHOUSES, tenant.id);
    const isDev = AuthServiceInstance.isDeveloper();

    container.innerHTML = `
            <!-- Sub-Barra de Pestañas: Configuración & Sistema -->
      <div class="sub-nav-tabs">
        <a href="#dashboard" class="sub-nav-tab"><span>📊</span><span>Dashboard</span></a>
        <a href="#settings" class="sub-nav-tab active"><span>⚙️</span><span>Parámetros & Empresa</span></a>
        <a href="#users" class="sub-nav-tab"><span>🛡️</span><span>Usuarios & Roles</span></a>
        <a href="#backup" class="sub-nav-tab"><span>💾</span><span>Respaldo Base de Datos</span></a>
        <a href="#importer" class="sub-nav-tab"><span>📥</span><span>Importador Masivo</span></a>
        <a href="#reports" class="sub-nav-tab"><span>📈</span><span>Reportes</span></a>
      </div>

      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Configuración General & Multiempresa</h1>
          <p>Identidad visual, datos tributarios DIAN, paleta de colores corporativos y parámetros del sistema</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-save-settings">💾 Guardar Configuración</button>
        </div>
      </div>

      <!-- SWITCHER DE EMPRESA MULTITENANT ACTIVA & GESTIÓN MASTER -->
      <div class="card mb-4" style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 16px 20px;">
        <div class="d-flex justify-between items-center flex-wrap gap-3">
          <div>
            <div class="text-xs font-bold text-muted">EMPRESA ACTIVA ACTUAL:</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--brand-primary); margin-top: 2px;">
              ${tenant.nombreComercial} (NIT: ${tenant.nit}-${tenant.dv})
            </div>
          </div>
          <div class="d-flex items-center gap-2 flex-wrap">
            <label class="text-xs font-bold text-muted">CONMUTAR EMPRESA:</label>
            <select class="form-select" id="sel-switch-tenant" style="width: auto; font-size: 13px; font-weight: 600;">
              ${allTenants.map(t => `
                <option value="${t.id}" ${t.id === tenant.id ? 'selected' : ''}>
                  ${t.nombreComercial} (${t.ciudad})
                </option>
              `).join('')}
            </select>
            ${isDev ? `
              <button type="button" class="btn btn-secondary btn-sm" id="btn-create-tenant" title="Crear nueva organización">
                🏢 + Nueva Empresa
              </button>
            ` : `
              <span class="badge badge-warning text-xs" title="Creación de empresas restringida al Desarrollador">
                🔒 Multiempresa Protegida
              </span>
            `}
          </div>
        </div>
      </div>

      <form id="settings-form">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          
          <!-- COLUMNA IZQUIERDA: DATOS CORPORATIVOS Y TRIBUTARIOS -->
          <div class="d-flex flex-col gap-4">
            
            <!-- DATOS GENERALES Y DIAN -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Datos Empresariales & Tributarios (Colombia)</div>
              </div>
              <div class="card-body">
                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Nombre Comercial de la Empresa</label>
                    <input type="text" class="form-control" name="nombreComercial" required value="${tenant.nombreComercial}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Razón Social Legal</label>
                    <input type="text" class="form-control" name="razonSocial" required value="${tenant.razonSocial}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">NIT (Sin dígito de verificación)</label>
                    <input type="text" class="form-control" id="inp-tenant-nit" name="nit" required value="${tenant.nit}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Dígito de Verificación (DV DIAN)</label>
                    <input type="text" class="form-control" id="inp-tenant-dv" name="dv" readonly value="${tenant.dv}" style="background: #f1f5f9; font-weight: bold;">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Régimen Tributario</label>
                    <select class="form-select" name="regimen">
                      <option value="Responsable de IVA" ${tenant.regimen === 'Responsable de IVA' ? 'selected' : ''}>Responsable de IVA (Común)</option>
                      <option value="No Responsable de IVA" ${tenant.regimen === 'No Responsable de IVA' ? 'selected' : ''}>No Responsable de IVA (Simplificado)</option>
                      <option value="Régimen Simple de Tributación (RST)" ${tenant.regimen === 'Régimen Simple de Tributación (RST)' ? 'selected' : ''}>Régimen Simple de Tributación (RST)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Moneda Principal</label>
                    <input type="text" class="form-control" readonly value="COP (Peso Colombiano)" style="background: #f1f5f9;">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Dirección Fiscal / Sede Principal</label>
                    <input type="text" class="form-control" name="direccion" value="${tenant.direccion || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ciudad</label>
                    <input type="text" class="form-control" name="ciudad" value="${tenant.ciudad || ''}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Departamento</label>
                    <input type="text" class="form-control" name="departamento" value="${tenant.departamento || 'Antioquia'}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Teléfono Fijo / PBX</label>
                    <input type="text" class="form-control" name="telefono" value="${tenant.telefono || ''}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">WhatsApp Comercial</label>
                    <input type="text" class="form-control" name="whatsapp" value="${tenant.whatsapp || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Correo Electrónico Oficial</label>
                    <input type="email" class="form-control" name="email" value="${tenant.email || ''}">
                  </div>
                </div>

                <div class="form-group mb-0">
                  <label class="form-label">Texto de Resolución de Facturación (Pie de Documento)</label>
                  <input type="text" class="form-control" name="resolucionFacturacion" value="${tenant.resolucionFacturacion || ''}">
                </div>
              </div>
            </div>

            <!-- IDENTIDAD VISUAL, LOGOS & MEMBRETE MULTIEMPRESA -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">🖼️ Identidad Visual, Logos & Membretes Oficiales</div>
              </div>
              <div class="card-body">
                <p class="text-xs text-muted mb-3">
                  Adjunte los logos y membretes para personalizar la aplicación y los documentos impresos. Si no adjunta ningún archivo, el sistema generará automáticamente un isotipo o membrete vectorial con las iniciales y colores de su empresa.
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
                  
                  <!-- 1. ISOTIPO CUADRADO (MODO CLARO) -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Isotipo (Modo Claro)</strong>
                      <span class="badge ${tenant.isotipoLightUrl ? 'badge-info' : 'badge-neutral'}" id="badge-status-isotipo-light">
                        ${tenant.isotipoLightUrl ? 'Personalizado' : '✨ Automático'}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Esquina superior izq. en Modo Claro</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 60px; height: 60px; border-radius: 12px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-xs);">
                        <img id="prev-isotipo-light" src="${TenantServiceInstance.getIsotipo(tenant, false)}" alt="Isotipo Claro" style="width: 100%; height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-isotipo-light" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-isotipo-light">📎 Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-isotipo-light">✨ Automático</button>
                      </div>
                    </div>
                  </div>

                  <!-- 2. ISOTIPO CUADRADO (MODO OSCURO) -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Isotipo (Modo Oscuro)</strong>
                      <span class="badge ${tenant.isotipoDarkUrl ? 'badge-info' : 'badge-neutral'}" id="badge-status-isotipo-dark">
                        ${tenant.isotipoDarkUrl ? 'Personalizado' : '✨ Automático'}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Esquina superior izq. en Modo Oscuro</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 60px; height: 60px; border-radius: 12px; background: #000000; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-xs);">
                        <img id="prev-isotipo-dark" src="${TenantServiceInstance.getIsotipo(tenant, true)}" alt="Isotipo Oscuro" style="width: 100%; height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-isotipo-dark" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-isotipo-dark">📎 Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-isotipo-dark">✨ Automático</button>
                      </div>
                    </div>
                  </div>

                  <!-- 3. LOGO HORIZONTAL COMPLETO -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Logotipo Horizontal</strong>
                      <span class="badge ${tenant.logoHorizontalLightUrl ? 'badge-info' : 'badge-neutral'}" id="badge-status-logo-horizontal">
                        ${tenant.logoHorizontalLightUrl ? 'Personalizado' : '✨ Automático'}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Facturas, Cotizaciones y Rótulos</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 110px; height: 60px; border-radius: 8px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 4px;">
                        <img id="prev-logo-horizontal" src="${TenantServiceInstance.getHorizontalLogo(tenant, false)}" alt="Logo Horizontal" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-logo-horizontal" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-logo-horizontal">📎 Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-logo-horizontal">✨ Automático</button>
                      </div>
                    </div>
                  </div>

                  <!-- 4. MEMBRETE / ENCABEZADO DE DOCUMENTO -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Membrete de Documentos</strong>
                      <span class="badge ${tenant.membreteUrl ? 'badge-info' : 'badge-neutral'}" id="badge-status-membrete">
                        ${tenant.membreteUrl ? 'Personalizado' : '✨ Automático'}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Banner superior oficial (opcional)</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 110px; height: 60px; border-radius: 8px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 2px;">
                        <img id="prev-membrete" src="${tenant.membreteUrl || TenantServiceInstance.generateAutoMembrete(tenant)}" alt="Membrete" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-membrete" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-membrete">📎 Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-membrete">✨ Automático</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- NOMBRES CONFIGURABLES DE LAS 5 LISTAS DE PRECIOS -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Personalización de las 5 Listas de Precios</div>
              </div>
              <div class="card-body">
                <p class="text-xs text-muted mb-3">Personalice el nombre comercial de cada una de las 5 listas de precios del sistema según el modelo de negocio.</p>
                <div class="d-flex flex-col gap-2">
                  ${priceLists.map((pl, idx) => `
                    <div class="form-row" style="align-items: center;">
                      <div style="font-weight: 700; font-size: 12px; color: var(--brand-primary); width: 80px;">Lista ${idx + 1}:</div>
                      <input type="text" class="form-control" name="plist_name_${pl.id}" value="${pl.nombre}" required style="flex: 1;">
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

          </div>

          <!-- COLUMNA DERECHA: IDENTIDAD VISUAL Y COLORES DINÁMICOS -->
          <div class="d-flex flex-col gap-4">
            
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Paleta de Colores Corporativos</div>
              </div>
              <div class="card-body">
                <p class="text-xs text-muted mb-3">El cambio de colores se aplica inmediatamente a toda la aplicación en tiempo real sin recargar.</p>

                <div class="form-group mb-3">
                  <label class="form-label">Color Principal / Primario</label>
                  <div class="d-flex items-center gap-2">
                    <input type="color" class="form-control" id="inp-color-primary" name="colorPrimary" value="${tenant.colores?.primary || '#0284c7'}" style="width: 50px; height: 38px; padding: 2px;">
                    <input type="text" class="form-control text-xs font-bold" id="inp-color-primary-text" value="${tenant.colores?.primary || '#0284c7'}" readonly>
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Color Secundario / Acento</label>
                  <div class="d-flex items-center gap-2">
                    <input type="color" class="form-control" id="inp-color-secondary" name="colorSecondary" value="${tenant.colores?.secondary || '#f59e0b'}" style="width: 50px; height: 38px; padding: 2px;">
                    <input type="text" class="form-control text-xs font-bold" id="inp-color-secondary-text" value="${tenant.colores?.secondary || '#f59e0b'}" readonly>
                  </div>
                </div>

                <div class="card p-3" style="background: var(--bg-app); border: 1px solid var(--border-color); text-align: center;">
                  <div class="text-xs font-bold text-muted mb-2">VISTA PREVIA DEL BOTÓN:</div>
                  <button type="button" class="btn btn-primary btn-sm mb-2" style="margin: 0 auto;">Botón de Muestra</button>
                  <div class="text-xs text-muted">Se adapta al color primario seleccionado</div>
                </div>
              </div>
            </div>

            <!-- BODEGAS REGISTRADAS -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Bodegas Configuradas</div>
              </div>
              <div class="card-body" style="padding: 10px 14px;">
                <div class="d-flex flex-col gap-2">
                  ${warehouses.map(w => `
                    <div class="d-flex justify-between items-center text-xs" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                      <div>
                        <strong>${w.nombre}</strong>
                        <div class="text-muted">${w.codigo}</div>
                      </div>
                      <span class="badge ${w.esPrincipal ? 'badge-info' : 'badge-neutral'}">${w.esPrincipal ? 'Principal' : 'Secundaria'}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

          </div>

        </div>
      </form>
    `;

    // Conmutador de empresa multi-tenant
    container.querySelector('#sel-switch-tenant').addEventListener('change', async (e) => {
      await TenantServiceInstance.switchTenant(e.target.value);
      Toast.success('Empresa conmutada con éxito. Tema e identidad actualizados.');
      this.render(container);
    });

    // Crear nueva empresa (Exclusivo Desarrollador)
    const btnCreateTenant = container.querySelector('#btn-create-tenant');
    if (btnCreateTenant) {
      btnCreateTenant.addEventListener('click', () => {
        if (!AuthServiceInstance.isDeveloper()) {
          Toast.error('La creación de empresas está reservada al Desarrollador del software.');
          return;
        }
        this.openCreateTenantModal(() => this.render(container));
      });
    }

    // Cálculo automático reactivo de DV al cambiar NIT
    const nitInput = container.querySelector('#inp-tenant-nit');
    const dvInput = container.querySelector('#inp-tenant-dv');
    nitInput.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/\D/g, '');
      const dv = DianDV.calculate(clean);
      dvInput.value = dv !== null ? dv : '-';
    });

    // Color pickers dinámicos en vivo
    const colPrim = container.querySelector('#inp-color-primary');
    const colPrimTxt = container.querySelector('#inp-color-primary-text');
    colPrim.addEventListener('input', (e) => {
      colPrimTxt.value = e.target.value;
      document.documentElement.style.setProperty('--brand-primary', e.target.value);
    });

    const colSec = container.querySelector('#inp-color-secondary');
    const colSecTxt = container.querySelector('#inp-color-secondary-text');
    colSec.addEventListener('input', (e) => {
      colSecTxt.value = e.target.value;
      document.documentElement.style.setProperty('--brand-secondary', e.target.value);
    });

    // Controladores de carga de logos y generadores automáticos
    const setupImageUploader = (fileInpId, btnUploadId, btnAutoId, prevImgId, badgeId, fieldName, autoGenFn) => {
      const fileInp = container.querySelector(fileInpId);
      const btnUpload = container.querySelector(btnUploadId);
      const btnAuto = container.querySelector(btnAutoId);
      const prevImg = container.querySelector(prevImgId);
      const badge = container.querySelector(badgeId);

      if (!fileInp || !btnUpload || !btnAuto || !prevImg || !badge) return;

      btnUpload.addEventListener('click', () => fileInp.click());

      fileInp.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          Toast.error('Por favor seleccione un archivo de imagen válido (PNG, JPG, SVG, WEBP).');
          return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target.result;
          tenant[fieldName] = dataUrl;
          if (fieldName === 'logoHorizontalLightUrl') {
            tenant.logoUrl = dataUrl;
          }
          prevImg.src = dataUrl;
          badge.className = 'badge badge-info';
          badge.textContent = 'Personalizado';

          await TenantServiceInstance.updateTenant(tenant);
          Toast.success('Imagen adjuntada y aplicada exitosamente.');
        };
        reader.readAsDataURL(file);
      });

      btnAuto.addEventListener('click', async () => {
        tenant[fieldName] = '';
        if (fieldName === 'logoHorizontalLightUrl') {
          tenant.logoUrl = '';
        }
        prevImg.src = autoGenFn();
        badge.className = 'badge badge-neutral';
        badge.textContent = '✨ Automático';

        await TenantServiceInstance.updateTenant(tenant);
        Toast.info('Se activó el diseño automático con identidad corporativa.');
      });
    };

    // 1. Isotipo Claro
    setupImageUploader(
      '#file-isotipo-light', '#btn-upload-isotipo-light', '#btn-auto-isotipo-light',
      '#prev-isotipo-light', '#badge-status-isotipo-light',
      'isotipoLightUrl',
      () => TenantServiceInstance.generateAutoIsotipo(tenant, false)
    );

    // 2. Isotipo Oscuro
    setupImageUploader(
      '#file-isotipo-dark', '#btn-upload-isotipo-dark', '#btn-auto-isotipo-dark',
      '#prev-isotipo-dark', '#badge-status-isotipo-dark',
      'isotipoDarkUrl',
      () => TenantServiceInstance.generateAutoIsotipo(tenant, true)
    );

    // 3. Logo Horizontal
    setupImageUploader(
      '#file-logo-horizontal', '#btn-upload-logo-horizontal', '#btn-auto-logo-horizontal',
      '#prev-logo-horizontal', '#badge-status-logo-horizontal',
      'logoHorizontalLightUrl',
      () => TenantServiceInstance.generateAutoHorizontalLogo(tenant, false)
    );

    // 4. Membrete Documentos
    setupImageUploader(
      '#file-membrete', '#btn-upload-membrete', '#btn-auto-membrete',
      '#prev-membrete', '#badge-status-membrete',
      'membreteUrl',
      () => TenantServiceInstance.generateAutoMembrete(tenant)
    );

    // Guardar configuración
    container.querySelector('#btn-save-settings').addEventListener('click', async () => {
      const form = container.querySelector('#settings-form');
      const formData = new FormData(form);

      const cleanNit = formData.get('nit').replace(/\D/g, '');
      const dv = DianDV.calculate(cleanNit);

      const updatedTenant = {
        ...tenant,
        nombreComercial: formData.get('nombreComercial'),
        razonSocial: formData.get('razonSocial'),
        nit: cleanNit,
        dv: dv !== null ? dv : 0,
        regimen: formData.get('regimen'),
        direccion: formData.get('direccion'),
        ciudad: formData.get('ciudad'),
        departamento: formData.get('departamento'),
        telefono: formData.get('telefono'),
        whatsapp: formData.get('whatsapp'),
        email: formData.get('email'),
        resolucionFacturacion: formData.get('resolucionFacturacion'),
        colores: {
          primary: formData.get('colorPrimary'),
          primaryHover: formData.get('colorPrimary'),
          secondary: formData.get('colorSecondary'),
          accent: formData.get('colorPrimary')
        },
        isotipoLightUrl: tenant.isotipoLightUrl || '',
        isotipoDarkUrl: tenant.isotipoDarkUrl || '',
        logoHorizontalLightUrl: tenant.logoHorizontalLightUrl || '',
        logoHorizontalDarkUrl: tenant.logoHorizontalDarkUrl || '',
        membreteUrl: tenant.membreteUrl || '',
        logoUrl: tenant.logoHorizontalLightUrl || tenant.logoUrl || ''
      };

      await TenantServiceInstance.updateTenant(updatedTenant);

      // Guardar nombres de las 5 listas de precios
      for (const pl of priceLists) {
        const newName = formData.get(`plist_name_${pl.id}`);
        if (newName && newName !== pl.nombre) {
          pl.nombre = newName;
          await DB.update(STORES.PRICE_LISTS, pl);
        }
      }

      Toast.success('Configuración empresarial y listas de precios guardadas exitosamente.');
      this.render(container);
    });
  },

  openCreateTenantModal(onSaved) {
    const content = `
      <form id="new-tenant-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Nombre Comercial</label>
            <input type="text" class="form-control" name="nombreComercial" required placeholder="Ej: Nova Brillo SAS">
          </div>
          <div class="form-group">
            <label class="form-label">Razón Social</label>
            <input type="text" class="form-control" name="razonSocial" required placeholder="Ej: Nova Brillo Colombia S.A.S.">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">NIT (Sin DV)</label>
            <input type="text" class="form-control" id="modal-tenant-nit" name="nit" required placeholder="Ej: 901889977">
          </div>
          <div class="form-group">
            <label class="form-label">DV Calculado</label>
            <input type="text" class="form-control" id="modal-tenant-dv" name="dv" readonly value="-" style="background: #f1f5f9; font-weight: bold;">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Ciudad Principal</label>
            <input type="text" class="form-control" name="ciudad" required value="Medellín" placeholder="Ej: Medellín">
          </div>
          <div class="form-group">
            <label class="form-label">Departamento</label>
            <input type="text" class="form-control" name="departamento" required value="Antioquia" placeholder="Ej: Antioquia">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Dirección Comercial</label>
            <input type="text" class="form-control" name="direccion" required placeholder="Ej: Calle 10 # 43A - 15">
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono / Celular</label>
            <input type="text" class="form-control" name="telefono" required placeholder="Ej: (604) 444 1234">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Color Primario de Marca</label>
          <div class="d-flex items-center gap-2">
            <input type="color" class="form-control" name="colorPrimary" value="#0071e3" style="width: 50px; height: 38px; padding: 2px;">
            <span class="text-xs text-muted">Se aplicará a los botones, encabezados e interfaces de la nueva empresa</span>
          </div>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: '🏢 Crear Nueva Organización Multiempresa',
      content,
      size: 'md',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Crear Organización',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#new-tenant-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const cleanNit = formData.get('nit').replace(/\D/g, '');
            const dv = DianDV.calculate(cleanNit);
            const colorPrim = formData.get('colorPrimary') || '#0071e3';

            const newTenant = {
              nombreComercial: formData.get('nombreComercial'),
              razonSocial: formData.get('razonSocial'),
              nit: cleanNit,
              dv: dv !== null ? dv : 0,
              regimen: 'Responsable de IVA',
              direccion: formData.get('direccion'),
              ciudad: formData.get('ciudad'),
              departamento: formData.get('departamento'),
              telefono: formData.get('telefono'),
              whatsapp: formData.get('telefono'),
              email: `contacto@${formData.get('nombreComercial').toLowerCase().replace(/\s+/g, '')}.com`,
              colores: {
                primary: colorPrim,
                primaryHover: colorPrim,
                secondary: '#f59e0b',
                accent: colorPrim
              },
              resolucionFacturacion: 'Resolución DIAN No. Pendiente por asignar',
              moneda: 'COP',
              esDemo: false
            };

            const created = await TenantServiceInstance.createTenant(newTenant);
            await TenantServiceInstance.switchTenant(created.id);
            Toast.success(`¡Empresa "${created.nombreComercial}" creada con éxito! Se ha activado la nueva organización.`);
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });

    if (dialog) {
      const nitInp = dialog.querySelector('#modal-tenant-nit');
      const dvInp = dialog.querySelector('#modal-tenant-dv');
      if (nitInp && dvInp) {
        nitInp.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/\D/g, '');
          const dv = DianDV.calculate(clean);
          dvInp.value = dv !== null ? dv : '-';
        });
      }
    }
  }
};
