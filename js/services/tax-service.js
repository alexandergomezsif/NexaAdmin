/**
 * Nexa ERP - Servicio Tributario y Liquidación de Documentos (Colombia)
 *
 * Reglas:
 * - Tarifa por ítem (`ivaPct`, por defecto 19).
 * - `precioIncluyeIva` en el ítem: si es true, el precio unitario ya contiene el IVA y
 *   se descompone: base = bruto / (1 + tarifa); IVA = bruto - base. El cliente paga el precio de lista.
 *   Si es false, el IVA se suma sobre el precio.
 * - Si el cliente no aplica IVA (`aplicaIva === false`), no se liquida IVA:
 *   el cliente paga el precio de lista (incluya o no IVA) y toda la línea se trata como base.
 * - Valores redondeados a pesos por línea (COP no maneja centavos en la práctica).
 */

export const TAX_RATES = {
  EXENTO: 0,
  REDUCIDO: 0.05,
  GENERAL: 0.19
};

const round = (n) => Math.round(Number(n) || 0);

export const TaxService = {
  /**
   * @param {Array} items - { cantidad, precioUnitario, descuentoPct?, ivaPct?, precioIncluyeIva? }
   * @param {Number} globalDiscountPct - descuento global (%) aplicado después de los descuentos por ítem
   * @param {Object} options - { aplicaIva: boolean }
   */
  calculateTotals(items = [], globalDiscountPct = 0, options = { aplicaIva: true }) {
    const cobrarIva = options.aplicaIva !== false;
    const gd = Math.min(100, Math.max(0, Number(globalDiscountPct) || 0)) / 100;

    let subtotalBruto = 0;
    let totalDescuentos = 0;
    let baseGravable = 0;
    let totalIva = 0;
    let total = 0;
    const lineas = [];

    items.forEach(item => {
      const qty = Number(item.cantidad) || 0;
      const price = Number(item.precioUnitario) || 0;
      const discPct = Math.min(100, Math.max(0, Number(item.descuentoPct) || 0)) / 100;
      const rate = (item.ivaPct !== undefined && item.ivaPct !== null ? Number(item.ivaPct) : 19) / 100;

      const bruto = qty * price;
      const despuesDescItem = bruto * (1 - discPct);
      const neto = despuesDescItem * (1 - gd);
      const descuento = bruto - neto;

      let base;
      let iva;
      let totalLinea;
      if (!cobrarIva || rate === 0) {
        base = neto;
        iva = 0;
        totalLinea = neto;
      } else if (item.precioIncluyeIva) {
        totalLinea = neto;
        base = neto / (1 + rate);
        iva = neto - base;
      } else {
        base = neto;
        iva = neto * rate;
        totalLinea = neto + iva;
      }

      const l = {
        bruto: round(bruto),
        descuento: round(descuento),
        base: round(base),
        iva: round(totalLinea) - round(base),
        total: round(totalLinea)
      };
      lineas.push(l);
      subtotalBruto += l.bruto;
      totalDescuentos += l.descuento;
      baseGravable += l.base;
      totalIva += l.iva;
      total += l.total;
    });

    return {
      subtotalBruto,
      totalDescuentos,
      baseGravable,
      totalIva,
      aplicaIva: cobrarIva,
      total,
      lineas
    };
  }
};
