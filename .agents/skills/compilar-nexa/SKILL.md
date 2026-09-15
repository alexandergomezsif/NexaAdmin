---
name: compilar-nexa
description: >-
  Usa esta skill cada vez que el usuario te pida "guardar los cambios", "subir a github", 
  "compilar el proyecto", "hacer deploy", o "hacer un push". Te enseña el orden 
  obligatorio para empaquetar el código fuente de NexaAdmin antes de subirlo.
---

# Flujo Oficial de Compilación y Sincronización de NexaAdmin

NexaAdmin es un proyecto Vanilla JS que se compila de forma nativa en un solo archivo usando esbuild (sin node/npm) para poder ejecutarse de forma 100% local (file:///) sin errores de CORS.

Como agente de IA, **NUNCA** debes modificar el archivo `js/bundle.js` directamente. Siempre debes modificar los archivos originales (en `js/modules/`, `js/services/`, etc.) y luego seguir este flujo:

## Pasos Obligatorios

1. **Compilar el código fuente:**
   Ejecuta el script de construcción local mediante el archivo batch (ya que hay políticas de restricción de PowerShell).
   Usa la herramienta de ejecución de comandos para correr:
   `.\build.bat`
   *(Alternativamente, puedes usar: `powershell -ExecutionPolicy Bypass -File build.ps1`)*

2. **Verificar el Bundle:**
   Asegúrate de que la consola reporte que `js/bundle.js` fue generado o actualizado correctamente sin errores.

3. **Registrar en Git (Commit):**
   Haz un `git status` para ver los cambios. 
   Usa `git add .` y luego haz un commit explicando claramente los cambios realizados (usa formato de conventional commits, ej: `feat: ...`, `fix: ...`).

4. **Sincronizar con GitHub (Push):**
   Ejecuta `git push origin main`.
   *Nota:* Si el push se queda bloqueado esperando credenciales interactivas, cancela la tarea e infórmale al usuario que debe ejecutar el comando `git push` manualmente en su terminal.

5. **Notificar al Usuario:**
   Infórmale al usuario que el empaquetado y la sincronización con el repositorio han terminado con éxito, y que su archivo `index.html` ya tiene la versión más reciente inyectada.
