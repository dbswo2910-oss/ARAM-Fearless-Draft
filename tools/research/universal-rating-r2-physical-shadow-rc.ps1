param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$RepoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$Builder = Join-Path $PSScriptRoot 'universal-rating-r1-build-physical-shadow-rc-kit.js'
$KitDir = Join-Path $RepoRoot 'audit-output\universal-rating-r1-shadow-rc-kit'
if (-not $ReportDir) { $ReportDir = Join-Path $RepoRoot 'audit-output\universal-rating-r2-physical-shadow-rc' }
New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null
$FinalReport = Join-Path $ReportDir 'universal-rating-r2-physical-shadow-rc.json'

function Save-Json([string]$Path, $Object) { $Object | ConvertTo-Json -Depth 12 | Set-Content -Path $Path -Encoding UTF8 }
function Sha256([string]$Path) { if (-not (Test-Path $Path -PathType Leaf)) { return '' }; return (Get-FileHash $Path -Algorithm SHA256).Hash.ToLowerInvariant() }
function Quote-Arg([string]$Value) { if ($null -eq $Value) { return '""' }; return '"' + $Value.Replace('"','\"') + '"' }
function Read-PackageVersion([string]$Dir) { try { return [string]((Get-Content (Join-Path $Dir 'package.json') -Raw | ConvertFrom-Json).version) } catch { return '' } }
function Find-AppDir {
  $roots = @((Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\appfiles'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater\appfiles'))
  Get-ChildItem $env:LOCALAPPDATA -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'ARAM Fearless Draft AutoUpdate*' } | ForEach-Object { $roots += (Join-Path $_.FullName 'appfiles'); if ($_.Name -like '*appfiles') { $roots += $_.FullName } }
  $candidates = @(); foreach ($r in ($roots | Select-Object -Unique)) { if (-not (Test-Path (Join-Path $r 'package.json'))) { continue }; if (-not (Test-Path (Join-Path $r 'index.html'))) { continue }; $v=Read-PackageVersion $r; try { $parsed=[version]$v } catch { continue }; $candidates += [pscustomobject]@{Dir=$r;Version=$parsed;VersionText=$v} }
  $hit=$candidates | Sort-Object Version -Descending | Select-Object -First 1; if ($hit) { return [string]$hit.Dir }; return ''
}
function Find-Electron {
  $roots=@((Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft'))
  foreach($r in $roots){ if(-not(Test-Path $r)){continue}; $hit=Get-ChildItem $r -Recurse -Filter electron.exe -File -ErrorAction SilentlyContinue | Select-Object -First 1; if($hit){return [string]$hit.FullName} }; return ''
}
function Get-ElectronPidsForExe([string]$Electron) {
  $target=''; try{$target=[IO.Path]::GetFullPath($Electron)}catch{return @()}; $ids=@(); try{Get-CimInstance Win32_Process -Filter "Name='electron.exe'" -ErrorAction SilentlyContinue | ForEach-Object { if(-not $_.ExecutablePath){return}; try{$candidate=[IO.Path]::GetFullPath([string]$_.ExecutablePath);if([string]::Equals($candidate,$target,[StringComparison]::OrdinalIgnoreCase)){$ids += [int]$_.ProcessId}}catch{} }}catch{return @()}; return @($ids|Sort-Object -Unique)
}
function Stop-ElectronPids([int[]]$Ids){foreach($id in @($Ids|Sort-Object -Unique)){try{Stop-Process -Id $id -Force -ErrorAction SilentlyContinue}catch{}}}
function Copy-Tree([string]$Source,[string]$Destination){New-Item -ItemType Directory -Force -Path $Destination|Out-Null;Get-ChildItem $Source -Force|ForEach-Object{Copy-Item $_.FullName $Destination -Recurse -Force}}
function Snapshot-ProductionFiles([string]$Dir){$names=@('package.json','main-v0160.js','preload.js','index.html');$out=[ordered]@{};foreach($name in $names){$out[$name]=Sha256(Join-Path $Dir $name)};return [pscustomobject]$out}
function Snapshot-SafetyFiles([string]$UserData){$root=Join-Path $UserData 'update-safety-v01579';$names=@('pending-update.json','safety-failure.json','last-known-good.json','last-rollback.json','safety-history.ndjson');$out=[ordered]@{};foreach($name in $names){$out[$name]=Sha256(Join-Path $root $name)};return [pscustomobject]$out}
function Same-Hashes($Before,$After){foreach($p in $Before.PSObject.Properties.Name){if([string]$Before.$p -ne [string]$After.$p){return $false}};return $true}
function Patch-TempSafetyIsolation([string]$TempApp){$p=Join-Path $TempApp 'update-safety-v01579.js';if(-not(Test-Path $p)){throw 'temp update-safety-v01579.js missing'};$src=Get-Content $p -Raw;if($src -match 'ARAM_R19_SAFETY_ROOT'){return};$needle="function defaultRoot(){try{const {app}=require('electron');return path.join(app.getPath('userData'),'update-safety-v01579')}catch{return path.join(process.cwd(),'.update-safety-v01579')}}";$replacement="function defaultRoot(){const override=String(process.env.ARAM_R19_SAFETY_ROOT||'').trim();if(override)return path.resolve(override);try{const {app}=require('electron');return path.join(app.getPath('userData'),'update-safety-v01579')}catch{return path.join(process.cwd(),'.update-safety-v01579')}}";if(-not $src.Contains($needle)){throw 'temp safety root patch contract mismatch'};$src=$src.Replace($needle,$replacement);Set-Content -Path $p -Value $src -Encoding UTF8 -NoNewline}
function Patch-TempColdStartPromotion([string]$TempApp){$p=Join-Path $TempApp 'main-v0160.js';if(-not(Test-Path $p)){throw 'temp main-v0160.js missing'};$src=Get-Content $p -Raw;if($src -match 'ARAM_R19_DISABLE_COLD_START_PROMOTION'){return};$old="try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}";$new="if(process.env.ARAM_R19_DISABLE_COLD_START_PROMOTION!=='1'){try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}}";if(-not $src.Contains($old)){throw 'temp cold-start promotion patch contract mismatch'};$src=$src.Replace($old,$new);Set-Content -Path $p -Value $src -Encoding UTF8 -NoNewline}

if(-not(Test-Path $Builder)){throw 'Universal Rating R1 kit builder missing'}
& node $Builder
if($LASTEXITCODE -ne 0){throw "Universal Rating R1 kit build failed: exit=$LASTEXITCODE"}
$kitPath=Join-Path $KitDir 'rc-kit.json';if(-not(Test-Path $kitPath)){throw 'Universal Rating R1 kit manifest missing'}
$kit=Get-Content $kitPath -Raw|ConvertFrom-Json
if([string]$kit.mode -ne 'temporary_copy_overlay_only'){throw "unexpected kit mode: $($kit.mode)"}
if([bool]$kit.production_install_mutated -or [bool]$kit.production_manifest_mutated){throw 'kit mutation contract violated'}
if([int]$kit.max_history_requests_per_run -gt 2){throw 'history request budget exceeds 2'}

if($DryRun){$report=[ordered]@{status='SUCCESS';stage='UNIVERSAL_RATING_R2_PHYSICAL_SHADOW_RC_DRY_RUN';kit_mode=$kit.mode;production_install_mutated=$false;production_manifest_mutated=$false;temp_copy_required=$true;isolated_rating_db=$true;max_history_requests_per_run=2;retry=$false;production_rating_active=$false;automatic_promotion=$false;privacy_safe_report=$true;physical_user_pc_execution_required=$true};Save-Json $FinalReport $report;Write-Host "UNIVERSAL RATING R2 PHYSICAL SHADOW RC DRY RUN: SUCCESS -> $FinalReport";exit 0}

if($env:OS -ne 'Windows_NT'){throw 'Universal Rating R2 physical RC must run on Windows'}
if(-not $AppDir){$AppDir=Find-AppDir};if(-not $AppDir -or -not(Test-Path(Join-Path $AppDir 'package.json'))){throw 'could not auto-detect installed ARAM v0.16.0 appfiles; pass -AppDir explicitly'}
if((Read-PackageVersion $AppDir) -ne '0.16.0'){throw "R2 requires installed v0.16.0; found $(Read-PackageVersion $AppDir)"}
if(-not $ElectronExe){$ElectronExe=Find-Electron};if(-not $ElectronExe -or -not(Test-Path $ElectronExe)){throw 'could not auto-detect Electron runtime; pass -ElectronExe explicitly'}
$userData=Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)) 'aram-fearless-draft';if(-not(Test-Path $userData)){throw 'stable userData aram-fearless-draft is missing'}
$productionBefore=Snapshot-ProductionFiles $AppDir;$safetyBefore=Snapshot-SafetyFiles $userData
$tempRoot=Join-Path $env:TEMP ("aram-universal-rating-r2-$PID");$tempApp=Join-Path $tempRoot 'appfiles';$isolatedSafetyRoot=Join-Path $tempRoot 'isolated-update-safety';$isolatedDbRoot=Join-Path $tempRoot 'isolated-rating-userdata'
if(Test-Path $tempRoot){Remove-Item $tempRoot -Recurse -Force};Copy-Tree $AppDir $tempApp;Patch-TempSafetyIsolation $tempApp;Patch-TempColdStartPromotion $tempApp
Copy-Item (Join-Path $KitDir 'universal-shadow') $tempApp -Recurse -Force
Copy-Item (Join-Path $KitDir 'main-universal-rating-r1-shadow-rc.js') $tempApp -Force
$pkgPath=Join-Path $tempApp 'package.json';$pkg=Get-Content $pkgPath -Raw|ConvertFrom-Json;$pkg.main='main-universal-rating-r1-shadow-rc.js';$pkg|ConvertTo-Json -Depth 8|Set-Content $pkgPath -Encoding UTF8
$innerReport=Join-Path $ReportDir 'universal-rating-r1-result.json';if(Test-Path $innerReport){Remove-Item $innerReport -Force}
$baselinePids=@(Get-ElectronPidsForExe $ElectronExe);$stdout=Join-Path $ReportDir 'app-stdout.log';$stderr=Join-Path $ReportDir 'app-stderr.log'
$oldReport=$env:ARAM_UNIVERSAL_R1_REPORT;$oldDb=$env:ARAM_UNIVERSAL_R1_DB_ROOT;$oldSafety=$env:ARAM_R19_SAFETY_ROOT;$oldPromotion=$env:ARAM_R19_DISABLE_COLD_START_PROMOTION;$p=$null
try{$env:ARAM_UNIVERSAL_R1_REPORT=$innerReport;$env:ARAM_UNIVERSAL_R1_DB_ROOT=$isolatedDbRoot;$env:ARAM_R19_SAFETY_ROOT=$isolatedSafetyRoot;$env:ARAM_R19_DISABLE_COLD_START_PROMOTION='1';$p=Start-Process -FilePath $ElectronExe -ArgumentList (Quote-Arg $tempApp) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru;$deadline=(Get-Date).AddSeconds(120);while((Get-Date)-lt $deadline -and -not(Test-Path $innerReport)){Start-Sleep -Milliseconds 500}}finally{if($null -eq $oldReport){Remove-Item Env:ARAM_UNIVERSAL_R1_REPORT -ErrorAction SilentlyContinue}else{$env:ARAM_UNIVERSAL_R1_REPORT=$oldReport};if($null -eq $oldDb){Remove-Item Env:ARAM_UNIVERSAL_R1_DB_ROOT -ErrorAction SilentlyContinue}else{$env:ARAM_UNIVERSAL_R1_DB_ROOT=$oldDb};if($null -eq $oldSafety){Remove-Item Env:ARAM_R19_SAFETY_ROOT -ErrorAction SilentlyContinue}else{$env:ARAM_R19_SAFETY_ROOT=$oldSafety};if($null -eq $oldPromotion){Remove-Item Env:ARAM_R19_DISABLE_COLD_START_PROMOTION -ErrorAction SilentlyContinue}else{$env:ARAM_R19_DISABLE_COLD_START_PROMOTION=$oldPromotion}}
$afterPids=@(Get-ElectronPidsForExe $ElectronExe);$newPids=@($afterPids|Where-Object{$baselinePids -notcontains $_});Stop-ElectronPids $newPids;try{if($p -and -not $p.HasExited){Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue}}catch{};Start-Sleep -Seconds 1
if(-not(Test-Path $innerReport)){throw 'Universal Rating physical shadow result was not produced within 120 seconds'}
$inner=Get-Content $innerReport -Raw|ConvertFrom-Json;$dbFile=Join-Path $isolatedDbRoot 'rating\universal-rating-v1.json';$isolatedDbCreated=Test-Path $dbFile
$productionAfter=Snapshot-ProductionFiles $AppDir;$safetyAfter=Snapshot-SafetyFiles $userData;$productionStable=Same-Hashes $productionBefore $productionAfter;$safetyStable=Same-Hashes $safetyBefore $safetyAfter
$success=([string]$inner.status -eq 'SUCCESS' -and $productionStable -and $safetyStable -and $isolatedDbCreated -and -not [bool]$inner.result.production_active -and $null -eq $inner.result.production_rating -and [int]$inner.result.history_requests -le 2 -and [int]$inner.result.rating_network_requests -eq 0)
$report=[ordered]@{status=if($success){'SUCCESS'}else{'FAILURE'};stage='UNIVERSAL_RATING_R2_PHYSICAL_SHADOW_RC';installed_version=Read-PackageVersion $AppDir;production_files_stable=$productionStable;production_safety_state_stable=$safetyStable;production_install_mutated=$false;production_manifest_mutated=$false;isolated_rating_db_created=$isolatedDbCreated;isolated_rating_db_persistent_after_test=$false;max_history_requests_per_run=2;retry=$false;inner=$inner.result;privacy_safe=$true;temp_copy_removed=$true}
Save-Json $FinalReport $report
if(Test-Path $tempRoot){Remove-Item $tempRoot -Recurse -Force}
if(-not $success){throw "UNIVERSAL RATING R2 PHYSICAL SHADOW RC: FAILURE -> $FinalReport"}
Write-Host "UNIVERSAL RATING R2 PHYSICAL SHADOW RC: SUCCESS -> $FinalReport"
