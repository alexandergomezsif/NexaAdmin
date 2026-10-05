/**
 * Nexa ERP - Plantillas de documentos imprimibles
 * - Rótulos de envío (4 por hoja carta)
 * - Documento interno de venta / venta a crédito / cotización
 * - Orden de fabricación con firma configurable por empresa
 *
 * Importante (Colombia): estos documentos NO son factura electrónica ni documento
 * equivalente electrónico. Mientras no exista integración con un proveedor tecnológico
 * autorizado por la DIAN, se rotulan como documento interno.
 *
 * Todo dato de usuario se escapa con esc() para evitar inyección de HTML.
 */

import { TenantServiceInstance } from '../services/tenant-service.js';
import { Formatters, esc } from '../utils/formatters.js';

const LEGAL_NOTE = 'Documento interno — no válido como factura electrónica de venta.';

function tenantOrBlank() {
  return TenantServiceInstance.getActiveTenant() || {
    nombreComercial: 'Empresa', razonSocial: 'Empresa', nit: '', dv: '', direccion: '', ciudad: '', telefono: '', email: ''
  };
}

export const PrintTemplates = {
  /** Cabecera membretada de la empresa activa */
  getHeader(docTitle, docNumber, docDate) {
    const tenant = tenantOrBlank();

    if (tenant.membreteUrl) {
      return `
        <div class="doc-header" style="display: block; margin-bottom: 16px;">
          <img src="${esc(tenant.membreteUrl)}" alt="${esc(tenant.nombreComercial)}" style="width: 100%; max-height: 100px; object-fit: contain; margin-bottom: 10px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 6px;">
            <div>
              <div class="doc-badge">${esc(docTitle)}</div>
              <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0 0 0;">No. ${esc(docNumber)}</div>
            </div>
            <div style="text-align: right; font-size: 11.5px; color: #444;">
              <div><strong>Fecha:</strong> ${esc(Formatters.dateTime(docDate))}</div>
            </div>
          </div>
        </div>
      `;
    }

    const logoSrc = TenantServiceInstance.getHorizontalLogo(tenant, false);
    return `
      <div class="doc-header">
        <div class="doc-brand">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <img src="${esc(logoSrc)}" alt="${esc(tenant.nombreComercial)}" style="height: 48px; max-width: 180px; object-fit: contain; display: block; border-radius: 4px;" onerror="this.style.display='none'">
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #1d1d1f; line-height: 1.2;">${esc(tenant.razonSocial || tenant.nombreComercial)}</div>
          <p><strong>NIT:</strong> ${esc(tenant.nit)}${tenant.dv !== undefined && tenant.dv !== null && tenant.dv !== '' ? '-' + esc(tenant.dv) : ''} | <strong>Régimen:</strong> ${esc(tenant.regimen || '-')}</p>
          <p>${esc(tenant.direccion || '')}${tenant.ciudad ? ' • ' + esc(tenant.ciudad) : ''}</p>
          <p>${tenant.telefono ? '<strong>Tel:</strong> ' + esc(tenant.telefono) : ''}${tenant.email ? ' | <strong>Email:</strong> ' + esc(tenant.email) : ''}</p>
        </div>
        <div class="doc-meta">
          <div class="doc-badge">${esc(docTitle)}</div>
          <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">No. ${esc(docNumber)}</div>
          <div style="font-size: 12px; color: #6e6e73;"><strong>Fecha:</strong> ${esc(Formatters.dateTime(docDate))}</div>
        </div>
      </div>
    `;
  },

  /** 1. Rótulo de envío (diseñado para 4 por página) */
  shippingBoxLabel(shipping) {
    const tenant = tenantOrBlank();
    const qr = tenant.qrResenaUrl
      ? `<div style="position: absolute; top: 10px; right: 10px; text-align: center; width: 70px;">
           <img src="${esc(tenant.qrResenaUrl)}" alt="QR" style="width: 55px; height: 55px; display: block; margin: 0 auto;">
           <div style="font-size: 8px; line-height: 1.2; margin-top: 4px; font-weight: bold; color: #444;">${esc(tenant.qrResenaTexto || 'DÉJANOS UNA RESEÑA')}</div>
         </div>`
      : '';

    return `
      <div style="flex: 1; min-height: 225px; border: 2px solid #000; border-radius: 8px; display: flex; flex-direction: column; padding: 8px; box-sizing: border-box; position: relative; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
          <div style="font-weight: 900; font-size: 14px;">${esc(tenant.nombreComercial)}</div>
          <div style="text-align: right;">
            <div style="background: #000; color: #fff; padding: 2px 8px; font-weight: bold; border-radius: 4px; font-size: 11px; display: inline-block;">
              ${esc(shipping.transportadora || 'Transportadora por definir')}
            </div>
            <div style="font-size: 10px; font-weight: bold; margin-top: 4px;">GUÍA: ${esc(shipping.numeroGuia || 'PENDIENTE')} · DOC: ${esc(shipping.documentoNumero || '-')}</div>
          </div>
        </div>

        <div style="display: flex; flex: 1; gap: 12px;">
          <div style="flex: 1; border: 2px solid #000; padding: 6px; border-radius: 4px; font-size: 10px; line-height: 1.2; display: flex; flex-direction: column;">
            <div style="color: #444; margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px;">DE (REMITENTE):</div>
            <div style="font-weight: 900; font-size: 11px;">${esc(tenant.razonSocial || tenant.nombreComercial)}</div>
            <div>NIT: ${esc(tenant.nit)}${tenant.dv !== undefined && tenant.dv !== '' ? '-' + esc(tenant.dv) : ''}</div>
            <div>${esc(tenant.direccion || '')}</div>
            <div>${esc(tenant.ciudad || '')}</div>
            <div>Tel: ${esc(tenant.telefono || '')}</div>
          </div>

          <div style="flex: 2; border: 2px solid #000; padding: 6px; ${qr ? 'padding-right: 90px;' : ''} border-radius: 4px; font-size: 11px; line-height: 1.2; display: flex; flex-direction: column; background: #fffdf0; position: relative;">
            <div style="font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">PARA (DESTINATARIO):</div>
            <div style="font-weight: 900; font-size: 13px;">${esc(shipping.clienteNombre)}</div>
            <div><strong>NIT/CC:</strong> ${esc(shipping.nitCc || '-')}</div>
            <div><strong>Dirección:</strong> ${esc(shipping.direccion || '-')}${shipping.barrio ? ' (' + esc(shipping.barrio) + ')' : ''}</div>
            <div><strong>Destino:</strong> ${esc(shipping.ciudad || '-')} ${shipping.departamento ? '- ' + esc(shipping.departamento) : ''}</div>
            <div><strong>Tel:</strong> ${esc(shipping.telefono || '-')}</div>
            <div style="margin-top: 2px; padding-top: 2px; border-top: 1px dashed #999; font-weight: 600;">
              Contenido: ${esc(shipping.contenidoDescripcion || 'Mercancía')} - ${esc(shipping.cajasTotal || 1)} CAJA(S)
            </div>
            ${qr}
          </div>
        </div>
      </div>
    `;
  },

  /** 1.5. Lote de rótulos (4 por página carta) */
  batchShippingLabels(shippings) {
    if (!shippings || shippings.length === 0) return '';
    let html = '';
    const perPage = 4;
    for (let i = 0; i < shippings.length; i += perPage) {
      const chunk = shippings.slice(i, i + perPage);
      html += `<div style="box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; ${i + perPage < shippings.length ? 'page-break-after: always;' : ''}">`;
      chunk.forEach(s => { html += this.shippingBoxLabel(s); });
      for (let j = chunk.length; j < perPage; j++) html += '<div style="flex: 1;"></div>';
      html += '</div>';
    }
    return html;
  },

  /** 2. Documento de venta / venta a crédito / cotización */
  saleInvoice(sale, items = []) {
    const tipo = sale.tipoDoc;
    const anulada = sale.estado === 'ANULADA';
    const esCotizacion = tipo === 'COTIZACION' || sale.estado === 'COTIZACION';
    const esCredito = tipo === 'VENTA_CREDITO' || sale.metodoPago === 'Crédito';
    const conIva = Number(sale.impuestos || 0) > 0;

    let docTitle = 'DOCUMENTO INTERNO DE VENTA';
    if (esCotizacion) docTitle = 'COTIZACIÓN';
    else if (esCredito) docTitle = 'VENTA A CRÉDITO (DOC. INTERNO)';

    const header = this.getHeader(docTitle, sale.consecutivo, sale.fecha);
    const rows = (items || []).map((it, idx) => `
      <tr style="font-size: 11px;">
        <td class="text-center" style="padding: 4px;">${idx + 1}</td>
        <td style="padding: 4px;"><strong>${esc(it.sku || '-')}</strong></td>
        <td style="padding: 4px;">${esc(it.nombre)}</td>
        <td class="text-center" style="padding: 4px;"><strong>${esc(it.cantidad)}</strong></td>
        <td class="text-right" style="padding: 4px;">${Formatters.currency(it.precioUnitario)}</td>
        <td class="text-right" style="padding: 4px;"><strong>${Formatters.currency(it.total !== undefined ? it.total : it.cantidad * it.precioUnitario)}</strong></td>
      </tr>
    `).join('');

    const validez = esCotizacion
      ? `<p style="margin-top: 2px;">Cotización válida por ${esc(tenantOrBlank().diasValidezCotizacion || 15)} días. Precios sujetos a disponibilidad de inventario.</p>`
      : '';

    return `
      <div style="position: relative;">
      ${anulada ? `<div style="position: absolute; top: 35%; left: 0; right: 0; text-align: center; font-size: 72px; font-weight: 900; color: rgba(220, 38, 38, 0.18); transform: rotate(-18deg); pointer-events: none;">ANULADA</div>` : ''}
      ${header}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; background: #fbfbfd; padding: 8px; border-radius: 6px; border: 1px solid #e5e5ea; line-height: 1.3;">
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Cliente</div>
          <div style="font-size: 12px; font-weight: 700; color: #1d1d1f; margin: 2px 0;">${esc(sale.clienteNombre)}</div>
          <div style="font-size: 11px; color: #424245;"><strong>NIT/CC:</strong> ${esc(sale.clienteNit || '-')}</div>
          ${esCotizacion ? '' : `<div style="font-size: 11px; color: #424245;"><strong>Forma de pago:</strong> ${esc(sale.metodoPago || '-')}</div>`}
        </div>
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Información</div>
          <div style="font-size: 11px; color: #424245;"><strong>Atendió:</strong> ${esc(sale.vendedorNombre || '-')}</div>
          ${sale.freelancerNombre ? `<div style="font-size: 11px; color: #424245;"><strong>Asesor comercial:</strong> ${esc(sale.freelancerNombre)}</div>` : ''}
          <div style="font-size: 11px; color: #424245;"><strong>Estado:</strong> ${esc(sale.estado)}</div>
          <div style="font-size: 10px; color: #86868b; margin-top: 2px;">${conIva ? 'Incluye IVA discriminado' : 'Sin IVA liquidado'}</div>
        </div>
      </div>

      <table style="margin-bottom: 10px;">
        <thead>
          <tr style="font-size: 11px;">
            <th class="text-center" style="width: 30px; padding: 4px;">#</th>
            <th style="width: 100px; padding: 4px;">SKU</th>
            <th style="padding: 4px;">Descripción</th>
            <th class="text-center" style="width: 50px; padding: 4px;">Cant.</th>
            <th class="text-right" style="width: 90px; padding: 4px;">V. Unit</th>
            <th class="text-right" style="width: 100px; padding: 4px;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="doc-totals" style="margin-top: 5px;">
        <div class="total-row" style="padding: 2px 0;"><span>Base (antes de IVA):</span><span>${Formatters.currency(sale.subtotal)}</span></div>
        ${Number(sale.descuentos) > 0 ? `<div class="total-row" style="padding: 2px 0; color: #ff3b30;"><span>Descuentos:</span><span>-${Formatters.currency(sale.descuentos)}</span></div>` : ''}
        <div class="total-row" style="padding: 2px 0;"><span>IVA:</span><span>${Formatters.currency(sale.impuestos || 0)}</span></div>
        <div class="total-row grand-total" style="padding-top: 4px; margin-top: 4px;"><span>TOTAL:</span><span>${Formatters.currency(sale.total)}</span></div>
        ${!esCotizacion && !esCredito && Number(sale.cambio) > 0 ? `<div class="total-row" style="padding: 2px 0; font-size: 11px;"><span>Recibido / Cambio:</span><span>${Formatters.currency(sale.pagoRecibido)} / ${Formatters.currency(sale.cambio)}</span></div>` : ''}
      </div>

      ${anulada && sale.anulacion ? `<div style="margin-top: 10px; padding: 8px; border: 1px solid #fca5a5; border-radius: 6px; font-size: 11px; color: #991b1b;"><strong>Anulada</strong> el ${esc(Formatters.dateTime(sale.anulacion.fecha))} por ${esc(sale.anulacion.usuarioNombre)}. Motivo: ${esc(sale.anulacion.motivo)}</div>` : ''}

      <div class="doc-footer" style="margin-top: 15px; padding-top: 10px; font-size: 10px; line-height: 1.3;">
        ${tenantOrBlank().piePaginaDocumentos ? `<p>${esc(tenantOrBlank().piePaginaDocumentos)}</p>` : '<p>Gracias por su compra.</p>'}
        ${validez}
        <p style="margin-top: 4px; font-size: 9px; font-weight: 700;">${LEGAL_NOTE}</p>
      </div>
      </div>
    `;
  },

  /** 3. Orden de fabricación con firma configurable */
  productionOrder(order) {
    const tenant = tenantOrBlank();
    const header = this.getHeader('ORDEN DE FABRICACIÓN', order.numeroOrden, order.fechaInicio || order.fechaProgramada);
    const rows = (order.insumosConsumidos || []).map((ins, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${esc(ins.sku || '-')}</strong></td>
        <td>${esc(ins.nombre)}</td>
        <td class="text-center font-bold">${esc(ins.cantidad)} ${esc(ins.unidadMedida || '')}</td>
        <td class="text-right">${Formatters.currency(ins.costoUnitario, 2)}</td>
        <td class="text-right"><strong>${Formatters.currency(ins.costoTotal)}</strong></td>
      </tr>
    `).join('');

    return `
      ${header}
      <div style="background: #fbfbfd; border: 1px solid #e5e5ea; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #0071e3; text-transform: uppercase;">Producto fabricado</div>
        <div style="font-size: 17px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">${esc(order.productoTerminadoNombre)}</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; margin-top: 8px;">
          <div><strong>Lote:</strong> ${esc(order.loteCodigo)}</div>
          <div><strong>Cantidad:</strong> ${esc(order.cantidadProducida)}</div>
          <div><strong>Estado:</strong> ${esc(order.estado)}</div>
          <div><strong>Responsable:</strong> ${esc(order.responsableNombre || '-')}</div>
        </div>
      </div>

      <h4 style="font-size: 13px; margin-bottom: 8px; color: #1d1d1f;">Insumos y empaques consumidos</h4>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th style="width: 120px;">SKU</th>
            <th>Descripción</th>
            <th class="text-center" style="width: 100px;">Consumo</th>
            <th class="text-right" style="width: 120px;">Costo unit.</th>
            <th class="text-right" style="width: 130px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="doc-totals">
        <div class="total-row"><span>Costos indirectos (CIF):</span><span>${Formatters.currency(order.costosIndirectosReales || 0)}</span></div>
        <div class="total-row grand-total"><span>COSTO TOTAL LOTE:</span><span>${Formatters.currency(order.costoRealTotal)}</span></div>
        <div class="total-row" style="font-weight: 700; color: #0071e3; margin-top: 4px;"><span>Costo unitario real:</span><span>${Formatters.currency(order.costoUnitarioReal, 2)}</span></div>
      </div>

      <div style="margin-top: 50px; display: flex; justify-content: space-around; align-items: flex-end;">
        <div style="width: 220px; text-align: center;">
          ${tenant.firmaUrl ? `<img src="${esc(tenant.firmaUrl)}" alt="Firma" style="height: 60px; object-fit: contain; margin-bottom: -10px;" onerror="this.style.display='none'">` : '<div style="height: 60px;"></div>'}
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">${esc(tenant.firmaNombre || 'Responsable de planta')}</div>
          <div style="font-size: 10px; color: #6e6e73;">${esc(tenant.firmaCargo || 'Operaciones y planta')}</div>
        </div>
        <div style="width: 220px; text-align: center;">
          <div style="height: 60px;"></div>
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">Control de calidad</div>
          <div style="font-size: 10px; color: #6e6e73;">Inspección pH, viscosidad y sello</div>
        </div>
      </div>
    `;
  },

  /** 4. Cotización */
  commercialQuote(quote, items = []) {
    return this.saleInvoice({ ...quote, tipoDoc: 'COTIZACION' }, items);
  }
};
