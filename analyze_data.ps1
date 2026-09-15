$data = Get-Content "Backup json\NexaERP_Sync_Juan Pablo (Gerente General)_2026-09-15T15-56-46-209Z.json" -Raw | ConvertFrom-Json

Write-Host "--- VENTAS ---"
$data.stores.sales | ForEach-Object { Write-Host "$($_.id) - Total: $($_.total) - Estado: $($_.estado) - Fecha: $($_.fecha)" }

Write-Host "--- GASTOS ---"
$data.stores.expenses | ForEach-Object { Write-Host "$($_.id) - Valor: $($_.valor) - Categoria: $($_.categoria)" }

Write-Host "--- CXC ---"
$data.stores.receivables_cxc | ForEach-Object { Write-Host "$($_.id) - Saldo: $($_.saldoPendiente) - Total: $($_.montoOriginal) - Estado: $($_.estado)" }

Write-Host "--- CXP ---"
$data.stores.payables_cxp | ForEach-Object { Write-Host "$($_.id) - Saldo: $($_.saldoPendiente) - Total: $($_.montoOriginal) - Estado: $($_.estado)" }

Write-Host "--- PRODUCTOS ---"
$totalInv = 0
$data.stores.products | ForEach-Object { 
    $val = $_.costoPromedio * $_.stock
    $totalInv += $val
}
Write-Host "Valor Total Inventario Estimado: $totalInv"

