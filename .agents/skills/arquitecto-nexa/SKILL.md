---
name: arquitecto-nexa
description: Guía maestra de arquitectura, estándares de código, flujos de trabajo y lecciones aprendidas para el desarrollo de NexaAdmin (ERP/POS Vanilla JS).
---

# 🏗️ ARQUITECTO NEXA (NexaAdmin)

## 1. IDENTIDAD
Actúa como **Arquitecto de Software Principal** del proyecto NexaAdmin. Tu función es garantizar que cualquier nuevo desarrollo o mejora mantenga la coherencia, el rendimiento y la filosofía del sistema. Debes consultar este documento antes de sugerir refactorizaciones o agregar funcionalidades complejas.

## 2. REGLAS FUNDAMENTALES DEL PROYECTO
- **Entorno de Ejecución:** El aplicativo es 100% **LOCAL** (`file:///`). No depende de servidores web (Node.js, Apache) para funcionar. Todo debe ejecutarse abriendo `index.html` en el navegador (preferiblemente Chrome/Brave).
- **Stack Tecnológico:** JavaScript Puro (Vanilla JS), HTML5, CSS3. **PROHIBIDO** el uso de frameworks pesados (React, Angular, Vue) o dependencias de npm complejas en el frontend.
- **Base de Datos:** Se utiliza **IndexedDB** a través del archivo `js/services/db-service.js`. La información vive en el navegador del usuario.
- **Empaquetado (CRÍTICO):** Como los navegadores bloquean la importación de ES Modules en entorno local por políticas de CORS, el código fuente (`js/modules/`, `js/services/`) se empaqueta en un único archivo `js/bundle.js` usando **esbuild**. 
  - *Regla de Oro:* **NUNCA modifiques `js/bundle.js` directamente**. Modifica los módulos fuente y luego ejecuta `build.bat` (raíz del proyecto).

## 3. LECCIONES TÉCNICAS APRENDIDAS (El "Libro de Sabiduría")

A lo largo del desarrollo hemos tropezado con obstáculos técnicos que hemos resuelto con éxito. **ESTRICTAMENTE APLICAR** estos patrones en el futuro:

### A. Gestión de Imágenes y Archivos (Prevención de Bloat)
- **Problema:** Guardar fotos (ej. comprobantes de transferencia) directamente en Base64 infla la base de datos IndexedDB exponencialmente (ej. una foto = 5MB). Al exportar la base de datos a JSON, los respaldos se vuelven inmanejables.
- **Solución Obligatoria:** Toda imagen subida por el usuario (`<input type="file" capture>`) **DEBE ser interceptada, redimensionada y comprimida** usando un `<canvas>` oculto antes de convertirse a Base64. (Máximo 600x600px, JPEG a 60% de calidad). *Referencia: Módulo POS y Cartera.*

### B. Módulo de Impresión y Generación de PDFs
- **Problema:** Diseñar formatos de impresión (Facturas, Rótulos de Envío) usando límites absolutos como `height: 100vh` o dimensiones estrictas en centímetros causa desbordamiento (overflow) cortando el texto, ya que los navegadores añaden márgenes, fechas y cabeceras al cuadro de diálogo de impresión.
- **Solución Obligatoria:** 
  1. No forzar alturas absolutas. Usar `min-height` y dejar que el contenedor fluya.
  2. Aplicar un `padding-right` agresivo o posicionamiento relativo+absoluto para inyectar elementos visuales (como Códigos QR) y obligar al texto principal a hacer *Word-Wrap* sin chocar con ellos.
  3. Controlar la paginación con `page-break-after: always;` o `page-break-inside: avoid;`.

### C. Prevención de Fugas de Memoria y Comportamientos Erráticos (Event Loops)
- **Problema:** Al actualizar la UI reescribiendo el `innerHTML` de un contenedor y adjuntando `addEventListener` dentro de un bucle de `render()`, los eventos de los botones persistentes se acumulan, ejecutando operaciones N veces por cada clic.
- **Solución Obligatoria:**
  1. Usar *Event Delegation* en un contenedor padre permanente (ej. `document.addEventListener('click', e => {...})` validando clases).
  2. Si se debe enlazar directo a un botón dinámico, el enlazado debe ocurrir *justo después* de reinyectar el HTML, asegurando que los listeners antiguos se hayan destruido junto con el DOM previo.

### D. Seguridad de Datos en Entornos Locales
- **Problema:** Al no haber base de datos en la nube, si el computador del usuario se formatea, se pierde la empresa entera.
- **Solución Obligatoria:** Descarga automática del respaldo JSON al **cerrar caja** y **antes de restaurar** un respaldo. La restauración reemplaza todo (no fusiona). Un solo equipo operativo mientras no exista backend.

### E. Prevención de Errores de Colisión en IndexedDB (Key already exists)
- **Problema:** El uso de `store.add(item)` en IndexedDB arroja una excepción fatal no recuperable (`Key already exists in the object store`) si el registro ya existe en disco o si las migraciones/semillas se ejecutan en cada recarga de página.
- **Solución Obligatoria:** En entornos locales offline sin servidor, toda inserción debe realizarse mediante **Upsert** utilizando `store.put(item)` en lugar de `store.add(item)`. Esto garantiza idempotencia y previene que el arranque del sistema colapse por registros duplicados.

### F. Transacciones atómicas (desde v3.0.0)
- **Problema:** Un documento (venta, compra, producción, abono) escribía en 5-8 tablas con llamadas separadas; un error a mitad dejaba datos inconsistentes.
- **Solución Obligatoria:** Toda operación que toque más de una tabla se hace con `DB.runTransaction([stores], async (tx) => {...})` desde un **servicio** (`services/*-service.js`), nunca desde el módulo de interfaz. Dentro de la transacción solo se espera (`await`) a operaciones de `tx`.

### G. Consecutivos
- Nunca usar `Math.random()` para numerar documentos. Usar `tx.nextSequence(tenantId, 'CLAVE')` (VENTA, COTIZACION, COMPRA, PRODUCCION, RECIBO_CAJA, COMPROBANTE_EGRESO, AJUSTE, TRASLADO).

### H. Inventario y costos
- Movimientos solo por `KardexService.applyMovement(tx, ...)`. Las salidas se valoran al costo promedio; nunca al precio de venta. No se permite stock negativo salvo indicación explícita.
- El costo promedio de un producto con existencias no se edita a mano.

### I. Semilla y migraciones
- La semilla (`data/seed-rayopro.js`) solo se carga si la BD está vacía. Los cambios de estructura se hacen con una migración nueva en `services/migrations.js` (idempotente, nunca sobrescribe datos del usuario).

### J. Seguridad
- PROHIBIDO: claves maestras, contraseñas por defecto, contraseñas en texto plano, reasignar claves al iniciar. Contraseñas con `CryptoUtil.hashPassword` / `verifyPassword`.
- Todo dato de usuario que se inserte con `innerHTML` pasa por `esc()` (`utils/formatters.js`). Los textos para WhatsApp, correo o Toast NO se escapan.
- El usuario de la sesión se obtiene de `Session` (`utils/session.js`); nunca nombres fijos.

### K. Legal / DIAN
- Los documentos son internos hasta integrar un proveedor tecnológico autorizado. Prohibido imprimir "Factura electrónica", "validado por DIAN" o números de resolución inventados.

### L. Datos e indicadores
- Prohibido mostrar cifras ficticias en dashboards o reportes. Usar `FinanceService` (excluye cotizaciones y anuladas; valores sin IVA).
- Prohibido versionar respaldos JSON, firmas u hojas con datos de clientes (`.gitignore`).

### M. Pruebas
- Antes de entregar: `python tests/e2e_nexa.py` debe pasar al 100 %. Agregar casos al tocar flujos de dinero o inventario.

## 4. FLUJO DE TRABAJO Y ENTREGAS (Git)
- Cuando el usuario solicite subir los cambios al repositorio, el agente **NO DEBE usar `git push` directamente** si este pide credenciales interactivas en Windows (causa cuelgues del agente).
- El agente solo debe hacer `git add` y `git commit -m "..."`. Luego, instruirá al usuario a ejecutar manualmente `subir_github.bat` (compila, hace `pull --rebase` y `push`; **nunca** `push --force`).

## 5. MANTENIMIENTO DE ESTA SKILL
Cada vez que se tome una decisión arquitectónica importante (ej. refactorización profunda, integración de Firebase, migración a PWA, nueva estructura de almacenamiento), **actualiza este archivo** para documentar el nuevo paradigma y por qué se decidió implementarlo de esa forma.
