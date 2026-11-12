# PANDUAN MENJALANKAN & MENGUJI KONEKSI (HELPER GUIDE)
**Platform: Konco-Sinauku (AI Study Buddy)**

Panduan ini berisi kumpulan perintah ringkas (cheat sheet) untuk menjalankan backend, frontend, serta menguji konektivitas API (Gemini, Supabase, dan Database) di lingkungan Windows PowerShell.

---

## 1. Persiapan Environment (.env)

Pastikan file `.env` di folder root telah terisi dengan format berikut:

```env
# 1. Google Gemini AI API Key
GEMINI_API_KEY=AIzaSy... (atau AQ.Ab8RN...)

# 2. Supabase Configuration (Backend & Frontend)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_... (atau eyJhbGciOi...)
SUPABASE_SERVICE_ROLE_KEY=sb_secret_... (atau eyJhbGciOi...)

VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_... (atau eyJhbGciOi...)

# 3. Database URL (Default SQLite lokal)
DATABASE_URL=sqlite:///./konco_sinauku.db

# 4. Batasan Berkas
MAX_FILE_SIZE_MB=20
MAX_PAGE_COUNT=50
UPLOAD_DIR=./uploads
APP_ENV=development
```

---

## 2. Perintah Menjalankan Aplikasi

Jalankan backend dan frontend pada dua jendela PowerShell terpisah:

### Terminal 1: Backend FastAPI (Port 8000)
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Tanda sukses:* Muncul log `Uvicorn running on http://127.0.0.1:8000` dan `Database initialized successfully`.

### Terminal 2: Frontend Vite React (Port 5173)
```powershell
$env:Path = "$env:LOCALAPPDATA\nodejs;$env:Path"
cd frontend
npm run dev
```
*Tanda sukses:* Muncul log `VITE v6.x.x ready in ... ms` dan `Local: http://localhost:5173/`.

---

## 3. Perintah Menguji Koneksi (Health & Connection Tests)

Jalankan perintah-perintah berikut di terminal untuk memverifikasi seluruh komponen bekerja:

### A. Uji Kesehatan Backend (Health Check)
```powershell
curl.exe -s http://127.0.0.1:8000/api/health
```
*Ekspektasi output:*
```json
{"status":"healthy","app":"Konco-Sinauku","version":"1.0.0","environment":"development"}
```

---

### B. Uji Koneksi Supabase Auth
Perintah Python satu baris untuk mengecek apakah `SUPABASE_URL` dan `SUPABASE_ANON_KEY` valid ke server Supabase:
```powershell
python -c "import os, requests; from dotenv import load_dotenv; load_dotenv(); url=os.getenv('SUPABASE_URL'); key=os.getenv('SUPABASE_ANON_KEY'); r=requests.get(f'{url}/auth/v1/settings', headers={'apikey': key}); print('Status Supabase:', r.status_code, '-> OK' if r.status_code==200 else r.text)"
```
*Ekspektasi output:*
```text
Status Supabase: 200 -> OK
```

---

### C. Uji Koneksi Google Gemini API
Perintah Python satu baris untuk memverifikasi `GEMINI_API_KEY` aktif dan bisa menerima respons:
```powershell
python -c "import os; from dotenv import load_dotenv; import google.generativeai as genai; load_dotenv(); genai.configure(api_key=os.getenv('GEMINI_API_KEY')); m=genai.GenerativeModel('gemini-flash-latest'); print('Tes Gemini:', m.generate_content('Halo, jawab: OK').text.strip())"
```
*Ekspektasi output:*
```text
Tes Gemini: OK
```

---

### D. Menjalankan Seluruh Automated Test Suite (Pytest)
Menguji otomatis penolakan file non-PDF, ukuran file > 50 halaman, ekstraksi teks, chunking, query RAG, hingga pembuatan kuis:
```powershell
cd backend
python -m pytest -v
```
*Ekspektasi:* `3 passed in X.XXs`

---

### E. Verifikasi Build Frontend (Typecheck & Bundler)
Memastikan seluruh kode TypeScript strict lolos tanpa ada error tipe:
```powershell
$env:Path = "$env:LOCALAPPDATA\nodejs;$env:Path"
cd frontend
npm run build
```
*Ekspektasi:* Selesai dengan kode keluar 0 dan menghasilkan folder `frontend/dist`.

---

## 4. Tautan Penting & Dashboard Pengujian

| Nama Layanan | URL di Browser | Fungsi |
| :--- | :--- | :--- |
| **Aplikasi Utama (Web)** | [http://localhost:5173](http://localhost:5173) | Landing Page, Upload PDF, & Workspace Belajar |
| **Swagger UI (Interactive API)** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Dashboard uji coba interaktif setiap endpoint FastAPI |
| **ReDoc Technical Docs** | [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc) | Dokumentasi teknis OpenAPI |
| **Supabase Dashboard** | [https://supabase.com/dashboard](https://supabase.com/dashboard) | Manajemen User, Tabel Dokumen, & Logs Auth |
| **Google AI Studio** | [https://aistudio.google.com/](https://aistudio.google.com/) | Kelola Gemini API Key & Penggunaan Kuota |

---

## 5. Troubleshooting Cepat (FAQ)

1. **Port 8000 atau 5173 Sudah Terpakai (Port Already in Use)**:
   Matikan proses yang sedang menduduki port dengan perintah:
   ```powershell
   Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
   Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
   ```

2. **PowerShell Script Policy Warning (`PSSecurityException`)**:
   Jika PowerShell menolak menjalankan script, bypass untuk sesi terminal aktif:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

3. **Node/NPM Tidak Dikenali di Terminal Baru**:
   Tambahkan path Node.js portable ke sesi PowerShell:
   ```powershell
   $env:Path = "$env:LOCALAPPDATA\nodejs;$env:Path"
   ```
