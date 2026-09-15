$data = Get-Content "Backup json\NexaERP_Sync_Juan Pablo (Gerente General)_2026-09-15T15-56-46-209Z.json" -Raw | ConvertFrom-Json
foreach ($prop in $data.stores.psobject.properties) {
    Write-Host "$($prop.Name): $($prop.Value.Count)"
}

