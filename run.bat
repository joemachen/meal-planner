@echo off
setlocal
:: To start without a terminal in the taskbar, double-click run.vbs instead.
title VibeMeal ^& House

:: Ensure logs directory exists
if not exist "logs" mkdir logs

:: Install dependencies if node_modules missing (minimal output)
if not exist "node_modules" (
  echo [VibeMeal] Installing dependencies...
  call npm install --loglevel=error --no-audit --no-fund
  if errorlevel 1 (
    echo [VibeMeal] Install failed. Check logs\errors.log
    exit /b 1
  )
  echo [VibeMeal] Rebuilding native modules for Electron...
  call npx electron-rebuild -f -w better-sqlite3
)

:: Start app (Vite + Electron); only critical status to console
echo [VibeMeal] Starting...
call npm run start
endlocal
