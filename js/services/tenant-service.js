/**
 * Nexa ERP - Servicio de Gestión Multiempresa y Personalización de Marca
 * Permite cambiar la identidad visual y tributaria (NIT, DV, Logo, Colores) dinámicamente
 */

import { DB, STORES } from './db-service.js';
import { SeedData, RAYO_PRO_TENANT_ID } from '../data/seed-rayopro.js';
import { DianDV } from '../utils/dian-dv.js';
import { EventBus } from '../utils/event-bus.js';

class TenantService {
  constructor() {
    this.currentTenant = null;
    this.activeTenantId = localStorage.getItem('nexa_active_tenant') || RAYO_PRO_TENANT_ID;
  }

  /**
   * Inicializa el servicio, asegura datos demo y aplica el tema visual
   */
  async init() {
    await DB.init();
    
    // Verificar si existen empresas y catálogo real en BD; si no, poblar con seed
    let tenants = await DB.getAll(STORES.TENANTS);
    let prods = await DB.getAll(STORES.PRODUCTS, RAYO_PRO_TENANT_ID);
    const hasRealDeseng = prods && prods.some(p => p.sku === 'DESENG-1L');

    if (!tenants || tenants.length === 0 || !hasRealDeseng) {
      await this.seedInitialDatabase();
      tenants = await DB.getAll(STORES.TENANTS);
    } else {
      // Sincronizar perfiles de usuario por si se agregaron nuevos roles al seed
      let existingUsers = await DB.getAll(STORES.USERS, RAYO_PRO_TENANT_ID);
      for (const u of SeedData.users) {
        const found = existingUsers.find(eu => eu.id === u.id);
        if (!found) {
          await DB.add(STORES.USERS, u);
        } else if (u.id === 'usr_dev' && (found.clave === 'dev.nexa.2026' || !found.clave)) {
          found.clave = 'Admin.2026';
          await DB.update(STORES.USERS, found);
        } else if (u.id === 'usr_juan' && found.rol !== 'Gerente') {
          found.rol = 'Gerente';
          found.nombre = 'Juan Pablo (Gerente General)';
          found.clave = 'gerente.2026';
          await DB.update(STORES.USERS, found);
        }
      }

      // Sincronizar clientes con atributos tributarios (FE e IVA)
      let existingCusts = await DB.getAll(STORES.CUSTOMERS, RAYO_PRO_TENANT_ID);
      for (const c of SeedData.customers) {
        const found = existingCusts.find(ec => ec.id === c.id);
        if (!found) {
          await DB.add(STORES.CUSTOMERS, c);
        } else if (found.facturaElectronica === undefined || found.aplicaIva === undefined) {
          found.facturaElectronica = c.facturaElectronica;
          found.aplicaIva = c.aplicaIva;
          await DB.update(STORES.CUSTOMERS, found);
        }
      }
      // Sincronizar atributos de logo multiempresa
      for (const t of tenants) {
        let changed = false;
        if (t.id === RAYO_PRO_TENANT_ID) {
          if (!t.isotipoLightUrl) { t.isotipoLightUrl = 'datos/isotipo fondo blanco.jpg'; changed = true; }
          if (!t.isotipoDarkUrl) { t.isotipoDarkUrl = 'datos/isotipo fondo negro.jpg'; changed = true; }
          if (!t.logoHorizontalLightUrl) { t.logoHorizontalLightUrl = 'datos/logo+isotipo.jpg'; changed = true; }
          if (!t.logoHorizontalDarkUrl) { t.logoHorizontalDarkUrl = 'datos/isotipo + logo fondo negro.jpg'; changed = true; }
        }
        if (changed) {
          await DB.update(STORES.TENANTS, t);
        }
      }
    }

    // Seleccionar empresa activa
    this.currentTenant = tenants.find(t => t.id === this.activeTenantId) || tenants[0];
    if (this.currentTenant) {
      this.activeTenantId = this.currentTenant.id;
      localStorage.setItem('nexa_active_tenant', this.activeTenantId);
      this.applyTheme(this.currentTenant);
    }

    return this.currentTenant;
  }

  /**
   * Carga los datos demo en IndexedDB si es la primera ejecución
   */
  async seedInitialDatabase() {
    for (const [storeKey, items] of Object.entries(SeedData)) {
      const storeName = STORES[storeKey.toUpperCase()];
      if (storeName && Array.isArray(items)) {
        await DB.bulkAdd(storeName, items);
      }
    }
  }

  /**
   * Obtiene la empresa actualmente activa
   */
  getActiveTenant() {
    return this.currentTenant;
  }

  /**
   * Lista todas las empresas configuradas
   */
  async getAllTenants() {
    return await DB.getAll(STORES.TENANTS);
  }

  /**
   * Cambia la empresa activa en tiempo de ejecución sin recargar la página
   */
  async switchTenant(tenantId) {
    const tenant = await DB.getById(STORES.TENANTS, tenantId);
    if (!tenant) throw new Error('Empresa no encontrada.');

    this.currentTenant = tenant;
    this.activeTenantId = tenant.id;
    localStorage.setItem('nexa_active_tenant', this.activeTenantId);
    this.applyTheme(tenant);

    EventBus.emit('tenant:changed', tenant);
    return tenant;
  }

  /**
   * Actualiza los datos de la empresa activa (NIT, colores, nombre, etc.)
   */
  async updateTenant(tenantData) {
    // Si viene NIT, recalcular DV automáticamente según DIAN
    if (tenantData.nit) {
      tenantData.dv = DianDV.calculate(tenantData.nit);
    }

    const updated = await DB.update(STORES.TENANTS, tenantData);
    if (updated.id === this.activeTenantId) {
      this.currentTenant = updated;
      this.applyTheme(updated);
      EventBus.emit('tenant:changed', updated);
    }
    return updated;
  }

  /**
   * Crea una nueva organización multiempresa con parámetros base
   */
  async createTenant(tenantData) {
    if (!tenantData.id) {
      tenantData.id = 'tenant_' + Date.now();
    }
    if (tenantData.nit) {
      tenantData.dv = DianDV.calculate(tenantData.nit);
    }
    const created = await DB.add(STORES.TENANTS, tenantData);

    // Listas de precios estándar para la nueva organización
    const basePriceLists = [
      { id: `plist_1_${created.id}`, tenantId: created.id, nombre: 'P1 - Precio Público / Final', descripcion: 'Mostrador y consumidor particular', esDefecto: true, orden: 1 },
      { id: `plist_2_${created.id}`, tenantId: created.id, nombre: 'P2 - Precio Lavaderos / Taller', descripcion: 'Autolavados y centros de detailing', esDefecto: false, orden: 2 },
      { id: `plist_3_${created.id}`, tenantId: created.id, nombre: 'P3 - Precio Mayorista (Docenas)', descripcion: 'Compras por cajas completas x 12 unidades', esDefecto: false, orden: 3 },
      { id: `plist_4_${created.id}`, tenantId: created.id, nombre: 'P4 - Precio Distribuidor Autorizado', descripcion: 'Almacenes y distribuidores regionales', esDefecto: false, orden: 4 },
      { id: `plist_5_${created.id}`, tenantId: created.id, nombre: 'P5 - Precio Especial Convenio', descripcion: 'Tarifa preferencial convenios', esDefecto: false, orden: 5 }
    ];
    for (const pl of basePriceLists) {
      await DB.add(STORES.PRICE_LISTS, pl);
    }

    // Bodega principal por defecto
    await DB.add(STORES.WAREHOUSES, {
      id: `wh_1_${created.id}`,
      tenantId: created.id,
      codigo: 'BOD-01',
      nombre: 'Bodega Principal & Despachos',
      direccion: created.direccion || 'Sede Principal',
      esPrincipal: true,
      estado: 'ACTIVO'
    });

    return created;
  }

  /**
   * Inyecta variables CSS en el root del documento para cambiar el tema
   */
  applyTheme(tenant) {
    if (!tenant) return;
    const root = document.documentElement;
    const colores = tenant.colores || {
      primary: '#0284c7',
      primaryHover: '#0369a1',
      secondary: '#f59e0b',
      accent: '#0284c7'
    };

    root.style.setProperty('--brand-primary', colores.primary);
    root.style.setProperty('--brand-primary-hover', colores.primaryHover || colores.primary);
    root.style.setProperty('--brand-secondary', colores.secondary);
    root.style.setProperty('--brand-accent', colores.accent || colores.primary);

    // Actualizar título de la página
    document.title = `${tenant.nombreComercial} | Nexa ERP Cloud`;

    // Actualizar elementos estáticos con data-tenant-attr si existen
    document.querySelectorAll('[data-tenant-name]').forEach(el => {
      el.textContent = tenant.nombreComercial;
    });

    document.querySelectorAll('[data-tenant-nit]').forEach(el => {
      el.textContent = `NIT: ${tenant.nit}-${tenant.dv}`;
    });
  }

  /**
   * Obtiene el isotipo cuadrado oficial o genera uno automático
   * @param {Object} tenant 
   * @param {boolean} isDark 
   * @returns {string} URL o Data URL
   */
  getIsotipo(tenant, isDark = false) {
    if (!tenant) return '';
    if (isDark) {
      if (tenant.isotipoDarkUrl) return tenant.isotipoDarkUrl;
      if (tenant.id === RAYO_PRO_TENANT_ID) return 'datos/isotipo fondo negro.jpg';
    } else {
      if (tenant.isotipoLightUrl) return tenant.isotipoLightUrl;
      if (tenant.faviconUrl) return tenant.faviconUrl;
      if (tenant.id === RAYO_PRO_TENANT_ID) return 'datos/isotipo fondo blanco.jpg';
    }
    return this.generateAutoIsotipo(tenant, isDark);
  }

  /**
   * Obtiene el logotipo horizontal completo o genera uno automático
   * @param {Object} tenant 
   * @param {boolean} isDark 
   * @returns {string} URL o Data URL
   */
  getHorizontalLogo(tenant, isDark = false) {
    if (!tenant) return '';
    if (isDark) {
      if (tenant.logoHorizontalDarkUrl) return tenant.logoHorizontalDarkUrl;
      if (tenant.id === RAYO_PRO_TENANT_ID) return 'datos/isotipo + logo fondo negro.jpg';
    } else {
      if (tenant.logoHorizontalLightUrl) return tenant.logoHorizontalLightUrl;
      if (tenant.logoUrl) return tenant.logoUrl;
      if (tenant.id === RAYO_PRO_TENANT_ID) return 'datos/logo+isotipo.jpg';
    }
    return this.generateAutoHorizontalLogo(tenant, isDark);
  }

  /**
   * Obtiene el membrete oficial para documentos o genera uno automático
   * @param {Object} tenant 
   * @returns {string} URL o Data URL
   */
  getMembrete(tenant) {
    if (!tenant) return '';
    if (tenant.membreteUrl) return tenant.membreteUrl;
    return this.generateAutoMembrete(tenant);
  }

  /**
   * Genera dinámicamente un isotipo SVG cuadrado con identidad corporativa
   */
  generateAutoIsotipo(tenant, isDark = false) {
    const name = tenant.nombreComercial || 'Nexa';
    const words = name.trim().split(/\s+/);
    const initials = words.length > 1 
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
    const primary = tenant.colores?.primary || '#0071e3';
    const secondary = tenant.colores?.secondary || '#38bdf8';
    const bg = isDark ? '#000000' : '#ffffff';
    const border = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)';
    const textColor = isDark ? '#ffffff' : primary;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="grad_${tenant.id || 'auto'}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="${bg}" stroke="${border}" stroke-width="2"/>
        <circle cx="50" cy="50" r="36" fill="url(#grad_${tenant.id || 'auto'})" opacity="${isDark ? '0.22' : '0.12'}"/>
        <text x="50" y="59" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="900" fill="${textColor}" text-anchor="middle" letter-spacing="-1">${initials}</text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Genera dinámicamente un logotipo horizontal SVG corporativo
   */
  generateAutoHorizontalLogo(tenant, isDark = false) {
    const name = tenant.nombreComercial || 'Nexa ERP';
    const razon = tenant.razonSocial || name;
    const words = name.trim().split(/\s+/);
    const initials = words.length > 1 
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
    const primary = tenant.colores?.primary || '#0071e3';
    const textColor = isDark ? '#ffffff' : '#1d1d1f';
    const subColor = isDark ? '#94a3b8' : '#64748b';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 70" width="340" height="70">
        <rect width="54" height="54" x="8" y="8" rx="14" fill="${primary}" />
        <text x="35" y="44" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="74" y="36" font-family="-apple-system, sans-serif" font-size="19" font-weight="900" fill="${textColor}" letter-spacing="-0.5">${name}</text>
        <text x="74" y="52" font-family="-apple-system, sans-serif" font-size="10" font-weight="600" fill="${subColor}" letter-spacing="0.5">${razon.substring(0, 32).toUpperCase()}</text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Genera dinámicamente un membrete SVG institucional para documentos
   */
  generateAutoMembrete(tenant) {
    const name = tenant.nombreComercial || 'Nexa ERP';
    const nit = `NIT: ${tenant.nit || ''}-${tenant.dv || ''}`;
    const contact = `${tenant.direccion || ''} • ${tenant.ciudad || ''} • Tel: ${tenant.telefono || ''}`;
    const primary = tenant.colores?.primary || '#0071e3';
    const secondary = tenant.colores?.secondary || '#f59e0b';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 110" width="800" height="110">
        <rect width="800" height="8" x="0" y="0" fill="${primary}"/>
        <rect width="180" height="8" x="620" y="0" fill="${secondary}"/>
        <text x="25" y="46" font-family="-apple-system, sans-serif" font-size="24" font-weight="900" fill="#1d1d1f">${name}</text>
        <text x="25" y="68" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#374151">${nit} • ${tenant.regimen || 'Responsable de IVA'}</text>
        <text x="25" y="88" font-family="-apple-system, sans-serif" font-size="11" font-weight="500" fill="#6b7280">${contact}</text>
        <line x1="25" y1="102" x2="775" y2="102" stroke="#e5e7eb" stroke-width="1.5"/>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
}

export const TenantServiceInstance = new TenantService();
