/**
 * Nexa ERP - Servicio Tributario y Cálculo de Liquidaciones (Colombia)
 * Maneja IVA (0%, 5%, 19%), Descuentos, Retenciones y Totales de Documento
 */

export const TAX_RATES = {
  EXENTO: 0,
  REDUCIDO: 0.05,
  GENERAL: 0.19
};

export const TaxService = {
  /**
   * Calcula el subtotal, descuento, base gravable, IVA y total de una lista de ítems.
   * Si el cliente está en etapa inicial o no se le factura con IVA (aplicaIva === false o sin factura electrónica),
   * el IVA se liquida a $0 (0%) automáticamente.
   * @param {Array} items - Array de objetos con { cantidad, precioUnitario, descuentoPct, ivaPct }
   * @param {Number} globalDiscountPct - Porcentaje de descuento global
   * @param {Object} options - { aplicaIva: boolean, facturaElectronica: boolean }
   */
  calculateTotals(items = [], globalDiscountPct = 0, options = { aplicaIva: true, facturaElectronica: true }) {
    let subtotalBruto = 0;
    let totalDescuentosItems = 0;
    let subtotalNeto = 0;
    let totalIva = 0;

    const cobrarIva = options.aplicaIva !== false;

    items.forEach(item => {
      const qty = Number(item.cantidad) || 0;
      const price = Number(item.precioUnitario) || 0;
      const itemGross = qty * price;
      
      const itemDiscPct = Number(item.descuentoPct) || 0;
      const itemDiscount = itemGross * (itemDiscPct / 100);
      const itemNet = itemGross - itemDiscount;

      // Si aplica IVA usa la tarifa del ítem (defecto 19%), de lo contrario 0%
      const ivaPct = cobrarIva ? (item.ivaPct !== undefined ? Number(item.ivaPct) : 19) : 0;
      const itemIva = itemNet * (ivaPct / 100);

      subtotalBruto += itemGross;
      totalDescuentosItems += itemDiscount;
      subtotalNeto += itemNet;
      totalIva += itemIva;
    });

    const globalDiscount = subtotalNeto * (Number(globalDiscountPct || 0) / 100);
    const totalDescuentos = totalDescuentosItems + globalDiscount;
    const baseGravableFinal = Math.max(0, subtotalNeto - globalDiscount);
    const ivaFinal = (cobrarIva && baseGravableFinal > 0) ? (totalIva * (1 - (Number(globalDiscountPct || 0) / 100))) : 0;
    const total = Math.round(baseGravableFinal + ivaFinal);

    return {
      subtotalBruto: Math.round(subtotalBruto),
      totalDescuentos: Math.round(totalDescuentos),
      baseGravable: Math.round(baseGravableFinal),
      totalIva: Math.round(ivaFinal),
      aplicaIva: cobrarIva,
      total
    };
  }
};
