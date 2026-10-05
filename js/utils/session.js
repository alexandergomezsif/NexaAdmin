/**
 * Nexa ERP - Contexto de sesión en memoria
 * Fuente única del usuario y la empresa activos para servicios que no deben importar
 * auth-service (evita dependencias circulares). AuthService y TenantService lo actualizan.
 */
export const Session = {
  user: null,     // { id, nombre, rol }
  tenantId: null,

  setUser(user) {
    this.user = user ? { id: user.id, nombre: user.nombre, rol: user.rol } : null;
  },

  setTenant(tenantId) {
    this.tenantId = tenantId || null;
  },

  userId() {
    return this.user ? this.user.id : 'sistema';
  },

  userName() {
    return this.user ? this.user.nombre : 'Sistema';
  }
};
