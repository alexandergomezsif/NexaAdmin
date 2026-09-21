@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo =========================================================
echo        SUBIENDO CAMBIOS DE NEXAADMIN A GITHUB
echo =========================================================
echo.

:: 1. Empaquetar bundle con esbuild si existe
echo [1/3] Verificando y compilando codigo fuente (bundle.js)...
if exist "build_tools\esbuild.exe" (
    build_tools\esbuild.exe js/app.js --bundle --outfile=js/bundle.js --format=iife
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [ERROR] Error critico al compilar bundle.js. Revisa los errores de Javascript arriba.
        pause
        exit /b 1
    )
    echo [OK] Bundle.js actualizado correctamente.
) else (
    echo [AVISO] build_tools\esbuild.exe no encontrado, saltando compilacion.
)

echo.
:: 2. Agregar archivos y hacer commit
echo [2/3] Preparando cambios para Git...
git status -s
git add .

set "commitMsg=Actualizacion de NexaAdmin"
set "userMsg="
set /p "userMsg=Escribe un mensaje para los cambios (o presiona Enter para usar mensaje por defecto): "
if defined userMsg set "commitMsg=%userMsg%"

echo Guardando commit: "%commitMsg%"...
git commit -m "%commitMsg%"

echo.
:: 3. Subir al repositorio remoto
echo [3/3] Sincronizando con GitHub (origin main)...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ---------------------------------------------------------
    echo  [AVISO] El envio directo fue rechazado.
    echo  Intentando traer cambios remotos con git pull --rebase...
    echo ---------------------------------------------------------
    git pull --rebase origin main
    git push origin main
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ---------------------------------------------------------
        echo  [AVISO] Aplicando sincronizacion forzada a GitHub...
        echo ---------------------------------------------------------
        git push --force origin main
    )
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo =========================================================
    echo     [EXITO] TODOS LOS CAMBIOS FUERON SUBIDOS A GITHUB!
    echo =========================================================
) else (
    echo.
    echo =========================================================
    echo     [ALERTA] Hubo un inconveniente al conectar con GitHub.
    echo     Verifica tu conexion a internet o permisos de cuenta.
    echo =========================================================
)

echo.
pause
