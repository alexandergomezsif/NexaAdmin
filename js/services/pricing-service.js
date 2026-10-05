/**
 * Nexa ERP - Servicio de Listas de Precios
 *
 * Las listas tienen un `codigo` estable (P1..P5) independiente de su id, para que
 * la lógica comercial funcione en cualquier empresa (antes se usaban ids fijos
 * 'plist_1'/'plist_3' que no existen en empresas nuevas).
 *
 * Cada lista indica si sus precios YA incluyen IVA (`incluyeIva`).
 */

export const PRICE_CODES = ['P1', 'P2', 'P3', 'P4', 'P5'];

export const PricingService = {
  /** Código de la lista (P1..P5). Deriva del campo `codigo`, del `orden` o del nombre. */
  codeOf(priceList) {
    if (!priceList) return null;
    if (priceList.codigo) return priceList.codigo;
    if (priceList.orden) return `P${priceList.orden}`;
    const m = String(priceList.nombre || '').match(/^P(\d)/i);
    return m ? `P${m[1]}` : null;
  },

  /** Busca una lista por código (P1..P5) */
  findByCode(priceLists, code) {
    return (priceLists || []).find(pl => this.codeOf(pl) === code) || null;
  },

  /** Acepta un id o un código y devuelve el id de lista correspondiente en esta empresa */
  resolveListId(priceLists, idOrCode) {
    if (!idOrCode) return null;
    const byId = (priceLists || []).find(pl => pl.id === idOrCode);
    if (byId) return byId.id;
    const byCode = this.findByCode(priceLists, idOrCode);
    if (byCode) return byCode.id;
    // Compatibilidad con ids antiguos 'plist_3' en empresas cuyo id es 'plist_3_<tenant>'
    const legacy = String(idOrCode).match(/^plist_(\d)$/);
    if (legacy) {
      const pl = this.findByCode(priceLists, `P${legacy[1]}`);
      if (pl) return pl.id;
    }
    return null;
  },

  defaultList(priceLists) {
    return (priceLists || []).find(pl => pl.esDefecto) || this.findByCode(priceLists, 'P1') || (priceLists || [])[0] || null;
  },

  /** Lista base para comisiones freelance (por defecto P3) */
  freelanceBaseListId(priceLists, freelancer) {
    return this.resolveListId(priceLists, freelancer && freelancer.precioBaseId) ||
      this.resolveListId(priceLists, 'P3') ||
      (this.defaultList(priceLists) || {}).id || null;
  },

  /** Precio del producto en una lista. Devuelve 0 si no está definido (nunca inventa precios). */
  priceFor(product, listId) {
    if (!product || !product.precios || !listId) return 0;
    const v = Number(product.precios[listId]);
    return Number.isFinite(v) && v > 0 ? v : 0;
  },

  listIncludesIva(priceLists, listId) {
    const pl = (priceLists || []).find(p => p.id === listId);
    return !!(pl && pl.incluyeIva);
  },

  label(priceList) {
    if (!priceList) return '-';
    return priceList.nombre || this.codeOf(priceList) || priceList.id;
  }
};
