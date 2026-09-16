param(
  [string]$ReportDir=''
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$RepoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
if(-not $ReportDir){$ReportDir=Join-Path $RepoRoot 'audit-output\r25-rollback-trigger-forensic'}
New-Item -ItemType Directory -Force -Path $ReportDir|Out-Null
$Out=Join-Path $ReportDir 'r25-rollback-trigger-forensic.json'

function Read-JsonSafe([string]$p){try{if(Test-Path $p){return Get-Content $p -Raw|ConvertFrom-Json}}catch{};return $null}
function Parse-Ndjson([string]$p){
  $rows=@(); if(-not(Test-Path $p)){return $rows}
  foreach($line in Get-Content $p -ErrorAction SilentlyContinue){
    if(-not $line.Trim()){continue}
    try{$rows+=($line|ConvertFrom-Json)}catch{}
  }
  return $rows
}
function To-Ms($v){
  if($null -eq $v){return 0L}
  if($v -is [int] -or $v -is [long] -or $v -is [double]){return [int64]$v}
  try{return [DateTimeOffset]::Parse([string]$v).ToUnixTimeMilliseconds()}catch{return 0L}
}
function File-Meta([string]$p){
  if(-not(Test-Path $p)){return [ordered]@{exists=$false;path=$p}}
  $i=Get-Item $p
  return [ordered]@{exists=$true;path=$p;length=if($i.PSIsContainer){0}else{[int64]$i.Length};last_write_utc=$i.LastWriteTimeUtc.ToString('o')}
}

$roaming=[Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)
$userData=Join-Path $roaming 'aram-fearless-draft'
$safetyRoot=Join-Path $userData 'update-safety-v01579'
$historyPath=Join-Path $safetyRoot 'safety-history.ndjson'
$failurePath=Join-Path $safetyRoot 'safety-failure.json'
$rollbackPath=Join-Path $safetyRoot 'last-rollback.json'
$pendingPath=Join-Path $safetyRoot 'pending-update.json'
$diagDir=Join-Path $userData 'diagnostics'

$rollback=Read-JsonSafe $rollbackPath
$failure=Read-JsonSafe $failurePath
$pending=Read-JsonSafe $pendingPath
$rollbackMs=if($rollback){[int64]$rollback.at}else{0L}
$events=Parse-Ndjson $historyPath
$windowStart=$rollbackMs-600000
$windowEnd=$rollbackMs+600000
$near=@()
foreach($e in $events){
  $ms=To-Ms $e.at
  if($rollbackMs -gt 0 -and $ms -ge $windowStart -and $ms -le $windowEnd){
    $near+=[pscustomobject]@{at=$e.at;at_ms=$ms;event=[string]$e.event;detail=$e.detail}
  }
}
$preFailures=@($near|Where-Object{$_.at_ms -le $rollbackMs -and ($_.event -eq 'SAFETY_FAILURE' -or $_.event -eq 'PROBATION_BLOCKED')})
$postFailures=@($near|Where-Object{$_.at_ms -gt $rollbackMs -and ($_.event -eq 'SAFETY_FAILURE' -or $_.event -eq 'PROBATION_BLOCKED')})
$lastPre=$preFailures|Sort-Object at_ms|Select-Object -Last 1
$lastPost=$postFailures|Sort-Object at_ms|Select-Object -Last 1

$triggerCode=''
if($lastPre){
  try{$triggerCode=[string]$lastPre.detail.code}catch{}
  if(-not $triggerCode){try{$triggerCode=[string]$lastPre.detail.detail.code}catch{}}
}
$classification='ROLLBACK_TRIGGER_UNRESOLVED'
if($rollbackMs -le 0){$classification='NO_ROLLBACK_RECORD'}
elseif($triggerCode -eq 'HNG-R001'){$classification='PRE_ROLLBACK_HNG_R001_CONFIRMED'}
elseif($triggerCode -eq 'SAFE-RT121'){$classification='PRE_ROLLBACK_SAFE_RT121_CONFIRMED'}
elseif($triggerCode){$classification='PRE_ROLLBACK_OTHER_FAILURE_CONFIRMED'}
elseif($preFailures.Count -gt 0){$classification='PRE_ROLLBACK_FAILURE_EVENT_WITHOUT_CODE'}

$diagFiles=@()
if(Test-Path $diagDir){
  Get-ChildItem $diagDir -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 30 | ForEach-Object {
    $diagFiles+=[pscustomobject]@{name=$_.Name;path=$_.FullName;last_write_utc=$_.LastWriteTimeUtc.ToString('o');length=[int64]$_.Length}
  }
}
$report=[ordered]@{
  status='SUCCESS'
  stage='R25_ROLLBACK_TRIGGER_FORENSIC'
  observed_at=(Get-Date).ToUniversalTime().ToString('o')
  read_only=$true
  classification=$classification
  rollback=$rollback
  rollback_ms=$rollbackMs
  pending_now=$pending
  failure_now=$failure
  trigger_code=$triggerCode
  pre_rollback_failures=$preFailures
  post_rollback_failures=$postFailures
  events_near_rollback=$near
  diagnostics=[ordered]@{
    dir=$diagDir
    heartbeat_main=File-Meta (Join-Path $diagDir 'heartbeat-main.json')
    heartbeat_renderer=File-Meta (Join-Path $diagDir 'heartbeat-renderer.json')
    heartbeat_main_legacy=File-Meta (Join-Path $diagDir 'heartbeat-main-v01578.json')
    heartbeat_renderer_legacy=File-Meta (Join-Path $diagDir 'heartbeat-renderer-v01578.json')
    external_hang=File-Meta (Join-Path $diagDir 'external-hang.log')
    external_hang_legacy=File-Meta (Join-Path $diagDir 'external-hang-v01578.log')
    recent_files=$diagFiles
  }
  interpretation=if($classification -eq 'PRE_ROLLBACK_HNG_R001_CONFIRMED'){'A renderer-heartbeat hang failure existed before the rollback and can explain the rollback. Compare its timestamp with the fixed preload installation timestamp; the later HNG-R001 currently on disk may be a separate post-rollback event from v0.15.135.'}elseif($classification -eq 'PRE_ROLLBACK_SAFE_RT121_CONFIRMED'){'The rollback was preceded by the Random Practice readiness safety gate, not the renderer watchdog.'}elseif($classification -eq 'PRE_ROLLBACK_OTHER_FAILURE_CONFIRMED'){'A different safety failure preceded rollback; use trigger_code and event details for the next fix.'}else{'The safety-history window does not yet identify a coded pre-rollback trigger. Inspect nearby events and diagnostics before mutating state.'}
}
$report|ConvertTo-Json -Depth 40|Set-Content $Out -Encoding UTF8
Write-Host "R25 ROLLBACK TRIGGER FORENSIC: $classification -> $Out"
