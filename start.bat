@echo off
setlocal
title Web SQL Studio
cd /d "%~dp0"

rem ===========================================================================
rem  Starts Web SQL Studio. On a new computer it first gets what is missing:
rem    1. Node.js 22.13+  The system Node.js is used when it is new enough;
rem                       otherwise a portable copy is downloaded into .\runtime
rem                       (no admin rights needed, nothing is installed system-wide).
rem    2. npm packages    Installed into .\node_modules when any is missing.
rem
rem  Where Node.js is downloaded from. If nodejs.org is blocked, any mirror with
rem  the same layout works, e.g. https://npmmirror.com/mirrors/node/latest-v22.x
rem ===========================================================================
set "NODE_DIST=https://nodejs.org/dist/latest-v22.x"
set "RUNTIME_DIR=%~dp0runtime"
set "WSS_BAT=%~f0"

if exist "%RUNTIME_DIR%\node.exe" set "PATH=%RUNTIME_DIR%;%PATH%"

call :node_at_least 22 13 && goto :packages
echo Node.js 22.13 or newer was not found - downloading a portable copy...
call :download_node && set "PATH=%RUNTIME_DIR%;%PATH%"
call :node_at_least 22 13 && goto :packages
call :node_at_least 18 17 || goto :no_node
echo.
echo WARNING: Node.js 22 could not be downloaded, so the older Node.js on this
echo          computer is used. SQLite databases will not open until Node.js 22.13+
echo          is available.
echo.

:packages
node -e "const fs=require('fs');const miss=Object.keys(require('./package.json').dependencies||{}).filter(d=>!fs.existsSync('node_modules/'+d+'/package.json'));if(miss.length){console.log('Missing packages: '+miss.join(', '));process.exit(1)}"
if not errorlevel 1 goto :start
echo Installing packages (only needed once)...
call npm install --omit=dev --no-fund --no-audit || goto :no_packages

:start
node server.js --open
pause
exit /b

rem ---------------------------------------------------------------------------

rem  Succeeds when "node" runs and is at least version %1.%2
:node_at_least
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>%1||a===%1&&b>=%2?0:1)" >nul 2>&1
exit /b %errorlevel%

rem  Runs the PowerShell part at the end of this file
:download_node
powershell -NoProfile -ExecutionPolicy Bypass -Command "$f=[IO.File]::ReadAllText($env:WSS_BAT);iex $f.Substring($f.LastIndexOf('#'+'#PS#'))"
exit /b %errorlevel%

:no_node
echo.
echo ERROR: Node.js is not available.
echo   - Check the internet connection or proxy and run start.bat again, or
echo   - install Node.js 22 LTS from https://nodejs.org and run start.bat again.
pause
exit /b 1

:no_packages
echo.
echo ERROR: The npm packages could not be installed.
echo   - Check the internet connection or proxy and run start.bat again, or
echo   - copy the node_modules folder from a computer where Web SQL Studio works.
pause
exit /b 1

##PS# Downloads a portable Node.js into %RUNTIME_DIR% (checked against the official SHA-256 list).
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  $dist = $env:NODE_DIST.TrimEnd('/')
  $cpu = if ($env:PROCESSOR_ARCHITEW6432) { $env:PROCESSOR_ARCHITEW6432 } else { $env:PROCESSOR_ARCHITECTURE }
  $arch = @{ AMD64 = 'x64'; ARM64 = 'arm64'; x86 = 'x86' }[$cpu]
  if (-not $arch) { throw "unsupported processor type $cpu" }
  $sums = (Invoke-WebRequest "$dist/SHASUMS256.txt" -UseBasicParsing).Content
  if ($sums -is [byte[]]) { $sums = [Text.Encoding]::ASCII.GetString($sums) }
  $m = [regex]::Match($sums, "(?m)^([0-9a-f]{64})\s+(node-v[\d.]+-win-$arch\.zip)\s*$")
  if (-not $m.Success) { throw "no Windows $arch build is listed at $dist" }
  $file = $m.Groups[2].Value
  # npm inside the zip has deep paths: unpack in a short folder so they stay under 260 characters.
  $work = Join-Path $env:TEMP ('wss-node-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
  New-Item -ItemType Directory $work | Out-Null
  $zip = Join-Path $work $file
  Write-Host "Downloading $dist/$file ..."
  Invoke-WebRequest "$dist/$file" -OutFile $zip -UseBasicParsing
  if ((Get-FileHash $zip -Algorithm SHA256).Hash -ne $m.Groups[1].Value) { throw 'checksum mismatch: the download is damaged or was altered' }
  Write-Host 'Extracting...'
  Add-Type -AssemblyName System.IO.Compression.FileSystem
  [IO.Compression.ZipFile]::ExtractToDirectory($zip, $work)
  $src = Join-Path $work ($file -replace '\.zip$', '')
  if (Test-Path $env:RUNTIME_DIR) { Remove-Item $env:RUNTIME_DIR -Recurse -Force }
  try { Move-Item $src $env:RUNTIME_DIR }
  catch {
    # Another drive, or a long target path: robocopy copes with both.
    robocopy $src $env:RUNTIME_DIR /E /MOVE /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "could not copy Node.js into $env:RUNTIME_DIR (robocopy code $LASTEXITCODE)" }
  }
  Write-Host "Node.js $($file.Split('-')[1]) is ready in $env:RUNTIME_DIR"
  exit 0
} catch {
  Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
} finally {
  if ($work -and (Test-Path $work)) { Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue }
}
