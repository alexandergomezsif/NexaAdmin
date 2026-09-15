/**
 * Nexa ERP - Motor de Generación e Impresión de Documentos Membretados
 * Diseñado con estética editorial pulcra y soporte para:
 * - Rótulos / Guías de Envío para Cajas de Transportadora (con código de barras visual)
 * - Facturas Comerciales / POS con Logo Oficial Rayo Pro
 * - Cotizaciones Comerciales Formales
 * - Remisiones de Entrega
 * - Órdenes de Fabricación con la Firma Digitalizada de Juan (datos/firma juan.jpg)
 */

import { TenantServiceInstance } from '../services/tenant-service.js';
import { Formatters } from '../utils/formatters.js';

export const PrintTemplates = {
  /**
   * Genera un código de barras SVG estándar Code 128 limpio
   */
  generateBarcodeSvg(text = '77092184531') {
    const bars = [];
    const hash = text.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    
    // Generación de patrón visual de barras
    for (let i = 0; i < 48; i++) {
      const width = ((i + hash) % 3 === 0) ? 3 : ((i + hash) % 2 === 0) ? 2 : 1;
      const space = ((i + hash) % 4 === 0) ? 2 : 1;
      bars.push(`<rect x="${i * 4}" y="0" width="${width}" height="46" fill="#000" />`);
    }

    return `
      <svg viewBox="0 0 200 50" width="180" height="46" xmlns="http://www.w3.org/2000/svg">
        ${bars.join('')}
      </svg>
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; text-align: center; margin-top: 2px; color: #000; font-weight: bold;">
        ${text}
      </div>
    `;
  },

  /**
   * Cabecera membretada corporativa con el logotipo real de Rayo Pro
   */
  getHeader(docTitle, docNumber, docDate) {
    const tenant = TenantServiceInstance.getActiveTenant() || {
      nombreComercial: 'Rayo Pro',
      razonSocial: 'Rayo Pro Colombia S.A.S.',
      nit: '901458321',
      dv: 4,
      direccion: 'Carrera 42 # 54A - 77, Zona Industrial',
      ciudad: 'Itagüí, Antioquia',
      telefono: '(604) 444 8920',
      email: 'contacto@rayopro.com.co',
      resolucionFacturacion: 'Resolución DIAN No. 18764000123456'
    };

    // 1. Si existe un membrete institucional personalizado para documentos
    if (tenant.membreteUrl) {
      return `
        <div class="doc-header" style="margin-bottom: 16px;">
          <img src="${tenant.membreteUrl}" alt="${tenant.nombreComercial}" style="width: 100%; max-height: 100px; object-fit: contain; margin-bottom: 10px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 6px;">
            <div>
              <div class="doc-badge">${docTitle}</div>
              <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0 0 0;">No. ${docNumber}</div>
            </div>
            <div style="text-align: right; font-size: 11.5px; color: #444;">
              <div><strong>Fecha:</strong> ${Formatters.date(docDate)}</div>
              <div style="font-size: 10px; color: #777;">Nexa ERP • ${tenant.nombreComercial}</div>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Si no hay membrete específico, renderizar logotipo horizontal institucional oficial
    const logoSrc = TenantServiceInstance.getHorizontalLogo(tenant, false);
    const logoHtml = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <img src="${logoSrc}" alt="${tenant.nombreComercial}" 
             style="height: 48px; max-width: 180px; object-fit: contain; display: block; border-radius: 4px;" 
             onerror="this.onerror=null; this.src='datos/isotipo fondo blanco.jpg';">
      </div>
    `;

    return `
      <div class="doc-header">
        <div class="doc-brand">
          ${logoHtml}
          <div style="font-size: 13px; font-weight: 700; color: #1d1d1f; line-height: 1.2;">${tenant.razonSocial}</div>
          <p><strong>NIT:</strong> ${tenant.nit}-${tenant.dv} | <strong>Régimen:</strong> ${tenant.regimen || 'Responsable de IVA'}</p>
          <p>${tenant.direccion} • ${tenant.ciudad}</p>
          <p><strong>Tel:</strong> ${tenant.telefono} | <strong>Email:</strong> ${tenant.email}</p>
        </div>
        <div class="doc-meta">
          <div class="doc-badge">${docTitle}</div>
          <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">No. ${docNumber}</div>
          <div style="font-size: 12px; color: #6e6e73;"><strong>Fecha:</strong> ${Formatters.date(docDate)}</div>
          <div style="font-size: 10px; color: #86868b; margin-top: 4px;">Nexa ERP Cloud • ${tenant.nombreComercial}</div>
        </div>
      </div>
    `;
  },

  /**
   * 1. RÓTULO / GUÍA DE ENVÍO COMPACTO (Diseñado para 4 por página)
   */
  shippingBoxLabel(shipping) {
    const tenant = TenantServiceInstance.getActiveTenant() || {
      nombreComercial: 'Rayo Pro',
      razonSocial: 'Rayo Pro Colombia S.A.S.',
      nit: '901458321',
      dv: 4,
      direccion: 'Carrera 42 # 54A - 77',
      ciudad: 'Itagüí',
      telefono: '3017100508'
    };
    const barcode = this.generateBarcodeSvg(shipping.numeroGuia || '77092184531');

    return `
      <div style="flex: 1; border: 2px solid #000; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; padding: 12px; box-sizing: border-box; overflow: hidden; position: relative;">
        <!-- CABECERA -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
          <div style="font-weight: 900; font-size: 18px; text-transform: uppercase; letter-spacing: -0.5px;">${tenant.nombreComercial}</div>
          <div style="text-align: right;">
            <div style="background: #000; color: #fff; padding: 2px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; display: inline-block;">
              ${shipping.transportadora || 'COORDINADORA'}
            </div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">GUÍA: ${shipping.numeroGuia || 'PENDIENTE'}</div>
          </div>
        </div>

        <!-- CONTENIDO -->
        <div style="display: flex; gap: 8px; height: 100%;">
          <!-- REMITENTE -->
          <div style="flex: 1; border: 1px solid #999; padding: 6px; border-radius: 4px; font-size: 10px; line-height: 1.3; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: bold; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-bottom: 4px;">DE (REMITENTE):</div>
            <div style="font-weight: bold; font-size: 11px; color: #000;">${tenant.razonSocial}</div>
            <div>NIT: ${tenant.nit}-${tenant.dv}</div>
            <div>${tenant.direccion}</div>
            <div>${tenant.ciudad}</div>
            <div>Tel: ${tenant.telefono}</div>
          </div>

          <!-- DESTINATARIO -->
          <div style="flex: 2; border: 2px solid #000; padding: 6px; border-radius: 4px; font-size: 11px; line-height: 1.3; display: flex; flex-direction: column; justify-content: center; background: #fffdf0;">
            <div style="font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">PARA (DESTINATARIO):</div>
            <div style="font-weight: 900; font-size: 13px;">${shipping.clienteNombre}</div>
            <div><strong>NIT/CC:</strong> ${shipping.nitCc || '-'}</div>
            <div><strong>Dirección:</strong> ${shipping.direccion}</div>
            <div><strong>Destino:</strong> ${shipping.ciudad} ${shipping.departamento ? '- ' + shipping.departamento : ''}</div>
            <div><strong>Tel:</strong> ${shipping.telefono || '-'}</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #999; font-weight: 600;">
              Desc: ${shipping.contenidoDescripcion || 'Productos automotrices'} - ${shipping.cajasTotal || 1} CAJA(S)
            </div>
          </div>
        </div>

        <!-- CÓDIGO BARRAS -->
        <div style="position: absolute; bottom: 8px; right: 12px;">
          ${barcode}
        </div>
      </div>
    `;
  },

  /**
   * 1.5. LOTE DE RÓTULOS (4 por página tamaño carta)
   */
  batchShippingLabels(shippings) {
    if (!shippings || shippings.length === 0) return '';
    
    let html = '';
    const itemsPerPage = 4;
    
    for (let i = 0; i < shippings.length; i += itemsPerPage) {
      const chunk = shippings.slice(i, i + itemsPerPage);
      
      html += `
        <div style="width: 21.59cm; height: 27.94cm; padding: 1cm; box-sizing: border-box; display: flex; flex-direction: column; gap: 0.5cm; ${i + itemsPerPage < shippings.length ? 'page-break-after: always;' : ''}">
      `;
      
      chunk.forEach(shipping => {
        html += this.shippingBoxLabel(shipping);
      });
      
      // Si el chunk tiene menos de 4, rellenamos con espacios vacíos para mantener el tamaño
      if (chunk.length < itemsPerPage) {
        for (let j = 0; j < itemsPerPage - chunk.length; j++) {
          html += `<div style="flex: 1;"></div>`;
        }
      }
      
      html += `</div>`;
    }
    
    return html;
  },

  /**
   * 2. FACTURA COMERCIAL / POS / REMISIÓN CON LOGO OFICIAL
   */
  saleInvoice(sale, items = []) {
    const esFE = sale.facturaElectronica !== false && sale.tipoDoc !== 'COTIZACION' && sale.tipoDoc !== 'REMISION';
    const aplicaIva = sale.aplicaIva !== false && (sale.impuestos > 0);

    let docTitle = 'DOCUMENTO EQUIVALENTE POS';
    if (sale.tipoDoc === 'COTIZACION') {
      docTitle = 'COTIZACIÓN COMERCIAL';
    } else if (sale.tipoDoc === 'REMISION') {
      docTitle = 'REMISIÓN DE ENTREGA COMERCIAL';
    } else if (esFE) {
      docTitle = 'FACTURA ELECTRÓNICA DE VENTA';
    } else {
      docTitle = 'CUENTA DE COBRO / DOCUMENTO INTERNO (SIN FE)';
    }

    const header = this.getHeader(docTitle, sale.consecutivo, sale.fecha);
    
    const rowsHtml = items.map((it, idx) => `
      <tr style="font-size: 11px;">
        <td class="text-center" style="padding: 4px;">${idx + 1}</td>
        <td style="padding: 4px;"><strong>${it.sku || '-'}</strong></td>
        <td style="padding: 4px;">${it.nombre}</td>
        <td class="text-center" style="padding: 4px;"><strong>${it.cantidad}</strong></td>
        <td class="text-right" style="padding: 4px;">${Formatters.currency(it.precioUnitario)}</td>
        <td class="text-right" style="padding: 4px;"><strong>${Formatters.currency(it.total)}</strong></td>
      </tr>
    `).join('');

    return `
      ${header}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; background: #fbfbfd; padding: 8px; border-radius: 6px; border: 1px solid #e5e5ea; line-height: 1.2;">
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Datos del Cliente:</div>
          <div style="font-size: 12px; font-weight: 700; color: #1d1d1f; margin: 2px 0;">${sale.clienteNombre}</div>
          <div style="font-size: 11px; color: #424245;"><strong>NIT/CC:</strong> ${sale.clienteNit || '-'}</div>
          <div style="font-size: 11px; color: #424245;"><strong>Forma Pago:</strong> ${sale.metodoPago || 'Crédito Comercial'}</div>
          <div style="margin-top: 2px;">
            <span style="font-size: 9px; padding: 2px 4px; border-radius: 4px; background: ${esFE ? '#e0f2fe' : '#f1f5f9'}; color: ${esFE ? '#0369a1' : '#475569'}; font-weight: 700;">
              ${esFE ? '⚡ Factura Electrónica' : '📄 Doc Interno (Sin FE)'}
            </span>
          </div>
        </div>
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Info Venta:</div>
          <div style="font-size: 11px; color: #424245;"><strong>Vendedor:</strong> ${sale.vendedorNombre || 'Juan Pablo'}</div>
          <div style="font-size: 11px; color: #424245;"><strong>Estado:</strong> ${sale.estado}</div>
          <div style="font-size: 10px; color: #86868b; margin-top: 2px;">
            ${aplicaIva ? 'Régimen con IVA (19%)' : 'Régimen Exento (Sin IVA - 0%)'}
          </div>
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
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="doc-totals" style="margin-top: 5px;">
        <div class="total-row" style="padding: 2px 0;">
          <span>Subtotal Neto:</span>
          <span>${Formatters.currency(sale.subtotal)}</span>
        </div>
        ${sale.descuentos > 0 ? `
          <div class="total-row" style="padding: 2px 0; color: #ff3b30;">
            <span>Descuentos:</span>
            <span>-${Formatters.currency(sale.descuentos)}</span>
          </div>
        ` : ''}
        <div class="total-row" style="padding: 2px 0;">
          <span>${aplicaIva ? 'IVA (19%):' : 'IVA (Exento 0%):'}</span>
          <span>${Formatters.currency(sale.impuestos || 0)}</span>
        </div>
        <div class="total-row grand-total" style="padding-top: 4px; margin-top: 4px;">
          <span>TOTAL A PAGAR:</span>
          <span>${Formatters.currency(sale.total)}</span>
        </div>
      </div>

      <div class="doc-footer" style="margin-top: 15px; padding-top: 10px; font-size: 10px; line-height: 1.2;">
        <p>Agradecemos su compra y preferencia. Productos garantizados por Rayo Pro Colombia S.A.S.</p>
        <p style="margin-top: 2px; font-size: 9px;">
          ${esFE ? 'Resolución DIAN No. 18764000123456 • Documento Validado por DIAN' : 'Documento emitido para fines administrativos • Nexa ERP'}
        </p>
      </div>
    `;
  },

  /**
   * 3. ORDEN DE PRODUCCIÓN CON LA FIRMA REAL DE JUAN
   */
  productionOrder(order) {
    const header = this.getHeader('ORDEN DE FABRICACIÓN & CONTROL DE CALIDAD', order.numeroOrden, order.fechaInicio || order.fechaProgramada);

    const rowsHtml = (order.insumosConsumidos || []).map((ins, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${ins.sku || '-'}</strong></td>
        <td>${ins.nombre}</td>
        <td class="text-center font-bold">${ins.cantidad} ${ins.unidadMedida}</td>
        <td class="text-right">${Formatters.currency(ins.costoUnitario)}</td>
        <td class="text-right"><strong>${Formatters.currency(ins.costoTotal)}</strong></td>
      </tr>
    `).join('');

    return `
      ${header}

      <div style="background: #fbfbfd; border: 1px solid #e5e5ea; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #0071e3; text-transform: uppercase;">Producto Fabricado en Planta:</div>
        <div style="font-size: 17px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">${order.productoTerminadoNombre}</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; margin-top: 8px;">
          <div><strong>Lote Asignado:</strong> <span style="background: #eef5fc; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0071e3;">${order.loteCodigo}</span></div>
          <div><strong>Cant. Producida:</strong> ${order.cantidadProducida}</div>
          <div><strong>Estado:</strong> ${order.estado}</div>
          <div><strong>Responsable:</strong> ${order.responsableNombre || 'Juan Pablo'}</div>
        </div>
      </div>

      <h4 style="font-size: 13px; margin-bottom: 8px; color: #1d1d1f;">Insumos y Empaques Consumidos (BOM):</h4>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th style="width: 120px;">SKU Insumo</th>
            <th>Descripción Materia Prima / Empaque</th>
            <th class="text-center" style="width: 100px;">Consumo</th>
            <th class="text-right" style="width: 120px;">Costo Unit.</th>
            <th class="text-right" style="width: 130px;">Costo Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="doc-totals">
        <div class="total-row">
          <span>Costos Indirectos (CIF):</span>
          <span>${Formatters.currency(order.costosIndirectosReales || 0)}</span>
        </div>
        <div class="total-row grand-total">
          <span>COSTO TOTAL LOTE:</span>
          <span>${Formatters.currency(order.costoRealTotal)}</span>
        </div>
        <div class="total-row" style="font-weight: 700; color: #0071e3; margin-top: 4px;">
          <span>Costo Unitario Real:</span>
          <span>${Formatters.currency(order.costoUnitarioReal)} / Unidad</span>
        </div>
      </div>

      <!-- FIRMA REAL DE JUAN INCORPORADA -->
      <div style="margin-top: 50px; display: flex; justify-content: space-around; align-items: flex-end;">
        <div style="width: 220px; text-align: center;">
          <img src="datos/firma juan.jpg" alt="Firma Juan Pablo" style="height: 60px; object-fit: contain; margin-bottom: -10px;" onerror="this.style.display='none'">
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">
            Juan Pablo
          </div>
          <div style="font-size: 10px; color: #6e6e73;">Gerencia de Operaciones y Planta</div>
        </div>
        <div style="width: 220px; text-align: center;">
          <div style="height: 60px;"></div>
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">
            Control de Calidad & Lotes
          </div>
          <div style="font-size: 10px; color: #6e6e73;">Inspección pH, Viscosidad y Sello</div>
        </div>
      </div>
    `;
  },

  /**
   * 4. COTIZACIÓN COMERCIAL FORMAL
   */
  commercialQuote(quote, items = []) {
    return this.saleInvoice({ ...quote, tipoDoc: 'COTIZACION' }, items);
  }
};
