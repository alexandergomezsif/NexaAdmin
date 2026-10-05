# Cómo pasar a la versión 3.0.0

## 1. Antes de empezar (5 minutos)
1. Abra la versión actual de NexaAdmin y descargue un respaldo: **Configuración → Respaldo BD → Descargar**.
2. En la carpeta actual del proyecto ejecute `git log -1 --oneline`. Debe mostrar `237404c`.
   Si muestra otro número, hay cambios posteriores que no están en esta entrega: deténgase y avise.

## 2. Reemplazar la carpeta
1. Renombre la carpeta actual a `NexaAdmin_ANTERIOR` (no la borre todavía).
2. Descomprima `NexaAdmin_v3.0.0.zip` en el mismo lugar.
3. Copie desde `NexaAdmin_ANTERIOR\datos\` lo que necesite conservar en su equipo (por ejemplo la firma o los respaldos). Esos archivos **ya no se suben a GitHub**.

## 3. Primer ingreso
- Abra `index.html` en el **mismo navegador** que usaba: los datos viven en ese navegador y se migran solos.
- Ingrese con su usuario y clave actuales. Si la clave es débil (por ejemplo `1234`), el sistema le pedirá una nueva.
- Al cambiar la clave del Desarrollador verá un **código de recuperación**: anótelo en papel.
- En **Configuración** revise qué listas de precios incluyen IVA (por defecto: P1 sí; P2 a P5 no).
- En la **Bóveda** defina la clave nueva (cifra el protocolo de mezcla; si se olvida, ese texto no se recupera).
- Gerente y Vendedor deberán cambiar su clave en su primer ingreso.

## 4. GitHub (una sola vez)
El historial del repositorio se reescribió para borrar datos personales, respaldos con contraseñas y la firma.
Desde la carpeta nueva:
```
git push --force origin main
```
Es el **único** caso en que se usa `--force`. Después:
- En el otro computador: borre la carpeta del proyecto y vuelva a clonar (`git clone https://github.com/alexandergomezsif/NexaAdmin.git`). No haga `pull` sobre la copia vieja.
- Recomendado: en GitHub → Settings → General → Danger Zone, cambie el repositorio a **Private**. GitHub Pages no es necesario para usar la app en local.
- Si el repositorio estuvo público, otras personas pudieron descargar copias; reescribir el historial no las borra. Las contraseñas que aparecían en el respaldo (`gerente.2026`, `Admin.2026`, etc.) no deben reutilizarse en ningún otro servicio.

## 5. Uso diario
- Compilar después de editar código: `build.bat`.
- Subir cambios: `subir_github.bat` (ya no fuerza nada).
- Un solo equipo opera el negocio; los respaldos sirven para trasladar o recuperar la información completa.
