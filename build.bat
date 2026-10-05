@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo [BUILD] Empaquetando js/app.js -^> js/bundle.js con esbuild...
if not exist "build_tools\esbuild.exe" (
    echo [ERROR] No se encontro build_tools\esbuild.exe. Ejecuta build_tools\build.ps1 una vez para descargarlo.
    exit /b 1
)
build_tools\esbuild.exe js/app.js --bundle --outfile=js/bundle.js --format=iife --target=es2020 --log-level=warning
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Fallo la compilacion. Revisa los errores de JavaScript arriba.
    exit /b 1
)
echo [OK] js/bundle.js actualizado.
exit /b 0
