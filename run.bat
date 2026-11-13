@echo off
chcp 65001 >nul
title Konco-Sinauku Launcher
setlocal EnableDelayedExpansion

cd /d "%~dp0"

echo ===================================================================
echo                  KONCO-SINAUKU LAUNCHER
echo ===================================================================
echo [1/4] Memeriksa environment sistem...

:: Tambahkan Node.js ke PATH jika belum terdaftar
set "PATH=%LOCALAPPDATA%\nodejs;%ProgramFiles%\nodejs;%PATH%"

:: Cek instalasi Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan di PATH. Silakan pasang Python 3.11+.
    pause
    exit /b 1
)

:: Cek instalasi npm / Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / npm tidak ditemukan di PATH. Silakan pasang Node.js.
    pause
    exit /b 1
)

:: Cek file .env
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] File .env tidak ditemukan, membuat dari .env.example...
        copy .env.example .env >nul
    ) else (
        echo [WARNING] File .env tidak ditemukan. Pastikan konfigurasi API sudah lengkap.
    )
)

echo [2/4] Menjalankan Backend FastAPI (Port 8000)...
start "Konco-Sinauku - Backend" cmd /k "title Konco-Sinauku - Backend && cd /d \"%~dp0backend\" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [3/4] Menjalankan Frontend Vite React (Port 5173)...
start "Konco-Sinauku - Frontend" cmd /k "title Konco-Sinauku - Frontend && set \"PATH=%LOCALAPPDATA%\nodejs;%ProgramFiles%\nodejs;%PATH%\" && cd /d \"%~dp0frontend\" && npm run dev"

echo [4/4] Menunggu inisialisasi server (sekitar 3 detik)...
timeout /t 3 /nobreak >nul

echo.
echo ===================================================================
echo   APLIKASI KONCO-SINAUKU BERHASIL DIJALANKAN!
echo ===================================================================
echo   - Frontend : http://localhost:5173
echo   - Backend  : http://127.0.0.1:8000
echo   - API Docs : http://127.0.0.1:8000/docs
echo ===================================================================
echo.
echo Membuka aplikasi di browser default...
start http://localhost:5173

echo.
echo [INFO] Backend dan Frontend berjalan di jendela terminal masing-masing.
echo Tekan sembarang tombol di jendela ini untuk MENGHENTIKAN seluruh server...
pause >nul

echo.
echo Menghentikan seluruh server...
call "%~dp0stop.bat"
