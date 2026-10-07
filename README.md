# NexaAdmin ERP / POS

ERP y punto de venta para pymes colombianas. JavaScript puro, sin servidor: los datos viven en **IndexedDB del navegador** del equipo donde se usa.

## Uso
Abra `index.html` en Chrome, Edge o Brave (también funciona servido por HTTPS).
El primer arranque en un navegador sin datos pide crear el usuario administrador.

> Los datos NO se sincronizan entre equipos ni navegadores. Opere con un solo equipo.

### Respaldo automático
Configuración → Respaldo BD → **Elegir carpeta de respaldo**. Desde ahí NexaAdmin guarda solo:
- `NexaAdmin_ultimo.json` (estado más reciente) y `NexaAdmin_AAAA-MM-DD.json` (una copia por día, se conservan 30 días por defecto);
- copias con nombre de evento al **cerrar caja** y **antes de restaurar**.

Se guarda cada 5 minutos si hubo cambios y al cerrar u ocultar la pestaña. Recomendado: una carpeta dentro de OneDrive o Documentos, **nunca dentro de la carpeta del programa**.
En **Brave** active antes `brave://flags/#file-system-access-api` → *Enabled* → *Relaunch*. Sin esa función se descarga un respaldo diario a Descargas.

## Desarrollo
- Código fuente: `js/` (módulos ES). **No edite `js/bundle.js`**: se genera.
- Compilar: `build.bat` (usa `build_tools/esbuild.exe`).
- Probar: `probar.bat` (doble clic; instala Playwright la primera vez y usa Edge/Chrome instalado).
- Subir a GitHub: `subir_github.bat` (compila, ofrece correr las pruebas, confirma, `pull --rebase`, `push`; nunca fuerza).

### Arquitectura
| Capa | Archivos |
|---|---|
| Persistencia | `services/db-service.js` (IndexedDB v3, `runTransaction`, consecutivos, contador de cambios) |
| Respaldo | `services/backup-folder-service.js` (carpeta del PC vía File System Access API, rotación, protección contra sobrescribir con menos datos) |
| Migraciones | `services/migrations.js` (idempotentes, nunca sobrescriben datos) |
| Reglas de negocio | `services/sales-service.js`, `purchase-service.js`, `production-service.js`, `payments-service.js`, `expense-service.js`, `kardex-service.js`, `cash-service.js`, `finance-service.js`, `pricing-service.js`, `tax-service.js` |
| Seguridad | `services/auth-service.js`, `utils/crypto.js` |
| Interfaz | `modules/*.js`, `components/*.js` |

Regla: los módulos de interfaz no escriben en varias tablas por su cuenta; usan un servicio que lo hace en una sola transacción.

### Pruebas
Doble clic en `probar.bat`, o manualmente:
```
pip install playwright
python tests/e2e_nexa.py            # levanta su propio servidor y usa Edge/Chrome
```
Las pruebas corren en un navegador temporal y aislado: no tocan los datos reales.

## Seguridad (modelo realista)
- Contraseñas con hash PBKDF2; sin claves maestras. Recuperación con código de un solo uso.
- El control de acceso por roles es de la aplicación: quien tenga acceso físico al equipo y conocimientos técnicos puede leer IndexedDB. Proteja el equipo con su propia contraseña de Windows.
- La Bóveda cifra el texto de las recetas (AES-GCM). Las cantidades de insumos no se cifran porque Producción las necesita.
- Los documentos impresos son internos: **no son factura electrónica**.
