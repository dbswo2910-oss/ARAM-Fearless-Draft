param(
  [string]$Output = "$env:USERPROFILE\Desktop\ARAM-Fearless-Draft-installed-baseline.zip"
)

$ErrorActionPreference = 'Stop'

Write-Host "Searching ARAM Fearless Draft appfiles under LOCALAPPDATA..."

$candidates = Get-ChildItem "$env:LOCALAPPDATA" -Filter main.js -Recurse -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match 'ARAM.*Fearless.*Draft' } |
  ForEach-Object {
    $version = ''
    try {
      $m = Select-String -Path $_.FullName -Pattern "const VERSION='([0-9.]+)'" -AllMatches | Select-Object -First 1
      if ($m -and $m.Matches.Count -gt 0) { $version = $m.Matches[0].Groups[1].Value }
    } catch {}
    [PSCustomObject]@{
      Main = $_.FullName
      Dir = $_.Directory.FullName
      Version = $version
      HasIndex = Test-Path (Join-Path $_.Directory.FullName 'index.html')
      HasPackage = Test-Path (Join-Path $_.Directory.FullName 'package.json')
      Modified = $_.LastWriteTime
    }
  } |
  Where-Object { $_.HasIndex -and $_.HasPackage } |
  Sort-Object @{Expression={
    try { [version]$_.Version } catch { [version]'0.0.0' }
  }; Descending=$true}, @{Expression='Modified';Descending=$true}

if (-not $candidates) {
  throw 'No ARAM Fearless Draft app directory containing main.js + index.html + package.json was found.'
}

$best = $candidates | Select-Object -First 1
Write-Host "Selected version: $($best.Version)"
Write-Host "Selected folder : $($best.Dir)"

if (Test-Path $Output) { Remove-Item $Output -Force }
Compress-Archive -Path (Join-Path $best.Dir '*') -DestinationPath $Output -CompressionLevel Optimal

Write-Host "Created: $Output"
Write-Host "Send this ZIP when an AI/coding agent needs the exact installed baseline."
