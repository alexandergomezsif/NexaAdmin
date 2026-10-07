"""
Simulación de la cadena completa de un producto NUEVO en NexaAdmin (navegador aislado, no toca datos reales):
materia prima -> producto -> compra a crédito -> fórmula en la Bóveda -> precios desde la receta ->
producción -> venta de contado -> venta a crédito -> abono -> pago al proveedor -> Kardex.

Uso: python tests/e2e_cadena.py   (capturas en tests/.out/cadena/)
"""
import asyncio, sys, json
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import e2e_nexa as T
from e2e_nexa import G
from playwright.async_api import async_playwright
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)), '.out', 'cadena') + os.sep
os.makedirs(OUT, exist_ok=True)
LOG=[]
def log(step, msg, data=None):
    LOG.append({'step':step,'msg':msg,'data':data}); print(f'[{step}] {msg}', json.dumps(data, ensure_ascii=False) if data is not None else '')
n=0
async def shot(page, name):
    global n; n+=1
    await page.screenshot(path=f'{OUT}{n:02d}_{name}.png'); return f'{n:02d}_{name}.png'

async def prod_by_sku(page, sku):
    return next((p for p in await page.evaluate(G,['products']) if p.get('sku')==sku), None)

async def main():
    srv, base = T.serve_project()
    async with async_playwright() as p:
        b = await T.launch_browser(p, sys.argv[1] if len(sys.argv) > 1 else 'auto')
        ctx = await b.new_context(service_workers='block', viewport={'width':1440,'height':900}, accept_downloads=True)
        await ctx.add_init_script("localStorage.setItem('nexa_theme','light')")
        page = await ctx.new_page(); errs=[]; page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
        await page.goto(base); await page.wait_for_timeout(1500)
        await page.fill('input[name=nombre]','Admin'); await page.fill('input[name=pass1]','1234'); await page.fill('input[name=pass2]','1234')
        await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(2500)
        lists = {l['codigo']: l for l in await page.evaluate(G,['price_lists'])}

        # 1. Materia prima nueva
        await T.goto(page,'products'); await page.click('#btn-new-product'); await page.wait_for_timeout(400)
        f='#product-form '
        await page.select_option(f+'select[name=tipoItem]','MATERIA_PRIMA')
        await page.fill(f+'input[name=sku]','MP-SIO2'); await page.fill(f+'input[name=nombre]','Concentrado Cerámico SiO2')
        await page.fill(f+'input[name=categoria]','Materias Primas Químicas'); await page.select_option(f+'select[name=unidadMedida]','Kg')
        await page.fill(f+'input[name=stockMinimo]','10')
        await shot(page,'materia_prima_form')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1000)
        mp = await prod_by_sku(page,'MP-SIO2'); log(1,'Materia prima creada', {k:mp.get(k) for k in ['nombre','stock','costoPromedio','unidadMedida']} if mp else None)

        # 2. Producto terminado nuevo
        await page.click('#btn-new-product'); await page.wait_for_timeout(400)
        await page.select_option(f+'select[name=tipoItem]','PRODUCTO_TERMINADO')
        await page.fill(f+'input[name=sku]','RAYO-SHC-1L'); await page.fill(f+'input[name=nombre]','Shampoo Cerámico SiO2 1 Litro')
        await page.fill(f+'input[name=categoria]','Shampoos'); await page.select_option(f+'select[name=unidadMedida]','Unidad')
        await page.fill(f+'input[name=stockMinimo]','24'); await page.fill(f+'input[name=vidaUtilMeses]','24')
        await shot(page,'producto_form')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1000)
        pt = await prod_by_sku(page,'RAYO-SHC-1L'); log(2,'Producto terminado creado', {k:pt.get(k) for k in ['nombre','stock','costoPromedio','precios']} if pt else None)
        await shot(page,'catalogo')

        # 3. Compra a crédito de la materia prima
        await T.goto(page,'purchases'); await page.click('#btn-new-purchase'); await page.wait_for_timeout(500)
        await page.select_option('#purch-item-prod', mp['id']); await page.fill('#purch-item-qty','50'); await page.fill('#purch-item-cost','42000')
        await page.click('#btn-add-purch-item'); await page.select_option('#purch-payment-term','CREDITO')
        await shot(page,'compra_form')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1500); await T.close_modals(page)
        mp = await prod_by_sku(page,'MP-SIO2')
        cxp = [c for c in await page.evaluate(G,['payables_cxp']) if c.get('tipoDocumento')=='FACTURA_COMPRA']
        log(3,'Compra registrada', {'stock_mp':mp['stock'],'costo_mp':mp['costoPromedio'],'cxp':[(c.get('numeroDocumento') or c.get('consecutivo'), c.get('valorTotal') or c.get('total'), c.get('saldoPendiente')) for c in cxp][-1:]})
        await shot(page,'compras')

        # 4. Fórmula en la bóveda
        await T.goto(page,'formulas-vault')
        await page.fill('#vault-pin-inp','2468'); await page.fill('#vault-pin-inp2','2468'); await page.click('#vault-pin-form button[type=submit]'); await page.wait_for_timeout(2500)
        await page.click('#btn-nueva-receta-asistente'); await page.wait_for_timeout(500)
        await page.fill('#wiz-rec-name','Fórmula Shampoo Cerámico 1L (lote 100 L)')
        await page.select_option('#wiz-rec-prod', pt['id']); await page.fill('#wiz-rec-batch','100'); await page.fill('#wiz-rec-vol','100'); await page.select_option('#wiz-rec-unit','Litros'); await page.fill('#wiz-rec-cif','30000')
        await shot(page,'formula_paso1')
        await page.click('#wiz-rec-next'); await page.wait_for_timeout(400)
        allp = await page.evaluate(G,['products'])
        base_alc = next(x for x in allp if x['id']=='prod_mp_base_alcalina'); envase = next(x for x in allp if x['id']=='prod_mp_envase_1l'); caja = next(x for x in allp if x['id']=='prod_mp_caja_12')
        ings = [(mp['id'],'8'),(base_alc['id'],'20'),(envase['id'],'100'),(caja['id'],'9')]
        for i,(pid,qty) in enumerate(ings):
            rows = page.locator('#wiz-tbody-ings tr')
            if await rows.count() <= i:
                await page.click('#wiz-btn-add-ing'); await page.wait_for_timeout(200)
            row = page.locator('#wiz-tbody-ings tr').nth(i)
            await row.locator('.sel-mp').select_option(pid); await page.wait_for_timeout(150)
            row = page.locator('#wiz-tbody-ings tr').nth(i)
            if i == 0:
                await row.locator('.inp-merma').fill('2'); await page.wait_for_timeout(100)
            row = page.locator('#wiz-tbody-ings tr').nth(i)
            await row.locator('.inp-qty').fill(''); await row.locator('.inp-qty').click()
            await page.keyboard.type(qty, delay=40); await page.wait_for_timeout(150)
            got = await page.locator('#wiz-tbody-ings tr').nth(i).locator('.inp-qty').input_value()
            if got != qty: log(4, 'ERROR: escritura tecla a tecla perdió dígitos', {'esperado': qty, 'quedó': got})
        await shot(page,'formula_paso2_ingredientes')
        await page.click('#wiz-rec-next'); await page.wait_for_timeout(400)
        await page.fill('#wiz-rec-steps','1. Cargar 70 L de agua desmineralizada.\n2. Agregar base alcalina con agitación 15 min.\n3. Agregar concentrado SiO2 lentamente.\n4. Completar a 100 L y envasar.')
        await page.click('#wiz-rec-next'); await page.wait_for_timeout(400)
        await shot(page,'formula_paso4_ficha')
        await page.click('#wiz-rec-save'); await page.wait_for_timeout(1500)
        rec = next((r for r in await page.evaluate(G,['recipes_bom']) if r.get('productoTerminadoId')==pt['id']), None)
        log(4,'Fórmula guardada', {'lote':rec.get('rendimientoLote'),'insumos':[(i.get('materiaPrimaId'),i.get('cantidad'),i.get('unidadMedida')) for i in rec['insumos']],'protocolo_cifrado':'instruccionesFases' not in rec} if rec else None)
        await page.locator('details.recipe-details').last.evaluate('d => d.open = true')
        await shot(page,'boveda')

        # 5. Precios desde la receta
        await T.goto(page,'pricing-calculator'); await page.wait_for_timeout(500)
        row = page.locator(f'#pricing-tbody tr[data-pid="{pt["id"]}"]')
        await row.locator('.btn-row-calc').click(); await page.wait_for_timeout(800)
        quick = await page.locator('.calc-quick button').all_inner_texts()
        rbtn = page.locator('.calc-quick button', has_text='Receta')
        if await rbtn.count(): await rbtn.click()
        await page.fill('#calc-otros','600'); await page.fill('#calc-merma','2'); await page.wait_for_timeout(200)
        total = await page.inner_text('#calc-total')
        sugs = {await r.get_attribute('data-list'): await r.locator('.calc-sug').inner_text() for r in await page.locator('.calc-table tbody tr').all()}
        await shot(page,'precios_calculadora')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        pt = await prod_by_sku(page,'RAYO-SHC-1L')
        log(5,'Precios aplicados', {'botones_costo':quick,'costo_total_unidad':total,'precios':{c: pt['precios'].get(l['id']) for c,l in lists.items()},'costoEstimado':pt.get('costoEstimadoCalculadora')})
        await shot(page,'precios_tabla')

        # 6. Producción de 100 unidades
        before = {x['id']:x['stock'] for x in await page.evaluate(G,['products'])}
        await T.goto(page,'production'); await page.click('#btn-execute-production'); await page.wait_for_timeout(700)
        await page.select_option('#sel-production-recipe', rec['id']); await page.wait_for_timeout(400)
        await page.fill('#inp-prod-qty','100'); await page.dispatch_event('#inp-prod-qty','input'); await page.wait_for_timeout(600)
        log(6, 'CIF propuesto en producción', await page.input_value('#inp-prod-cif'))
        await shot(page,'produccion_explosion')
        ok_btn = page.locator('#btn-confirm-production')
        enabled = await ok_btn.is_enabled()
        if enabled:
            await ok_btn.click(); await page.wait_for_timeout(1800)
        await T.close_modals(page)
        after = {x['id']:x for x in await page.evaluate(G,['products'])}
        orders = [o for o in await page.evaluate(G,['production_orders']) if o.get('productoTerminadoId')==pt['id']]
        log(6,'Producción', {'boton_habilitado':enabled,'orden':orders[-1].get('numeroOrden') if orders else None,'costo_unit_orden':orders[-1].get('costoUnitarioReal') if orders else None,
            'stock_PT':(before[pt['id']], after[pt['id']]['stock']),'costo_PT':after[pt['id']]['costoPromedio'],
            'consumos':{after[i]['sku']:(before[i], after[i]['stock']) for i,_ in ings}})
        await shot(page,'produccion_ordenes')
        pt = after[pt['id']]

        # 7. Venta de contado (P1, 12 unidades, efectivo)
        shifts = [s for s in await page.evaluate(G,['cash_shifts']) if s['estado']=='ABIERTA']
        if not shifts:
            await T.goto(page,'cash'); await page.click('#btn-open-shift-center, #btn-open-shift'); await page.wait_for_timeout(300)
            await page.fill('input[name=montoApertura]','100000'); await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        caja0 = [s for s in await page.evaluate(G,['cash_shifts']) if s['estado']=='ABIERTA'][0]['saldoEsperado']
        await T.goto(page,'sales-pos'); await page.select_option('#pos-select-pricelist', lists['P1']['id']); await page.wait_for_timeout(300)
        await page.fill('#pos-search-product','Cerámico'); await page.wait_for_timeout(400)
        await page.locator(f'.pos-product-card[data-product-id="{pt["id"]}"]').click(); await page.wait_for_timeout(200)
        await page.fill('.pos-item-qty','12'); await page.dispatch_event('.pos-item-qty','change'); await page.wait_for_timeout(300)
        tot = await page.inner_text('#pos-lbl-total')
        await shot(page,'pos_venta_contado')
        await page.click('#btn-process-sale'); await page.wait_for_timeout(300); await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1800)
        await T.close_modals(page)
        sales = sorted(await page.evaluate(G,['sales']), key=lambda s: s.get('fecha',''))
        v1 = sales[-1]; caja1 = [s for s in await page.evaluate(G,['cash_shifts']) if s['estado']=='ABIERTA'][0]['saldoEsperado']
        pt2 = await prod_by_sku(page,'RAYO-SHC-1L')
        log(7,'Venta de contado', {'consecutivo':v1['consecutivo'],'total':v1['total'],'iva':v1.get('totalIva') or v1.get('iva'),'costoTotal':v1.get('costoTotal'),'total_pantalla':tot,'stock':pt2['stock'],'caja':(caja0,caja1)})

        # 8. Venta a crédito P3 (24 und) a cliente con cupo
        custs = await page.evaluate(G,['customers']); cli = [c for c in custs if c.get('nitCc')!='222222222222'][0]
        cli['cupoCredito']=5000000; cli['saldoPendiente']=0; await page.evaluate(T.P,['customers',cli])
        await T.goto(page,'dashboard'); await T.goto(page,'sales-pos')
        await page.select_option('#pos-select-client', cli['id']); await page.wait_for_timeout(300)
        await page.select_option('#pos-select-pricelist', lists['P3']['id']); await page.wait_for_timeout(300)
        await page.fill('#pos-search-product','Cerámico'); await page.wait_for_timeout(400)
        await page.locator(f'.pos-product-card[data-product-id="{pt["id"]}"]').click(); await page.wait_for_timeout(200)
        await page.fill('.pos-item-qty','24'); await page.dispatch_event('.pos-item-qty','change'); await page.wait_for_timeout(300)
        await page.select_option('#pos-doc-type','VENTA_CREDITO'); await page.wait_for_timeout(300)
        await shot(page,'pos_venta_credito')
        await page.click('#btn-process-sale'); await page.wait_for_timeout(300); await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1800)
        await T.close_modals(page)
        v2 = sorted(await page.evaluate(G,['sales']), key=lambda s: s.get('fecha',''))[-1]
        cxc = [c for c in await page.evaluate(G,['receivables_cxc']) if c.get('ventaId')==v2['id']]
        log(8,'Venta a crédito', {'consecutivo':v2['consecutivo'],'cliente':cli['nombre'],'total':v2['total'],'estado':v2['estado'],'cxc_saldo':cxc[0].get('saldoPendiente') if cxc else None,'stock':(await prod_by_sku(page,'RAYO-SHC-1L'))['stock']})

        # 9. Abono total a la cuenta por cobrar (transferencia)
        await T.goto(page,'cxc'); await page.locator(f'.btn-cxc-payment[data-id="{cxc[0]["id"]}"]').click(); await page.wait_for_timeout(400)
        await page.select_option('#cxc-payment-form select[name=metodoPago]', 'Efectivo')
        await shot(page,'cxc_abono')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1500); await T.close_modals(page)
        v2b = next(s for s in await page.evaluate(G,['sales']) if s['id']==v2['id'])
        log(9,'Abono recibido', {'estado_venta':v2b['estado'],'caja':[s for s in await page.evaluate(G,['cash_shifts']) if s['estado']=='ABIERTA'][0]['saldoEsperado']})

        # 10. Pago al proveedor (CxP)
        await T.goto(page,'cxp'); await page.wait_for_timeout(500)
        cxp_last = sorted([c for c in await page.evaluate(G,['payables_cxp']) if c.get('tipoDocumento')=='FACTURA_COMPRA'], key=lambda c: c.get('fechaCreacion',''))[-1]
        btn = page.locator(f'[data-id="{cxp_last["id"]}"]').first
        pago_ok = False
        if await btn.count():
            await btn.click(); await page.wait_for_timeout(500)
            await shot(page,'cxp_pago')
            try:
                sel = page.locator('.modal select[name=metodoPago]')
                if await sel.count(): await sel.select_option('Transferencia')
            except Exception: pass
            await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1500); await T.close_modals(page)
            pago_ok = True
        cxp2 = next(c for c in await page.evaluate(G,['payables_cxp']) if c['id']==cxp_last['id'])
        log(10,'Pago a proveedor', {'intentado':pago_ok,'saldo':cxp2.get('saldoPendiente'),'estado':cxp2.get('estado')})

        # 10b. IVA por producto: el producto pasa a 5 % y se vende 1 unidad en P2 (sin IVA)
        ptx = await prod_by_sku(page,'RAYO-SHC-1L'); ptx['ivaPct'] = 5; await page.evaluate(T.P,['products',ptx])
        await T.goto(page,'dashboard'); await T.goto(page,'sales-pos')
        await page.select_option('#pos-select-pricelist', lists['P2']['id']); await page.wait_for_timeout(300)
        await page.fill('#pos-search-product','Cerámico'); await page.wait_for_timeout(400)
        await page.locator(f'.pos-product-card[data-product-id="{pt["id"]}"]').click(); await page.wait_for_timeout(300)
        iva_pantalla = await page.inner_text('#pos-lbl-iva')
        await page.click('#btn-process-sale'); await page.wait_for_timeout(300); await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1800)
        await T.close_modals(page)
        v3 = sorted(await page.evaluate(G,['sales']), key=lambda s: s.get('fecha',''))[-1]
        log(10.5,'Venta con IVA 5 %', {'consecutivo': v3['consecutivo'], 'precio': v3['items'][0]['precioUnitario'], 'iva': v3.get('impuestos'), 'iva_pantalla': iva_pantalla})

        # 10c. Lotes: vencimiento automático por vida útil y rastreo hasta el cliente
        ordx = [o for o in await page.evaluate(G,['production_orders']) if o.get('productoTerminadoId')==pt['id']][-1]
        sales_all = await page.evaluate(G,['sales'])
        lot_sales = [s['consecutivo'] for s in sales_all for it in s.get('items',[]) for l in (it.get('lotes') or []) if l['codigo']==ordx['loteCodigo']]
        await T.goto(page,'inventory'); await page.click('.tab-btn[data-tab="lots"]'); await page.wait_for_timeout(500)
        await page.fill('#lot-trace-inp', ordx['loteCodigo']); await page.click('#lot-trace-btn'); await page.wait_for_timeout(700)
        trace_txt = await page.inner_text('#lot-trace-result')
        await shot(page,'lotes_rastreo')
        ptl = await prod_by_sku(page,'RAYO-SHC-1L')
        log(10.6,'Lotes', {'lote': ordx['loteCodigo'], 'vence': ordx.get('fechaVencimiento'), 'ventas_con_lote': lot_sales, 'lotes_producto': ptl.get('lotes'), 'rastreo_muestra_ventas': all(c in trace_txt for c in lot_sales)})

        # 10d. Rentabilidad por producto
        await T.goto(page,'dashboard'); await T.goto(page,'reports'); await page.wait_for_timeout(800)
        prof = await page.evaluate('''() => [...document.querySelectorAll('#profit-table tbody tr')].map(tr => tr.innerText)''')
        await shot(page,'rentabilidad')
        log(10.7,'Rentabilidad', [r for r in prof if 'Cerámico' in r])

        # 11. Kardex del producto y resultados
        kx = [k for k in await page.evaluate(G,['kardex']) if k.get('productoId') in (pt['id'], mp['id'])]
        log(11,'Kardex', [(k.get('productoNombre') or k.get('productoId'), k.get('tipoMovimiento'), k.get('cantidadEntrada') or k.get('entrada'), k.get('cantidadSalida') or k.get('salida'), k.get('saldoCantidad') or k.get('saldo'), k.get('costoUnitario'), k.get('documentoNumero')) for k in kx])
        await T.goto(page,'inventory'); await page.fill('#kardex-table-container input', 'Cerámico'); await page.wait_for_timeout(500)
        await shot(page,'kardex')
        await T.goto(page,'dashboard'); await page.wait_for_timeout(1200); await shot(page,'dashboard')
        await T.goto(page,'reports'); await page.wait_for_timeout(1200); await shot(page,'reportes')
        log(99,'Errores JS', errs)
        json.dump(LOG, open(OUT+'log.json','w'), ensure_ascii=False, indent=1, default=str)
        ck = T.check
        print('== Verificaciones ==')
        ck('compra suma 50 Kg al costo de compra', LOG[2]['data']['stock_mp'] == 50 and LOG[2]['data']['costo_mp'] == 42000)
        costo_receta = (8*1.02*42000 + 20*base_alc['costoPromedio'] + 100*envase['costoPromedio'] + 9*caja['costoPromedio'] + 30000) / 100
        ck('costo de la receta = insumos + indirectos ÷ lote', f"{round(costo_receta):,}".replace(',', '.') in ' '.join(LOG[4]['data']['botones_costo']), str(LOG[4]['data']['botones_costo']))
        prod_log = next(x for x in LOG if x['step'] == 6 and x['msg'] == 'Producción')['data']
        ck('producción: costo por unidad igual al de la receta', abs(prod_log['costo_unit_orden'] - round(costo_receta)) <= 1, prod_log['costo_unit_orden'])
        ck('producción: +100 unidades y consumo exacto de insumos', list(prod_log['stock_PT']) == [0, 100] and list(prod_log['consumos']['MP-SIO2']) == [50, 41.84] and prod_log['consumos']['EMP-BOTELLA-1L'][0] - prod_log['consumos']['EMP-BOTELLA-1L'][1] == 100)
        v1 = next(x for x in LOG if x['step'] == 7)['data']
        ck('venta de contado: total = 12 × P1 y entra a caja', v1['total'] == 12 * LOG[4]['data']['precios']['P1'] and v1['caja'][1] - v1['caja'][0] == v1['total'])
        ck('venta: costo de lo vendido al costo de producción', abs(v1['costoTotal'] - 12 * prod_log['costo_PT']) <= 1)
        v2 = next(x for x in LOG if x['step'] == 8)['data']
        ck('venta a crédito: 24 × P3 + IVA 19 % y queda pendiente', v2['total'] == round(24 * LOG[4]['data']['precios']['P3'] * 1.19) and v2['estado'] == 'CREDITO_PENDIENTE' and v2['stock'] == 64)
        ck('abono total deja la venta PAGADA', next(x for x in LOG if x['step'] == 9)['data']['estado_venta'] == 'PAGADA')
        ck('pago al proveedor deja la cuenta PAGADA', next(x for x in LOG if x['step'] == 10)['data']['estado'] == 'PAGADA')
        ck('Kardex con compra, consumo, producción y 3 ventas', len(next(x for x in LOG if x['step'] == 11)['data']) == 6)
        v3 = next(x for x in LOG if x['step'] == 10.5)['data']
        ck('IVA por producto: 5 % en el punto de venta y en la venta', v3['iva'] == round(v3['precio'] * 0.05) and str(round(v3['precio'] * 0.05)).replace('000', '') in v3['iva_pantalla'].replace('.', '').replace('\xa0', ''), str(v3))
        lt = next(x for x in LOG if x['step'] == 10.6)['data']
        from datetime import date
        exp_v = date.today().replace(year=date.today().year + 2).isoformat()
        ck('lote con vencimiento automático (vida útil 24 meses)', lt['vence'] == exp_v, f"{lt['vence']} vs {exp_v}")
        ck('las 3 ventas guardan el lote vendido', len(lt['ventas_con_lote']) == 3, str(lt['ventas_con_lote']))
        ck('existencia del lote = stock del producto', abs(sum(l['cantidad'] for l in lt['lotes_producto']) - 63) < 0.001, str(lt['lotes_producto']))
        ck('rastreo del lote muestra las ventas', lt['rastreo_muestra_ventas'])
        rp = next(x for x in LOG if x['step'] == 10.7)['data']
        ck('rentabilidad por producto incluye el producto nuevo con 37 unidades', bool(rp) and '37' in rp[0], str(rp))
        ck('sin errores JavaScript', not errs, '; '.join(errs)[:200])
        fails = [r for r in T.RESULTS if not r[1]]
        print(f'\n{len(T.RESULTS) - len(fails)}/{len(T.RESULTS)} verificaciones OK')
        await b.close(); srv.shutdown()
        return 1 if fails else 0
if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
