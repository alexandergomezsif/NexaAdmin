/**
 * Nexa ERP - Migraciones de datos versionadas e idempotentes
 *
 * Se ejecutan una sola vez cada una al iniciar la app (o tras restaurar un respaldo antiguo).
 * El registro de migraciones aplicadas vive en system_params ('migraciones').
 *
 * Regla de oro: una migración NUNCA sobrescribe datos del usuario; solo completa campos
 * faltantes o mueve información a su nueva ubicación.
 */

import { DB, STORES } from './db-service.js';
import { SeedData, RAYO_PRO_TENANT_ID } from '../data/seed-rayopro.js';
import { PricingService } from './pricing-service.js';

const PARAM_ID = 'migraciones';

function initialsPrefix(name) {
  const words = String(name || 'V').trim().split(/\s+/).filter(Boolean);
  const p = words.length > 1 ? words[0][0] + words[1][0] : String(name || 'V').substring(0, 2);
  return p.toUpperCase().replace(/[^A-Z]/g, '') || 'V';
}

const MIGRATIONS = [
  {
    id: 'semilla-inicial-v1',
    descripcion: 'Carga los datos iniciales SOLO si la base de datos está vacía.',
    async run() {
      const tenants = await DB.getAll(STORES.TENANTS);
      if (tenants.length > 0) return 'BD existente: semilla omitida';
      for (const [storeKey, items] of Object.entries(SeedData)) {
        const storeName = STORES[storeKey.toUpperCase()];
        if (storeName && Array.isArray(items) && items.length) {
          await DB.bulkAdd(storeName, JSON.parse(JSON.stringify(items)));
        }
      }
      return 'Semilla cargada';
    }
  },
  {
    id: 'listas-codigo-iva-v1',
    descripcion: 'Asigna código P1..P5 a las listas de precios y si incluyen IVA (P1 sí, demás no).',
    async run() {
      const lists = await DB.getAll(STORES.PRICE_LISTS);
      let n = 0;
      for (const pl of lists) {
        let changed = false;
        if (!pl.codigo) { pl.codigo = PricingService.codeOf(pl) || 'P1'; changed = true; }
        if (pl.incluyeIva === undefined) { pl.incluyeIva = pl.codigo === 'P1'; changed = true; }
        if (changed) { await DB.update(STORES.PRICE_LISTS, pl); n++; }
      }
      return `${n} listas actualizadas`;
    }
  },
  {
    id: 'empresa-prefijos-v1',
    descripcion: 'Prefijos de consecutivos por empresa.',
    async run() {
      const tenants = await DB.getAll(STORES.TENANTS);
      for (const t of tenants) {
        let changed = false;
        if (!t.prefijoVenta) { t.prefijoVenta = t.id === RAYO_PRO_TENANT_ID ? 'RP' : initialsPrefix(t.nombreComercial); changed = true; }
        if (!t.prefijoCotizacion) { t.prefijoCotizacion = 'COT'; changed = true; }
        if (t.id === RAYO_PRO_TENANT_ID) {
          if (!t.isotipoLightUrl) { t.isotipoLightUrl = 'datos/isotipo fondo blanco.jpg'; changed = true; }
          if (!t.isotipoDarkUrl) { t.isotipoDarkUrl = 'datos/isotipo fondo negro.jpg'; changed = true; }
          if (!t.logoHorizontalLightUrl) { t.logoHorizontalLightUrl = 'datos/logo+isotipo.jpg'; changed = true; }
          if (!t.logoHorizontalDarkUrl) { t.logoHorizontalDarkUrl = 'datos/isotipo + logo fondo negro.jpg'; changed = true; }
        }
        if (t.firmaUrl && !t.firmaNombre && /juan/i.test(t.firmaUrl)) {
          t.firmaNombre = 'Juan Pablo';
          t.firmaCargo = 'Gerencia de Operaciones y Planta';
          changed = true;
        }
        // La resolución "18764000123456" del código original era un ejemplo, no una resolución real.
        if (t.resolucionFacturacion && /18764000(123456|987654)/.test(t.resolucionFacturacion)) {
          t.resolucionFacturacion = '';
          changed = true;
        }
        if (changed) await DB.update(STORES.TENANTS, t);
      }
      return 'ok';
    }
  },
  {
    id: 'adjuntos-separados-v1',
    descripcion: 'Mueve las fotos de comprobantes de ventas y abonos a un almacén aparte.',
    async run() {
      const sales = await DB.getAll(STORES.SALES);
      let n = 0;
      for (const s of sales) {
        if (s.comprobantePagoUrl && !s.comprobanteId) {
          const att = await DB.add(STORES.ATTACHMENTS, {
            tenantId: s.tenantId, refTipo: 'VENTA', refId: s.id,
            descripcion: `Comprobante ${s.consecutivo}`, dataUrl: s.comprobantePagoUrl
          });
          s.comprobanteId = att.id;
          delete s.comprobantePagoUrl;
          await DB.update(STORES.SALES, s);
          n++;
        }
      }
      const cxcs = await DB.getAll(STORES.RECEIVABLES_CXC);
      for (const c of cxcs) {
        let changed = false;
        for (const h of (c.historialPagos || [])) {
          if (h.comprobanteBase64 && !h.comprobanteId) {
            const att = await DB.add(STORES.ATTACHMENTS, {
              tenantId: c.tenantId, refTipo: 'ABONO_CXC', refId: c.id,
              descripcion: `Abono ${c.documento}`, dataUrl: h.comprobanteBase64
            });
            h.comprobanteId = att.id;
            delete h.comprobanteBase64;
            changed = true;
            n++;
          }
        }
        if (changed) await DB.update(STORES.RECEIVABLES_CXC, c);
      }
      return `${n} adjuntos movidos`;
    }
  },
  {
    id: 'recetas-esquema-unico-v1',
    descripcion: 'Unifica los campos de recetas entre Producción y Bóveda.',
    async run() {
      const recipes = await DB.getAll(STORES.RECIPES_BOM);
      for (const r of recipes) {
        const before = JSON.stringify(r);
        if (!r.nombreReceta && r.nombreFormula) r.nombreReceta = r.nombreFormula;
        if (!r.nombreFormula && r.nombreReceta) r.nombreFormula = r.nombreReceta;
        if (!r.rendimientoLote && r.cantidadProducir) r.rendimientoLote = Number(r.cantidadProducir);
        if (!r.cantidadProducir && r.rendimientoLote) r.cantidadProducir = Number(r.rendimientoLote);
        (r.insumos || []).forEach(i => {
          if (!i.materiaPrimaId && i.productoId) i.materiaPrimaId = i.productoId;
          if (!i.productoId && i.materiaPrimaId) i.productoId = i.materiaPrimaId;
        });
        if (JSON.stringify(r) !== before) await DB.update(STORES.RECIPES_BOM, r);
      }
      return 'ok';
    }
  },
  {
    id: 'ventas-tipo-documento-v1',
    descripcion: 'Reclasifica cotizaciones antiguas que se registraron como PAGADA.',
    async run() {
      const sales = await DB.getAll(STORES.SALES);
      let n = 0;
      for (const s of sales) {
        if (s.tipoDoc === 'COTIZACION' && s.estado !== 'COTIZACION' && s.estado !== 'ANULADA') {
          // Nota: el inventario y la caja que esas cotizaciones afectaron NO se revierten automáticamente;
          // queda la marca para revisión manual.
          s.estadoOriginal = s.estado;
          s.estado = 'COTIZACION';
          s.requiereRevision = 'Cotización antigua que descontó inventario y/o sumó a caja (error corregido en v3).';
          await DB.update(STORES.SALES, s);
          n++;
        }
      }
      return `${n} cotizaciones antiguas reclasificadas`;
    }
  }
];

export const Migrations = {
  async run() {
    await DB.init();
    const applied = (await DB.getParam(PARAM_ID, [])) || [];
    const done = new Set(applied.map(a => a.id));
    const log = [];
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      if (typeof window !== 'undefined' && window.__nexaStep) window.__nexaStep(`Migración: ${m.descripcion}`);
      const resultado = await m.run();
      applied.push({ id: m.id, fecha: new Date().toISOString(), resultado });
      await DB.setParam(PARAM_ID, applied);
      log.push(`${m.id}: ${resultado}`);
    }
    if (log.length) console.info('[NexaAdmin] Migraciones aplicadas:\n' + log.join('\n'));
    return log;
  },

  async applied() {
    return (await DB.getParam(PARAM_ID, [])) || [];
  }
};
