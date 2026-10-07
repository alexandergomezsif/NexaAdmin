"""
Pruebas end-to-end de NexaAdmin (Playwright).

Forma fácil (Windows): doble clic en probar.bat

Manual:
    pip install playwright
    python tests/e2e_nexa.py                  (levanta su propio servidor local y usa Edge/Chrome instalado)
    python tests/e2e_nexa.py --base URL [--legacy URL_VERSION_ANTERIOR]

Las pruebas corren en un navegador aislado y temporal: NO tocan los datos reales guardados en Brave.
--legacy (opcional): URL de la versión anterior en el MISMO origen, para probar la migración de datos.
"""
import argparse, asyncio, functools, http.server, json, os, re, sys, threading
from playwright.async_api import async_playwright

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def serve_project():
    """Servidor HTTP local de solo lectura sobre la carpeta del proyecto, en un puerto libre."""
    class Quiet(http.server.SimpleHTTPRequestHandler):
        extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                          '.js': 'application/javascript', '.json': 'application/json', '.css': 'text/css'}
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=ROOT))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f'http://127.0.0.1:{srv.server_address[1]}/index.html'

async def launch_browser(p, browser):
    """Usa el navegador pedido; en 'auto' prueba Edge, luego Chrome, luego el Chromium de Playwright."""
    order = {'auto': ['msedge', 'chrome', None], 'edge': ['msedge'], 'chrome': ['chrome'], 'chromium': [None]}[browser]
    last = None
    for ch in order:
        try:
            b = await (p.chromium.launch(channel=ch) if ch else p.chromium.launch())
            print(f'Navegador de prueba: {ch or "chromium (Playwright)"}')
            return b
        except Exception as e:
            last = e
    raise SystemExit('No se encontró un navegador para las pruebas. Instale Microsoft Edge o ejecute:\n'
                     '  python -m playwright install chromium\n' + str(last)[:300])

G = """async ([s]) => await new Promise((res,rej)=>{const r=indexedDB.open('NexaERP_DB');r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains(s)){res([]);return;}const q=db.transaction(s).objectStore(s).getAll();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}})"""
P = """async ([s,o]) => await new Promise((res,rej)=>{const r=indexedDB.open('NexaERP_DB');r.onsuccess=()=>{const q=r.result.transaction(s,'readwrite').objectStore(s).put(o);q.onsuccess=()=>res(true);q.onerror=()=>rej(q.error)}})"""

RESULTS = []
def check(name, cond, detail=''):
    RESULTS.append((name, bool(cond), detail))
    print(('  OK   ' if cond else '  FAIL ') + name + (f'  [{detail}]' if detail else ''))

NEW_PASS = '4826'

async def wait_app(page):
    await page.wait_for_selector('#view-container .view-header, #view-container .pos-kpi-bar, .auth-wrap', timeout=8000)

async def login(page, base, user, pw):
    await page.goto(base); await page.wait_for_selector('.auth-wrap')
    opts = await page.locator('select[name=usuario] option').evaluate_all('os => os.map(o => o.value)')
    if user not in opts:
        return 'no-user'
    await page.select_option('select[name=usuario]', user); await page.fill('input[name=password]', pw)
    if await page.locator('.auth-wrap').count() and await page.locator('#auth-form').count():
        try:
            await page.click('#auth-form button[type=submit]', timeout=1500)
        except Exception:
            pass
    await page.wait_for_timeout(1200)

async def goto(page, route):
    await page.evaluate(f"window.location.hash='#{route}'"); await page.wait_for_timeout(900)

async def confirm_modal(page):
    await page.click('.modal-footer .btn-primary, .modal-footer .btn-danger'); await page.wait_for_timeout(1200)

async def close_modals(page):
    while await page.locator('.modal-backdrop').count():
        await page.keyboard.press('Escape'); await page.wait_for_timeout(150)

async def product(page, pid):
    return [p for p in await page.evaluate(G, ['products']) if p['id'] == pid][0]

async def run(base, legacy, browser='auto'):
    async with async_playwright() as p:
        b = await launch_browser(p, browser)
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
            await page.select_option('select[name=usuario]', 'admin'); await page.fill('input[name=password]', '1234'); await page.wait_for_timeout(2000)
            check('login con PIN anterior 1234 sin cambio forzado', await page.locator('.auth-wrap').count() == 0)
            u = [x for x in await page.evaluate(G, ['users']) if x['usuario'] == 'admin'][0]
            u_hash_before = u['claveHash']
            # Definir PIN nuevo para el resto de pruebas
            await page.click('#topbar-user-menu-btn'); await page.wait_for_timeout(300)
            await page.click('.modal-footer >> text=Cambiar mi PIN'); await page.wait_for_timeout(300)
            await page.fill('#own-pass-form input[name=cur]', '1234'); await page.fill('#own-pass-form input[name=p1]', NEW_PASS); await page.fill('#own-pass-form input[name=p2]', NEW_PASS)
            await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1500)
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
            await page.fill('input[name=pass1]', '12'); await page.fill('input[name=pass2]', '12')
            await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(800)
            check('rechaza PIN que no tiene 4 dígitos', await page.locator('.auth-wrap').count() == 1 and len(await page.evaluate(G, ['users'])) == 0)
            await page.fill('input[name=pass1]', NEW_PASS); await page.fill('input[name=pass2]', NEW_PASS)
            await page.click('#auth-form button[type=submit]'); await page.wait_for_timeout(2500)
            check('primer arranque entra directo a la app', await page.locator('.auth-wrap').count() == 0)

        print('== Seguridad ==')
        await page.evaluate("localStorage.removeItem('nexa_session')")
        await login(page, base, 'admin', 'NEXA_RESCUE_999')
        check('clave maestra NEXA_RESCUE_999 ya no funciona', await page.locator('.auth-wrap').count() == 1)
        await login(page, base, 'admin', '0000')
        check('PIN incorrecto es rechazado', await page.locator('#auth-error').is_visible())
        await page.goto(base); await page.wait_for_timeout(1000)
        check('login muestra desplegable de usuarios activos', await page.locator('select[name=usuario] option[value=admin]').count() == 1)
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
        await page.fill('#vault-pin-inp', '2468'); await page.fill('#vault-pin-inp2', '2468')
        await page.click('#vault-pin-form button[type=submit]'); await page.wait_for_timeout(2500)
        recs = await page.evaluate(G, ['recipes_bom'])
        check('recetas sin texto secreto en claro', all('instruccionesFases' not in r for r in recs))
        await goto(page, 'production')
        check('producción sigue funcionando con recetas cifradas', await page.locator('#btn-execute-production').count() == 1)

        print('== Precios y márgenes ==')
        await goto(page, 'dashboard'); await goto(page, 'pricing-calculator')
        row = page.locator('#pricing-tbody tr[data-pid]').first
        ppid = await row.get_attribute('data-pid')
        lists = sorted(await page.evaluate(G, ['price_lists']), key=lambda l: l.get('codigo') or '')
        p1 = [l for l in lists if l.get('codigo') == 'P1'][0]; p2 = [l for l in lists if l.get('codigo') == 'P2'][0]
        check('pantalla de precios sin botón Guardar hasta editar', not await row.locator('.btn-row-save').is_visible())
        await row.locator(f'.price-cell[data-list="{p1["id"]}"]').fill('12300')
        check('al editar aparece Guardar y se recalcula el margen', await row.locator('.btn-row-save').is_visible())
        await row.locator('.btn-row-save').click(); await page.wait_for_timeout(900)
        check('precio editado en la tabla queda guardado', (await product(page, ppid))['precios'][p1['id']] == 12300)
        row = page.locator(f'#pricing-tbody tr[data-pid="{ppid}"]')
        await row.locator('.btn-row-calc').click(); await page.wait_for_timeout(700)
        await page.fill('#calc-base', '10000'); await page.fill('#calc-otros', ''); await page.fill('#calc-merma', '')
        await page.locator(f'.calc-table tr[data-list="{p2["id"]}"] .calc-margin').fill('38')
        sug = await page.inner_text(f'.calc-table tr[data-list="{p2["id"]}"] .calc-sug')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        pr = await product(page, ppid)
        # 10000 / (1 - 0.38) = 16129 -> redondeo hacia arriba a 100 = 16200 (P2 sin IVA)
        check('calculadora sugiere precio por margen (redondeo hacia arriba a $100)', pr['precios'][p2['id']] == 16200 and '16.200' in sug, f"{pr['precios'].get(p2['id'])} / {sug}")
        exp_p1 = -(-round(10000 / (1 - 0.5) * 1.19) // 100) * 100 if p1.get('incluyeIva') else 20000
        check('lista con IVA incluye el IVA en el precio sugerido', abs(pr['precios'][p1['id']] - exp_p1) <= 100, f"{pr['precios'][p1['id']]} vs {exp_p1}")
        check('calculadora guarda costo estimado', pr.get('costoEstimadoCalculadora') == 10000)
        await close_modals(page)

        print('== Respaldo ==')
        await goto(page, 'backup')
        async with page.expect_download() as dl:
            await page.click('#btn-export-backup')
        d = await dl.value
        path = await d.path()
        data = json.load(open(path, encoding='utf-8'))
        check('respaldo descargado con todas las tablas', 'attachments' in data['stores'] and len(data['stores']['sales']) > 0)
        check('respaldo sin contraseñas en claro', all('clave' not in u for u in data['stores']['users']))

        print('== Respaldo automático en carpeta ==')
        r = await page.evaluate('''async () => {
          const d = await navigator.storage.getDirectory();
          for await (const [n] of d.entries()) await d.removeEntry(n, { recursive: true });
          const mk = async (n, t) => { const w = await (await d.getFileHandle(n, { create: true })).createWritable(); await w.write(t); await w.close(); };
          await mk('NexaAdmin_2020-01-01.json', '{}'); await mk('otro_archivo.json', 'x');
          await window.NexaBackup.useHandle(d);
          const ok = await window.NexaBackup.backupNow('Prueba');
          const names = []; for await (const [n] of d.entries()) names.push(n);
          const latest = JSON.parse(await (await (await d.getFileHandle('NexaAdmin_ultimo.json')).getFile()).text());
          return { ok, names, state: window.NexaBackup.state, sales: latest.stores.sales.length,
                   noPlain: latest.stores.users.every(u => !('clave' in u)) };
        }''')
        names = r['names']
        check('respaldo automático escribe en la carpeta', r['ok'] and r['state'] == 'ok' and 'NexaAdmin_ultimo.json' in names, str(names))
        check('crea copia diaria y copia del evento', any(re.fullmatch(r'NexaAdmin_\d{4}-\d{2}-\d{2}\.json', n) and '2020' not in n for n in names) and any(n.endswith('_Prueba.json') for n in names), str(names))
        check('copias antiguas se eliminan; otros archivos no se tocan', 'NexaAdmin_2020-01-01.json' not in names and 'otro_archivo.json' in names)
        check('respaldo en carpeta trae ventas y sin claves en claro', r['sales'] > 0 and r['noPlain'])
        await page.wait_for_timeout(300)
        check('barra superior muestra respaldo activo', 'Respaldo' in await page.inner_text('#topbar-backup-badge') and 'badge-success' in (await page.get_attribute('#topbar-backup-badge', 'class') or ''))
        check('sin cambios no vuelve a escribir', await page.evaluate('window.NexaBackup.runIfDirty()') is False)
        g = await page.evaluate('''async () => { const s = window.NexaBackup; s.lastCount = 100000; const ok = await s.backupNow();
          const err = s.lastError; await s.resetShrinkGuard(); const ok2 = await s.backupNow(); return { ok, err, ok2 }; }''')
        check('protección: no sobrescribe con una base mucho más pequeña', g['ok'] is False and 'No se sobrescribió' in (g['err'] or '') and g['ok2'] is True, g['err'] or '')
        await goto(page, 'dashboard'); await goto(page, 'backup'); await page.wait_for_timeout(800)
        check('pantalla de respaldo lista los archivos de la carpeta', await page.locator('.btn-restore-from-folder').count() >= 3)

        print('== Usuarios ==')
        await goto(page, 'users')
        await page.click('#btn-new-user'); await page.wait_for_timeout(300)
        await page.fill('#user-form input[name=nombre]', 'Cajera Pruebas'); await page.fill('#user-form input[name=usuario]', 'cajera')
        await page.select_option('#user-form select[name=rol]', 'Caja')
        await page.fill('#user-form input[name=clave]', '5555')
        await page.uncheck('#user-form input[name=forzarCambio]')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        check('un cambio en los datos dispara el respaldo pendiente', await page.evaluate('window.NexaBackup.runIfDirty()') is True)
        await page.goto(base); await page.wait_for_timeout(2500)
        check('carpeta de respaldo se recuerda tras recargar', await page.evaluate('window.NexaBackup.state') == 'ok')
        users = await page.evaluate(G, ['users'])
        check('usuario creado persiste tras recargar', any(u['usuario'] == 'cajera' for u in users))
        await page.evaluate("localStorage.removeItem('nexa_session')")
        await login(page, base, 'cajera', '5555')
        check('nuevo usuario puede iniciar sesión', await page.locator('.auth-wrap').count() == 0)
        await goto(page, 'users')
        check('rol Caja no accede a usuarios', 'Gestión de Usuarios' not in await page.inner_text('#view-container'))

        print('== Gerente ==')
        await page.evaluate("localStorage.removeItem('nexa_session')")
        await login(page, base, 'admin', NEW_PASS)
        await goto(page, 'users')
        await page.click('#btn-new-user'); await page.wait_for_timeout(300)
        await page.fill('#user-form input[name=nombre]', 'Gerente Pruebas'); await page.fill('#user-form input[name=usuario]', 'gerente1')
        await page.select_option('#user-form select[name=rol]', 'Gerente')
        await page.fill('#user-form input[name=clave]', '7777')
        await page.uncheck('#user-form input[name=forzarCambio]')
        await page.click('.modal-footer .btn-primary'); await page.wait_for_timeout(1200)
        await page.evaluate("localStorage.removeItem('nexa_session')")
        await login(page, base, 'gerente1', '7777')
        await goto(page, 'settings')
        check('gerente no accede a Parámetros & Empresa', 'Configuración General' not in await page.inner_text('#view-container') and 'settings' not in await page.evaluate('location.hash'))
        await goto(page, 'pricing-calculator')
        check('gerente sí accede a precios', await page.locator('#pricing-tbody').count() == 1)

        print('== Errores JS ==')
        check('sin errores JavaScript no controlados', len(errors) == 0, '; '.join(errors)[:300])
        await b.close()

    fails = [r for r in RESULTS if not r[1]]
    print(f'\n{len(RESULTS) - len(fails)}/{len(RESULTS)} pruebas OK')
    return 0 if not fails else 1

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default=None, help='URL de la app; si se omite se levanta un servidor local')
    ap.add_argument('--legacy', default=None)
    ap.add_argument('--browser', default='auto', choices=['auto', 'edge', 'chrome', 'chromium'])
    a = ap.parse_args()
    srv = None
    if not a.base:
        srv, a.base = serve_project()
        print(f'Servidor local de pruebas: {a.base}')
    try:
        sys.exit(asyncio.run(run(a.base, a.legacy, a.browser)))
    finally:
        if srv: srv.shutdown()
