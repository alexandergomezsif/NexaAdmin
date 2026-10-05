# NexaAdmin ERP / POS

ERP y punto de venta para pymes colombianas. JavaScript puro, sin servidor: los datos viven en **IndexedDB del navegador** del equipo donde se usa.

## Uso
Abra `index.html` en Chrome, Edge o Brave (también funciona servido por HTTPS).
El primer arranque en un navegador sin datos pide crear el usuario administrador.

> Los datos NO se sincronizan entre equipos ni navegadores. Opere con un solo equipo y descargue respaldos (Configuración → Respaldo BD).

## Desarrollo
- Código fuente: `js/` (módulos ES). **No edite `js/bundle.js`**: se genera.
- Compilar: `build.bat` (usa `build_tools/esbuild.exe`).
- Subir a GitHub: `subir_github.bat` (compila, confirma, `pull --rebase`, `push`; nunca fuerza).

### Arquitectura
| Capa | Archivos |
|---|---|
| Persistencia | `services/db-service.js` (IndexedDB v3, `runTransaction`, consecutivos) |
| Migraciones | `services/migrations.js` (idempotentes, nunca sobrescriben datos) |
| Reglas de negocio | `services/sales-service.js`, `purchase-service.js`, `production-service.js`, `payments-service.js`, `expense-service.js`, `kardex-service.js`, `cash-service.js`, `finance-service.js`, `pricing-service.js`, `tax-service.js` |
| Seguridad | `services/auth-service.js`, `utils/crypto.js` |
| Interfaz | `modules/*.js`, `components/*.js` |

Regla: los módulos de interfaz no escriben en varias tablas por su cuenta; usan un servicio que lo hace en una sola transacción.

### Pruebas
```
pip install playwright && python -m playwright install chromium
python -m http.server 8765          # desde la carpeta que contiene NexaAdmin/
python NexaAdmin/tests/e2e_nexa.py
```

## Seguridad (modelo realista)
- Contraseñas con hash PBKDF2; sin claves maestras. Recuperación con código de un solo uso.
- El control de acceso por roles es de la aplicación: quien tenga acceso físico al equipo y conocimientos técnicos puede leer IndexedDB. Proteja el equipo con su propia contraseña de Windows.
- La Bóveda cifra el texto de las recetas (AES-GCM). Las cantidades de insumos no se cifran porque Producción las necesita.
- Los documentos impresos son internos: **no son factura electrónica**.
