@echo off
echo =========================================
echo  Subiendo cambios de NexaAdmin a GitHub...
echo =========================================
echo.

git status
echo.
git add .

set /p commitMsg="Escribe un mensaje para los cambios (o presiona Enter para usar mensaje por defecto): "
if "%commitMsg%"=="" set commitMsg="Actualizacion de NexaAdmin"

git commit -m "%commitMsg%"

echo.
echo Subiendo al repositorio...
git push origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ---------------------------------------------------------
    echo  [AVISO] El envio normal fue rechazado por divergencia de historial.
    echo  Aplicando sincronizacion directa para actualizar GitHub...
    echo ---------------------------------------------------------
    git push --force origin main
)

echo.
echo =========================================
echo            PROCESO FINALIZADO
echo =========================================
pause
