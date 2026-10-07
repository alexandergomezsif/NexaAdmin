/**
 * Nexa ERP - Servicio de Autenticación y Control de Accesos (RBAC)
 * Gestiona la sesión actual, roles y permisos granulares
 */

import { DB, STORES } from './db-service.js';
import { EventBus } from '../utils/event-bus.js';
import { AuditService } from './audit-service.js';
import { CryptoUtil } from '../utils/crypto.js';
import { Session } from '../utils/session.js';

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
    'dashboard', 'sales-pos', 'clients', 'freelancers', 'shipping',
    'products', 'inventory', 'production',
    'purchases', 'cash', 'expenses', 'cxc', 'cxp',
    'reports', 'users', 'audit', 'settings',
    'backup', 'importer', 'integrations', 'documents',
    'formulas-vault', 'pricing-calculator'
  ],

  // GERENCIA: Enfoque estratégico, comercial, financiero y operativo completo.
  // NO tiene acceso a 'users', 'audit' ni 'settings' (Parámetros & Empresa: solo el Desarrollador).
  [ROLES.GERENTE]: [
    'dashboard', 'sales-pos', 'clients', 'freelancers', 'shipping',
    'products', 'inventory', 'production',
    'purchases', 'cash', 'expenses', 'cxc', 'cxp',
    'reports', 'backup', 'importer', 'integrations', 'documents',
    'formulas-vault', 'pricing-calculator'
  ],

  // ASESOR COMERCIAL / VENTAS: POS, Clientes 360, Pedidos y Despachos, Catálogo y Documentos
  [ROLES.VENDEDOR]: [
    'sales-pos', 'clients', 'freelancers', 'shipping', 'products', 'documents'
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

const SESSION_KEY = 'nexa_session';
const LEGACY_SESSION_KEY = 'nexa_active_user';
const IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000; // 8 horas sin actividad
const RECOVERY_PARAM = 'auth_recuperacion';
const LOCK_KEY = 'nexa_login_lock';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60 * 1000;


class AuthService {
  constructor() {
    this.currentUser = null;
    this.needsSetup = false;
    this._activityBound = false;
  }

  /**
   * Inicializa: migra contraseñas en texto plano a hash, detecta primer arranque
   * y restaura la sesión si sigue vigente. Ya NO crea ni borra usuarios.
   */
  async init() {
    await this.migrateUsers();
    const users = await DB.getAll(STORES.USERS);
    this.needsSetup = users.length === 0;

    localStorage.removeItem(LEGACY_SESSION_KEY);
    this.currentUser = null;
    const sess = this.readSession();
    if (sess) {
      const user = users.find(u => u.id === sess.userId);
      const vigente = Date.now() - Number(sess.lastActive || 0) < IDLE_TIMEOUT_MS;
      if (user && user.estado !== 'INACTIVO' && vigente && !user.debeCambiarClave) {
        this.currentUser = user;
        this.touch();
      } else {
        this.clearSession();
      }
    }
    Session.setUser(this.currentUser);
    this.bindActivityTracking();
    return this.currentUser;
  }

  /** Convierte claves en texto plano (versiones anteriores y respaldos antiguos) a hash PBKDF2 */
  async migrateUsers() {
    if (!(await DB.getParam('auth_pin4_v1', false))) {
      for (const u of await DB.getAll(STORES.USERS)) {
        if (u.debeCambiarClave) { u.debeCambiarClave = false; await DB.update(STORES.USERS, u); }
      }
      await DB.setParam('auth_pin4_v1', true);
    }
    const users = await DB.getAll(STORES.USERS);
    for (const u of users) {
      if (!Object.prototype.hasOwnProperty.call(u, 'clave')) continue;
      const plain = (u.clave || '').trim();
      delete u.clave;
      if (plain) {
        u.claveHash = await CryptoUtil.hashPassword(plain);

      } else if (!u.claveHash) {
        u.sinClave = true;
      }
      if (!u.estado) u.estado = 'ACTIVO';
      await DB.update(STORES.USERS, u);
    }

    // Decisión del propietario (2026-10-06): todos los usuarios existentes quedan con PIN 1234.
    // Se aplica UNA sola vez; los cambios de PIN posteriores se respetan.
    if (!(await DB.getParam('auth_pin_reset_1234_v1', false))) {
      const all = await DB.getAll(STORES.USERS);
      if (all.length) {
        const hash = await CryptoUtil.hashPassword('1234');
        for (const u of all) {
          u.claveHash = hash;
          delete u.clave;
          delete u.sinClave;
          u.debeCambiarClave = false;
          await DB.update(STORES.USERS, u);
        }
        localStorage.removeItem(LOCK_KEY);
      }
      await DB.setParam('auth_pin_reset_1234_v1', true);
    }
  }

  /** Regla simplificada (decisión del propietario): PIN de exactamente 4 dígitos numéricos */
  isStrongPassword(p) {
    return /^\d{4}$/.test(String(p || ''));
  }

  passwordRules() {
    return 'El PIN debe tener exactamente 4 dígitos numéricos.';
  }

  // ---------------------------------------------------------------- sesión
  readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  startSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, inicio: Date.now(), lastActive: Date.now() }));
    this.currentUser = user;
    Session.setUser(user);
  }

  clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  touch() {
    const s = this.readSession();
    if (s) {
      s.lastActive = Date.now();
      localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    }
  }

  bindActivityTracking() {
    if (this._activityBound || typeof document === 'undefined') return;
    this._activityBound = true;
    let last = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - last > 60000) { last = now; this.touch(); }
    };
    ['click', 'keydown'].forEach(ev => document.addEventListener(ev, onActivity, { passive: true }));
    setInterval(() => {
      const s = this.readSession();
      if (this.currentUser && s && Date.now() - Number(s.lastActive || 0) > IDLE_TIMEOUT_MS) this.logout();
    }, 5 * 60 * 1000);
  }

  // ---------------------------------------------------------------- bloqueo por intentos
  lockState() {
    try { return JSON.parse(localStorage.getItem(LOCK_KEY) || '{"fails":0,"until":0}'); } catch (e) { return { fails: 0, until: 0 }; }
  }

  registerFailure() {
    const st = this.lockState();
    st.fails = (st.fails || 0) + 1;
    if (st.fails >= MAX_ATTEMPTS) { st.until = Date.now() + LOCK_MS; st.fails = 0; }
    localStorage.setItem(LOCK_KEY, JSON.stringify(st));
  }

  // ---------------------------------------------------------------- primer arranque
  /**
   * Crea el primer usuario (Desarrollador) cuando la base de datos no tiene usuarios.
   * @returns {Promise<string>} código de recuperación (mostrar una sola vez)
   */
  async createInitialAdmin({ nombre, usuario, password, tenantId }) {
    const users = await DB.getAll(STORES.USERS);
    if (users.length > 0) throw new Error('El sistema ya tiene usuarios configurados.');
    if (!this.isStrongPassword(password)) throw new Error(this.passwordRules());
    const u = {
      id: 'usr_dev',
      tenantId,
      nombre: (nombre || 'Administrador').trim(),
      usuario: (usuario || 'admin').trim().toLowerCase(),
      claveHash: await CryptoUtil.hashPassword(password),
      rol: ROLES.DEV,
      estado: 'ACTIVO',
      permisos: Object.values(PERMISSIONS)
    };
    await DB.add(STORES.USERS, u);
    this.startSession(u);
    await AuditService.log({ modulo: 'Seguridad', accion: 'CREAR', registroId: u.id, campoModificado: 'Configuración inicial', valorNuevo: u.usuario });
    return null;
  }

  /** Usuarios que pueden iniciar sesión (para el desplegable del login) */
  async listLoginUsers() {
    const users = await DB.getAll(STORES.USERS);
    return users
      .filter(u => u.estado !== 'INACTIVO' && u.claveHash && !u.sinClave)
      .map(u => ({ usuario: u.usuario, nombre: u.nombre, rol: u.rol }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
  }

  // ---------------------------------------------------------------- login
  /**
   * @returns {Promise<{user: Object, mustChange: boolean}>}
   */
  async login(usuario, password) {
    const st = this.lockState();
    if (st.until && Date.now() < st.until) {
      const s = Math.ceil((st.until - Date.now()) / 1000);
      throw new Error(`Demasiados intentos fallidos. Espere ${s} segundos.`);
    }
    const uname = String(usuario || '').trim().toLowerCase();
    const users = await DB.getAll(STORES.USERS);
    const user = users.find(u => String(u.usuario || '').toLowerCase() === uname);
    const fail = async () => {
      this.registerFailure();
      await AuditService.log({ modulo: 'Seguridad', accion: 'LOGIN_FALLIDO', registroId: uname || '-', campoModificado: 'Intento de acceso', valorNuevo: 'Rechazado' });
      throw new Error('Usuario o contraseña incorrectos.');
    };

    if (!user || user.estado === 'INACTIVO') return fail();
    if (user.sinClave || !user.claveHash) {
      throw new Error('Este usuario no tiene contraseña asignada. Pida al administrador que le asigne una.');
    }
    const ok = await CryptoUtil.verifyPassword(String(password || ''), user.claveHash);
    if (!ok) return fail();

    localStorage.removeItem(LOCK_KEY);
    if (user.debeCambiarClave) return { user, mustChange: true };

    this.startSession(user);
    await AuditService.log({ modulo: 'Seguridad', accion: 'LOGIN', registroId: user.id, campoModificado: 'Sesión', valorNuevo: `${user.nombre} (${user.rol})` });
    EventBus.emit('auth:userChanged', user);
    return { user, mustChange: false };
  }

  /** Cambio de clave verificando la actual (usado también para el cambio obligatorio) */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await DB.getById(STORES.USERS, userId);
    if (!user) throw new Error('Usuario no encontrado.');
    if (!(await CryptoUtil.verifyPassword(String(currentPassword || ''), user.claveHash))) {
      throw new Error('La contraseña actual no es correcta.');
    }
    return this.setPassword(userId, newPassword, { startSession: true });
  }

  /** Asigna una clave nueva (administración de usuarios o recuperación) */
  async setPassword(userId, newPassword, { startSession = false } = {}) {
    if (!this.isStrongPassword(newPassword)) throw new Error(this.passwordRules());
    const user = await DB.getById(STORES.USERS, userId);
    if (!user) throw new Error('Usuario no encontrado.');
    user.claveHash = await CryptoUtil.hashPassword(newPassword);
    delete user.clave;
    delete user.sinClave;
    user.debeCambiarClave = false;
    user.fechaCambioClave = new Date().toISOString();
    await DB.update(STORES.USERS, user);
    if (startSession) this.startSession(user);
    await AuditService.log({ modulo: 'Seguridad', accion: 'MODIFICAR', registroId: user.id, campoModificado: 'Contraseña', valorNuevo: 'Actualizada' });
    return user;
  }

  // ---------------------------------------------------------------- recuperación
  async hasRecoveryCode() {
    return !!(await DB.getParam(RECOVERY_PARAM, null));
  }

  /** Genera un nuevo código de recuperación (invalida el anterior). Solo Desarrollador o primer arranque. */
  async regenerateRecoveryCode(force = false) {
    if (!force && !this.isDeveloper()) throw new Error('Solo el Desarrollador puede generar el código de recuperación.');
    const code = CryptoUtil.generateRecoveryCode();
    await DB.setParam(RECOVERY_PARAM, { hash: await CryptoUtil.hashPassword(code), fecha: new Date().toISOString() });
    return code;
  }

  /**
   * Restablece la clave de un usuario con el código de recuperación.
   * El código se consume y se devuelve uno nuevo para guardar.
   */
  async recoverWithCode(usuario, code, newPassword) {
    const st = this.lockState();
    if (st.until && Date.now() < st.until) throw new Error('Demasiados intentos fallidos. Espere un momento.');
    const rec = await DB.getParam(RECOVERY_PARAM, null);
    if (!rec || !rec.hash) throw new Error('No hay un código de recuperación configurado en este equipo.');
    const ok = await CryptoUtil.verifyPassword(CryptoUtil.normalizeRecoveryCode(code), rec.hash);
    if (!ok) {
      this.registerFailure();
      await AuditService.log({ modulo: 'Seguridad', accion: 'RECUPERACION_FALLIDA', registroId: usuario || '-', campoModificado: 'Código de recuperación', valorNuevo: 'Rechazado' });
      throw new Error('Código de recuperación incorrecto.');
    }
    const users = await DB.getAll(STORES.USERS);
    const user = users.find(u => String(u.usuario || '').toLowerCase() === String(usuario || '').trim().toLowerCase());
    if (!user) throw new Error('Usuario no encontrado.');
    await this.setPassword(user.id, newPassword);
    user.estado = 'ACTIVO';
    await DB.update(STORES.USERS, { ...(await DB.getById(STORES.USERS, user.id)), estado: 'ACTIVO' });
    const nuevo = await this.regenerateRecoveryCode(true);
    await AuditService.log({ modulo: 'Seguridad', accion: 'RECUPERACION', registroId: user.id, campoModificado: 'Contraseña restablecida con código', valorNuevo: user.usuario });
    localStorage.removeItem(LOCK_KEY);
    return nuevo;
  }

  logout() {
    if (this.currentUser) {
      AuditService.log({ modulo: 'Seguridad', accion: 'LOGOUT', registroId: this.currentUser.id, campoModificado: 'Sesión', valorNuevo: 'Cerrada' });
    }
    this.currentUser = null;
    Session.setUser(null);
    this.clearSession();
    window.location.reload();
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isDeveloper() {
    return this.currentUser?.rol === ROLES.DEV;
  }

  canManageUsers() {
    return this.isDeveloper();
  }

  canManageTenants() {
    return this.isDeveloper();
  }

  /**
   * Cambio de perfil sin contraseña: SOLO para el Desarrollador (soporte / pruebas). Queda auditado.
   */
  async switchUser(userId) {
    if (!this.isDeveloper()) throw new Error('Solo el Desarrollador puede cambiar de perfil sin cerrar sesión.');
    const user = await DB.getById(STORES.USERS, userId);
    if (!user) throw new Error('Usuario no encontrado.');
    if (user.estado === 'INACTIVO') throw new Error('El usuario está inactivo.');
    const from = this.currentUser;
    await AuditService.log({ modulo: 'Seguridad', accion: 'SUPLANTAR', registroId: user.id, campoModificado: 'Cambio de perfil', valorAnterior: from.nombre, valorNuevo: user.nombre });
    this.startSession(user);
    EventBus.emit('auth:userChanged', user);
    return user;
  }

  getAllowedModules() {
    if (!this.currentUser) return [];
    if (this.isDeveloper()) return ROLE_ALLOWED_MODULES[ROLES.DEV];
    return ROLE_ALLOWED_MODULES[this.currentUser.rol] || [];
  }

  canAccessRoute(route) {
    if (!route) return true;
    if (!this.currentUser) return false;
    if (this.isDeveloper()) return true;
    return this.getAllowedModules().includes(route);
  }

  getDefaultRoute() {
    const allowed = this.getAllowedModules();
    return allowed.length > 0 ? allowed[0] : 'dashboard';
  }

  hasPermission(permission) {
    if (!this.currentUser) return false;
    if (this.isDeveloper()) return true;
    return (this.currentUser.permisos || []).includes(permission);
  }

  canViewFinancials() {
    return this.hasPermission(PERMISSIONS.FINANCIERO);
  }
}

export const AuthServiceInstance = new AuthService();
