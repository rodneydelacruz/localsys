param(
  [Parameter(Mandatory)]
  [string]$ArtifactZip
)

$ErrorActionPreference = "Stop"
$ProdPublic = "D:\BARANGAYCC\prod\barangay-system\pb_public"
$TempDir = Join-Path $env:TEMP "barangay-deploy-$(Get-Random)"

try {
  Write-Host "Extracting artifact..."
  Expand-Archive -Path $ArtifactZip -DestinationPath $TempDir -Force

  Write-Host "Copying to $ProdPublic ..."
  Copy-Item -Path "$TempDir\*" -Destination "$ProdPublic" -Recurse -Force

  Write-Host "Restarting PocketBase..."
  Restart-Service -Name PocketBase -Force

  Start-Sleep -Seconds 5
  $response = Invoke-RestMethod -Uri "http://localhost:8090/api/health" -ErrorAction Stop
  if ($response.code -eq 200) {
    Write-Host "Deploy successful. PocketBase is healthy."
  }
}
finally {
  if (Test-Path $TempDir) { Remove-Item -Path $TempDir -Recurse -Force }
}
