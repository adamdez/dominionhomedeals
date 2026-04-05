@echo off
title AL Bridge Watchdog
:loop
curl -s http://127.0.0.1:3141/health >nul 2>&1
if %errorlevel% neq 0 (
    echo %date% %time% Bridge down — restarting >> "%~dp0watchdog.log"
    start "" /B node "%~dp0server.js"
    timeout /t 5 /nobreak >nul
)
timeout /t 60 /nobreak >nul
goto loop
