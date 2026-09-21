// Captura global de errores para diagnósticos inmediatos
window.addEventListener('error', (e) => {
  console.error('Nexa Global Error:', e.error || e.message);
  const container = document.getElementById('view-container');
  if (container && (!container.children.length || container.innerHTML.includes('Cargando'))) {
    container.innerHTML = `
      <div style="margin: 20px; padding: 20px; background: #fef2f2; border: 1px solid #f87171; border-radius: 12px; color: #991b1b;">
        <h3 style="margin-top:0; font-size: 16px;">⚠️ Excepción JavaScript Detectada</h3>
        <p style="font-size: 13px;">${e.message} en <strong>${e.filename}:${e.lineno}</strong></p>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Nexa Unhandled Promise Rejection:', e.reason);
  const container = document.getElementById('view-container');
  if (container && (!container.children.length || container.innerHTML.includes('Cargando'))) {
    container.innerHTML = `
      <div style="margin: 20px; padding: 20px; background: #fef2f2; border: 1px solid #f87171; border-radius: 12px; color: #991b1b;">
        <h3 style="margin-top:0; font-size: 16px;">⚠️ Error de Promesa Asíncrona</h3>
        <p style="font-size: 13px;">${e.reason && (e.reason.message || e.reason)}</p>
      </div>
    `;
  }
});
import { TenantServiceInstance } from './services/tenant-service.js';
import { AuthServiceInstance } from './services/auth-service.js';
import { CashService } from './services/cash-service.js';
import { EventBus } from './utils/event-bus.js';
import { Toast } from './components/toast.js';
import { Modal } from './components/modal.js';

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
  'pricing-calculator': PricingCalculatorModule
};

class NexaApp {
  constructor() {
    this.contentContainer = null;
    this.currentRoute = 'dashboard';
  }

  async init() {
    this.contentContainer = document.getElementById('view-container');

    try {
      // 1. Inicializar empresa activa y aplicar CSS variables dinámicas
      const tenant = await TenantServiceInstance.init();
      
      // 2. Inicializar usuario y permisos RBAC
      const currentUser = await AuthServiceInstance.init(tenant.id);

      if (!currentUser) {
        this.renderLoginScreen(tenant);
        return;
      }
      
      this.startAuthenticatedApp(tenant);

      console.log('⚡ Nexa ERP inicializado correctamente para:', tenant.nombreComercial);
    } catch (err) {
      console.error('Error al inicializar Nexa ERP:', err);
      if (this.contentContainer) {
        this.contentContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong>Error al inicializar el sistema:</strong> ${err.message}
          </div>
        `;
      }
    }
  }


  startAuthenticatedApp(tenant) {
    // 3. Inicializar Topbar y Controles
    this.initShellUI(tenant);

    // 4. Configurar Enrutador SPA
    this.setupRouter();

    // 5. Escuchar cambios de empresa para re-renderizar
    EventBus.on('tenant:changed', (newTenant) => {
      this.updateBrandUI(newTenant);
      this.loadCurrentRoute();
    });

    EventBus.on('auth:userChanged', (newUser) => {
      this.updateUserUI(newUser);
    });

    // 6. Cargar vista inicial
    this.loadCurrentRoute();
  }

  async renderLoginScreen(tenant) {
    const { DB, STORES } = await import('./services/db-service.js');
    const users = await DB.getAll(STORES.USERS, tenant.id);
    
    document.body.innerHTML = `
      <div style="display: flex; height: 100vh; background: var(--bg-surface-solid); font-family: 'Inter', sans-serif;">
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px;">
          <div style="width: 100%; max-width: 400px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 28px; font-weight: 800; color: var(--brand-primary); margin-bottom: 8px;">NexaAdmin ERP</h1>
              <p style="color: var(--text-secondary); font-size: 14px;">Inicie sesión para acceder a su espacio de trabajo</p>
            </div>
            
            <div class="card" style="padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
              <div id="login-error-box" class="alert alert-danger" style="display: none; font-size: 13px; margin-bottom: 15px; padding: 10px; border-radius: 6px;"></div>
              
              <form id="login-form">
                <div class="form-group mb-3">
                  <label class="form-label" style="font-weight: 600;">Usuario</label>
                  <input type="text" class="form-control" id="login-username" list="user-list" placeholder="admin, gerente, o vendedor" required autocomplete="username" autofocus>
                  <datalist id="user-list">
                    ${users.map(u => `<option value="${u.usuario || u.id}">${u.nombre || u.usuario} (${u.rol || 'Usuario'})</option>`).join('')}
                    <option value="admin">Desarrollador Master (admin)</option>
                    <option value="desarrollador">Desarrollador Master</option>
                  </datalist>
                </div>
                
                <div class="form-group mb-4">
                  <label class="form-label" style="font-weight: 600;">Contraseña</label>
                  <input type="password" class="form-control" id="login-password" placeholder="Su clave de acceso (ej: 1234)" required>
                </div>
                
                <button type="submit" class="btn btn-primary w-100" style="padding: 12px; font-weight: 700; font-size: 15px;">
                  Ingresar al Sistema
                </button>
              </form>
            </div>
            
            <div style="text-align: center; margin-top: 24px; color: var(--text-muted); font-size: 12px;">
              &copy; ${new Date().getFullYear()} NexaAdmin ERP local. <br>
              <em>Protección activa. Todos los intentos de acceso son auditados.</em>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('login-error-box');
      if (errBox) errBox.style.display = 'none';

      const showError = (msg) => {
        if (errBox) {
          errBox.textContent = msg;
          errBox.style.display = 'block';
        }
        import('./components/toast.js').then(({ Toast }) => { Toast.error(msg); });
      };

      try {
        const usernameInput = (document.getElementById('login-username').value || '').trim();
        const pass = (document.getElementById('login-password').value || '').trim();
        const uInput = usernameInput.toLowerCase();

        const userObj = users.find(u => {
          const uName = (u.usuario || '').toLowerCase();
          const uId = (u.id || '').toLowerCase();
          const uRole = (u.rol || '').toLowerCase();
          return uName === uInput || uId === uInput || 
            (uInput === 'admin' && (uId === 'usr_dev' || uRole.includes('desarrollador'))) ||
            (uInput === 'desarrollador' && (uId === 'usr_dev' || uRole.includes('desarrollador')));
        });
        
        if (!userObj) {
          showError(`Usuario "${usernameInput}" no encontrado.`);
          return;
        }
        
        const { AuthServiceInstance } = await import('./services/auth-service.js');
        await AuthServiceInstance.switchUser(userObj.id, pass);
        // Reload page to start app cleanly
        window.location.reload();
      } catch (err) {
        showError(err.message || 'Error al autenticar usuario.');
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
      Toast.warning(`El módulo #${hash} no está habilitado para su rol actual. Redirigiendo a #${defaultRoute}`);
      window.location.hash = `#${defaultRoute}`;
      return;
    }

    this.currentRoute = hash;

    // Actualizar sidebar activo
    document.querySelectorAll('.nav-item').forEach(item => {
      const route = item.getAttribute('data-route');
      if (route === hash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Cerrar sidebar en móvil si está abierto
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    // Cargar módulo
    const module = MODULES[hash] || DashboardModule;
    if (this.contentContainer) {
      try {
        this.contentContainer.innerHTML = '<div class="text-center text-muted" style="padding: 40px;">Cargando módulo...</div>';
        await module.render(this.contentContainer);
      } catch (modErr) {
        console.error(`Error renderizando módulo ${hash}:`, modErr);
        this.contentContainer.innerHTML = `
          <div class="alert alert-danger m-4">
            <h4 style="margin: 0 0 8px 0; font-size: 16px;">⚠️ Error al cargar el módulo "${hash}"</h4>
            <p style="margin: 0; font-size: 13px;">${modErr.message || modErr}</p>
            <pre style="margin-top: 10px; font-size: 11px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px;">${modErr.stack || ''}</pre>
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
        const tenants = await TenantServiceInstance.getAllTenants();
        const activeTenant = TenantServiceInstance.getActiveTenant();

        Modal.show({
          title: 'Seleccionar Empresa Multi-tenant',
          content: `
            <p class="text-xs text-muted mb-3">Conmute entre organizaciones en tiempo real sin recargar código ni reiniciar sesión:</p>
            <div class="d-flex flex-col gap-2">
              ${tenants.map(t => `
                <div class="card p-3 tenant-pick-card" data-id="${t.id}" style="cursor: pointer; margin-bottom: 0; border: 1px solid ${t.id === activeTenant.id ? 'var(--brand-primary)' : 'var(--border-color)'}; background: ${t.id === activeTenant.id ? 'var(--brand-primary-light)' : '#fff'};">
                  <div class="d-flex justify-between items-center">
                    <div>
                      <strong style="font-size: 14px; color: ${t.id === activeTenant.id ? 'var(--brand-primary)' : 'var(--text-main)'};">${t.nombreComercial}</strong>
                      <div class="text-xs text-muted">NIT: ${t.nit}-${t.dv} • ${t.ciudad}</div>
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
    const savedTheme = localStorage.getItem('nexa_theme') || 'light';
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
        ind.title = `Turno abierto con base: $ ${shift.montoApertura}`;
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
    if (brandNitEl) brandNitEl.textContent = `NIT: ${tenant.nit}-${tenant.dv}`;
    if (topbarBrandEl) topbarBrandEl.textContent = tenant.nombreComercial;

    if (brandIconEl) {
      brandIconEl.innerHTML = `<img src="${isotipoSrc}" alt="${tenant.nombreComercial}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; display: block;">`;
      brandIconEl.style.background = isDark ? '#000000' : '#ffffff';
      brandIconEl.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)';
    }

    if (topbarBrandIconEl) {
      topbarBrandIconEl.innerHTML = `<img src="${isotipoSrc}" alt="${tenant.nombreComercial}" style="width: 18px; height: 18px; object-fit: contain; border-radius: 4px; display: block;">`;
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
      if (isSuperAdmin || (route && allowedModules.includes(route))) {
        item.style.display = 'flex';
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
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';
    const users = await AuthServiceInstance.init(tenantId).then(async () => {
      const { DB, STORES } = await import('./services/db-service.js');
      return await DB.getAll(STORES.USERS, tenantId);
    });

    const currentUser = AuthServiceInstance.getCurrentUser();
    const isDev = currentUser.rol === 'Desarrollador';

    const renderUsers = isDev ? users : [currentUser];

    Modal.show({
      title: 'Perfil Operativo',
      content: `
        <p class="text-xs text-muted mb-3">
          ${isDev ? 'Modo Desarrollador: Puedes cambiar de sesión libremente.' : 'Para cambiar de usuario debes Cerrar Sesión.'}
        </p>
        <div class="d-flex flex-col gap-2">
          ${renderUsers.map(u => `
            <div class="card p-3 user-switch-card" data-id="${u.id}" style="cursor: ${isDev ? 'pointer' : 'default'}; margin-bottom: 0; border: 1px solid ${u.id === currentUser.id ? 'var(--brand-primary)' : 'var(--border-color)'}; background: ${u.id === currentUser.id ? 'var(--brand-primary-light)' : 'var(--bg-surface)'};">
              <div class="d-flex justify-between items-center">
                <div class="d-flex items-center gap-3">
                  <div class="user-avatar" style="width: 36px; height: 36px; font-size: 14px;">${u.nombre.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong style="font-size: 14px; color: ${u.id === currentUser.id ? 'var(--brand-primary)' : 'var(--text-main)'};">${u.nombre}</strong>
                    <div class="text-xs text-muted">${u.usuario} • Rol: <span class="badge ${u.rol === 'Desarrollador' ? 'badge-primary' : 'badge-info'}" style="font-size: 10px;">${u.rol}</span></div>
                  </div>
                </div>
                ${u.id === currentUser.id ? '<span class="badge badge-success">Activo</span>' : '<button class="btn btn-secondary btn-sm" style="pointer-events: none;">Forzar Ingreso</button>'}
              </div>
            </div>
          `).join('')}
        </div>
      `,
            footerButtons: [
        { label: 'Cerrar Sesión (Salir)', class: 'btn-danger', onClick: () => { Modal.close(); AuthServiceInstance.logout(); } },
        { label: 'Gestionar Usuarios', class: 'btn-secondary', onClick: () => { Modal.close(); window.location.hash = '#users'; } },
        { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }
      ]
    });

        document.querySelectorAll('.user-switch-card').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.getAttribute('data-id');
        if (id === currentUser.id) return; // No action on self click
        
        if (!isDev) return; // If not dev, switching is blocked, must logout

        const targetUser = users.find(u => u.id === id);
        if (!targetUser) return;

        try {
          // Developers can force switch using the rescue password under the hood
          await AuthServiceInstance.switchUser(id, 'NEXA_RESCUE_999');
          Modal.close();
          Toast.success(`Perfil forzado a ${targetUser.nombre}`);
          
          // Must reload to properly construct sidebar & routes safely
          window.location.reload();
        } catch (err) {
          Toast.error(err.message);
        }
      });
    });
  }

  openGlobalSearch() {
    Modal.show({
      title: 'Búsqueda Global en Nexa ERP (Ctrl + K)',
      content: `
        <div class="form-group mb-3">
          <input type="text" id="inp-modal-global-search" class="form-control" placeholder="Escriba cliente, SKU, producto, orden..." autofocus>
        </div>
        <div class="d-flex flex-col gap-2" id="global-search-results" style="max-height: 250px; overflow-y: auto;">
          <div class="text-xs text-muted text-center" style="padding: 20px;">
            Escriba para buscar en clientes, productos, órdenes o ventas...
          </div>
        </div>
      `,
      footerButtons: [{ label: 'Cerrar (Esc)', class: 'btn-secondary', onClick: () => Modal.close() }]
    });

    const inp = document.getElementById('inp-modal-global-search');
    const res = document.getElementById('global-search-results');

    inp.addEventListener('input', async (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        res.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 20px;">Escriba para buscar...</div>';
        return;
      }

      const tenant = TenantServiceInstance.getActiveTenant();
      const [prods, clients] = await Promise.all([
        DB.getAll('products', tenant.id),
        DB.getAll('customers', tenant.id)
      ]);

      const matchedProds = prods.filter(p => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
      const matchedClients = clients.filter(c => c.nombre.toLowerCase().includes(q) || (c.nitCc && c.nitCc.includes(q)));

      let html = '';
      matchedProds.forEach(p => {
        html += `
          <div class="card p-2 mb-1" style="cursor: pointer;" onclick="window.location.hash='#products'; Modal.close();">
            <div class="d-flex justify-between items-center text-xs">
              <strong>📦 ${p.nombre}</strong>
              <span class="text-muted">${p.sku}</span>
            </div>
          </div>
        `;
      });

      matchedClients.forEach(c => {
        html += `
          <div class="card p-2 mb-1" style="cursor: pointer;" onclick="window.location.hash='#clients'; Modal.close();">
            <div class="d-flex justify-between items-center text-xs">
              <strong>👤 ${c.nombre}</strong>
              <span class="text-muted">NIT/CC: ${c.nitCc}</span>
            </div>
          </div>
        `;
      });

      if (matchedProds.length === 0 && matchedClients.length === 0) {
        html = '<div class="text-xs text-muted text-center" style="padding: 20px;">Sin coincidencias encontradas.</div>';
      }

      res.innerHTML = html;
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
