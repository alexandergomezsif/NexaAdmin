/**
 * Nexa ERP - Módulo 20: Centro de Documentos & Plantillas Membretadas
 * Visor interactivo e impresión de Facturas, Cotizaciones, Remisiones y Órdenes
 */

import { DB, STORES } from '../services/db-service.js';
import { PrintTemplates } from '../components/print-template.js';
import { ExportService } from '../services/export-service.js';
import { TenantServiceInstance } from '../services/tenant-service.js';

export const DocumentsModule = {
  async render(container) {
    const tenant = TenantServiceInstance.getActiveTenant();
    const tenantId = tenant ? tenant.id : 'tenant_rayopro';

    const [sales, orders, shipments] = await Promise.all([
      DB.getAll(STORES.SALES, tenantId),
      DB.getAll(STORES.PRODUCTION_ORDERS, tenantId),
      DB.getAll(STORES.ORDERS_SHIPPING, tenantId)
    ]);

    const sampleSale = sales[0] || {
      consecutivo: 'RP-10026',
      fecha: new Date().toISOString(),
      clienteNombre: 'Jhon Jairo Chalarca Acevedo (Cano)',
      clienteNit: '1096037405-1',
      vendedorNombre: 'Juan Pablo (Gerente)',
      metodoPago: 'Transferencia Bancaria',
      subtotal: 1800000,
      descuentos: 0,
      impuestos: 342000,
      total: 2142000,
      items: [
        { sku: 'DESENG-1L', nombre: 'Desengrasante Automotriz 1L (Caja x 12)', cantidad: 10, precioUnitario: 114000, total: 1140000 },
        { sku: 'SHAMP-1L', nombre: 'Shampoo Desincrustante 1L (Caja x 12)', cantidad: 7, precioUnitario: 143000, total: 1002000 }
      ]
    };

    const sampleOrder = orders[0] || {
      numeroLote: 'LOT-2026-0912',
      productoNombre: 'Desengrasante Automotriz 1 Litro (Cajas x 12)',
      cantidadPlanificada: 120,
      unidadMedida: 'Botellas (10 Cajas x 12)',
      fechaPlanificada: new Date().toISOString().split('T')[0],
      responsable: 'Juan Pablo (Gerente Operativo)',
      estado: 'EN_PROCESO',
      insumos: [
        { materiaPrimaNombre: 'Base Alcalina Concentrada', cantidadRequerida: 36, unidadMedida: 'Kg', costoUnitario: 9200, costoTotal: 331200 },
        { materiaPrimaNombre: 'Botella PEAD 1 Litro Blanca', cantidadRequerida: 120, unidadMedida: 'Unidad', costoUnitario: 1100, costoTotal: 132000 },
        { materiaPrimaNombre: 'Caja Corrugada Rayo Pro x 12', cantidadRequerida: 10, unidadMedida: 'Unidad', costoUnitario: 2200, costoTotal: 22000 }
      ]
    };

    const sampleShipping = shipments[0] || {
      numeroGuia: '77092184531',
      transportadora: 'Coordinadora Mercantil Carga',
      clienteNombre: 'Jhon Jairo Chalarca Acevedo (Cano Trucks)',
      nitCc: '1096037405-1',
      telefono: '3017100508',
      whatsapp: '+57 301 710 0508',
      email: 'jhon.chalarca@canotrucks.co',
      direccion: 'Manzana A Casa 17',
      barrio: 'La Estación',
      ciudad: 'La Tebaida',
      departamento: 'Quindío',
      contenidoDescripcion: '17 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)',
      cajasTotal: 17,
      observaciones: 'Entregar en portería principal talleres Cano Trucks. Manejar con cuidado.'
    };

    let activeDocType = 'INVOICE';

    const getPreviewHtml = (type) => {
      if (type === 'INVOICE') {
        return PrintTemplates.saleInvoice({ ...sampleSale, tipoDoc: 'POS' }, sampleSale.items);
      } else if (type === 'QUOTE') {
        return PrintTemplates.commercialQuote({ ...sampleSale, consecutivo: 'COT-2026-088' }, sampleSale.items);
      } else if (type === 'SHIPPING_NOTE') {
        return PrintTemplates.saleInvoice({ ...sampleSale, tipoDoc: 'REMISION', consecutivo: 'REM-2026-015' }, sampleSale.items);
      } else if (type === 'PRODUCTION') {
        return PrintTemplates.productionOrder(sampleOrder);
      } else if (type === 'SHIPPING_LABEL') {
        return PrintTemplates.shippingBoxLabel(sampleShipping);
      }
      return '';
    };

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Visor de Documentos & Plantillas Membretadas</h1>
          <p>Plantillas dinámicas que adoptan automáticamente la identidad corporativa de <strong>${tenant.nombreComercial}</strong></p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-print-active-doc">🖨️ Imprimir / Descargar PDF</button>
        </div>
      </div>

      <!-- SELECTOR DE PLANTILLAS TIPO IOS SEGMENTED CONTROL -->
      <div class="mb-4 d-flex items-center gap-3 flex-wrap">
        <span class="text-xs font-bold text-muted">DOCUMENTO:</span>
        <div class="ios-segmented-control" id="doc-segmented-tabs">
          <button class="ios-segment-btn active doc-tab-btn" data-doc="INVOICE">🧾 Factura / POS</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="QUOTE">📑 Cotización Comercial</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="SHIPPING_LABEL">🏷️ Rótulo Envío (Cajas)</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="SHIPPING_NOTE">🚚 Remisión de Entrega</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="PRODUCTION">⚙️ Orden con Firma</button>
        </div>
      </div>

      <!-- VISTA PREVIA DEL DOCUMENTO EN HOJA TIPO CARTA -->
      <div class="card" style="background: rgba(0, 0, 0, 0.06); padding: 14px; display: flex; justify-content: center; overflow-x: auto; border: 1px solid var(--border-color);">
        <div id="doc-sheet-preview" style="background: #ffffff; color: #000000; width: 100%; max-width: 800px; min-height: 700px; padding: 24px; box-shadow: var(--shadow-md); border-radius: 6px; font-size: 13px;">
          ${getPreviewHtml('INVOICE')}
        </div>
      </div>
    `;

    // Cambiar de plantilla
    container.querySelectorAll('.doc-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.doc-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeDocType = btn.getAttribute('data-doc');
        container.querySelector('#doc-sheet-preview').innerHTML = getPreviewHtml(activeDocType);
      });
    });

    // Imprimir
    container.querySelector('#btn-print-active-doc').addEventListener('click', () => {
      const html = getPreviewHtml(activeDocType);
      ExportService.printDocument(html, `Documento_${activeDocType}_${tenant.nombreComercial}`);
    });
  }
};
