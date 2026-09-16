param(
  [string]$AppDir = '',
  [string]$ElectronExe = '',
  [string]$ReportDir = '',
  [switch]$DryRun
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$RepoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$Builder=Join-Path $PSScriptRoot 'aram-rating-v032-r26-build-shadow-evidence-inspector.js'
$KitDir=Join-Path $RepoRoot 'audit-output\r26-shadow-evidence-inspector-kit'
$Probe=Join-Path $RepoRoot 'tools\stability\windows-real-state-probe.js'
if(-not $ReportDir){$ReportDir=Join-Path $RepoRoot 'audit-output\r26-shadow-evidence-inspect'}
New-Item -ItemType Directory -Force -Path $ReportDir|Out-Null
$Final=Join-Path $ReportDir 'r26-shadow-evidence-inspect.json'
function Save-Json($Path,$Obj){$Obj|ConvertTo-Json -Depth 16|Set-Content -Path $Path -Encoding UTF8}
function Sha256($Path){if(-not(Test-Path $Path -PathType Leaf)){return ''};(Get-FileHash $Path -Algorithm SHA256).Hash.ToLowerInvariant()}
function Quote-Arg([string]$v){if($null-eq$v){return '""'};'"'+$v.Replace('"','\"')+'"'}
function Read-Version($Dir){try{[string]((Get-Content (Join-Path $Dir 'package.json') -Raw|ConvertFrom-Json).version}catch{''}}
function Find-AppDir{
  $roots=@((Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate\appfiles'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater\appfiles'))
  $rows=@();foreach($r in($roots|Select-Object -Unique)){if(Test-Path (Join-Path $r 'package.json')){try{$v=[version](Read-Version $r);$rows+=[pscustomobject]@{Dir=$r;Version=$v}}catch{}}}
  $x=$rows|Sort-Object Version -Descending|Select-Object -First 1;if($x){[string]$x.Dir}else{''}
}
function Find-Electron{
  foreach($r in @((Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdate'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft AutoUpdater'),(Join-Path $env:LOCALAPPDATA 'ARAM Fearless Draft'))){if(Test-Path $r){$x=Get-ChildItem $r -Recurse -Filter electron.exe -File -ErrorAction SilentlyContinue|Select-Object -First 1;if($x){return[string]$x.FullName}}};''
}
function Copy-Tree($Source,$Dest){New-Item -ItemType Directory -Force -Path $Dest|Out-Null;Get-ChildItem $Source -Force|ForEach-Object{Copy-Item $_.FullName $Dest -Recurse -Force}}
function Snapshot-Prod($Dir){$o=[ordered]@{};foreach($n in @('package.json','main-v0160.js','preload.js','index.html')){$o[$n]=Sha256(Join-Path $Dir $n)};[pscustomobject]$o}
function Snapshot-Safety($UserData){$root=Join-Path $UserData 'update-safety-v01579';$o=[ordered]@{};foreach($n in @('pending-update.json','safety-failure.json','last-known-good.json','last-rollback.json','safety-history.ndjson')){$o[$n]=Sha256(Join-Path $root $n)};[pscustomobject]$o}
function Same-Hashes($A,$B){foreach($n in $A.PSObject.Properties.Name){if([string]$A.$n-ne[string]$B.$n){return $false}};$true}
function Patch-Safety($TempApp){$p=Join-Path $TempApp 'update-safety-v01579.js';$s=Get-Content $p -Raw;if($s-match'ARAM_R19_SAFETY_ROOT'){return};$old="function defaultRoot(){try{const {app}=require('electron');return path.join(app.getPath('userData'),'update-safety-v01579')}catch{return path.join(process.cwd(),'.update-safety-v01579')}}";$new="function defaultRoot(){const override=String(process.env.ARAM_R19_SAFETY_ROOT||'').trim();if(override)return path.resolve(override);try{const {app}=require('electron');return path.join(app.getPath('userData'),'update-safety-v01579')}catch{return path.join(process.cwd(),'.update-safety-v01579')}}";if(-not$s.Contains($old)){throw 'R26 safety isolation patch contract mismatch'};$s=$s.Replace($old,$new);Set-Content $p $s -Encoding UTF8 -NoNewline}
function Patch-Promotion($TempApp){$p=Join-Path $TempApp 'main-v0160.js';$s=Get-Content $p -Raw;if($s-match'ARAM_R19_DISABLE_COLD_START_PROMOTION'){return};$old="try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}";$new="if(process.env.ARAM_R19_DISABLE_COLD_START_PROMOTION!=='1'){try{require('./cold-start-promotion-v0160').install({appDir:__dirname,version:VERSION})}catch(e){try{console.warn('[v0.16.0 cold-start promotion] install failed:',e?.message||String(e))}catch{}}}";if(-not$s.Contains($old)){throw 'R26 cold-start promotion patch contract mismatch'};$s=$s.Replace($old,$new);Set-Content $p $s -Encoding UTF8 -NoNewline}
function Run-Probe($Tag,$App,$Electron,$UserData){$out=Join-Path $ReportDir "state-$Tag.json";$stdout=Join-Path $ReportDir "state-$Tag-stdout.log";$stderr=Join-Path $ReportDir "state-$Tag-stderr.log";$args=('{0} --app-dir {1} --user-data {2} --report {3}'-f(Quote-Arg $Probe),(Quote-Arg $App),(Quote-Arg $UserData),(Quote-Arg $out));$p=Start-Process $Electron -ArgumentList $args -RedirectStandardOutput $stdout -RedirectStandardError $stderr -Wait -PassThru;if($p.ExitCode-ne0-or-not(Test-Path $out)){throw "R26 state probe $Tag failed"};Get-Content $out -Raw|ConvertFrom-Json}
& node $Builder;if($LASTEXITCODE-ne0){throw 'R26 kit build failed'}
if($DryRun){$r=[ordered]@{status='SUCCESS';stage='R26_SHADOW_EVIDENCE_INSPECT_DRY_RUN';read_only=$true;riot_lcu_requests=0;checkpoint_writes=0;production_writes=0;temp_copy_required=$true};Save-Json $Final $r;Write-Host "R26 SHADOW EVIDENCE INSPECT DRY RUN: SUCCESS -> $Final";exit 0}
if($env:OS-ne'Windows_NT'){throw 'R26 requires Windows'}
if(-not$AppDir){$AppDir=Find-AppDir};if(-not$AppDir-or(Read-Version $AppDir)-ne'0.16.0'){throw "R26 requires installed v0.16.0; found $(Read-Version $AppDir)"}
if(-not$ElectronExe){$ElectronExe=Find-Electron};if(-not$ElectronExe){throw 'R26 could not detect electron.exe'}
$userData=Join-Path ([Environment]::GetFolderPath([Environment+SpecialFolder]::ApplicationData)) 'aram-fearless-draft'
$prodBefore=Snapshot-Prod $AppDir;$safetyBefore=Snapshot-Safety $userData
$tempRoot=Join-Path $env:TEMP "aram-r26-shadow-evidence-$PID";$tempApp=Join-Path $tempRoot 'appfiles';$isolatedSafety=Join-Path $tempRoot 'isolated-update-safety';if(Test-Path $tempRoot){Remove-Item $tempRoot -Recurse -Force};Copy-Tree $AppDir $tempApp;Patch-Safety $tempApp;Patch-Promotion $tempApp
Copy-Item (Join-Path $KitDir 'r26-shadow-evidence-renderer.js') $tempApp -Force;Copy-Item (Join-Path $KitDir 'main-r26-shadow-evidence.js') $tempApp -Force
$pkgp=Join-Path $tempApp 'package.json';$pkg=Get-Content $pkgp -Raw|ConvertFrom-Json;$pkg.main='main-r26-shadow-evidence.js';$pkg|ConvertTo-Json -Depth 8|Set-Content $pkgp -Encoding UTF8
$pre=Run-Probe 'before' $tempApp $ElectronExe $userData
$inner=Join-Path $ReportDir 'r26-inner.json';Remove-Item $inner -Force -ErrorAction SilentlyContinue
$oldR=$env:ARAM_R26_REPORT;$oldS=$env:ARAM_R19_SAFETY_ROOT;$oldP=$env:ARAM_R19_DISABLE_COLD_START_PROMOTION
try{$env:ARAM_R26_REPORT=$inner;$env:ARAM_R19_SAFETY_ROOT=$isolatedSafety;$env:ARAM_R19_DISABLE_COLD_START_PROMOTION='1';$stdout=Join-Path $ReportDir 'app-stdout.log';$stderr=Join-Path $ReportDir 'app-stderr.log';$p=Start-Process $ElectronExe -ArgumentList (Quote-Arg $tempApp) -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru;$deadline=(Get-Date).AddSeconds(60);while((Get-Date)-lt$deadline-and-not(Test-Path $inner)){Start-Sleep -Milliseconds 400};if(-not(Test-Path $inner)){throw 'R26 inner report timeout'};try{$p.WaitForExit(5000)|Out-Null}catch{}}finally{if($null-eq$oldR){Remove-Item Env:ARAM_R26_REPORT -ErrorAction SilentlyContinue}else{$env:ARAM_R26_REPORT=$oldR};if($null-eq$oldS){Remove-Item Env:ARAM_R19_SAFETY_ROOT -ErrorAction SilentlyContinue}else{$env:ARAM_R19_SAFETY_ROOT=$oldS};if($null-eq$oldP){Remove-Item Env:ARAM_R19_DISABLE_COLD_START_PROMOTION -ErrorAction SilentlyContinue}else{$env:ARAM_R19_DISABLE_COLD_START_PROMOTION=$oldP}}
$post=Run-Probe 'after' $tempApp $ElectronExe $userData
$innerObj=Get-Content $inner -Raw|ConvertFrom-Json;$x=$innerObj.result
$prodAfter=Snapshot-Prod $AppDir;$safetyAfter=Snapshot-Safety $userData;$prodStable=Same-Hashes $prodBefore $prodAfter;$safetyStable=Same-Hashes $safetyBefore $safetyAfter;$countStable=([int]$pre.research_checkpoint_matches-eq[int]$post.research_checkpoint_matches)
$ok=($innerObj.status-eq'SUCCESS'-and$x.state-eq'available'-and[bool]$x.read_only-and[int]$x.riot_lcu_requests-eq0-and$prodStable-and$safetyStable-and$countStable)
$report=[ordered]@{status=if($ok){'SUCCESS'}else{'FAILURE'};stage='R26_SHADOW_EVIDENCE_INSPECT';read_only=$true;production_version='0.16.0';production_install_mutated=(-not$prodStable);production_file_hashes_stable=$prodStable;production_safety_state_stable=$safetyStable;canonical_match_count_stable=$countStable;before_matches=[int]$pre.research_checkpoint_matches;after_matches=[int]$post.research_checkpoint_matches;riot_lcu_requests=0;checkpoint_writes=0;production_score_writes=0;ui_writes=0;raw_identity_returned=$false;shadow_evidence=$x}
try{Remove-Item $tempRoot -Recurse -Force -ErrorAction SilentlyContinue}catch{}
Save-Json $Final $report
Write-Host "R26 SHADOW EVIDENCE INSPECT: $($report.status) / $($x.promotion.status) / snapshots=$($x.snapshot_count) / growth=$($x.promotion.match_growth) -> $Final"
if(-not$ok){exit 1}
