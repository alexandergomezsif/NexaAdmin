# Deuda técnica y hoja de ruta — NexaAdmin v3.1

Fecha: 2026-10-06 · Método: skill *engineering:tech-debt* (Prioridad = (Impacto + Riesgo) × (6 − Esfuerzo)), revisión visual en modo claro, oscuro y móvil, y métricas del código.

## Métricas actuales

| Indicador | Valor | Comentario |
|---|---|---|
| Módulos de interfaz | 23 archivos, ~9.800 líneas | 4 superan 700 líneas (POS, calculadora, bóveda, clientes) |
| Estilos en línea (`style="…"`) | ~600 | Dificultan el modo claro/oscuro y el diseño móvil |
| Colores fijos en JS | 112 | Deberían ser variables CSS |
| Pruebas automáticas | 64 casos e2e | Cubren dinero, inventario, acceso y migración |
| Dependencias externas | 0 (solo esbuild para compilar) | Bajo riesgo |

## Ya corregido en v3.1

| Tipo | Cambio |
|---|---|
| Funcionalidad | Acceso con PIN de 4 dígitos y lista desplegable de usuarios activos |
| Funcionalidad | La calculadora de costos leía campos inexistentes y mostraba $0 en todo; ahora usa el costo promedio real y el precio P1 |
| Diseño | Nombre de la empresa invisible en modo claro; pie del menú lateral oscuro en modo claro |
| Diseño | Avisos con texto partido en columnas (bóveda, configuración) |
| Diseño | Pantallas de dos columnas que se cortaban en el celular (Configuración, Dashboard y otras) |
| Diseño | Foco visible para teclado y botones deshabilitados distinguibles |
| Arranque | Pasos de carga visibles y mensaje claro si otra pestaña bloquea la base de datos |
| Infraestructura (v3.2) | Ítem 1 resuelto: respaldo automático en carpeta del PC |
| Pruebas (v3.2) | Ítem 2 resuelto: `probar.bat` |

## Deuda pendiente priorizada

| # | Ítem | Tipo | Impacto | Riesgo | Esfuerzo | Prioridad | Justificación |
|---|---|---|---|---|---|---|---|
| 1 | ~~Respaldo automático en una carpeta del PC (File System Access API)~~ **Hecho v3.2** | Infraestructura | 5 | 5 | 2 | **40** | Hoy los datos viven solo en el navegador; borrar el historial o formatear el PC los pierde. En Brave requiere activar `brave://flags/#file-system-access-api` (Chrome y Edge lo traen activo) |
| 2 | ~~Pruebas e2e ejecutables con un solo clic (`probar.bat`)~~ **Hecho v3.2** | Pruebas | 3 | 4 | 1 | **35** | Evita que una IA o un cambio rompa ventas sin que nadie lo note |
| 3 | Sistema de diseño: mover estilos en línea y colores a clases y variables CSS | Código / Diseño | 4 | 3 | 3 | **21** | Consistencia visual y menos errores en modo claro/oscuro |
| 4 | Dividir módulos grandes (POS, calculadora, bóveda, clientes) en vista + controlador | Arquitectura | 3 | 3 | 3 | **18** | Archivos de 700–1.000 líneas son difíciles de mantener por personas e IA |
| 5 | Consultas por índice/fecha en dashboard y reportes (hoy leen tablas completas) | Rendimiento | 2 | 3 | 2 | **20** | Se volverá lento con miles de ventas |
| 6 | Stock por bodega real | Arquitectura | 3 | 2 | 4 | **10** | Hoy una sola existencia por producto |
| 7 | Integración de facturación electrónica DIAN | Funcionalidad / Legal | 5 | 4 | 5 | **9** | Requiere proveedor tecnológico autorizado y presupuesto |
| 8 | Backend (Supabase/Firebase) para varios equipos | Arquitectura | 4 | 3 | 5 | **7** | Solo cuando se necesite operar en más de un equipo |

## Plan por fases (compatible con trabajo diario)

1. ~~**Inmediato (1 sesión):** ítems 1 y 2.~~ Hecho en v3.2.
2. **Corto plazo (2–3 sesiones):** ítem 3 por módulo, empezando por POS y Dashboard; ítem 5.
3. **Mediano plazo:** ítem 4 al tocar cada módulo grande (refactor oportunista, con pruebas).
4. **Cuando el negocio lo exija:** ítems 6, 7 y 8.
