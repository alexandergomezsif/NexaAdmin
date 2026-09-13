/**
 * Nexa ERP - Formateadores de Moneda, Fechas y Números (Colombia)
 */

export const Formatters = {
  /**
   * Formatea un valor numérico a Pesos Colombianos (COP) sin decimales o con decimales según se requiera
   * Ejemplo: 45000 -> "$ 45.000"
   */
  currency(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) {
      return '$ 0';
    }
    const num = Number(value);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  },

  /**
   * Formato numérico estándar con separadores de miles
   */
  number(value, decimals = 0) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(Number(value));
  },

  /**
   * Formato de fecha legible (ej: 12 sep 2026)
   */
  date(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  },

  /**
   * Formato de fecha y hora (ej: 12 sep 2026, 03:42 p. m.)
   */
  dateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  },

  /**
   * Formato de fecha para inputs tipo date (YYYY-MM-DD)
   */
  toInputDate(date = new Date()) {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  },

  /**
   * Limpia un string de moneda y retorna un float
   * Ejemplo: "$ 45.000" -> 45000
   */
  parseCurrency(str) {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const clean = str.toString().replace(/[^0-9,-]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }
};
