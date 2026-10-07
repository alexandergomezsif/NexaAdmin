/**
 * Nexa ERP - Módulo 15: Reportes Gerenciales y Centro de Exportaciones
 * Reportes de ventas, cartera, inventario, rentabilidad y exportación a CSV / Excel / PDF
 */

import { FinanceService } from '../services/finance-service.js';
import { DB, STORES } from '../services/db-service.js';
import { Formatters, esc } from '../utils/formatters.js';
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

      <!-- RENTABILIDAD POR PRODUCTO -->
      <div class="card mb-3" id="profit-card">
        <div class="pricing-toolbar">
          <strong>Rentabilidad por producto</strong>
          <select class="form-select" id="profit-period" style="max-width: 180px;">
            <option value="mes">Mes actual</option>
            <option value="mesAnt">Mes anterior</option>
            <option value="anio">Año actual</option>
            <option value="todo">Todo</option>
          </select>
          <span class="text-xs text-muted">Ventas sin IVA, sin cotizaciones ni anuladas. Costo = costo de producción o compra registrado al vender.</span>
          <button class="btn btn-secondary btn-sm" id="btn-export-profit" style="margin-left: auto;">Exportar CSV</button>
        </div>
        <div class="table-responsive" id="profit-table"></div>
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
    // Rentabilidad por producto
    let profitRows = [];
    const renderProfit = () => {
      const now = new Date();
      const per = FinanceService.periods(now);
      const sel = container.querySelector('#profit-period').value;
      const range = sel === 'mes' ? per.mes : sel === 'anio' ? per.anio
        : sel === 'mesAnt' ? { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) }
        : { from: null, to: null };
      profitRows = FinanceService.byProduct(sales, products, range.from, range.to);
      const tot = profitRows.reduce((a, r) => ({ u: a.u + r.unidades, v: a.v + r.ventasNetas, c: a.c + r.costo, g: a.g + r.utilidad }), { u: 0, v: 0, c: 0, g: 0 });
      const mg = (m) => m === null ? '—' : `<span class="mg ${m < 10 ? 'mg-bad' : m < 20 ? 'mg-warn' : 'mg-ok'}">${m}%</span>`;
      container.querySelector('#profit-table').innerHTML = profitRows.length ? `
        <table class="table pricing-table">
          <thead><tr><th>Producto</th><th class="text-right">Unidades</th><th class="text-right">Ventas netas</th><th class="text-right">Costo vendido</th><th class="text-right">Utilidad bruta</th><th class="text-right">Margen</th></tr></thead>
          <tbody>
            ${profitRows.map(r => `<tr>
              <td><strong>${esc(r.nombre)}</strong> <span class="text-xs text-muted">${esc(r.sku)}</span>${r.costoEstimado ? ' <span class="text-xs text-warning" title="Ventas antiguas sin costo guardado: se usó el costo promedio actual">costo estimado</span>' : ''}</td>
              <td class="text-right">${Formatters.number(r.unidades, Number.isInteger(r.unidades) ? 0 : 2)}</td>
              <td class="text-right">${Formatters.currency(r.ventasNetas)}</td>
              <td class="text-right">${Formatters.currency(r.costo)}</td>
              <td class="text-right ${r.utilidad < 0 ? 'text-danger' : ''}"><strong>${Formatters.currency(r.utilidad)}</strong></td>
              <td class="text-right">${mg(r.margenPct)}</td></tr>`).join('')}
            <tr><td><strong>Total</strong></td><td class="text-right">${Formatters.number(tot.u, Number.isInteger(tot.u) ? 0 : 2)}</td><td class="text-right"><strong>${Formatters.currency(tot.v)}</strong></td><td class="text-right"><strong>${Formatters.currency(tot.c)}</strong></td><td class="text-right"><strong>${Formatters.currency(tot.g)}</strong></td><td class="text-right">${mg(tot.v > 0 ? Math.round((tot.g / tot.v) * 1000) / 10 : null)}</td></tr>
          </tbody>
        </table>` : '<div class="p-4 text-center text-muted">No hay ventas en este periodo.</div>';
    };
    container.querySelector('#profit-period').addEventListener('change', renderProfit);
    container.querySelector('#btn-export-profit').addEventListener('click', () => {
      ExportService.exportToCSV(profitRows, 'Rentabilidad_por_producto', {
        sku: 'SKU', nombre: 'Producto', unidades: 'Unidades', ventasNetas: 'Ventas netas (sin IVA)', costo: 'Costo vendido', utilidad: 'Utilidad bruta', margenPct: 'Margen %'
      });
    });
    renderProfit();

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
      const P = FinanceService.periods();
      const periodo = P.anio;
      const fin = FinanceService.summarize({ sales, expenses, products, from: periodo.from, to: periodo.to });
      const totalVentas = fin.ventasNetas;
      const totalGastos = fin.gastos;
      const invValorizado = products.reduce((a, p) => a + (Number(p.stock || 0) * Number(p.costoPromedio || 0)), 0);
      const carteraActiva = cxc.filter(c => c.estado !== 'ANULADA').reduce((a, c) => a + Number(c.saldo || 0), 0);
      const margenEst = fin.utilidadOperativa;

      const header = PrintTemplates.getHeader('INFORME EJECUTIVO DE GESTIÓN', `INF-${new Date().getFullYear()}`, new Date().toISOString());

        const maxVal = Math.max(totalVentas, totalGastos, carteraActiva, 1);
        const wVentas = Math.round((totalVentas / maxVal) * 100);
        const wGastos = Math.round((totalGastos / maxVal) * 100);
        const wCartera = Math.round((carteraActiva / maxVal) * 100);

        const reportHtml = `
          ${header}

          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">Resumen Ejecutivo del Período</h3>
            <p style="margin: 0; color: #475569; font-size: 13px;">Consolidado contable de operaciones, ingresos de venta, flujo de inventario y estado financiero para <strong>${esc(tenant.nombreComercial)}</strong>.</p>
          </div>

          <!-- GRÁFICO GERENCIAL INCRUSTADO (HTML/CSS Puro) -->
          <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e5ea; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; font-size: 13px; color: #1d1d1f; border-bottom: 1px solid #eee; padding-bottom: 8px;">Indicadores Financieros - Gráfico Comparativo</h4>
            
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 120px; font-size: 12px; font-weight: bold; color: #0284c7;">Ventas netas</div>
              <div style="flex: 1; background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${wVentas}%; background: #0284c7; height: 100%;"></div>
              </div>
              <div style="width: 100px; text-align: right; font-size: 12px; font-weight: bold;">${Formatters.currency(totalVentas)}</div>
            </div>

            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 120px; font-size: 12px; font-weight: bold; color: #ef4444;">Gastos</div>
              <div style="flex: 1; background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${wGastos}%; background: #ef4444; height: 100%;"></div>
              </div>
              <div style="width: 100px; text-align: right; font-size: 12px; font-weight: bold;">${Formatters.currency(totalGastos)}</div>
            </div>

            <div style="display: flex; align-items: center;">
              <div style="width: 120px; font-size: 12px; font-weight: bold; color: #f59e0b;">Cartera CXC</div>
              <div style="flex: 1; background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${wCartera}%; background: #f59e0b; height: 100%;"></div>
              </div>
              <div style="width: 100px; text-align: right; font-size: 12px; font-weight: bold;">${Formatters.currency(carteraActiva)}</div>
            </div>
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
                <td><strong>Ventas netas (sin IVA)</strong></td>
                <td class="text-right font-bold" style="color: #0284c7;">${Formatters.currency(totalVentas)}</td>
                <td>${fin.n} ventas del año (excluye cotizaciones y anuladas). IVA generado: ${Formatters.currency(fin.iva)}</td>
              </tr>
              <tr>
                <td><strong>Costo de la mercancía vendida</strong></td>
                <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(fin.costoVentas)}</td>
                <td>${fin.costoEstimado ? 'Incluye ventas antiguas con costo estimado al costo promedio actual' : 'Costo registrado en Kardex al momento de cada venta'}</td>
              </tr>
              <tr>
                <td><strong>Comisiones freelance</strong></td>
                <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(fin.comisiones)}</td>
                <td>Causadas en ventas del año</td>
              </tr>
              <tr>
                <td><strong>Gastos Operativos & Administrativos</strong></td>
                <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(totalGastos)}</td>
                <td>Gastos registrados en el año</td>
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
              <tr style="background: ${margenEst >= 0 ? '#ecfdf5' : '#fef2f2'};">
                <td><strong>Utilidad operativa del año</strong></td>
                <td class="text-right font-bold" style="color: ${margenEst >= 0 ? '#059669' : '#dc2626'}; font-size: 15px;">${Formatters.currency(margenEst)}</td>
                <td>Ventas netas − costo − comisiones − gastos${fin.margenBrutoPct !== null ? ` · margen bruto ${fin.margenBrutoPct.toFixed(1)}%` : ''}</td>
              </tr>
            </tbody>
          </table>

          <div class="doc-footer" style="margin-top: 40px;">
          <p>Informe generado confidencialmente para la junta directiva y gerencia general.</p>
          <p style="margin-top: 4px; font-size: 10px;">Cifras de gestión interna; no reemplazan los estados financieros elaborados por el contador.</p>
        </div>
      `;

      ExportService.printDocument(reportHtml, 'Informe_Ejecutivo_Nexa');
    });
  }
};
