$ProgressPreference = 'SilentlyContinue'
Write-Host "Descargando esbuild..."
Invoke-WebRequest -Uri "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.20.2.tgz" -OutFile "esbuild.tgz"
Write-Host "Extrayendo esbuild..."
tar -xf esbuild.tgz
$esbuildExe = "package\esbuild.exe"

Write-Host "Empaquetando la aplicacion..."
& $esbuildExe js/app.js --bundle --outfile=js/bundle.js --format=iife --minify

Write-Host "Limpiando archivos temporales..."
Remove-Item -Path "esbuild.tgz" -Force
Remove-Item -Path "package" -Recurse -Force

Write-Host "Actualizando index.html..."
$indexHtml = Get-Content index.html -Raw -Encoding UTF8
$indexHtml = $indexHtml -replace '<script type="module" src="js/app.js"></script>', '<script src="js/bundle.js"></script>'
Set-Content -Path index.html -Value $indexHtml -Encoding UTF8

Write-Host "¡Construcción completada!"

