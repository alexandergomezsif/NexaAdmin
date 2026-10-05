# Historial de cambios — NexaAdmin

Formato: fecha · versión · resumen. El detalle técnico está en los mensajes de commit y en `docs/AUDITORIA_2026-10-05.md`.

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
