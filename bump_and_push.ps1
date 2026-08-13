$versionFile = "frontend\src\version.json"

# Read version
$json = Get-Content $versionFile | ConvertFrom-Json
$versionParts = $json.version.Split(".")

# Increment patch version
$patch = [int]$versionParts[2] + 1
$newVersion = "$($versionParts[0]).$($versionParts[1]).$patch"
$json.version = $newVersion

# Save back
$json | ConvertTo-Json -Depth 10 | Set-Content $versionFile

Write-Host "[+] Version bumped to v$newVersion" -ForegroundColor Green

# Git push
git add .
git commit -m "Auto-Update: v$newVersion"
git push origin main

Write-Host "[+] Successfully pushed v$newVersion to GitHub!" -ForegroundColor Green
