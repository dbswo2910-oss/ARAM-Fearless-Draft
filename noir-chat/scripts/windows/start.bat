@echo off
REM NOIR Chat launcher (Windows). Binds to 127.0.0.1 only - not reachable from other devices.
setlocal
cd /d "%~dp0\..\.."

where node >nul 2>nul || (echo [NOIR] Node.js not found. Install Node.js 22 LTS from https://nodejs.org & pause & exit /b 1)

if not exist node_modules (
  echo [NOIR] Installing dependencies...
  call npm ci || (echo [NOIR] npm ci failed & pause & exit /b 1)
)

if not exist .next\BUILD_ID (
  echo [NOIR] Building app...
  call npm run build || (echo [NOIR] build failed & pause & exit /b 1)
)

echo [NOIR] Checking Ollama on 127.0.0.1:11434 ...
powershell -NoProfile -Command "try { Invoke-RestMethod http://127.0.0.1:11434/api/version -TimeoutSec 2 | Out-Null; 'Ollama OK' } catch { 'WARNING: Ollama is not running. Start the Ollama app first.' }"

echo [NOIR] Starting on http://127.0.0.1:3210  (Ctrl+C to stop)
start "" http://127.0.0.1:3210
call npm run start
