param(
  [string]$ReportDir=''
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$RepoRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
if(-not $ReportDir){$ReportDir=Join-Path $RepoRoot 'audit-output\r23-launch-source-forensic'}
New-Item -ItemType Directory -Force -Path $ReportDir|Out-Null
$Out=Join-Path $ReportDir 'r23-launch-source-forensic.json'
function Read-JsonSafe([string]$p){try{if(Test-Path $p){return Get-Content $p -Raw|ConvertFrom-Json}}catch{};return $null}
function Read-Version([string]$dir){try{return [string]((Get-Content (Join-Path $dir 'package.json') -Raw|ConvertFrom-Json).version)}catch{return ''}}
function File-Meta([string]$p){if(-not(Test-Path $p)){return [ordered]@{exists=$false;path=$p}};$i=Get-Item $p;[ordered]@{exists=$true;path=$p;length=if($i.PSIsContainer){0}else{[int64]$i.Length};last_write_utc=$i.LastWriteTimeUtc.ToString('o')}}
$local=$env:LOCALAPPDATA
$autoRoot=Join-Path $local 'ARAM Fearless Draft AutoUpdate'
$appDir=Join-Path $autoRoot 'appfiles'
$canonicalLauncher=Join-Path $autoRoot 'launcher\ARAM_Fearless_Draft_Launcher_windows_x64.exe'
$active=Read-JsonSafe (Join-Path $autoRoot 'active-install.json')
$promotion=Read-JsonSafe (Join-Path $autoRoot 'promotion-v0160.json')
$latestLauncher=Read-JsonSafe (Join-Path $autoRoot 'launcher-diagnostics\latest.json')
$latestBoot=Read-JsonSafe (Join-Path $autoRoot 'boot-diagnostics\latest-launcher.json')
$bootHistory=@();$bh=Join-Path $autoRoot 'boot-diagnostics\boot-history.ndjson';if(Test-Path $bh){foreach($line in Get-Content $bh -Tail 20){try{$bootHistory+=($line|ConvertFrom-Json)}catch{}}}
$shortcuts=@();if($env:OS -eq 'Windows_NT'){
  try{
    $w=New-Object -ComObject WScript.Shell
    $roots=@([Environment]::GetFolderPath('Desktop'),[Environment]::GetFolderPath('StartMenu'),[Environment]::GetFolderPath('CommonStartMenu'))|Where-Object{$_}
    foreach($r in $roots){Get-ChildItem -LiteralPath $r -Filter *.lnk -Recurse -ErrorAction SilentlyContinue|ForEach-Object{try{$s=$w.CreateShortcut($_.FullName);$text=($_.FullName+' '+$s.TargetPath);if($text -match '(?i)aram' -and $text -match '(?i)fearless'){$shortcuts+=[pscustomobject]@{shortcut=$_.FullName;target=$s.TargetPath;arguments=$s.Arguments;canonical=([string]::Equals([IO.Path]::GetFullPath($s.TargetPath),[IO.Path]::GetFullPath($canonicalLauncher),[StringComparison]::OrdinalIgnoreCase))}}}catch{}}}
  }catch{}
}
$executables=@();$scanRoots=@($autoRoot,(Join-Path $env:USERPROFILE 'Desktop'),(Join-Path $env:USERPROFILE 'Downloads'))|Where-Object{Test-Path $_};foreach($r in $scanRoots){Get-ChildItem $r -Filter *.exe -File -Recurse -Depth 3 -ErrorAction SilentlyContinue|Where-Object{$_.Name -match '(?i)aram' -and $_.Name -match '(?i)fearless'}|ForEach-Object{$executables+=[pscustomobject]@{path=$_.FullName;last_write_utc=$_.LastWriteTimeUtc.ToString('o');canonical=([string]::Equals([IO.Path]::GetFullPath($_.FullName),[IO.Path]::GetFullPath($canonicalLauncher),[StringComparison]::OrdinalIgnoreCase))}}}
$running=@();try{Get-CimInstance Win32_Process -ErrorAction SilentlyContinue|Where-Object{$_.Name -match '(?i)(electron|aram).*\.exe' -or $_.CommandLine -match '(?i)ARAM Fearless Draft'}|ForEach-Object{$running+=[pscustomobject]@{name=$_.Name;pid=$_.ProcessId;executable=$_.ExecutablePath;commandLine=$_.CommandLine}}}catch{}
$appVersion=Read-Version $appDir
$nonCanonicalShortcuts=@($shortcuts|Where-Object{-not $_.canonical})
$classification='CANONICAL_STARTUP_UNRESOLVED'
if($nonCanonicalShortcuts.Count -gt 0){$classification='NONCANONICAL_SHORTCUT_OR_LEGACY_ENTRYPOINT_DETECTED'}
elseif($latestLauncher -and [string]$latestLauncher.selectedVersion -eq '0.15.135' -and $promotion -and [string]$promotion.version -eq '0.16.0' -and [string]$promotion.status -eq 'success'){$classification='APPFILES_REVERTED_BEFORE_CANONICAL_LAUNCH'}
elseif($appVersion -eq '0.15.135' -and $active -and [string]$active.version -eq '0.16.0'){$classification='ACTIVE_POINTER_0160_BUT_APPFILES_015135'}
elseif($appVersion -eq '0.16.0'){$classification='APPFILES_CURRENTLY_0160'}
$report=[ordered]@{
  status='SUCCESS';stage='R23_LAUNCH_SOURCE_FORENSIC';observed_at=(Get-Date).ToUniversalTime().ToString('o');read_only=$true;classification=$classification;
  canonical_launcher=$canonicalLauncher;canonical_launcher_meta=File-Meta $canonicalLauncher;
  appfiles=[ordered]@{dir=$appDir;version=$appVersion;package=File-Meta (Join-Path $appDir 'package.json')};
  active_install=$active;promotion_v0160=$promotion;latest_launcher_diagnostic=$latestLauncher;latest_boot=$latestBoot;recent_boot_history=$bootHistory;
  shortcuts=$shortcuts;known_executables=$executables;running_processes=$running;
  interpretation=if($classification -eq 'NONCANONICAL_SHORTCUT_OR_LEGACY_ENTRYPOINT_DETECTED'){'At least one ARAM Fearless Draft shortcut targets a non-canonical executable. Repeated 0.15.135 -> 0.16.0 restarts can be caused by starting a stale bootstrap/legacy EXE instead of the promoted canonical launcher.'}elseif($classification -eq 'APPFILES_REVERTED_BEFORE_CANONICAL_LAUNCH'){'The canonical launcher itself saw 0.15.135 even though v0.16.0 launcher promotion had previously succeeded. Something reverted or rehydrated appfiles before launcher selection.'}elseif($classification -eq 'ACTIVE_POINTER_0160_BUT_APPFILES_015135'){'The persistent active-install pointer says 0.16.0 while canonical appfiles are 0.15.135, proving install-state divergence.'}else{'Use shortcut, boot, active-install and appfiles evidence together to identify the cold-start source.'}
}
$report|ConvertTo-Json -Depth 20|Set-Content $Out -Encoding UTF8
Write-Host "R23 LAUNCH SOURCE FORENSIC: $classification -> $Out"
