@echo off
chcp 65001 >nul
title Konco-Sinauku Stopper
setlocal EnableDelayedExpansion

echo ===================================================================
echo             MENGHENTIKAN SERVICE KONCO-SINAUKU
echo ===================================================================

:: Hentikan proses yang mendengarkan port 8000 (Backend FastAPI)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Menghentikan Backend di Port 8000 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Hentikan proses yang mendengarkan port 5173 (Frontend Vite)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Menghentikan Frontend di Port 5173 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

:: Hentikan jendela terminal dengan judul Konco-Sinauku
taskkill /FI "WINDOWTITLE eq Konco-Sinauku - Backend*" /F /T >nul 2>&1
taskkill /FI "WINDOWTITLE eq Konco-Sinauku - Frontend*" /F /T >nul 2>&1

echo.
echo Semua service Konco-Sinauku telah berhasil dihentikan.
timeout /t 2 /nobreak >nul
