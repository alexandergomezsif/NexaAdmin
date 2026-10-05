/**
 * Nexa ERP - Módulo 17: Respaldo y Restauración
 *
 * - Exportar: archivo .json con toda la base de datos.
 * - Restaurar: REEMPLAZA toda la información actual por la del archivo (atómico).
 *   Antes de restaurar se descarga automáticamente un respaldo del estado actual.
 *
 * Por qué ya no se "fusiona": con dos equipos operando, fusionar archivos sobrescribía
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
import { Formatters, esc } from '../utils/formatters.js';

export const BackupModule = {
  async render(container) {
    const lastBackup = await DB.getParam('ultimo_respaldo', null);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Respaldo y Restauración</h1>
          <p>Copias de seguridad completas en formato JSON</p>
        </div>
      </div>

      <div class="alert alert-info mb-3" style="font-size: 12px; line-height: 1.5;">
        ℹ️ NexaAdmin guarda la información <strong>solo en este navegador de este equipo</strong>. Descargue respaldos con frecuencia y guárdelos fuera del computador
        (memoria USB o nube personal). Los respaldos contienen datos de clientes y deben tratarse como información confidencial.
        ${lastBackup ? `<br>Último respaldo descargado: <strong>${esc(Formatters.dateTime(lastBackup))}</strong>` : '<br><strong>Aún no se ha descargado ningún respaldo manual en este equipo.</strong>'}
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
            <div class="card-title">📥 Restaurar desde un respaldo</div>
            <span class="badge badge-danger">Reemplaza todo</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              <strong>Toda la información actual de este equipo se reemplazará</strong> por la del archivo. Antes de hacerlo se descargará
              automáticamente un respaldo del estado actual. Úselo para pasar la operación a otro computador o recuperar información.
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
          const info = DB.validateBackup(data);
          parsed = data;
          const t = data.stores;
          summary.innerHTML = `
            <div class="card p-2" style="margin: 0;">
              <div>Fecha del respaldo: <strong>${esc(data.timestamp ? Formatters.dateTime(data.timestamp) : 'desconocida')}</strong> · versión ${esc(data.version || '?')}</div>
              <div>${info.registros} registros en ${info.tablas.length} tablas · Empresas: ${(t[STORES.TENANTS] || []).length} · Productos: ${(t[STORES.PRODUCTS] || []).length} · Ventas: ${(t[STORES.SALES] || []).length} · Usuarios: ${(t[STORES.USERS] || []).length}</div>
            </div>`;
          restoreBtn.disabled = false;
        } catch (err) {
          summary.innerHTML = `<span class="text-danger">Archivo inválido: ${esc(err.message)}</span>`;
        }
      };
      reader.readAsText(file);
    });

    restoreBtn.addEventListener('click', () => {
      if (!parsed) return;
      Modal.show({
        title: 'Confirmar restauración',
        size: 'sm',
        content: `
          <p class="text-xs mb-2">Se reemplazará <strong>toda</strong> la información actual por la del respaldo del
          <strong>${esc(parsed.timestamp ? Formatters.dateTime(parsed.timestamp) : 'archivo seleccionado')}</strong>.
          Primero se descargará un respaldo del estado actual.</p>
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
              const pre = await DB.downloadAutoBackup('AntesDeRestaurar');
              if (!pre) {
                Toast.error('No se pudo descargar el respaldo previo. Restauración cancelada.');
                ev.target.disabled = false;
                return;
              }
              try {
                await DB.restoreBackup(parsed);
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
    });
  }
};
