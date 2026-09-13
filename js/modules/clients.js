/**
 * Nexa ERP - Módulo 2: Gestión Integral de Clientes (Ficha 360°)
 * CRUD, cálculo automático de DV DIAN, cupos de crédito, 5 listas de precios y ficha comercial
 */

import { DB, STORES } from '../services/db-service.js';
import { Formatters } from '../utils/formatters.js';
import { DianDV } from '../utils/dian-dv.js';
import { DataTable } from '../components/data-table.js';
import { Modal } from '../components/modal.js';
import { Toast } from '../components/toast.js';
import { AuditService } from '../services/audit-service.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

/**
 * Matriz oficial de Segmentos de Cliente, Criterios y Requisitos Comerciales
 * Cada segmento determina la lista de precios asignada y los términos de crédito.
 */
export const CLIENT_SEGMENTS = {
  'Consumidor Final': {
    priceListOrder: 1,
    badge: 'badge-neutral',
    titulo: 'P1 - Precio Público / Final',
    requisitos: 'Sin mínimo de compra. Venta al detal y mostrador. Pago 100% de contado (Efectivo, Nequi, Tarjeta). Sin cupo de crédito.',
    cupoRecomendado: 0,
    diasCredito: 0
  },
  'Taller / Detailing': {
    priceListOrder: 2,
    badge: 'badge-info',
    titulo: 'P2 - Precio Lavaderos & Centros de Detailing',
    requisitos: 'Negocio físico activo de autolavado o taller. RUT o registro fotográfico. Frecuencia de compra quincenal. Descuento profesional.',
    cupoRecomendado: 800000,
    diasCredito: 15
  },
  'Mayorista': {
    priceListOrder: 3,
    badge: 'badge-warning',
    titulo: 'P3 - Precio Mayorista por Cajas (Docenas)',
    requisitos: 'Compras mínimas por cajas cerradas de 12 unidades o pedido consolidado superior a $600.000 COP. Despacho directo.',
    cupoRecomendado: 2500000,
    diasCredito: 30
  },
  'Distribuidor': {
    priceListOrder: 4,
    badge: 'badge-primary',
    titulo: 'P4 - Precio Distribuidor Autorizado Regional',
    requisitos: 'Almacén de repuestos o lubricentro con fuerza comercial. Pedido inicial de apertura mínimo de $2.500.000 COP y recompra mensual sostenida. Cámara de Comercio y 2 referencias.',
    cupoRecomendado: 6000000,
    diasCredito: 30
  },
  'Flotas / Convenios': {
    priceListOrder: 5,
    badge: 'badge-success',
    titulo: 'P5 - Precio Especial Grandes Flotas & Convenios',
    requisitos: 'Flotas de tractomulas, camiones pesados o buses (>10 vehículos, ej: Cano Trucks). Suministro en garrafas 23L o canecas. Convenio corporativo formal a crédito.',
    cupoRecomendado: 12000000,
    diasCredito: 45
  }
};

export const ClientsModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [clients, priceLists, sales, cxcList, shipments] = await Promise.all([
      DB.getAll(STORES.CUSTOMERS, tenantId),
      DB.getAll(STORES.PRICE_LISTS, tenantId),
      DB.getAll(STORES.SALES, tenantId),
      DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
      DB.getAll(STORES.ORDERS_SHIPPING, tenantId)
    ]);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Directorio de Clientes</h1>
          <p>Control de terceros, cartera, asignación de listas de precios y cupos comerciales</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-clients">📊 Exportar</button>
          <button class="btn btn-primary btn-sm" id="btn-new-client">➕ Nuevo Cliente</button>
        </div>
      </div>

      <div id="clients-table-container"></div>
    `;

    // Renderizar DataTable
    const dataTable = new DataTable({
      containerId: 'clients-table-container',
      data: clients,
      columns: [
        {
          key: 'codigo',
          title: 'Código',
          width: '90px',
          render: val => `<strong>${val || '-'}</strong>`
        },
        {
          key: 'nombre',
          title: 'Cliente / Razón Social',
          render: (val, row) => `
            <div>
              <div class="font-bold">${val}</div>
              <div class="text-xs text-muted">NIT/CC: ${DianDV.formatWithDV(row.nitCc)}</div>
            </div>
          `
        },
        {
          key: 'tipoCliente',
          title: 'Tipo / Segmento',
          render: val => {
            const seg = CLIENT_SEGMENTS[val];
            const badgeClass = seg ? seg.badge : 'badge-neutral';
            return `<span class="badge ${badgeClass}" style="font-weight: 700;">${val || 'General'}</span>`;
          }
        },
        {
          key: 'ciudad',
          title: 'Ciudad',
          render: (val, row) => `${val || '-'}, ${row.departamento || ''}`
        },
        {
          key: 'telefono',
          title: 'Contacto',
          render: (val, row) => `
            <div class="text-xs">
              <div>📞 ${val || '-'}</div>
              ${row.whatsapp ? `<div>💬 <a href="https://wa.me/${row.whatsapp.replace(/\D/g, '')}" target="_blank" style="color: var(--brand-primary);">${row.whatsapp}</a></div>` : ''}
            </div>
          `
        },
        {
          key: 'listaPreciosId',
          title: 'Lista Asignada',
          render: val => {
            const list = priceLists.find(p => p.id === val);
            return `<span class="badge badge-info">${list ? list.nombre : 'P1 (Público)'}</span>`;
          }
        },
        {
          key: 'facturaElectronica',
          title: 'Facturación & IVA',
          render: (val, row) => {
            const esFE = val !== false;
            const aplicaIva = row.aplicaIva !== false;
            return `
              <div>
                <span class="badge ${esFE ? 'badge-success' : 'badge-neutral'}" style="font-size: 11px;">
                  ${esFE ? '⚡ Factura Electrónica' : '📄 Remisión / POS Sin FE'}
                </span>
                <div class="text-xs" style="margin-top: 2px; color: ${aplicaIva ? 'var(--text-muted)' : 'var(--color-warning)'}; font-weight: ${aplicaIva ? 'normal' : 'bold'};">
                  ${aplicaIva ? '✓ Con IVA (19%)' : '✕ Exento / Sin IVA (0%)'}
                </div>
              </div>
            `;
          }
        },
        {
          key: 'saldoPendiente',
          title: 'Saldo Cartera',
          render: val => {
            const saldo = Number(val || 0);
            return saldo > 0 ? `<strong class="text-danger">${Formatters.currency(saldo)}</strong>` : '<span class="text-success">$ 0</span>';
          }
        },
        {
          key: 'estado',
          title: 'Estado',
          render: val => `<span class="badge ${val === 'ACTIVO' ? 'badge-success' : 'badge-danger'}">${val}</span>`
        }
      ],
      actions: (row) => `
        <button class="btn btn-secondary btn-sm btn-view-client" data-id="${row.id}" title="Ficha 360°">👁️ Ficha</button>
        <button class="btn btn-secondary btn-sm btn-edit-client" data-id="${row.id}" title="Editar">✏️</button>
      `
    });

    // Eventos
    const exportBtn = container.querySelector('#btn-export-clients');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        const { ExportService } = await import('../services/export-service.js');
        ExportService.exportToCSV(clients, 'Clientes_RayoPro');
      });
    }

    const newClientBtn = container.querySelector('#btn-new-client');
    if (newClientBtn) {
      newClientBtn.addEventListener('click', () => {
        this.openClientModal(null, tenantId, priceLists, () => this.render(container));
      });
    }

    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-client');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const client = clients.find(c => c.id === id);
        this.openClientModal(client, tenantId, priceLists, () => this.render(container));
        return;
      }

      const viewBtn = e.target.closest('.btn-view-client');
      if (viewBtn) {
        const id = viewBtn.getAttribute('data-id');
        const client = clients.find(c => c.id === id);
        const clientSales = sales.filter(s => s.clienteId === id);
        const clientCxc = cxcList.filter(c => c.clienteId === id);
        const clientShipments = shipments.filter(sh => sh.clienteId === id);
        this.openClientProfileModal(client, clientSales, priceLists, clientCxc, clientShipments);
      }
    });
  },

  /**
   * Modal de Creación / Edición de Cliente
   */
  openClientModal(client = null, tenantId, priceLists, onSaved) {
    const isEdit = !!client;

    const content = `
      <form id="client-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Código Interno</label>
            <input type="text" class="form-control" name="codigo" required value="${client ? client.codigo : 'CLI-' + Math.floor(100 + Math.random() * 900)}">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Persona</label>
            <select class="form-select" name="tipoPersona" id="modal-client-persona">
              <option value="NATURAL" ${client && client.tipoPersona === 'NATURAL' ? 'selected' : ''}>Persona Natural</option>
              <option value="JURIDICA" ${!client || client.tipoPersona === 'JURIDICA' ? 'selected' : ''}>Persona Jurídica (Empresa)</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Nombre Comercial o Completo</label>
            <input type="text" class="form-control" name="nombre" required value="${client ? client.nombre : ''}" placeholder="Ej: AutoSpa Medellín o Juan Pérez">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">NIT o Cédula (Sin DV)</label>
            <input type="text" class="form-control" id="modal-client-nit" name="nitCc" required value="${client ? client.nitCc : ''}" placeholder="Ej: 901458321">
          </div>
          <div class="form-group">
            <label class="form-label">DV (Cálculo DIAN)</label>
            <input type="text" class="form-control" id="modal-client-dv" name="dv" readonly value="${client ? client.dv : '-'}" style="background: #f1f5f9; font-weight: bold;">
          </div>
        </div>

        <div class="form-row mb-1">
          <div class="form-group">
            <label class="form-label font-bold">Tipo / Segmento Comercial</label>
            <select class="form-select" name="tipoCliente" id="modal-client-segment">
              <option value="Consumidor Final" ${client && client.tipoCliente === 'Consumidor Final' ? 'selected' : ''}>Consumidor Final (P1 - Público)</option>
              <option value="Taller / Detailing" ${(!client || client.tipoCliente === 'Taller / Detailing') ? 'selected' : ''}>Taller / Detailing (P2 - Taller)</option>
              <option value="Mayorista" ${client && client.tipoCliente === 'Mayorista' ? 'selected' : ''}>Mayorista (P3 - Docenas/Cajas)</option>
              <option value="Distribuidor" ${client && client.tipoCliente === 'Distribuidor' ? 'selected' : ''}>Distribuidor (P4 - Distribuidor)</option>
              <option value="Flotas / Convenios" ${client && client.tipoCliente === 'Flotas / Convenios' ? 'selected' : ''}>Flotas / Convenios (P5 - Especial)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Lista de Precios Asignada</label>
            <select class="form-select" name="listaPreciosId" id="modal-client-pricelist">
              ${priceLists.map(pl => `
                <option value="${pl.id}" ${client && client.listaPreciosId === pl.id ? 'selected' : ''}>${pl.nombre}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- GUÍA DE REQUISITOS Y CONDICIONES POR SEGMENTO -->
        <div id="modal-segment-guide" class="mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; font-size: 11.5px; line-height: 1.4;">
          <div style="font-weight: 700; color: var(--brand-primary); margin-bottom: 2px;" id="modal-seg-title">
            ${CLIENT_SEGMENTS[client?.tipoCliente || 'Taller / Detailing']?.titulo || 'Condiciones Comerciales'}
          </div>
          <div style="color: var(--text-secondary);" id="modal-seg-requisitos">
            <strong>Requisitos Comerciales:</strong> ${CLIENT_SEGMENTS[client?.tipoCliente || 'Taller / Detailing']?.requisitos || ''}
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Teléfono Fijo / Móvil</label>
            <input type="text" class="form-control" name="telefono" value="${client ? client.telefono : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp (Notificaciones)</label>
            <input type="text" class="form-control" name="whatsapp" value="${client ? client.whatsapp : ''}" placeholder="+573001234567">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input type="email" class="form-control" name="email" value="${client ? client.email : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad / Municipio</label>
            <input type="text" class="form-control" name="ciudad" value="${client ? client.ciudad : 'Medellín'}">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Dirección de Entrega</label>
            <input type="text" class="form-control" name="direccion" value="${client ? client.direccion : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Barrio / Sector</label>
            <input type="text" class="form-control" name="barrio" value="${client ? client.barrio : ''}">
          </div>
        </div>

        <!-- CONFIGURACIÓN TRIBUTARIA Y FACTURACIÓN ELECTRÓNICA -->
        <div class="card p-3 mb-3" style="background: rgba(0, 113, 227, 0.04); border: 1px solid rgba(0, 113, 227, 0.15);">
          <div style="font-size: 13px; font-weight: 700; color: var(--brand-primary); margin-bottom: 8px;">
            ⚖️ Configuración Tributaria & Facturación
          </div>
          <div class="form-row">
            <div class="form-group mb-0">
              <label class="form-label font-bold">¿Facturar Electrónicamente?</label>
              <select class="form-select" name="facturaElectronica" id="modal-client-fe">
                <option value="SI" ${!client || client.facturaElectronica !== false ? 'selected' : ''}>⚡ Sí - Factura Electrónica DIAN</option>
                <option value="NO" ${client && client.facturaElectronica === false ? 'selected' : ''}>📄 No - Remisión / Venta Interna (Sin FE)</option>
              </select>
              <span class="form-help">Para clientes que aún no requieren o no reciben FE formal.</span>
            </div>
            <div class="form-group mb-0">
              <label class="form-label font-bold">¿Liquidar con IVA (19%)?</label>
              <select class="form-select" name="aplicaIva" id="modal-client-iva">
                <option value="SI" ${!client || client.aplicaIva !== false ? 'selected' : ''}>✓ Sí - Liquidar IVA (19%)</option>
                <option value="NO" ${client && client.aplicaIva === false ? 'selected' : ''}>✕ No - Sin IVA / Exento (0% Etapa Inicial)</option>
              </select>
              <span class="form-help">Ideal para empresas en etapa inicial o tratos comerciales netos.</span>
            </div>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Cupo de Crédito ($ COP)</label>
            <input type="number" class="form-control" name="cupoCredito" value="${client ? client.cupoCredito : 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Días de Crédito Plazo</label>
            <input type="number" class="form-control" name="diasCredito" value="${client ? client.diasCredito : 0}">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones Comerciales</label>
          <textarea class="form-control" name="observaciones" rows="2">${client ? (client.observaciones || '') : ''}</textarea>
        </div>
      </form>
    `;

    const dialog = Modal.show({
      title: isEdit ? `Editar Cliente: ${client.nombre}` : 'Crear Nuevo Cliente',
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cancelar', class: 'btn-secondary', onClick: () => Modal.close() },
        {
          label: isEdit ? 'Guardar Cambios' : 'Crear Cliente',
          class: 'btn-primary',
          onClick: async () => {
            const form = dialog.querySelector('#client-form');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }

            const formData = new FormData(form);
            const nitCc = formData.get('nitCc').replace(/\D/g, '');
            const calculatedDv = DianDV.calculate(nitCc);

            const payload = {
              tenantId,
              codigo: formData.get('codigo'),
              tipoPersona: formData.get('tipoPersona'),
              nombre: formData.get('nombre'),
              nitCc,
              dv: calculatedDv !== null ? calculatedDv : 0,
              tipoCliente: formData.get('tipoCliente'),
              listaPreciosId: formData.get('listaPreciosId'),
              facturaElectronica: formData.get('facturaElectronica') === 'SI',
              aplicaIva: formData.get('aplicaIva') === 'SI',
              telefono: formData.get('telefono'),
              whatsapp: formData.get('whatsapp'),
              email: formData.get('email'),
              direccion: formData.get('direccion'),
              ciudad: formData.get('ciudad'),
              barrio: formData.get('barrio'),
              cupoCredito: Number(formData.get('cupoCredito') || 0),
              diasCredito: Number(formData.get('diasCredito') || 0),
              observaciones: formData.get('observaciones'),
              estado: 'ACTIVO'
            };

            if (isEdit) {
              payload.id = client.id;
              payload.saldoPendiente = client.saldoPendiente || 0;
              payload.totalComprado = client.totalComprado || 0;
              payload.numeroCompras = client.numeroCompras || 0;
              await DB.update(STORES.CUSTOMERS, payload);
              await AuditService.log({
                modulo: 'Clientes',
                accion: 'MODIFICAR',
                registroId: payload.codigo,
                campoModificado: 'Datos Generales',
                valorAnterior: client.nombre,
                valorNuevo: payload.nombre
              });
              Toast.success('Cliente actualizado correctamente.');
            } else {
              payload.saldoPendiente = 0;
              payload.totalComprado = 0;
              payload.numeroCompras = 0;
              const saved = await DB.add(STORES.CUSTOMERS, payload);
              await AuditService.log({
                modulo: 'Clientes',
                accion: 'CREAR',
                registroId: payload.codigo,
                campoModificado: 'Cliente Nuevo',
                valorAnterior: '-',
                valorNuevo: payload.nombre
              });
              Toast.success('Cliente registrado exitosamente.');
              Modal.close();
              if (onSaved) onSaved(saved || payload);
              return;
            }

            Modal.close();
            if (onSaved) onSaved(payload);
          }
        }
      ]
    });

    // Listener para cálculo reactivo de DV DIAN en el input
    const nitInput = dialog.querySelector('#modal-client-nit');
    const dvInput = dialog.querySelector('#modal-client-dv');
    nitInput.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/\D/g, '');
      const dv = DianDV.calculate(clean);
      dvInput.value = dv !== null ? dv : '-';
    });

    // Listener reactivo de segmentación comercial y requisitos
    const segSelect = dialog.querySelector('#modal-client-segment');
    const plSelect = dialog.querySelector('#modal-client-pricelist');
    const segTitle = dialog.querySelector('#modal-seg-title');
    const segReq = dialog.querySelector('#modal-seg-requisitos');
    const cupoInp = dialog.querySelector('input[name="cupoCredito"]');
    const diasInp = dialog.querySelector('input[name="diasCredito"]');

    if (segSelect && plSelect) {
      segSelect.addEventListener('change', (e) => {
        const segKey = e.target.value;
        const segData = CLIENT_SEGMENTS[segKey];
        if (segData) {
          if (segTitle) segTitle.textContent = segData.titulo;
          if (segReq) segReq.innerHTML = `<strong>Requisitos Comerciales:</strong> ${segData.requisitos}`;
          
          // Auto-vincular lista de precios según el orden del segmento
          const matchingPl = priceLists.find(p => p.orden === segData.priceListOrder) || priceLists[segData.priceListOrder - 1];
          if (matchingPl) {
            plSelect.value = matchingPl.id;
          }

          // Si es creación nueva, sugerir cupo y días
          if (!isEdit && cupoInp && diasInp) {
            cupoInp.value = segData.cupoRecomendado;
            diasInp.value = segData.diasCredito;
          }
        }
      });
    }
  },

  /**
   * Modal Ficha 360° del Cliente con Historial y Métricas
   */
  openClientProfileModal(client, clientSales = [], priceLists, clientCxc = [], clientShipments = []) {
    const list = priceLists.find(p => p.id === client.listaPreciosId);
    const listName = list ? list.nombre : 'Precio Público';

    const totalComprado = clientSales.reduce((acc, s) => acc + Number(s.total || 0), client.totalComprado || 0);
    const numCompras = Math.max(clientSales.length, client.numeroCompras || 0);
    const ticketPromedio = numCompras > 0 ? Math.round(totalComprado / numCompras) : 0;

    const content = `
      <div class="mb-4" style="background: rgba(0, 113, 227, 0.03); padding: 18px; border-radius: 16px; border: 1px solid rgba(0, 113, 227, 0.12);">
        <div class="d-flex justify-between items-center mb-2">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0; letter-spacing: -0.02em;">${client.nombre}</h2>
            <div class="text-xs text-muted" style="margin-top: 2px;">NIT/CC: <strong>${DianDV.formatWithDV(client.nitCc)}</strong> • Segmento: <span class="badge badge-neutral" style="font-size: 11px;">${client.tipoCliente}</span></div>
          </div>
          <span class="badge ${client.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'}">${client.estado}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px;">
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Total Comprado</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--color-success);">${Formatters.currency(totalComprado)}</div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Saldo en Cartera</div>
            <div style="font-size: 16px; font-weight: 700; color: ${client.saldoPendiente > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">
              ${Formatters.currency(client.saldoPendiente || 0)}
            </div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Cupo Disponible</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--brand-primary);">
              ${Formatters.currency(Math.max(0, (client.cupoCredito || 0) - (client.saldoPendiente || 0)))}
            </div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Ticket Promedio</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--text-main);">${Formatters.currency(ticketPromedio)}</div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-col gap-2 mb-4 text-xs" style="color: var(--text-main); background: var(--bg-surface-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border-color);">
        <div>📍 <strong>Dirección de Entrega:</strong> ${client.direccion || '-'}, ${client.barrio || ''} (${client.ciudad || '-'}, ${client.departamento || ''})</div>
        <div>📞 <strong>Contacto Comercial:</strong> ${client.telefono || '-'} | <strong>WhatsApp:</strong> ${client.whatsapp || '-'} | <strong>Email:</strong> ${client.email || '-'}</div>
        <div>🏷️ <strong>Lista de Precios Predilecta:</strong> <span class="badge badge-info" style="font-size: 11px;">${listName}</span></div>
        <div>⚡ <strong>Régimen de Facturación:</strong> 
          <span class="badge ${client.facturaElectronica !== false ? 'badge-success' : 'badge-neutral'}" style="font-size: 11px;">
            ${client.facturaElectronica !== false ? 'Facturación Electrónica DIAN' : 'Documento Interno / Sin FE'}
          </span>
          <span class="badge ${client.aplicaIva !== false ? 'badge-info' : 'badge-warning'}" style="font-size: 11px; margin-left: 6px;">
            ${client.aplicaIva !== false ? 'Liquida IVA (19%)' : 'Exento de IVA / Etapa Inicial (0%)'}
          </span>
        </div>
        <div>⏱️ <strong>Condición de Crédito:</strong> ${client.diasCredito > 0 ? `${client.diasCredito} Días plazo (Cupo Total: ${Formatters.currency(client.cupoCredito)})` : 'Contado inmediato'}</div>
        ${client.observaciones ? `<div style="background: rgba(245, 158, 11, 0.08); padding: 8px 12px; border-radius: 8px; border-left: 3px solid #f59e0b; margin-top: 4px;">📝 <strong>Notas Internas:</strong> ${client.observaciones}</div>` : ''}
      </div>

      <!-- SECCIÓN CARTERA & ABONOS HISTÓRICOS -->
      ${clientCxc.length > 0 ? `
        <div class="mb-4">
          <h4 class="text-sm font-bold mb-2" style="color: var(--text-main);">📑 Estado de Cartera & Conciliación de Pagos</h4>
          <div class="table-responsive" style="max-height: 180px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>Doc. Cartera</th>
                  <th>Emisión / Venc.</th>
                  <th class="text-right">Valor Inicial</th>
                  <th class="text-right">Abonos Aplicados</th>
                  <th class="text-right">Saldo Actual</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${clientCxc.map(c => `
                  <tr>
                    <td><strong>${c.documento}</strong><br><span class="text-xs text-muted">${c.observaciones || ''}</span></td>
                    <td>${Formatters.date(c.fechaEmision)}<br><span class="text-xs text-muted">Vence: ${Formatters.date(c.fechaVencimiento)}</span></td>
                    <td class="text-right font-medium">${Formatters.currency(c.valorTotal)}</td>
                    <td class="text-right font-medium" style="color: var(--color-success);">- ${Formatters.currency(c.abonos || 0)}</td>
                    <td class="text-right font-bold" style="color: var(--color-danger);">${Formatters.currency(c.saldo)}</td>
                    <td><span class="badge ${c.saldo === 0 ? 'badge-success' : 'badge-warning'}">${c.estado}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <h4 class="text-sm font-bold mb-2" style="color: var(--text-main);">🛒 Historial de Facturas & Ventas</h4>
      <div class="table-responsive" style="max-height: 180px; overflow-y: auto;">
        <table class="data-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Consecutivo</th>
              <th>Fecha</th>
              <th>Medio Pago</th>
              <th class="text-right">Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${clientSales.length > 0 ? clientSales.map(s => `
              <tr>
                <td><strong>${s.consecutivo}</strong></td>
                <td>${Formatters.date(s.fecha)}</td>
                <td>${s.metodoPago}</td>
                <td class="text-right font-bold">${Formatters.currency(s.total)}</td>
                <td><span class="badge ${s.estado === 'PAGADA' ? 'badge-success' : 'badge-warning'}">${s.estado}</span></td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" class="text-center text-muted" style="padding: 15px;">Sin compras registradas aún.</td></tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- DESPACHOS RECIENTES -->
      ${clientShipments.length > 0 ? `
        <div class="mt-4">
          <h4 class="text-sm font-bold mb-2" style="color: var(--text-main);">📦 Envíos y Guías de Carga Registradas</h4>
          <div class="table-responsive" style="max-height: 160px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>No. Guía</th>
                  <th>Transportadora</th>
                  <th>Cajas / Bultos</th>
                  <th>Contenido</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${clientShipments.map(sh => `
                  <tr>
                    <td><strong>${sh.numeroGuia}</strong></td>
                    <td>${sh.transportadora}</td>
                    <td>${sh.cajasTotal || 1} Cajas</td>
                    <td class="text-xs">${sh.contenidoDescripcion || '-'}</td>
                    <td><span class="badge ${sh.estadoCiclo === 'ENTREGADO' ? 'badge-success' : 'badge-info'}">${sh.estadoCiclo}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    Modal.show({
      title: `Ficha 360° del Cliente: ${client.nombre}`,
      content,
      size: 'lg',
      footerButtons: [
        { label: 'Cerrar', class: 'btn-secondary', onClick: () => Modal.close() }
      ]
    });
  }
};
