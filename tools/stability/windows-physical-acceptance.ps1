param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [int]$ExpectedResearchMatches = 159,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if (-not $ReportDir) { $ReportDir = Join-Path $PSScriptRoot 'physical-acceptance-output' }
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$reportPath = Join-Path $ReportDir 'physical-acceptance-report.json'
$probe = Join-Path $PSScriptRoot 'windows-real-state-probe.js'

function Save-Report($obj) { $obj | ConvertTo-Json -Depth 8 | Set-Content -Path $reportPath -Encoding UTF8 }
function Read-PackageVersion([string]$dir) { try { return [string]((Get-Content (Join-Path $dir 'package.json') -Raw | ConvertFrom-Json).version) } catch { return '' } }
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
    $candidates += [pscustomobject]@{Dir=$r;Version=$parsed;VersionText=$v}
  }
  return ($candidates | Sort-Object Version -Descending | Select-Object -First 1).Dir
}
function Find-Electron {
  $roots = @(
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate'),
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater'),
    (Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft')
  )
  foreach ($r in $roots) {
    foreach ($p in @((Join-Path $r 'electron.exe'),(Join-Path $r 'electron\electron.exe'),(Join-Path $r 'runtime\electron-v44.2.0-win32-x64\electron.exe'))) { if (Test-Path $p) { return $p } }
    if (Test-Path $r) { $hit=Get-ChildItem $r -Recurse -Filter electron.exe -File -ErrorAction SilentlyContinue | Select-Object -First 1; if ($hit) { return $hit.FullName } }
  }
  return ''
}
function Ensure-PinnedElectron {
  $existing = Find-Electron
  if ($existing) { return $existing }
  $root = Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\runtime'
  $target = Join-Path $root 'electron-v44.2.0-win32-x64'
  $zip = Join-Path $root 'electron-v44.2.0.zip'
  New-Item -ItemType Directory -Force -Path $root | Out-Null
  Invoke-WebRequest 'https://github.com/electron/electron/releases/download/v44.2.0/electron-v44.2.0-win32-x64.zip' -OutFile $zip -UseBasicParsing
  $hash=(Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($hash -ne '4021363e3090d67a144ebedb90765cf193b0e61f300c519c83f0174502a481da') { throw "Electron SHA-256 mismatch: $hash" }
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
  Expand-Archive $zip $target -Force
  Remove-Item $zip -Force
  $exe=Join-Path $target 'electron.exe'; if (-not (Test-Path $exe)) { throw 'electron.exe missing after extraction' }; return $exe
}
function Find-LeagueLockfile {
  $paths=@()
  foreach ($name in @('LeagueClientUx.exe','LeagueClient.exe')) {
    try { Get-CimInstance Win32_Process -Filter "Name='$name'" -ErrorAction SilentlyContinue | ForEach-Object { if ($_.ExecutablePath) { $paths += (Join-Path (Split-Path $_.ExecutablePath -Parent) 'lockfile') } } } catch {}
  }
  $paths += @('C:\Riot Games\League of Legends\lockfile',(Join-Path ${env:ProgramFiles} 'Riot Games\League of Legends\lockfile'))
  return ($paths | Select-Object -Unique | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1)
}
function Test-Lcu([string]$lockfile) {
  if (-not $lockfile) { return [ordered]@{lockfile_found=$false;connected=$false;http_status=$null;puuid_present=$false} }
  $raw=(Get-Content $lockfile -Raw).Trim(); $parts=$raw.Split(':'); if ($parts.Count -lt 5) { return [ordered]@{lockfile_found=$true;connected=$false;http_status=$null;puuid_present=$false} }
  $port=$parts[2]; $password=$parts[3]; $protocol=$parts[4]; $uri="${protocol}://127.0.0.1:${port}/lol-summoner/v1/current-summoner"
  $old=[System.Net.ServicePointManager]::ServerCertificateValidationCallback
  try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
    $req=[System.Net.HttpWebRequest]::Create($uri); $req.Method='GET'; $req.Timeout=5000; $req.Credentials=New-Object System.Net.NetworkCredential('riot',$password)
    $resp=$req.GetResponse(); $status=[int]$resp.StatusCode; $reader=New-Object IO.StreamReader($resp.GetResponseStream()); $text=$reader.ReadToEnd(); $reader.Close(); $resp.Close(); $obj=$text | ConvertFrom-Json
    return [ordered]@{lockfile_found=$true;connected=($status -eq 200);http_status=$status;puuid_present=([bool]$obj.puuid)}
  } catch { return [ordered]@{lockfile_found=$true;connected=$false;http_status=$null;puuid_present=$false} }
  finally { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = $old; $password=$null; $raw=$null }
}
function Run-StateProbe([string]$tag,[string]$app,[string]$electron,[string]$userData) {
  $out=Join-Path $ReportDir "state-$tag.json"; $stdout=Join-Path $ReportDir "state-$tag-stdout.log"; $stderr=Join-Path $ReportDir "state-$tag-stderr.log"
  $p=Start-Process -FilePath $electron -ArgumentList @($probe,'--app-dir',$app,'--user-data',$userData,'--report',$out) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -Wait -PassThru
  if ($p.ExitCode -ne 0 -or -not (Test-Path $out)) { throw "state probe $tag failed; exit=$($p.ExitCode)" }
  return (Get-Content $out -Raw | ConvertFrom-Json)
}

if ($DryRun) {
  if (-not (Test-Path $probe)) { throw 'windows-real-state-probe.js missing' }
  Save-Report ([ordered]@{status='SUCCESS';stage='PHYSICAL_ACCEPTANCE_HARNESS_DRY_RUN';privacy_safe=$true;raw_personal_data_in_report=$false;production_cutover=$false;legacy_removal=$false;expected_research_matches=$ExpectedResearchMatches})
  Write-Host "PHYSICAL ACCEPTANCE HARNESS DRY RUN: SUCCESS -> $reportPath"
  exit 0
}
if ($env:OS -ne 'Windows_NT') { throw 'physical acceptance must run on Windows' }
if (-not (Test-Path $probe)) { throw 'windows-real-state-probe.js missing beside this script' }
if (-not $AppDir) { $AppDir = Find-AppDir }
if (-not $AppDir -or -not (Test-Path (Join-Path $AppDir 'package.json'))) { throw 'could not auto-detect installed ARAM appfiles; pass -AppDir explicitly' }
if (-not $ElectronExe) { $ElectronExe = Ensure-PinnedElectron }
if (-not (Test-Path $ElectronExe)) { throw 'Electron runtime unavailable' }
$version=Read-PackageVersion $AppDir; if ($version -ne '0.15.135') { throw "physical gate expects Golden package 0.15.135, found $version" }
$canonicalPresent=Test-Path (Join-Path $AppDir 'canonical-shadow\src')
$userData=Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)) 'aram-fearless-draft'
if (-not (Test-Path $userData)) { throw 'stable userData aram-fearless-draft is missing' }
$lockfile=Find-LeagueLockfile; $lcu=Test-Lcu $lockfile
$pre=Run-StateProbe 'before' $AppDir $ElectronExe $userData
$stdout=Join-Path $ReportDir 'app-stdout.log'; $stderr=Join-Path $ReportDir 'app-stderr.log'
$p=Start-Process -FilePath $ElectronExe -ArgumentList @($AppDir,'--aram-launcher-cold-start') -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
Start-Sleep -Seconds 18
$alive=-not $p.HasExited; $exitCode=if($p.HasExited){$p.ExitCode}else{$null}
$stdoutText=if(Test-Path $stdout){Get-Content $stdout -Raw}else{''}; $stderrText=if(Test-Path $stderr){Get-Content $stderr -Raw}else{''}
$storageIdentityLogged=($stdoutText -match '\[v0\.15\.135 storage-root\]') -and ($stdoutText -match 'aram-fearless-draft')
$fatal=($stderrText -match 'App threw an error|index contract mismatch|UnhandledPromiseRejection')
$autosyncSignal=($stdoutText -match '(?i)autosync|league|lcu') -or ($stderrText -match '(?i)autosync|league|lcu')
if ($alive) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2
$post=Run-StateProbe 'after' $AppDir $ElectronExe $userData
$checkpointStable=($pre.research_checkpoint_sha256 -and $pre.research_checkpoint_sha256 -eq $post.research_checkpoint_sha256)
$countStable=([int]$pre.research_checkpoint_matches -eq $ExpectedResearchMatches -and [int]$post.research_checkpoint_matches -eq $ExpectedResearchMatches)
$success=$alive -and $storageIdentityLogged -and (-not $fatal) -and $canonicalPresent -and $lcu.connected -and $lcu.puuid_present -and $checkpointStable -and $countStable
$report=[ordered]@{
  status=if($success){'SUCCESS'}else{'FAILURE'}; stage='PHYSICAL_WINDOWS_LEAGUE_ACCEPTANCE'; privacy_safe=$true; raw_personal_data_in_report=$false; candidate_version=$version; canonical_shadow_payload_present=$canonicalPresent; production_cutover=$false; legacy_removal=$false;
  app_alive_after_18s=$alive; app_exit_code=$exitCode; stable_user_data_identity='aram-fearless-draft'; storage_identity_logged=$storageIdentityLogged; fatal_load_error=$fatal; autosync_or_lcu_log_signal=$autosyncSignal;
  league=[ordered]@{lockfile_found=$lcu.lockfile_found;lcu_connected=$lcu.connected;http_status=$lcu.http_status;puuid_present=$lcu.puuid_present;credentials_in_report=$false};
  research=[ordered]@{database='aram-rating-research-v03';checkpoint='checkpoint-v03';expected_matches=$ExpectedResearchMatches;before_matches=[int]$pre.research_checkpoint_matches;after_matches=[int]$post.research_checkpoint_matches;checkpoint_stable=$checkpointStable;checkpoint_digest_before=$pre.research_checkpoint_sha256;checkpoint_digest_after=$post.research_checkpoint_sha256};
  acceptance_scope='Physical Windows PC + real League Client/LCU + stable userData continuity for the isolated RC candidate. Canonical owners remain non-production/shadow; this report does not authorize production cutover.'
}
Save-Report $report
Write-Host "PHYSICAL WINDOWS ACCEPTANCE: $($report.status) -> $reportPath"
if (-not $success) { exit 1 }
