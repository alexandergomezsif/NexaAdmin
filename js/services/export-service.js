/**
 * Nexa ERP - Servicio de Exportación y Generación de Documentos
 * Exporta a CSV, Excel (compatible UTF-8 con delimitador regional) y PDF / Impresión
 */

import { Formatters } from '../utils/formatters.js';

export const ExportService = {
  /**
   * Exporta un array de objetos a CSV / Excel
   * @param {Array} data - Array de objetos planos
   * @param {string} filename - Nombre del archivo sin extensión
   * @param {Array} headers - Map de claves a títulos legibles ej: { sku: 'Código SKU', nombre: 'Nombre' }
   */
  exportToCSV(data, filename = 'reporte', headers = null) {
    if (!data || !data.length) {
      alert('No hay datos disponibles para exportar.');
      return;
    }

    const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
    const headerTitles = headers ? Object.values(headers) : keys;

    let csvContent = '\uFEFF'; // BOM para que Excel en español reconozca tildes y ñ correctamente
    csvContent += headerTitles.map(h => `"${String(h).replace(/"/g, '""')}"`).join(';') + '\r\n';

    data.forEach(row => {
      const line = keys.map(k => {
        let val = row[k];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(';');
      csvContent += line + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Imprime un documento membretado en ventana emergente o dispara el diálogo de impresión PDF
   * Cuenta con fallback transparente a iframe oculto para evitar bloqueos por pop-up blocker.
   */
  printDocument(htmlContent, title = 'Documento Nexa ERP') {
    const fullHtml = `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page { size: letter; margin: 12mm; }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #1e293b;
            background: #fff;
            margin: 0;
            padding: 16px;
            font-size: 13px;
            line-height: 1.4;
          }
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0071e3;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .doc-brand h1 { margin: 0 0 5px 0; font-size: 20px; color: #0f172a; }
          .doc-brand p { margin: 2px 0; color: #64748b; font-size: 12px; }
          .doc-meta { text-align: right; }
          .doc-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            font-weight: 700;
            font-size: 14px;
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 1px solid #cbd5e1;
            font-size: 12px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .doc-totals {
            margin-left: auto;
            width: 320px;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .total-row.grand-total {
            font-size: 16px;
            font-weight: 700;
            color: #0071e3;
            border-top: 2px solid #0071e3;
            margin-top: 6px;
            padding-top: 6px;
          }
          .doc-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0 !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="padding: 9px 20px; background: #0071e3; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; box-shadow: 0 2px 6px rgba(0,113,227,0.3);">
            🖨️ Imprimir / Guardar en PDF
          </button>
        </div>
        ${htmlContent}
      </body>
      </html>
    `;

    // 1. Intentar abrir en ventana emergente
    let printWindow = null;
    try {
      printWindow = window.open('', '_blank', 'width=880,height=920');
    } catch (e) {
      printWindow = null;
    }

    if (printWindow && !printWindow.closed) {
      try {
        printWindow.document.open();
        printWindow.document.write(fullHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          try { printWindow.print(); } catch (err) {}
        }, 400);
        return;
      } catch (err) {
        console.warn('Fallback a iframe de impresión por restricción de ventana:', err);
      }
    }

    // 2. Fallback Infalible: Iframe Oculto (NUNCA es bloqueado por el navegador)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(fullHtml);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error('Error al imprimir desde iframe:', e);
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 5000);
    }, 400);
  }
};
