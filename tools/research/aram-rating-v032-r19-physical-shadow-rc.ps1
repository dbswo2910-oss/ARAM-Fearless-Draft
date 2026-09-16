param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$KitDir = Join-Path $RepoRoot 'audit-output\r17-installed-shadow-rc-kit'
$Builder = Join-Path $PSScriptRoot 'aram-rating-v032-r18-build-installed-shadow-rc-kit.js'
$Probe = Join-Path $RepoRoot 'tools\stability\windows-real-state-probe.js'
if (-not $ReportDir) { $ReportDir = Join-Path $RepoRoot 'audit-output\r19-userpc-shadow-rc' }
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$FinalReport = Join-Path $ReportDir 'r19-physical-shadow-rc.json'

function Save-Json([string]$Path, $Object) {
  $Object | ConvertTo-Json -Depth 12 | Set-Content -Path $Path -Encoding UTF8
}
function Sha256([string]$Path) {
  if (-not (Test-Path $Path -PathType Leaf)) { return '' }
  return (Get-FileHash $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Quote-Arg([string]$Value) {
  if ($null -eq $Value) { return '""' }
  return '"' + $Value.Replace('"','\"') + '"'
}
function Read-PackageVersion([string]$Dir) {
  try { return [string]((Get-Content (Join-Path $Dir 'package.json') -Raw | ConvertFrom-Json).version) } catch { return '' }
}
function Find-AppDir {
  $roots = @(
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\appfiles'),
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater\appfiles')
  )
  Get-ChildItem $env:LOCALAPPDATA -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'ARAM Fearless Draft AutoUpdate*' } | ForEach-Object {
    $roots += (Join-Path $_.FullName 'appfiles')
    if ($_.Name -like '*appfiles') { $roots += $_.FullName }
  }
  $candidates = @()
  foreach ($r in ($roots | Select-Object -Unique)) {
    if (-not (Test-Path (Join-Path $r 'package.json'))) { continue }
    if (-not (Test-Path (Join-Path $r 'index.html'))) { continue }
    $v = Read-PackageVersion $r
    try { $parsed = [version]$v } catch { continue }
    $candidates += [pscustomobject]@{ Dir=$r; Version=$parsed; VersionText=$v }
  }
  $hit = $candidates | Sort-Object Version -Descending | Select-Object -First 1
  if ($hit) { return [string]$hit.Dir }
  return ''
}
function Find-Electron {
  $roots = @(
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate'),
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater'),
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft')
  )
  foreach ($r in $roots) {
    if (-not (Test-Path $r)) { continue }
    $hit = Get-ChildItem $r -Recurse -Filter electron.exe -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($hit) { return [string]$hit.FullName }
  }
  return ''
}
function Get-ElectronPidsForExe([string]$Electron) {
  $target = ''
  try { $target = [IO.Path]::GetFullPath($Electron) } catch { return @() }
  $ids = @()
  try {
    Get-CimInstance Win32_Process -Filter "Name='electron.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
      if (-not $_.ExecutablePath) { return }
      try {
        $candidate = [IO.Path]::GetFullPath([string]$_.ExecutablePath)
        if ([string]::Equals($candidate,$target,[StringComparison]::OrdinalIgnoreCase)) { $ids += [int]$_.ProcessId }
      } catch {}
    }
  } catch { return @() }
  return @($ids | Sort-Object -Unique)
}
function Stop-ElectronPids([int[]]$Ids) {
  foreach ($id in @($Ids | Sort-Object -Unique)) {
    try { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue } catch {}
  }
}
function Copy-Tree([string]$Source, [string]$Destination) {
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Get-ChildItem $Source -Force | ForEach-Object { Copy-Item $_.FullName $Destination -Recurse -Force }
}
function Run-StateProbe([string]$Tag,[string]$App,[string]$Electron,[string]$UserData) {
  $out = Join-Path $ReportDir "state-$Tag.json"
  $stdout = Join-Path $ReportDir "state-$Tag-stdout.log"
  $stderr = Join-Path $ReportDir "state-$Tag-stderr.log"
  $args = ('{0} --app-dir {1} --user-data {2} --report {3}' -f (Quote-Arg $Probe),(Quote-Arg $App),(Quote-Arg $UserData),(Quote-Arg $out))
  $p = Start-Process -FilePath $Electron -ArgumentList $args -RedirectStandardOutput $stdout -RedirectStandardError $stderr -Wait -PassThru
  if ($p.ExitCode -ne 0 -or -not (Test-Path $out)) { throw "state probe $Tag failed; exit=$($p.ExitCode)" }
  return Get-Content $out -Raw | ConvertFrom-Json
}
function Snapshot-ProductionFiles([string]$Dir) {
  $names = @('package.json','main-v0160.js','preload.js','index.html')
  $out = [ordered]@{}
  foreach ($name in $names) { $out[$name] = Sha256 (Join-Path $Dir $name) }
  return $out
}
function Same-Hashes($Before,$After) {
  foreach ($p in $Before.PSObject.Properties.Name) {
    if ([string]$Before.$p -ne [string]$After.$p) { return $false }
  }
  return $true
}

if (-not (Test-Path $Builder)) { throw 'R18 kit builder missing' }
if (-not (Test-Path $Probe)) { throw 'windows-real-state-probe.js missing' }
& node $Builder
if ($LASTEXITCODE -ne 0) { throw "R18 kit build failed: exit=$LASTEXITCODE" }
foreach ($required in @('r17-shadow-renderer.js','main-r17-shadow-rc.js','rc-kit.json')) {
  if (-not (Test-Path (Join-Path $KitDir $required))) { throw "R18 kit file missing: $required" }
}
$kit = Get-Content (Join-Path $KitDir 'rc-kit.json') -Raw | ConvertFrom-Json
if ([string]$kit.mode -ne 'temporary_copy_overlay_only') { throw "unexpected R18 kit mode: $($kit.mode)" }
if ([bool]$kit.production_install_mutated -or [bool]$kit.production_manifest_mutated) { throw 'R18 kit mutation contract violated' }

if ($DryRun) {
  $report = [ordered]@{
    status='SUCCESS'; stage='R19_PHYSICAL_SHADOW_RC_DRY_RUN'; platform=$env:OS; privacy_safe=$true;
    kit_mode=$kit.mode; production_install_mutated=$false; production_manifest_mutated=$false;
    temp_copy_required=$true; max_history_requests_per_run=1; recurring_polling=$false;
    canonical_database='aram-rating-research-v03'; shadow_evidence_database='aram-rating-shadow-evidence-v1';
    physical_user_pc_execution_required=$true
  }
  Save-Json $FinalReport $report
  Write-Host "R19 PHYSICAL SHADOW RC DRY RUN: SUCCESS -> $FinalReport"
  exit 0
}

if ($env:OS -ne 'Windows_NT') { throw 'R19 physical shadow RC must run on Windows' }
if (-not $AppDir) { $AppDir = Find-AppDir }
if (-not $AppDir -or -not (Test-Path (Join-Path $AppDir 'package.json'))) { throw 'could not auto-detect installed ARAM v0.16.0 appfiles; pass -AppDir explicitly' }
if ((Read-PackageVersion $AppDir) -ne '0.16.0') { throw "R19 requires installed v0.16.0; found $(Read-PackageVersion $AppDir)" }
if (-not $ElectronExe) { $ElectronExe = Find-Electron }
if (-not $ElectronExe -or -not (Test-Path $ElectronExe)) { throw 'could not auto-detect Electron runtime; pass -ElectronExe explicitly' }

$userData = Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)) 'aram-fearless-draft'
if (-not (Test-Path $userData)) { throw 'stable userData aram-fearless-draft is missing' }
$productionBefore = Snapshot-ProductionFiles $AppDir
$tempRoot = Join-Path $env:TEMP ("aram-r19-shadow-rc-$PID")
$tempApp = Join-Path $tempRoot 'appfiles'
if (Test-Path $tempRoot) { Remove-Item $tempRoot -Recurse -Force }
Copy-Tree $AppDir $tempApp
Copy-Item (Join-Path $KitDir 'r17-shadow-renderer.js') $tempApp -Force
Copy-Item (Join-Path $KitDir 'main-r17-shadow-rc.js') $tempApp -Force
$pkgPath = Join-Path $tempApp 'package.json'
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$pkg.main = 'main-r17-shadow-rc.js'
$pkg | ConvertTo-Json -Depth 8 | Set-Content $pkgPath -Encoding UTF8

$pre = Run-StateProbe 'before' $tempApp $ElectronExe $userData
$shadowReportPath = Join-Path $ReportDir 'r17-shadow-result.json'
if (Test-Path $shadowReportPath) { Remove-Item $shadowReportPath -Force }
$baselinePids = @(Get-ElectronPidsForExe $ElectronExe)
$stdout = Join-Path $ReportDir 'r17-app-stdout.log'
$stderr = Join-Path $ReportDir 'r17-app-stderr.log'
$oldReportEnv = $env:ARAM_R17_SHADOW_RC_REPORT
$p = $null
try {
  $env:ARAM_R17_SHADOW_RC_REPORT = $shadowReportPath
  $p = Start-Process -FilePath $ElectronExe -ArgumentList (Quote-Arg $tempApp) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  $deadline = (Get-Date).AddSeconds(90)
  while ((Get-Date) -lt $deadline -and -not (Test-Path $shadowReportPath)) { Start-Sleep -Milliseconds 500 }
} finally {
  if ($null -eq $oldReportEnv) { Remove-Item Env:ARAM_R17_SHADOW_RC_REPORT -ErrorAction SilentlyContinue }
  else { $env:ARAM_R17_SHADOW_RC_REPORT = $oldReportEnv }
}
$afterPids = @(Get-ElectronPidsForExe $ElectronExe)
$newPids = @($afterPids | Where-Object { $baselinePids -notcontains $_ })
Stop-ElectronPids $newPids
try { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } } catch {}
Start-Sleep -Seconds 1
if (-not (Test-Path $shadowReportPath)) { throw 'R17 shadow result was not produced within 90 seconds' }
$post = Run-StateProbe 'after' $tempApp $ElectronExe $userData
$shadowEnvelope = Get-Content $shadowReportPath -Raw | ConvertFrom-Json
$r = $shadowEnvelope.result
$productionAfter = Snapshot-ProductionFiles $AppDir
$productionStable = Same-Hashes ([pscustomobject]$productionBefore) ([pscustomobject]$productionAfter)
$checkpointStable = ([string]$pre.research_checkpoint_sha256 -eq [string]$post.research_checkpoint_sha256)
$countStable = ([int]$pre.research_checkpoint_matches -eq [int]$post.research_checkpoint_matches)
$privacySafe = (-not [bool]$r.privacy.raw_puuid_returned) -and (-not [bool]$r.privacy.raw_match_id_returned) -and (-not [bool]$r.privacy.identity_mapping_returned)
$bridgeHealthy = ([int]$r.history_requests -eq 1) -and ([string]$r.history_error -eq '') -and ([int]$r.history_valid_matches -gt 0)
$shadowSafe = (-not [bool]$r.production_active) -and (-not [bool]$r.production_score_changed) -and (-not [bool]$r.ui_changed) -and (-not [bool]$r.canonical_checkpoint_written) -and (-not [bool]$r.production_activation_authorized)
$success = ($shadowEnvelope.status -eq 'SUCCESS') -and ($r.state -eq 'available') -and $productionStable -and $checkpointStable -and $countStable -and $privacySafe -and $bridgeHealthy -and $shadowSafe

$report = [ordered]@{
  status=if($success){'SUCCESS'}else{'FAILURE'}; stage='R19_PHYSICAL_INSTALLED_SHADOW_RC'; privacy_safe=$privacySafe;
  production_version='0.16.0'; production_install_mutated=(-not $productionStable); temp_copy_used=$true; temp_copy_removed=$false;
  canonical_checkpoint_stable=$checkpointStable; canonical_match_count_stable=$countStable;
  before_matches=[int]$pre.research_checkpoint_matches; after_matches=[int]$post.research_checkpoint_matches;
  production_file_hashes_stable=$productionStable;
  shadow=[ordered]@{
    state=$r.state; history_requests=[int]$r.history_requests; history_error=$r.history_error; history_valid_matches=[int]$r.history_valid_matches;
    baseline_matches=[int]$r.baseline_matches; stored_delta_matches=[int]$r.stored_delta_matches; augmented_matches=[int]$r.augmented_matches;
    evidence_snapshots=[int]$r.evidence_snapshots; observed_leader=$r.observed_leader; observed_runner_up=$r.observed_runner_up;
    selection_status=$r.selection_status; promotion_status=$r.promotion_status; production_activation_authorized=$false
  }
  raw_personal_data_in_report=$false; production_score_changed=$false; canonical_checkpoint_written=$false; ui_changed=$false; automatic_promotion=$false
}
try { Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue; $report.temp_copy_removed=$true } catch {}
Save-Json $FinalReport $report
Write-Host "R19 PHYSICAL INSTALLED SHADOW RC: $($report.status) -> $FinalReport"
if (-not $success) { exit 1 }
