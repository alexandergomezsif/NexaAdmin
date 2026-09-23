/**
 * Nexa ERP - Módulo 9: Caja, Turnos y Arqueos Diarios
 * Apertura de turno, movimientos de ingresos/egresos y conciliación de diferencias
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { CashService } from '../services/cash-service.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const CashModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [currentShift, allShifts, movements] = await Promise.all([
      CashService.getCurrentShift(tenantId),
      DB.getAll(STORES.CASH_SHIFTS, tenantId),
      DB.getAll(STORES.CASH_MOVEMENTS, tenantId)
    ]);

    const shiftMovements = currentShift ? movements.filter(m => m.turnoId === currentShift.id) : [];

    container.innerHTML = `
            <!-- Sub-Barra de Pestañas: Finanzas & Cartera -->
      <div class="sub-nav-tabs">
        <a href="#cash" class="sub-nav-tab active"><span>💵</span><span>Caja & Turnos</span></a>
        <a href="#purchases" class="sub-nav-tab"><span>🛍️</span><span>Compras & Proveedores</span></a>
        <a href="#expenses" class="sub-nav-tab"><span>🏷️</span><span>Gastos Operativos</span></a>
        <a href="#cxc" class="sub-nav-tab"><span>📈</span><span>Cuentas por Cobrar (CXC)</span></a>
        <a href="#cxp" class="sub-nav-tab"><span>📉</span><span>Cuentas por Pagar (CXP)</span></a>
      </div>

      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Control de Caja & Arqueos</h1>
          <p>Manejo de turnos, efectivo físico, ingresos, retiros a banco y diferencias de caja</p>
        </div>
        <div class="view-actions">
          ${currentShift ? `
            <button class="btn btn-secondary btn-sm" id="btn-cash-movement">➕ Movimiento de Caja</button>
            <button class="btn btn-danger btn-sm" id="btn-close-shift">🔒 Cerrar Turno & Arqueo</button>
          ` : `
            <button class="btn btn-primary btn-sm" id="btn-open-shift">🔓 Aperturar Turno de Caja</button>
          `}
        </div>
      </div>

      ${currentShift ? `
        <!-- RESUMEN DEL TURNO ACTIVO -->
        <div class="card mb-4" style="border-top: 4px solid var(--brand-primary);">
          <div class="card-header">
            <div>
              <div class="card-title">Turno de Caja Activo</div>
              <div class="card-subtitle">Aperturado el ${Formatters.dateTime(currentShift.fechaApertura)} por <strong>${currentShift.usuarioNombre || 'Cajero'}</strong></div>
            </div>
            <span class="badge badge-success">● TURNO ABIERTO</span>
          </div>
          <div class="card-body">
            <div class="kpi-grid mb-3">
              <div class="kpi-card">
                <div class="kpi-label">Base Inicial Apertura</div>
                <div class="kpi-value">${Formatters.currency(currentShift.montoApertura)}</div>
                <div class="kpi-footer">Efectivo inicial en gaveta</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Ventas en Efectivo</div>
                <div class="kpi-value text-success">${Formatters.currency(currentShift.totalVentasEfectivo || 0)}</div>
                <div class="kpi-footer">+ Efectivo sumado por ventas</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Ingresos / Otros</div>
                <div class="kpi-value">${Formatters.currency(currentShift.totalIngresos || 0)}</div>
                <div class="kpi-footer">+ Entradas manuales a caja</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Gastos Menores / Egresos</div>
                <div class="kpi-value text-danger">-${Formatters.currency((currentShift.totalGastos || 0) + (currentShift.totalEgresos || 0) + (currentShift.totalRetiros || 0))}</div>
                <div class="kpi-footer">- Salidas de efectivo</div>
              </div>
            </div>

            <div class="card" style="background: #f8fafc; border: 1px solid var(--border-color); margin-bottom: 0;">
              <div class="card-body d-flex justify-between items-center" style="padding: 14px 20px;">
                <div>
                  <div class="text-xs font-bold text-muted">SALDO ESTIMADO EN EFECTIVO (ESPERADO EN GAVETA):</div>
                  <div style="font-size: 26px; font-weight: 800; color: var(--brand-primary);">${Formatters.currency(currentShift.saldoEsperado)}</div>
                </div>
                <div class="d-flex gap-2">
                  <div class="text-xs text-muted" style="text-align: right;">
                    <div>Nequi / Daviplata: <strong>${Formatters.currency(currentShift.totalVentasNequiDaviplata || 0)}</strong></div>
                    <div>Transferencias: <strong>${Formatters.currency(currentShift.totalVentasTransferencia || 0)}</strong></div>
                    <div>Tarjetas: <strong>${Formatters.currency(currentShift.totalVentasTarjeta || 0)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MOVIMIENTOS DEL TURNO ACTUAL -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title" style="font-size: 14px;">Movimientos Manuales del Turno (${shiftMovements.length})</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
              <table class="data-table" style="font-size: 12px;">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Tercero</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  ${shiftMovements.length > 0 ? shiftMovements.map(m => `
                    <tr>
                      <td>${Formatters.dateTime(m.fecha)}</td>
                      <td>
                        <span class="badge ${m.tipo === 'INGRESO' ? 'badge-success' : 'badge-danger'}">${m.tipo}</span>
                      </td>
                      <td><strong>${m.concepto}</strong></td>
                      <td>${m.tercero}</td>
                      <td class="text-right font-bold ${m.tipo === 'INGRESO' ? 'text-success' : 'text-danger'}">
                        ${m.tipo === 'INGRESO' ? '+' : '-'}${Formatters.currency(m.monto)}
                      </td>
                    </tr>
                  `).join('') : `
                    <tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">No hay movimientos manuales en este turno.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ` : `
        <div class="card mb-4" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">🔒</div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">No hay turno de caja abierto</h2>
          <p class="text-muted text-sm mb-4">Para comenzar a facturar en el punto de venta (POS) y recibir pagos en efectivo, abra un nuevo turno de caja indicando la base inicial.</p>
          <div>
            <button class="btn btn-primary" id="btn-open-shift-center">🔓 Aperturar Turno con Base</button>
          </div>
        </div>
      `}

      <!-- HISTORIAL DE TURNOS ANTERIORES -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Historial de Turnos de Caja</div>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>Fecha Apertura</th>
                  <th>Fecha Cierre</th>
                  <th>Cajero</th>
                  <th class="text-right">Base</th>
                  <th class="text-right">Efectivo Ventas</th>
                  <th class="text-right">Saldo Esperado</th>
                  <th class="text-right">Saldo Contado</th>
                  <th class="text-right">Diferencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${allShifts.filter(s => s.estado === 'CERRADA').length > 0 ? allShifts.filter(s => s.estado === 'CERRADA').map(s => {
                  const dif = s.diferencia || 0;
                  const difColor = dif === 0 ? 'text-success' : dif > 0 ? 'text-success' : 'text-danger';
                  return `
                    <tr>
                      <td>${Formatters.dateTime(s.fechaApertura)}</td>
                      <td>${Formatters.dateTime(s.fechaCierre)}</td>
                      <td><strong>${s.usuarioNombre || 'Cajero'}</strong></td>
                      <td class="text-right">${Formatters.currency(s.montoApertura)}</td>
                      <td class="text-right">${Formatters.currency(s.totalVentasEfectivo)}</td>
                      <td class="text-right">${Formatters.currency(s.saldoEsperado)}</td>
                      <td class="text-right"><strong>${Formatters.currency(s.saldoContado)}</strong></td>
                      <td class="text-right font-bold ${difColor}">${dif > 0 ? '+' : ''}${Formatters.currency(dif)}</td>
                      <td><span class="badge badge-neutral">Cerrada</span></td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="9" class="text-center text-muted" style="padding: 20px;">No hay turnos cerrados en el historial.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Eventos de Apertura
    const handleOpenClick = () => {
      this.openShiftModal(tenantId, () => this.render(container));
    };

    const openBtn = container.querySelector('#btn-open-shift');
    if (openBtn) openBtn.addEventListener('click', handleOpenClick);

    const openCenterBtn = container.querySelector('#btn-open-shift-center');
    if (openCenterBtn) openCenterBtn.addEventListener('click', handleOpenClick);

    // Evento de Movimiento
    const movBtn = container.querySelector('#btn-cash-movement');
    if (movBtn) {
      movBtn.addEventListener('click', () => {
        this.openMovementModal(tenantId, currentShift.id, () => this.render(container));
      });
    }

    // Evento de Cierre & Arqueo
    const closeBtn = container.querySelector('#btn-close-shift');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.openCloseShiftModal(currentShift, () => this.render(container));
      });
    }
  },

  openShiftModal(tenantId, onComplete) {
    const content = `
      <form id="open-shift-form">
        <div class="form-group mb-3">
          <label class="form-label">Base Inicial de Apertura ($ COP)</label>
          <input type="number" class="form-control" name="montoApertura" required value="200000" placeholder="Ej: 200000">
          <div class="form-help">Monto en billetes y monedas con que se inicia la gaveta de cobro.</div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Observaciones de Apertura</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Turno de la mañana o notas iniciales"></textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Apertura de Turno de Caja',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Aperturar Caja',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#open-shift-form');
            const formData = new FormData(form);
            const montoApertura = Number(formData.get('montoApertura') || 0);
            const observaciones = formData.get('observaciones');

            try {
              await CashService.openShift({
                tenantId,
                usuarioId: 'usr_admin',
                usuarioNombre: 'Carlos Mario Arango',
                montoApertura,
                observaciones
              });
              Toast.success('Turno de caja aperturado correctamente.');
              Modal.close();
              if (onComplete) onComplete();
            } catch (err) {
              Toast.error(err.message);
            }
          }
        }
      ]
    });
  },

  openMovementModal(tenantId, turnoId, onComplete) {
    const content = `
      <form id="cash-mov-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tipo de Movimiento</label>
            <select class="form-select" name="tipo" required>
              <option value="INGRESO">Ingreso Extraordinario (+)</option>
              <option value="GASTO">Gasto Menor de Operación (-)</option>
              <option value="RETIRO">Retiro Parcial / Consignación a Banco (-)</option>
              <option value="EGRESO">Egreso de Caja (-)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Monto ($ COP)</label>
            <input type="number" class="form-control" name="monto" required placeholder="Ej: 50000">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Concepto o Detalle</label>
          <input type="text" class="form-control" name="concepto" required placeholder="Ej: Pago de almuerzo personal o recarga de botellón de agua">
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Tercero / Proveedor / Beneficiario</label>
          <input type="text" class="form-control" name="tercero" placeholder="Ej: Domicilios El Poblado">
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Registrar Movimiento en Caja',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Registrar en Caja',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#cash-mov-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            await CashService.addMovement({
              tenantId,
              turnoId,
              tipo: formData.get('tipo'),
              monto: Number(formData.get('monto')),
              concepto: formData.get('concepto'),
              tercero: formData.get('tercero')
            });

            Toast.success('Movimiento de caja registrado.');
            Modal.close();
            if (onComplete) onComplete();
          }
        }
      ]
    });
  },

  openCloseShiftModal(shift, onComplete) {
    const content = `
      <div class="mb-3" style="background: var(--brand-primary-light); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
        <div class="d-flex justify-between items-center text-xs">
          <span style="color: var(--text-main); font-weight: 600;">Saldo Teórico Esperado en Gaveta:</span>
          <strong style="font-size: 16px; color: var(--brand-primary);">${Formatters.currency(shift.saldoEsperado)}</strong>
        </div>
      </div>

      <form id="close-shift-form">
        <div class="form-group mb-3">
          <label class="form-label">Efectivo Físico Contado en el Arqueo ($ COP)</label>
          <input type="number" class="form-control" id="inp-cash-counted" name="saldoContado" required placeholder="Monto real que contó en billetes y monedas">
        </div>

        <div class="card mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); padding: 12px;">
          <div class="d-flex justify-between items-center">
            <span class="text-xs font-bold">Diferencia de Caja:</span>
            <strong id="lbl-cash-diff" style="font-size: 16px;">$ 0</strong>
          </div>
          <div class="text-xs text-muted mt-1" id="lbl-cash-diff-desc">Ingrese el dinero contado para conciliar.</div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones del Cierre</label>
          <textarea class="form-control" name="observacionesCierre" rows="2" placeholder="Motivo de descuadre si lo hubiere o cierre sin novedades"></textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: 'Cierre y Arqueo Final de Caja',
      content,
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: 'Confirmar Cierre de Turno',
          class: 'btn-danger',
          onClick: async () => {
            const form = dialog.querySelector('#close-shift-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const saldoContado = Number(formData.get('saldoContado'));
            const observacionesCierre = formData.get('observacionesCierre');
            const dif = saldoContado - shift.saldoEsperado;

            await CashService.closeShift({
              turnoId: shift.id,
              saldoContado,
              observacionesCierre
            });

            // Auto-Respaldo obligatorio al Cierre de Caja
            await DB.downloadAutoBackup('CierreCaja');

            Toast.success('Turno de caja cerrado exitosamente.');
            Modal.close();
            if (onComplete) onComplete();

            // Prompt WhatsApp closing summary to Partners
            this.openShiftCloseWhatsAppModal(shift, saldoContado, dif, observacionesCierre);
          }
        }
      ]
    });

    const inp = dialog.querySelector('#inp-cash-counted');
    const diffLbl = dialog.querySelector('#lbl-cash-diff');
    const descLbl = dialog.querySelector('#lbl-cash-diff-desc');

    inp.addEventListener('input', () => {
      const contado = Number(inp.value) || 0;
      const dif = contado - shift.saldoEsperado;
      diffLbl.textContent = Formatters.currency(dif);

      if (dif === 0) {
        diffLbl.style.color = 'var(--color-success)';
        descLbl.textContent = '✓ Caja cuadrada con exactitud perfecta.';
      } else if (dif > 0) {
        diffLbl.style.color = 'var(--color-success)';
        descLbl.textContent = `Sobrante de caja a favor de la empresa: ${Formatters.currency(dif)}`;
      } else {
        diffLbl.style.color = 'var(--color-danger)';
        descLbl.textContent = `⚠️ Faltante de dinero en gaveta: ${Formatters.currency(Math.abs(dif))}`;
      }
    });
  },

  openShiftCloseWhatsAppModal(shift, saldoContado, dif, observaciones) {
    const diffStatus = dif === 0 ? '✅ CUADRE PERFECTO' : (dif > 0 ? `🟢 SOBRANTE (+${Formatters.currency(dif)})` : `🔴 FALTANTE (-${Formatters.currency(Math.abs(dif))})`);
    const dateStr = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const defaultMsg = `📊 *REPORTE DE CIERRE DE CAJA*\n` +
      `📅 *Fecha:* ${dateStr}\n` +
      `⏰ *Hora:* ${timeStr}\n` +
      `👤 *Cajero Responsable:* ${shift.cajero || 'Cajero'}\n` +
      `----------------------------------------\n` +
      `💵 *Base Inicial de Gaveta:* ${Formatters.currency(shift.montoInicial || 0)}\n` +
      `💰 *Ventas Efectivo:* ${Formatters.currency(shift.ventasEfectivo || 0)}\n` +
      `💳 *Ventas Tarjeta / Datáfono:* ${Formatters.currency(shift.ventasTarjeta || 0)}\n` +
      `📲 *Ventas Transferencias:* ${Formatters.currency(shift.ventasTransferencia || 0)}\n` +
      `➕ *Entradas manuales:* ${Formatters.currency(shift.totalEntradas || 0)}\n` +
      `➖ *Salidas / Gastos menores:* ${Formatters.currency(shift.totalSalidas || 0)}\n` +
      `----------------------------------------\n` +
      `🎯 *Total Teórico Esperado en Gaveta:* ${Formatters.currency(shift.saldoEsperado || 0)}\n` +
      `💵 *Total Real Físico Contado:* ${Formatters.currency(saldoContado)}\n` +
      `⚖️ *Resultado del Cuadre:* ${diffStatus}\n` +
      (observaciones ? `📝 *Observaciones:* ${observaciones}\n` : '') +
      `----------------------------------------\n` +
      `_Reporte generado automáticamente desde Nexa Admin ERP._`;

    const content = `
      <div style="padding: 10px 0;">
        <p class="text-sm text-muted mb-3">
          El turno fue cerrado en el sistema. Puede enviar de inmediato este balance del cierre por <strong>WhatsApp Web</strong> a los socios o gerencia:
        </p>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Número de WhatsApp del Socio / Gerente:</label>
          <input type="text" class="form-control" id="inp-shift-wa-phone" placeholder="Ej: 3001234567" value="3001234567">
          <span class="text-xs text-muted">Prefijo +57 Colombia se aplicará automáticamente.</span>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Mensaje Pre-redactado:</label>
          <textarea class="form-control" id="txt-shift-wa-msg" rows="9" style="font-family: monospace; font-size: 11px; white-space: pre-wrap;">${defaultMsg}</textarea>
        </div>
      </div>
    `;

    const waModal = Modal.show({
      title: '📲 Enviar Balance de Cierre a Socios / Gerencia',
      content,
      footerButtons: [
        { label: 'Omitir / Cerrar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: '🚀 Abrir WhatsApp Web',
          class: 'btn-success',
          onClick: () => {
            const phoneVal = (waModal.querySelector('#inp-shift-wa-phone').value || '').replace(/\D/g, '');
            const msgVal = waModal.querySelector('#txt-shift-wa-msg').value;

            if (!phoneVal) {
              Toast.warning('Ingrese un número de teléfono válido.');
              return;
            }

            const cleanPhone = phoneVal.startsWith('57') ? phoneVal : ('57' + phoneVal);
            const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msgVal)}`;
            window.open(waUrl, '_blank');
            Modal.close();
          }
        }
      ]
    });
  }
};
