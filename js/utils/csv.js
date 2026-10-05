/**
 * Nexa ERP - Lector CSV robusto (RFC 4180)
 * - Detecta separador ';' o ',' (Excel en español exporta con ';')
 * - Soporta comillas, separadores y saltos de línea dentro de campos entrecomillados
 * - Elimina BOM UTF-8
 */
export function parseCSV(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some(v => v.trim() !== '')) rows.push(row);

  if (rows.length === 0) return { headers: [], rows: [] };
  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(cols => {
    const o = {};
    headers.forEach((h, i) => { o[h] = (cols[i] !== undefined ? cols[i] : '').trim(); });
    return o;
  });
  return { headers, rows: data, delimiter: delim };
}

/** Convierte "1.234,50" o "1234.5" a número */
export function parseNumber(v) {
  if (v === null || v === undefined || v === '') return 0;
  let s = String(v).replace(/[^\d,.-]/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
