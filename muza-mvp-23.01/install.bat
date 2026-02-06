
@echo off
REM Muza: Aura OS Installation Script for Windows
echo.
echo 🌀 Muza: Aura OS - Installation Script
echo ======================================
echo.

REM Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ❌ Node.js not found. Please install it from https://nodejs.org/
  pause
  exit /b 1
)
for /f "tokens=*" %%a in ('node -v') do set NODE_VERSION=%%a
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Check for npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
  echo ❌ npm not found. It should be installed with Node.js.
  pause
  exit /b 1
)
for /f "tokens=*" %%a in ('npm -v') do set NPM_VERSION=%%a
echo ✅ npm %NPM_VERSION% found
echo.

REM Install root dependencies
echo 📦 Installing main application dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
  echo ❌ Failed to install main dependencies.
  pause
  exit /b 1
)
echo ✅ Main dependencies installed
echo.

REM Install Electron dependencies
if exist "electron" (
  echo 📦 Installing Electron dependencies...
  cd electron
  call npm install
  if %errorlevel% neq 0 (
    echo ❌ Failed to install Electron dependencies.
    cd ..
    pause
    exit /b 1
  )
  cd ..
  echo ✅ Electron dependencies installed
) else (
  echo ⚠️  Electron directory not found. Skipping Electron setup.
)
echo.

echo 🎉 Installation complete!
echo.
echo To start the web development server, run:
echo   npm run dev
echo.
echo To start the desktop development app, run:
echo   npm run electron:dev
echo.
echo To build the desktop app for production, run:
echo   npm run electron:build:win
echo.
pause
