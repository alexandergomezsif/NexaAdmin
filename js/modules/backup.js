/**
 * Nexa ERP - Módulo 17: Respaldo y Restauración
 *
 * - Respaldo automático en una carpeta del PC (BackupFolderService): cada pocos minutos
 *   si hubo cambios, al cerrar caja y al ocultar/cerrar la pestaña.
 * - Exportar: archivo .json con toda la base de datos.
 * - Restaurar: REEMPLAZA toda la información actual por la del archivo (atómico).
 *   Antes de restaurar se guarda un respaldo del estado actual.
 *
 * Por qué no se "fusiona": con dos equipos operando, fusionar archivos sobrescribía
 * stock, saldos de clientes y turnos de caja con el último archivo cargado, y lo borrado
 * en un equipo reaparecía. Mientras NexaAdmin sea 100 % local, debe existir UN SOLO
 * equipo de operación; el respaldo sirve para mover la información completa de un
 * equipo a otro o recuperarla, no para sincronizar dos equipos en paralelo.
 */

import { DB, STORES } from '../services/db-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { AuthServiceInstance } from '../services/auth-service.js';
import { AuditService } from '../services/audit-service.js';
import { BackupFolderService } from '../services/backup-folder-service.js';
import { Formatters, esc } from '../utils/formatters.js';

const fmtSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

export const BackupModule = {
  async render(container) {
    await BackupFolderService.load();
    const lastBackup = await DB.getParam('ultimo_respaldo', null);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Respaldo y Restauración</h1>
          <p>Copia automática en una carpeta del computador y copias manuales en formato JSON</p>
        </div>
      </div>

      <div class="card mb-3" id="auto-backup-card">${await this.autoCardHtml()}</div>

      <div class="alert alert-info mb-3" style="font-size: 12px; line-height: 1.5;">
        NexaAdmin guarda la información <strong>solo en este navegador de este equipo</strong>. Si borra los datos de navegación o formatea el equipo,
        la única copia es la carpeta de respaldo o los archivos descargados. Los respaldos contienen datos de clientes: trátelos como información confidencial
        y <strong>no los guarde dentro de la carpeta del programa</strong> (se subirían a GitHub).
        ${lastBackup ? `<br>Último respaldo manual descargado: <strong>${esc(Formatters.dateTime(lastBackup))}</strong>` : ''}
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">💾 Descargar respaldo completo</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-4" style="line-height: 1.5;">
              Incluye clientes, catálogo, inventario, recetas, ventas, caja, cartera, cuentas por pagar, comprobantes y auditoría.
              Las contraseñas viajan como hash (no legibles).
            </p>
            <button class="btn btn-primary" id="btn-export-backup" style="width: 100%; padding: 12px;">⬇️ Descargar respaldo (.json)</button>
          </div>
        </div>

        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">📥 Restaurar desde un archivo</div>
            <span class="badge badge-danger">Reemplaza todo</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              <strong>Toda la información actual de este equipo se reemplazará</strong> por la del archivo. Antes de hacerlo se guarda
              un respaldo del estado actual. Úselo para pasar la operación a otro computador o recuperar información.
            </p>
            <div class="form-group mb-3">
              <input type="file" id="inp-restore-file" accept=".json,application/json" class="form-control" style="font-size: 12px;">
            </div>
            <div id="restore-summary" class="text-xs mb-3"></div>
            <button class="btn btn-danger" id="btn-restore-backup" style="width: 100%; padding: 12px;" disabled>🔄 Restaurar (reemplazar información)</button>
          </div>
        </div>
      </div>
    `;

    this.bindAutoCard(container);

    container.querySelector('#btn-export-backup').addEventListener('click', async () => {
      const ok = await DB.downloadAutoBackup(`Manual_${(AuthServiceInstance.getCurrentUser()?.usuario || 'usuario')}`);
      if (ok) {
        await DB.setParam('ultimo_respaldo', new Date().toISOString());
        await AuditService.log({ modulo: 'Respaldo', accion: 'EXPORTAR', campoModificado: 'Respaldo completo', valorNuevo: 'Descargado' });
        Toast.success('Respaldo descargado.');
        this.render(container);
      } else {
        Toast.error('No se pudo generar el respaldo.');
      }
    });

    const fileInp = container.querySelector('#inp-restore-file');
    const restoreBtn = container.querySelector('#btn-restore-backup');
    const summary = container.querySelector('#restore-summary');
    let parsed = null;

    fileInp.addEventListener('change', () => {
      parsed = null;
      restoreBtn.disabled = true;
      summary.innerHTML = '';
      const file = fileInp.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          DB.validateBackup(data);
          parsed = data;
          summary.innerHTML = `<div class="card p-2" style="margin: 0;">${this.summaryHtml(data)}</div>`;
          restoreBtn.disabled = false;
        } catch (err) {
          summary.innerHTML = `<span class="text-danger">Archivo inválido: ${esc(err.message)}</span>`;
        }
      };
      reader.readAsText(file);
    });

    restoreBtn.addEventListener('click', () => { if (parsed) this.confirmRestore(parsed); });
  },

  summaryHtml(data) {
    const info = DB.validateBackup(data);
    const t = data.stores;
    return `
      <div>Fecha del respaldo: <strong>${esc(data.timestamp ? Formatters.dateTime(data.timestamp) : 'desconocida')}</strong> · versión ${esc(data.version || '?')}</div>
      <div>${info.registros} registros en ${info.tablas.length} tablas · Empresas: ${(t[STORES.TENANTS] || []).length} · Productos: ${(t[STORES.PRODUCTS] || []).length} · Ventas: ${(t[STORES.SALES] || []).length} · Usuarios: ${(t[STORES.USERS] || []).length}</div>`;
  },

  // ---------------------------------------------------------------- respaldo automático
  async autoCardHtml() {
    const s = BackupFolderService;
    const st = s.state;
    const header = `
      <div class="card-header">
        <div class="card-title">🗂️ Respaldo automático en carpeta</div>
        <span class="badge ${st === 'ok' ? 'badge-success' : st === 'error' ? 'badge-danger' : 'badge-warning'}" id="auto-backup-state">${esc({
          ok: 'Activo', 'needs-permission': 'Falta permiso', 'no-folder': 'Sin carpeta', unsupported: 'No disponible en este navegador',
          error: 'Con error', disabled: 'Apagado'
        }[st] || st)}</span>
      </div>`;

    if (!s.isSupported()) {
      const brave = s.isBrave();
      return `${header}
        <div class="card-body text-xs" style="line-height: 1.6;">
          ${brave ? `
            <p class="mb-2"><strong>Brave trae esta función desactivada.</strong> Para activarla (una sola vez):</p>
            <ol class="mb-3" style="padding-left: 18px;">
              <li>Copie esta dirección en la barra de Brave: <code id="brave-flag-url">brave://flags/#file-system-access-api</code>
                <button class="btn btn-secondary btn-sm" id="btn-copy-flag" style="margin-left: 6px;">Copiar</button></li>
              <li>En <strong>File System Access API</strong> elija <strong>Enabled</strong>.</li>
              <li>Pulse <strong>Relaunch</strong> (Brave se reinicia) y vuelva a esta pantalla.</li>
            </ol>` : `
            <p class="mb-3">Este navegador no permite guardar en una carpeta. Use Google Chrome o Microsoft Edge para el respaldo automático.</p>`}
          <label class="flex items-center gap-2"><input type="checkbox" id="chk-download-fallback" ${s.settings.downloadFallback ? 'checked' : ''}>
            Mientras tanto, descargar un respaldo diario a la carpeta Descargas (al entrar por primera vez cada día)</label>
        </div>`;
    }

    const lastOk = s.lastOk ? Formatters.dateTime(s.lastOk) : 'todavía no';
    // El nombre puede venir vacío (p. ej. la raíz de un disco); lo que importa es que haya carpeta.
    const folder = s.handle ? (s.folderName() || 'carpeta seleccionada') : null;
    return `${header}
      <div class="card-body text-xs" style="line-height: 1.6;">
        ${folder ? `
          <div class="mb-2">Carpeta: <strong>${esc(folder)}</strong> · Última copia: <strong id="auto-backup-last">${esc(lastOk)}</strong></div>
          ${s.lastError ? `<div class="alert alert-danger mb-2">${esc(s.lastError)}</div>` : ''}
          ${st === 'needs-permission' ? `<div class="alert alert-warning mb-2">El navegador pide confirmar el permiso de la carpeta en cada sesión. Pulse <strong>Dar permiso</strong> (o el aviso de la barra superior). Si aparece la opción <em>Permitir en cada visita</em>, elíjala.</div>` : ''}
        ` : `
          <p class="mb-2">Elija una carpeta y NexaAdmin guardará ahí una copia completa <strong>automáticamente</strong>: cada pocos minutos si hubo cambios,
          al cerrar la caja y al cerrar la pestaña. Recomendado: una carpeta dentro de <strong>OneDrive</strong> (queda copia en la nube) o en <strong>Documentos</strong>,
          por ejemplo <em>Documentos\\NexaAdmin_Respaldos</em>.</p>`}

        <div class="flex gap-2 mb-3" style="flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" id="btn-choose-folder">${folder ? 'Cambiar carpeta' : 'Elegir carpeta de respaldo'}</button>
          ${folder && st === 'needs-permission' ? '<button class="btn btn-primary btn-sm" id="btn-grant-folder">Dar permiso</button>' : ''}
          ${folder ? '<button class="btn btn-secondary btn-sm" id="btn-backup-now">Respaldar ahora</button>' : ''}
          ${folder ? '<button class="btn btn-secondary btn-sm" id="btn-forget-folder">Dejar de usar esta carpeta</button>' : ''}
        </div>

        <div class="flex gap-3 mb-3" style="flex-wrap: wrap; align-items: center;">
          <label class="flex items-center gap-2"><input type="checkbox" id="chk-auto-enabled" ${s.settings.enabled ? 'checked' : ''}> Respaldo automático activo</label>
          <label>Cada <select id="sel-auto-interval" class="form-control" style="display: inline-block; width: auto; padding: 2px 6px;">
            ${[1, 5, 15, 30].map(m => `<option value="${m}" ${Number(s.settings.intervalMin) === m ? 'selected' : ''}>${m} min</option>`).join('')}
          </select> si hubo cambios</label>
          <label>Conservar copias diarias <select id="sel-auto-keep" class="form-control" style="display: inline-block; width: auto; padding: 2px 6px;">
            ${[7, 30, 90, 365].map(d => `<option value="${d}" ${Number(s.settings.keepDays) === d ? 'selected' : ''}>${d} días</option>`).join('')}
          </select></label>
        </div>

        ${folder && st !== 'needs-permission' ? '<div id="folder-files" class="backup-file-list"><span class="text-muted">Cargando archivos…</span></div>' : ''}
      </div>`;
  },

  async refreshAutoCard(container) {
    const card = container.querySelector('#auto-backup-card');
    if (!card) return;
    card.innerHTML = await this.autoCardHtml();
    this.bindAutoCard(container);
  },

  bindAutoCard(container) {
    const s = BackupFolderService;
    const $ = (sel) => container.querySelector(sel);

    $('#btn-copy-flag')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText('brave://flags/#file-system-access-api'); Toast.success('Dirección copiada. Péguela en la barra de Brave.'); }
      catch (e) { Toast.info('Seleccione y copie la dirección manualmente.'); }
    });
    $('#chk-download-fallback')?.addEventListener('change', (e) => s.saveSettings({ downloadFallback: e.target.checked }));
    $('#chk-auto-enabled')?.addEventListener('change', async (e) => { await s.saveSettings({ enabled: e.target.checked }); this.refreshAutoCard(container); });
    $('#sel-auto-interval')?.addEventListener('change', (e) => s.saveSettings({ intervalMin: Number(e.target.value) }));
    $('#sel-auto-keep')?.addEventListener('change', (e) => s.saveSettings({ keepDays: Number(e.target.value) }));

    $('#btn-choose-folder')?.addEventListener('click', async () => {
      let info;
      try {
        info = await s.chooseFolder();
      } catch (e) {
        if (e && e.name === 'AbortError') return; // el usuario cerró el selector
        Toast.error(e.message || 'No se pudo usar esa carpeta.');
        return;
      }
      await this.afterFolderChosen(container, info);
    });

    $('#btn-grant-folder')?.addEventListener('click', async () => {
      if ((await s.checkPermission(true)) === 'granted') {
        await s.backupNow();
        Toast.success('Permiso concedido. Respaldo automático activo.');
      } else {
        Toast.warning('Sin permiso no se puede guardar en la carpeta.');
      }
      this.refreshAutoCard(container);
    });

    $('#btn-backup-now')?.addEventListener('click', async (ev) => {
      ev.target.disabled = true;
      const ok = await s.backupNow('Manual');
      if (ok) Toast.success('Respaldo guardado en la carpeta.');
      else Toast.error(s.lastError || 'No se pudo guardar el respaldo.');
      this.refreshAutoCard(container);
    });

    $('#btn-forget-folder')?.addEventListener('click', () => {
      Modal.confirm({
        title: 'Dejar de usar la carpeta',
        message: 'NexaAdmin dejará de guardar copias automáticas. Los archivos que ya están en la carpeta NO se borran.',
        confirmText: 'Dejar de usar',
        onConfirm: async () => { await s.forgetFolder(); this.refreshAutoCard(container); }
      });
    });

    if ($('#folder-files')) this.renderFolderFiles(container);
  },

  /** Si la carpeta ya tiene un respaldo con más información que la base actual, ofrece restaurarlo. */
  async afterFolderChosen(container, info) {
    const s = BackupFolderService;
    if (s.permission !== 'granted') {
      Toast.warning('Sin permiso de escritura no se puede usar esa carpeta.');
      this.refreshAutoCard(container);
      return;
    }
    if (info && info.records > info.currentRecords) {
      Modal.show({
        title: 'La carpeta ya tiene un respaldo',
        size: 'sm',
        content: `
          <p class="text-xs mb-2">En <strong>${esc(s.folderName())}</strong> hay un respaldo del
          <strong>${esc(info.timestamp ? Formatters.dateTime(info.timestamp) : 'fecha desconocida')}</strong> con
          <strong>${info.records}</strong> registros. La base de este navegador tiene <strong>${info.currentRecords}</strong>.</p>
          <p class="text-xs">Si borró los datos del navegador o cambió de equipo, restaure ese respaldo.
          Si elige guardar, el archivo <em>NexaAdmin_ultimo.json</em> se reemplazará (las copias diarias anteriores se conservan).</p>`,
        footerButtons: [
          { label: 'Restaurar ese respaldo', class: 'btn-danger', onClick: () => { Modal.close(); this.confirmRestore(info.data); } },
          {
            label: 'Guardar la base actual', class: 'btn-secondary', onClick: async () => {
              Modal.close();
              await s.backupNow('CambioCarpeta', { force: true });
              this.refreshAutoCard(container);
            }
          }
        ]
      });
      return;
    }
    const ok = await s.backupNow();
    if (ok) Toast.success(`Respaldo automático activo en "${s.folderName()}".`);
    else Toast.error(s.lastError || 'No se pudo guardar el respaldo.');
    this.refreshAutoCard(container);
  },

  async renderFolderFiles(container) {
    const box = container.querySelector('#folder-files');
    if (!box) return;
    let files = [];
    try { files = await BackupFolderService.listFiles(); } catch (e) { box.innerHTML = `<span class="text-danger">${esc(e.message)}</span>`; return; }
    if (!files.length) { box.innerHTML = '<span class="text-muted">La carpeta aún no tiene respaldos de NexaAdmin.</span>'; return; }
    box.innerHTML = `
      <table class="table" style="width: 100%;">
        <thead><tr><th>Archivo</th><th>Fecha</th><th>Tamaño</th><th></th></tr></thead>
        <tbody>${files.map(f => `
          <tr>
            <td>${esc(f.name)}</td>
            <td>${esc(Formatters.dateTime(new Date(f.modified).toISOString()))}</td>
            <td>${fmtSize(f.size)}</td>
            <td style="text-align: right;"><button class="btn btn-secondary btn-sm btn-restore-from-folder" data-name="${esc(f.name)}">Restaurar</button></td>
          </tr>`).join('')}
        </tbody>
      </table>`;
    box.querySelectorAll('.btn-restore-from-folder').forEach(btn => btn.addEventListener('click', async () => {
      try {
        const data = await BackupFolderService.readFile(btn.dataset.name);
        DB.validateBackup(data);
        this.confirmRestore(data);
      } catch (e) {
        Toast.error('No se pudo leer el archivo: ' + e.message);
      }
    }));
  },

  // ---------------------------------------------------------------- restauración
  confirmRestore(data) {
    Modal.show({
      title: 'Confirmar restauración',
      size: 'sm',
      content: `
        <div class="text-xs mb-2">${this.summaryHtml(data)}</div>
        <p class="text-xs mb-2">Se reemplazará <strong>toda</strong> la información actual por la de este respaldo.
        Primero se guardará un respaldo del estado actual.</p>
        <p class="text-xs mb-2">Escriba <strong>RESTAURAR</strong> para confirmar:</p>
        <input class="form-control" id="restore-confirm-text" autocomplete="off">
        <p class="text-xs text-muted mt-2">Después de restaurar deberá iniciar sesión con un usuario del respaldo.</p>`,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Restaurar', class: 'btn-danger', onClick: async (dlg, ev) => {
            if (dlg.querySelector('#restore-confirm-text').value.trim().toUpperCase() !== 'RESTAURAR') {
              Toast.warning('Escriba RESTAURAR para confirmar.');
              return;
            }
            ev.target.disabled = true;
            const pre = await BackupFolderService.backupEvent('AntesDeRestaurar');
            if (!pre) {
              Toast.error('No se pudo guardar el respaldo previo. Restauración cancelada.');
              ev.target.disabled = false;
              return;
            }
            try {
              await DB.restoreBackup(data);
              await BackupFolderService.resetShrinkGuard();
              localStorage.removeItem('nexa_session');
              Toast.success('Información restaurada. Recargando...');
              setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
              Toast.error('Error al restaurar (no se modificó nada): ' + err.message);
              ev.target.disabled = false;
            }
          }
        }
      ]
    });
  }
};
