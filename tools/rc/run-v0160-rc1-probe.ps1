param(
  [Parameter(Mandatory=$true)][string]$Exe,
  [Parameter(Mandatory=$true)][string]$Report,
  [Parameter(Mandatory=$true)][string]$EvidenceDir
)
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
Remove-Item $Report -Force -ErrorAction SilentlyContinue
Remove-Item ($Report + '.trace.log') -Force -ErrorAction SilentlyContinue
$traceCopy=Join-Path $EvidenceDir 'rc1-main-trace.log'
Remove-Item $traceCopy -Force -ErrorAction SilentlyContinue
function Save-Trace {
  if(Test-Path ($Report+'.trace.log')){Copy-Item ($Report+'.trace.log') $traceCopy -Force}
}
function Kill-Tree([int]$PidToKill) {
  try { & taskkill.exe /PID $PidToKill /T /F 2>$null | Out-Null } catch {}
}
$env:ARAM_V0160_RC_REPORT=$Report
$p=Start-Process -FilePath $Exe -ArgumentList @('--aram-rc1-probe','--aram-rc1-reset-sandbox') -PassThru
$deadline=(Get-Date).AddSeconds(42)
while((Get-Date) -lt $deadline -and !(Test-Path $Report)){
  $p.Refresh()
  if($p.HasExited){break}
  Start-Sleep -Milliseconds 500
}
$p.Refresh()
Save-Trace
if(!(Test-Path $Report)){
  $trace=if(Test-Path ($Report+'.trace.log')){Get-Content ($Report+'.trace.log') -Raw}else{''}
  if(-not $p.HasExited){Kill-Tree $p.Id}
  throw "RC1 probe report missing after bounded wait. TRACE:`n$trace"
}
Copy-Item $Report (Join-Path $EvidenceDir 'rc1-probe.json') -Force
$parsed=Get-Content $Report -Raw | ConvertFrom-Json
if(-not $p.HasExited){Kill-Tree $p.Id}
if($parsed.status -ne 'SUCCESS'){throw "RC1 probe failed: $($parsed | ConvertTo-Json -Depth 8)"}
if(-not $parsed.sandbox.production_untouched){throw 'RC1 probe used production userData path'}
if(-not $parsed.renderer.diagnostics){throw 'canonical diagnostics owner inactive'}
if(-not $parsed.renderer.data){throw 'canonical DATA owner inactive'}
if($parsed.renderer.errors.Count -ne 0){throw "RC1 renderer errors: $($parsed.renderer.errors -join '; ')"}
Write-Host 'RC1 PROBE: SUCCESS'
$parsed | ConvertTo-Json -Depth 8
