param(
  [Parameter(Mandatory=$true)][string]$DestinationRoot,
  [Parameter(Mandatory=$true)][string]$BasePathFile
)
$ErrorActionPreference = 'Stop'
$repo = (Get-Location).Path
$zip = Join-Path $DestinationRoot 'aram-base-v0142.zip'
$extract = Join-Path $DestinationRoot 'aram-base-extracted'
$uri = 'https://github.com/dbswo2910-oss/ARAM-Fearless-Draft/releases/download/v0.14.2/ARAM_Fearless_Draft_appbundle_v0.14.2.zip'
Invoke-WebRequest -Uri $uri -OutFile $zip
$bundleHash = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLowerInvariant()
if ($bundleHash -ne '2e076de26edb8f20a54bf0e07cfce9b6102f5f97617d8c5a3f65a03cb5671d04') { throw "base bundle SHA-256 mismatch: $bundleHash" }
if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
Expand-Archive -Path $zip -DestinationPath $extract -Force
$candidates = Get-ChildItem $extract -Recurse -Filter package.json | Where-Object {
  (Test-Path (Join-Path $_.Directory.FullName 'index.html')) -and (Test-Path (Join-Path $_.Directory.FullName 'main.js'))
}
if (-not $candidates) { throw 'could not locate base app root containing package.json/index.html/main.js' }
$base = ($candidates | Sort-Object { $_.FullName.Length } | Select-Object -First 1).Directory.FullName
$baseIndex = Join-Path $base 'index.html'
$sourceIndexHash = (Get-FileHash $baseIndex -Algorithm SHA256).Hash.ToLowerInvariant()
if ($sourceIndexHash -ne '4a6cc26334e2dd7dd4aaf7ce5bd15315e47ad173baeb134ac40019d2e4906f32') { throw "v0.14.2 index SHA-256 mismatch: $sourceIndexHash" }
$fixtureDir = Join-Path $repo 'tools\stability\fixtures'
$fixtureMeta = Get-Content (Join-Path $fixtureDir 'index-v0142-to-v01549.fixture.json') -Raw | ConvertFrom-Json
$parts = @(Get-ChildItem $fixtureDir -Filter 'index-v0142-to-v01549.zst.b64.part*' | Sort-Object Name)
if ($parts.Count -ne 7) { throw "expected 7 index delta parts, found $($parts.Count)" }
$base64 = (($parts | ForEach-Object { Get-Content $_.FullName -Raw }) -join '') -replace '\s',''
$patch = Join-Path $DestinationRoot 'index-v0142-to-v01549.zstpatch'
[IO.File]::WriteAllBytes($patch,[Convert]::FromBase64String($base64))
$patchHash = (Get-FileHash $patch -Algorithm SHA256).Hash.ToLowerInvariant()
if ($patchHash -ne '194d5ec7ed88418a468f9da1a5b04b0f5d604564813fae271cf30864b9582c24') { throw "index delta SHA-256 mismatch: $patchHash" }
& zstd --version | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'zstd unavailable' }
$rebuilt = Join-Path $DestinationRoot 'index-v01549-rebuilt.html'
& zstd -d "--patch-from=$baseIndex" $patch -o $rebuilt
if ($LASTEXITCODE -ne 0) { throw "v0.15.49 index reconstruction failed: $LASTEXITCODE" }
$targetIndexHash = (Get-FileHash $rebuilt -Algorithm SHA256).Hash.ToLowerInvariant()
if ($targetIndexHash -ne '8de7a8eb03e363b808439d48673a4808809d82db67bc1b7955e80414a8782906') { throw "rebuilt v0.15.49 index SHA-256 mismatch: $targetIndexHash" }
if ($fixtureMeta.target_index_sha256 -ne $targetIndexHash) { throw 'fixture target SHA mismatch' }
Move-Item -Path $rebuilt -Destination $baseIndex -Force
$coreParts = @(Get-ChildItem $fixtureDir -Filter 'autosync-core-v01549.zst.b64.part*' | Sort-Object Name)
if ($coreParts.Count -ne 4) { throw "expected 4 AutoSync fixture parts, found $($coreParts.Count)" }
$coreBase64 = (($coreParts | ForEach-Object { Get-Content $_.FullName -Raw }) -join '') -replace '\s',''
$coreZst = Join-Path $DestinationRoot 'autosync-core-v01549.zst'
[IO.File]::WriteAllBytes($coreZst,[Convert]::FromBase64String($coreBase64))
$coreZstHash = (Get-FileHash $coreZst -Algorithm SHA256).Hash.ToLowerInvariant()
if ($coreZstHash -ne 'abf29e3738ca5c1f81e5d1f0aaab0ae7df5bdb19da4a260536626734ed8dd80e') { throw "AutoSync fixture SHA mismatch: $coreZstHash" }
$coreRestored = Join-Path $DestinationRoot 'autosync-core-v01549.js'
& zstd -d $coreZst -o $coreRestored
if ($LASTEXITCODE -ne 0) { throw "AutoSync reconstruction failed: $LASTEXITCODE" }
$coreHash = (Get-FileHash $coreRestored -Algorithm SHA256).Hash.ToLowerInvariant()
if ($coreHash -ne 'a9f206df445d06eefc99ae55f1ceb3a7a5ff108a40a8393fa75ec413d2c4aba6') { throw "restored AutoSync SHA mismatch: $coreHash" }
Move-Item -Path $coreRestored -Destination (Join-Path $base 'autosync-core.js') -Force
Set-Content -Path $BasePathFile -Value $base -Encoding utf8
[ordered]@{status='SUCCESS';restored_installed_baseline='0.15.49';base_bundle_sha256=$bundleHash;index_sha256=$targetIndexHash;autosync_core_sha256=$coreHash;base_dir=$base} | ConvertTo-Json
