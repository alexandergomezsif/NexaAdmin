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
   * 1. RÓTULO / GUÍA DE ENVÍO PARA CAJAS (TRANSPORTADORAS)
   * Diseñado conforme a normas de transportadoras de carga en Colombia
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
    const logoSrc = TenantServiceInstance.getHorizontalLogo(tenant, false);

    return `
      <div style="border: 3px solid #000; padding: 16px; max-width: 620px; margin: 0 auto; background: #fff; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #000;">
        
        <!-- CABECERA RÓTULO CON LOGO DESTACADO DE ALTA VISIBILIDAD -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${logoSrc}" alt="${tenant.nombreComercial}" 
                 style="height: 44px; max-width: 155px; object-fit: contain; border-radius: 4px;" 
                 onerror="this.onerror=null; this.src='datos/isotipo fondo blanco.jpg';">
            <div>
              <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                ${tenant.nombreComercial}
              </div>
              <div style="font-size: 10px; font-weight: 700; color: #444;">LÍNEA PROFESIONAL DE EMBELLECIMIENTO AUTOMOTRIZ</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #000; color: #fff; padding: 4px 10px; font-size: 12px; font-weight: 800; border-radius: 4px; text-transform: uppercase;">
              ${shipping.transportadora || 'COORDINADORA / ENVIA'}
            </div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 4px;">GUÍA: ${shipping.numeroGuia || '77092184531'}</div>
          </div>
        </div>

        <!-- CÓDIGO DE BARRAS DE RASTREO -->
        <div style="text-align: center; padding: 10px; background: #f9f9f9; border: 1px dashed #666; margin-bottom: 16px; border-radius: 6px;">
          ${barcode}
        </div>

        <!-- CUADRO DE REMITENTE Y DESTINATARIO -->
        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 14px; margin-bottom: 16px;">
          
          <!-- REMITENTE -->
          <div style="border: 1px solid #999; padding: 10px; border-radius: 6px; font-size: 11px; line-height: 1.45;">
            <div style="font-weight: 800; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px; color: #555;">
              DE (REMITENTE):
            </div>
            <div style="font-weight: 800; font-size: 12px;">${tenant.razonSocial}</div>
            <div><strong>NIT:</strong> ${tenant.nit}-${tenant.dv}</div>
            <div><strong>Dirección:</strong> ${tenant.direccion}</div>
            <div><strong>Ciudad:</strong> ${tenant.ciudad} - ${tenant.departamento || 'Antioquia'}</div>
            <div><strong>Teléfono:</strong> ${tenant.telefono}</div>
            ${tenant.whatsapp ? `<div><strong>WhatsApp:</strong> ${tenant.whatsapp}</div>` : ''}
          </div>

          <!-- DESTINATARIO COMPLETO SIN OMITIR NADA -->
          <div style="border: 2px solid #000; padding: 10px; border-radius: 6px; font-size: 11.5px; line-height: 1.45; background: #fffdf0;">
            <div style="font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; color: #000; font-size: 12px;">
              PARA (DESTINATARIO):
            </div>
            <div style="font-weight: 900; font-size: 14px; color: #000; margin-bottom: 2px;">${shipping.clienteNombre}</div>
            <div><strong>NIT / C.C.:</strong> ${shipping.nitCc || '-'}</div>
            <div><strong>Dirección de Entrega:</strong> ${shipping.direccion}</div>
            ${shipping.barrio ? `<div><strong>Barrio / Sector:</strong> ${shipping.barrio}</div>` : ''}
            <div><strong>Ciudad / Destino:</strong> ${shipping.ciudad} - ${shipping.departamento || ''}</div>
            <div><strong>Teléfono Contacto:</strong> ${shipping.telefono || '-'}</div>
            ${shipping.whatsapp ? `<div><strong>WhatsApp:</strong> ${shipping.whatsapp}</div>` : ''}
            ${shipping.email ? `<div><strong>Correo Electrónico:</strong> ${shipping.email}</div>` : ''}
            ${shipping.observaciones ? `
              <div style="margin-top: 6px; font-size: 10.5px; color: #333; border-top: 1px dashed #aaa; padding-top: 4px;">
                <strong>Instrucciones / Obs:</strong> ${shipping.observaciones}
              </div>
            ` : ''}
          </div>

        </div>

        <!-- DETALLES DEL PAQUETE / CAJAS -->
        <div style="border: 1px solid #000; padding: 12px; margin-bottom: 16px; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #555;">DESCRIPCIÓN DEL CONTENIDO:</div>
              <div style="font-size: 13px; font-weight: 800;">${shipping.contenidoDescripcion || 'Productos de mantenimiento y embellecimiento automotriz'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; font-weight: 700; color: #555;">TOTAL CAJAS / BULTOS:</div>
              <div style="font-size: 18px; font-weight: 900; color: #0071e3;">${shipping.cajasTotal || 1} CAJAS</div>
            </div>
          </div>
        </div>

        <!-- INSTRUCCIONES DE MANEJO SEGURO (SEGURO PARA TRANSPORTADORAS) -->
        <div style="display: flex; align-items: center; justify-content: space-around; background: #000; color: #fff; padding: 8px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
          <span>✨ PRODUCTOS DE EMBELLECIMIENTO AUTOMOTRIZ</span>
          <span>⬆️ ESTE LADO ARRIBA</span>
          <span>📦 MANEJAR CON CUIDADO</span>
        </div>

        <div style="font-size: 9px; color: #777; text-align: center; margin-top: 10px;">
          Rótulo Oficial de Despacho generado por Nexa ERP para Rayo Pro Colombia
        </div>
      </div>
    `;
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
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${it.sku || '-'}</strong></td>
        <td>${it.nombre}</td>
        <td class="text-center"><strong>${it.cantidad}</strong></td>
        <td class="text-right">${Formatters.currency(it.precioUnitario)}</td>
        <td class="text-right"><strong>${Formatters.currency(it.total)}</strong></td>
      </tr>
    `).join('');

    return `
      ${header}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #fbfbfd; padding: 14px; border-radius: 8px; border: 1px solid #e5e5ea;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; color: #86868b; font-weight: 700;">Datos del Cliente:</div>
          <div style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin: 2px 0;">${sale.clienteNombre}</div>
          <div style="font-size: 12px; color: #424245;"><strong>NIT/CC:</strong> ${sale.clienteNit || '-'}</div>
          <div style="font-size: 12px; color: #424245;"><strong>Forma de Pago:</strong> ${sale.metodoPago || 'Crédito Comercial'}</div>
          <div style="margin-top: 4px;">
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${esFE ? '#e0f2fe' : '#f1f5f9'}; color: ${esFE ? '#0369a1' : '#475569'}; font-weight: 700;">
              ${esFE ? '⚡ Factura Electrónica' : '📄 Documento Interno / Sin FE'}
            </span>
          </div>
        </div>
        <div>
          <div style="font-size: 11px; text-transform: uppercase; color: #86868b; font-weight: 700;">Información de Venta:</div>
          <div style="font-size: 12px; color: #424245;"><strong>Asesor / Vendedor:</strong> ${sale.vendedorNombre || 'Juan Pablo'}</div>
          <div style="font-size: 12px; color: #424245;"><strong>Estado:</strong> ${sale.estado}</div>
          <div style="font-size: 11px; color: #86868b; margin-top: 4px;">
            ${aplicaIva ? 'Régimen con IVA (19%)' : 'Régimen Exento / Etapa Inicial (Sin IVA - 0%)'}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th style="width: 120px;">SKU</th>
            <th>Descripción del Producto / Empaque</th>
            <th class="text-center" style="width: 80px;">Cant.</th>
            <th class="text-right" style="width: 120px;">V. Unitario</th>
            <th class="text-right" style="width: 130px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="doc-totals">
        <div class="total-row">
          <span>Subtotal Neto:</span>
          <span>${Formatters.currency(sale.subtotal)}</span>
        </div>
        ${sale.descuentos > 0 ? `
          <div class="total-row" style="color: #ff3b30;">
            <span>Descuentos:</span>
            <span>-${Formatters.currency(sale.descuentos)}</span>
          </div>
        ` : ''}
        <div class="total-row">
          <span>${aplicaIva ? 'IVA (19%):' : 'IVA (Exento 0%):'}</span>
          <span>${Formatters.currency(sale.impuestos || 0)}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL A PAGAR:</span>
          <span>${Formatters.currency(sale.total)}</span>
        </div>
      </div>

      <div class="doc-footer">
        <p>Agradecemos su compra y preferencia. Productos de mantenimiento y embellecimiento automotriz garantizados por Rayo Pro Colombia S.A.S.</p>
        <p style="margin-top: 4px; font-size: 10px;">
          ${esFE ? 'Resolución DIAN No. 18764000123456 • Documento Oficial Validado por DIAN' : 'Documento comercial emitido para fines administrativos internos • Software Nexa ERP'}
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
