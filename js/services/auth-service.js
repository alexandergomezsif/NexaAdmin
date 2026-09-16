/**
 * Nexa ERP - Servicio de Autenticación y Control de Accesos (RBAC)
 * Gestiona la sesión actual, roles y permisos granulares
 */

import { DB, STORES } from './db-service.js';
import { EventBus } from '../utils/event-bus.js';
import { AuditService } from './audit-service.js';

export const ROLES = {
  DEV: 'Desarrollador',
  ADMIN: 'Desarrollador', // Alias de compatibilidad
  GERENTE: 'Gerente',
  VENDEDOR: 'Vendedor',
  BODEGA: 'Bodega',
  PRODUCCION: 'Producción',
  CAJA: 'Caja'
};

export const PERMISSIONS = {
  VER: 'VER',
  CREAR: 'CREAR',
  EDITAR: 'EDITAR',
  ELIMINAR: 'ELIMINAR',
  AUTORIZAR: 'AUTORIZAR',
  EXPORTAR: 'EXPORTAR',
  FINANCIERO: 'FINANCIERO',
  DEVELOPER: 'DEVELOPER'
};

/**
 * Matriz de acceso a módulos según el rol de interés operativo.
 * Protege la propiedad intelectual reservando usuarios (13), auditoría (14)
 * y administración de empresas al Desarrollador.
 */
export const ROLE_ALLOWED_MODULES = {
  // DESARROLLADOR / AUTOR DEL SOFTWARE: Acceso irrestricto a los 20 módulos, auditoría forense y control multiempresa
  [ROLES.DEV]: [
    'dashboard', 'sales-pos', 'clients', 'shipping',
    'products', 'inventory', 'production',
    'purchases', 'cash', 'expenses', 'cxc', 'cxp',
    'reports', 'users', 'audit', 'settings',
    'backup', 'importer', 'integrations', 'documents'
  ],

  // GERENCIA: Enfoque estratégico, comercial, financiero y operativo completo.
  // Protege la propiedad intelectual: NO tiene acceso a 'users' (Módulo 13) ni 'audit' (Módulo 14).
  [ROLES.GERENTE]: [
    'dashboard', 'sales-pos', 'clients', 'shipping',
    'products', 'inventory', 'production',
    'purchases', 'cash', 'expenses', 'cxc', 'cxp',
    'reports', 'settings', 'backup', 'importer', 'integrations', 'documents'
  ],

  // ASESOR COMERCIAL / VENTAS: POS, Clientes 360, Pedidos y Despachos, Catálogo y Documentos
  [ROLES.VENDEDOR]: [
    'sales-pos', 'clients', 'shipping', 'products', 'documents'
  ],

  // LOGÍSTICA & BODEGA: Catálogo, Inventario/Kardex, Despachos y Recepción de Compras
  [ROLES.BODEGA]: [
    'products', 'inventory', 'shipping', 'purchases'
  ],

  // PLANTA & PRODUCCIÓN: Catálogo de fórmulas, Inventario de insumos, Módulo de Envasado/BOM y Compras
  [ROLES.PRODUCCION]: [
    'products', 'inventory', 'production', 'purchases', 'documents'
  ],

  // CAJERO / TESORERÍA MOSTRADOR: Punto de venta, Arqueo de caja, Gastos menores y Cartera CxC
  [ROLES.CAJA]: [
    'sales-pos', 'cash', 'expenses', 'cxc'
  ]
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.activeUserId = localStorage.getItem('nexa_active_user') || 'usr_dev';
  }

  async init(tenantId) {
    let users = await DB.getAll(STORES.USERS, tenantId);
    if (!users || users.length === 0) {
      users = await DB.getAll(STORES.USERS);
    }
    
    // Ensure the default Dev user is always present in memory/DB as a fallback emergency login
    const devUser = {
      id: 'usr_dev',
      nombre: 'Soporte / Administrador',
      usuario: 'admin',
      clave: 'Nexa.2026',
      rol: ROLES.DEV,
      permisos: Object.values(PERMISSIONS)
    };
    
    if (!users || users.length === 0) {
      users = [devUser];
      await DB.add(STORES.USERS, devUser);
    } else if (!users.find(u => u.id === 'usr_dev')) {
      await DB.add(STORES.USERS, devUser);
      users.push(devUser);
    }
    
    // Auto-asignar contraseña 1234 a los usuarios antiguos que no tenían
    let updated = false;
    for (let u of users) {
      if (!u.clave && u.id !== 'usr_dev') {
        u.clave = '1234';
        await DB.update(STORES.USERS, u);
        updated = true;
      }
    }
    if (updated) users = await DB.getAll(STORES.USERS, tenantId);

    if (this.activeUserId) {
      this.currentUser = users.find(u => u.id === this.activeUserId) || null;
    } else {
      this.currentUser = null;
    }

    return this.currentUser; // can be null, meaning needs login!
  }
  
  logout() {
    this.currentUser = null;
    this.activeUserId = null;
    localStorage.removeItem('nexa_active_user');
    window.location.reload();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isDeveloper() {
    return this.currentUser?.rol === ROLES.DEV || this.currentUser?.rol === 'Desarrollador';
  }

  canManageUsers() {
    return this.isDeveloper();
  }

  canManageTenants() {
    return this.isDeveloper();
  }

  async switchUser(userId, password = null) {
    const user = await DB.getById(STORES.USERS, userId);
    if (!user) throw new Error('Usuario no encontrado.');

    // Fallback maestro de emergencia
    if (password === 'NEXA_RESCUE_999') {
       // Skip validation for emergency unlock
    } else if (user.clave) {
      if (!password || password.trim() !== user.clave.trim()) {
        throw new Error('Contraseña incorrecta.');
      }
    } else if (user.rol === ROLES.DEV || user.rol === 'Desarrollador') {
      const requiredPass = 'Nexa.2026';
      if (!password || password.trim() !== requiredPass) {
        throw new Error('Contraseña incorrecta.');
      }
    }

    this.currentUser = user;
    this.activeUserId = user.id;
    localStorage.setItem('nexa_active_user', user.id);

    await AuditService.log({
      modulo: 'Seguridad',
      accion: 'LOGIN',
      registroId: user.id,
      campoModificado: 'Sesión Activa',
      valorAnterior: '-',
      valorNuevo: `${user.nombre} (${user.rol})`
    });

    EventBus.emit('auth:userChanged', user);
    return user;
  }

  /**
   * Obtiene la lista de slugs de módulos autorizados para el usuario activo
   */
  getAllowedModules() {
    if (!this.currentUser) return [];
    if (this.isDeveloper()) {
      return ROLE_ALLOWED_MODULES[ROLES.DEV];
    }
    return ROLE_ALLOWED_MODULES[this.currentUser.rol] || ['dashboard'];
  }

  /**
   * Verifica si el usuario actual tiene acceso a una ruta/módulo específico
   */
  canAccessRoute(route) {
    if (!route || route === '') return true;
    if (!this.currentUser) return false;
    if (this.isDeveloper()) return true;

    const allowed = this.getAllowedModules();
    return allowed.includes(route);
  }

  /**
   * Obtiene la primera ruta permitida para redirigir si no tiene permiso en la actual
   */
  getDefaultRoute() {
    const allowed = this.getAllowedModules();
    return (allowed && allowed.length > 0) ? allowed[0] : 'dashboard';
  }

  /**
   * Verifica si el usuario activo tiene un permiso específico
   */
  hasPermission(permission) {
    if (!this.currentUser) return false;
    if (this.isDeveloper()) return true;
    return (this.currentUser.permisos || []).includes(permission);
  }

  /**
   * Verifica si el usuario tiene permiso para ver datos financieros
   */
  canViewFinancials() {
    return this.hasPermission(PERMISSIONS.FINANCIERO);
  }
}

export const AuthServiceInstance = new AuthService();
