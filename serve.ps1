# Nexa ERP - Servidor Web Local Estático (PowerShell / .NET)
param([int]$Port = 8080)

$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

Write-Host "⚡ Nexa ERP Servidor Local ejecutándose en: http://localhost:$Port/ y http://127.0.0.1:$Port/"
Write-Host "Presione Ctrl+C para detener."

$mimeTypes = @{
    ".html" = "text/html"
    ".htm"  = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".mjs"  = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($urlPath)) {
            $urlPath = "index.html"
        }

        $urlPath = [System.Uri]::UnescapeDataString($urlPath)
        $filePath = Join-Path $root $urlPath

        try {
            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $mime
                $response.SendChunked = $true
                $response.AddHeader("Access-Control-Allow-Origin", "*")
                $response.AddHeader("Cache-Control", "no-cache")
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $response.SendChunked = $true
                $buf = [System.Text.Encoding]::UTF8.GetBytes("404 - Archivo no encontrado")
                $response.OutputStream.Write($buf, 0, $buf.Length)
            }
        } catch {
            Write-Warning "Error sirviendo $urlPath : $($_.Exception.Message)"
        } finally {
            try { $response.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}
