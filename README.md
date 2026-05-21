# CleanSheet AI

CleanSheet AI adalah aplikasi **pengecek kualitas data CSV** yang membantu pengguna mengunggah dataset, mendeteksi isu tersembunyi, memahami risikonya dengan insight AI (opsional), membersihkan data dengan aman, lalu mengunduh CSV yang lebih rapi.

## Overview
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python), Pandas
- **AI (opsional)**: Gemini API dengan fallback (tanpa API key tetap jalan)

## Problem
Banyak file CSV/spreadsheet terlihat rapi, tetapi memiliki isu tersembunyi seperti:
- baris duplikat
- nilai kosong / placeholder (N/A, NULL, -, unknown)
- email tidak valid
- format nomor telepon tidak konsisten
- whitespace berlebih (spasi/tab/newline)
- karakter aneh / encoding rusak

## Solution
CleanSheet AI menggabungkan **rule-based data validation** dan **Gemini-powered insight** untuk membantu user non-teknis:
1) menemukan isu kualitas data
2) memahami dampak dan prioritas perbaikan
3) menerapkan pembersihan yang aman (dengan pratinjau sebelum–sesudah)
4) mengunduh CSV yang lebih bersih

## Target Users
- Mahasiswa & peneliti
- UMKM
- Admin sekolah
- Tim operasional
- Pemula data analyst

## Features
- Upload CSV + dataset preview
- Data Quality Score (0–100) + status
- Deteksi isu: duplikat, missing value, whitespace, karakter aneh, email/telepon tidak valid
- Dashboard isu + filter
- Rekomendasi pembersihan + pratinjau before/after
- Apply cleaning + download cleaned CSV
- Report page (ringkasan final demo-ready)
- AI Insight (Gemini) dengan desain privasi (summary-only)

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Pandas
- **AI**: Gemini API (opsional)

## Architecture
- `frontend/`: Next.js UI (routes: `/`, `/upload`, `/dashboard`, `/clean`, `/report`)
- `backend/`: FastAPI API (routes: `/health`, `/api/upload`, `/api/analyze`, `/api/clean/*`, `/api/ai/insight`)
- `sample-data/`: contoh CSV untuk demo
- `docs/`: roadmap, demo script, QA checklist

## Getting Started

### Backend Setup (FastAPI)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health check:
- `http://localhost:8000/health`

### Frontend Setup (Next.js)
```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open:
- `http://localhost:3000/`

### Environment Variables

**Frontend** (`frontend/.env.local`)
- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`

**Backend** (`backend/.env`)
- `FRONTEND_URL=http://localhost:3000`
- `APP_NAME="CleanSheet AI API"`
- `APP_ENV=development`

**Gemini (opsional)** (`backend/.env`)
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=gemini-1.5-flash`

Catatan privasi: AI insight **tidak** mengirim dataset penuh ke Gemini. Yang dikirim hanya ringkasan statistik (skor, jumlah isu, top kolom, rekomendasi).

## Sample Dataset
Gunakan file berikut untuk demo:
- `sample-data/sample_customer_dirty_data.csv`

## Demo Guide
Flow demo yang direkomendasikan:
1. Buka homepage: `http://localhost:3000/`
2. Buka Dashboard: `http://localhost:3000/dashboard`
3. Upload `sample-data/sample_customer_dirty_data.csv`
4. Klik **Analisis Data**
5. Lihat skor + ringkasan isu + top kolom + tabel isu
6. Buka Clean: `http://localhost:3000/clean`
7. Klik **Dapatkan Rekomendasi Pembersihan**
8. Pilih aksi → **Pratinjau Perbaikan Terpilih**
9. Klik **Terapkan Perbaikan Terpilih**
10. Klik **Unduh CSV Bersih**
11. Buka Report: `http://localhost:3000/report`
12. Upload CSV lagi → **Buat Laporan**

Catatan: report page upload ulang karena belum ada database/persistence.

## Competition Pitch
**Problem**: data kotor menghasilkan laporan/analisis yang menyesatkan.  
**Solution**: CleanSheet AI mendeteksi isu, menjelaskan risiko dengan AI (opsional), dan memberi pembersihan aman.  
**Why it matters**: keputusan lebih akurat, mengurangi error operasional, meningkatkan kualitas laporan.  
**Privacy-aware AI**: dataset penuh tidak dikirim ke Gemini, hanya ringkasan statistik.  
**Impact**: membantu student/UMKM/ops teams memastikan data siap pakai.

## Privacy-Aware AI Design
- Tidak mengirim full dataset ke Gemini
- Mengirim summary: `quality_score`, `issue_summary`, `top_problem_columns`, `recommended_actions`
- Fallback otomatis jika `GEMINI_API_KEY` tidak diset

## Known Limitations
- MVP hanya mendukung file CSV (belum mendukung Excel).
- File diproses di memori (tidak disimpan permanen).
- Cleaned CSV disimpan sementara di memori backend saat runtime; jika backend restart, link download lama bisa 404.
- Tidak ada login / sistem akun.
- Tidak ada database / history analisis.
- Report page self-contained (tidak menyimpan hasil halaman sebelumnya).
- AI insight dibuat dari summary statistik saja, bukan full dataset.
- PDF export belum tersedia.

## Roadmap
Lihat `docs/ROADMAP.md`.

## QA & Demo Docs
- Demo script: `docs/DEMO_SCRIPT.md`
- QA checklist: `docs/QA_CHECKLIST.md`

## Troubleshooting
- Jika `npm run build` gagal `spawn EPERM` di Windows, biasanya terkait policy/antivirus yang memblokir proses spawn. Coba:
  - Jalankan terminal sebagai Administrator
  - Exclude folder project dari antivirus/Defender (sementara)
  - Pastikan `node.exe` tidak diblokir

