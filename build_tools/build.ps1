
$esbuildExe = "esbuild.exe"
if (-Not (Test-Path $esbuildExe)) {
    Write-Host "Descargando esbuild..."
    Invoke-WebRequest -Uri "https://registry.npmjs.org/@esbuild/win32-x64/-/win32-x64-0.19.11.tgz" -OutFile "esbuild.tgz"
    tar -xf esbuild.tgz
    Move-Item -Path "package\esbuild.exe" -Destination "esbuild.exe" -Force
    Remove-Item -Recurse -Force "package", "esbuild.tgz"
}
Write-Host "Empaquetando con esbuild..."
.\esbuild.exe ../js/app.js --bundle --outfile=../js/bundle.js --format=iife
Write-Host "Bundle.js actualizado."

