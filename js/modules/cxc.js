/**
 * Nexa ERP - Módulo 11: Cuentas por Cobrar (Cartera de Clientes)
 * Antigüedad de saldos, estados de mora y recepción de abonos
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { CashService } from '../services/cash-service.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const CxcModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [receivables, clients] = await Promise.all([
      DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
      DB.getAll(STORES.CUSTOMERS, tenantId)
    ]);

    // Recalcular días de mora dinámicamente según la fecha actual
    const today = new Date();
    receivables.forEach(r => {
      if (r.fechaVencimiento && r.saldo > 0) {
        const dueDate = new Date(r.fechaVencimiento);
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          r.diasMora = diffDays;
          r.estado = diffDays > 30 ? 'MORA_CRITICA' : 'VENCIDO';
        } else if (diffDays >= -5) {
          r.diasMora = 0;
          r.estado = 'POR_VENCER';
        } else {
          r.diasMora = 0;
          r.estado = 'AL_DIA';
        }
      }
    });

    const totalCartera = receivables.reduce((acc, r) => acc + Number(r.saldo || 0), 0);
    const carteraVencida = receivables.filter(r => r.estado === 'VENCIDO' || r.estado === 'MORA_CRITICA').reduce((acc, r) => acc + Number(r.saldo || 0), 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cuentas por Cobrar (Cartera)</h1>
          <p>Control de deudas de clientes comerciales, plazos de pago y recaudo de cartera</p>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Cartera Total Activa</div>
          <div class="kpi-value text-warning">${Formatters.currency(totalCartera)}</div>
          <div class="kpi-footer">${receivables.filter(r => r.saldo > 0).length} facturas con saldo</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cartera en Mora Vencida</div>
          <div class="kpi-value text-danger">${Formatters.currency(carteraVencida)}</div>
          <div class="kpi-footer">Requiere cobro urgente</div>
        </div>
      </div>

      <div id="cxc-table-container"></div>
    `;

    new DataTable({
      containerId: 'cxc-table-container',
      data: receivables.filter(r => r.saldo > 0),
      columns: [
        {
          key: 'documento',
          title: 'Factura / Documento',
          render: val => `<strong style="color: var(--brand-primary);">${val}</strong>`
        },
        {
          key: 'clienteNombre',
          title: 'Cliente Deudor',
          render: val => `<strong>${val}</strong>`
        },
        {
          key: 'fechaEmision',
          title: 'Emisión',
          render: val => Formatters.date(val)
        },
        {
          key: 'fechaVencimiento',
          title: 'Vencimiento',
          render: val => Formatters.date(val)
        },
        {
          key: 'valorTotal',
          title: 'Valor Total',
          render: val => Formatters.currency(val)
        },
        {
          key: 'abonos',
          title: 'Abonos Realizados',
          render: val => Formatters.currency(val || 0)
        },
        {
          key: 'saldo',
          title: 'Saldo Pendiente',
          render: val => `<strong class="text-danger">${Formatters.currency(val)}</strong>`
        },
        {
          key: 'estado',
          title: 'Estado / Mora',
          render: (val, row) => {
            const map = {
              AL_DIA: { label: 'Al Día', class: 'badge-success' },
              POR_VENCER: { label: 'Próximo a Vencer', class: 'badge-warning' },
              VENCIDO: { label: `Vencido (${row.diasMora} d)`, class: 'badge-danger' },
              MORA_CRITICA: { label: `Mora Crítica (${row.diasMora} d)`, class: 'badge-danger' }
            };
            const meta = map[val] || { label: val, class: 'badge-neutral' };
            return `<span class="badge ${meta.class}">${meta.label}</span>`;
          }
        }
      ],
      actions: (row) => `
        <div class="d-flex items-center gap-1 flex-wrap">
          <button class="btn btn-primary btn-sm btn-cxc-payment" data-id="${row.id}" title="Registrar Abono">💵 Abono</button>
          <button class="btn btn-sm btn-cxc-whatsapp" data-id="${row.id}" style="background: #25d366; border-color: #25d366; color: #ffffff; font-weight: 700; padding: 3px 8px; font-size: 11px;" title="Enviar cobro por WhatsApp">📲 WhatsApp</button>
          <button class="btn btn-secondary btn-sm btn-cxc-calendar" data-id="${row.id}" title="Programar recordatorio en Google Calendar">📅 Recordatorio</button>
        </div>
      `
    });

    container.addEventListener('click', (e) => {
      const payBtn = e.target.closest('.btn-cxc-payment');
      if (payBtn) {
        const id = payBtn.getAttribute('data-id');
        const cxcItem = receivables.find(r => r.id === id);
        this.openPaymentModal(cxcItem, tenantId, clients, () => this.render(container));
        return;
      }

      const waBtn = e.target.closest('.btn-cxc-whatsapp');
      if (waBtn) {
        const id = waBtn.getAttribute('data-id');
        const cxcItem = receivables.find(r => r.id === id);
        this.openWhatsAppModal(cxcItem, tenant, clients);
        return;
      }

      const calBtn = e.target.closest('.btn-cxc-calendar');
      if (calBtn) {
        const id = calBtn.getAttribute('data-id');
        const cxcItem = receivables.find(r => r.id === id);
        this.scheduleGoogleCalendar(cxcItem, tenant, clients);
        return;
      }
    });
  },

  openPaymentModal(cxcItem, tenantId, clients, onSaved) {
    const content = `
      <div class="mb-3" style="background: var(--bg-surface-solid); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">Abono a Documento: <strong>${cxcItem.documento}</strong></div>
        <div style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 2px 0;">${cxcItem.clienteNombre}</div>
        <div class="d-flex justify-between items-center text-xs mt-2">
          <span>Saldo Actual Pendiente:</span>
          <strong class="text-danger" style="font-size: 15px;">${Formatters.currency(cxcItem.saldo)}</strong>
        </div>
      </div>

      <form id="cxc-payment-form">
        <div class="form-group mb-3">
          <label class="form-label">Monto del Abono ($ COP)</label>
          <input type="number" step="any" min="1" max="${cxcItem.saldo}" class="form-control" name="montoAbono" value="${cxcItem.saldo}" required>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Forma de Pago del Recaudo</label>
          <select class="form-select" name="metodoPago">
            <option value="Efectivo">Efectivo (Ingresa a Caja Abierta)</option>
            <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
            <option value="Nequi">Nequi</option>
            <option value="Daviplata">Daviplata</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Comprobante / Observación</label>
          <input type="text" class="form-control" name="reciboCaja" placeholder="No. Recibo de Caja o Referencia de Transferencia">
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Recaudar Cartera / Registrar Abono',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Procesar Abono',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#cxc-payment-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const abono = Number(formData.get('montoAbono'));
            const metodo = formData.get('metodoPago');
            const compB64 = formData.get('comprobanteBase64');
            const observacion = formData.get('reciboCaja');

              // 1. Actualizar CXC
              cxcItem.abonos = (cxcItem.abonos || 0) + abono;
              cxcItem.saldo = Math.max(0, cxcItem.saldo - abono);
              if (cxcItem.saldo === 0) cxcItem.estado = 'PAGADA';
              
              // Historial de pagos para guardar el comprobante
              cxcItem.historialPagos = cxcItem.historialPagos || [];
              cxcItem.historialPagos.push({
                fecha: new Date().toISOString(),
                monto: abono,
                metodo,
                observacion,
                comprobanteBase64: compB64 || null
              });
              
              await DB.update(STORES.RECEIVABLES_CXC, cxcItem);

            // 2. Actualizar cliente
            const client = clients.find(c => c.id === cxcItem.clienteId);
            if (client) {
              client.saldoPendiente = Math.max(0, (client.saldoPendiente || 0) - abono);
              await DB.update(STORES.CUSTOMERS, client);
            }

            // 3. Si fue en efectivo y hay caja abierta, registrar ingreso
            if (metodo === 'Efectivo') {
              const currentShift = await CashService.getCurrentShift(tenantId);
              if (currentShift) {
                await CashService.addMovement({
                  tenantId,
                  turnoId: currentShift.id,
                  tipo: 'INGRESO',
                  monto: abono,
                  concepto: `Abono Cartera Doc ${cxcItem.documento} de ${cxcItem.clienteNombre}`,
                  tercero: cxcItem.clienteNombre,
                  formaPago: 'Efectivo'
                });
              }
            }

            Toast.success(`Abono por ${Formatters.currency(abono)} registrado con éxito.`);
            Modal.close();
            if (onSaved) onSaved();
          }
        }
      ]
    });
  },

  /**
   * Modal interactivo para enviar recordatorio de cobro directamente por WhatsApp Web
   */
  openWhatsAppModal(cxcItem, tenant, clients) {
    const client = clients.find(c => c.id === cxcItem.clienteId || c.nombre === cxcItem.clienteNombre) || {};
    let rawPhone = (client.whatsapp || client.telefono || '').replace(/\D/g, '');
    if (rawPhone.length === 10) rawPhone = '57' + rawPhone;

    const esMora = cxcItem.estado === 'VENCIDO' || cxcItem.estado === 'MORA_CRITICA' || (cxcItem.diasMora && cxcItem.diasMora > 0);
    
    let defaultMsg = '';
    if (esMora) {
      defaultMsg = `Hola *${cxcItem.clienteNombre}*, un cordial saludo de parte de *${tenant.nombreComercial}*.\n\nLe escribimos para solicitar comedidamente la cancelación de su saldo pendiente por *${Formatters.currency(cxcItem.saldo)}*, correspondiente a la factura *${cxcItem.documento}*, la cual presenta *${cxcItem.diasMora || 0} días de mora* (Venció: ${Formatters.date(cxcItem.fechaVencimiento)}).\n\nPuede realizar su transferencia a nuestras cuentas oficiales:\n🏦 *Bancolombia Cta Ahorros:* 123-456789-01\n📱 *Nequi / Daviplata:* ${tenant.telefono || '3124567890'}\n*NIT:* ${tenant.nit}-${tenant.dv}\n\nLe agradecemos enviarnos el comprobante por este medio para actualizar su estado de cuenta y mantener activo su cupo de crédito para próximos despachos.\n\n¡Muchas gracias por su atención!`;
    } else {
      defaultMsg = `Hola *${cxcItem.clienteNombre}*, un cordial saludo de parte de *${tenant.nombreComercial}*.\n\nLe compartimos un recordatorio amable sobre su factura *${cxcItem.documento}* por valor de *${Formatters.currency(cxcItem.saldo)}*, cuya fecha de vencimiento es el *${Formatters.date(cxcItem.fechaVencimiento)}*.\n\nCuentas habilitadas para pago:\n🏦 *Bancolombia Cta Ahorros:* 123-456789-01\n📱 *Nequi / Daviplata:* ${tenant.telefono || '3124567890'}\n\nQuedamos a su entera disposición para cualquier inquietud o para coordinar su próximo pedido.\n\n¡Feliz día!`;
    }

    const content = `
      <div class="mb-3" style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 8px; padding: 12px 14px;">
        <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 2px;">
          💬 Cobranza Directa por WhatsApp Web
        </div>
        <div style="font-size: 11.5px; color: var(--text-secondary);">
          El mensaje se abrirá automáticamente en su WhatsApp Web o aplicación de escritorio listo para enviar con 1 clic.
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-bold">Número de WhatsApp del Cliente</label>
        <div class="d-flex items-center gap-2">
          <input type="text" class="form-control font-bold" id="inp-wa-phone" value="${rawPhone || '57'}" placeholder="Ej: 573124567890">
          <span class="badge ${rawPhone ? 'badge-success' : 'badge-warning'}" id="badge-wa-status">${rawPhone ? '✓ Registrado' : '⚠️ Sin registrar'}</span>
        </div>
        <span class="form-help">Incluya el código de país (Ej: 57 para Colombia seguido del celular).</span>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-bold">Mensaje Pre-redactado de Cobro</label>
        <textarea class="form-control" id="inp-wa-message" rows="8" style="font-size: 12px; font-family: monospace; line-height: 1.4;">${defaultMsg}</textarea>
        <span class="form-help">Puede personalizar cualquier texto antes de pulsar Enviar. Los asteriscos *texto* saldrán en negrita en WhatsApp.</span>
      </div>
    `;

    Modal.show({
      title: `📲 Cobro por WhatsApp - Factura ${cxcItem.documento}`,
      content,
      size: 'md',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: '💬 Abrir en WhatsApp Web y Enviar',
          class: 'btn-primary',
          onClick: () => {
            const phoneEl = document.getElementById('inp-wa-phone');
            const msgEl = document.getElementById('inp-wa-message');
            const cleanPhone = (phoneEl ? phoneEl.value : rawPhone).replace(/\D/g, '');
            const finalMsg = msgEl ? msgEl.value : defaultMsg;

            if (!cleanPhone || cleanPhone.length < 10) {
              Toast.warning('Por favor ingrese un número de WhatsApp válido.');
              return;
            }

            const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(finalMsg)}`;
            window.open(waUrl, '_blank');
            Toast.success('Abriendo WhatsApp Web con el mensaje pre-cargado...');
            Modal.close();
          }
        }
      ]
    });
  },

  /**
   * Programa recordatorio de vencimiento en Google Calendar
   */
  scheduleGoogleCalendar(cxcItem, tenant, clients) {
    const client = clients.find(c => c.id === cxcItem.clienteId) || {};
    const dateRaw = cxcItem.fechaVencimiento || new Date().toISOString().split('T')[0];
    const dateStr = dateRaw.replace(/-/g, '');
    const title = `Cobro Factura ${cxcItem.documento} - ${cxcItem.clienteNombre}`;
    const details = `Recordatorio de cobro de cartera en Nexa ERP (${tenant.nombreComercial})\n\nCliente: ${cxcItem.clienteNombre}\nFactura: ${cxcItem.documento}\nSaldo Pendiente: ${Formatters.currency(cxcItem.saldo)}\nFecha Vencimiento: ${Formatters.date(cxcItem.fechaVencimiento)}\nContacto: ${client.telefono || client.whatsapp || 'No registrado'}`;
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}T140000Z/${dateStr}T143000Z&details=${encodeURIComponent(details)}`;
    
    window.open(gcalUrl, '_blank');
    Toast.info('Abriendo Google Calendar para programar el recordatorio...');
  }
};
