# Historial de cambios — NexaAdmin

Formato: fecha · versión · resumen. El detalle técnico está en los mensajes de commit y en `docs/AUDITORIA_2026-10-05.md`.

## 2026-10-07 · v3.4.0
- **Lotes y vencimientos**: cada producción crea un lote con fecha de vencimiento (automática según la vida útil del producto). Las ventas guardan qué lote salió (primero lo más antiguo y lo que vence antes); las anulaciones y traslados devuelven el mismo lote. Inventario → Lotes: existencias por lote, alertas de vencimiento y rastreo de un lote hasta los clientes.
- **IVA por producto** (19 %, 5 % o exento): el punto de venta ya no aplica 19 % a todo.
- **Fórmulas**: el rendimiento se define en unidades del producto (antes se mezclaba con litros y producción podía descontar mal los insumos); el % se calcula sobre el tamaño de la tanda y solo para químicos; merma por insumo editable. Producción avisa si una fórmula antigua tiene el rendimiento en litros.
- **Rentabilidad por producto** en Reportes: unidades, ventas netas, costo, utilidad y margen por periodo, exportable a CSV.
- Producto: se quitó "Margen esperado" (no se usaba); se agregaron IVA y vida útil.
- Simulación de la cadena completa ampliada (17 verificaciones) e incluida en `probar.bat`.

## 2026-10-07 · v3.3.0
- **Precios y márgenes** (antes "Costos & Precios IA"): el asistente de 4 pasos se reemplazó por una tabla editable (costo, precio y margen real de cada lista P1–P5) y una calculadora de una sola ventana. Corrige que el precio guardado ignoraba el margen elegido, los costos de ejemplo inventados y el IVA fijo.
- Ajuste masivo de precios por % para una lista, con vista previa.
- Bóveda: costos de las fórmulas en $0 (leía un campo inexistente), unidades "Kg/L" erróneas y recetas de la semilla sin nombre/lote; vista compacta con ingredientes plegables.
- Catálogo, Inventario y Producción: encabezados y filtros más simples; filtro "Bajo mínimo"; resumen con valor del inventario al costo.
- El rol Gerente ya no accede a Parámetros & Empresa (solo Desarrollador).
- Menú lateral: logo de NEXA Corporación S.A.S (versión clara y oscura); se quitaron los tres puntos decorativos.
- PIN 1234 para todos los usuarios existentes (una sola vez).

## 2026-10-06 · v3.2.0
- **Respaldo automático en una carpeta del PC** (Configuración → Respaldo BD): copia cada 5 min si hubo cambios, al cerrar caja, al cerrar la pestaña y antes de restaurar; copias diarias con limpieza automática; no sobrescribe si la base actual quedó mucho más pequeña (p. ej. tras borrar datos del navegador) y ofrece restaurar desde la carpeta.
- Indicador de respaldo en la barra superior (activo / falta permiso / sin carpeta).
- En Brave: instrucciones para activar la función; mientras tanto, descarga diaria automática a Descargas.
- `probar.bat`: pruebas automáticas con un clic. `subir_github.bat` ofrece correrlas antes de subir.
- Pruebas: 71 casos (74 con migración desde la versión anterior).

## 2026-10-06 · v3.1.0
- Acceso con **PIN de 4 dígitos** y lista desplegable de usuarios activos; entra al escribir el cuarto dígito. Sin cambio forzado ni código de recuperación obligatorio (el código sigue disponible en Usuarios).
- Bóveda con PIN de 4 dígitos.
- Calculadora de costos: ahora lee el costo promedio real y el precio P1 (antes mostraba $0).
- Diseño: textos invisibles en modo claro, avisos partidos, pantallas de dos columnas en celular, foco de teclado.
- Arranque: pasos de carga visibles y aviso si otra pestaña bloquea la base de datos.
- Documento `docs/DEUDA_TECNICA_v3.1.md` con la hoja de ruta priorizada.

## 2026-10-05 · v3.0.0 — Corrección integral tras auditoría

**Importante al actualizar**
- Al abrir la nueva versión se aplican migraciones automáticas que **conservan los datos** (claves a hash, adjuntos, listas de precios, recetas).
- Las claves débiles (`1234`, `admin`, etc.) obligan a definir una nueva en el primer ingreso. Al cambiar la del Desarrollador se muestra un **código de recuperación**: anótelo en papel.
- La clave maestra `NEXA_RESCUE_999` y la clave universal `1234` **ya no existen**.
- La Bóveda pide crear una clave nueva y cifra el protocolo de mezcla de las recetas. Si se olvida esa clave, el texto cifrado no se recupera.
- La restauración de respaldos ahora **reemplaza** toda la información (antes fusionaba y corrompía datos entre equipos). Operar con un solo equipo.
- Revise en Configuración qué listas de precios **incluyen IVA** (por defecto: P1 sí, P2–P5 no).

**Integridad de datos**
- La semilla demo ya no sobrescribe datos reales al recargar.
- Ventas, compras, producción, abonos, pagos, gastos y ajustes se graban en transacciones atómicas.
- Consecutivos secuenciales por empresa (RP-000001, COT-000001, CP-, OP-, RC-, CE-, AJ-, TR-).
- Cotizaciones ya no afectan inventario, caja, cartera ni despachos.
- Kardex: salidas al costo promedio, sin recorte de stock a 0, costos con 2 decimales.
- Venta de contado exige caja abierta; crédito exige cupo asignado; doble clic bloqueado.
- Nueva anulación de ventas auditada; historial de ventas accesible desde el POS.

**Seguridad**
- Contraseñas con PBKDF2-SHA256; sesión con expiración por inactividad; bloqueo tras 5 intentos.
- Usuarios creados ya no se borran al recargar; el usuario real queda en caja, gastos, kardex y auditoría.
- Escape de HTML en vistas (protección XSS); datos personales reales retirados del código.

**Finanzas**
- Dashboard y reportes con utilidad real (ventas netas − costo − comisiones − gastos); se eliminaron cifras ficticias.
- IVA configurable por lista; comisión freelance calculada sin IVA sobre la lista base del vendedor.
- Gastos en efectivo descuentan la caja; abonos actualizan venta, cliente y caja; pagos a proveedores con historial.

**Documentos**
- Se retiró la leyenda falsa "Documento validado por DIAN" y la resolución de ejemplo. Los documentos son internos hasta integrar un proveedor tecnológico.

**Repositorio**
- `subir_github.bat` ya no hace `git push --force`.
- Respaldos, firmas y hojas de clientes fuera de Git.
- Pruebas automáticas: `tests/e2e_nexa.py`.

## 2026-09-14 · v2.6.x
Ver `historial de cambios.txt` (registro anterior).
