@echo off
echo 🚀 Starting JournalFX Headless MT5 Setup...

:: 1. Build the Docker Image
echo 📦 Building the Docker Image (This may take a few minutes)...
docker build -t jfx-mt5-headless .

if %errorlevel% neq 0 (
    echo ❌ Docker Build Failed! Ensure Docker Desktop is running.
    pause
    exit /b %errorlevel%
)

:: 2. Search for the installer file
set "INSTALLER="
if exist terminal64.exe set "INSTALLER=terminal64.exe"
if exist mt5setup.exe set "INSTALLER=mt5setup.exe"

if "%INSTALLER%"=="" (
    echo ❌ No MT5 installer found! Please place terminal64.exe or mt5setup.exe in this folder.
    pause
    exit /b 1
)

:: 3. Finish
echo ✅ Image built successfully!
echo 📡 You can now run 'docker-compose up -d' to start the bridge.
pause
