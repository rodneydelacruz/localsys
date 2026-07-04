param(
  [ValidateSet('production', 'staging')]
  [string]$Env = 'production'
)

Write-Host "Building for $Env..."
npm run build -- --mode $Env

Write-Host "Copying to pb_public..."
Copy-Item -Path "dist\*" -Destination "pb_public\" -Recurse -Force

Write-Host "Done! Restart PocketBase to pick up changes."
