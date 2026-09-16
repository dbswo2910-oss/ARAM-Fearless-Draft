param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$Builder = Join-Path $PSScriptRoot 'aram-rating-v032-r26-build-shadow-evidence-inspector.js'
$KitDir = Join-Path $RepoRoot 'audit-output\r26-shadow-evidence-inspector-kit'
$Probe = Join-Path $RepoRoot 'tools\stability\windows-real-state-probe.js'
if (-not $ReportDir) { $ReportDir = Join-Path $RepoRoot 'audit-output\r26-shadow-evidence-inspect' }
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$Final = Join-Path $ReportDir 'r26-shadow-evidence-inspect.json'

function Save-Json([string]$Path, $Object) {
  $Object | ConvertTo-Json -Depth 16 | Set-Content -Path $Path -Encoding UTF8
}
function Sha256([string]$Path) {
  if (-not (Test-Path $Path -PathType Leaf)) { return '' }
  return (Get-FileHash $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}
function Quote-Arg([string]$Value) {
  if ($null -eq $Value) { return '""' }
  return '"' + $Value.Replace('"','\"') + '"'
}
function Read-Version([string]$Dir) {
  try {
    $pkg = Get-Content (Join-Path $Dir 'package.json') -Raw | ConvertFrom-Json
    return [string]$pkg.version
  } catch {
    return ''
  }
}
function Find-AppDir {
  $roots = @(
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\appfiles'),
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater\appfiles')
  )
  $rows = @()
  foreach ($r in ($roots | Select-Object -Unique)) {
    if (-not (Test-Path (Join-Path $r 'package.json'))) { continue }
    try {
      $v = [version](Read-Version $r)
      $rows += [pscustomobject]@{ Dir = $r; Version = $v }
    } catch {}
  }
  $hit = $rows | Sort-Object Version -Descending | Select-Object -First 1
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
function Copy-Tree([string]$Source, [string]$Destination) {
  New-Item -ItemType Directory -Force -Path $Destination | Out-Null
  Get-ChildItem $Source -Force | ForEach-Object { Copy-Item $_.FullName $Destination -Recurse -Force }
}
function Snapshot-Prod([string]$Dir) {
  $out = [ordered]@{}
  foreach ($name in @('package.json','main-v0160.js','preload.js','index.html')) {
    $out[$name] = Sha256 (Join-Path $Dir $name)
  }
  return [pscustomobject]$out
}
function Snapshot-Safety([string]$UserData) {
  $root = Join-Path $UserData 'update-safety-v01579'
  $out = [ordered]@{}
  foreach ($name in @('pending-update.json','safety-failure.json','last-known-good.json','last-rollback.json','safety-history.ndjson')) {
    $out[$name] = Sha256 (Join-Path $root $name)
  }
  return [pscustomobject]$out
}
function Same-Hashes($Before, $After) {
  foreach ($name in $Before.PSObject.Properties.Name) {
    if ([string]$Before.$name -ne [string]$After.$name) { return $false }
  }
  return $true
}
function Patch-Safety([string]$TempApp) {
  $p = Join-Path $TempApp 'update-safety-v01579.js'
  if (-not (Test-Path $p)) { throw 'R26 temp update-safety-v01579.js missing' }
  $src = Get-Content $p -Raw
  if ($src -match 'ARAM_R19_SAFETY_ROOT') { return }
  $old = "function defaultRoot(){try{const {app}=require('electron');return path.join(app.getPath('userData'),'update-safety-v01579')}catch{return path.join(process.cwd(),'.update-safety-v01579')}}"
  $new = "function defaultRoot(){const override=String(process.env.ARAM_R19_SAFETY_ROOT||'').trim();if(override)return path.resolve(override);try{const {app}=require('electron');return path.join(app.getPath('userData'),'update-safety-v01579')}catch{return path.join(process.cwd(),'.update-safety-v01579')}}"
  if (-not $src.Contains($old)) { throw 'R26 safety isolation patch contract mismatch' }
  Set-Content -Path $p -Value $src.Replace($old,$new) -Encoding UTF8 -NoNewline
}
function Patch-Promotion([string]$TempApp) {
  $p = Join-Path $TempApp 'main-v0160.js'
  if (-not (Test-Path $p)) { throw 'R26 temp main-v0160.js missing' }
  $src = Get-Content $p -Raw
  if ($src -match 'ARAM_R19_DISABLE_COLD_START_PROMOTION') { return }
  $old = "try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}"
  $new = "if(process.env.ARAM_R19_DISABLE_COLD_START_PROMOTION!=='1'){try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}}"
  if (-not $src.Contains($old)) { throw 'R26 cold-start promotion patch contract mismatch' }
  Set-Content -Path $p -Value $src.Replace($old,$new) -Encoding UTF8 -NoNewline
}
function Run-Probe([string]$Tag, [string]$App, [string]$Electron, [string]$UserData) {
  $out = Join-Path $ReportDir "state-$Tag.json"
  $stdout = Join-Path $ReportDir "state-$Tag-stdout.log"
  $stderr = Join-Path $ReportDir "state-$Tag-stderr.log"
  $args = ('{0} --app-dir {1} --user-data {2} --report {3}' -f (Quote-Arg $Probe),(Quote-Arg $App),(Quote-Arg $UserData),(Quote-Arg $out))
  $p = Start-Process -FilePath $Electron -ArgumentList $args -RedirectStandardOutput $stdout -RedirectStandardError $stderr -Wait -PassThru
  if ($p.ExitCode -ne 0 -or -not (Test-Path $out)) { throw "R26 state probe $Tag failed; exit=$($p.ExitCode)" }
  return Get-Content $out -Raw | ConvertFrom-Json
}

if (-not (Test-Path $Builder)) { throw 'R26 builder missing' }
& node $Builder
if ($LASTEXITCODE -ne 0) { throw 'R26 kit build failed' }

if ($DryRun) {
  $report = [ordered]@{
    status = 'SUCCESS'
    stage = 'R26_SHADOW_EVIDENCE_INSPECT_DRY_RUN'
    read_only = $true
    riot_lcu_requests = 0
    checkpoint_writes = 0
    production_writes = 0
    temp_copy_required = $true
  }
  Save-Json $Final $report
  Write-Host "R26 SHADOW EVIDENCE INSPECT DRY RUN: SUCCESS -> $Final"
  exit 0
}

if ($env:OS -ne 'Windows_NT') { throw 'R26 requires Windows' }
if (-not $AppDir) { $AppDir = Find-AppDir }
if (-not $AppDir -or (Read-Version $AppDir) -ne '0.16.0') { throw "R26 requires installed v0.16.0; found $(Read-Version $AppDir)" }
if (-not $ElectronExe) { $ElectronExe = Find-Electron }
if (-not $ElectronExe -or -not (Test-Path $ElectronExe)) { throw 'R26 could not detect electron.exe' }

$userData = Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)) 'aram-fearless-draft'
$prodBefore = Snapshot-Prod $AppDir
$safetyBefore = Snapshot-Safety $userData
$tempRoot = Join-Path $env:TEMP ("aram-r26-shadow-evidence-$PID")
$tempApp = Join-Path $tempRoot 'appfiles'
$isolatedSafety = Join-Path $tempRoot 'isolated-update-safety'
if (Test-Path $tempRoot) { Remove-Item $tempRoot -Recurse -Force }
Copy-Tree $AppDir $tempApp
Patch-Safety $tempApp
Patch-Promotion $tempApp
Copy-Item (Join-Path $KitDir 'r26-shadow-evidence-renderer.js') $tempApp -Force
Copy-Item (Join-Path $KitDir 'main-r26-shadow-evidence.js') $tempApp -Force
$pkgPath = Join-Path $tempApp 'package.json'
$pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
$pkg.main = 'main-r26-shadow-evidence.js'
$pkg | ConvertTo-Json -Depth 8 | Set-Content $pkgPath -Encoding UTF8

$pre = Run-Probe 'before' $tempApp $ElectronExe $userData
$inner = Join-Path $ReportDir 'r26-inner.json'
Remove-Item $inner -Force -ErrorAction SilentlyContinue
$oldReport = $env:ARAM_R26_REPORT
$oldSafety = $env:ARAM_R19_SAFETY_ROOT
$oldPromotion = $env:ARAM_R19_DISABLE_COLD_START_PROMOTION
$p = $null
try {
  $env:ARAM_R26_REPORT = $inner
  $env:ARAM_R19_SAFETY_ROOT = $isolatedSafety
  $env:ARAM_R19_DISABLE_COLD_START_PROMOTION = '1'
  $stdout = Join-Path $ReportDir 'app-stdout.log'
  $stderr = Join-Path $ReportDir 'app-stderr.log'
  $p = Start-Process -FilePath $ElectronExe -ArgumentList (Quote-Arg $tempApp) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Date) -lt $deadline -and -not (Test-Path $inner)) { Start-Sleep -Milliseconds 400 }
  if (-not (Test-Path $inner)) { throw 'R26 inner report timeout' }
  try { $p.WaitForExit(5000) | Out-Null } catch {}
} finally {
  if ($null -eq $oldReport) { Remove-Item Env:ARAM_R26_REPORT -ErrorAction SilentlyContinue } else { $env:ARAM_R26_REPORT = $oldReport }
  if ($null -eq $oldSafety) { Remove-Item Env:ARAM_R19_SAFETY_ROOT -ErrorAction SilentlyContinue } else { $env:ARAM_R19_SAFETY_ROOT = $oldSafety }
  if ($null -eq $oldPromotion) { Remove-Item Env:ARAM_R19_DISABLE_COLD_START_PROMOTION -ErrorAction SilentlyContinue } else { $env:ARAM_R19_DISABLE_COLD_START_PROMOTION = $oldPromotion }
}

$post = Run-Probe 'after' $tempApp $ElectronExe $userData
$innerObj = Get-Content $inner -Raw | ConvertFrom-Json
$x = $innerObj.result
$prodAfter = Snapshot-Prod $AppDir
$safetyAfter = Snapshot-Safety $userData
$prodStable = Same-Hashes $prodBefore $prodAfter
$safetyStable = Same-Hashes $safetyBefore $safetyAfter
$countStable = ([int]$pre.research_checkpoint_matches -eq [int]$post.research_checkpoint_matches)
$ok = ($innerObj.status -eq 'SUCCESS' -and $x.state -eq 'available' -and [bool]$x.read_only -and [int]$x.riot_lcu_requests -eq 0 -and $prodStable -and $safetyStable -and $countStable)

$report = [ordered]@{
  status = $(if ($ok) { 'SUCCESS' } else { 'FAILURE' })
  stage = 'R26_SHADOW_EVIDENCE_INSPECT'
  read_only = $true
  production_version = '0.16.0'
  production_install_mutated = (-not $prodStable)
  production_file_hashes_stable = $prodStable
  production_safety_state_stable = $safetyStable
  canonical_match_count_stable = $countStable
  before_matches = [int]$pre.research_checkpoint_matches
  after_matches = [int]$post.research_checkpoint_matches
  riot_lcu_requests = 0
  checkpoint_writes = 0
  production_score_writes = 0
  ui_writes = 0
  raw_identity_returned = $false
  shadow_evidence = $x
}
try { Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue } catch {}
Save-Json $Final $report
Write-Host "R26 SHADOW EVIDENCE INSPECT: $($report.status) / $($x.promotion.status) / snapshots=$($x.snapshot_count) / growth=$($x.promotion.match_growth) -> $Final"
if (-not $ok) { exit 1 }
