$data = Get-Content "Backup json\NexaERP_Sync_Juan Pablo (Gerente General)_2026-09-15T15-56-46-209Z.json" -Raw | ConvertFrom-Json
$data.stores.receivables_cxc | ConvertTo-Json
$data.stores.payables_cxp | ConvertTo-Json
$data.stores.sales | ConvertTo-Json

