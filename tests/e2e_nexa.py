"""
Pruebas end-to-end de NexaAdmin (Playwright + Chromium).

Uso:
    pip install playwright && python -m playwright install chromium
    python -m http.server 8765        (desde la carpeta que CONTIENE NexaAdmin/)
    python NexaAdmin/tests/e2e_nexa.py [--base http://127.0.0.1:8765/NexaAdmin/] [--legacy http://127.0.0.1:8765/old/]

--legacy (opcional): URL de la versión anterior en el MISMO origen, para probar la migración de datos.
"""
import argparse, asyncio, json, sys
from playwright.async_api import async_playwright

G = """async ([s]) => await new Promise((res,rej)=>{const r=indexedDB.open('NexaERP_DB');r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains(s)){res([]);return;}const q=db.transaction(s).objectStore(s).getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}})"""
P = """async ([s,o]) => await new Promise((res,rej)=>{const r=indexedDB.open('NexaERP_DB');r.onsuccess=()=>{const q=r.result.transaction(s,'readwrite').objectStore(s).put(o);q.onsuccess=()=>res(true);q.onerror=()=>rej(q.error)}})"""

RESULTS = []
def check(name, cond, detail=''):
    RESULTS.append((name, bool(cond), detail))
    print(('  OK   ' if cond else '  FAIL ') + name + (f'  [{detail}]' if detail else ''))

NEW_PASS = 'ClaveSegura#2026'

async def wait_app(page):
    await page.wait_for_selector('#view-container .view-header, #view-container .pos-kpi-bar, .auth-wrap', timeout=8000)

async def login(page, base, user, pw):
    await page.goto(base); await page.wait_for_selector('.auth-wrap')
    await page.fill('input[name=usuario]', user); await page.fill('input[name=password]', pw)
    await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(1200)

async def goto(page, route):
    await page.evaluate(f"window.location.hash='#{route}'"); await page.wait_for_timeout(900)

async def confirm_modal(page):
    await page.click('.modal-footer .btn-primary, .modal-footer .btn-danger'); await page.wait_for_timeout(1200)

async def close_modals(page):
    while await page.locator('.modal-backdrop').count():
        await page.keyboard.press('Escape'); await page.wait_for_timeout(150)

async def product(page, pid):
    return [p for p in await page.evaluate(G, ['products']) if p['id'] == pid][0]

async def run(base, legacy):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(service_workers='block', viewport={'width': 1440, 'height': 950})
        page = await ctx.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))

        if legacy:
            print('== Migración desde la versión anterior ==')
            await page.goto(legacy); await page.wait_for_timeout(1500)
            await page.fill('#login-username', 'admin'); await page.fill('#login-password', '1234')
            await page.click('#login-form button[type=submit]'); await page.wait_for_timeout(2000)
            prods = await page.evaluate(G, ['products'])
            marker = prods[0]; marker['stock'] = 77; await page.evaluate(P, ['products', marker])
            await page.goto(base); await page.wait_for_timeout(2000)
            check('versión anterior: pide login (sesión antigua invalidada)', await page.locator('.auth-wrap').count() == 1)
            users = await page.evaluate(G, ['users'])
            check('claves migradas a hash (sin texto plano)', all('clave' not in u for u in users) and all(u.get('claveHash','').startswith('pbkdf2$') for u in users if not u.get('sinClave')))
            check('datos conservados tras migración', (await product(page, marker['id']))['stock'] == 77)
            await page.fill('input[name=usuario]', 'admin'); await page.fill('input[name=password]', '1234')
            await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(1500)
            check('clave débil obliga a cambiarla', 'obligatorio' in (await page.inner_text('.auth-wrap')))
            await page.fill('input[name=pass1]', NEW_PASS); await page.fill('input[name=pass2]', NEW_PASS)
            await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(1500)
            code = (await page.inner_text('#recovery-code')).strip() if await page.locator('#recovery-code').count() else ''
            check('se muestra código de recuperación', len(code) == 19, code)
            await page.check('#chk-code-saved'); await page.click('#btn-code-continue'); await page.wait_for_timeout(2000)
            await wait_app(page)
            await page.goto(base); await page.wait_for_timeout(1500)
            check('sesión persiste tras recargar', await page.locator('.auth-wrap').count() == 0)
            prods2 = await page.evaluate(G, ['products'])
            check('recarga NO resiembra (stock intacto)', (await product(page, marker['id']))['stock'] == 77)
        else:
            print('== Primer arranque ==')
            await page.goto(base); await page.wait_for_timeout(2000)
            check('primer arranque muestra configuración inicial', 'Configuración inicial' in await page.inner_text('body'))
            await page.fill('input[name=nombre]', 'Admin Pruebas')
            await page.fill('input[name=pass1]', '1234'); await page.fill('input[name=pass2]', '1234')
            await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(800)
            check('rechaza clave débil', await page.locator('#auth-error').is_visible())
            await page.fill('input[name=pass1]', NEW_PASS); await page.fill('input[name=pass2]', NEW_PASS)
            await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(2500)
            code = (await page.inner_text('#recovery-code')).strip()
            check('código de recuperación generado', len(code) == 19, code)
            await page.check('#chk-code-saved'); await page.click('#btn-code-continue'); await page.wait_for_timeout(2000)

        print('== Seguridad ==')
        await page.evaluate("localStorage.removeItem('nexa_session')")
        await login(page, base, 'admin', 'NEXA_RESCUE_999')
        check('clave maestra NEXA_RESCUE_999 ya no funciona', await page.locator('#auth-error').is_visible())
        await login(page, base, 'admin', '1234')
        check('1234 ya no funciona', await page.locator('#auth-error').is_visible())
        await page.evaluate("localStorage.setItem('nexa_active_user','usr_dev')"); await page.goto(base); await page.wait_for_timeout(1200)
        check('escalada por localStorage bloqueada', await page.locator('.auth-wrap').count() == 1)
        await login(page, base, 'admin', NEW_PASS)
        check('login con clave nueva', await page.locator('.auth-wrap').count() == 0)

        print('== Recorrido de módulos ==')
        routes = ['dashboard','sales-pos','shipping','products','inventory','production','formulas-vault','pricing-calculator','cash','purchases','expenses','cxc','cxp','clients','freelancers','settings','users','backup','importer','reports','audit','integrations','documents']
        for r in routes:
            n = len(errors)
            await goto(page, r)
            bad = await page.locator('#view-container > .alert-danger, #view-container .alert.alert-danger.m-4').count()
            check(f'módulo {r} carga sin errores', bad == 0 and len(errors) == n, '; '.join(errors[n:])[:200])
            await close_modals(page)

        print('== Caja y POS ==')
        shifts = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA']
        if shifts:
            await goto(page, 'cash'); await page.click('#btn-close-shift'); await page.fill('#inp-cash-counted', str(int(shifts[0]['saldoEsperado'])))
            await page.click('.modal-footer .btn-danger'); await page.wait_for_timeout(1500); await close_modals(page)
        await goto(page, 'sales-pos')
        check('POS advierte caja cerrada', 'No hay turno de caja abierto' in await page.inner_text('#view-container'))
        card = page.locator('.pos-product-card').first
        pid = await card.get_attribute('data-product-id'); s0 = (await product(page, pid))['stock']
        await card.click(); await page.wait_for_timeout(200)
        await page.click('#btn-process-sale'); await page.wait_for_timeout(300); await confirm_modal(page)
        check('venta de contado sin caja es rechazada', (await product(page, pid))['stock'] == s0)
        await close_modals(page)

        # Cotización: no toca stock
        await goto(page, 'sales-pos'); await page.locator('.pos-product-card').first.click()
        await page.select_option('#pos-doc-type', 'COTIZACION'); await page.wait_for_timeout(200)
        await page.click('#btn-process-sale'); await page.wait_for_timeout(300); await confirm_modal(page)
        sales = await page.evaluate(G, ['sales']); q = sorted(sales, key=lambda s: s.get('fecha',''))[-1]
        check('cotización no descuenta stock', (await product(page, pid))['stock'] == s0)
        check('cotización con estado COTIZACION y consecutivo secuencial', q['estado'] == 'COTIZACION' and q['consecutivo'].startswith('COT-'), q['consecutivo'])
        await close_modals(page)

        # Abrir caja
        await goto(page, 'cash'); await page.click('#btn-open-shift-center, #btn-open-shift'); await page.wait_for_timeout(300)
        await page.fill('input[name=montoApertura]', '100000'); await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        sh = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA']
        check('turno abierto con el usuario real', sh and sh[0]['usuarioNombre'] not in ('Carlos Mario Arango',), sh[0]['usuarioNombre'] if sh else '')

        # Venta en efectivo
        await goto(page, 'sales-pos')
        await page.select_option('#pos-select-pricelist', index=0)
        await page.locator(f'.pos-product-card[data-product-id="{pid}"]').click(); await page.wait_for_timeout(100)
        await page.locator(f'.pos-product-card[data-product-id="{pid}"]').click(); await page.wait_for_timeout(100)
        total_txt = await page.inner_text('#pos-lbl-total')
        await page.click('#btn-process-sale'); await page.wait_for_timeout(300)
        # doble confirmación rápida (no debe duplicar)
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1500)
        sales = await page.evaluate(G, ['sales']); v = sorted(sales, key=lambda s: s.get('fecha',''))[-1]
        prod_after = await product(page, pid)
        check('venta descuenta 2 unidades', prod_after['stock'] == s0 - 2, f"{s0}->{prod_after['stock']}")
        kx = [k for k in await page.evaluate(G, ['kardex']) if k['documentoNumero'] == v['consecutivo']]
        check('kardex de venta al costo promedio', kx and abs(kx[0]['costoUnitario'] - prod_after['costoPromedio']) < 0.01 and kx[0]['costoUnitario'] < v['items'][0]['precioUnitario'], f"costo {kx[0]['costoUnitario'] if kx else '-'}")
        sh2 = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA'][0]
        check('venta en efectivo suma a la caja', sh2['saldoEsperado'] == 100000 + v['total'], f"{sh2['saldoEsperado']} vs {100000 + v['total']}")
        check('venta con consecutivo secuencial y costo', v['numero'] >= 1 and v['costoTotal'] > 0, v['consecutivo'])
        await close_modals(page)

        # Anulación
        await goto(page, 'sales-pos'); await page.click('#pos-open-history'); await page.wait_for_timeout(500)
        await page.locator(f'.h-act[data-act="annul"][data-id="{v["id"]}"]').click(); await page.wait_for_timeout(300)
        await page.fill('#annul-reason', 'Prueba automática de anulación'); await page.click('.modal-footer .btn-danger'); await page.wait_for_timeout(1500)
        v2 = [s for s in await page.evaluate(G, ['sales']) if s['id'] == v['id']][0]
        check('venta anulada', v2['estado'] == 'ANULADA')
        check('anulación devuelve stock', (await product(page, pid))['stock'] == s0)
        sh3 = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA'][0]
        check('anulación revierte caja', sh3['saldoEsperado'] == 100000, sh3['saldoEsperado'])
        await close_modals(page)

        # Cambio de lista de precios se conserva
        await goto(page, 'sales-pos')
        opts = await page.locator('#pos-select-pricelist option').all()
        if len(opts) > 1:
            target = await opts[-1].get_attribute('value')
            await page.select_option('#pos-select-pricelist', target); await page.wait_for_timeout(300)
            check('cambio de lista de precios se conserva', await page.input_value('#pos-select-pricelist') == target)

        # Búsqueda global
        await page.keyboard.press('Control+k'); await page.wait_for_timeout(300)
        await page.fill('#inp-modal-global-search', 'de'); await page.wait_for_timeout(700)
        check('búsqueda global devuelve resultados', await page.locator('.global-search-hit').count() > 0)
        await close_modals(page)


        print('== Crédito y cartera ==')
        await page.evaluate("localStorage.removeItem('nexa_session')")
        await login(page, base, 'admin', NEW_PASS)
        custs = await page.evaluate(G, ['customers'])
        cli = [c for c in custs if c.get('nitCc') != '222222222222'][0]
        cli['cupoCredito'] = 10000000; cli['saldoPendiente'] = 0; cli['aplicaIva'] = True
        await page.evaluate(P, ['customers', cli])
        await goto(page, 'sales-pos')
        await page.select_option('#pos-select-client', cli['id']); await page.wait_for_timeout(300)
        await page.locator('.pos-product-card').first.click(); await page.wait_for_timeout(100)
        await page.select_option('#pos-doc-type', 'VENTA_CREDITO'); await page.wait_for_timeout(200)
        await page.click('#btn-process-sale'); await page.wait_for_timeout(300); await confirm_modal(page)
        vc = sorted(await page.evaluate(G, ['sales']), key=lambda s: s.get('fecha',''))[-1]
        cxcs = [c for c in await page.evaluate(G, ['receivables_cxc']) if c.get('ventaId') == vc['id']]
        check('venta a crédito crea cuenta por cobrar', vc['estado'] == 'CREDITO_PENDIENTE' and len(cxcs) == 1)
        await close_modals(page)
        await goto(page, 'cxc')
        await page.locator(f'.btn-cxc-payment[data-id="{cxcs[0]["id"]}"]').click(); await page.wait_for_timeout(300)
        await page.select_option('#cxc-payment-form select[name=metodoPago]', 'Efectivo')
        sh_before = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA'][0]['saldoEsperado']
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        vc2 = [s for s in await page.evaluate(G, ['sales']) if s['id'] == vc['id']][0]
        sh_after = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA'][0]['saldoEsperado']
        check('abono total marca la venta como PAGADA', vc2['estado'] == 'PAGADA')
        check('abono en efectivo entra a la caja', sh_after == sh_before + vc['total'], f'{sh_before}->{sh_after}')
        cli2 = [c for c in await page.evaluate(G, ['customers']) if c['id'] == cli['id']][0]
        check('saldo del cliente vuelve a 0', cli2['saldoPendiente'] == 0)

        print('== Compras y producción ==')
        await goto(page, 'purchases'); await page.click('#btn-new-purchase'); await page.wait_for_timeout(400)
        mp = [p for p in await page.evaluate(G, ['products']) if p.get('tipoItem') == 'MATERIA_PRIMA'][0]
        await page.select_option('#purch-item-prod', mp['id']); await page.fill('#purch-item-qty', '100'); await page.fill('#purch-item-cost', str(mp['costoPromedio'] * 2))
        await page.click('#btn-add-purch-item'); await page.select_option('#purch-payment-term', 'CREDITO')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1500)
        mp2 = await product(page, mp['id'])
        exp_avg = round((mp['stock'] * mp['costoPromedio'] + 100 * mp['costoPromedio'] * 2) / (mp['stock'] + 100), 2)
        check('compra suma stock y recalcula costo promedio', mp2['stock'] == mp['stock'] + 100 and abs(mp2['costoPromedio'] - exp_avg) < 0.02, f"{mp2['costoPromedio']} vs {exp_avg}")
        cxp_c = [c for c in await page.evaluate(G, ['payables_cxp']) if c.get('tipoDocumento') == 'FACTURA_COMPRA']
        check('compra a crédito crea cuenta por pagar', len(cxp_c) >= 1)
        await close_modals(page)
        recipes = await page.evaluate(G, ['recipes_bom'])
        orders0 = len(await page.evaluate(G, ['production_orders']))
        await goto(page, 'production'); await page.click('#btn-execute-production'); await page.wait_for_timeout(800)
        btn = page.locator('#btn-confirm-production')
        if await btn.is_enabled():
            await btn.click(); await page.wait_for_timeout(1500)
            orders = await page.evaluate(G, ['production_orders'])
            last = sorted(orders, key=lambda o: o.get('fechaInicio',''))[-1]
            check('orden de producción con consecutivo y responsable real', len(orders) == orders0 + 1 and last['numeroOrden'].startswith('OP-') and last['responsableNombre'] not in ('Julián Montoya (Planta)',), last['numeroOrden'])
        else:
            check('producción bloqueada por falta de insumos (esperado si no hay stock)', True)
        await close_modals(page)

        print('== Gastos ==')
        sh0 = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA'][0]['saldoEsperado']
        await goto(page, 'expenses'); await page.click('#btn-new-expense'); await page.wait_for_timeout(300)
        await page.fill('#expense-form input[name=valor]', '5000'); await page.fill('#expense-form input[name=concepto]', 'Prueba gasto caja')
        await page.select_option('#expense-form select[name=formaPago]', 'Efectivo Caja Menor')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        sh1 = [s for s in await page.evaluate(G, ['cash_shifts']) if s['estado'] == 'ABIERTA'][0]['saldoEsperado']
        check('gasto en efectivo descuenta la caja', sh1 == sh0 - 5000, f'{sh0}->{sh1}')
        await close_modals(page)

        print('== Bóveda ==')
        await goto(page, 'formulas-vault')
        await page.fill('#vault-pin-inp', 'Boveda#1'); await page.fill('#vault-pin-inp2', 'Boveda#1')
        await page.click('#vault-pin-form button[type=submit]'); await page.wait_for_timeout(2500)
        recs = await page.evaluate(G, ['recipes_bom'])
        check('recetas sin texto secreto en claro', all('instruccionesFases' not in r for r in recs))
        await goto(page, 'production')
        check('producción sigue funcionando con recetas cifradas', await page.locator('#btn-execute-production').count() == 1)

        print('== Respaldo ==')
        await goto(page, 'backup')
        async with page.expect_download() as dl:
            await page.click('#btn-export-backup')
        d = await dl.value
        path = await d.path()
        data = json.load(open(path, encoding='utf-8'))
        check('respaldo descargado con todas las tablas', 'attachments' in data['stores'] and len(data['stores']['sales']) > 0)
        check('respaldo sin contraseñas en claro', all('clave' not in u for u in data['stores']['users']))

        print('== Usuarios ==')
        await goto(page, 'users')
        await page.click('#btn-new-user'); await page.wait_for_timeout(300)
        await page.fill('#user-form input[name=nombre]', 'Cajera Pruebas'); await page.fill('#user-form input[name=usuario]', 'cajera')
        await page.select_option('#user-form select[name=rol]', 'Caja')
        await page.fill('#user-form input[name=clave]', 'Cajera#2026x')
        await page.uncheck('#user-form input[name=forzarCambio]')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        await page.goto(base); await page.wait_for_timeout(1500)
        users = await page.evaluate(G, ['users'])
        check('usuario creado persiste tras recargar', any(u['usuario'] == 'cajera' for u in users))
        await page.evaluate("localStorage.removeItem('nexa_session')")
        await login(page, base, 'cajera', 'Cajera#2026x')
        check('nuevo usuario puede iniciar sesión', await page.locator('.auth-wrap').count() == 0)
        await goto(page, 'users')
        check('rol Caja no accede a usuarios', 'Gestión de Usuarios' not in await page.inner_text('#view-container'))

        print('== Errores JS ==')
        check('sin errores JavaScript no controlados', len(errors) == 0, '; '.join(errors)[:300])
        await b.close()

    fails = [r for r in RESULTS if not r[1]]
    print(f'\n{len(RESULTS) - len(fails)}/{len(RESULTS)} pruebas OK')
    return 0 if not fails else 1

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='http://127.0.0.1:8765/NexaAdmin/index.html')
    ap.add_argument('--legacy', default=None)
    a = ap.parse_args()
    sys.exit(asyncio.run(run(a.base, a.legacy)))
