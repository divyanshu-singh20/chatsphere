param(
  [string]$Port = "5000",
  [string]$Dialect = "sqlite",
  [switch]$KeepBackup
)

$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot
$dbPath = Join-Path $root "chatsphere.sqlite"
$backupPath = Join-Path $root ("chatsphere.sqlite.bak.{0}" -f (Get-Date -Format "yyyyMMddHHmmss"))

Write-Host "[reset-dev] stopping process on port $Port ..."
Get-NetTCPConnection -LocalPort ([int]$Port) | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

if (Test-Path $dbPath) {
  if ($KeepBackup) {
    Copy-Item $dbPath $backupPath -Force
    Write-Host "[reset-dev] backup created: $backupPath"
  }
  Remove-Item $dbPath -Force
  Write-Host "[reset-dev] removed: $dbPath"
}

$env:PORT = $Port
$env:DB_DIALECT = $Dialect

Write-Host "[reset-dev] starting server with PORT=$Port DB_DIALECT=$Dialect ..."
npm run dev
