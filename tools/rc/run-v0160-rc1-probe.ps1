param(
  [Parameter(Mandatory=$true)][string]$Exe,
  [Parameter(Mandatory=$true)][string]$Report,
  [Parameter(Mandatory=$true)][string]$EvidenceDir
)
$ErrorActionPreference='Stop'
New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
Remove-Item $Report -Force -ErrorAction SilentlyContinue
Remove-Item ($Report + '.trace.log') -Force -ErrorAction SilentlyContinue
$stdout=Join-Path $EvidenceDir 'rc1-stdout.log'
$stderr=Join-Path $EvidenceDir 'rc1-stderr.log'
Remove-Item $stdout,$stderr -Force -ErrorAction SilentlyContinue
$env:ARAM_V0160_RC_REPORT=$Report
$p=Start-Process -FilePath $Exe -ArgumentList @('--aram-rc1-probe','--aram-rc1-reset-sandbox') -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
$deadline=(Get-Date).AddSeconds(50)
while((Get-Date) -lt $deadline -and !(Test-Path $Report)){
  if($p.HasExited){break}
  Start-Sleep -Milliseconds 750
  $p.Refresh()
}
$p.Refresh()
if(!(Test-Path $Report)){
  $trace=if(Test-Path ($Report+'.trace.log')){Get-Content ($Report+'.trace.log') -Raw}else{''}
  $out=if(Test-Path $stdout){Get-Content $stdout -Raw}else{''}
  $err=if(Test-Path $stderr){Get-Content $stderr -Raw}else{''}
  if(-not $p.HasExited){Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue;Start-Sleep -Milliseconds 250}
  throw "RC1 probe report missing after bounded wait. TRACE:`n$trace`nSTDOUT:`n$out`nSTDERR:`n$err"
}
Start-Sleep -Milliseconds 500
if(-not $p.HasExited){Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue;Start-Sleep -Milliseconds 250}
$parsed=Get-Content $Report -Raw | ConvertFrom-Json
if($parsed.status -ne 'SUCCESS'){throw "RC1 probe failed: $($parsed | ConvertTo-Json -Depth 8)"}
if(-not $parsed.sandbox.production_untouched){throw 'RC1 probe used production userData path'}
if(-not $parsed.renderer.diagnostics){throw 'canonical diagnostics owner inactive'}
if(-not $parsed.renderer.data){throw 'canonical DATA owner inactive'}
if($parsed.renderer.errors.Count -ne 0){throw "RC1 renderer errors: $($parsed.renderer.errors -join '; ')"}
Write-Host "RC1 PROBE: SUCCESS"
$parsed | ConvertTo-Json -Depth 8
