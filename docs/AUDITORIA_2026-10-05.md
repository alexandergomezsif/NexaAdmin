# Auditoría técnica y plan de corrección — NexaAdmin (Rayo Pro)

> **Estado:** las fases 0 a 5 se implementaron en la versión 3.0.0 (ver `CHANGELOG.md`). Este documento conserva el diagnóstico original.

**Fecha:** 2026-10-05 · **Versión auditada:** commit `237404c` (v2.6.2-pwa) · **Alcance:** todo el código fuente (`js/`, `css/`, `index.html`, `service-worker.js`), scripts de build/deploy, archivos versionados en Git.

## 0. Cómo se hizo esta auditoría

| Método | Qué se hizo |
|---|---|
| Lectura de código | Servicios (`db`, `auth`, `tenant`, `cash`, `kardex`, `production`, `tax`, `audit`), `app.js`, POS completo, caja, CxC, CxP, compras, inventario, producción, usuarios, respaldo, bóveda; muestreo dirigido del resto. |
| Pruebas en navegador real | Se ejecutó la app en Chromium (headless) con el `bundle.js` tal como está en el repo: login, recorrido de los 23 módulos y flujos de venta, usuarios y semilla. |
| Revisión de Git | Historial (53 commits), archivos versionados, scripts `subir_github.bat` y `build.ps1`. |

Los hallazgos marcados **[VERIFICADO]** se reprodujeron en el navegador. Los demás provienen de lectura del código. No pude comprobar si el repositorio de GitHub es público ni si GitHub Pages está activo (sin acceso de red a GitHub desde este entorno).

**Resultado general:** la interfaz carga sin errores en los 23 módulos y el diseño es sólido. Los problemas están en la **integridad de los datos** (stock, ventas, caja, usuarios), en la **seguridad del acceso** y en **textos con implicaciones legales**. Hoy el sistema **no debería usarse para operar dinero real** sin corregir la Fase 1.

---

## 1. Hallazgos críticos (pérdida o corrupción de datos)

| # | Hallazgo | Evidencia | Impacto |
|---|---|---|---|
| C1 | **La semilla demo sobrescribe datos reales.** Si el producto con SKU `DESENG-1L` no existe (renombrado o borrado), al recargar se re-ejecuta toda la semilla con `put`, sobrescribiendo productos, clientes, ventas, turnos, etc. con los valores demo. | `tenant-service.js` → `init()`. **[VERIFICADO]**: stock de un producto cambiado a 999 volvió a 45 tras renombrar el SKU. | Pérdida silenciosa de inventario, saldos y ventas. |
| C2 | **Cada arranque reinicia usuarios.** `AuthService.init()` fuerza clave `1234` a admin/gerente/vendedor y **borra cualquier otro usuario**. El módulo Usuarios es inútil: lo que se crea o cambia desaparece al recargar. | `auth-service.js` líneas 85–117. **[VERIFICADO]**: usuario nuevo eliminado y clave del gerente revertida a `1234`. | Control de acceso inexistente en la práctica. |
| C3 | **Las cotizaciones descuentan inventario**, se marcan `PAGADA`, suman a la caja y generan orden de despacho. | `sales-pos.js` → `onConfirm`. **[VERIFICADO]**: cotización bajó stock 144→143, estado `PAGADA`. | Inventario y ventas inflados/erróneos. |
| C4 | **El Kardex registra las salidas por venta al precio de venta, no al costo.** | `sales-pos.js` L941–950 (`costoUnitario: item.precioUnitario`). **[VERIFICADO]**: costo registrado $18.000 vs costo promedio $8.500. | Costo de ventas y valorización del Kardex incorrectos. |
| C5 | **Consecutivos aleatorios** (`'RP-' + random 5 dígitos`) en ventas, órdenes de producción y traslados. | `sales-pos.js` L835, `production-service.js`, `inventory.js`. | Colisiones posibles; numeración no consecutiva (inválida para cualquier documento soporte). |
| C6 | **El stock se “recorta” a 0** (`Math.max(0, …)`) y el POS no revalida existencias al confirmar ni cuando se digita la cantidad. | `kardex-service.js`, `sales-pos.js`. | Sobreventa invisible; el Kardex deja de cuadrar. |
| C7 | **Ventas sin caja abierta** en efectivo se guardan pero no entran a ningún turno. | `sales-pos.js` L954. | Arqueos descuadrados. |
| C8 | **Doble clic = venta duplicada.** No hay bloqueo del botón ni transacción atómica; una falla a mitad deja venta sin Kardex o sin CxC. | `sales-pos.js`, `db-service.js` (una transacción por escritura). | Duplicados e inconsistencias. |
| C9 | **No existe anulación ni devolución de ventas** (nota crédito). El historial de ventas del POS está programado pero **no hay botón que lo abra**. | `#btn-view-sales-history` no existe en el HTML. | Un error de facturación no se puede corregir sin editar la BD. |
| C10 | **Sincronización por JSON sobrescribe en lugar de fusionar.** La restauración hace `put` de todo: el último archivo cargado gana en stock, saldos de clientes y turnos; lo borrado en un equipo reaparece. | `db-service.js` → `restoreBackup`. | Con dos terminales, el inventario y la cartera se corrompen. |

## 2. Seguridad y acceso

| # | Hallazgo | Detalle |
|---|---|---|
| S1 | **Contraseñas universales.** `1234` funciona para cualquier usuario con clave; para el desarrollador además `admin`, `Nexa.2026`, `Admin.2026`. **[VERIFICADO]** |
| S2 | **Clave maestra `NEXA_RESCUE_999`** entra como cualquier usuario y abre la Bóveda. Está en el código, en el historial de Git y en `CREDENCIALES.md`. **[VERIFICADO]** |
| S3 | **Escalada a Desarrollador editando `localStorage`** (`nexa_active_user = usr_dev`). **[VERIFICADO]** |
| S4 | **Contraseñas en texto plano** en IndexedDB y en cada respaldo JSON (el respaldo versionado en Git contiene `gerente.2026`, `Admin.2026`, `carlos.2026`). |
| S5 | **La “Bóveda de fórmulas” no cifra nada.** PIN por defecto `1234` en `localStorage`; las recetas viven en texto plano en IndexedDB y en los respaldos. |
| S6 | **XSS:** `escapeHTML` existe pero no se usa en ningún lugar; nombres de clientes/productos importados por CSV o JSON se inyectan con `innerHTML`. Un respaldo manipulado puede ejecutar código. |
| S7 | **Datos sensibles versionados en Git:** respaldo JSON con datos de clientes (nombres, NIT, teléfonos) y claves, `firma juan.jpg` (firma manuscrita), `Cliente cano trucks.xlsx`. Si el repo es público, esto está expuesto (y aplica la Ley 1581 de 2012 de protección de datos personales). |
| S8 | **`subir_github.bat` hace `git add .` y, si el push falla, `git push --force`.** Trabajando desde dos computadores, esto puede **borrar commits del otro equipo** en GitHub. |

**Supuesto importante a explicitar:** en una app 100 % local en el navegador, *ningún* control de acceso es inviolable: quien tenga el equipo y conocimientos puede abrir las herramientas del navegador. La meta realista es: (a) que el control funcione para el uso normal, (b) que no haya puertas traseras, (c) que los secretos (recetas, claves) estén cifrados y no viajen en claro en los respaldos. La protección de la “propiedad intelectual” frente al Gerente basada en roles es solo de interfaz.

## 3. Finanzas, caja y cartera

| # | Hallazgo | Detalle |
|---|---|---|
| F1 | **“Utilidad estimada” ficticia:** `ventas × 0,45 − gastos`, con `Math.max(0, …)` que oculta pérdidas. Las ventas incluyen IVA y cotizaciones. | `dashboard.js` L64, `reports.js` L219. |
| F2 | **IVA sumado encima de las listas de precios.** Si P1 es “Precio Público”, el Estatuto del Consumidor (Ley 1480 de 2011, art. 26) exige informar el precio al consumidor con impuestos incluidos. **Requiere decisión de negocio** (ver preguntas). |
| F3 | **Usuarios ficticios grabados en el código:** apertura de caja como “Carlos Mario Arango”, gastos como “Carlos Mario Arango”, vendedor “Valentina Restrepo”, despachos “Mateo Osorio”, producción “Julián Montoya”. La trazabilidad no refleja a la persona que inició sesión. |
| F4 | **Mensaje de cierre de caja por WhatsApp siempre en $0** en base, ventas y movimientos (usa nombres de campos que no existen). | `cash.js` → `openShiftCloseWhatsAppModal`. |
| F5 | **Gastos y caja desconectados:** un gasto “Efectivo Caja Menor” no descuenta la caja; un “GASTO” en caja no crea registro en Gastos (y no aparece en reportes). |
| F6 | **Abonos de cartera no actualizan la venta** (queda `CREDITO_PENDIENTE` para siempre). Pagos de CxP no guardan método, fecha ni afectan caja; pago de comisiones freelance igual. |
| F7 | **Cupo de crédito 0 = crédito ilimitado.** |
| F8 | **Compras de contado no afectan caja;** compra a crédito sin proveedor seleccionado lanza error a mitad del proceso (compra y Kardex ya guardados, CxP no). |
| F9 | **Comisión freelance inconsistente:** la tabla del carrito usa la lista base del vendedor, pero lo que se guarda y se paga usa siempre P3. |
| F10 | **Editar un producto permite cambiar el costo promedio a mano** y reemplaza el objeto completo (pierde `ultimoCosto` y otros campos). |
| F11 | **“Multibodega” no es real:** el stock es un único número por producto; un traslado resta y suma al mismo número. |

## 4. Aspectos legales / DIAN

| # | Hallazgo | Recomendación |
|---|---|---|
| L1 | La factura impresa dice **“⚡ Factura Electrónica”** y **“Resolución DIAN No. 18764000123456 • Documento Validado por DIAN”**, número inventado y sin transmisión a la DIAN. | **Retirar de inmediato.** La factura electrónica requiere validación previa de la DIAN a través de un proveedor tecnológico (Estatuto Tributario art. 616-1; anexo técnico vigente en la Resolución DIAN 000165 de 2023). Mientras no exista integración, el documento debe rotularse como *“Documento interno — no válido como factura”* o *remisión/cotización*. Confirmar con el contador. |
| L2 | Opción “Documento Equivalente POS”: también es hoy un documento electrónico regulado (misma resolución). | Mismo rótulo interno hasta integrar. |
| L3 | Resolución y prefijo están fijos en el código. | Tomarlos de la configuración de cada empresa. |

*Esto es información técnica, no asesoría legal; la validación final corresponde a un contador o abogado tributarista.*

## 5. Calidad de código, UX y rendimiento

| # | Hallazgo |
|---|---|
| Q1 | **Búsqueda global (Ctrl+K) rota:** `DB is not defined`. **[VERIFICADO]** |
| Q2 | **Cambiar la lista de precios en el POS no tiene efecto** (se revierte a la del cliente al re-renderizar). **[VERIFICADO]** |
| Q3 | El selector de vendedor freelance no tiene listener (el código depende de un checkbox `#pos-chk-freelance` que no existe). |
| Q4 | La edición de precio por teclado escucha la clase `pos-item-price` pero el input es `pos-item-price-input`; los botones ±100 no tienen manejador. |
| Q5 | Fugas de listeners: el POS añade un `keydown` global en cada render; `Modal` deja un listener de Escape por cada modal cerrado con botón. |
| Q6 | Las fotos de comprobantes (base64) se guardan dentro de cada venta; Dashboard, Reportes y POS cargan **todas** las ventas con sus imágenes en cada vista → se volverá lento. |
| Q7 | La pantalla de login reemplaza el `body` completo; el tema por defecto en `app.js` (`light`) contradice el `body class="dark-mode"`. |
| Q8 | Importador “CSV / Excel”: solo CSV con `;`, partido con `split` (rompe con comillas o `;` dentro de campos); no lee Excel. |
| Q9 | Nuevas empresas crean listas `plist_1_<id>`, pero POS, comisiones y freelancers usan `plist_1`/`plist_3` fijos → en una empresa nueva los precios fallan. |
| Q10 | Service Worker: versión de caché (`2.6.1`) distinta a la app (`2.6.2`) y estrategia cache-first: tras actualizar, el usuario ve la versión vieja hasta recargar dos veces. |
| Q11 | Sin pruebas automatizadas; el `bundle.js` (14 000 líneas generadas) se versiona junto al fuente y las skills de IA en `.agents/` documentan reglas que el propio código incumple (p. ej., “clave Admin.2026”). |

---

## 6. Plan de corrección por fases

Principio rector: **primero que los datos no se dañen, luego que el acceso sea real, luego que los números sean correctos, y al final la experiencia.** Cada fase termina con build, prueba automatizada en navegador y commit propio.

### Fase 0 — Higiene del repositorio (bajo riesgo, 1 sesión)
1. Sacar de Git (y añadir a `.gitignore`): `datos/Backup json/`, `datos/*.xlsx`, `datos/firma*.jpg`, `CREDENCIALES.md`. Los logos se quedan.
2. Reescribir `subir_github.bat`: compilar → `git status` → commit → `git pull --rebase` → `push`; **sin `--force`**; si hay conflicto, se detiene y avisa.
3. Si el repo es público: purgar esos archivos del historial (requiere un `push --force` **una sola vez, coordinado** con el otro computador) y cambiar las claves expuestas.
4. Añadir `docs/` con esta auditoría y un `CHANGELOG.md` que reemplace `historial de cambios.txt`.

### Fase 1 — Integridad de datos (crítica)
1. **C1** Semilla: solo se ejecuta si la BD está vacía, controlada por una bandera `system_params.seedVersion`; nunca sobrescribe registros existentes.
2. **C2** Auth: eliminar la recreación/borrado de usuarios en cada arranque; crear el usuario inicial solo la primera vez.
3. **C3** Tipos de documento: la cotización no toca stock, caja, cartera ni despacho; se guarda con estado `COTIZACION`.
4. **C4** Kardex de venta a **costo promedio**; guardar `costoUnitario` por ítem en la venta (base para utilidad real).
5. **C5** Consecutivos secuenciales por empresa y tipo de documento (contador en `system_params`, dentro de transacción).
6. **C6/C8** Validar stock al confirmar; bloquear botón; nuevo `DB.transaction([...stores], fn)` para que venta + Kardex + caja + cartera se escriban **todo o nada**.
7. **C7** Exigir turno abierto para ventas que no sean a crédito o cotización.
8. **C9** Historial de ventas accesible + **anulación** (reversa Kardex, caja, cartera, comisión; requiere motivo y queda auditada).
9. **C10** Respaldos: restaurar como *reemplazo total* con confirmación y copia previa automática; dejar de presentarlo como “sincronización” entre terminales (ver recomendación de arquitectura).

### Fase 2 — Seguridad y acceso
1. Eliminar `1234` universal, claves alternativas y `NEXA_RESCUE_999`.
2. Contraseñas con hash **PBKDF2-SHA256 + sal** (WebCrypto nativo, sin librerías). Migración automática al primer login.
3. Recuperación: **código de recuperación único** generado al configurar, que se muestra una vez y se guarda impreso; al usarse obliga a cambiar la clave y queda auditado.
4. Sesión validada contra la BD (no basta con un ID en `localStorage`) y expiración por inactividad.
5. Bóveda: recetas **cifradas con AES-GCM** derivando la llave del PIN; en el respaldo viajan cifradas; los respaldos excluyen hashes de claves (opcional).
6. Aplicar `escapeHTML` en todas las plantillas que muestran datos de usuario.

### Fase 3 — Números correctos (finanzas)
1. Utilidad real = ventas netas sin IVA − costo de ventas (desde Kardex) − gastos; mostrar pérdidas.
2. IVA según la decisión de negocio (precios con IVA incluido o no) — afecta POS, factura y reportes.
3. Usuario real de la sesión en caja, gastos, despachos y producción.
4. Unificar gastos ↔ caja; abonos CxC actualizan la venta; pagos CxP con método, fecha, historial y efecto en caja.
5. Corregir resumen de cierre por WhatsApp; cupo 0 = sin crédito; comisión con la lista base del vendedor en todos lados.
6. Compras: validar proveedor antes de escribir; contado afecta caja.
7. Costos con 2 decimales en materias primas.

### Fase 4 — Legal / documentos
1. Rótulo “Documento interno – no válido como factura electrónica” mientras no haya proveedor tecnológico; quitar “Validado por DIAN”.
2. Resolución, prefijo y rango desde Configuración por empresa; QR placeholder eliminado o configurable.

### Fase 5 — Calidad y experiencia
1. Arreglar búsqueda global, lista de precios, selector freelance, edición de precio y botones ±100.
2. Eliminar fugas de listeners (POS, Modal).
3. Mover comprobantes a un almacén `attachments` aparte (migración IndexedDB v3).
4. Listas de precio por rol (`P1…P5`) en lugar de IDs fijos para soportar varias empresas.
5. Service Worker *network-first* para `index.html`/`bundle.js` y versión única.
6. Suite de pruebas automatizadas (Playwright) con los flujos de esta auditoría, ejecutable antes de cada commit.
7. Actualizar las skills de `.agents/` para que reflejen las reglas nuevas.

### Fuera de alcance por ahora (decisión de arquitectura futura)
- **Multiterminal real:** dos computadores con IndexedDB independiente no pueden compartir inventario de forma confiable mediante archivos JSON. Opciones: (a) un solo equipo “servidor” y los demás solo consultan, (b) backend ligero (p. ej., Supabase/Firebase) cuando decidas publicarlo. Lo recomendable mientras esté en pruebas es **un solo equipo operativo**.
- Stock real por bodega.
- Integración DIAN.

## 7. Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| Datos de prueba existentes con consecutivos aleatorios o contraseñas planas. | Migraciones automáticas versionadas; antes de cada migración se descarga respaldo. |
| Cambiar IVA altera totales de ventas ya registradas. | Solo afecta ventas nuevas; las existentes conservan sus valores guardados. |
| Purga del historial de Git. | Solo si el repo es público; se coordina con el otro computador (re-clonar). |

## 8. Resumen

- La app **se ve y navega bien**, pero hoy **pierde o altera datos** en escenarios normales (semilla, usuarios, cotizaciones, sincronización) y su control de acceso tiene **puertas traseras**.
- La factura impresa contiene una **afirmación falsa de validación DIAN** que debe retirarse ya.
- Orden propuesto: **Fase 0 → 1 → 2 → 3 → 4 → 5**, con commits separados y pruebas en navegador en cada fase.
