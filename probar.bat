@echo off
chcp 65001 > nul
setlocal
cd /d "%~dp0"

echo =========================================================
echo          PRUEBAS AUTOMATICAS DE NEXAADMIN
echo  (navegador aislado: NO toca los datos reales de Brave)
echo =========================================================
echo.

:: 1. Buscar Python (py launcher o python en el PATH)
set "PY="
py -3 --version > nul 2>&1 && set "PY=py -3"
if not defined PY (
    python --version > nul 2>&1 && set "PY=python"
)
if not defined PY (
    echo [FALTA PYTHON] Instale Python 3 una sola vez:
    echo    - Opcion A: abra PowerShell y ejecute:  winget install -e --id Python.Python.3.12
    echo    - Opcion B: https://www.python.org/downloads/  ^(marque "Add python.exe to PATH"^)
    echo Luego cierre esta ventana y vuelva a ejecutar probar.bat
    goto :fin_error
)
echo [1/3] Python encontrado: %PY%

:: 2. Instalar Playwright la primera vez (usa Edge o Chrome ya instalados; no descarga navegadores)
%PY% -c "import playwright" > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [2/3] Instalando Playwright ^(solo la primera vez, requiere internet^)...
    %PY% -m pip install --user --disable-pip-version-check playwright
    if errorlevel 1 (
        echo [ERROR] No se pudo instalar Playwright. Revise la conexion a internet.
        goto :fin_error
    )
) else (
    echo [2/3] Playwright ya instalado.
)

:: 3. Compilar y probar
if exist "build_tools\esbuild.exe" (
    call build.bat
    if errorlevel 1 goto :fin_error
)
echo [3/3] Ejecutando pruebas ^(2 a 4 minutos^)...
echo.
%PY% tests\e2e_nexa.py %*
set "FALLO=%ERRORLEVEL%"
echo.
echo Simulacion de la cadena completa de un producto nuevo...
%PY% tests\e2e_cadena.py
if errorlevel 1 set "FALLO=1"
if not "%FALLO%"=="0" (
    echo.
    echo =========================================================
    echo  [FALLO] Algunas pruebas fallaron ^(lineas FAIL arriba^).
    echo  No suba estos cambios a GitHub hasta revisarlos.
    echo =========================================================
    goto :fin_error
)
echo.
echo =========================================================
echo  [OK] Todas las pruebas pasaron.
echo =========================================================
if not defined NEXA_NOPAUSE pause
exit /b 0

:fin_error
if not defined NEXA_NOPAUSE pause
exit /b 1
