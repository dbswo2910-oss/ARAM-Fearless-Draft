param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [switch]$DryRun
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$RepoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$R19=Join-Path $PSScriptRoot 'aram-rating-v032-r19-physical-shadow-rc.ps1'
if(-not $ReportDir){$ReportDir=Join-Path $RepoRoot 'audit-output\r20-production-mutation-forensic'}
New-Item -ItemType Directory -Force -Path $ReportDir|Out-Null
$FinalReport=Join-Path $ReportDir 'r20-production-mutation-forensic.json'
$InnerReportDir=Join-Path $ReportDir 'r19-inner'

function Save-Json([string]$Path,$Object){$Object|ConvertTo-Json -Depth 16|Set-Content -Path $Path -Encoding UTF8}
function Read-Version([string]$Dir){try{return [string]((Get-Content (Join-Path $Dir 'package.json') -Raw|ConvertFrom-Json).version)}catch{return ''}}
function Find-AppDir{
  $roots=@((Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\appfiles'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater\appfiles'))
  Get-ChildItem $env:LOCALAPPDATA -Directory -ErrorAction SilentlyContinue|Where-Object{$_.Name -like 'ARAM Fearless Draft AutoUpdate*'}|ForEach-Object{$roots+=(Join-Path $_.FullName 'appfiles')}
  $c=@();foreach($r in ($roots|Select-Object -Unique)){if((Test-Path (Join-Path $r 'package.json')) -and (Test-Path (Join-Path $r 'index.html'))){try{$v=[version](Read-Version $r);$c+=[pscustomobject]@{Dir=$r;Version=$v}}catch{}}}
  $hit=$c|Sort-Object Version -Descending|Select-Object -First 1;if($hit){return [string]$hit.Dir};return ''
}
function File-Snapshot([string]$Path){
  if(-not(Test-Path $Path -PathType Leaf)){return [ordered]@{exists=$false;sha256='';length=0;last_write_utc=''}}
  $i=Get-Item $Path
  return [ordered]@{exists=$true;sha256=(Get-FileHash $Path -Algorithm SHA256).Hash.ToLowerInvariant();length=[int64]$i.Length;last_write_utc=$i.LastWriteTimeUtc.ToString('o')}
}
function Snapshot-Production([string]$Dir){
  $o=[ordered]@{};foreach($n in @('package.json','main-v0160.js','preload.js','index.html')){$o[$n]=File-Snapshot (Join-Path $Dir $n)};return $o
}
function Changed-Files($Before,$After){
  $rows=@();foreach($n in @('package.json','main-v0160.js','preload.js','index.html')){
    $b=$Before.$n;$a=$After.$n
    if(([string]$b.sha256 -ne [string]$a.sha256) -or ([bool]$b.exists -ne [bool]$a.exists)){$rows+=[pscustomobject]@{file=$n;before_sha256=$b.sha256;after_sha256=$a.sha256;before_length=$b.length;after_length=$a.length;before_last_write_utc=$b.last_write_utc;after_last_write_utc=$a.last_write_utc}}
  };return @($rows)
}

if(-not(Test-Path $R19)){throw 'R19 physical harness missing'}
if($DryRun){Save-Json $FinalReport ([ordered]@{status='SUCCESS';stage='R20_PRODUCTION_MUTATION_FORENSIC_DRY_RUN';physical_user_pc_execution_required=$true;reruns_r19_once=$true;max_history_requests=1;production_files_observed=@('package.json','main-v0160.js','preload.js','index.html');production_files_written_by_r20=$false});Write-Host "R20 FORENSIC DRY RUN: SUCCESS -> $FinalReport";exit 0}
if($env:OS -ne 'Windows_NT'){throw 'R20 physical forensic must run on Windows'}
if(-not $AppDir){$AppDir=Find-AppDir}
if(-not $AppDir -or -not(Test-Path (Join-Path $AppDir 'package.json'))){throw 'could not auto-detect installed ARAM appfiles; pass -AppDir'}
if((Read-Version $AppDir) -ne '0.16.0'){throw "R20 expects installed v0.16.0, found $(Read-Version $AppDir)"}

$before=Snapshot-Production $AppDir
$started=(Get-Date).ToUniversalTime().ToString('o')
New-Item -ItemType Directory -Force -Path $InnerReportDir|Out-Null
$args=@('-NoProfile','-ExecutionPolicy','Bypass','-File',$R19,'-AppDir',$AppDir,'-ReportDir',$InnerReportDir)
if($ElectronExe){$args+=@('-ElectronExe',$ElectronExe)}
$p=Start-Process -FilePath 'powershell.exe' -ArgumentList $args -Wait -PassThru
$ended=(Get-Date).ToUniversalTime().ToString('o')
$after=Snapshot-Production $AppDir
$changed=Changed-Files ([pscustomobject]$before) ([pscustomobject]$after)
$innerPath=Join-Path $InnerReportDir 'r19-physical-shadow-rc.json'
$inner=$null;if(Test-Path $innerPath){try{$inner=Get-Content $innerPath -Raw|ConvertFrom-Json}catch{}}
$status=if($changed.Count -eq 0 -and $inner -and [string]$inner.status -eq 'SUCCESS'){'SUCCESS'}elseif($changed.Count -eq 0){'R19_FAILED_WITHOUT_PRODUCTION_MUTATION'}else{'PRODUCTION_MUTATION_REPRODUCED'}
$report=[ordered]@{
  status=$status;stage='R20_PRODUCTION_MUTATION_FORENSIC';started_at=$started;ended_at=$ended;production_version='0.16.0';app_dir=$AppDir;r19_exit_code=[int]$p.ExitCode;r19_status=if($inner){[string]$inner.status}else{'missing'};
  production_files_written_by_r20=$false;changed_file_count=[int]$changed.Count;changed_files=$changed;before=$before;after=$after;
  canonical_checkpoint_stable=if($inner){[bool]$inner.canonical_checkpoint_stable}else{$null};canonical_match_count_stable=if($inner){[bool]$inner.canonical_match_count_stable}else{$null};
  shadow_state=if($inner){[string]$inner.shadow.state}else{''};shadow_history_requests=if($inner){[int]$inner.shadow.history_requests}else{0};shadow_history_error=if($inner){$inner.shadow.history_error}else{$null};
  interpretation=if($changed.Count -eq 0){'The prior R19 hash failure did not reproduce during this guarded rerun. Treat the first mutation as external/concurrent until proven otherwise.'}else{'At least one watched production file changed again during R19. Use changed_files to identify the exact file before any production activation.'}
}
Save-Json $FinalReport $report
Write-Host "R20 PRODUCTION MUTATION FORENSIC: $status -> $FinalReport"
if($status -ne 'SUCCESS'){exit 1}
