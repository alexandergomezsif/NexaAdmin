/**
 * Nexa ERP - Módulo 18: Importación Masiva de Datos
 * Carga de Clientes, Productos y Proveedores mediante archivos CSV / Excel con previsualización
 */

import { DB, STORES } from '../services/db-service.js';
import { DianDV } from '../utils/dian-dv.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const ImporterModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Importación Masiva de Datos (CSV / Excel)</h1>
          <p>Carga ágil de catálogos maestros de clientes, productos y proveedores mediante hojas de cálculo</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;" class="mb-4">
        
        <!-- IMPORTAR CLIENTES -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">👥 Importar Clientes</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Cargue masivamente el directorio de clientes con NIT, razón social, teléfonos, ciudad y cupos.</p>
            <div class="d-flex flex-col gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-dl-template-clients">📥 Descargar Plantilla Modelo (CSV)</button>
              <input type="file" id="inp-csv-clients" accept=".csv" class="form-control" style="font-size: 12px;">
              <button class="btn btn-primary btn-sm" id="btn-process-clients" disabled>⚙️ Procesar e Importar Clientes</button>
            </div>
          </div>
        </div>

        <!-- IMPORTAR PRODUCTOS -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">📦 Importar Productos & Insumos</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Cargue inventario inicial, SKU, nombre, categoría, costos y listas de precios de venta.</p>
            <div class="d-flex flex-col gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-dl-template-products">📥 Descargar Plantilla Modelo (CSV)</button>
              <input type="file" id="inp-csv-products" accept=".csv" class="form-control" style="font-size: 12px;">
              <button class="btn btn-primary btn-sm" id="btn-process-products" disabled>⚙️ Procesar e Importar Productos</button>
            </div>
          </div>
        </div>

        <!-- IMPORTAR PROVEEDORES -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">🛍️ Importar Proveedores</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Cargue proveedores de materias primas químicas, envases plásticos y suministros.</p>
            <div class="d-flex flex-col gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-dl-template-suppliers">📥 Descargar Plantilla Modelo (CSV)</button>
              <input type="file" id="inp-csv-suppliers" accept=".csv" class="form-control" style="font-size: 12px;">
              <button class="btn btn-primary btn-sm" id="btn-process-suppliers" disabled>⚙️ Procesar e Importar Proveedores</button>
            </div>
          </div>
        </div>

      </div>

      <!-- ÁREA DE PREVISUALIZACIÓN DE ARCHIVO CARGADO -->
      <div class="card" id="importer-preview-card" style="display: none;">
        <div class="card-header">
          <div class="card-title" id="importer-preview-title">Previsualización de Datos a Importar</div>
          <button class="btn btn-success btn-sm" id="btn-confirm-import">✓ Confirmar Inserción en Base de Datos</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="max-height: 350px; overflow-y: auto;">
            <table class="data-table" style="font-size: 11px;" id="importer-preview-table">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    let pendingImportType = null;
    let pendingImportRows = [];

    // Funciones de descarga de plantillas modelo
    const downloadCSVTemplate = (filename, headers, sampleRow) => {
      const csv = '\uFEFF' + headers.join(';') + '\r\n' + sampleRow.join(';') + '\r\n';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    container.querySelector('#btn-dl-template-clients').addEventListener('click', () => {
      downloadCSVTemplate(
        'Plantilla_Clientes_Nexa',
        ['Codigo', 'Nombre', 'NIT_CC', 'TipoCliente', 'Telefono', 'Ciudad', 'Direccion', 'CupoCredito', 'DiasCredito'],
        ['CLI-101', 'AutoLavado El Diamante', '901234567', 'Taller / Detailing', '3001234567', 'Medellín', 'Carrera 50 # 30-20', '3000000', '30']
      );
    });

    container.querySelector('#btn-dl-template-products').addEventListener('click', () => {
      downloadCSVTemplate(
        'Plantilla_Productos_Nexa',
        ['SKU', 'Nombre', 'TipoItem', 'Categoria', 'UnidadMedida', 'CostoPromedio', 'Precio1', 'StockInicial', 'StockMinimo'],
        ['RAYO-LIMP-500', 'Limpiador Cristales Antiempañante 500ml', 'PRODUCTO_TERMINADO', 'Visibilidad', 'Unidad', '6500', '18000', '40', '10']
      );
    });

    container.querySelector('#btn-dl-template-suppliers').addEventListener('click', () => {
      downloadCSVTemplate(
        'Plantilla_Proveedores_Nexa',
        ['Codigo', 'RazonSocial', 'NIT', 'Contacto', 'Telefono', 'Ciudad', 'Categoria', 'DiasCredito'],
        ['PROV-050', 'Envases Químicos de Antioquia SAS', '900444555', 'Pedro Restrepo', '4441234', 'Itagüí', 'Material de Empaque', '30']
      );
    });

    // Manejadores de Input File
    const setupFileInput = (inputId, btnId, type) => {
      const input = container.querySelector(inputId);
      const btn = container.querySelector(btnId);

      input.addEventListener('change', () => {
        btn.disabled = !input.files || input.files.length === 0;
      });

      btn.addEventListener('click', () => {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
          if (lines.length < 2) {
            Toast.warning('El archivo seleccionado no contiene filas de datos.');
            return;
          }

          const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
          const rows = [];

          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(';').map(c => c.replace(/"/g, '').trim());
            if (cols.length >= headers.length) {
              const rowObj = {};
              headers.forEach((h, idx) => {
                rowObj[h] = cols[idx];
              });
              rows.push(rowObj);
            }
          }

          pendingImportType = type;
          pendingImportRows = rows;
          showPreview(headers, rows, type);
        };
        reader.readAsText(file);
      });
    };

    setupFileInput('#inp-csv-clients', '#btn-process-clients', 'CUSTOMERS');
    setupFileInput('#inp-csv-products', '#btn-process-products', 'PRODUCTS');
    setupFileInput('#inp-csv-suppliers', '#btn-process-suppliers', 'SUPPLIERS');

    const showPreview = (headers, rows, type) => {
      const card = container.querySelector('#importer-preview-card');
      const thead = container.querySelector('#importer-preview-table thead');
      const tbody = container.querySelector('#importer-preview-table tbody');
      const title = container.querySelector('#importer-preview-title');

      title.textContent = `Previsualización de Importación: ${rows.length} registros listos (${type})`;
      thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
      tbody.innerHTML = rows.slice(0, 10).map(r => `
        <tr>${headers.map(h => `<td>${r[h] || '-'}</td>`).join('')}</tr>
      `).join('');

      card.style.display = 'block';
      card.scrollIntoView({ behavior: 'smooth' });
    };

    // Confirmar inserción en base de datos
    container.querySelector('#btn-confirm-import').addEventListener('click', async () => {
      if (!pendingImportType || pendingImportRows.length === 0) return;

      try {
        let inserted = 0;

        if (pendingImportType === 'CUSTOMERS') {
          for (const r of pendingImportRows) {
            const cleanNit = (r.NIT_CC || '').replace(/\D/g, '');
            await DB.add(STORES.CUSTOMERS, {
              tenantId,
              codigo: r.Codigo || `CLI-${Math.floor(100 + Math.random() * 900)}`,
              nombre: r.Nombre || 'Cliente Importado',
              nitCc: cleanNit,
              dv: DianDV.calculate(cleanNit) || 0,
              tipoCliente: r.TipoCliente || 'Taller / Detailing',
              telefono: r.Telefono || '',
              ciudad: r.Ciudad || 'Medellín',
              direccion: r.Direccion || '',
              cupoCredito: Number(r.CupoCredito || 0),
              diasCredito: Number(r.DiasCredito || 0),
              saldoPendiente: 0,
              estado: 'ACTIVO'
            });
            inserted++;
          }
        } else if (pendingImportType === 'PRODUCTS') {
          for (const r of pendingImportRows) {
            await DB.add(STORES.PRODUCTS, {
              tenantId,
              sku: r.SKU || `SKU-${Date.now()}`,
              codigoInterno: r.SKU || '',
              nombre: r.Nombre || 'Producto Importado',
              tipoItem: r.TipoItem || 'PRODUCTO_TERMINADO',
              categoria: r.Categoria || 'General',
              unidadMedida: r.UnidadMedida || 'Unidad',
              costoPromedio: Number(r.CostoPromedio || 0),
              stock: Number(r.StockInicial || 0),
              stockMinimo: Number(r.StockMinimo || 10),
              precios: { plist_1: Number(r.Precio1 || 0) },
              estado: 'ACTIVO'
            });
            inserted++;
          }
        } else if (pendingImportType === 'SUPPLIERS') {
          for (const r of pendingImportRows) {
            const cleanNit = (r.NIT || '').replace(/\D/g, '');
            await DB.add(STORES.SUPPLIERS, {
              tenantId,
              codigo: r.Codigo || `PROV-${Math.floor(100 + Math.random() * 900)}`,
              razonSocial: r.RazonSocial || 'Proveedor Importado',
              nitCc: cleanNit,
              dv: DianDV.calculate(cleanNit) || 0,
              contacto: r.Contacto || '',
              telefono: r.Telefono || '',
              ciudad: r.Ciudad || 'Medellín',
              categoria: r.Categoria || 'Materias Primas',
              diasCredito: Number(r.DiasCredito || 30),
              estado: 'ACTIVO'
            });
            inserted++;
          }
        }

        Toast.success(`¡Se importaron ${inserted} registros con éxito!`);
        container.querySelector('#importer-preview-card').style.display = 'none';
        pendingImportRows = [];
      } catch (err) {
        Toast.error('Error durante la importación: ' + err.message);
      }
    });
  }
};
