/**
 * Nexa ERP - Servicio de Producción y Gestión de Fórmulas BOM (Core Rayo Pro)
 * Explosión de materiales, costeo por lote, consumo de insumos y generación de PT
 */

import { DB, STORES } from './db-service.js';
import { KardexService, KARDEX_TX_STORES } from './kardex-service.js';
import { Session } from '../utils/session.js';
import { AuditService } from './audit-service.js';

export const ProductionService = {
  /**
   * Calcula el costo estimado unitario y total para una receta y cantidad solicitada
   */
  async calculateEstimatedCost(recetaId, cantidadAProducir) {
    const receta = await DB.getById(STORES.RECIPES_BOM, recetaId);
    if (!receta) throw new Error('Receta no encontrada.');

    const factor = cantidadAProducir / (Number(receta.rendimientoLote || receta.cantidadProducir) || 1);
    let costoTotalInsumos = 0;
    const desgloseInsumos = [];

    for (const insumo of (receta.insumos || [])) {
      const mpId = insumo.materiaPrimaId || insumo.productoId;
      if (!mpId) continue;
      const prod = await DB.getById(STORES.PRODUCTS, mpId);
      const cantRequerida = insumo.cantidad * factor;
      const cantConMerma = cantRequerida * (1 + (insumo.mermaEsperada || 0) / 100);
      const costoUnitario = prod ? prod.costoPromedio || 0 : 0;
      const costoInsumo = cantConMerma * costoUnitario;
      costoTotalInsumos += costoInsumo;

      desgloseInsumos.push({
        materiaPrimaId: mpId,
        nombre: prod ? prod.nombre : 'Insumo no encontrado',
        sku: prod ? prod.sku : '-',
        cantidadBase: insumo.cantidad,
        cantidadRequerida: Math.round(cantConMerma * 100) / 100,
        unidadMedida: insumo.unidadMedida,
        stockDisponible: prod ? prod.stock : 0,
        costoUnitario,
        costoTotal: Math.round(costoInsumo),
        stockSuficiente: prod ? prod.stock >= cantConMerma : false
      });
    }

    const costosIndirectos = (receta.costosIndirectosEstimados || 0) * factor;
    const costoTotalEstimado = Math.round(costoTotalInsumos + costosIndirectos);
    const costoUnitarioEstimado = Math.round(costoTotalEstimado / cantidadAProducir);

    return {
      receta,
      cantidadAProducir,
      desgloseInsumos,
      costoTotalInsumos: Math.round(costoTotalInsumos),
      costosIndirectos: Math.round(costosIndirectos),
      costoTotalEstimado,
      costoUnitarioEstimado,
      todosConStock: desgloseInsumos.every(i => i.stockSuficiente)
    };
  },

  /**
   * Ejecuta una Orden de Producción:
   * 1. Consume materias primas del inventario
   * 2. Calcula costo real de fabricación
   * 3. Registra el lote
   * 4. Ingresa el producto terminado en inventario
   * 5. Genera movimientos de Kardex
   */
  async executeProductionOrder({
    tenantId,
    recetaId,
    productoTerminadoId,
    cantidadProducida,
    loteCodigo,
    costosIndirectosReales = 0,
    observaciones,
    fechaVencimiento = null
  }) {
    const cant = Number(cantidadProducida);
    if (!Number.isFinite(cant) || cant <= 0) throw new Error('La cantidad a producir debe ser mayor a cero.');

    const stores = [...new Set([...KARDEX_TX_STORES, STORES.RECIPES_BOM, STORES.PRODUCTION_ORDERS, STORES.SYSTEM_PARAMS])];
    return DB.runTransaction(stores, async (tx) => {
      const pt = await tx.get(STORES.PRODUCTS, productoTerminadoId);
      if (!pt) throw new Error('Producto terminado no encontrado.');
      const receta = await tx.get(STORES.RECIPES_BOM, recetaId);
      if (!receta) throw new Error('Receta no encontrada.');
      const insumos = (receta.insumos || []).filter(i => i.materiaPrimaId || i.productoId);
      if (insumos.length === 0) throw new Error('La receta no tiene insumos configurados.');

      const n = await tx.nextSequence(tenantId, 'PRODUCCION');
      const numeroOrden = `OP-${String(n).padStart(6, '0')}`;
      const lote = loteCodigo || `LOTE-${String(pt.sku || 'PT').substring(0, 6)}-${String(n).padStart(4, '0')}`;
      const factor = cant / (Number(receta.rendimientoLote || receta.cantidadProducir) || 1);

      let costoMP = 0;
      const insumosConsumidos = [];
      for (const insumo of insumos) {
        const mpId = insumo.materiaPrimaId || insumo.productoId;
        const cantConsumida = Math.round(Number(insumo.cantidad) * factor * (1 + (Number(insumo.mermaEsperada) || 0) / 100) * 1000) / 1000;
        if (cantConsumida <= 0) continue;
        // applyMovement valida existencias: si falta un insumo, la orden completa se cancela
        const mov = await KardexService.applyMovement(tx, {
          tenantId,
          productoId: mpId,
          bodegaId: null,
          documentoTipo: 'CONSUMO_PRODUCCION',
          documentoNumero: numeroOrden,
          cantidad: cantConsumida,
          observacion: `Consumo para ${cant} ${pt.unidadMedida || ''} de ${pt.nombre} (Lote ${lote})`
        });
        costoMP += mov.costoTotal;
        insumosConsumidos.push({
          materiaPrimaId: mpId,
          nombre: mov.productoNombre,
          sku: mov.sku,
          cantidad: cantConsumida,
          unidadMedida: insumo.unidadMedida || '',
          costoUnitario: mov.costoUnitario,
          costoTotal: Math.round(mov.costoTotal)
        });
      }

      const costoRealTotal = Math.round(costoMP + Number(costosIndirectosReales || 0));
      const costoUnitarioReal = Math.round((costoRealTotal / cant) * 100) / 100;

      await KardexService.applyMovement(tx, {
        tenantId,
        productoId: pt.id,
        bodegaId: null,
        documentoTipo: 'PRODUCCION_ENTRADA',
        documentoNumero: numeroOrden,
        cantidad: cant,
        costoUnitario: costoUnitarioReal,
        lote,
        vence: fechaVencimiento || null,
        observacion: `Producto terminado. Lote ${lote}${fechaVencimiento ? ` · vence ${fechaVencimiento}` : ''}`
      });

      const ahora = new Date().toISOString();
      const orden = await tx.put(STORES.PRODUCTION_ORDERS, {
        tenantId,
        numeroOrden,
        recetaId,
        recetaNombre: receta.nombreReceta || receta.nombreFormula || '-',
        productoTerminadoId: pt.id,
        productoTerminadoNombre: pt.nombre,
        loteCodigo: lote,
        fechaVencimiento: fechaVencimiento || null,
        fechaProgramada: ahora.split('T')[0],
        fechaInicio: ahora,
        fechaFin: ahora,
        cantidadPlanificada: cant,
        cantidadProducida: cant,
        costoEstimadoTotal: costoRealTotal,
        costoRealTotal,
        costoUnitarioReal,
        costosIndirectosReales: Number(costosIndirectosReales || 0),
        insumosConsumidos,
        estado: 'COMPLETADA',
        responsableId: Session.userId(),
        responsableNombre: Session.userName(),
        observaciones: observaciones || ''
      });

      await AuditService.logTx(tx, {
        tenantId, modulo: 'Producción', accion: 'CREAR', registroId: numeroOrden,
        campoModificado: 'Orden ejecutada',
        valorNuevo: `${cant} ${pt.unidadMedida || ''} de ${pt.nombre} (Lote ${lote}) - Costo unit. $ ${costoUnitarioReal}`
      });
      return orden;
    });
  }
};
