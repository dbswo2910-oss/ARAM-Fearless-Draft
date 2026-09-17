param(
  [Parameter(Mandatory=$true)][string]$OutDir
)
$ErrorActionPreference='Stop'
$repo=(Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$zip=Join-Path $env:RUNNER_TEMP 'aram-base-v0142.zip'
$uri='https://github.com/dbswo2910-oss/ARAM-Fearless-Draft/releases/download/v0.14.2/ARAM_Fearless_Draft_appbundle_v0.14.2.zip'
Invoke-WebRequest -Uri $uri -OutFile $zip
$bundleHash=(Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant()
if($bundleHash -ne '2e076de26edb8f20a54bf0e07cfce9b6102f5f97617d8c5a3f65a03cb5671d04'){throw "base bundle SHA-256 mismatch: $bundleHash"}
$extract=Join-Path $env:RUNNER_TEMP 'aram-v0171-base-extracted'
Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue
Expand-Archive -Path $zip -DestinationPath $extract -Force
$candidates=Get-ChildItem $extract -Recurse -Filter package.json | Where-Object {
  (Test-Path (Join-Path $_.Directory.FullName 'index.html')) -and (Test-Path (Join-Path $_.Directory.FullName 'main.js'))
}
if(-not $candidates){throw 'could not locate base app root'}
$base=($candidates | Sort-Object {$_.FullName.Length} | Select-Object -First 1).Directory.FullName
$baseIndex=Join-Path $base 'index.html'
$sourceIndexHash=(Get-FileHash $baseIndex -Algorithm SHA256).Hash.ToLowerInvariant()
if($sourceIndexHash -ne '4a6cc26334e2dd7dd4aaf7ce5bd15315e47ad173baeb134ac40019d2e4906f32'){throw "v0.14.2 index SHA-256 mismatch: $sourceIndexHash"}
$fixtureDir=Join-Path $repo 'tools\stability\fixtures'
$parts=@(Get-ChildItem $fixtureDir -Filter 'index-v0142-to-v01549.zst.b64.part*' | Sort-Object Name)
if($parts.Count -ne 7){throw "expected 7 index delta parts, found $($parts.Count)"}
$base64=(($parts | ForEach-Object {Get-Content $_.FullName -Raw}) -join '') -replace '\s',''
$patch=Join-Path $env:RUNNER_TEMP 'index-v0142-to-v01549.zstpatch'
[IO.File]::WriteAllBytes($patch,[Convert]::FromBase64String($base64))
$patchHash=(Get-FileHash $patch -Algorithm SHA256).Hash.ToLowerInvariant()
if($patchHash -ne '194d5ec7ed88418a468f9da1a5b04b0f5d604564813fae271cf30864b9582c24'){throw "index delta SHA-256 mismatch: $patchHash"}
$rebuilt=Join-Path $env:RUNNER_TEMP 'index-v01549-rebuilt.html'
Remove-Item $rebuilt -Force -ErrorAction SilentlyContinue
& zstd -d "--patch-from=$baseIndex" $patch -o $rebuilt
if($LASTEXITCODE -ne 0){throw "v0.15.49 index reconstruction failed: $LASTEXITCODE"}
$targetIndexHash=(Get-FileHash $rebuilt -Algorithm SHA256).Hash.ToLowerInvariant()
if($targetIndexHash -ne '8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906'){throw "rebuilt index SHA-256 mismatch: $targetIndexHash"}
Move-Item $rebuilt $baseIndex -Force
$coreParts=@(Get-ChildItem $fixtureDir -Filter 'autosync-core-v01549.zst.b64.part*' | Sort-Object Name)
if($coreParts.Count -ne 4){throw "expected 4 autosync core parts, found $($coreParts.Count)"}
$coreBase64=(($coreParts | ForEach-Object {Get-Content $_.FullName -Raw}) -join '') -replace '\s',''
$coreZst=Join-Path $env:RUNNER_TEMP 'autosync-core-v01549.zst'
[IO.File]::WriteAllBytes($coreZst,[Convert]::FromBase64String($coreBase64))
$coreZstHash=(Get-FileHash $coreZst -Algorithm SHA256).Hash.ToLowerInvariant()
if($coreZstHash -ne 'abf29e3738ca5c1f81e5d1f0aaab0ae7df5bdb19da4a260536626734ed8dd80e'){throw "autosync fixture SHA-256 mismatch: $coreZstHash"}
$coreRestored=Join-Path $env:RUNNER_TEMP 'autosync-core-v01549.js'
Remove-Item $coreRestored -Force -ErrorAction SilentlyContinue
& zstd -d $coreZst -o $coreRestored
if($LASTEXITCODE -ne 0){throw "autosync core reconstruction failed: $LASTEXITCODE"}
$coreHash=(Get-FileHash $coreRestored -Algorithm SHA256).Hash.ToLowerInvariant()
if($coreHash -ne 'a9f206df445d06eefc99ae55f1ceb3a7a5ff108a40a8393fa75ec413d2c4aba6'){throw "autosync core SHA-256 mismatch: $coreHash"}
Move-Item $coreRestored (Join-Path $base 'autosync-core.js') -Force
node (Join-Path $repo 'tools\stability\materialize-installed-app.js') --base $base --out $OutDir
if($LASTEXITCODE -ne 0){throw 'installed app materialization failed'}
Write-Host "V0.17.1 TEST BASE READY: $OutDir"
