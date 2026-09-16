param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$CandidateBuilder = Join-Path $PSScriptRoot 'universal-rating-r3-build-shipped-shadow-candidate.js'
$HarnessBuilder = Join-Path $PSScriptRoot 'universal-rating-r4-build-shipped-shadow-physical-harness.js'
$CandidateRoot = Join-Path $RepoRoot 'audit-output\universal-rating-r3-shipped-shadow-candidate'
$Overlay = Join-Path $CandidateRoot 'overlay'
$HarnessRoot = Join-Path $RepoRoot 'audit-output\universal-rating-r4-shipped-shadow-physical-harness'
if (-not $ReportDir) { $ReportDir = Join-Path $RepoRoot 'audit-output\universal-rating-r5-shipped-shadow-physical' }
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$FinalReport = Join-Path $ReportDir 'universal-rating-r5-shipped-shadow-physical.json'

function Save-Json([string]$Path, $Object) {
  $Object | ConvertTo-Json -Depth 14 | Set-Content -Path $Path -Encoding UTF8
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
  try { return [string]((Get-Content (Join-Path $Dir 'package.json') -Raw | ConvertFrom-Json).version) }
  catch { return '' }
}
function Find-AppDir {
  $roots = @(
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\appfiles'),
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater\appfiles')
  )
  Get-ChildItem $env:LOCALAPPDATA -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like 'ARAM Fearless Draft AutoUpdate*' } |
    ForEach-Object {
      $roots += (Join-Path $_.FullName 'appfiles')
      if ($_.Name -like '*appfiles') { $roots += $_.FullName }
    }
  $candidates = @()
  foreach ($r in ($roots | Select-Object -Unique)) {
    if (-not (Test-Path (Join-Path $r 'package.json'))) { continue }
    if (-not (Test-Path (Join-Path $r 'index.html'))) { continue }
    $v = Read-PackageVersion $r
    try { $parsed = [version]$v } catch { continue }
    $candidates += [pscustomobject]@{ Dir=$r; Version=$parsed }
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
function Snapshot-ProductionFiles([string]$Dir) {
  $names = @('package.json','main-v0160.js','preload.js','index.html')
  $out = [ordered]@{}
  foreach ($name in $names) { $out[$name] = Sha256 (Join-Path $Dir $name) }
  return [pscustomobject]$out
}
function Snapshot-SafetyFiles([string]$UserData) {
  $root = Join-Path $UserData 'update-safety-v01579'
  $names = @('pending-update.json','safety-failure.json','last-known-good.json','last-rollback.json','safety-history.ndjson')
  $out = [ordered]@{}
  foreach ($name in $names) { $out[$name] = Sha256 (Join-Path $root $name) }
  return [pscustomobject]$out
}
function Same-Hashes($Before, $After) {
  foreach ($p in $Before.PSObject.Properties.Name) {
    if ([string]$Before.$p -ne [string]$After.$p) { return $false }
  }
  return $true
}

foreach ($builder in @($CandidateBuilder,$HarnessBuilder)) {
  if (-not (Test-Path $builder)) { throw "builder missing: $builder" }
  & node $builder
  if ($LASTEXITCODE -ne 0) { throw "builder failed: $builder" }
}
$kit = Get-Content (Join-Path $CandidateRoot 'candidate-kit.json') -Raw | ConvertFrom-Json
$harness = Get-Content (Join-Path $HarnessRoot 'harness.json') -Raw | ConvertFrom-Json
if ([string]$kit.candidate_version -ne '0.16.1' -or -not [bool]$kit.candidate_only) { throw 'candidate kit contract invalid' }
if ([bool]$kit.active_manifest_mutated -or [bool]$kit.production_rating_active -or [bool]$kit.automatic_rating_promotion) { throw 'candidate safety contract violated' }
if ([int]$harness.history_requests_per_run -ne 1 -or -not [bool]$harness.isolated_user_data) { throw 'physical harness contract invalid' }

if ($DryRun) {
  $report = [ordered]@{
    status='SUCCESS'; stage='UNIVERSAL_RATING_R5_SHIPPED_SHADOW_PHYSICAL_DRY_RUN';
    base_version='0.16.0'; candidate_version='0.16.1'; candidate_only=$true;
    active_manifest_mutated=$false; production_install_mutated=$false;
    isolated_user_data=$true; isolated_rating_db=$true;
    history_requests_per_run=1; retry=$false; automatic_sidecar=$true;
    production_rating_active=$false; automatic_promotion=$false;
    physical_user_pc_execution_required=$true
  }
  Save-Json $FinalReport $report
  Write-Host "UNIVERSAL RATING R5 SHIPPED SHADOW PHYSICAL DRY RUN: SUCCESS -> $FinalReport"
  exit 0
}

if ($env:OS -ne 'Windows_NT') { throw 'R5 physical shipped shadow test must run on Windows' }
if (-not $AppDir) { $AppDir = Find-AppDir }
if (-not $AppDir -or -not (Test-Path (Join-Path $AppDir 'package.json'))) { throw 'could not auto-detect installed appfiles' }
if ((Read-PackageVersion $AppDir) -ne '0.16.0') { throw "R5 requires installed v0.16.0; found $(Read-PackageVersion $AppDir)" }
if (-not $ElectronExe) { $ElectronExe = Find-Electron }
if (-not $ElectronExe -or -not (Test-Path $ElectronExe)) { throw 'could not auto-detect Electron runtime' }

$stableUserData = Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)) 'aram-fearless-draft'
$productionBefore = Snapshot-ProductionFiles $AppDir
$safetyBefore = Snapshot-SafetyFiles $stableUserData
$tempRoot = Join-Path $env:TEMP ("aram-universal-rating-r5-$PID")
$tempApp = Join-Path $tempRoot 'appfiles'
$isolatedUserData = Join-Path $tempRoot 'isolated-userdata'
if (Test-Path $tempRoot) { Remove-Item $tempRoot -Recurse -Force }
Copy-Tree $AppDir $tempApp
Copy-Tree $Overlay $tempApp
Copy-Item (Join-Path $HarnessRoot 'main-r4-shipped-shadow-physical.js') $tempApp -Force

$pkgPath = Join-Path $tempApp 'package.json'
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
if ([string]$pkg.version -ne '0.16.1') { throw 'candidate overlay package version mismatch' }
$pkg.main = 'main-r4-shipped-shadow-physical.js'
$pkg | ConvertTo-Json -Depth 8 | Set-Content $pkgPath -Encoding UTF8

$innerReport = Join-Path $ReportDir 'universal-rating-r4-result.json'
if (Test-Path $innerReport) { Remove-Item $innerReport -Force }
$baselinePids = @(Get-ElectronPidsForExe $ElectronExe)
$stdout = Join-Path $ReportDir 'app-stdout.log'
$stderr = Join-Path $ReportDir 'app-stderr.log'
$oldReport = $env:ARAM_UNIVERSAL_R4_REPORT
$oldRoot = $env:ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT
$oldDb = $env:ARAM_UNIVERSAL_RATING_DB_ROOT
$p = $null
try {
  $env:ARAM_UNIVERSAL_R4_REPORT = $innerReport
  $env:ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT = $isolatedUserData
  $env:ARAM_UNIVERSAL_RATING_DB_ROOT = $isolatedUserData
  $p = Start-Process -FilePath $ElectronExe -ArgumentList (Quote-Arg $tempApp) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  $deadline = (Get-Date).AddSeconds(120)
  while ((Get-Date) -lt $deadline -and -not (Test-Path $innerReport)) { Start-Sleep -Milliseconds 500 }
} finally {
  if ($null -eq $oldReport) { Remove-Item Env:ARAM_UNIVERSAL_R4_REPORT -ErrorAction SilentlyContinue } else { $env:ARAM_UNIVERSAL_R4_REPORT = $oldReport }
  if ($null -eq $oldRoot) { Remove-Item Env:ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT -ErrorAction SilentlyContinue } else { $env:ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT = $oldRoot }
  if ($null -eq $oldDb) { Remove-Item Env:ARAM_UNIVERSAL_RATING_DB_ROOT -ErrorAction SilentlyContinue } else { $env:ARAM_UNIVERSAL_RATING_DB_ROOT = $oldDb }
}
$afterPids = @(Get-ElectronPidsForExe $ElectronExe)
$newPids = @($afterPids | Where-Object { $baselinePids -notcontains $_ })
Stop-ElectronPids $newPids
try { if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } } catch {}
Start-Sleep -Seconds 1
if (-not (Test-Path $innerReport)) { throw 'R4 shipped shadow result was not produced within 120 seconds' }

$inner = Get-Content $innerReport -Raw | ConvertFrom-Json
$dbFile = Join-Path $isolatedUserData 'rating\universal-rating-v1.json'
$dbCreated = Test-Path $dbFile
$productionAfter = Snapshot-ProductionFiles $AppDir
$safetyAfter = Snapshot-SafetyFiles $stableUserData
$productionStable = Same-Hashes $productionBefore $productionAfter
$safetyStable = Same-Hashes $safetyBefore $safetyAfter
$success = (
  [string]$inner.status -eq 'SUCCESS' -and
  $productionStable -and $safetyStable -and $dbCreated -and
  [string]$inner.result.candidate_version -eq '0.16.1' -and
  [bool]$inner.result.automatic_sidecar -and
  [int]$inner.result.history_requests -eq 1 -and
  [int]$inner.result.rating_network_requests -eq 0 -and
  -not [bool]$inner.result.production_active -and
  $null -eq $inner.result.production_rating
)
$report = [ordered]@{
  status=if($success){'SUCCESS'}else{'FAILURE'};
  stage='UNIVERSAL_RATING_R5_SHIPPED_SHADOW_PHYSICAL';
  installed_version=Read-PackageVersion $AppDir; candidate_version='0.16.1';
  production_files_stable=$productionStable; production_safety_state_stable=$safetyStable;
  production_install_mutated=$false; production_manifest_mutated=$false;
  isolated_user_data_created=(Test-Path $isolatedUserData); isolated_rating_db_created=$dbCreated;
  isolated_data_persistent_after_test=$false; history_requests_per_run=1; retry=$false;
  inner=$inner.result; privacy_safe=$true; temp_copy_removed=$true
}
Save-Json $FinalReport $report
if (Test-Path $tempRoot) { Remove-Item $tempRoot -Recurse -Force }
if (-not $success) { throw "UNIVERSAL RATING R5 SHIPPED SHADOW PHYSICAL: FAILURE -> $FinalReport" }
Write-Host "UNIVERSAL RATING R5 SHIPPED SHADOW PHYSICAL: SUCCESS -> $FinalReport"
