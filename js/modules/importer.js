/**
 * Nexa ERP - Módulo 18: Importación Masiva de Datos
 * Carga de Clientes, Productos y Proveedores mediante archivos CSV / Excel con previsualización
 */

import { esc } from '../utils/formatters.js';
import { AuditService } from '../services/audit-service.js';
import { KardexService } from '../services/kardex-service.js';
import { PricingService } from '../services/pricing-service.js';
import { parseCSV, parseNumber } from '../utils/csv.js';
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
          <h1>Importación Masiva de Datos (CSV)</h1>
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
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = '\uFEFF' + headers.map(q).join(';') + '\r\n' + sampleRow.map(q).join(';') + '\r\n';
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
        ['SKU', 'Nombre', 'TipoItem', 'Categoria', 'UnidadMedida', 'CostoPromedio', 'Precio1', 'Precio2', 'Precio3', 'Precio4', 'Precio5', 'StockInicial', 'StockMinimo'],
        ['RAYO-LIMP-500', 'Limpiador Cristales Antiempañante 500ml', 'PRODUCTO_TERMINADO', 'Visibilidad', 'Unidad', '6500', '18000', '16000', '14000', '12500', '', '40', '10']
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
          const parsed = parseCSV(e.target.result);
          const headers = parsed.headers;
          const rows = parsed.rows;
          if (rows.length === 0) {
            Toast.warning('El archivo seleccionado no contiene filas de datos.');
            return;
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
      thead.innerHTML = `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`;
      tbody.innerHTML = rows.slice(0, 10).map(r => `
        <tr>${headers.map(h => `<td>${esc(r[h] || '-')}</td>`).join('')}</tr>
      `).join('');

      card.style.display = 'block';
      card.scrollIntoView({ behavior: 'smooth' });
    };

    // Confirmar inserción en base de datos
    container.querySelector('#btn-confirm-import').addEventListener('click', async () => {
      if (!pendingImportType || pendingImportRows.length === 0) return;

      const btnConfirm = container.querySelector('#btn-confirm-import');
      btnConfirm.disabled = true;
      try {
        let inserted = 0;
        const skipped = [];

        if (pendingImportType === 'CUSTOMERS') {
          const existing = await DB.getAll(STORES.CUSTOMERS, tenantId);
          const nits = new Set(existing.map(c => String(c.nitCc || '').replace(/\D/g, '')).filter(Boolean));
          for (const r of pendingImportRows) {
            const cleanNit = (r.NIT_CC || '').replace(/\D/g, '');
            if (!r.Nombre) { skipped.push('fila sin nombre'); continue; }
            if (cleanNit && nits.has(cleanNit)) { skipped.push(`${r.Nombre} (NIT ya existe)`); continue; }
            await DB.add(STORES.CUSTOMERS, {
              tenantId,
              codigo: r.Codigo || '',
              nombre: r.Nombre,
              nitCc: cleanNit,
              dv: DianDV.calculate(cleanNit),
              tipoCliente: r.TipoCliente || 'Consumidor Final',
              telefono: r.Telefono || '',
              ciudad: r.Ciudad || '',
              direccion: r.Direccion || '',
              cupoCredito: parseNumber(r.CupoCredito),
              diasCredito: parseNumber(r.DiasCredito),
              saldoPendiente: 0,
              estado: 'ACTIVO'
            });
            if (cleanNit) nits.add(cleanNit);
            inserted++;
          }
        } else if (pendingImportType === 'PRODUCTS') {
          const existing = await DB.getAll(STORES.PRODUCTS, tenantId);
          const priceLists = await DB.getAll(STORES.PRICE_LISTS, tenantId);
          const skus = new Set(existing.map(p => String(p.sku || '').toLowerCase()));
          for (const r of pendingImportRows) {
            const sku = String(r.SKU || '').trim();
            if (!sku || !r.Nombre) { skipped.push(`${r.Nombre || sku || 'fila'} (falta SKU o nombre)`); continue; }
            if (skus.has(sku.toLowerCase())) { skipped.push(`${sku} (SKU ya existe)`); continue; }
            const precios = {};
            [1, 2, 3, 4, 5].forEach(n => {
              const pl = PricingService.findByCode(priceLists, `P${n}`);
              const v = parseNumber(r[`Precio${n}`]);
              if (pl && v > 0) precios[pl.id] = v;
            });
            const prod = await DB.add(STORES.PRODUCTS, {
              tenantId,
              sku,
              codigoInterno: sku,
              nombre: r.Nombre,
              tipoItem: r.TipoItem || 'PRODUCTO_TERMINADO',
              categoria: r.Categoria || 'General',
              unidadMedida: r.UnidadMedida || 'Unidad',
              costoPromedio: parseNumber(r.CostoPromedio),
              stock: 0,
              stockMinimo: parseNumber(r.StockMinimo),
              precios,
              estado: 'ACTIVO'
            });
            const stockInicial = parseNumber(r.StockInicial);
            if (stockInicial > 0) {
              // El inventario inicial entra por Kardex para que quede trazado y valorizado
              await KardexService.registerMovement({
                tenantId, productoId: prod.id, documentoTipo: 'AJUSTE_POS', documentoNumero: 'INV-INICIAL',
                cantidad: stockInicial, costoUnitario: prod.costoPromedio, observacion: 'Inventario inicial (importación CSV)'
              });
            }
            skus.add(sku.toLowerCase());
            inserted++;
          }
        } else if (pendingImportType === 'SUPPLIERS') {
          const existing = await DB.getAll(STORES.SUPPLIERS, tenantId);
          const nits = new Set(existing.map(c => String(c.nitCc || '').replace(/\D/g, '')).filter(Boolean));
          for (const r of pendingImportRows) {
            const cleanNit = (r.NIT || '').replace(/\D/g, '');
            if (!r.RazonSocial) { skipped.push('fila sin razón social'); continue; }
            if (cleanNit && nits.has(cleanNit)) { skipped.push(`${r.RazonSocial} (NIT ya existe)`); continue; }
            await DB.add(STORES.SUPPLIERS, {
              tenantId,
              codigo: r.Codigo || '',
              razonSocial: r.RazonSocial,
              nitCc: cleanNit,
              dv: DianDV.calculate(cleanNit),
              contacto: r.Contacto || '',
              telefono: r.Telefono || '',
              ciudad: r.Ciudad || '',
              categoria: r.Categoria || 'Materias Primas',
              diasCredito: parseNumber(r.DiasCredito) || 30,
              estado: 'ACTIVO'
            });
            if (cleanNit) nits.add(cleanNit);
            inserted++;
          }
        }

        await AuditService.log({ modulo: 'Importador', accion: 'CREAR', campoModificado: pendingImportType, valorNuevo: `${inserted} importados, ${skipped.length} omitidos` });
        if (skipped.length) Toast.warning(`Omitidos ${skipped.length}: ${skipped.slice(0, 5).join('; ')}${skipped.length > 5 ? '…' : ''}`);
        Toast.success(`Se importaron ${inserted} registros.`);
        container.querySelector('#importer-preview-card').style.display = 'none';
        pendingImportRows = [];
      } catch (err) {
        Toast.error('Error durante la importación: ' + err.message);
      } finally {
        btnConfirm.disabled = false;
      }
    });
  }
};
