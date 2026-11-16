# NOIR Chat - Windows environment diagnostic (READ-ONLY)
# Changes nothing on the PC. No admin rights required.
# Usage (PowerShell, inside the noir-chat folder):
#   powershell -ExecutionPolicy Bypass -File scripts\windows\diagnose.ps1
# Writes the report to diagnose-report.txt (contains no passwords or personal files).

$ErrorActionPreference = 'SilentlyContinue'
$report = New-Object System.Collections.Generic.List[string]
function Out-Line($s) { $report.Add($s); Write-Host $s }
function Section($t) { Out-Line ''; Out-Line "=== $t ===" }
function Cmd-Version($name, $argList) {
  $c = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $c) { Out-Line ("{0,-10}: NOT FOUND" -f $name); return $null }
  $v = (& $name @argList 2>&1 | Select-Object -First 1) -join ' '
  Out-Line ("{0,-10}: {1}  ({2})" -f $name, $v, $c.Source)
  return $v
}

Out-Line "NOIR diagnostic  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

Section 'OS / CPU / RAM'
$os = Get-CimInstance Win32_OperatingSystem
Out-Line "OS        : $($os.Caption) $($os.Version) build $($os.BuildNumber) ($($os.OSArchitecture))"
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
Out-Line "CPU       : $($cpu.Name.Trim()) ($($cpu.NumberOfCores)C/$($cpu.NumberOfLogicalProcessors)T)"
Out-Line ("RAM       : {0:N1} GB total, {1:N1} GB free" -f ($os.TotalVisibleMemorySize/1MB), ($os.FreePhysicalMemory/1MB))

Section 'Disk'
Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | ForEach-Object {
  Out-Line ("{0}  {1:N0} GB free / {2:N0} GB" -f $_.DeviceID, ($_.FreeSpace/1GB), ($_.Size/1GB))
}
Out-Line "Project   : $(Get-Location)"

Section 'GPU / Driver / CUDA'
$smi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if ($smi) {
  $q = nvidia-smi --query-gpu=name,driver_version,memory.total,memory.used,temperature.gpu --format=csv,noheader 2>&1
  Out-Line "nvidia-smi: $q"
  $cuda = (nvidia-smi 2>&1 | Select-String 'CUDA Version' | Select-Object -First 1)
  if ($cuda) { Out-Line ("CUDA      : " + ($cuda.ToString() -replace '.*CUDA Version:\s*([0-9.]+).*', '$1') + " (max supported by driver)") }
  Out-Line 'GPU processes:'
  nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader 2>&1 | ForEach-Object { Out-Line "  $_" }
} else {
  Out-Line 'nvidia-smi: NOT FOUND (NVIDIA driver missing or not on PATH)'
  Get-CimInstance Win32_VideoController | ForEach-Object { Out-Line "Video     : $($_.Name) driver $($_.DriverVersion)" }
}

Section 'Toolchain'
$nodeV = Cmd-Version 'node' @('-v')
Cmd-Version 'npm' @('-v') | Out-Null
Cmd-Version 'git' @('--version') | Out-Null
Cmd-Version 'python' @('--version') | Out-Null
Cmd-Version 'py' @('--version') | Out-Null
if ($nodeV -and ($nodeV -match 'v(\d+)\.')) {
  if ([int]$Matches[1] -lt 20) { Out-Line '!! Node.js 20 or newer required (22 LTS recommended)' }
}

Section 'Ollama'
Cmd-Version 'ollama' @('--version') | Out-Null
try {
  $ver = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/version' -TimeoutSec 3
  Out-Line "API       : running, version $($ver.version)"
  $tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
  Out-Line "Models    : $($tags.models.Count)"
  foreach ($m in $tags.models) {
    Out-Line ("  {0,-40} {1,6:N1} GB  {2} {3}" -f $m.name, ($m.size/1GB), $m.details.parameter_size, $m.details.quantization_level)
  }
  $ps = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/ps' -TimeoutSec 3
  foreach ($m in $ps.models) { Out-Line ("  loaded: {0} vram {1:N1} GB" -f $m.name, ($m.size_vram/1GB)) }
} catch { Out-Line 'API       : NOT RUNNING on 127.0.0.1:11434' }
Out-Line "OLLAMA_HOST=$env:OLLAMA_HOST  OLLAMA_MODELS=$env:OLLAMA_MODELS  OLLAMA_FLASH_ATTENTION=$env:OLLAMA_FLASH_ATTENTION  OLLAMA_KV_CACHE_TYPE=$env:OLLAMA_KV_CACHE_TYPE"

Section 'Other local engines (for later phases)'
try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8188/system_stats' -TimeoutSec 3 -UseBasicParsing; Out-Line "ComfyUI   : running on 8188" } catch { Out-Line 'ComfyUI   : not running on 8188' }
Cmd-Version 'tailscale' @('version') | Out-Null
Cmd-Version 'ffmpeg' @('-version') | Out-Null

Section 'Ports in use (relevant)'
foreach ($p in 3210, 11434, 8188, 8880, 9880, 443) {
  $c = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($c) {
    $proc = (Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue).ProcessName
    Out-Line ("{0,-6}: LISTEN {1}  ({2})" -f $p, $c.LocalAddress, $proc)
  } else { Out-Line ("{0,-6}: free" -f $p) }
}

Section 'Firewall profile'
Get-NetFirewallProfile | ForEach-Object { Out-Line ("{0,-8}: enabled={1}" -f $_.Name, $_.Enabled) }

$out = Join-Path (Get-Location) 'diagnose-report.txt'
$report | Set-Content -Path $out -Encoding UTF8
Write-Host ''
Write-Host "Report saved: $out"
