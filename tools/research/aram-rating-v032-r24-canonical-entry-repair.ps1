param(
  [switch]$Launch
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$local=$env:LOCALAPPDATA
$autoRoot=Join-Path $local 'ARAM Fearless Draft AutoUpdate'
$appDir=Join-Path $autoRoot 'appfiles'
$canonical=Join-Path $autoRoot 'launcher\ARAM_Fearless_Draft_Launcher_windows_x64.exe'
$activePath=Join-Path $autoRoot 'active-install.json'

function Read-Version([string]$dir){try{return [string]((Get-Content (Join-Path $dir 'package.json') -Raw|ConvertFrom-Json).version)}catch{return ''}}
function Read-JsonSafe([string]$p){try{if(Test-Path $p){return Get-Content $p -Raw|ConvertFrom-Json}}catch{};return $null}

$version=Read-Version $appDir
if($version -ne '0.16.0'){throw "R24 expects appfiles v0.16.0 before entrypoint repair; found '$version'"}
if(-not(Test-Path $canonical)){throw "Canonical launcher missing: $canonical"}
$active=Read-JsonSafe $activePath
if(-not $active -or [string]$active.version -ne '0.16.0'){throw 'active-install.json does not confirm v0.16.0'}

$w=New-Object -ComObject WScript.Shell
$roots=@(
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('StartMenu'),
  [Environment]::GetFolderPath('CommonStartMenu'),
  (Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar')
)|Where-Object{$_ -and (Test-Path $_)}|Select-Object -Unique

$repaired=@()
foreach($root in $roots){
  Get-ChildItem -LiteralPath $root -Filter *.lnk -Recurse -ErrorAction SilentlyContinue|ForEach-Object{
    try{
      $s=$w.CreateShortcut($_.FullName)
      $text=($_.FullName+' '+$s.TargetPath)
      if($text -match '(?i)aram' -and $text -match '(?i)fearless'){
        $old=$s.TargetPath
        if(-not [string]::Equals([IO.Path]::GetFullPath($old),[IO.Path]::GetFullPath($canonical),[StringComparison]::OrdinalIgnoreCase)){
          $s.TargetPath=$canonical
          $s.Arguments=''
          $s.WorkingDirectory=Split-Path $canonical
          $s.Save()
          $repaired+=[pscustomobject]@{shortcut=$_.FullName;previous=$old;current=$canonical}
        }
      }
    }catch{}
  }
}

$desktop=[Environment]::GetFolderPath('Desktop')
$desktopShortcut=Join-Path $desktop 'ARAM Fearless Draft.lnk'
$s=$w.CreateShortcut($desktopShortcut)
$s.TargetPath=$canonical
$s.Arguments=''
$s.WorkingDirectory=Split-Path $canonical
$s.Save()

$result=[ordered]@{
  status='SUCCESS'
  stage='R24_CANONICAL_ENTRY_REPAIR'
  appfiles_version=$version
  canonical_launcher=$canonical
  desktop_shortcut=$desktopShortcut
  repaired_shortcuts=$repaired
  launch_requested=[bool]$Launch
}
$result|ConvertTo-Json -Depth 10|Write-Host

if($Launch){Start-Process -FilePath $canonical -WorkingDirectory (Split-Path $canonical)}
