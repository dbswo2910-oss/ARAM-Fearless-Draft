param(
  [Parameter(Mandatory=$true)][string]$AppDir,
  [Parameter(Mandatory=$true)][string]$ElectronExe,
  [Parameter(Mandatory=$true)][string]$ElectronSha256,
  [string]$OutputDir = "audit-output\stability\post-activation\windows"
)
$ErrorActionPreference = 'Stop'
$outDir = Join-Path $PWD $OutputDir
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$roaming = [Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)
$stable = Join-Path $roaming 'aram-fearless-draft'
if (Test-Path $stable) { Remove-Item $stable -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stable | Out-Null
$marker = Join-Path $stable 'v0160-post-activation-persistence.marker'

function Run-Cycle([int]$cycle) {
  $stdout = Join-Path $outDir "cycle-$cycle-stdout.log"
  $stderr = Join-Path $outDir "cycle-$cycle-stderr.log"
  $before = @(Get-Process electron -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
  $parent = Start-Process -FilePath $ElectronExe -ArgumentList @("$AppDir",'--aram-v0160-post-activation') -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  Start-Sleep -Seconds 15
  $after = @(Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $before -notcontains $_.Id })
  $alive = ($after.Count -gt 0) -or (-not $parent.HasExited)
  $outText = if (Test-Path $stdout) { Get-Content $stdout -Raw } else { '' }
  $errText = if (Test-Path $stderr) { Get-Content $stderr -Raw } else { '' }
  $storage = ($outText -match '\[v0\.16\.0 storage-root\]') -and ($outText -match 'aram-fearless-draft')
  $fatal = ($errText -match 'App threw an error') -or ($errText -match 'Cannot find module') -or ($errText -match 'canonical owner registry is not production-active')
  $stdoutBytes = if (Test-Path $stdout) { (Get-Item $stdout).Length } else { 0 }
  $stderrBytes = if (Test-Path $stderr) { (Get-Item $stderr).Length } else { 0 }
  foreach ($proc in $after) { try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch {} }
  try { if (-not $parent.HasExited) { Stop-Process -Id $parent.Id -Force -ErrorAction SilentlyContinue } } catch {}
  return [ordered]@{
    cycle = $cycle
    alive_after_15s = $alive
    storage_identity_logged = $storage
    fatal_load_error = $fatal
    stdout_bytes = $stdoutBytes
    stderr_bytes = $stderrBytes
  }
}

$one = Run-Cycle 1
if (-not $one.alive_after_15s -or -not $one.storage_identity_logged -or $one.fatal_load_error) {
  throw "v0.16 Windows cycle 1 failed: $($one | ConvertTo-Json -Compress)"
}
Set-Content -Path $marker -Value 'persist-v0160' -Encoding utf8
$two = Run-Cycle 2
$markerPersisted = (Test-Path $marker) -and ((Get-Content $marker -Raw) -match 'persist-v0160')
$canonicalRegistry = Test-Path (Join-Path $AppDir 'canonical\src\core\owner-registry.js')
$success = $two.alive_after_15s -and $two.storage_identity_logged -and (-not $two.fatal_load_error) -and $markerPersisted -and $canonicalRegistry
$report = [ordered]@{
  status = if ($success) { 'SUCCESS' } else { 'FAILURE' }
  stage = 'V0160_POST_ACTIVATION_WINDOWS_INSTALLED'
  candidate_version = '0.16.0'
  windows_runner = $true
  electron_version = '38.7.2'
  electron_runtime_sha256 = $ElectronSha256
  stable_user_data_identity = 'aram-fearless-draft'
  canonical_registry_materialized = $canonicalRegistry
  restart_cycles = 2
  persistence_marker_preserved = $markerPersisted
  cycle_1 = $one
  cycle_2 = $two
  production_manifest_mutated = $false
  real_league_client_tested = $false
  real_research_159_retest = $false
  physical_evidence_reused_as_prior_release_evidence = $true
  scope = 'GitHub-hosted Windows exact candidate artifact cold-start + restart persistence; physical League/LCU and exact Research 159 evidence remains the separately validated user-PC gate.'
}
$report | ConvertTo-Json -Depth 6 | Set-Content (Join-Path $outDir 'windows-installed-report.json') -Encoding utf8
if (-not $success) { throw "v0.16 Windows installed acceptance failed: $($report | ConvertTo-Json -Compress -Depth 6)" }
Write-Host 'V0.16 POST-ACTIVATION WINDOWS INSTALLED: SUCCESS'
