param(
  [string]$OutputRoot = (Join-Path $PWD 'dist-v0171-test'),
  [string]$ArtifactName = 'ARAM-Fearless-Draft-v0.17.1-TEST-windows-x64'
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$repo=(Resolve-Path $PWD).Path
$temp=Join-Path $env:RUNNER_TEMP 'aram-v0171-test-bundle'
if(Test-Path $temp){Remove-Item $temp -Recurse -Force}
New-Item -ItemType Directory -Force -Path $temp | Out-Null

$baseZip=Join-Path $temp 'aram-base-v0142.zip'
$baseUri='https://github.com/dbswo2910-oss/ARAM-Fearless-Draft/releases/download/v0.14.2/ARAM_Fearless_Draft_appbundle_v0.14.2.zip'
Invoke-WebRequest -Uri $baseUri -OutFile $baseZip
$baseHash=(Get-FileHash $baseZip -Algorithm SHA256).Hash.ToLowerInvariant()
if($baseHash -ne '2e076de26edb8f20a54bf0e07cfce9b6102f5f97617d8c5a3f65a03cb5671d04'){throw "base bundle SHA-256 mismatch: $baseHash"}

$extract=Join-Path $temp 'base-extracted'
Expand-Archive -Path $baseZip -DestinationPath $extract -Force
$candidates=Get-ChildItem $extract -Recurse -Filter package.json | Where-Object {
  (Test-Path (Join-Path $_.Directory.FullName 'index.html')) -and (Test-Path (Join-Path $_.Directory.FullName 'main.js'))
}
if(-not $candidates){throw 'could not locate base app root'}
$base=($candidates | Sort-Object { $_.FullName.Length } | Select-Object -First 1).Directory.FullName
$baseIndex=Join-Path $base 'index.html'
$sourceIndexHash=(Get-FileHash $baseIndex -Algorithm SHA256).Hash.ToLowerInvariant()
if($sourceIndexHash -ne '4a6cc26334e2dd7dd4aaf7ce5bd15315e47ad173baeb134ac40019d2e4906f32'){throw "v0.14.2 index SHA-256 mismatch: $sourceIndexHash"}

$fixtureDir=Join-Path $repo 'tools\stability\fixtures'
$fixtureMeta=Get-Content (Join-Path $fixtureDir 'index-v0142-to-v01549.fixture.json') -Raw | ConvertFrom-Json
$parts=@(Get-ChildItem $fixtureDir -Filter 'index-v0142-to-v01549.zst.b64.part*' | Sort-Object Name)
if($parts.Count -ne 7){throw "expected 7 index delta parts, found $($parts.Count)"}
$base64=(($parts | ForEach-Object { Get-Content $_.FullName -Raw }) -join '') -replace '\s',''
$patch=Join-Path $temp 'index-v0142-to-v01549.zstpatch'
[IO.File]::WriteAllBytes($patch,[Convert]::FromBase64String($base64))
$patchHash=(Get-FileHash $patch -Algorithm SHA256).Hash.ToLowerInvariant()
if($patchHash -ne '194d5ec7ed88418a468f9da1a5b04b0f5d604564813fae271cf30864b9582c24'){throw "index delta SHA-256 mismatch: $patchHash"}
& zstd --version | Out-Host
if($LASTEXITCODE -ne 0){throw 'zstd unavailable'}
$rebuilt=Join-Path $temp 'index-v01549-rebuilt.html'
& zstd -d "--patch-from=$baseIndex" $patch -o $rebuilt
if($LASTEXITCODE -ne 0){throw 'v0.15.49 index reconstruction failed'}
$targetIndexHash=(Get-FileHash $rebuilt -Algorithm SHA256).Hash.ToLowerInvariant()
if($targetIndexHash -ne '8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906'){throw "rebuilt index SHA-256 mismatch: $targetIndexHash"}
Move-Item $rebuilt $baseIndex -Force

$coreParts=@(Get-ChildItem $fixtureDir -Filter 'autosync-core-v01549.zst.b64.part*' | Sort-Object Name)
if($coreParts.Count -ne 4){throw "expected 4 autosync core parts, found $($coreParts.Count)"}
$coreBase64=(($coreParts | ForEach-Object { Get-Content $_.FullName -Raw }) -join '') -replace '\s',''
$coreZst=Join-Path $temp 'autosync-core-v01549.zst'
[IO.File]::WriteAllBytes($coreZst,[Convert]::FromBase64String($coreBase64))
$coreRestored=Join-Path $temp 'autosync-core-v01549.js'
& zstd -d $coreZst -o $coreRestored
if($LASTEXITCODE -ne 0){throw 'v0.15.49 AutoSync core reconstruction failed'}
$coreHash=(Get-FileHash $coreRestored -Algorithm SHA256).Hash.ToLowerInvariant()
if($coreHash -ne 'a9f206df445d06eefc99ae55f1ceb3a7a5ff108a40a8393fa75ec413d2c4aba6'){throw "restored AutoSync core SHA-256 mismatch: $coreHash"}
Move-Item $coreRestored (Join-Path $base 'autosync-core.js') -Force

$installed=Join-Path $temp 'installed-app'
node tools/stability/materialize-installed-app.js --base "$base" --out "$installed"
if($LASTEXITCODE -ne 0){throw 'installed app materialization failed'}
node tools/v0171-materialize-test-runtime.js "$installed"
if($LASTEXITCODE -ne 0){throw 'v0.17.1 test runtime overlay failed'}

$electronZip=Join-Path $temp 'electron-v38.7.2-win32-x64.zip'
$electronUri='https://github.com/electron/electron/releases/download/v38.7.2/electron-v38.7.2-win32-x64.zip'
$electronHashExpected='0401b898a8d83523694bd0afa6dc3035a54c57404a914725baa621c3378b5885'
Invoke-WebRequest -Uri $electronUri -OutFile $electronZip
$electronHash=(Get-FileHash $electronZip -Algorithm SHA256).Hash.ToLowerInvariant()
if($electronHash -ne $electronHashExpected){throw "Electron SHA-256 mismatch: $electronHash"}

if(Test-Path $OutputRoot){Remove-Item $OutputRoot -Recurse -Force}
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null
$bundle=Join-Path $OutputRoot $ArtifactName
Expand-Archive -Path $electronZip -DestinationPath $bundle -Force
$resources=Join-Path $bundle 'resources'
$appDst=Join-Path $resources 'app'
if(Test-Path $appDst){Remove-Item $appDst -Recurse -Force}
Copy-Item $installed $appDst -Recurse -Force
$electronExe=Join-Path $bundle 'electron.exe'
$testExe=Join-Path $bundle 'ARAM-Fearless-Draft-v0.17.1-TEST.exe'
if(!(Test-Path $electronExe)){throw 'electron.exe missing'}
Move-Item $electronExe $testExe -Force

$start=@'
@echo off
setlocal
cd /d "%~dp0"
set "TEST_ROOT=%~dp0test-profile"
set "APPDATA=%TEST_ROOT%\AppData\Roaming"
set "LOCALAPPDATA=%TEST_ROOT%\AppData\Local"
set "ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT=%TEST_ROOT%\aram-fearless-draft"
set "ARAM_UNIVERSAL_RATING_DB_ROOT=%TEST_ROOT%\aram-fearless-draft"
if not exist "%APPDATA%" mkdir "%APPDATA%"
if not exist "%LOCALAPPDATA%" mkdir "%LOCALAPPDATA%"
if not exist "%ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT%" mkdir "%ARAM_UNIVERSAL_SHADOW_USER_DATA_ROOT%"
"%~dp0ARAM-Fearless-Draft-v0.17.1-TEST.exe" --aram-v0171-test
endlocal
'@
Set-Content -Path (Join-Path $bundle 'START-v0.17.1-TEST.bat') -Value $start -Encoding Ascii

$readme=@'
v0.17.1 Rating Auto Sync TEST

1. Double-click START-v0.17.1-TEST.bat.
2. Start League Client and play one normal ARAM game (queue 450).
3. After the game, open the Rating/Research view and confirm the observed game count / latest update changes automatically.
4. Fully close this TEST app and launch it again.
5. Confirm the same match is NOT counted a second time.

This TEST bundle uses the local test-profile folder beside the executable and does not intentionally use the production Rating userData path.
Do not launch the EXE directly for the acceptance test; use START-v0.17.1-TEST.bat so the isolated environment variables are applied.
'@
Set-Content -Path (Join-Path $bundle 'README-v0.17.1-TEST.txt') -Value $readme -Encoding UTF8

$buildInfo=[ordered]@{
  status='SUCCESS'
  artifact=$ArtifactName
  git_sha=$env:GITHUB_SHA
  base_bundle_sha256=$baseHash
  restored_index_sha256=$targetIndexHash
  restored_autosync_core_sha256=$coreHash
  electron_version='38.7.2'
  electron_zip_sha256=$electronHash
  production_manifest_changed=$false
  production_updater_changed=$false
  test_user_data='test-profile/aram-fearless-draft'
  rating_db_root='test-profile/aram-fearless-draft'
}
$buildInfo | ConvertTo-Json | Set-Content -Path (Join-Path $bundle 'BUILD-INFO.json') -Encoding UTF8

Get-ChildItem $appDst -Recurse -Filter *.js | ForEach-Object {
  node --check $_.FullName
  if($LASTEXITCODE -ne 0){throw "syntax check failed: $($_.FullName)"}
}

$preload=Get-Content (Join-Path $appDst 'preload.js') -Raw
if($preload -notmatch '__ARAM_UNIVERSAL_RATING_HISTORY_HOOK_V3__'){throw 'V3 history hook missing from packaged preload'}
if($preload -notmatch '__ARAM_UNIVERSAL_RATING_AUTO_SYNC_V1__'){throw 'Rating auto-sync marker missing from packaged preload'}
if(!(Test-Path (Join-Path $bundle 'START-v0.17.1-TEST.bat'))){throw 'START bat missing'}
if(!(Test-Path $testExe)){throw 'test exe missing'}

Write-Host "V0.17.1 WINDOWS TEST BUNDLE BUILD: SUCCESS -> $bundle"
