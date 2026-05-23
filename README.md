# CleanSheet AI

CleanSheet AI adalah aplikasi pengecek kualitas data CSV yang membantu pengguna mengunggah dataset, mendeteksi isu tersembunyi, memahami risikonya dengan insight AI opsional, membersihkan data dengan aman, lalu mengunduh CSV yang lebih rapi.

## Overview

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, Pandas
- AI: Gemini API dengan fallback jika API key belum tersedia
- Deployment preparation: backend siap Docker/Cloud Run, frontend siap production API URL

## Problem

Banyak file CSV atau spreadsheet terlihat rapi, tetapi memiliki isu tersembunyi seperti:

- baris duplikat
- nilai kosong atau placeholder
- email tidak valid
- format nomor telepon tidak konsisten
- whitespace berlebih
- karakter aneh atau encoding rusak

## Solution

CleanSheet AI menggabungkan rule-based data validation dan Gemini-powered insight untuk membantu user non-teknis menemukan isu kualitas data, memahami dampaknya, menerapkan pembersihan yang aman, dan mengunduh CSV yang lebih bersih.

## Target Users

- Mahasiswa dan peneliti
- UMKM
- Admin sekolah
- Tim operasional
- Pemula data analyst

## Features

- Upload CSV dan dataset preview
- Data Quality Score 0-100
- Deteksi duplikat, missing value, whitespace, karakter aneh, email tidak valid, telepon Indonesia tidak valid, dan nilai negatif mencurigakan
- Dashboard isu dan filter
- Rekomendasi pembersihan otomatis
- Before-after preview
- **Unified Cleaning dan Manual Review Workflow**:
  - Halaman Clean memperbaiki isu yang aman secara otomatis.
  - Isu ambigu (seperti email/telepon tidak valid) yang tersisa akan diteruskan ke Manual Review melalui `cleaned_dataset_id`.
  - Manual Review bekerja langsung pada dataset yang sudah dicuci otomatis, bukan file asli.
  - Opsi upload langsung ke Manual Review tetap didukung.
- Apply cleaning dan download cleaned CSV
- Report page untuk ringkasan final
- AI insight dengan desain privacy-aware

## Tech Stack

- Frontend: Next.js 15, TypeScript, Tailwind CSS
- Backend: FastAPI, Pandas
- AI: Gemini API opsional
- Container: Docker untuk backend

## Architecture

- `frontend/`: Next.js UI dengan route `/`, `/upload`, `/dashboard`, `/clean`, `/report`
- `backend/`: FastAPI API dengan route `/health`, `/api/upload`, `/api/analyze`, `/api/clean/*`, `/api/ai/insight`
- `sample-data/`: sample CSV untuk demo
- `docs/`: roadmap, demo script, QA checklist, deployment guide

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Health check:

```text
http://localhost:8000/health
```

### Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000/
```

### Environment Variables

Frontend local (`frontend/.env.local`):

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ENABLE_AI_INSIGHT=true
```

Backend local (`backend/.env`):

```text
APP_ENV=development
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=8000
```

Gemini API key bersifat opsional untuk demo lokal. Jika tidak diisi, backend memakai fallback insight.

## Sample Dataset

Gunakan file berikut untuk demo:

```text
sample-data/sample_customer_dirty_data.csv
```

## Demo Guide

1. Buka homepage: `http://localhost:3000/`
2. Buka Dashboard: `http://localhost:3000/dashboard`
3. Upload `sample-data/sample_customer_dirty_data.csv`
4. Klik Analisis Data
5. Lihat skor, ringkasan isu, top kolom, dan tabel isu
6. Buka Clean: `http://localhost:3000/clean`
7. Klik Dapatkan Rekomendasi Pembersihan
8. Pilih aksi, lalu klik Pratinjau Perbaikan Terpilih
9. Klik Terapkan Perbaikan Terpilih
10. Klik Unduh CSV Bersih
11. Buka Report: `http://localhost:3000/report`
12. Upload CSV lagi dan klik Buat Laporan

Report page upload ulang karena belum ada database atau persistence.

## Competition Pitch

Problem: data kotor menghasilkan laporan dan analisis yang menyesatkan.

Solution: CleanSheet AI mendeteksi isu, menjelaskan risiko dengan AI opsional, dan memberi pembersihan aman.

Why it matters: keputusan lebih akurat, error operasional berkurang, dan kualitas laporan meningkat.

Privacy-aware AI: dataset penuh tidak dikirim ke Gemini, hanya ringkasan statistik.

Impact: membantu student, UMKM, dan ops teams memastikan data siap pakai.

## Privacy-Aware AI & Safety Design

- Tidak mengirim full dataset ke Gemini
- Mengirim summary seperti `quality_score`, `issue_summary`, `top_problem_columns`, dan `recommended_actions`
- Fallback otomatis jika `GEMINI_API_KEY` tidak diset
- **Safety First**: Sistem hanya memperbaiki format data yang aman (seperti trim whitespace, format no hp, hapus karakter aneh). Kesalahan logis seperti email salah format atau harga negatif hanya diberi peringatan untuk ditinjau manual. Export CSV ke Excel aman dari scientific notation karena diberi prefix tab.

## Deployment Preparation

Deployment preparation tersedia di [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).

Backend local Docker test:

```bash
docker build -t cleansheet-ai-backend ./backend
docker run --env-file backend/.env.example -p 8000:8000 cleansheet-ai-backend
```

Test:

```text
http://localhost:8000/health
```

Production notes:

- Backend membaca `PORT` dari environment variable untuk Cloud Run.
- Backend CORS dikontrol lewat `FRONTEND_URL` dan `ALLOWED_ORIGINS`.
- Frontend production perlu mengisi `NEXT_PUBLIC_API_BASE_URL` dengan URL backend production.
- Jangan commit real `GEMINI_API_KEY`.
- Untuk production serius, simpan Gemini key di Google Secret Manager.

## Known Limitations

- MVP hanya mendukung file CSV.
- Excel belum didukung.
- File diproses di memori dan tidak disimpan permanen.
- Cleaned CSV disimpan sementara di memori backend saat runtime.
- Tidak ada login atau sistem akun.
- Tidak ada database atau history analisis.
- Report page self-contained dan tidak menyimpan hasil dashboard sebelumnya.
- AI insight dibuat dari summary statistik saja, bukan full dataset.
- PDF export belum tersedia.

## Roadmap

Lihat [docs/ROADMAP.md](docs/ROADMAP.md).

## QA and Demo Docs

- Demo script: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)
- QA checklist: [docs/QA_CHECKLIST.md](docs/QA_CHECKLIST.md)
- Deployment guide: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

## Troubleshooting

Jika `npm run build` gagal dengan `spawn EPERM` di Windows, biasanya ada policy atau antivirus yang memblokir proses spawn. Coba jalankan terminal sebagai Administrator, pastikan `node.exe` tidak diblokir, atau exclude folder project dari antivirus sementara.
