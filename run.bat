@echo off
setlocal EnableDelayedExpansion
title Konco-Sinauku Launcher

cd /d "%~dp0"

echo ===================================================================
echo                  KONCO-SINAUKU LAUNCHER
echo ===================================================================

:: 1. Daftarkan path Node.js dan Python umum ke PATH sesi ini
set "PATH=%LOCALAPPDATA%\nodejs;%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\Python\Python311;%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python310;%ProgramFiles%\Python311;%ProgramFiles%\Python312;%PATH%"

:: 2. Cek ketersediaan Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python tidak ditemukan di PATH. Silakan pasang Python 3.11+.
    pause
    exit /b 1
)

:: 3. Cek ketersediaan npm / Node.js
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm atau Node.js tidak ditemukan di PATH. Silakan pasang Node.js.
    pause
    exit /b 1
)

:: 4. Validasi keberadaan file konfigurasi .env
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] File .env tidak ditemukan, menduplikasi otomatis dari .env.example...
        copy .env.example .env >nul
    ) else (
        echo [WARNING] File .env tidak ditemukan. Pastikan konfigurasi environment lengkap.
    )
)

:: 5. Bersihkan port 8000 dan 5173 jika masih ada proses sebelumnya yang menggantung
echo Membersihkan port 8000 dan 5173 jika masih terpakai...
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
)

:: 6. Jalankan Backend FastAPI di jendela terminal tersendiri
echo Menjalankan Backend FastAPI pada port 8000...
start "Konco-Sinauku Backend" /D "%~dp0backend" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 7. Jalankan Frontend Vite React di jendela terminal tersendiri
echo Menjalankan Frontend Vite pada port 5173...
start "Konco-Sinauku Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

:: 8. Tunggu hingga server siap (menggunakan ping delay yang kompatibel dengan semua sesi)
echo Menunggu inisialisasi server (sekitar 3 detik)...
ping -n 4 127.0.0.1 >nul

:: 9. Buka browser otomatis ke antarmuka aplikasi
echo Membuka aplikasi di peramban web...
start http://localhost:5173

echo.
echo ===================================================================
echo         APLIKASI KONCO-SINAUKU TELAH BERHASIL BERJALAN!
echo ===================================================================
echo   - Frontend UI : http://localhost:5173
echo   - Backend API : http://127.0.0.1:8000
echo   - API Docs    : http://127.0.0.1:8000/docs
echo ===================================================================
echo.
echo Catatan:
echo   - Backend dan Frontend berjalan di jendela terminal masing-masing.
echo   - Untuk mematikan semua service sekaligus, jalankan stop.bat.
echo   - Jendela launcher ini dapat Anda tutup dengan aman kapan saja.
echo.
pause
