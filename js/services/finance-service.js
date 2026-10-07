/**
 * Nexa ERP - Indicadores financieros calculados con datos REALES
 *
 * Utilidad operativa = ventas netas (sin IVA) − costo de la mercancía vendida − comisiones − gastos.
 * - Excluye cotizaciones y ventas anuladas.
 * - El costo de cada venta se guarda al venderla (Kardex al costo promedio). Para ventas
 *   antiguas sin ese dato se ESTIMA con el costo promedio actual y se marca como estimado.
 * - Los resultados pueden ser negativos (pérdida): no se ocultan.
 */

import { SalesService } from './sales-service.js';

const inRange = (iso, from, to) => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return (!from || t >= from.getTime()) && (!to || t < to.getTime());
};

export const FinanceService = {
  periods(now = new Date()) {
    const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      hoy: { from: d0, to: new Date(d0.getTime() + 86400000), label: 'Hoy' },
      mes: { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: 'Mes actual' },
      anio: { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1), label: 'Año actual' }
    };
  },

  saleCost(sale, products) {
    if (Number(sale.costoTotal) > 0) return { costo: Number(sale.costoTotal), estimado: false };
    let costo = 0;
    let estimado = false;
    (sale.items || []).forEach(it => {
      if (it.costoUnitario !== undefined) {
        costo += Number(it.costoUnitario) * Number(it.cantidad || 0);
      } else {
        const p = products.find(x => x.id === it.productoId);
        costo += Number((p && p.costoPromedio) || 0) * Number(it.cantidad || 0);
        estimado = true;
      }
    });
    return { costo, estimado };
  },

  summarize({ sales, expenses, products, from = null, to = null }) {
    const efectivas = sales.filter(s => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to));
    let ventasBrutas = 0, ventasNetas = 0, iva = 0, costoVentas = 0, comisiones = 0, costoEstimado = false;
    efectivas.forEach(s => {
      ventasBrutas += Number(s.total || 0);
      ventasNetas += Number(s.subtotal !== undefined ? s.subtotal : s.total || 0);
      iva += Number(s.impuestos || 0);
      comisiones += Number(s.comisionFreelance || 0);
      const c = this.saleCost(s, products);
      costoVentas += c.costo;
      if (c.estimado) costoEstimado = true;
    });
    const gastos = expenses.filter(e => inRange(e.fecha, from, to)).reduce((a, e) => a + Number(e.valor || 0), 0);
    const utilidadBruta = ventasNetas - costoVentas;
    const utilidadOperativa = utilidadBruta - comisiones - gastos;
    return {
      n: efectivas.length,
      ventasBrutas: Math.round(ventasBrutas),
      ventasNetas: Math.round(ventasNetas),
      iva: Math.round(iva),
      costoVentas: Math.round(costoVentas),
      comisiones: Math.round(comisiones),
      gastos: Math.round(gastos),
      utilidadBruta: Math.round(utilidadBruta),
      utilidadOperativa: Math.round(utilidadOperativa),
      margenBrutoPct: ventasNetas > 0 ? (utilidadBruta / ventasNetas) * 100 : null,
      costoEstimado
    };
  },

  monthlySeries(sales, months = 6, now = new Date()) {
    const out = [];
    for (let i = months - 1; i >= 0; i--) {
      const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const value = sales.filter(s => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to))
        .reduce((a, s) => a + Number(s.subtotal !== undefined ? s.subtotal : s.total || 0), 0);
      out.push({ label: from.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''), value: Math.round(value) });
    }
    return out;
  },

  byCategory(sales, products, from = null, to = null) {
    const acc = {};
    sales.filter(s => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to)).forEach(s => {
      (s.items || []).forEach(it => {
        const p = products.find(x => x.id === it.productoId);
        const cat = (p && p.categoria) || 'Sin categoría';
        const val = it.base !== undefined ? Number(it.base) : Number(it.total || it.cantidad * it.precioUnitario || 0);
        acc[cat] = (acc[cat] || 0) + val;
      });
    });
    const total = Object.values(acc).reduce((a, b) => a + b, 0);
    return Object.entries(acc).map(([categoria, valor]) => ({ categoria, valor: Math.round(valor), pct: total ? (valor / total) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
  },

  byPayment(sales, from = null, to = null) {
    const acc = {};
    sales.filter(s => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to)).forEach(s => {
      const m = s.metodoPago || 'Sin dato';
      acc[m] = (acc[m] || 0) + Number(s.total || 0);
    });
    const total = Object.values(acc).reduce((a, b) => a + b, 0);
    return Object.entries(acc).map(([metodo, valor]) => ({ metodo, valor: Math.round(valor), pct: total ? (valor / total) * 100 : 0 }))
      .sort((a, b) => b.valor - a.valor);
  }

  ,

  /**
   * Rentabilidad por producto: unidades, ventas netas (sin IVA), costo de lo vendido, utilidad y margen.
   * Costo: el guardado en cada línea al vender (Kardex). Si falta, se estima con el costo promedio actual.
   */
  byProduct(sales, products, from = null, to = null) {
    const acc = {};
    sales.filter(s => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to)).forEach(s => {
      (s.items || []).forEach(it => {
        const p = products.find(x => x.id === it.productoId);
        const row = acc[it.productoId] || (acc[it.productoId] = {
          productoId: it.productoId, sku: it.sku || (p && p.sku) || '', nombre: it.nombre || (p && p.nombre) || 'Producto',
          unidades: 0, ventasNetas: 0, costo: 0, costoEstimado: false
        });
        const qty = Number(it.cantidad || 0);
        let net;
        if (it.base !== undefined) net = Number(it.base);
        else {
          const iva = Number(it.ivaPct ?? 19) / 100;
          const incl = it.precioIncluyeIva ?? s.preciosIncluyenIva;
          net = qty * Number(it.precioUnitario || 0) / (incl ? 1 + iva : 1);
        }
        let cost;
        if (it.costoUnitario !== undefined) cost = Number(it.costoUnitario) * qty;
        else { cost = Number((p && p.costoPromedio) || 0) * qty; row.costoEstimado = true; }
        row.unidades += qty; row.ventasNetas += net; row.costo += cost;
      });
    });
    return Object.values(acc).map(r => {
      const utilidad = r.ventasNetas - r.costo;
      return { ...r, ventasNetas: Math.round(r.ventasNetas), costo: Math.round(r.costo), utilidad: Math.round(utilidad),
        margenPct: r.ventasNetas > 0 ? Math.round((utilidad / r.ventasNetas) * 1000) / 10 : null };
    }).sort((a, b) => b.utilidad - a.utilidad);
  }
};
