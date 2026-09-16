param(
  [string]$ReportDir = '',
  [switch]$DryRun
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$RepoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
if(-not $ReportDir){$ReportDir=Join-Path $RepoRoot 'audit-output\r21-version-drift-rootcause'}
New-Item -ItemType Directory -Force -Path $ReportDir|Out-Null
$FinalReport=Join-Path $ReportDir 'r21-version-drift-rootcause.json'

function Save-Json([string]$Path,$Object){$Object|ConvertTo-Json -Depth 20|Set-Content -Path $Path -Encoding UTF8}
function Read-JsonSafe([string]$Path){try{if(Test-Path $Path){return Get-Content $Path -Raw|ConvertFrom-Json}}catch{};return $null}
function Read-TextTail([string]$Path,[int]$Lines=80){try{if(Test-Path $Path){return @(Get-Content $Path -Tail $Lines)}}catch{};return @()}
function Read-Version([string]$Dir){try{return [string]((Get-Content (Join-Path $Dir 'package.json') -Raw|ConvertFrom-Json).version)}catch{return ''}}
function Item-Meta([string]$Path){
  if(-not(Test-Path $Path)){return [ordered]@{exists=$false;path=$Path}}
  $i=Get-Item $Path
  return [ordered]@{exists=$true;path=$Path;length=if($i.PSIsContainer){0}else{[int64]$i.Length};last_write_utc=$i.LastWriteTimeUtc.ToString('o')}
}
function Candidate-AppDirs{
  $roots=@((Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\appfiles'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater\appfiles'))
  Get-ChildItem $env:LOCALAPPDATA -Directory -ErrorAction SilentlyContinue|Where-Object{$_.Name -like 'ARAM Fearless Draft AutoUpdate*'}|ForEach-Object{$roots+=(Join-Path $_.FullName 'appfiles')}
  $rows=@();foreach($r in ($roots|Select-Object -Unique)){
    if(-not(Test-Path (Join-Path $r 'package.json'))){continue}
    $rows+=[pscustomobject]@{dir=[IO.Path]::GetFullPath($r);version=Read-Version $r;package=Item-Meta (Join-Path $r 'package.json');index=Item-Meta (Join-Path $r 'index.html')}
  }
  return @($rows)
}
function Parse-History([string[]]$Lines){
  $rows=@()
  foreach($line in $Lines){
    if(-not $line){continue}
    try{$j=$line|ConvertFrom-Json;$rows+=$j}catch{}
  }
  return @($rows)
}

if($DryRun){
  Save-Json $FinalReport ([ordered]@{status='SUCCESS';stage='R21_VERSION_DRIFT_ROOTCAUSE_DRY_RUN';read_only=$true;history_requests=0;production_files_written=$false;checks=@('appfiles_versions','promotion_state','update_safety_last_rollback','pending_update','safety_failure','last_known_good','safety_history_tail')})
  Write-Host "R21 VERSION DRIFT ROOTCAUSE DRY RUN: SUCCESS -> $FinalReport"
  exit 0
}
if($env:OS -ne 'Windows_NT'){throw 'R21 must run on Windows'}

$appDataStable=Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)) 'aram-fearless-draft'
$safetyRoot=Join-Path $appDataStable 'update-safety-v01579'
$autoRoot=Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate'
$promotionPath=Join-Path $autoRoot 'promotion-v0160.json'
$lastRollbackPath=Join-Path $safetyRoot 'last-rollback.json'
$pendingPath=Join-Path $safetyRoot 'pending-update.json'
$failurePath=Join-Path $safetyRoot 'safety-failure.json'
$lkgPath=Join-Path $safetyRoot 'last-known-good.json'
$historyPath=Join-Path $safetyRoot 'safety-history.ndjson'

$candidates=@(Candidate-AppDirs)
$promotion=Read-JsonSafe $promotionPath
$lastRollback=Read-JsonSafe $lastRollbackPath
$pending=Read-JsonSafe $pendingPath
$failure=Read-JsonSafe $failurePath
$lkg=Read-JsonSafe $lkgPath
$historyLines=@(Read-TextTail $historyPath 120)
$history=@(Parse-History $historyLines)

$rollbackEvents=@($history|Where-Object{[string]$_.event -eq 'AUTO_ROLLBACK'})
$preparedEvents=@($history|Where-Object{[string]$_.event -eq 'UPDATE_PREPARED'})
$appliedEvents=@($history|Where-Object{[string]$_.event -eq 'UPDATE_APPLIED'})
$probationEvents=@($history|Where-Object{[string]$_.event -like 'PROBATION_*'})
$cleanExitEvents=@($history|Where-Object{[string]$_.event -eq 'CLEAN_EXIT'})

$classification='VERSION_DRIFT_UNRESOLVED'
$explanation='No single updater-safety record proves the drift cause yet.'
if($lastRollback -and [string]$lastRollback.from -eq '0.16.0'){
  $classification='CONFIRMED_SAFETY_AUTO_ROLLBACK_FROM_0_16_0'
  $explanation='The updater safety subsystem recorded an automatic rollback from v0.16.0. The current v0.15.135 appfiles are therefore explained by the preserved pre-update snapshot being restored.'
}elseif($rollbackEvents.Count -gt 0 -and [string]$rollbackEvents[-1].detail.from -eq '0.16.0'){
  $classification='CONFIRMED_SAFETY_AUTO_ROLLBACK_FROM_0_16_0'
  $explanation='The safety history tail contains AUTO_ROLLBACK from v0.16.0.'
}elseif($pending -and [string]$pending.toVersion -eq '0.16.0'){
  $classification='V0_16_0_UPDATE_PROBATION_PENDING_OR_INCOMPLETE'
  $explanation='A v0.16.0 update transaction is still pending/applied but has not been committed as last-known-good.'
}elseif($lkg -and [string]$lkg.version -eq '0.15.135'){
  $classification='LAST_KNOWN_GOOD_REMAINS_0_15_135'
  $explanation='Safety state still considers v0.15.135 the last-known-good version; v0.16.0 was not committed as the durable installed baseline.'
}elseif($promotion -and [string]$promotion.version -eq '0.16.0' -and [string]$promotion.status -eq 'success'){
  $classification='LAUNCHER_PROMOTION_SUCCESS_WITHOUT_APPFILES_0_16_0'
  $explanation='The v0.16.0 launcher promotion succeeded, but that promotion only proves launcher promotion; it does not prove appfiles remained on v0.16.0.'
}

$report=[ordered]@{
  status='SUCCESS';stage='R21_VERSION_DRIFT_ROOTCAUSE';observed_at=(Get-Date).ToUniversalTime().ToString('o');read_only=$true;history_requests=0;production_files_written=$false;
  classification=$classification;explanation=$explanation;
  candidate_app_dirs=$candidates;
  launcher_promotion_state=$promotion;
  update_safety=[ordered]@{
    root=$safetyRoot;
    last_rollback=$lastRollback;
    pending_update=$pending;
    safety_failure=$failure;
    last_known_good=$lkg;
    history_file=Item-Meta $historyPath;
    recent_auto_rollbacks=$rollbackEvents;
    recent_update_prepared=$preparedEvents;
    recent_update_applied=$appliedEvents;
    recent_probation_events=$probationEvents;
    recent_clean_exits=$cleanExitEvents
  };
  next_step=if($classification -eq 'CONFIRMED_SAFETY_AUTO_ROLLBACK_FROM_0_16_0'){'FIX_OR_EXPLAIN_V0160_PROBATION_FAILURE_BEFORE_R19_RERUN'}elseif($classification -eq 'V0_16_0_UPDATE_PROBATION_PENDING_OR_INCOMPLETE'){'INSPECT_PENDING_V0160_PROBATION_AND_FAILURE_SIGNAL'}else{'USE_SAFETY_STATE_TO_RESOLVE_INSTALL_VERSION_DRIFT_BEFORE_R19_RERUN'}
}
Save-Json $FinalReport $report
Write-Host "R21 VERSION DRIFT ROOTCAUSE: $classification -> $FinalReport"
exit 0
