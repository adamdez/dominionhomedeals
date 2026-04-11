@echo off
setlocal
title AL Bridge Watchdog

:loop
curl -s http://127.0.0.1:3141/health >nul 2>&1
if %errorlevel% neq 0 (
    echo %date% %time% Bridge down -- restarting >> "%~dp0watchdog.log"
    call :kill_port 3141
    timeout /t 2 /nobreak >nul
    call :port_running 3141
    if %errorlevel% neq 0 (
        start "AL-Bridge" /min cmd /c "cd /d %~dp0 && node server.js > .bridge.out.log 2> .bridge.err.log"
    )
    timeout /t 5 /nobreak >nul
)
timeout /t 60 /nobreak >nul
goto loop

:port_running
netstat -ano | findstr /r /c:":%~1 .*LISTENING" >nul 2>&1
exit /b %errorlevel%

:kill_port
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%~1 .*LISTENING"') do (
    taskkill /PID %%p /T /F >nul 2>&1
)
exit /b 0
