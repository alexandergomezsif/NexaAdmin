/**
 * Nexa ERP - Módulo: Red de Vendedores Freelance
 * Gestión de vendedores independientes, comisiones y liquidaciones
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const FreelancersModule = {

  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [allSuppliers, allSales, allCxp] = await Promise.all([
      DB.getAll(STORES.SUPPLIERS, tenantId),
      DB.getAll(STORES.SALES, tenantId),
      DB.getAll(STORES.PAYABLES_CXP, tenantId)
    ]);

    const freelancers = allSuppliers.filter(s => s.tipo === 'FREELANCER');
    const freelanceSales = allSales.filter(s => s.esVentaFreelance);

    // KPIs generales
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    const salesMes = freelanceSales.filter(s => {
      const d = new Date(s.fecha);
      return d.getMonth() === mesActual && d.getFullYear() === anioActual;
    });
    const comisionesPendientes = allCxp.filter(c => c.tipoDocumento === 'COMISION_FREELANCE' && c.saldo > 0)
      .reduce((acc, c) => acc + Number(c.saldo || 0), 0);
    const totalFacturadoMes = salesMes.reduce((acc, s) => acc + Number(s.total || 0), 0);
    const vendedorMes = (() => {
      const counts = {};
      salesMes.forEach(s => {
        if (s.freelancerId) {
          counts[s.freelancerId] = (counts[s.freelancerId] || { nombre: s.vendedorNombre, total: 0 });
          counts[s.freelancerId].total += s.total || 0;
        }
      });
      const sorted = Object.values(counts).sort((a, b) => b.total - a.total);
      return sorted[0] ? sorted[0].nombre : '—';
    })();

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>🤝 Red de Vendedores Freelance</h1>
          <p>Gestión de vendedores independientes, comisiones automáticas y liquidaciones</p>
        </div>
        <div class="view-actions">
          <a href="#clients" class="btn btn-secondary btn-sm" style="text-decoration: none;">👥 Directorio Clientes</a>
          <button class="btn btn-primary" id="btn-nuevo-freelancer">+ Registrar Vendedor</button>
        </div>
      </div>

      <div class="kpi-grid mb-4" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div class="kpi-card">
          <div class="kpi-label">Vendedores Activos</div>
          <div class="kpi-value" style="color: var(--brand-primary);">${freelancers.filter(f => f.estado === 'ACTIVO').length}</div>
          <div class="kpi-footer">de ${freelancers.length} registrados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Comisiones Pendientes</div>
          <div class="kpi-value text-danger">${Formatters.currency(comisionesPendientes)}</div>
          <div class="kpi-footer">por liquidar este período</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ventas via Freelance (mes)</div>
          <div class="kpi-value text-success">${Formatters.currency(totalFacturadoMes)}</div>
          <div class="kpi-footer">${salesMes.length} transacciones</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Top Vendedor del Mes</div>
          <div class="kpi-value" style="font-size: 18px; color: var(--text-main);">🏆</div>
          <div class="kpi-footer" style="font-weight: 700; color: var(--brand-primary);">${vendedorMes}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Directorio de Vendedores Freelance</div>
        </div>
        <div class="card-body p-0">
          ${freelancers.length === 0 ? `
            <div class="text-center text-muted" style="padding: 40px;">
              <div style="font-size: 40px; margin-bottom: 12px;">🤝</div>
              <p style="font-weight: 600; margin-bottom: 8px;">No hay vendedores registrados</p>
              <p class="text-xs">Haz clic en "Registrar Vendedor" para comenzar tu red de ventas freelance.</p>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table class="table" style="margin: 0;">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th>Zona</th>
                    <th>Ventas este mes</th>
                    <th>Comisión ganada</th>
                    <th>Pendiente de pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${freelancers.map(f => {
                    const fSales = freelanceSales.filter(s => s.freelancerId === f.id);
                    const fSalesMes = fSales.filter(s => {
                      const d = new Date(s.fecha);
                      return d.getMonth() === mesActual && d.getFullYear() === anioActual;
                    });
                    const ganada = fSales.reduce((acc, s) => acc + Number(s.comisionFreelance || 0), 0);
                    const pendiente = allCxp.filter(c => c.tipoDocumento === 'COMISION_FREELANCE' && c.proveedorId === f.id && c.saldo > 0)
                      .reduce((acc, c) => acc + Number(c.saldo || 0), 0);
                    return `
                      <tr>
                        <td>
                          <div class="font-bold">${f.nombre}</div>
                          <div class="text-xs text-muted">${f.nitCc ? 'CC: ' + f.nitCc : ''} ${f.telefono ? '· ' + f.telefono : ''}</div>
                        </td>
                        <td><span class="badge badge-info" style="font-size: 10px;">${f.zona || '—'}</span></td>
                        <td>
                          <strong>${fSalesMes.length}</strong> ventas
                          <div class="text-xs text-muted">${Formatters.currency(fSalesMes.reduce((a, s) => a + s.total, 0))}</div>
                        </td>
                        <td class="font-bold text-success">${Formatters.currency(ganada)}</td>
                        <td>
                          ${pendiente > 0
                            ? `<strong class="text-danger">${Formatters.currency(pendiente)}</strong>`
                            : `<span class="badge badge-success">Al día</span>`}
                        </td>
                        <td>
                          <span class="badge ${f.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}">
                            ${f.estado || 'ACTIVO'}
                          </span>
                        </td>
                        <td>
                          <div class="d-flex gap-2">
                            <button class="btn btn-secondary btn-sm btn-ver-freelancer" data-id="${f.id}">Ver</button>
                            ${pendiente > 0 ? `<button class="btn btn-primary btn-sm btn-liquidar-freelancer" data-id="${f.id}" data-nombre="${f.nombre}" data-pendiente="${pendiente}">💸 Liquidar</button>` : ''}
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    // Botón nuevo freelancer
    container.querySelector('#btn-nuevo-freelancer').addEventListener('click', () => {
      this.openFreelancerWizard(null, tenantId, () => this.render(container));
    });

    // Ver detalle
    container.querySelectorAll('.btn-ver-freelancer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const f = freelancers.find(x => x.id === id);
        if (f) this.openFreelancerDetail(f, freelanceSales, allCxp, tenantId, () => this.render(container));
      });
    });

    // Liquidar comisiones
    container.querySelectorAll('.btn-liquidar-freelancer').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const nombre = btn.getAttribute('data-nombre');
        const pendiente = Number(btn.getAttribute('data-pendiente'));
        const cxpItems = allCxp.filter(c => c.tipoDocumento === 'COMISION_FREELANCE' && c.proveedorId === id && c.saldo > 0);
        this.openLiquidarModal(id, nombre, pendiente, cxpItems, () => this.render(container));
      });
    });
  },

  openFreelancerWizard(freelancer, tenantId, onSaved) {
    const isEdit = !!freelancer;
    const f = freelancer || {};

    const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card" style="margin: 0; background: var(--bg-surface-solid); border: 1px solid var(--border-color);">
          <div class="card-body" style="padding: 16px;">
            <div class="font-bold text-xs text-muted mb-3" style="text-transform: uppercase; letter-spacing: 0.5px;">Datos Personales</div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Nombre Completo *</label>
                <input type="text" class="form-control" id="fl-nombre" value="${f.nombre || ''}" placeholder="Ej: Carlos Mendoza" required>
              </div>
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Cédula / NIT</label>
                <input type="text" class="form-control" id="fl-cedula" value="${f.nitCc || ''}" placeholder="Ej: 1234567890">
              </div>
            </div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Teléfono / WhatsApp</label>
                <input type="text" class="form-control" id="fl-telefono" value="${f.telefono || ''}" placeholder="3001234567">
              </div>
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="fl-email" value="${f.email || ''}" placeholder="correo@gmail.com">
              </div>
            </div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-0" style="flex: 1;">
                <label class="form-label">Zona de Ventas</label>
                <input type="text" class="form-control" id="fl-zona" value="${f.zona || ''}" placeholder="Ej: Medellín Norte, Eje Cafetero...">
              </div>
              <div class="form-group mb-0" style="flex: 1;">
                <label class="form-label">Estado</label>
                <select class="form-select" id="fl-estado">
                  <option value="ACTIVO" ${(!f.estado || f.estado === 'ACTIVO') ? 'selected' : ''}>Activo</option>
                  <option value="INACTIVO" ${f.estado === 'INACTIVO' ? 'selected' : ''}>Inactivo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin: 0; background: var(--bg-surface-solid); border: 1px solid var(--border-color);">
          <div class="card-body" style="padding: 16px;">
            <div class="font-bold text-xs text-muted mb-3" style="text-transform: uppercase; letter-spacing: 0.5px;">Datos Bancarios (para pago de comisiones)</div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Banco</label>
                <select class="form-select" id="fl-banco">
                  <option value="">Seleccione banco...</option>
                  <option value="Bancolombia" ${(f.datosBancarios||{}).banco === 'Bancolombia' ? 'selected' : ''}>Bancolombia</option>
                  <option value="Davivienda" ${(f.datosBancarios||{}).banco === 'Davivienda' ? 'selected' : ''}>Davivienda</option>
                  <option value="Banco de Bogotá" ${(f.datosBancarios||{}).banco === 'Banco de Bogotá' ? 'selected' : ''}>Banco de Bogotá</option>
                  <option value="BBVA" ${(f.datosBancarios||{}).banco === 'BBVA' ? 'selected' : ''}>BBVA</option>
                  <option value="Nequi" ${(f.datosBancarios||{}).banco === 'Nequi' ? 'selected' : ''}>Nequi</option>
                  <option value="Daviplata" ${(f.datosBancarios||{}).banco === 'Daviplata' ? 'selected' : ''}>Daviplata</option>
                  <option value="Otro" ${(f.datosBancarios||{}).banco === 'Otro' ? 'selected' : ''}>Otro</option>
                </select>
              </div>
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Tipo de Cuenta</label>
                <select class="form-select" id="fl-tipo-cuenta">
                  <option value="Ahorros" ${(f.datosBancarios||{}).tipoCuenta === 'Ahorros' ? 'selected' : ''}>Ahorros</option>
                  <option value="Corriente" ${(f.datosBancarios||{}).tipoCuenta === 'Corriente' ? 'selected' : ''}>Corriente</option>
                </select>
              </div>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">Número de Cuenta</label>
              <input type="text" class="form-control" id="fl-num-cuenta" value="${(f.datosBancarios||{}).numeroCuenta || ''}" placeholder="Ej: 12345678901">
            </div>
          </div>
        </div>

        <div class="card" style="margin: 0; background: rgba(0,113,227,0.04); border: 1px dashed var(--brand-primary);">
          <div class="card-body" style="padding: 12px 16px;">
            <div class="text-xs" style="color: var(--brand-primary);">
              💡 <strong>¿Cómo funciona la comisión?</strong> El precio base del vendedor es <strong>Precio 3</strong>.
              Puede vender entre Precio 3 y Precio 1. Su comisión = precio vendido − Precio 3 por unidad.
              Se registra automáticamente en Cuentas por Pagar al finalizar cada venta.
            </div>
          </div>
        </div>
      </div>
    `;

    const dialog = Modal.show({
      title: isEdit ? 'Editar Vendedor Freelance' : 'Registrar Nuevo Vendedor Freelance',
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: isEdit ? 'Guardar Cambios' : 'Registrar Vendedor',
          class: 'btn-primary',
          onClick: async () => {
            const nombre = dialog.querySelector('#fl-nombre').value.trim();
            if (!nombre) { Toast.warning('El nombre es obligatorio.'); return; }

            const payload = {
              ...(f.id ? { id: f.id } : {}),
              tenantId,
              nombre,
              nitCc: dialog.querySelector('#fl-cedula').value.trim(),
              telefono: dialog.querySelector('#fl-telefono').value.trim(),
              email: dialog.querySelector('#fl-email').value.trim(),
              zona: dialog.querySelector('#fl-zona').value.trim(),
              estado: dialog.querySelector('#fl-estado').value,
              tipo: 'FREELANCER',
              precioBaseId: 'plist_3',
              datosBancarios: {
                banco: dialog.querySelector('#fl-banco').value,
                tipoCuenta: dialog.querySelector('#fl-tipo-cuenta').value,
                numeroCuenta: dialog.querySelector('#fl-num-cuenta').value.trim()
              },
              comisionesTotalesGanadas: f.comisionesTotalesGanadas || 0,
              comisionesTotalesPagadas: f.comisionesTotalesPagadas || 0,
              creadoEn: f.creadoEn || new Date().toISOString()
            };

            if (isEdit) {
              await DB.update(STORES.SUPPLIERS, payload);
              Toast.success(`Vendedor "${nombre}" actualizado.`);
            } else {
              await DB.add(STORES.SUPPLIERS, payload);
              Toast.success(`Vendedor "${nombre}" registrado en la red freelance.`);
            }
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  },

  openFreelancerDetail(f, allSales, allCxp, tenantId, onSaved) {
    const fSales = allSales.filter(s => s.freelancerId === f.id);
    const fCxp = allCxp.filter(c => c.tipoDocumento === 'COMISION_FREELANCE' && c.proveedorId === f.id);
    const totalGanado = fSales.reduce((acc, s) => acc + Number(s.comisionFreelance || 0), 0);
    const totalPendiente = fCxp.filter(c => c.saldo > 0).reduce((acc, c) => acc + Number(c.saldo || 0), 0);

    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 0;">
          <div class="kpi-card" style="padding: 12px;">
            <div class="kpi-label">Total Ventas</div>
            <div class="kpi-value" style="font-size: 22px; color: var(--brand-primary);">${fSales.length}</div>
          </div>
          <div class="kpi-card" style="padding: 12px;">
            <div class="kpi-label">Comisión Ganada</div>
            <div class="kpi-value text-success" style="font-size: 18px;">${Formatters.currency(totalGanado)}</div>
          </div>
          <div class="kpi-card" style="padding: 12px;">
            <div class="kpi-label">Por Cobrar</div>
            <div class="kpi-value text-danger" style="font-size: 18px;">${Formatters.currency(totalPendiente)}</div>
          </div>
        </div>

        <div style="background: var(--bg-surface-solid); border-radius: 8px; border: 1px solid var(--border-color); padding: 12px;">
          <div class="font-bold text-xs text-muted mb-2" style="text-transform: uppercase;">Datos de Contacto</div>
          <div class="text-xs" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>📱 ${f.telefono || '—'}</div>
            <div>📧 ${f.email || '—'}</div>
            <div>🪪 CC: ${f.nitCc || '—'}</div>
            <div>📍 Zona: ${f.zona || '—'}</div>
            <div>🏦 ${(f.datosBancarios||{}).banco || '—'} ${(f.datosBancarios||{}).tipoCuenta || ''}</div>
            <div>Cta: ${(f.datosBancarios||{}).numeroCuenta || '—'}</div>
          </div>
        </div>

        <div>
          <div class="font-bold text-xs text-muted mb-2" style="text-transform: uppercase;">Últimas 5 Ventas</div>
          ${fSales.length === 0 ? '<div class="text-xs text-muted text-center" style="padding: 12px;">Sin ventas registradas aún.</div>' :
            `<table class="table table-sm text-xs" style="margin:0;">
              <thead><tr><th>Factura</th><th>Cliente</th><th>Total</th><th>Comisión</th><th>Fecha</th></tr></thead>
              <tbody>
                ${fSales.slice(-5).reverse().map(s => `
                  <tr>
                    <td><strong style="color: var(--brand-primary);">${s.consecutivo}</strong></td>
                    <td>${s.clienteNombre}</td>
                    <td>${Formatters.currency(s.total)}</td>
                    <td class="font-bold text-success">${Formatters.currency(s.comisionFreelance || 0)}</td>
                    <td>${Formatters.date(s.fecha)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
          }
        </div>
      </div>
    `;

    Modal.show({
      title: `🤝 Ficha de ${f.nombre}`,
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() },
        { label: '✏️ Editar Datos', class: 'btn-secondary', onClick: () => { Modal.close(); this.openFreelancerWizard(f, tenantId, onSaved); } },
        ...(totalPendiente > 0 ? [{
          label: `💸 Liquidar ${Formatters.currency(totalPendiente)}`,
          class: 'btn-primary',
          onClick: () => {
            const cxpItems = allCxp.filter(c => c.tipoDocumento === 'COMISION_FREELANCE' && c.proveedorId === f.id && c.saldo > 0);
            Modal.close();
            this.openLiquidarModal(f.id, f.nombre, totalPendiente, cxpItems, onSaved);
          }
        }] : [])
      ]
    });
  },

  async openLiquidarModal(freelancerId, nombre, totalPendiente, cxpItems, onSaved) {
    const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px;">
          <div class="text-xs text-muted">Liquidación de comisiones a:</div>
          <div style="font-size: 16px; font-weight: 700; margin: 4px 0;">${nombre}</div>
          <div style="font-size: 20px; font-weight: 800; color: var(--danger);">Total a pagar: ${Formatters.currency(totalPendiente)}</div>
        </div>

        <div class="text-xs text-muted font-bold" style="text-transform: uppercase;">Desglose de comisiones pendientes:</div>
        <div style="max-height: 160px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px;">
          <table class="table table-sm text-xs" style="margin:0;">
            <thead><tr><th>Referencia</th><th>Venta</th><th>Comisión</th></tr></thead>
            <tbody>
              ${cxpItems.map(c => `
                <tr>
                  <td><strong>${c.documento}</strong></td>
                  <td>${c.ventaConsecutivo || '—'}</td>
                  <td class="font-bold text-danger">${Formatters.currency(c.saldo)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <form id="liquidar-form">
          <div class="form-group mb-3">
            <label class="form-label">Medio de Pago</label>
            <select class="form-select" name="medio">
              <option value="Bancolombia Cuenta Corriente">Bancolombia Cuenta Corriente</option>
              <option value="Davivienda Ahorros">Davivienda Ahorros</option>
              <option value="Transferencia Nequi">Transferencia Nequi</option>
              <option value="Efectivo Caja">Efectivo Caja</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Número de Comprobante</label>
            <input type="text" class="form-control" name="comprobante" placeholder="Ej: TRANSF-982347" required>
          </div>
        </form>
      </div>
    `;

    const dialog = Modal.show({
      title: `💸 Liquidar Comisiones — ${nombre}`,
      content,
      size: 'md',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: `Confirmar Pago de ${Formatters.currency(totalPendiente)}`,
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#liquidar-form');
            if (!form.checkValidity()) { form.reportValidity(); return; }

            // Marcar todos los CxP como PAGADA
            for (const cxpItem of cxpItems) {
              cxpItem.abonos = (cxpItem.abonos || 0) + cxpItem.saldo;
              cxpItem.saldo = 0;
              cxpItem.estado = 'PAGADA';
              await DB.update(STORES.PAYABLES_CXP, cxpItem);
            }

            // Actualizar acumulado en proveedor freelancer
            const tenant = TenantServiceInstance.getActiveTenant();
            const tenantId = tenant ? tenant.id : 'tenant_rayopro';
            const allSuppliers = await DB.getAll(STORES.SUPPLIERS, tenantId);
            const freelancer = allSuppliers.find(s => s.id === freelancerId);
            if (freelancer) {
              freelancer.comisionesTotalesPagadas = (freelancer.comisionesTotalesPagadas || 0) + totalPendiente;
              await DB.update(STORES.SUPPLIERS, freelancer);
            }

            Toast.success(`Liquidación de ${Formatters.currency(totalPendiente)} a ${nombre} registrada.`);
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  }
};
