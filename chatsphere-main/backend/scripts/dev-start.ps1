param(
  [string]$Port = "5001",
  [string]$Dialect = "sqlite"
)

$ErrorActionPreference = "SilentlyContinue"

$portNumber = [int]$Port
Write-Host "[dev-start] ensuring port $portNumber is free ..."
Get-NetTCPConnection -LocalPort $portNumber -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
  Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
}

Get-NetTCPConnection -LocalPort $portNumber -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
  Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
}

$env:PORT = $Port
$env:DB_DIALECT = $Dialect

Write-Host "[dev-start] starting nodemon with PORT=$($env:PORT) DB_DIALECT=$($env:DB_DIALECT)"
Push-Location (Join-Path $PSScriptRoot "..")
try {
  npx --no-install nodemon index.js
} finally {
  Pop-Location
}
