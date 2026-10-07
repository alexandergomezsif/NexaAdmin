import { TenantServiceInstance } from './services/tenant-service.js';
import { AuthServiceInstance } from './services/auth-service.js';
import { CashService } from './services/cash-service.js';
import { EventBus } from './utils/event-bus.js';
import { Toast } from './components/toast.js';
import { Modal } from './components/modal.js';
import { ROLES } from './services/auth-service.js';
import { DB, STORES } from './services/db-service.js';
import { esc } from './utils/formatters.js';
import { BackupFolderService } from './services/backup-folder-service.js';

// Módulos
import { DashboardModule } from './modules/dashboard.js';
import { ClientsModule } from './modules/clients.js';
import { ProductsModule } from './modules/products.js';
import { InventoryModule } from './modules/inventory.js';
import { ProductionModule } from './modules/production.js';
import { PurchasesModule } from './modules/purchases.js';
import { SalesPosModule } from './modules/sales-pos.js';
import { ShippingModule } from './modules/shipping.js';
import { CashModule } from './modules/cash.js';
import { ExpensesModule } from './modules/expenses.js';
import { CxcModule } from './modules/cxc.js';
import { CxpModule } from './modules/cxp.js';
import { UsersModule } from './modules/users.js';
import { AuditModule } from './modules/audit.js';
import { ReportsModule } from './modules/reports.js';
import { SettingsModule } from './modules/settings.js';
import { BackupModule } from './modules/backup.js';
import { ImporterModule } from './modules/importer.js';
import { IntegrationsModule } from './modules/integrations.js';
import { DocumentsModule } from './modules/documents.js';
import { FormulasVaultModule } from './modules/formulas-vault.js';
import { PricingCalculatorModule } from './modules/pricing-calculator.js';
import { FreelancersModule } from './modules/freelancers.js';

// Captura global de errores: siempre visible (antes solo se mostraba con la vista vacía)
function showFatal(title, detail) {
  if (typeof window.__nexaBootMessage === 'function') window.__nexaBootMessage(title, detail, true);
}
window.addEventListener('error', (e) => {
  console.error('Nexa Global Error:', e.error || e.message);
  if (!window.__nexaReady) showFatal('Error al iniciar NexaAdmin', `${e.message || 'Error desconocido'} (${e.filename || ''}:${e.lineno || ''})`);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Nexa Unhandled Promise Rejection:', e.reason);
  const msg = (e.reason && (e.reason.message || String(e.reason))) || 'Error desconocido';
  if (!window.__nexaReady) showFatal('Error al iniciar NexaAdmin', msg);
  else Toast.error(msg);
});

const MODULES = {
  dashboard: DashboardModule,
  clients: ClientsModule,
  products: ProductsModule,
  inventory: InventoryModule,
  production: ProductionModule,
  purchases: PurchasesModule,
  'sales-pos': SalesPosModule,
  shipping: ShippingModule,
  cash: CashModule,
  expenses: ExpensesModule,
  cxc: CxcModule,
  cxp: CxpModule,
  users: UsersModule,
  audit: AuditModule,
  reports: ReportsModule,
  settings: SettingsModule,
  backup: BackupModule,
  importer: ImporterModule,
  integrations: IntegrationsModule,
  documents: DocumentsModule,
  'formulas-vault': FormulasVaultModule,
  'pricing-calculator': PricingCalculatorModule,
  'freelancers': FreelancersModule
};

export const MACRO_CATEGORIES = {
  commercial: {
    sidebarRoute: 'sales-pos',
    routes: ['sales-pos', 'shipping'],
    tabs: [
      { route: 'sales-pos', label: 'Terminal POS', icon: '🛒' },
      { route: 'shipping', label: 'Pedidos & Envíos', icon: '🚚' }
    ]
  },
  inventory: {
    sidebarRoute: 'inventory',
    routes: ['inventory', 'products', 'production', 'formulas-vault', 'pricing-calculator'],
    tabs: [
      { route: 'products', label: 'Catálogo', icon: '📦' },
      { route: 'inventory', label: 'Inventario & Kardex', icon: '📑' },
      { route: 'production', label: 'Producción & BOM', icon: '⚙️' },
      { route: 'formulas-vault', label: 'Bóveda Fórmulas', icon: '🔒' },
      { route: 'pricing-calculator', label: 'Precios & Márgenes', icon: '🏷️' }
    ]
  },
  finance: {
    sidebarRoute: 'cash',
    routes: ['cash', 'purchases', 'expenses', 'cxc', 'cxp'],
    tabs: [
      { route: 'cash', label: 'Caja & Turnos', icon: '💵' },
      { route: 'purchases', label: 'Compras & Proveedores', icon: '🛍️' },
      { route: 'expenses', label: 'Gastos Operativos', icon: '🏷️' },
      { route: 'cxc', label: 'Cartera CXC', icon: '📈' },
      { route: 'cxp', label: 'Cuentas por Pagar CXP', icon: '📉' }
    ]
  },
  clients: {
    sidebarRoute: 'clients',
    routes: ['clients', 'freelancers'],
    tabs: [
      { route: 'clients', label: 'Directorio Clientes', icon: '👥' },
      { route: 'freelancers', label: 'Red Freelance', icon: '🤝' }
    ]
  },
  settings: {
    sidebarRoute: 'settings',
    routes: ['dashboard', 'settings', 'users', 'backup', 'importer', 'reports', 'audit', 'integrations', 'documents'],
    tabs: [
      { route: 'dashboard', label: 'Dashboard', icon: '📊' },
      { route: 'settings', label: 'Parámetros & Empresa', icon: '⚙️' },
      { route: 'users', label: 'Usuarios & Roles', icon: '🛡️' },
      { route: 'backup', label: 'Respaldo BD', icon: '💾' },
      { route: 'importer', label: 'Importador Masivo', icon: '📥' },
      { route: 'reports', label: 'Reportes', icon: '📈' },
      { route: 'audit', label: 'Auditoría', icon: '📋' }
    ]
  }
};

class NexaApp {
  constructor() {
    this.contentContainer = null;
    this.currentRoute = 'dashboard';
  }

  async init() {
    this.contentContainer = document.getElementById('view-container');

    const step = (t) => { window.__nexaLastStep = t; const el = document.getElementById('boot-status'); if (el) el.textContent = t; console.info('[NexaAdmin] ' + t); };
    window.__nexaStep = step;
    try {
      step('Abriendo base de datos…');
      await DB.init();
      step('Aplicando migraciones y cargando empresa…');
      // 1. Base de datos, migraciones y empresa activa
      const tenant = await TenantServiceInstance.init();
      step('Verificando usuarios…');

      // 2. Autenticación (sin usuarios ni claves por defecto)
      const currentUser = await AuthServiceInstance.init();

      window.__nexaReady = true;
      if (window.__nexaBootDone) window.__nexaBootDone();
      if (AuthServiceInstance.needsSetup) {
        this.renderAuthScreen('setup', tenant);
        return;
      }
      if (!currentUser) {
        this.renderAuthScreen('login', tenant);
        return;
      }

      this.startAuthenticatedApp(tenant);
      window.__nexaReady = true;
      if (window.__nexaBootDone) window.__nexaBootDone();
      console.log('⚡ Nexa ERP inicializado correctamente para:', tenant.nombreComercial);
    } catch (err) {
      console.error('Error al inicializar Nexa ERP:', err);
      showFatal('Error al iniciar NexaAdmin', err.message || String(err));
      if (this.contentContainer) {
        this.contentContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong>Error al inicializar el sistema:</strong> ${esc(err.message)}
          </div>
        `;
      }
    }
  }

  startAuthenticatedApp(tenant) {
    this.initShellUI(tenant);
    this.setupRouter();

    EventBus.on('tenant:changed', (newTenant) => {
      this.updateBrandUI(newTenant);
      this.updateCashIndicator();
      this.loadCurrentRoute();
    });

    EventBus.on('auth:userChanged', (newUser) => {
      this.updateUserUI(newUser);
    });

    EventBus.on('backup:status', () => this.updateBackupIndicator());
    const backupBadge = document.getElementById('topbar-backup-badge');
    if (backupBadge) {
      backupBadge.addEventListener('click', async () => {
        if (BackupFolderService.state === 'needs-permission') {
          if ((await BackupFolderService.checkPermission(true)) === 'granted') {
            const ok = await BackupFolderService.backupNow();
            if (ok) Toast.success('Respaldo automático activo.');
          } else {
            Toast.warning('Sin permiso no se puede guardar el respaldo en la carpeta.');
          }
          return;
        }
        window.location.hash = '#backup';
      });
    }
    BackupFolderService.start().catch(e => console.warn('[Respaldo] no se pudo iniciar:', e));

    this.loadCurrentRoute();
  }

  updateBackupIndicator() {
    const el = document.getElementById('topbar-backup-badge');
    if (!el) return;
    const s = BackupFolderService;
    const hhmm = s.lastOk ? new Date(s.lastOk).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
    const map = {
      ok: ['badge-success', `● Respaldo ${hhmm}`, `Copia automática en la carpeta "${s.folderName()}". Última: ${s.lastOk ? new Date(s.lastOk).toLocaleString('es-CO') : '-'}`],
      'needs-permission': ['badge-warning', '⚠ Activar respaldo', 'Haga clic para permitir que NexaAdmin guarde en la carpeta de respaldo.'],
      'no-folder': ['badge-warning', '⚠ Sin respaldo', 'Configure una carpeta de respaldo automático.'],
      unsupported: ['badge-neutral', 'Respaldo diario', 'Este navegador no permite carpetas: se descarga un respaldo diario a Descargas.'],
      error: ['badge-danger', '✕ Respaldo falló', s.lastError || 'Error en el respaldo'],
      disabled: ['badge-neutral', 'Respaldo apagado', 'El respaldo automático está desactivado.']
    };
    const [cls, txt, title] = map[s.state] || map.disabled;
    el.className = `badge ${cls} backup-badge`;
    el.textContent = txt;
    el.title = title;
  }

  /**
   * Pantallas de acceso: 'setup' (primer arranque), 'login', 'change' (cambio obligatorio),
   * 'recover' (código de recuperación) y 'code' (mostrar código de recuperación nuevo).
   */
  async renderAuthScreen(mode, tenant, ctx = {}) {
    const loginUsers = mode === 'login' ? await AuthServiceInstance.listLoginUsers() : [];
    const hasRecovery = mode === 'login' ? await AuthServiceInstance.hasRecoveryCode() : false;
    const initialTheme = localStorage.getItem('nexa_theme') || 'dark';
    document.body.classList.toggle('dark-mode', initialTheme === 'dark');
    const rules = AuthServiceInstance.passwordRules();

    const forms = {
      setup: `
        <h2 class="auth-title">Configuración inicial</h2>
        <p class="auth-sub">No hay usuarios en este equipo. Cree la cuenta de administrador (rol Desarrollador).</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Nombre</label>
            <input class="form-control" name="nombre" required placeholder="Ej: Alexander Gómez"></div>
          <div class="form-group mb-3"><label class="form-label">Usuario</label>
            <input class="form-control" name="usuario" required value="admin" autocomplete="username"></div>
          <div class="form-group mb-3"><label class="form-label">PIN de 4 dígitos</label>
            <input type="password" class="form-control pin-input" name="pass1" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="••••">
            <div class="form-help">${esc(rules)}</div></div>
          <div class="form-group mb-4"><label class="form-label">Repetir PIN</label>
            <input type="password" class="form-control pin-input" name="pass2" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="••••"></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Crear administrador</button>
        </form>`,
      login: `
        <h2 class="auth-title">Iniciar sesión</h2>
        <p class="auth-sub">Seleccione su usuario e ingrese su PIN.</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Usuario</label>
            <select class="form-select" name="usuario" required>
              ${loginUsers.length > 1 ? '<option value="">— Seleccione —</option>' : ''}
              ${loginUsers.map(u => `<option value="${esc(u.usuario)}">${esc(u.nombre)} · ${esc(u.rol)}</option>`).join('')}
            </select></div>
          <div class="form-group mb-4"><label class="form-label">PIN</label>
            <input type="password" class="form-control pin-input" name="password" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="••••" autofocus></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Ingresar</button>
        </form>
        ${hasRecovery ? '<div class="text-center mt-3"><a href="#" id="link-recover" class="text-xs">¿Olvidó su PIN? Usar código de recuperación</a></div>' : '<div class="text-center mt-3 text-xs text-muted">¿Olvidó su PIN? El administrador puede asignarle uno nuevo en Usuarios.</div>'}`,
      change: `
        <h2 class="auth-title">Defina su PIN</h2>
        <p class="auth-sub">Hola <strong>${esc(ctx.user ? ctx.user.nombre : '')}</strong>. El administrador pidió que defina un PIN nuevo para continuar.</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="pass1" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="••••" autofocus>
            <div class="form-help">${esc(rules)}</div></div>
          <div class="form-group mb-4"><label class="form-label">Repetir PIN</label>
            <input type="password" class="form-control pin-input" name="pass2" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="••••"></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Guardar y continuar</button>
        </form>`,
      recover: `
        <h2 class="auth-title">Recuperar acceso</h2>
        <p class="auth-sub">Use el código de recuperación que se mostró al configurar el sistema. Después de usarlo se genera uno nuevo.</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Usuario a recuperar</label>
            <input class="form-control" name="usuario" required></div>
          <div class="form-group mb-3"><label class="form-label">Código de recuperación</label>
            <input class="form-control" name="code" required placeholder="XXXX-XXXX-XXXX-XXXX" style="font-family: monospace; letter-spacing: 1px;"></div>
          <div class="form-group mb-3"><label class="form-label">Nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="pass1" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="••••">
            <div class="form-help">${esc(rules)}</div></div>
          <div class="form-group mb-4"><label class="form-label">Repetir PIN</label>
            <input type="password" class="form-control pin-input" name="pass2" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="••••"></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Restablecer PIN</button>
        </form>
        <div class="text-center mt-3"><a href="#" id="link-back-login" class="text-xs">Volver al inicio de sesión</a></div>`,
      code: `
        <h2 class="auth-title">Guarde su código de recuperación</h2>
        <p class="auth-sub">Es la ÚNICA forma de recuperar el acceso si olvida su contraseña. Se muestra una sola vez: anótelo en papel y guárdelo en un lugar seguro (no en este computador).</p>
        <div class="recovery-code" id="recovery-code">${esc(ctx.code || '')}</div>
        <button type="button" class="btn btn-secondary w-100 mb-2" id="btn-copy-code">Copiar código</button>
        <label class="d-flex items-center gap-2 text-xs mb-3"><input type="checkbox" id="chk-code-saved"> Ya anoté el código en un lugar seguro</label>
        <button type="button" class="btn btn-primary w-100 auth-btn" id="btn-code-continue" disabled>Continuar</button>`
    };

    document.body.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-box">
          <div class="text-center mb-4">
            <h1 class="auth-brand">NexaAdmin ERP</h1>
            <div class="text-xs text-muted">${esc(tenant ? tenant.nombreComercial : '')}</div>
          </div>
          <div class="card auth-card">
            <div id="auth-error" class="alert alert-danger" style="display: none; font-size: 13px; margin-bottom: 15px;"></div>
            ${forms[mode]}
          </div>
          <div class="text-center mt-4 text-xs text-muted">
            &copy; ${new Date().getFullYear()} NexaAdmin ERP · Los intentos de acceso quedan registrados en la auditoría.
          </div>
        </div>
      </div>
    `;

    const errBox = document.getElementById('auth-error');
    const showError = (msg) => { errBox.textContent = msg; errBox.style.display = 'block'; };
    const form = document.getElementById('auth-form');
    const submitBtn = form ? form.querySelector('button[type=submit]') : null;
    const busy = (on) => { if (submitBtn) submitBtn.disabled = on; };

    const recoverLink = document.getElementById('link-recover');
    if (recoverLink) recoverLink.addEventListener('click', (e) => { e.preventDefault(); this.renderAuthScreen('recover', tenant); });
    const backLink = document.getElementById('link-back-login');
    if (backLink) backLink.addEventListener('click', (e) => { e.preventDefault(); this.renderAuthScreen('login', tenant); });

    if (mode === 'code') {
      const chk = document.getElementById('chk-code-saved');
      const btn = document.getElementById('btn-code-continue');
      chk.addEventListener('change', () => { btn.disabled = !chk.checked; });
      document.getElementById('btn-copy-code').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(ctx.code); Toast.success('Código copiado.'); } catch (e) { Toast.warning('No se pudo copiar; anótelo manualmente.'); }
      });
      btn.addEventListener('click', () => window.location.reload());
      return;
    }

    form.querySelectorAll('.pin-input').forEach(inp => inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 4);
      if (mode === 'login' && inp.value.length === 4 && form.querySelector('[name=usuario]').value) form.requestSubmit();
    }));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.style.display = 'none';
      const fd = new FormData(form);
      const pass1 = fd.get('pass1');
      if (pass1 !== null && pass1 !== fd.get('pass2')) {
        showError('Los PIN no coinciden.');
        return;
      }
      busy(true);
      try {
        if (mode === 'setup') {
          await AuthServiceInstance.createInitialAdmin({
            nombre: fd.get('nombre'), usuario: fd.get('usuario'), password: pass1, tenantId: tenant ? tenant.id : null
          });
          window.location.reload();
        } else if (mode === 'login') {
          const res = await AuthServiceInstance.login(fd.get('usuario'), fd.get('password'));
          if (res.mustChange) {
            await this.renderAuthScreen('change', tenant, { user: res.user, currentPassword: fd.get('password') });
          } else {
            window.location.reload();
          }
        } else if (mode === 'change') {
          await AuthServiceInstance.changePassword(ctx.user.id, ctx.currentPassword, pass1);
          window.location.reload();
        } else if (mode === 'recover') {
          const code = await AuthServiceInstance.recoverWithCode(fd.get('usuario'), fd.get('code'), pass1);
          this.renderAuthScreen('code', tenant, { code });
        }
      } catch (err) {
        showError(err.message || 'No fue posible completar la operación.');
        busy(false);
        form.querySelectorAll('.pin-input').forEach(i => { i.value = ''; });
        const first = form.querySelector('.pin-input');
        if (first) first.focus();
      }
    });
  }

  setupRouter() {
    window.addEventListener('hashchange', () => {
      this.loadCurrentRoute();
    });

    // Delegación de clic global para enlaces con hash (#) en sidebar y cuerpo
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetHash = href.replace('#', '') || 'dashboard';
          if (window.location.hash === `#${targetHash}`) {
            // Si ya está en la misma ruta, forzar recarga
            this.loadCurrentRoute();
          } else {
            window.location.hash = `#${targetHash}`;
          }
        }
      }
    });

    // Atajo global Ctrl + K para búsqueda o acciones rápidas
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openGlobalSearch();
      }
    });
  }

  async loadCurrentRoute() {
    let hash = window.location.hash.replace('#', '') || 'dashboard';

    // Verificación de Control de Accesos Anti-Saturación (RBAC)
    if (!AuthServiceInstance.canAccessRoute(hash)) {
      const defaultRoute = AuthServiceInstance.getDefaultRoute();
      if (MODULES[hash]) Toast.warning(`El módulo "${hash}" no está habilitado para su rol.`);
      window.location.hash = `#${defaultRoute}`;
      return;
    }

    this.currentRoute = hash;

    // Identificar a qué macro-categoría pertenece la ruta actual
    let activeMacroKey = null;
    for (const [key, macro] of Object.entries(MACRO_CATEGORIES)) {
      if (macro.routes.includes(hash)) {
        activeMacroKey = key;
        break;
      }
    }

    const currentMacro = activeMacroKey ? MACRO_CATEGORIES[activeMacroKey] : null;
    const targetSidebarRoute = currentMacro ? currentMacro.sidebarRoute : hash;

    // Actualizar sidebar activo (mantener iluminada la macro-sección)
    document.querySelectorAll('.nav-item').forEach(item => {
      const route = item.getAttribute('data-route');
      if (route === targetSidebarRoute || route === hash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Renderizar la Barra Fija de Submódulos Permanente
    const subnavBar = document.getElementById('macro-subnav-bar');
    if (subnavBar) {
      if (currentMacro && currentMacro.tabs && currentMacro.tabs.length > 0) {
        subnavBar.style.display = 'block';
        subnavBar.innerHTML = `
          <div class="sub-nav-tabs" style="margin-bottom: 0;">
            ${currentMacro.tabs.filter(tab => AuthServiceInstance.canAccessRoute(tab.route)).map(tab => `
              <a href="#${tab.route}" class="sub-nav-tab ${tab.route === hash ? 'active' : ''}">
                <span>${tab.icon}</span>
                <span>${tab.label}</span>
              </a>
            `).join('')}
          </div>
        `;
      } else {
        subnavBar.style.display = 'none';
        subnavBar.innerHTML = '';
      }
    }

    // Cerrar sidebar en móvil si está abierto
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    // Cargar módulo
    const module = MODULES[hash] || DashboardModule;
    if (this.contentContainer) {
      // Contenedor limpio en cada cambio de ruta: elimina listeners del módulo anterior
      const fresh = this.contentContainer.cloneNode(false);
      this.contentContainer.replaceWith(fresh);
      this.contentContainer = fresh;
      try {
        this.contentContainer.innerHTML = '<div class="text-center text-muted" style="padding: 40px;">Cargando módulo...</div>';
        await module.render(this.contentContainer);
      } catch (modErr) {
        console.error(`Error renderizando módulo ${hash}:`, modErr);
        this.contentContainer.innerHTML = `
          <div class="alert alert-danger m-4">
            <h4 style="margin: 0 0 8px 0; font-size: 16px;">⚠️ Error al cargar el módulo "${hash}"</h4>
            <p style="margin: 0; font-size: 13px;">${esc(modErr.message || modErr)}</p>
            <pre style="margin-top: 10px; font-size: 11px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px; white-space: pre-wrap;">${esc(modErr.stack || '')}</pre>
          </div>
        `;
      }
    }
  }

  initShellUI(tenant) {
    this.updateBrandUI(tenant);
    this.initTheme();

    const currentUser = AuthServiceInstance.getCurrentUser();
    this.updateUserUI(currentUser);

    // Toggle de sidebar móvil
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggleBtn && sidebar && overlay) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });

      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }

    // Selector rápido de empresa en Topbar
    const tenantSelector = document.getElementById('topbar-tenant-selector');
    if (tenantSelector) {
      tenantSelector.addEventListener('click', async () => {
        if (!AuthServiceInstance.canManageTenants()) {
          Toast.info('El cambio de empresa está reservado al rol Desarrollador.');
          return;
        }
        const tenants = await TenantServiceInstance.getAllTenants();
        const activeTenant = TenantServiceInstance.getActiveTenant();

        Modal.show({
          title: 'Seleccionar Empresa Multi-tenant',
          content: `
            <p class="text-xs text-muted mb-3">Conmute entre organizaciones en tiempo real sin recargar código ni reiniciar sesión:</p>
            <div class="d-flex flex-col gap-2">
              ${tenants.map(t => `
                <div class="card p-3 tenant-pick-card" data-id="${esc(t.id)}" style="cursor: pointer; margin-bottom: 0; border: 1px solid ${t.id === activeTenant.id ? 'var(--brand-primary)' : 'var(--border-color)'};">
                  <div class="d-flex justify-between items-center">
                    <div>
                      <strong style="font-size: 14px; color: ${t.id === activeTenant.id ? 'var(--brand-primary)' : 'var(--text-main)'};">${esc(t.nombreComercial)}</strong>
                      <div class="text-xs text-muted">NIT: ${esc(t.nit)}-${esc(t.dv)} • ${esc(t.ciudad)}</div>
                    </div>
                    ${t.id === activeTenant.id ? '<span class="badge badge-success">Activa</span>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `,
          footerButtons: [
            { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }
          ]
        });

        document.querySelectorAll('.tenant-pick-card').forEach(card => {
          card.addEventListener('click', async () => {
            const id = card.getAttribute('data-id');
            await TenantServiceInstance.switchTenant(id);
            Modal.close();
            Toast.success('Empresa cambiada exitosamente.');
          });
        });
      });
    }

    // Botón de Venta Rápida POS en Topbar
    const quickSaleBtn = document.getElementById('btn-topbar-quick-sale');
    if (quickSaleBtn) {
      quickSaleBtn.addEventListener('click', () => {
        window.location.hash = '#sales-pos';
      });
    }

    // Buscador global en Topbar
    const globalSearchInput = document.getElementById('topbar-global-search');
    if (globalSearchInput) {
      globalSearchInput.addEventListener('click', () => {
        this.openGlobalSearch();
      });
    }

    // Conmutador Rápido de Usuario / Rol en Topbar
    const userMenuBtn = document.getElementById('topbar-user-menu-btn');
    if (userMenuBtn) {
      userMenuBtn.addEventListener('click', () => {
        this.openUserRoleModal();
      });
    }

    // Botón de Modo Oscuro / Claro en Topbar
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Estado del turno de caja en Topbar
    this.updateCashIndicator();
    EventBus.on('cash:shiftChanged', () => this.updateCashIndicator());
  }

  initTheme() {
    const savedTheme = localStorage.getItem('nexa_theme') || 'dark';
    const icon = document.getElementById('theme-toggle-icon');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      if (icon) icon.textContent = '☀️';
    } else {
      document.body.classList.remove('dark-mode');
      if (icon) icon.textContent = '🌙';
    }
    this.updateBrandUI(TenantServiceInstance.getActiveTenant());
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('theme-toggle-icon');
    if (isDark) {
      localStorage.setItem('nexa_theme', 'dark');
      if (icon) icon.textContent = '☀️';
      Toast.info('Modo Oscuro activado');
    } else {
      localStorage.setItem('nexa_theme', 'light');
      if (icon) icon.textContent = '🌙';
      Toast.info('Modo Claro activado');
    }
    // Conmutar inmediatamente el isotipo al fondo correspondiente (blanco u oscuro)
    this.updateBrandUI(TenantServiceInstance.getActiveTenant());
  }

  async updateCashIndicator() {
    const tenant = TenantServiceInstance.getActiveTenant();
    if (!tenant) return;
    const shift = await CashService.getCurrentShift(tenant.id);
    const ind = document.getElementById('topbar-cash-badge');
    if (ind) {
      if (shift) {
        ind.className = 'badge badge-success';
        ind.textContent = '● Caja Abierta';
        ind.title = `Turno abierto por ${esc(shift.usuarioNombre || '-')}`;
      } else {
        ind.className = 'badge badge-warning';
        ind.textContent = '○ Caja Cerrada';
        ind.title = 'Sin turno de caja activo';
      }
    }
  }

  updateBrandUI(tenant) {
    if (!tenant) return;
    const isDark = document.body.classList.contains('dark-mode');
    const isotipoSrc = TenantServiceInstance.getIsotipo(tenant, isDark);

    const brandNameEl = document.getElementById('sidebar-brand-name');
    const brandNitEl = document.getElementById('sidebar-brand-nit');
    const topbarBrandEl = document.getElementById('topbar-brand-name');
    const brandIconEl = document.getElementById('sidebar-brand-icon');
    const topbarBrandIconEl = document.getElementById('topbar-brand-icon');

    if (brandNameEl) brandNameEl.textContent = tenant.nombreComercial;
    if (brandNitEl) brandNitEl.textContent = `NIT: ${esc(tenant.nit)}-${tenant.dv}`;
    if (topbarBrandEl) topbarBrandEl.textContent = tenant.nombreComercial;

    if (brandIconEl) {
      brandIconEl.innerHTML = `<img src="${esc(isotipoSrc)}" alt="${esc(tenant.nombreComercial)}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; display: block;">`;
      brandIconEl.style.background = isDark ? '#000000' : '#ffffff';
      brandIconEl.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)';
    }

    if (topbarBrandIconEl) {
      topbarBrandIconEl.innerHTML = `<img src="${esc(isotipoSrc)}" alt="${esc(tenant.nombreComercial)}" style="width: 18px; height: 18px; object-fit: contain; border-radius: 4px; display: block;">`;
    }
  }

  updateUserUI(user) {
    if (!user) return;
    const nameEl = document.getElementById('topbar-user-name');
    const roleEl = document.getElementById('topbar-user-role');
    const avatarEl = document.getElementById('topbar-user-avatar');

    if (nameEl) nameEl.textContent = user.nombre;
    if (roleEl) roleEl.textContent = `${user.rol} ▾`;
    if (avatarEl) avatarEl.textContent = user.nombre.charAt(0).toUpperCase();

    // Anti-Saturación: Filtrar menú lateral dinámicamente según rol
    this.filterSidebarForUser();
  }

  filterSidebarForUser() {
    const allowedModules = AuthServiceInstance.getAllowedModules();
    const isSuperAdmin = AuthServiceInstance.isDeveloper();

    // 1. Mostrar/Ocultar cada nav-item según permisos
    document.querySelectorAll('.nav-item').forEach(item => {
      const route = item.getAttribute('data-route');
      const macro = Object.values(MACRO_CATEGORIES).find(m => m.sidebarRoute === route);
      const candidates = macro ? [route, ...macro.tabs.map(t => t.route)] : [route];
      const firstAllowed = candidates.find(r => isSuperAdmin || allowedModules.includes(r));
      if (firstAllowed) {
        item.style.display = 'flex';
        item.setAttribute('href', `#${firstAllowed}`);
      } else {
        item.style.display = 'none';
      }
    });

    // 2. Ocultar secciones vacías cuyos hijos estén todos ocultos
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;

    let currentSectionTitle = null;
    let sectionHasVisibleItems = false;

    Array.from(nav.children).forEach(el => {
      if (el.classList.contains('nav-section-title')) {
        if (currentSectionTitle && !sectionHasVisibleItems) {
          currentSectionTitle.style.display = 'none';
        }
        currentSectionTitle = el;
        sectionHasVisibleItems = false;
        el.style.display = ''; // reset
      } else if (el.classList.contains('nav-item')) {
        if (el.style.display !== 'none') {
          sectionHasVisibleItems = true;
        }
      }
    });

    // Evaluar la última sección
    if (currentSectionTitle && !sectionHasVisibleItems) {
      currentSectionTitle.style.display = 'none';
    }
  }

  async openUserRoleModal() {
    const currentUser = AuthServiceInstance.getCurrentUser();
    const isDev = AuthServiceInstance.isDeveloper();
    const users = isDev ? (await DB.getAll(STORES.USERS)).filter(u => u.estado !== 'INACTIVO') : [currentUser];

    const dialog = Modal.show({
      title: 'Perfil de usuario',
      content: `
        <p class="text-xs text-muted mb-3">
          ${isDev ? 'Modo Desarrollador: puede cambiar a otro perfil para soporte o pruebas (queda registrado en auditoría).' : 'Para cambiar de usuario cierre la sesión.'}
        </p>
        <div class="d-flex flex-col gap-2">
          ${users.map(u => `
            <div class="card p-3 user-switch-card" data-id="${esc(u.id)}" style="cursor: ${isDev && u.id !== currentUser.id ? 'pointer' : 'default'}; margin-bottom: 0; border: 1px solid ${u.id === currentUser.id ? 'var(--brand-primary)' : 'var(--border-color)'};">
              <div class="d-flex justify-between items-center">
                <div class="d-flex items-center gap-3">
                  <div class="user-avatar" style="width: 36px; height: 36px; font-size: 14px;">${esc((u.nombre || '?').charAt(0).toUpperCase())}</div>
                  <div>
                    <strong style="font-size: 14px;">${esc(u.nombre)}</strong>
                    <div class="text-xs text-muted">${esc(u.usuario)} • ${esc(u.rol)}</div>
                  </div>
                </div>
                ${u.id === currentUser.id ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-neutral">Cambiar</span>'}
              </div>
            </div>
          `).join('')}
        </div>
      `,
      footerButtons: [
        { label: 'Cerrar sesión', class: 'btn-danger', onClick: () => { Modal.close(); AuthServiceInstance.logout(); } },
        { label: 'Cambiar mi PIN', class: 'btn-secondary', onClick: () => this.openChangeOwnPasswordModal() },
        { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }
      ]
    });

    if (!isDev) return;
    dialog.querySelectorAll('.user-switch-card').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.getAttribute('data-id');
        if (id === currentUser.id) return;
        try {
          const u = await AuthServiceInstance.switchUser(id);
          Modal.close();
          Toast.success(`Perfil cambiado a ${u.nombre}`);
          window.location.hash = '#' + AuthServiceInstance.getDefaultRoute();
          window.location.reload();
        } catch (err) {
          Toast.error(err.message);
        }
      });
    });
  }

  openChangeOwnPasswordModal() {
    const user = AuthServiceInstance.getCurrentUser();
    const dialog = Modal.show({
      title: 'Cambiar mi PIN',
      size: 'sm',
      content: `
        <form id="own-pass-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">PIN actual</label>
            <input type="password" class="form-control pin-input" name="cur" required autocomplete="off"></div>
          <div class="form-group mb-3"><label class="form-label">Nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="p1" required inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="off">
            <div class="form-help">${esc(AuthServiceInstance.passwordRules())}</div></div>
          <div class="form-group mb-3"><label class="form-label">Repetir nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="p2" required inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="off"></div>
        </form>`,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Guardar', class: 'btn-primary', onClick: async () => {
            const fd = new FormData(dialog.querySelector('#own-pass-form'));
            if (fd.get('p1') !== fd.get('p2')) { Toast.warning('Los PIN no coinciden.'); return; }
            try {
              await AuthServiceInstance.changePassword(user.id, fd.get('cur'), fd.get('p1'));
              Modal.close();
              Toast.success('PIN actualizado.');
            } catch (err) {
              Toast.error(err.message);
            }
          }
        }
      ]
    });
  }

  openGlobalSearch() {
    const dialog = Modal.show({
      title: 'Búsqueda global (Ctrl + K)',
      content: `
        <div class="form-group mb-3">
          <input type="text" id="inp-modal-global-search" class="form-control" placeholder="Cliente, NIT, SKU, producto o número de venta..." autofocus>
        </div>
        <div class="d-flex flex-col gap-2" id="global-search-results" style="max-height: 300px; overflow-y: auto;">
          <div class="text-xs text-muted text-center" style="padding: 20px;">Escriba al menos 2 caracteres.</div>
        </div>
      `,
      footerButtons: [{ label: 'Cerrar (Esc)', class: 'btn-secondary', onClick: () => Modal.close() }]
    });

    const inp = dialog.querySelector('#inp-modal-global-search');
    const res = dialog.querySelector('#global-search-results');
    setTimeout(() => inp.focus(), 50);
    const allowed = (r) => AuthServiceInstance.canAccessRoute(r);

    let timer = null;
    inp.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const q = inp.value.toLowerCase().trim();
        if (q.length < 2) {
          res.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 20px;">Escriba al menos 2 caracteres.</div>';
          return;
        }
        const tenant = TenantServiceInstance.getActiveTenant();
        const [prods, clients, sales] = await Promise.all([
          allowed('products') ? DB.getAll(STORES.PRODUCTS, tenant.id) : [],
          allowed('clients') ? DB.getAll(STORES.CUSTOMERS, tenant.id) : [],
          allowed('sales-pos') ? DB.getAll(STORES.SALES, tenant.id) : []
        ]);
        const has = (v) => String(v || '').toLowerCase().includes(q);
        const results = [
          ...prods.filter(p => has(p.nombre) || has(p.sku)).slice(0, 8).map(p => ({ route: 'products', icon: '📦', title: p.nombre, sub: p.sku })),
          ...clients.filter(c => has(c.nombre) || has(c.nitCc)).slice(0, 8).map(c => ({ route: 'clients', icon: '👤', title: c.nombre, sub: `NIT/CC: ${c.nitCc || '-'}` })),
          ...sales.filter(s => has(s.consecutivo) || has(s.clienteNombre)).slice(0, 8).map(s => ({ route: 'sales-pos', icon: '🧾', title: s.consecutivo, sub: `${s.clienteNombre || ''} · ${s.estado || ''}` }))
        ];
        res.innerHTML = results.length ? results.map(r => `
          <div class="card p-2 mb-1 global-search-hit" data-route="${esc(r.route)}" style="cursor: pointer;">
            <div class="d-flex justify-between items-center text-xs">
              <strong>${r.icon} ${esc(r.title)}</strong>
              <span class="text-muted">${esc(r.sub)}</span>
            </div>
          </div>`).join('') : '<div class="text-xs text-muted text-center" style="padding: 20px;">Sin coincidencias.</div>';
        res.querySelectorAll('.global-search-hit').forEach(el => el.addEventListener('click', () => {
          Modal.close();
          window.location.hash = '#' + el.getAttribute('data-route');
        }));
      }, 200);
    });
  }
}

// Arrancar aplicación al cargar el DOM o inmediatamente si ya está listo
function startApp() {
  const app = new NexaApp();
  app.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
