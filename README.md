# CleanSheet AI

CleanSheet AI is an AI-powered data quality checker that helps users upload CSV files, detect hidden data issues, understand their impact, and download cleaned data.

## Problem
Many CSV and spreadsheet files contain hidden quality issues such as duplicates, missing values, invalid emails, inconsistent phone numbers, strange characters, and unnecessary spaces.

## Solution
CleanSheet AI detects these issues automatically, generates a Data Quality Score, explains the impact using AI, and recommends safe cleaning actions.

## Target Users
- Students
- Researchers
- MSMEs
- School admins
- Operations teams
- Beginner data analysts

## MVP Features
- CSV upload
- Dataset preview
- Duplicate detection
- Missing value detection
- Whitespace detection
- Strange character detection
- Email validation
- Indonesian phone validation
- Data Quality Score
- AI summary
- Cleaned CSV download

## Phase 5 — Dashboard UX Improvements
This stage improves the dashboard presentation and user experience without adding AI cleaning, download export, or authentication.

- Dashboard hero section with clear purpose and rule-based badge
- Clean upload analysis card with drag-and-drop support
- Empty, loading, and friendly error states
- Large quality score visualization with status and progress bar
- Summary issue cards and issue type breakdown bars
- Filterable issue table with severity and type badges
- Continue to Cleaning placeholder button

## Phase 6 — Cleaning Recommendations & Before-After Preview
This stage enables safe cleaning recommendations and before-after preview without implementing final export or database.

- Cleaning recommendation engine that suggests safe actions based on detected issues
- Four core cleaning actions:
  - Trim whitespace (safe)
  - Normalize Indonesian phone numbers (review recommended)
  - Remove duplicate rows (safe)
  - Standardize missing value placeholders (safe)
- Backend `/api/clean/preview` endpoint for recommendations and preview generation
- Before-after preview table showing what will change
- Frontend cleaning page with action selection and interactive preview
- Disabled download button placeholder for Phase 7

Testing Phase 6:
1. Open [http://localhost:3000/clean](http://localhost:3000/clean)
2. Upload `sample_customer_dirty_data.csv`
3. Click "Get Cleaning Recommendations"
4. Review recommended actions and their affected cells/rows
5. Select actions with checkboxes
6. Click "Preview Selected Fixes"
7. Review before-after table showing changes

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4
- **Backend**: FastAPI (Python), Pandas
- **AI**: Gemini API
- **Deployment**: Google Cloud Run

---

## Panduan Memulai (Get Started)

### 1. Prasyarat (Prerequisites)
Pastikan Anda memiliki tools berikut terinstal di komputer Anda:
- **Node.js** (Versi 18 atau lebih baru)
- **Python** (Versi 3.9 atau lebih baru)
- **Git**

---

### 2. Konfigurasi & Menjalankan Backend (FastAPI)

Kembali ke direktori root proyek, ikuti langkah berikut:

```bash
# Pindah ke folder backend
cd backend

# Buat virtual environment (.venv)
python -m venv .venv

# Aktifkan virtual environment
# Untuk Windows:
.venv\Scripts\activate
# Untuk macOS/Linux:
source .venv/bin/activate

# Install dependensi backend
pip install -r requirements.txt

# Salin file environment variabel
copy .env.example .env

# Jalankan server lokal backend
uvicorn app.main:app --reload --port 8000
```

Setelah server menyala, Anda dapat memverifikasi status backend dengan mengakses url berikut di browser Anda:
- Halaman Utama API: [http://localhost:8000/](http://localhost:8000/)
- Endpoint Health Check: [http://localhost:8000/health](http://localhost:8000/health)

---

### 3. Konfigurasi & Menjalankan Frontend (Next.js)

Buka terminal baru di direktori root proyek:

```bash
# Pindah ke folder frontend
cd frontend

# Install dependensi frontend
npm install

# Salin file environment variabel
copy .env.example .env.local

# Jalankan server development frontend
npm run dev
```

Buka browser Anda dan akses aplikasi CleanSheet AI di:
- **[http://localhost:3000/](http://localhost:3000/)**

Aplikasi pada halaman utama akan otomatis mendeteksi status koneksi ke server backend Anda (FastAPI) dan menampilkannya pada Status Badge di atas halaman.

---

## 4. Pengujian Fitur Phase 3 (CSV Upload & Data Preview)

Gunakan file sampel data kotor yang telah disediakan untuk menguji fungsionalitas pemrosesan file:

1. Buka browser dan arahkan ke halaman **[http://localhost:3000/upload](http://localhost:3000/upload)**.
2. Seret (*drag and drop*) atau pilih file **`sample_customer_dirty_data.csv`** yang terletak di folder `/sample-data`.
3. Klik tombol **"Unggah & Pratinjau CSV"**.
4. Verifikasi bahwa sistem berhasil mendeteksi dan menampilkan:
   - **Kartu Ringkasan**: Nama file, ukuran file, jumlah baris (10), dan jumlah kolom (6).
   - **Tabel Statistik Kolom**: Menampilkan nama kolom, tipe data terdeteksi (`text`, `number`, `date`, `boolean`, `unknown`), serta jumlah sel kosong (*missing count*).
   - **Tabel Pratinjau**: Grid data 10 baris lengkap dengan indikator sel bernilai `NULL` (berwarna merah redup).
5. Klik tombol **"Lanjut ke Dashboard"** untuk masuk ke halaman dashboard placeholder.

