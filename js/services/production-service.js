/**
 * Nexa ERP - Servicio de Producción y Gestión de Fórmulas BOM (Core Rayo Pro)
 * Explosión de materiales, costeo por lote, consumo de insumos y generación de PT
 */

import { DB, STORES } from './db-service.js';
import { KardexService } from './kardex-service.js';
import { AuditService } from './audit-service.js';

export const ProductionService = {
  /**
   * Calcula el costo estimado unitario y total para una receta y cantidad solicitada
   */
  async calculateEstimatedCost(recetaId, cantidadAProducir) {
    const receta = await DB.getById(STORES.RECIPES_BOM, recetaId);
    if (!receta) throw new Error('Receta no encontrada.');

    const factor = cantidadAProducir / (receta.rendimientoLote || 1);
    let costoTotalInsumos = 0;
    const desgloseInsumos = [];

    for (const insumo of receta.insumos) {
      const prod = await DB.getById(STORES.PRODUCTS, insumo.materiaPrimaId);
      const cantRequerida = insumo.cantidad * factor;
      const cantConMerma = cantRequerida * (1 + (insumo.mermaEsperada || 0) / 100);
      const costoUnitario = prod ? prod.costoPromedio || 0 : 0;
      const costoInsumo = cantConMerma * costoUnitario;
      costoTotalInsumos += costoInsumo;

      desgloseInsumos.push({
        materiaPrimaId: insumo.materiaPrimaId,
        nombre: prod ? prod.nombre : 'Insumo',
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
    responsableId,
    responsableNombre,
    observaciones
  }) {
    const pt = await DB.getById(STORES.PRODUCTS, productoTerminadoId);
    if (!pt) throw new Error('Producto terminado no encontrado.');

    const receta = await DB.getById(STORES.RECIPES_BOM, recetaId);
    if (!receta) throw new Error('Receta no encontrada.');

    const factor = cantidadProducida / (receta.rendimientoLote || 1);
    const numeroOrden = 'OP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const lote = loteCodigo || `LOTE-${pt.sku.substring(0, 4)}-${Date.now().toString().slice(-4)}`;

    let costoTotalMateriasPrimasReal = 0;
    const insumosConsumidos = [];

    // 1. Consumo de cada materia prima
    for (const insumo of receta.insumos) {
      const mp = await DB.getById(STORES.PRODUCTS, insumo.materiaPrimaId);
      if (!mp) continue;

      const cantConsumida = Math.round(insumo.cantidad * factor * (1 + (insumo.mermaEsperada || 0) / 100) * 100) / 100;
      const costoInsumo = cantConsumida * (mp.costoPromedio || 0);
      costoTotalMateriasPrimasReal += costoInsumo;

      insumosConsumidos.push({
        materiaPrimaId: mp.id,
        nombre: mp.nombre,
        sku: mp.sku,
        cantidad: cantConsumida,
        unidadMedida: insumo.unidadMedida,
        costoUnitario: mp.costoPromedio,
        costoTotal: Math.round(costoInsumo)
      });

      // Registrar salida en Kardex por consumo de producción
      await KardexService.registerMovement({
        tenantId,
        productoId: mp.id,
        bodegaId: mp.bodegaId || 'wh_2',
        documentoTipo: 'CONSUMO_PRODUCCION',
        documentoNumero: numeroOrden,
        cantidad: cantConsumida,
        costoUnitario: mp.costoPromedio,
        usuarioId: responsableId,
        observacion: `Consumo para fabricación de ${cantidadProducida} ${pt.unidadMedida} de ${pt.nombre} (Lote: ${lote})`
      });
    }

    const costoRealTotal = Math.round(costoTotalMateriasPrimasReal + Number(costosIndirectosReales || 0));
    const costoUnitarioReal = Math.round(costoRealTotal / cantidadProducida);

    // 2. Ingreso del producto terminado al inventario
    await KardexService.registerMovement({
      tenantId,
      productoId: pt.id,
      bodegaId: pt.bodegaId || 'wh_1',
      documentoTipo: 'PRODUCCION_ENTRADA',
      documentoNumero: numeroOrden,
      cantidad: cantidadProducida,
      costoUnitario: costoUnitarioReal,
      usuarioId: responsableId,
      observacion: `Entrada de fabricación terminada. Lote: ${lote}`
    });

    // 3. Registrar Orden de Producción
    const orden = {
      tenantId,
      numeroOrden,
      recetaId,
      recetaNombre: receta.nombreReceta,
      productoTerminadoId: pt.id,
      productoTerminadoNombre: pt.nombre,
      loteCodigo: lote,
      fechaProgramada: new Date().toISOString().split('T')[0],
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date().toISOString(),
      cantidadPlanificada: cantidadProducida,
      cantidadProducida,
      costoEstimadoTotal: costoRealTotal,
      costoRealTotal,
      costoUnitarioReal,
      costosIndirectosReales,
      insumosConsumidos,
      estado: 'COMPLETADA',
      responsableId,
      responsableNombre: responsableNombre || 'Jefe de Planta',
      observaciones: observaciones || 'Producción finalizada exitosamente.'
    };

    const savedOrder = await DB.add(STORES.PRODUCTION_ORDERS, orden);

    await AuditService.log({
      modulo: 'Producción',
      accion: 'CREAR',
      registroId: numeroOrden,
      campoModificado: 'Orden Ejecutada',
      valorAnterior: '-',
      valorNuevo: `${cantidadProducida} ${pt.unidadMedida} de ${pt.nombre} (Lote: ${lote}) - Costo Unit: $ ${costoUnitarioReal}`
    });

    return savedOrder;
  }
};
