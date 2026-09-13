/**
 * Nexa ERP - Módulo 15: Reportes Gerenciales y Centro de Exportaciones
 * Reportes de ventas, cartera, inventario, rentabilidad y exportación a CSV / Excel / PDF
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { ExportService } from '../services/export-service.js';
import { PrintTemplates } from '../components/print-template.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const ReportsModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [sales, products, expenses, customers, cxc, purchases] = await Promise.all([
      DB.getAll(STORES.SALES, tenantId),
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.EXPENSES, tenantId),
      DB.getAll(STORES.CUSTOMERS, tenantId),
      DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
      DB.getAll(STORES.PURCHASES, tenantId)
    ]);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Centro de Reportes Gerenciales</h1>
          <p>Generación de balances operativos, rentabilidad, inventario y exportación oficial en CSV, Excel y PDF</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        
        <!-- REPORTE 1: VENTAS Y FACTURACIÓN -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">📈 Reporte Detallado de Ventas</div>
              <div class="card-subtitle">${sales.length} facturas registradas</div>
            </div>
            <span class="badge badge-success">Ventas</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Historial de facturación con desglose de subtotal, IVA, formas de pago y clientes.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-sales-csv">📥 Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-sales-excel">📊 Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 2: INVENTARIO VALORIZADO -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">📦 Inventario Valorizado & Kardex</div>
              <div class="card-subtitle">${products.length} productos e insumos</div>
            </div>
            <span class="badge badge-info">Stock</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Existencias actuales, costos promedio ponderados, valor total en bodega y alertas de mínimos.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-inv-csv">📥 Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-inv-excel">📊 Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 3: CARTERA Y EDADES DE VENCIMIENTO -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">👥 Estado de Cartera de Clientes</div>
              <div class="card-subtitle">${cxc.filter(c => c.saldo > 0).length} cuentas pendientes</div>
            </div>
            <span class="badge badge-warning">Cobranzas</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Antigüedad de saldos por cliente, días de mora crítica y fechas de vencimiento.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-cxc-csv">📥 Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-cxc-excel">📊 Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 4: GASTOS Y COSTOS OPERATIVOS -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">🏷️ Consolidado de Gastos</div>
              <div class="card-subtitle">${expenses.length} egresos</div>
            </div>
            <span class="badge badge-danger">Egresos</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Gastos por categoría contable (Servicios, Nómina, Combustible, Publicidad, Arriendo).</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-exp-csv">📥 Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-exp-excel">📊 Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 5: CLIENTES PRINCIPALES -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">⭐ Clientes Principales & Volumen</div>
              <div class="card-subtitle">${customers.length} terceros activos</div>
            </div>
            <span class="badge badge-primary">Comercial</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Ranking de clientes por total comprado acumulado, frecuencia y ticket promedio.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-clients-csv">📥 Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-clients-excel">📊 Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 6: ESTADO FINANCIERO EJECUTIVO (PDF) -->
        <div class="card" style="margin-bottom: 0; border: 1px solid var(--brand-primary); background: #f0f9ff;">
          <div class="card-header" style="background: transparent;">
            <div>
              <div class="card-title">📄 Informe Ejecutivo Resumido</div>
              <div class="card-subtitle">Balance consolidado mensual</div>
            </div>
            <span class="badge badge-info">PDF</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Genera el reporte ejecutivo membretado con indicadores de ventas, costos, gastos y margen para gerencia.</p>
            <button class="btn btn-primary btn-sm" id="btn-print-executive-report">🖨️ Generar Informe PDF</button>
          </div>
        </div>

      </div>
    `;

    // Exportadores
    container.querySelector('#btn-export-sales-csv').addEventListener('click', () => {
      ExportService.exportToCSV(sales, 'Ventas_Facturacion', {
        consecutivo: 'Consecutivo',
        fecha: 'Fecha',
        clienteNombre: 'Cliente',
        clienteNit: 'NIT',
        metodoPago: 'Forma Pago',
        subtotal: 'Subtotal',
        impuestos: 'IVA',
        total: 'Total Venta'
      });
    });

    container.querySelector('#btn-export-sales-excel').addEventListener('click', () => {
      ExportService.exportToCSV(sales, 'Ventas_Facturacion_Excel');
    });

    container.querySelector('#btn-export-inv-csv').addEventListener('click', () => {
      ExportService.exportToCSV(products, 'Inventario_Valorizado', {
        sku: 'SKU',
        nombre: 'Producto',
        categoria: 'Categoría',
        tipoItem: 'Tipo',
        unidadMedida: 'Unidad',
        stock: 'Existencias',
        costoPromedio: 'Costo Promedio',
        stockMinimo: 'Stock Mínimo'
      });
    });

    container.querySelector('#btn-export-inv-excel').addEventListener('click', () => {
      ExportService.exportToCSV(products, 'Inventario_Valorizado_Excel');
    });

    container.querySelector('#btn-export-cxc-csv').addEventListener('click', () => {
      ExportService.exportToCSV(cxc, 'Cartera_Cuentas_Cobrar', {
        documento: 'Documento',
        clienteNombre: 'Cliente',
        fechaEmision: 'Emisión',
        fechaVencimiento: 'Vencimiento',
        valorTotal: 'Total',
        abonos: 'Abonos',
        saldo: 'Saldo Pendiente',
        diasMora: 'Días Mora',
        estado: 'Estado'
      });
    });

    container.querySelector('#btn-export-cxc-excel').addEventListener('click', () => {
      ExportService.exportToCSV(cxc, 'Cartera_Cuentas_Cobrar_Excel');
    });

    container.querySelector('#btn-export-exp-csv').addEventListener('click', () => {
      ExportService.exportToCSV(expenses, 'Gastos_Operativos');
    });

    container.querySelector('#btn-export-exp-excel').addEventListener('click', () => {
      ExportService.exportToCSV(expenses, 'Gastos_Operativos_Excel');
    });

    container.querySelector('#btn-export-clients-csv').addEventListener('click', () => {
      ExportService.exportToCSV(customers, 'Clientes_Directorio');
    });

    container.querySelector('#btn-export-clients-excel').addEventListener('click', () => {
      ExportService.exportToCSV(customers, 'Clientes_Directorio_Excel');
    });

    // Informe Ejecutivo en PDF Membretado
    container.querySelector('#btn-print-executive-report').addEventListener('click', () => {
      const totalVentas = sales.reduce((a, s) => a + Number(s.total || 0), 0);
      const totalGastos = expenses.reduce((a, e) => a + Number(e.valor || 0), 0);
      const invValorizado = products.reduce((a, p) => a + (p.stock * p.costoPromedio), 0);
      const carteraActiva = cxc.reduce((a, c) => a + Number(c.saldo || 0), 0);
      const margenEst = Math.max(0, (totalVentas * 0.45) - totalGastos);

      const header = PrintTemplates.getHeader('INFORME EJECUTIVO DE GESTIÓN GERENCIAL', 'INF-2026-01', new Date().toISOString());

      const reportHtml = `
        ${header}

        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">Resumen Ejecutivo del Período</h3>
          <p style="margin: 0; color: #475569; font-size: 13px;">Consolidado contable de operaciones, ingresos de venta, flujo de inventario y estado financiero para <strong>${tenant.nombreComercial}</strong>.</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Indicador Clave de Gestión</th>
              <th class="text-right">Valor Consolidado (COP)</th>
              <th>Detalle Operativo</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Facturación Total Bruta</strong></td>
              <td class="text-right font-bold" style="color: #0284c7;">${Formatters.currency(totalVentas)}</td>
              <td>${sales.length} facturas y remisiones emitidas</td>
            </tr>
            <tr>
              <td><strong>Gastos Operativos & Administrativos</strong></td>
              <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(totalGastos)}</td>
              <td>Servicios, nómina, combustible y fletes</td>
            </tr>
            <tr>
              <td><strong>Inventario Físico Valorizado</strong></td>
              <td class="text-right font-bold">${Formatters.currency(invValorizado)}</td>
              <td>${products.length} referencias en bodegas activas</td>
            </tr>
            <tr>
              <td><strong>Cartera Comercial Pendiente (CXC)</strong></td>
              <td class="text-right font-bold" style="color: #f59e0b;">${Formatters.currency(carteraActiva)}</td>
              <td>Créditos comerciales vigentes</td>
            </tr>
            <tr style="background: #ecfdf5;">
              <td><strong>Utilidad Operativa Estimada</strong></td>
              <td class="text-right font-bold" style="color: #059669; font-size: 15px;">${Formatters.currency(margenEst)}</td>
              <td>Margen bruto estimado ~42% tras egresos</td>
            </tr>
          </tbody>
        </table>

        <div class="doc-footer" style="margin-top: 60px;">
          <p>Informe generado confidencialmente para la junta directiva y gerencia general.</p>
          <p style="margin-top: 4px; font-size: 10px;">Software Nexa ERP Multiempresa • Licenciado para ${tenant.razonSocial}</p>
        </div>
      `;

      ExportService.printDocument(reportHtml, 'Informe_Ejecutivo_Nexa');
    });
  }
};
