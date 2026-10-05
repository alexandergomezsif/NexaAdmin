/**
 * Nexa ERP - Módulo 13: Usuarios y Permisos (RBAC)
 * - Solo el rol Desarrollador crea, edita, desactiva o elimina usuarios.
 * - Las contraseñas se guardan con hash PBKDF2; nunca se muestran.
 * - Código de recuperación de acceso (se muestra una sola vez al generarlo).
 */

import { DB, STORES } from '../services/db-service.js';
import { AuthServiceInstance, ROLES, PERMISSIONS } from '../services/auth-service.js';
import { CryptoUtil } from '../utils/crypto.js';
import { AuditService } from '../services/audit-service.js';
import { esc } from '../utils/formatters.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

const ROLE_LIST = [ROLES.DEV, ROLES.GERENTE, ROLES.VENDEDOR, ROLES.BODEGA, ROLES.PRODUCCION, ROLES.CAJA];

const DEFAULT_PERMS = {
  [ROLES.DEV]: Object.values(PERMISSIONS),
  [ROLES.GERENTE]: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'AUTORIZAR', 'EXPORTAR', 'FINANCIERO'],
  [ROLES.VENDEDOR]: ['VER', 'CREAR'],
  [ROLES.BODEGA]: ['VER', 'CREAR', 'EDITAR'],
  [ROLES.PRODUCCION]: ['VER', 'CREAR', 'EDITAR'],
  [ROLES.CAJA]: ['VER', 'CREAR']
};

export const UsersModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant.id;
    const allUsers = await DB.getAll(STORES.USERS);
    // Usuarios de esta empresa + desarrolladores (globales)
    const users = allUsers.filter(u => u.tenantId === tenantId || u.rol === ROLES.DEV);
    const currentUser = AuthServiceInstance.getCurrentUser();
    const isDev = AuthServiceInstance.isDeveloper();
    const hasRecovery = await AuthServiceInstance.hasRecoveryCode();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Usuarios y Control de Accesos</h1>
          <p>Cuentas, roles y permisos. Las contraseñas se almacenan cifradas (hash) y nunca se muestran.</p>
        </div>
        <div class="view-actions">
          ${isDev ? `
            <button class="btn btn-secondary btn-sm" id="btn-recovery-code">🔑 ${hasRecovery ? 'Regenerar' : 'Generar'} código de recuperación</button>
            <button class="btn btn-primary btn-sm" id="btn-new-user">👤 Crear usuario</button>
          ` : '<span class="badge badge-warning" style="font-size: 11px; padding: 6px 12px;">🔒 Edición reservada al rol Desarrollador</span>'}
        </div>
      </div>

      ${isDev && !hasRecovery ? `<div class="alert alert-warning mb-3 text-xs">⚠️ No hay código de recuperación configurado. Si olvida su contraseña no podrá recuperar el acceso. Genérelo y guárdelo en papel.</div>` : ''}

      <div class="card mb-3" style="padding: 12px 18px;">
        <span class="text-xs text-muted">Sesión activa:</span>
        <strong>${esc(currentUser.nombre)}</strong> <span class="badge badge-info">${esc(currentUser.rol)}</span>
      </div>

      <div id="users-table-container"></div>
    `;

    new DataTable({
      containerId: 'users-table-container',
      data: users,
      columns: [
        { key: 'nombre', title: 'Usuario', render: (val, row) => `<div><strong>${esc(val)}</strong><div class="text-xs text-muted">@${esc(row.usuario)}${row.email ? ' • ' + esc(row.email) : ''}</div></div>` },
        { key: 'rol', title: 'Rol', render: val => `<span class="badge ${val === ROLES.DEV ? 'badge-primary' : 'badge-info'} font-bold">${esc(val)}</span>` },
        { key: 'permisos', title: 'Permisos', render: val => (Array.isArray(val) ? val : []).map(p => `<span class="badge badge-neutral" style="font-size: 10px; margin: 1px;">${esc(p)}</span>`).join(' ') },
        {
          key: 'estado', title: 'Estado', render: (val, row) => `
            <span class="badge ${val === 'INACTIVO' ? 'badge-danger' : 'badge-success'}">${esc(val || 'ACTIVO')}</span>
            ${row.sinClave || !row.claveHash ? '<span class="badge badge-warning" style="font-size: 10px;">sin contraseña</span>' : ''}
            ${row.debeCambiarClave ? '<span class="badge badge-warning" style="font-size: 10px;">debe cambiar clave</span>' : ''}`
        }
      ],
      actions: (row) => isDev ? `
        <button class="btn btn-secondary btn-sm btn-edit-user" data-id="${esc(row.id)}">✏️ Editar</button>
        ${row.id !== currentUser.id ? `<button class="btn btn-danger btn-sm btn-delete-user" data-id="${esc(row.id)}">🗑️</button>` : ''}
      ` : '<span class="badge badge-neutral" style="font-size: 10px;">🔒</span>'
    });

    if (!isDev) return;

    container.querySelector('#btn-new-user').addEventListener('click', () => this.openUserModal(null, tenantId, users, () => this.render(container)));

    container.querySelector('#btn-recovery-code').addEventListener('click', () => {
      Modal.confirm({
        title: 'Código de recuperación',
        message: 'Se generará un código nuevo y el anterior dejará de funcionar. ¿Continuar?',
        confirmText: 'Generar',
        onConfirm: async () => {
          try {
            const code = await AuthServiceInstance.regenerateRecoveryCode();
            await AuditService.log({ modulo: 'Seguridad', accion: 'MODIFICAR', registroId: 'recuperacion', campoModificado: 'Código de recuperación', valorNuevo: 'Regenerado' });
            Modal.show({
              title: 'Nuevo código de recuperación',
              size: 'sm',
              content: `<p class="text-xs mb-2">Anótelo en papel y guárdelo fuera del computador. No se volverá a mostrar.</p><div class="recovery-code">${esc(code)}</div>`,
              footerButtons: [{ label: 'Ya lo anoté', class: 'btn-primary', onClick: () => { Modal.close(); this.render(container); } }]
            });
          } catch (err) {
            Toast.error(err.message);
          }
        }
      });
    });

    container.querySelector('#users-table-container').addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-user');
      const delBtn = e.target.closest('.btn-delete-user');
      if (editBtn) {
        const user = users.find(u => u.id === editBtn.getAttribute('data-id'));
        this.openUserModal(user, tenantId, users, () => this.render(container));
      }
      if (delBtn) {
        const user = users.find(u => u.id === delBtn.getAttribute('data-id'));
        if (!user || user.id === currentUser.id) return;
        const devs = allUsers.filter(u => u.rol === ROLES.DEV && u.estado !== 'INACTIVO');
        if (user.rol === ROLES.DEV && devs.length <= 1) {
          Toast.error('No se puede eliminar el único Desarrollador activo.');
          return;
        }
        Modal.confirm({
          title: 'Eliminar usuario',
          message: `¿Eliminar permanentemente a <strong>${esc(user.nombre)}</strong>? Su historial en auditoría se conserva. Si solo quiere bloquear el acceso, edítelo y márquelo INACTIVO.`,
          confirmText: 'Sí, eliminar',
          isDanger: true,
          onConfirm: async () => {
            await DB.delete(STORES.USERS, user.id);
            await AuditService.log({ modulo: 'Seguridad', accion: 'ELIMINAR', registroId: user.id, campoModificado: 'Usuario', valorAnterior: user.usuario });
            Toast.success('Usuario eliminado.');
            this.render(container);
          }
        });
      }
    });
  },

  openUserModal(user, tenantId, users, onSaved) {
    const isEdit = !!user;
    const allPerms = Object.values(PERMISSIONS);
    const userPerms = user ? (user.permisos || []) : DEFAULT_PERMS[ROLES.VENDEDOR];

    const dialog = Modal.show({
      title: isEdit ? `Editar usuario: ${user.nombre}` : 'Crear usuario',
      content: `
        <form id="user-form" autocomplete="off">
          <div class="form-row mb-3">
            <div class="form-group"><label class="form-label">Nombre completo</label>
              <input type="text" class="form-control" name="nombre" required value="${esc(user ? user.nombre : '')}"></div>
            <div class="form-group"><label class="form-label">Usuario (login)</label>
              <input type="text" class="form-control" name="usuario" required value="${esc(user ? user.usuario : '')}" autocomplete="off"></div>
          </div>
          <div class="form-row mb-3">
            <div class="form-group"><label class="form-label">Correo (opcional)</label>
              <input type="email" class="form-control" name="email" value="${esc(user ? (user.email || '') : '')}"></div>
            <div class="form-group"><label class="form-label">Rol</label>
              <select class="form-select" name="rol" id="user-role-sel">
                ${ROLE_LIST.map(r => `<option value="${esc(r)}" ${user && user.rol === r ? 'selected' : ''}>${esc(r)}</option>`).join('')}
              </select></div>
          </div>
          <div class="form-row mb-3">
            <div class="form-group"><label class="form-label">${isEdit ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña inicial'}</label>
              <input type="password" class="form-control" name="clave" ${isEdit ? '' : 'required'} autocomplete="new-password">
              <div class="form-help">${esc(AuthServiceInstance.passwordRules())}</div></div>
            <div class="form-group"><label class="form-label">Estado</label>
              <select class="form-select" name="estado">
                <option value="ACTIVO" ${!user || user.estado !== 'INACTIVO' ? 'selected' : ''}>ACTIVO</option>
                <option value="INACTIVO" ${user && user.estado === 'INACTIVO' ? 'selected' : ''}>INACTIVO (sin acceso)</option>
              </select></div>
          </div>
          <label class="d-flex items-center gap-2 text-xs mb-3"><input type="checkbox" name="forzarCambio" ${!isEdit ? 'checked' : ''}> Pedir que cambie la contraseña en el próximo ingreso</label>
          <div class="card mb-0" style="border: 1px solid var(--border-color);">
            <div class="card-header" style="padding: 10px 14px;"><div class="card-title" style="font-size: 13px;">Permisos</div></div>
            <div class="card-body" style="padding: 12px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;" id="perm-grid">
                ${allPerms.map(p => `
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" name="permiso_${p}" value="${p}" ${userPerms.includes(p) ? 'checked' : ''}>
                    <span>${p === 'FINANCIERO' ? 'VER INFORMACIÓN FINANCIERA' : (p === 'AUTORIZAR' ? 'AUTORIZAR (anular ventas)' : p)}</span>
                  </label>`).join('')}
              </div>
            </div>
          </div>
        </form>`,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: isEdit ? 'Guardar cambios' : 'Crear usuario',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#user-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }
            const fd = new FormData(form);
            const usuario = String(fd.get('usuario')).trim().toLowerCase();
            if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) {
              Toast.warning('El usuario debe tener 3-30 caracteres: letras, números, punto, guion o guion bajo.');
              return;
            }
            const all = await DB.getAll(STORES.USERS);
            if (all.some(u => String(u.usuario).toLowerCase() === usuario && (!user || u.id !== user.id))) {
              Toast.warning('Ya existe un usuario con ese nombre de acceso.');
              return;
            }
            const clave = String(fd.get('clave') || '');
            if (clave && !AuthServiceInstance.isStrongPassword(clave)) {
              Toast.warning(AuthServiceInstance.passwordRules());
              return;
            }
            const rol = fd.get('rol');
            const estado = fd.get('estado');
            if (isEdit && user.id === AuthServiceInstance.getCurrentUser().id && (estado === 'INACTIVO' || rol !== user.rol)) {
              Toast.warning('No puede cambiar su propio rol ni desactivarse.');
              return;
            }

            const payload = {
              ...(user || {}),
              tenantId: user ? user.tenantId : tenantId,
              nombre: String(fd.get('nombre')).trim(),
              usuario,
              email: String(fd.get('email') || '').trim(),
              rol,
              estado,
              permisos: allPerms.filter(p => fd.get(`permiso_${p}`)),
              debeCambiarClave: !!fd.get('forzarCambio') || (user ? !!user.debeCambiarClave && !clave : false)
            };
            delete payload.clave;
            if (clave) {
              payload.claveHash = await CryptoUtil.hashPassword(clave);
              delete payload.sinClave;
            }

            if (isEdit) {
              await DB.update(STORES.USERS, payload);
            } else {
              await DB.add(STORES.USERS, payload);
            }
            await AuditService.log({
              modulo: 'Seguridad', accion: isEdit ? 'MODIFICAR' : 'CREAR', registroId: payload.id,
              campoModificado: 'Usuario', valorNuevo: `${payload.usuario} (${payload.rol}, ${payload.estado})${clave ? ' + clave' : ''}`
            });
            Toast.success(isEdit ? 'Usuario actualizado.' : 'Usuario creado.');
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });

    const roleSel = dialog.querySelector('#user-role-sel');
    roleSel.addEventListener('change', () => {
      const perms = DEFAULT_PERMS[roleSel.value] || [];
      dialog.querySelectorAll('#perm-grid input[type=checkbox]').forEach(chk => { chk.checked = perms.includes(chk.value); });
    });
  }
};
