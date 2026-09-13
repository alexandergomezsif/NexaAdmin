/**
 * Nexa ERP - Módulo 17: Respaldo y Restauración de Información
 * Exportación e importación íntegra de la base de datos JSON
 * Cumple la directriz: CERO botones de eliminación masiva accidental
 */

import { DB } from '../services/db-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const BackupModule = {
  async render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Respaldo y Recuperación de Información</h1>
          <p>Generación de copias de seguridad portables (JSON) y restauración segura de bases de datos</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        
        <!-- EXPORTAR COPIA DE SEGURIDAD -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">💾 Exportar Respaldo Completo</div>
            <span class="badge badge-success">Seguridad</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-4" style="line-height: 1.5;">
              Genera un archivo con formato <code>.json</code> que contiene la totalidad de datos del sistema: clientes, catálogo de productos, inventario Kardex, recetas BOM, ventas, órdenes de producción, cuentas por cobrar, cuentas por pagar y auditoría.
            </p>
            <button class="btn btn-primary" id="btn-export-backup" style="width: 100%; padding: 12px;">
              ⬇️ Descargar Archivo de Respaldo (.JSON)
            </button>
          </div>
        </div>

        <!-- RESTAURAR COPIA DE SEGURIDAD -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">📥 Restaurar Respaldo Existente</div>
            <span class="badge badge-warning">Cuidado</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-4" style="line-height: 1.5;">
              Permite cargar un archivo de respaldo <code>.json</code> previamente generado para sincronizar o restaurar la información en caso de cambio de terminal o migración.
            </p>
            
            <div class="form-group mb-3">
              <label class="form-label text-xs">Seleccionar Archivo JSON de Respaldo:</label>
              <input type="file" id="inp-restore-file" accept=".json" class="form-control" style="font-size: 12px;">
            </div>

            <button class="btn btn-secondary" id="btn-restore-backup" style="width: 100%; padding: 12px;" disabled>
              🔄 Validar y Restaurar Datos
            </button>
          </div>
        </div>

      </div>

      <div class="alert alert-info mt-4" style="font-size: 12px;">
        🛡️ <strong>Directriz de Seguridad:</strong> Por diseño de seguridad, este software no incluye opciones de "Borrar Todo" ni "Restablecimiento de Fábrica" para prevenir eliminaciones masivas accidentales o pérdidas irrecuperables de información contable.
      </div>
    `;

    // Exportar Respaldo JSON
    container.querySelector('#btn-export-backup').addEventListener('click', async () => {
      try {
        Toast.info('Generando copia de respaldo íntegra...');
        const backupData = await DB.exportBackup();
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NexaERP_Respaldo_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Toast.success('Copia de respaldo descargada con éxito.');
      } catch (err) {
        Toast.error('Error al generar respaldo: ' + err.message);
      }
    });

    // Habilitar botón al seleccionar archivo
    const fileInp = container.querySelector('#inp-restore-file');
    const restoreBtn = container.querySelector('#btn-restore-backup');

    fileInp.addEventListener('change', () => {
      restoreBtn.disabled = !fileInp.files || fileInp.files.length === 0;
    });

    // Restaurar Respaldo
    restoreBtn.addEventListener('click', () => {
      const file = fileInp.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data || !data.stores) {
            throw new Error('El archivo seleccionado no corresponde a un formato de respaldo válido de Nexa ERP.');
          }

          Modal.confirm({
            title: 'Confirmación de Restauración',
            message: `Está a punto de cargar un respaldo generado el <strong>${data.timestamp || 'Fecha desconocida'}</strong> con <strong>${Object.keys(data.stores).length}</strong> tablas de información. ¿Desea proceder?`,
            confirmText: 'Sí, Restaurar Información',
            cancelText: 'Cancelar',
            onConfirm: async () => {
              try {
                await DB.restoreBackup(data);
                Toast.success('Información restaurada con éxito. Recargando parámetros...');
                setTimeout(() => window.location.reload(), 1200);
              } catch (restErr) {
                Toast.error('Error al restaurar: ' + restErr.message);
              }
            }
          });
        } catch (parseErr) {
          Toast.error('Archivo corrupto o inválido: ' + parseErr.message);
        }
      };
      reader.readAsText(file);
    });
  }
};
