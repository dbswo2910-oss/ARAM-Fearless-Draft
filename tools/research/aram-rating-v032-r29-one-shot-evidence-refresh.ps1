param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [switch]$Collect,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
if (-not $ReportDir) { $ReportDir = Join-Path $RepoRoot 'audit-output\r29-one-shot-evidence-refresh' }
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$R19 = Join-Path $PSScriptRoot 'aram-rating-v032-r19-physical-shadow-rc.ps1'
$R26 = Join-Path $PSScriptRoot 'aram-rating-v032-r26-shadow-evidence-inspect.ps1'
$R27 = Join-Path $PSScriptRoot 'aram-rating-v032-r27-selection-gate-inspect.ps1'
$Finalizer = Join-Path $PSScriptRoot 'aram-rating-v032-r29-finalize-evidence.js'
$Final = Join-Path $ReportDir 'r29-one-shot-evidence-refresh.json'
$Plan = Join-Path $ReportDir 'r29-final-evidence-plan.json'

function Save-Json([string]$Path, $Object) {
  $Object | ConvertTo-Json -Depth 18 | Set-Content -Path $Path -Encoding UTF8
}
function Invoke-ResearchScript([string]$Script, [string]$StepDir, [switch]$AsDryRun) {
  New-Item -ItemType Directory -Force -Path $StepDir | Out-Null
  $args = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$Script,'-ReportDir',$StepDir)
  if ($AppDir) { $args += @('-AppDir',$AppDir) }
  if ($ElectronExe) { $args += @('-ElectronExe',$ElectronExe) }
  if ($AsDryRun) { $args += '-DryRun' }
  & powershell.exe @args
  if ($LASTEXITCODE -ne 0) { throw "R29 child step failed: $([IO.Path]::GetFileName($Script)) exit=$LASTEXITCODE" }
}
function Has-RunningAramElectron {
  try {
    $rows = Get-CimInstance Win32_Process -Filter "Name='electron.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $rows) {
      $exe = [string]$p.ExecutablePath
      $cmd = [string]$p.CommandLine
      if ($exe -match 'ARAM Fearless Draft' -or $cmd -match 'ARAM Fearless Draft') { return $true }
    }
  } catch {}
  return $false
}

foreach ($required in @($R19,$R26,$R27,$Finalizer)) {
  if (-not (Test-Path $required -PathType Leaf)) { throw "R29 required file missing: $required" }
}

if ($DryRun) {
  Invoke-ResearchScript $R19 (Join-Path $ReportDir 'r19') -AsDryRun
  Invoke-ResearchScript $R26 (Join-Path $ReportDir 'r26') -AsDryRun
  Invoke-ResearchScript $R27 (Join-Path $ReportDir 'r27') -AsDryRun
  & node $Finalizer --self-test
  if ($LASTEXITCODE -ne 0) { throw "R29 finalizer self-test failed: exit=$LASTEXITCODE" }
  $dry = [ordered]@{
    status='SUCCESS'
    stage='R29_ONE_SHOT_EVIDENCE_REFRESH_DRY_RUN'
    collect_requested=[bool]$Collect
    production_activation_authorized=$false
    automatic_promotion=$false
    max_history_requests_if_collect=1
  }
  Save-Json $Final $dry
  Write-Host "R29 ONE-SHOT EVIDENCE REFRESH DRY RUN: SUCCESS -> $Final"
  exit 0
}

if ($env:OS -ne 'Windows_NT') { throw 'R29 real execution requires Windows' }
if ($Collect -and (Has-RunningAramElectron)) { throw 'R29 collection requires the ARAM app to be fully closed first' }

$steps = [ordered]@{}
if ($Collect) {
  $r19Dir = Join-Path $ReportDir 'r19'
  Invoke-ResearchScript $R19 $r19Dir
  $r19Report = Join-Path $r19Dir 'r19-physical-shadow-rc.json'
  $r19 = Get-Content $r19Report -Raw | ConvertFrom-Json
  $steps.r19 = [ordered]@{
    status=[string]$r19.status
    history_requests=[int]$r19.shadow.history_requests
    history_valid_matches=[int]$r19.shadow.history_valid_matches
    evidence_snapshots=[int]$r19.shadow.evidence_snapshots
    production_install_mutated=[bool]$r19.production_install_mutated
    production_safety_state_stable=[bool]$r19.production_safety_state_stable
  }
}

$r26Dir = Join-Path $ReportDir 'r26'
Invoke-ResearchScript $R26 $r26Dir
$r26 = Get-Content (Join-Path $r26Dir 'r26-shadow-evidence-inspect.json') -Raw | ConvertFrom-Json
$steps.r26 = [ordered]@{
  status=[string]$r26.status
  snapshot_count=[int]$r26.shadow_evidence.snapshot_count
  promotion_status=[string]$r26.shadow_evidence.promotion.status
  match_growth=[int]$r26.shadow_evidence.promotion.match_growth
}

$r27Dir = Join-Path $ReportDir 'r27'
Invoke-ResearchScript $R27 $r27Dir
$r27Path = Join-Path $r27Dir 'r27-selection-gate-inspect.json'
$r27 = Get-Content $r27Path -Raw | ConvertFrom-Json
$steps.r27 = [ordered]@{
  status=[string]$r27.status
  selection_status=[string]$r27.selection_gate.selection_status
  observed_leader=[string]$r27.selection_gate.observed_leader
  observed_runner_up=[string]$r27.selection_gate.observed_runner_up
  delta_matches=[int]$r27.selection_gate.delta_matches
  augmented_matches=[int]$r27.selection_gate.augmented_matches
}

& node $Finalizer --input $r27Path --output $Plan
if ($LASTEXITCODE -ne 0) { throw "R29 finalizer failed: exit=$LASTEXITCODE" }
$planEnvelope = Get-Content $Plan -Raw | ConvertFrom-Json
$p = $planEnvelope.final_evidence_plan

$report = [ordered]@{
  status='SUCCESS'
  stage='R29_ONE_SHOT_EVIDENCE_REFRESH'
  collect_requested=[bool]$Collect
  max_history_requests=if($Collect){1}else{0}
  steps=$steps
  classification=[string]$p.classification
  next_trigger=[string]$p.next_trigger
  structural_blockers=$p.structural_blockers
  model_evidence_blockers=$p.model_evidence_blockers
  observed_leader=[string]$planEnvelope.observed_leader
  observed_runner_up=[string]$planEnvelope.observed_runner_up
  selection_status=[string]$planEnvelope.selection_status
  production_activation_authorized=$false
  automatic_promotion=$false
  plan_report=$Plan
}
Save-Json $Final $report
Write-Host "R29 ONE-SHOT EVIDENCE REFRESH: SUCCESS / $($report.classification) / selection=$($report.selection_status) / leader=$($report.observed_leader) -> $Final"
