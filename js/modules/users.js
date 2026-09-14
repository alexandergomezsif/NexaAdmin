/**
 * Nexa ERP - Módulo 13: Usuarios y Permisos Granulares (RBAC)
 * Roles (Administrador, Gerente, Vendedor, Bodega, Producción, Caja) y cambio de sesión
 */

import { DB, STORES } from '../services/db-service.js';
import { AuthServiceInstance, ROLES, PERMISSIONS } from '../services/auth-service.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const UsersModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const users = await DB.getAll(STORES.USERS, tenantId);
    const currentUser = AuthServiceInstance.getCurrentUser();
    const isDev = AuthServiceInstance.isDeveloper();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Gestión de Usuarios & Control de Accesos (RBAC)</h1>
          <p>Administración de credenciales, roles operativos y matriz de permisos granulares</p>
        </div>
        <div class="view-actions">
          ${isDev ? `
            <button class="btn btn-primary btn-sm" id="btn-new-user">👤 Crear Usuario</button>
          ` : `
            <span class="badge badge-warning" style="font-size: 11px; padding: 6px 12px;">🔒 Edición reservada a Desarrollador</span>
          `}
        </div>
      </div>

      <!-- ALERTA DE SEGURIDAD Y PROTECCIÓN DE AUTORÍA INTELECTUAL -->
      ${!isDev ? `
        <div class="alert alert-warning mb-4" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 14px 18px;">
          <div style="font-size: 13.5px; font-weight: 800; color: #b45309; margin-bottom: 4px;">
            🛡️ Módulo Protegido — Propiedad Intelectual & Licenciamiento Nexa ERP
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
            La creación de usuarios del sistema y la alteración de roles y permisos RBAC están reservadas exclusivamente al <strong>Desarrollador / Autor del Software</strong> con contraseña maestra. El perfil <strong>Gerente (Juan Pablo)</strong> cuenta con control total de las operaciones comerciales, inventarios y finanzas, pero la matriz de usuarios está blindada para proteger la autoría intelectual del software.
          </div>
        </div>
      ` : ''}

      <div class="card mb-4" style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 14px 20px;">
        <div class="d-flex justify-between items-center flex-wrap gap-2">
          <div>
            <span class="text-xs text-muted">Sesión Activa Actual:</span>
            <div style="font-size: 15px; font-weight: 700;">
              ${currentUser.nombre} 
              <span class="badge ${isDev ? 'badge-primary' : 'badge-info'}" style="font-size: 11px;">${currentUser.rol}</span>
            </div>
          </div>
          <div class="d-flex items-center gap-2">
            <span class="text-xs font-bold text-muted">CONMUTAR PERFIL:</span>
            <select class="form-select" id="sel-switch-user" style="width: auto; font-size: 12px;">
              ${users.map(u => `
                <option value="${u.id}" ${u.id === currentUser.id ? 'selected' : ''}>${u.nombre} - ${u.rol}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <div id="users-table-container"></div>
    `;

    new DataTable({
      containerId: 'users-table-container',
      data: users,
      columns: [
        {
          key: 'nombre',
          title: 'Nombre de Usuario',
          render: (val, row) => `
            <div>
              <strong>${val}</strong>
              <div class="text-xs text-muted">@${row.usuario} • ${row.email}</div>
            </div>
          `
        },
        {
          key: 'rol',
          title: 'Rol Asignado',
          render: val => `<span class="badge ${val === 'Desarrollador' ? 'badge-primary font-bold' : 'badge-info font-bold'}">${val}</span>`
        },
        {
          key: 'permisos',
          title: 'Permisos Granulares',
          render: val => {
            const list = Array.isArray(val) ? val : [];
            return list.map(p => `<span class="badge badge-neutral" style="font-size: 10px; margin: 1px;">${p}</span>`).join(' ');
          }
        },
        {
          key: 'estado',
          title: 'Estado',
          render: val => `<span class="badge ${val === 'ACTIVO' ? 'badge-success' : 'badge-danger'}">${val}</span>`
        }
      ],
      actions: (row) => isDev ? `
        <button class="btn btn-secondary btn-sm btn-edit-user" data-id="${row.id}">✏️ Editar</button>
        <button class="btn btn-danger btn-sm btn-delete-user" data-id="${row.id}">🗑️ Eliminar</button>
      ` : `
        <span class="badge badge-neutral" style="font-size: 10px;">🔒 Protegido</span>
      `
    });

    // Conmutador de perfil con contraseña si es Desarrollador
    container.querySelector('#sel-switch-user').addEventListener('change', async (e) => {
      const targetUserId = e.target.value;
      const targetUser = users.find(u => u.id === targetUserId);
      if (!targetUser) return;

      if (targetUser.rol === 'Desarrollador' || targetUser.rol === ROLES.DEV) {
        const pass = prompt('🔐 Ingrese la contraseña de DESARROLLADOR para autenticar el perfil de autor:');
        if (!pass) {
          Toast.warning('Acceso de desarrollador cancelado.');
          this.render(container);
          return;
        }
        try {
          await AuthServiceInstance.switchUser(targetUserId, pass);
          Toast.success('Sesión cambiada a Desarrollador.');
          this.render(container);
        } catch (err) {
          Toast.error(err.message || 'Contraseña incorrecta.');
          this.render(container);
        }
        return;
      }

      await AuthServiceInstance.switchUser(targetUserId);
      Toast.success('Sesión cambiada. Permisos actualizados.');
      this.render(container);
    });

    // Nuevo usuario (solo Desarrollador)
    const btnNewUser = container.querySelector('#btn-new-user');
    if (btnNewUser) {
      btnNewUser.addEventListener('click', () => {
        if (!AuthServiceInstance.isDeveloper()) {
          Toast.error('Acción reservada al Desarrollador del software.');
          return;
        }
        this.openUserModal(null, tenantId, () => this.render(container));
      });
    }

    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-user');
      const deleteBtn = e.target.closest('.btn-delete-user');
      
      if (editBtn) {
        if (!AuthServiceInstance.isDeveloper()) {
          Toast.error('Edición reservada al Desarrollador del software.');
          return;
        }
        const id = editBtn.getAttribute('data-id');
        const user = users.find(u => u.id === id);
        this.openUserModal(user, tenantId, () => this.render(container));
      }

      if (deleteBtn) {
        if (!AuthServiceInstance.isDeveloper()) {
          Toast.error('Acción reservada al Desarrollador del software.');
          return;
        }
        const id = deleteBtn.getAttribute('data-id');
        const user = users.find(u => u.id === id);
        
        if (user.id === currentUser.id) {
          Toast.error('No puedes eliminar tu propio usuario mientras tienes la sesión iniciada.');
          return;
        }

        Modal.confirm({
          title: 'Confirmar Eliminación',
          message: `¿Estás seguro de que deseas eliminar permanentemente al usuario <strong>${user.nombre}</strong>?`,
          confirmText: 'Sí, Eliminar',
          cancelText: 'Cancelar',
          onConfirm: async () => {
            try {
              await DB.delete(STORES.USERS, id);
              Toast.success('Usuario eliminado exitosamente.');
              this.render(container);
            } catch (err) {
              Toast.error('Error al eliminar usuario: ' + err.message);
            }
          }
        });
      }
    });
  },

  openUserModal(user = null, tenantId, onSaved) {
    const isEdit = !!user;
    const allPerms = Object.values(PERMISSIONS);
    const userPerms = user ? (user.permisos || []) : ['VER', 'CREAR', 'EDITAR'];

    const content = `
      <form id="user-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-control" name="nombre" required value="${user ? user.nombre : ''}" placeholder="Ej: Valentina Restrepo">
          </div>
          <div class="form-group">
            <label class="form-label">Nombre de Usuario (Login)</label>
            <input type="text" class="form-control" name="usuario" required value="${user ? user.usuario : ''}" placeholder="Ej: valentina.ventas">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" class="form-control" name="email" required value="${user ? user.email : ''}" placeholder="usuario@rayopro.com.co">
          </div>
          <div class="form-group">
            <label class="form-label">Rol del Sistema</label>
            <select class="form-select" name="rol" id="user-role-sel">
              ${Object.values(ROLES).map(r => `
                <option value="${r}" ${user && user.rol === r ? 'selected' : ''}>${r}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Contraseña de Acceso</label>
            <input type="text" class="form-control" name="clave" value="${user ? (user.clave || '') : ''}" placeholder="Ej: Admin.2026">
          </div>
          <div class="form-group">
            <label class="form-label">Estado de la Cuenta</label>
            <select class="form-select" name="estado">
              <option value="ACTIVO" ${!user || user.estado === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
              <option value="INACTIVO" ${user && user.estado === 'INACTIVO' ? 'selected' : ''}>INACTIVO</option>
            </select>
          </div>
        </div>

        <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">🛡️ Permisos Granulares de Acceso</div>
          </div>
          <div class="card-body" style="padding: 12px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${allPerms.map(p => `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                  <input type="checkbox" name="permiso_${p}" value="${p}" ${userPerms.includes(p) ? 'checked' : ''}>
                  <span>${p === 'FINANCIERO' ? 'VER INFORMACIÓN FINANCIERA' : p}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: isEdit ? `Editar Usuario: ${user.nombre}` : 'Crear Nuevo Usuario',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: isEdit ? 'Guardar Cambios' : 'Crear Usuario',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#user-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const permisos = [];
            allPerms.forEach(p => {
              if (formData.get(`permiso_${p}`)) permisos.push(p);
            });

            const payload = {
              tenantId,
              nombre: formData.get('nombre'),
              usuario: formData.get('usuario'),
              email: formData.get('email'),
              rol: formData.get('rol'),
              clave: formData.get('clave') || (user ? user.clave : ''),
              estado: formData.get('estado') || 'ACTIVO',
              permisos
            };

            if (isEdit) {
              payload.id = user.id;
              await DB.update(STORES.USERS, payload);
              Toast.success('Usuario actualizado.');
            } else {
              await DB.add(STORES.USERS, payload);
              Toast.success('Usuario registrado.');
            }

            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  }
};
