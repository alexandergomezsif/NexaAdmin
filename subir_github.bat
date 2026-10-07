@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"

echo =========================================================
echo        SUBIR CAMBIOS DE NEXAADMIN A GITHUB (modo seguro)
echo =========================================================
echo.

:: 1. Compilar
echo [1/4] Compilando bundle.js...
call build.bat
if %ERRORLEVEL% NEQ 0 goto :fallo

:: 1b. Pruebas automaticas (recomendado antes de subir)
echo.
set "probar="
set /p "probar=Ejecutar las pruebas automaticas antes de subir? (S/N, recomendado S): "
if /I "%probar%"=="S" (
    set "NEXA_NOPAUSE=1"
    call probar.bat
    if errorlevel 1 goto :fallo
    set "NEXA_NOPAUSE="
)

:: 2. Mostrar cambios y confirmar
echo.
echo [2/4] Cambios detectados:
git status -s
echo.
echo Revisa la lista: no deben aparecer respaldos .json, firmas ni hojas de clientes.
set "continuar="
set /p "continuar=Continuar con el commit? (S/N): "
if /I not "%continuar%"=="S" goto :cancelado

git add -A
set "commitMsg=Actualizacion de NexaAdmin"
set "userMsg="
set /p "userMsg=Mensaje del commit (Enter = mensaje por defecto): "
if defined userMsg set "commitMsg=%userMsg%"
git commit -m "%commitMsg%"

:: 3. Traer cambios del otro computador ANTES de subir (nunca se fuerza el push)
echo.
echo [3/4] Sincronizando con GitHub (git pull --rebase)...
git pull --rebase origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [CONFLICTO] Hay cambios en GitHub que chocan con los tuyos.
    echo Nada se ha subido ni borrado. Resuelve el conflicto y luego ejecuta:
    echo     git rebase --continue
    echo o cancela con:
    echo     git rebase --abort
    goto :fallo
)

:: 4. Subir
echo.
echo [4/4] Subiendo a GitHub...
git push origin main
if %ERRORLEVEL% NEQ 0 goto :fallo

echo.
echo =========================================================
echo     [EXITO] Cambios subidos a GitHub.
echo =========================================================
pause
exit /b 0

:cancelado
echo Operacion cancelada. No se hizo commit.
pause
exit /b 0

:fallo
echo.
echo =========================================================
echo  [ALERTA] El proceso se detuvo. No se forzo nada en GitHub.
echo =========================================================
pause
exit /b 1
