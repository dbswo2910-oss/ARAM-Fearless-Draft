param(
  [string]$ReportDir=''
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$RepoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
if(-not $ReportDir){$ReportDir=Join-Path $RepoRoot 'audit-output\r24-probation-rearm'}
New-Item -ItemType Directory -Force -Path $ReportDir|Out-Null
$Out=Join-Path $ReportDir 'r24-probation-rearm.json'

function Read-JsonSafe([string]$p){try{if(Test-Path $p){return Get-Content $p -Raw|ConvertFrom-Json}}catch{};return $null}
function Save-JsonAtomic([string]$p,$obj){
  $tmp=$p+'.tmp-'+$PID
  $obj|ConvertTo-Json -Depth 30|Set-Content -Path $tmp -Encoding UTF8
  Move-Item -Force $tmp $p
}
function Read-Version([string]$dir){try{return [string]((Get-Content (Join-Path $dir 'package.json') -Raw|ConvertFrom-Json).version)}catch{return ''}}
function File-Meta([string]$p){
  if(-not(Test-Path $p)){return [ordered]@{exists=$false;path=$p}}
  $i=Get-Item $p
  return [ordered]@{exists=$true;path=$p;length=if($i.PSIsContainer){0}else{[int64]$i.Length};last_write_utc=$i.LastWriteTimeUtc.ToString('o')}
}

$local=$env:LOCALAPPDATA
$roaming=[Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)
$autoRoot=Join-Path $local 'ARAM Fearless Draft AutoUpdate'
$appDir=Join-Path $autoRoot 'appfiles'
$preloadPath=Join-Path $appDir 'preload.js'
$safetyRoot=Join-Path (Join-Path $roaming 'aram-fearless-draft') 'update-safety-v01579'
$pendingPath=Join-Path $safetyRoot 'pending-update.json'
$failurePath=Join-Path $safetyRoot 'safety-failure.json'
$lkgPath=Join-Path $safetyRoot 'last-known-good.json'
$rollbackPath=Join-Path $safetyRoot 'last-rollback.json'
$historyPath=Join-Path $safetyRoot 'safety-history.ndjson'

$version=Read-Version $appDir
$pending=Read-JsonSafe $pendingPath
$failure=Read-JsonSafe $failurePath
$lkg=Read-JsonSafe $lkgPath
$rollback=Read-JsonSafe $rollbackPath
$preloadText='';if(Test-Path $preloadPath){try{$preloadText=Get-Content $preloadPath -Raw}catch{}}
$preloadFixed=($preloadText -match "aram-fearless-draft['\"],['\"]diagnostics") -and ($preloadText -match 'heartbeat-renderer\.json')
$preloadInfo=if(Test-Path $preloadPath){Get-Item $preloadPath}else{$null}
$preloadWriteMs=if($preloadInfo){([DateTimeOffset]$preloadInfo.LastWriteTimeUtc).ToUnixTimeMilliseconds()}else{0}
$failureAt=if($failure){[int64]($failure.at|ForEach-Object{$_})}else{0}
$failureCode=if($failure){[string]$failure.code}else{''}
$staleKnownFailure=($failure -and $failureCode -eq 'HNG-R001' -and $failureAt -gt 0 -and $preloadWriteMs -gt 0 -and $failureAt -lt $preloadWriteMs)

$running=@()
try{
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    ($_.Name -ieq 'electron.exe' -and $_.CommandLine -match '(?i)ARAM Fearless Draft AutoUpdate') -or
    ($_.CommandLine -match '(?i)ARAM Fearless Draft AutoUpdate\\appfiles')
  } | ForEach-Object {$running+=[pscustomobject]@{name=$_.Name;pid=$_.ProcessId;commandLine=$_.CommandLine}}
}catch{}

$classification='BLOCKED_UNCLASSIFIED'
$reason='Guard conditions not satisfied.'
$repaired=$false

if($running.Count -gt 0){
  $classification='BLOCKED_APP_STILL_RUNNING';$reason='Close ARAM Fearless Draft completely before rearming probation.'
}elseif($version -ne '0.16.0'){
  $classification='BLOCKED_APPFILES_NOT_0160';$reason="Installed appfiles version is $version, expected 0.16.0."
}elseif(-not $preloadFixed){
  $classification='BLOCKED_FIXED_PRELOAD_NOT_INSTALLED';$reason='Installed preload.js does not contain the stable aram-fearless-draft renderer-heartbeat path fix.'
}elseif(-not $pending){
  $classification='BLOCKED_NO_PENDING_TRANSACTION';$reason='No pending v0.16.0 safety transaction exists to rearm.'
}elseif([string]$pending.state -ne 'applied' -or [string]$pending.toVersion -ne '0.16.0'){
  $classification='BLOCKED_PENDING_NOT_APPLIED_0160';$reason='Pending transaction is not an applied v0.16.0 update.'
}elseif(-not (Test-Path ([string]$pending.snapshotDir))){
  $classification='BLOCKED_ROLLBACK_SNAPSHOT_MISSING';$reason='Rollback snapshot is missing; do not alter safety state.'
}elseif($failure -and -not $staleKnownFailure){
  $classification='BLOCKED_CURRENT_OR_UNKNOWN_FAILURE';$reason="Safety failure $failureCode is not proven stale relative to the fixed preload."
}else{
  if(Test-Path $pendingPath){Copy-Item $pendingPath (Join-Path $ReportDir 'pending-update.before.json') -Force}
  if(Test-Path $failurePath){Copy-Item $failurePath (Join-Path $ReportDir 'safety-failure.before.json') -Force}
  if(Test-Path $lkgPath){Copy-Item $lkgPath (Join-Path $ReportDir 'last-known-good.before.json') -Force}
  if(Test-Path $rollbackPath){Copy-Item $rollbackPath (Join-Path $ReportDir 'last-rollback.before.json') -Force}
  if(Test-Path $historyPath){Copy-Item $historyPath (Join-Path $ReportDir 'safety-history.before.ndjson') -Force}

  $pending.bootVersion=''
  $pending.bootStartedAt=0
  $pending.cleanExitAt=0
  $pending.cleanExitVersion=''
  $pending.expectedRelaunch=$false
  Save-JsonAtomic $pendingPath $pending
  if($staleKnownFailure -and (Test-Path $failurePath)){Remove-Item $failurePath -Force}
  try{
    $evt=[ordered]@{at=(Get-Date).ToUniversalTime().ToString('o');event='MANUAL_PROBATION_REARM_R24';detail=[ordered]@{version='0.16.0';reason='stale_pre_fix_HNG-R001_cleared';preload_last_write_utc=$preloadInfo.LastWriteTimeUtc.ToString('o');prior_failure_at=$failureAt}}
    ($evt|ConvertTo-Json -Compress -Depth 10)|Add-Content -Path $historyPath -Encoding UTF8
  }catch{}
  $classification='REARMED_V0160_PROBATION'
  $reason='v0.16.0 is installed with the fixed renderer-heartbeat preload. The stale pre-fix HNG-R001 was cleared if present and boot markers were reset so the next canonical launch can run a fresh probation while preserving the rollback snapshot.'
  $repaired=$true
}

$report=[ordered]@{
  status=if($repaired){'SUCCESS'}else{'BLOCKED'}
  stage='R24_GUARDED_V0160_PROBATION_REARM'
  observed_at=(Get-Date).ToUniversalTime().ToString('o')
  classification=$classification
  reason=$reason
  repaired=$repaired
  appfiles=[ordered]@{dir=$appDir;version=$version;package=File-Meta (Join-Path $appDir 'package.json');preload=File-Meta $preloadPath;fixed_preload_detected=$preloadFixed}
  safety=[ordered]@{root=$safetyRoot;pending_before=$pending;failure_before=$failure;last_known_good=$lkg;last_rollback=$rollback;stale_known_failure=$staleKnownFailure;failure_code=$failureCode;failure_at=$failureAt;preload_write_ms=$preloadWriteMs;snapshot_exists=if($pending){Test-Path ([string]$pending.snapshotDir)}else{$false}}
  running_processes=$running
  next_step=if($repaired){'Launch the canonical launcher once, keep v0.16.0 open for at least 20 seconds, close normally, then verify last-known-good.json says 0.16.0 before any R19 rerun.'}else{'Do not mutate safety state; resolve the blocking classification first.'}
}
$report|ConvertTo-Json -Depth 30|Set-Content $Out -Encoding UTF8
Write-Host "R24 PROBATION REARM: $classification -> $Out"
