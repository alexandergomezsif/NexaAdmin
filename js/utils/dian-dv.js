/**
 * Nexa ERP - Cálculo Oficial del Dígito de Verificación (DV) DIAN
 * Aplica el algoritmo de Módulo 11 según el Decreto 4123 de la DIAN en Colombia
 */

export const DianDV = {
  // Factores de ponderación oficiales DIAN (hasta 15 dígitos)
  WEIGHTS: [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71],

  /**
   * Calcula el Dígito de Verificación (DV) para un NIT o Cédula
   * @param {string|number} nit - Número de identificación sin puntos ni guiones
   * @returns {number|null} - Dígito entre 0 y 9, o null si el NIT es inválido
   */
  calculate(nit) {
    if (!nit) return null;
    // Limpiar caracteres no numéricos
    const cleanNit = nit.toString().replace(/\D/g, '');
    if (cleanNit.length === 0) return null;

    let total = 0;
    const len = cleanNit.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(cleanNit.charAt(len - 1 - i), 10);
      const weight = this.WEIGHTS[i] || 0;
      total += digit * weight;
    }

    const remainder = total % 11;

    if (remainder > 1) {
      return 11 - remainder;
    } else {
      return remainder; // 0 o 1
    }
  },

  /**
   * Formatea un NIT con su DV
   * Ejemplo: (901456789) -> "901.456.789-5"
   */
  formatWithDV(nit) {
    if (!nit) return '';
    const cleanNit = nit.toString().replace(/\D/g, '');
    if (!cleanNit) return '';
    const dv = this.calculate(cleanNit);
    
    // Formatear miles
    const formattedNum = new Intl.NumberFormat('es-CO').format(parseInt(cleanNit, 10));
    return dv !== null ? `${formattedNum}-${dv}` : formattedNum;
  }
};
