/**
 * Nexa ERP - Módulo 1: Dashboard Ejecutivo
 * Métricas KPI, Gráficos comparativos, Panel de Alertas Operativas y Acciones Rápidas
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { renderKpiCard } from '../components/kpi-card.js';
import { TenantServiceInstance } from '../services/tenant-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';

export const DashboardModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    // Cargar datos en paralelo para KPIs
    const [sales, products, expenses, cxc, cxp, shipping, orders] = await Promise.all([
      DB.getAll(STORES.SALES, tenantId),
      DB.getAll(STORES.PRODUCTS, tenantId),
      DB.getAll(STORES.EXPENSES, tenantId),
      DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
      DB.getAll(STORES.PAYABLES_CXP, tenantId),
      DB.getAll(STORES.ORDERS_SHIPPING, tenantId),
      DB.getAll(STORES.PRODUCTION_ORDERS, tenantId)
    ]);

    // Calcular KPIs
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    let ventasDia = 0;
    let ventasMes = 0;
    let ventasAno = 0;
    let costoTotalVentas = 0;

    sales.forEach(s => {
      const sDate = new Date(s.fecha);
      const isToday = s.fecha && s.fecha.startsWith(todayStr);
      const isThisMonth = sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
      const isThisYear = sDate.getFullYear() === currentYear;

      if (isToday) ventasDia += Number(s.total || 0);
      if (isThisMonth) ventasMes += Number(s.total || 0);
      if (isThisYear) ventasAno += Number(s.total || 0);
    });

    const totalGastos = expenses.reduce((acc, exp) => acc + Number(exp.valor || 0), 0);
    const totalCarteraCobrar = cxc.reduce((acc, c) => acc + Number(c.saldo || 0), 0);
    const totalCuentasPagar = cxp.reduce((acc, p) => acc + Number(p.saldo || 0), 0);

    // Inventario valorizado
    const inventarioValorizado = products.reduce((acc, p) => acc + (Number(p.stock || 0) * Number(p.costoPromedio || 0)), 0);

    // Alertas operativas
    const productosStockBajo = products.filter(p => p.stock > 0 && p.stock <= (p.stockMinimo || 15));
    const productosAgotados = products.filter(p => Number(p.stock || 0) <= 0);
    const carteraVencida = cxc.filter(c => c.estado === 'VENCIDO' || (c.diasMora && c.diasMora > 0));
    const enviosPendientes = shipping.filter(s => s.estadoCiclo !== 'ENTREGADO');

    // Utilidad Estimada (Ventas Año - Gastos - Costos estimados aproximados)
    const utilidadEstimada = Math.max(0, (ventasAno * 0.45) - totalGastos);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Dashboard Ejecutivo</h1>
            <span class="badge-demo">DEMO RAYO PRO</span>
          </div>
          <p>Visión general de ventas, cartera, inventario y alertas operativas de <strong>${tenant.nombreComercial}</strong></p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-dashboard">🔄 Actualizar</button>
          <button class="btn btn-primary btn-sm" id="btn-quick-new-sale">⚡ Nueva Venta POS</button>
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN RÁPIDA (COMPACTO) -->
      <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
        <div class="card-body" style="padding: 10px 14px;">
          <div class="text-xs font-bold text-muted mb-1" style="letter-spacing: 0.5px; font-size: 10.5px;">ACCIONES RÁPIDAS OPERATIVAS</div>
          <div class="d-flex flex-wrap gap-1">
            <button class="btn btn-secondary btn-sm" data-nav-to="sales-pos" style="padding: 4px 10px; font-size: 11.5px;">➕ Venta</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="clients" style="padding: 4px 10px; font-size: 11.5px;">👤 Cliente</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="products" style="padding: 4px 10px; font-size: 11.5px;">📦 Producto</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="production" style="padding: 4px 10px; font-size: 11.5px;">⚙️ Producción</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="expenses" style="padding: 4px 10px; font-size: 11.5px;">🏷️ Gasto</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="purchases" style="padding: 4px 10px; font-size: 11.5px;">🛍️ Compra</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="shipping" style="padding: 4px 10px; font-size: 11.5px;">🚚 Envíos</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="cash" style="padding: 4px 10px; font-size: 11.5px;">💵 Caja</button>
          </div>
        </div>
      </div>

      <!-- CENTRO DE RECORDATORIOS & RESUMEN EJECUTIVO (SOCIOS / GERENCIA) -->
      <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-left: 4px solid #25d366;">
        <div class="card-body" style="padding: 12px 16px;">
          <div class="d-flex justify-between items-center flex-wrap gap-3">
            <div>
              <div class="d-flex items-center gap-2">
                <strong style="font-size: 13.5px; color: var(--text-main);">💼 Notificaciones & Resumen Ejecutivo (Socios / Gerencia)</strong>
                <span class="badge badge-success" style="font-size: 10px;">En Vivo</span>
              </div>
              <div class="text-xs text-muted" style="margin-top: 2px;">
                Cierre de jornada laboral, balances periódicos y programación en Google Calendar sin scripts externos.
              </div>
            </div>
            <div class="d-flex items-center gap-2 flex-wrap">
              <button class="btn btn-sm" id="btn-dash-wa-summary" style="background: #25d366; border-color: #25d366; color: #fff; font-weight: 700; font-size: 12px;">
                📲 Resumen Día por WhatsApp
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-dash-email-summary" style="font-size: 12px;">
                📧 Enviar por Correo
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-dash-calendar" style="font-size: 12px;">
                📅 Agendar en Google Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- GRID DE KPIS -->
      <div class="kpi-grid">
        ${renderKpiCard({
          label: 'Ventas del Día',
          value: Formatters.currency(ventasDia),
          icon: '💰',
          iconBg: 'var(--color-success-bg)',
          iconColor: 'var(--color-success)',
          trend: '+12%',
          trendPositive: true,
          footerText: 'vs. día anterior'
        })}

        ${renderKpiCard({
          label: 'Ventas del Mes',
          value: Formatters.currency(ventasMes),
          icon: '📈',
          iconBg: 'var(--brand-primary-light)',
          iconColor: 'var(--brand-primary)',
          trend: '+8.4%',
          trendPositive: true,
          footerText: 'meta mensual 85%'
        })}

        ${renderKpiCard({
          label: 'Inventario Valorizado',
          value: Formatters.currency(inventarioValorizado),
          icon: '📦',
          iconBg: '#f3e8ff',
          iconColor: '#7e22ce',
          footerText: `${products.length} referencias activas`
        })}

        ${renderKpiCard({
          label: 'Utilidad Estimada',
          value: Formatters.currency(utilidadEstimada),
          icon: '💎',
          iconBg: '#ecfdf5',
          iconColor: '#059669',
          footerText: 'Margen global ~42%'
        })}

        ${renderKpiCard({
          label: 'Cuentas por Cobrar',
          value: Formatters.currency(totalCarteraCobrar),
          icon: '👥',
          iconBg: 'var(--color-warning-bg)',
          iconColor: 'var(--color-warning)',
          footerText: `${carteraVencida.length} en mora`
        })}

        ${renderKpiCard({
          label: 'Cuentas por Pagar',
          value: Formatters.currency(totalCuentasPagar),
          icon: '📑',
          iconBg: 'var(--color-danger-bg)',
          iconColor: 'var(--color-danger)',
          footerText: `${cxp.length} facturas proveedores`
        })}

        ${renderKpiCard({
          label: 'Gastos Registrados',
          value: Formatters.currency(totalGastos),
          icon: '🏷️',
          iconBg: '#fff1f2',
          iconColor: '#e11d48',
          footerText: 'Gastos operativos mes'
        })}

        ${renderKpiCard({
          label: 'Envíos en Curso',
          value: `${enviosPendientes.length} Despachos`,
          icon: '🚚',
          iconBg: '#e0f2fe',
          iconColor: '#0369a1',
          footerText: 'Por entregar a clientes'
        })}
      </div>

      <!-- PANEL PRINCIPAL DE GRÁFICOS Y ALERTAS -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;" class="dashboard-columns">
        <!-- COLUMNA IZQUIERDA: GRÁFICOS ANALÍTICOS -->
        <div class="d-flex flex-col gap-4">
          <!-- Gráfico de Ventas Mensuales -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Ventas por Período y Tendencia</div>
                <div class="card-subtitle">Evolución de facturación últimos meses (COP)</div>
              </div>
              <span class="badge badge-info">2026</span>
            </div>
            <div class="card-body">
              <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding-top: 20px; border-bottom: 1px solid var(--border-color); gap: 12px;">
                ${[
                  { m: 'May', val: 18500000, h: 55 },
                  { m: 'Jun', val: 24200000, h: 72 },
                  { m: 'Jul', val: 21900000, h: 65 },
                  { m: 'Ago', val: 29800000, h: 88 },
                  { m: 'Sep', val: ventasMes || 32400000, h: 95 }
                ].map(bar => `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
                    <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">${Formatters.currency(bar.val, 0)}</div>
                    <div style="width: 100%; max-width: 48px; height: ${bar.h}%; background: var(--brand-primary); border-radius: 6px 6px 0 0; transition: height 0.5s ease;"></div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 8px;">${bar.m}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Distribución por Categoría y Métodos de Pago -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title" style="font-size: 14px;">Ventas por Categoría</div>
              </div>
              <div class="card-body">
                <div class="d-flex flex-col gap-3">
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Lavado Exterior (Shampoos)</span>
                      <span>45%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 45%; height: 100%; background: var(--brand-primary);"></div>
                    </div>
                  </div>
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Protección & Ceras</span>
                      <span>30%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 30%; height: 100%; background: var(--brand-secondary);"></div>
                    </div>
                  </div>
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Desengrasantes Pesados</span>
                      <span>15%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 15%; height: 100%; background: #10b981;"></div>
                    </div>
                  </div>
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Accesorios / Microfibras</span>
                      <span>10%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 10%; height: 100%; background: #8b5cf6;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title" style="font-size: 14px;">Métodos de Pago</div>
              </div>
              <div class="card-body">
                <div class="d-flex flex-col gap-2 text-xs">
                  <div class="d-flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>📱 Nequi / Daviplata</span>
                    <strong style="color: #6366f1;">35% ($ 1.130.000)</strong>
                  </div>
                  <div class="d-flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>💵 Efectivo en Caja</span>
                    <strong style="color: #10b981;">30% ($ 960.000)</strong>
                  </div>
                  <div class="d-flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>💳 Transferencia Bancaria</span>
                    <strong style="color: var(--brand-primary);">20% ($ 640.000)</strong>
                  </div>
                  <div class="d-flex justify-between items-center" style="padding: 6px 0;">
                    <span>📑 Crédito Directo 30 días</span>
                    <strong style="color: #f59e0b;">15% ($ 480.000)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: PANEL DE ALERTAS OPERATIVAS -->
        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Alertas de Operación</div>
              <span class="badge badge-danger">${productosStockBajo.length + productosAgotados.length + carteraVencida.length}</span>
            </div>
            <div class="card-body" style="padding: 12px 16px;">
              <div class="d-flex flex-col gap-2">
                ${productosAgotados.map(p => `
                  <div class="alert alert-danger" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">❌ Producto Agotado</div>
                      <div class="text-xs">${p.nombre} (Stock: 0 ${p.unidadMedida})</div>
                      <a href="#production" class="text-xs font-bold text-danger" style="text-decoration: underline; margin-top: 4px; display: inline-block;">Programar Producción →</a>
                    </div>
                  </div>
                `).join('')}

                ${productosStockBajo.map(p => `
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">⚠️ Stock Crítico Mínimo</div>
                      <div class="text-xs">${p.nombre} (Existencias: ${p.stock} / Mínimo: ${p.stockMinimo})</div>
                    </div>
                  </div>
                `).join('')}

                ${carteraVencida.map(c => `
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">⏰ Factura en Mora</div>
                      <div class="text-xs">${c.clienteNombre} - Doc ${c.documento} - Saldo: ${Formatters.currency(c.saldo)}</div>
                    </div>
                  </div>
                `).join('')}

                ${productosStockBajo.length === 0 && productosAgotados.length === 0 && carteraVencida.length === 0 ? `
                  <div class="text-center text-muted" style="padding: 20px;">
                    ✓ Todas las operaciones se encuentran al día. Sin alertas activas.
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- ESTADO DE FACTURACIÓN DIAN -->
          <div class="card" style="border-left: 4px solid var(--brand-secondary);">
            <div class="card-header">
              <div class="card-title" style="font-size: 14px;">Facturación Electrónica DIAN</div>
            </div>
            <div class="card-body" style="padding: 14px 16px;">
              <div class="text-xs text-muted mb-2">
                Ambiente de Facturación Electrónica en Colombia:
              </div>
              <div class="badge badge-warning mb-2">Integración Pendiente de Configuración</div>
              <p class="text-xs" style="color: var(--text-secondary); line-height: 1.4;">
                El sistema almacena consecutivos fiscales y genera documentos equivalentes POS conformes a la normativa interna. Para emitir CUFE y XML validado se requiere enlazar el certificado digital o proveedor tecnológico en el módulo de integraciones.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eventos de botones
    container.querySelector('#btn-refresh-dashboard').addEventListener('click', () => {
      this.render(container);
    });

    container.querySelector('#btn-quick-new-sale').addEventListener('click', () => {
      window.location.hash = '#sales-pos';
    });

    container.querySelectorAll('[data-nav-to]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-nav-to');
        window.location.hash = `#${target}`;
      });
    });

    // 1. Resumen Diario por WhatsApp para Socios / Gerencia
    const btnWaSummary = container.querySelector('#btn-dash-wa-summary');
    if (btnWaSummary) {
      btnWaSummary.addEventListener('click', () => {
        const todayFormatted = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const defaultSummaryText = 
`📊 *RESUMEN EJECUTIVO DIARIO - ${tenant.nombreComercial}*
📅 *Fecha:* ${todayFormatted}

💰 *Ventas del Día:* ${Formatters.currency(ventasDia)}
📈 *Ventas Acumuladas Mes:* ${Formatters.currency(ventasMes)}
💎 *Utilidad Estimada Mes:* ${Formatters.currency(utilidadEstimada)}
⚠️ *Cartera Pendiente Total:* ${Formatters.currency(totalCarteraCobrar)}
🚨 *Cartera en Mora:* ${Formatters.currency(carteraVencida.reduce((a, b) => a + Number(b.saldo || 0), 0))} (${carteraVencida.length} cuentas)
📦 *Inventario Valorizado:* ${Formatters.currency(inventarioValorizado)} (${products.length} referencias)
🚚 *Despachos Activos:* ${enviosPendientes.length} órdenes en curso

${productosStockBajo.length > 0 ? `⚠️ *Productos con Stock Bajo:* ${productosStockBajo.map(p => p.nombre + ' (' + p.stock + ')').join(', ')}\n` : ''}
✅ Cierre y monitoreo generado desde Nexa ERP.`;

        Modal.show({
          title: '📲 Enviar Resumen Diario a Socios por WhatsApp',
          size: 'md',
          content: `
            <div class="mb-3" style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 8px; padding: 12px 14px;">
              <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 2px;">
                Resumen Ejecutivo Listo para WhatsApp Web
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary);">
                Este informe consolida las ventas, recaudo, cartera e inventario de hoy. Ingrese el número del socio o el grupo de socios.
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label font-bold">Número de WhatsApp (Socio o Gerente)</label>
              <input type="text" class="form-control font-bold" id="dash-wa-phone" value="${tenant.whatsapp ? tenant.whatsapp.replace(/\D/g, '') : '57'}" placeholder="Ej: 573124567890">
            </div>

            <div class="form-group mb-3">
              <label class="form-label font-bold">Mensaje Ejecutivo a Enviar</label>
              <textarea class="form-control" id="dash-wa-text" rows="10" style="font-size: 12px; font-family: monospace; line-height: 1.4;">${defaultSummaryText}</textarea>
            </div>
          `,
          footerButtons: [
            { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
            {
              label: '💬 Abrir en WhatsApp Web y Enviar',
              class: 'btn-primary',
              onClick: () => {
                const phoneInp = document.getElementById('dash-wa-phone');
                const textInp = document.getElementById('dash-wa-text');
                const phone = (phoneInp ? phoneInp.value : '').replace(/\D/g, '');
                const text = textInp ? textInp.value : defaultSummaryText;
                
                if (!phone || phone.length < 10) {
                  Toast.warning('Por favor ingrese un número de teléfono válido.');
                  return;
                }

                window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank');
                Toast.success('Abriendo WhatsApp Web con el resumen del día...');
                Modal.close();
              }
            }
          ]
        });
      });
    }

    // 2. Resumen por Correo
    const btnEmailSummary = container.querySelector('#btn-dash-email-summary');
    if (btnEmailSummary) {
      btnEmailSummary.addEventListener('click', () => {
        const todayFormatted = new Date().toLocaleDateString('es-CO');
        const subject = `Resumen Ejecutivo Diario - ${tenant.nombreComercial} (${todayFormatted})`;
        const body = `Resumen Ejecutivo Diario - ${tenant.nombreComercial}\nFecha: ${todayFormatted}\n\nVentas del Día: ${Formatters.currency(ventasDia)}\nVentas Mes: ${Formatters.currency(ventasMes)}\nUtilidad Estimada: ${Formatters.currency(utilidadEstimada)}\nCartera Pendiente: ${Formatters.currency(totalCarteraCobrar)}\nInventario: ${Formatters.currency(inventarioValorizado)}\n\nGenerado por Nexa ERP.`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      });
    }

    // 3. Agendar Cierres y Fechas en Google Calendar
    const btnCalendar = container.querySelector('#btn-dash-calendar');
    if (btnCalendar) {
      btnCalendar.addEventListener('click', () => {
        const todayRaw = new Date().toISOString().split('T')[0].replace(/-/g, '');
        
        // Fin de mes actual
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const endOfMonthRaw = endOfMonth.toISOString().split('T')[0].replace(/-/g, '');

        // Fin de año actual
        const endOfYearRaw = `${now.getFullYear()}1231`;

        Modal.show({
          title: '📅 Programar Cierres & Recordatorios en Google Calendar',
          size: 'md',
          content: `
            <p class="text-xs text-muted mb-3">
              Seleccione el evento que desea agendar en su Google Calendar personal o institucional para recibir alertas automáticas:
            </p>
            <div class="d-flex flex-col gap-2">
              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">💰 Cierre de Caja & Arqueo Diario</strong>
                  <div class="text-xs text-muted">Recordatorio para hoy al finalizar la jornada (6:30 PM)</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-daily">📅 Agendar</button>
              </div>

              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">📦 Cierre Mensual de Inventario & Balances</strong>
                  <div class="text-xs text-muted">Programar para el último día del mes en curso</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-monthly">📅 Agendar</button>
              </div>

              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">🏛️ Vencimiento DIAN: IVA & Retención</strong>
                  <div class="text-xs text-muted">Recordatorio tributario para declaración bimestral DIAN</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-dian">📅 Agendar</button>
              </div>

              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">🏁 Cierre Fiscal de Fin de Año & Estados Financieros</strong>
                  <div class="text-xs text-muted">Programado para el 31 de Diciembre</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-yearly">📅 Agendar</button>
              </div>
            </div>
          `,
          footerButtons: [
            { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }
          ]
        });

        // Listeners internos del modal de calendario
        const launchGCal = (title, start, end, details) => {
          const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=Rayo+Pro+Colombia`;
          window.open(url, '_blank');
          Toast.info('Abriendo Google Calendar...');
        };

        document.getElementById('btn-gcal-daily')?.addEventListener('click', () => {
          launchGCal(
            `Cierre de Caja y Arqueo Diario - ${tenant.nombreComercial}`,
            `${todayRaw}T183000Z`, `${todayRaw}T190000Z`,
            `Conciliación de efectivo físico, transferencias Nequi/Daviplata y envío de reporte a socios en Nexa ERP.`
          );
        });

        document.getElementById('btn-gcal-monthly')?.addEventListener('click', () => {
          launchGCal(
            `Cierre Mensual de Inventario y Contabilidad - ${tenant.nombreComercial}`,
            `${endOfMonthRaw}T170000Z`, `${endOfMonthRaw}T190000Z`,
            `Auditoría de existencias físicas en bodega vs Kardex y balance general mensual en Nexa ERP.`
          );
        });

        document.getElementById('btn-gcal-dian')?.addEventListener('click', () => {
          launchGCal(
            `Vencimiento Tributario DIAN (IVA / ReteFuente) - ${tenant.nombreComercial}`,
            `${endOfMonthRaw}T140000Z`, `${endOfMonthRaw}T160000Z`,
            `Presentación y pago de obligaciones tributarias DIAN para NIT ${tenant.nit}-${tenant.dv}.`
          );
        });

        document.getElementById('btn-gcal-yearly')?.addEventListener('click', () => {
          launchGCal(
            `Cierre Anual Fiscal y Balance General - ${tenant.nombreComercial}`,
            `${endOfYearRaw}T150000Z`, `${endOfYearRaw}T180000Z`,
            `Cierre de ejercicio fiscal anual, inventario total valorizado y distribución de utilidades a socios.`
          );
        });
      });
    }
  }
};
