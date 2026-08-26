# Backend Audit Walkthrough — CleanSheet AI

Dokumen ini berisi hasil audit backend CleanSheet AI secara read-only. Tidak ada kode aplikasi, dependency, endpoint, frontend, atau arsitektur yang diubah. Migrasi backend ke Vercel belum dilakukan.

Tanggal audit: 26 Agustus 2026

---

## A. Kondisi Backend

- **Status:** Backend dapat dijalankan.
- **Health check:** Berhasil.
- **Endpoint:** `GET /health` mengembalikan HTTP `200`.
- **Python lokal:** `3.14.0`.
- **Python Docker:** `3.11-slim`.
- **FastAPI:** `0.136.1`.
- **Uvicorn:** `0.47.0`.
- **Syntax check:** `python -m compileall app` berhasil.
- **Static diagnostics:** Tidak ditemukan error.

Percobaan menjalankan server kedua pada port `8000` gagal karena port tersebut sudah digunakan proses Uvicorn lain. Ini adalah port conflict Windows (`WinError 10048`), bukan error aplikasi. Server yang sudah berjalan tetap berhasil merespons `/health`.

Masalah utama yang ditemukan:

1. `openpyxl` belum terpasang pada virtual environment.
2. `google-generativeai` belum terpasang.
3. `requirements.txt` tidak menggunakan versi package yang dipin.
4. File `.env` tidak otomatis dibaca oleh aplikasi.
5. Versi Python lokal berbeda dengan versi Python pada Docker.
6. Beberapa dokumentasi API masih menggunakan format lama.

---

## B. Struktur Backend

```text
backend/
├── app/
│   ├── main.py
│   ├── models/
│   │   ├── ai.py
│   │   ├── cleaning.py
│   │   ├── dataset.py
│   │   ├── issue.py
│   │   └── manual_review.py
│   ├── routers/
│   │   ├── ai.py
│   │   ├── analyze.py
│   │   ├── clean.py
│   │   ├── health.py
│   │   ├── manual_review.py
│   │   ├── quality_gate.py
│   │   └── upload.py
│   ├── services/
│   │   ├── ai_service.py
│   │   ├── cleaning_engine.py
│   │   ├── dataset_store.py
│   │   ├── file_store.py
│   │   ├── manual_review_service.py
│   │   ├── parser_service.py
│   │   ├── quality_engine.py
│   │   └── quality_gate_service.py
│   └── utils/
├── Dockerfile
├── requirements.txt
├── .env
├── .env.example
└── .env.production.example
```

### Entrypoint

File entrypoint:

```text
backend/app/main.py
```

Objek FastAPI:

```text
app
```

Perintah eksekusi lokal:

```text
uvicorn app.main:app
```

Docker menjalankan Uvicorn pada `0.0.0.0` dan menggunakan environment variable `PORT`.

### Router

Router yang diregistrasikan di `main.py`:

- `health`
- `upload`
- `analyze`
- `clean`
- `manual_review`
- `quality_gate`
- `ai`

---

## C. Dependency Problems

| Package | Kondisi | Masalah | Tindakan |
|---|---|---|---|
| Python | Terpasang `3.14.0` | Docker menggunakan Python `3.11`; environment belum seragam | Samakan versi pada tahap restore |
| FastAPI | Terpasang `0.136.1` | Tidak ada error startup | Tidak perlu diubah sekarang |
| Uvicorn | Terpasang `0.47.0` | Tidak ada error startup | Tidak perlu diubah sekarang |
| Pandas | Terpasang `3.0.3` | Berjalan pada environment saat ini | Validasi dengan dataset produksi |
| openpyxl | Tidak terpasang | File `.xlsx` akan gagal diproses | Instal pada tahap restore dependency |
| python-multipart | Terpasang `0.0.29` | Dibutuhkan untuk upload multipart | Tidak perlu diubah |
| python-dotenv | Terpasang `1.2.2` | Tidak digunakan untuk memanggil `load_dotenv()` | Perlu diputuskan pada tahap restore konfigurasi |
| google-generativeai | Tidak terpasang | Gemini real API tidak dapat digunakan | Fallback AI tetap berjalan |
| requests | Digunakan script test tertentu | Tidak tercantum di requirements production | Hanya masalah test helper |

### Catatan dependency

`requirements.txt` masih menggunakan package tanpa versi. Akibatnya, instalasi pada waktu berbeda dapat menghasilkan kombinasi versi yang berbeda.

Import Gemini dilakukan secara lazy di `ai_service.py`, sehingga package Gemini yang belum terpasang tidak menghalangi startup backend.

---

## D. Environment Variables

| Variable | Required | Fungsi |
|---|---|---|
| `APP_NAME` | Tidak | Tersedia di contoh environment, tetapi tidak digunakan kode |
| `APP_ENV` | Optional | Menentukan environment; default `development` |
| `FRONTEND_URL` | Optional | Menentukan origin frontend untuk CORS |
| `ALLOWED_ORIGINS` | Optional | Daftar origin CORS yang dipisahkan koma |
| `GEMINI_API_KEY` | Optional | Mengaktifkan Gemini AI |
| `GEMINI_MODEL` | Optional | Nama model Gemini; default `gemini-1.5-flash` |
| `PORT` | Optional lokal, penting deployment | Port Uvicorn; default Docker `8000` |

### Kondisi environment

- File `.env` lokal tersedia.
- Tidak ada API key Gemini aktif.
- Fallback AI berhasil berjalan.
- Kode tidak memanggil `load_dotenv()`.
- File `.env` tidak otomatis dibaca hanya karena file tersebut ada.
- Environment variable harus diberikan oleh shell, Docker, atau platform deployment.

### CORS

CORS menggunakan urutan berikut:

1. `ALLOWED_ORIGINS`, jika tersedia.
2. `FRONTEND_URL`, jika `ALLOWED_ORIGINS` kosong.
3. Default `localhost:3000` dan `127.0.0.1:3000`.

Pada environment non-development, origin wildcard `*` difilter.

---

## E. API Status

| Endpoint | Status | Kondisi |
|---|---|---|
| `GET /health` | Ada | Berhasil HTTP 200 |
| `POST /api/upload/` | Ada | Berhasil diuji HTTP 200 |
| `POST /api/analyze/` | Ada | Berhasil diuji dengan sample dataset |
| `GET /api/analyze/{dataset_id}` | Ada | Terdaftar dan digunakan frontend |
| `POST /api/clean/preview` | Ada | Terdaftar |
| `POST /api/clean/apply` | Ada | Terdaftar |
| `GET /api/clean/download/{download_id}` | Ada | Terdaftar |
| `POST /api/manual-review/issues` | Ada | Terdaftar |
| `GET /api/manual-review/issues/{dataset_id}` | Ada | Terdaftar |
| `POST /api/manual-review/validate` | Ada | Terdaftar |
| `POST /api/manual-review/apply` | Ada | Terdaftar |
| `GET /api/quality-gate/{dataset_id}` | Ada | Terdaftar |
| `POST /api/ai/insight` | Ada | Terdaftar; fallback berhasil |

### Hasil pengujian endpoint

- Upload file valid: HTTP 200.
- File lebih besar dari 5 MB: HTTP 400.
- File kosong: HTTP 400.
- Analisis sample dataset: HTTP 200.
- Fallback AI tanpa API key: berhasil.

### Format file aktual

Parser backend mendukung:

- `.csv`
- `.tsv`
- `.txt`
- `.xlsx`
- `.xls`

Dokumentasi lama yang menyebut hanya CSV sudah tidak sepenuhnya sesuai dengan implementasi aktual.

---

## F. Business Logic Status

| Fitur | Kondisi |
|---|---|
| Duplicate detection | Berfungsi |
| Missing value detection | Berfungsi |
| Whitespace detection | Berfungsi |
| Strange character detection | Berfungsi |
| Invalid email detection | Berfungsi |
| Invalid phone detection | Berfungsi |
| Suspicious negative number | Berfungsi |
| Quality score | Berfungsi |
| Quality status | Berfungsi |
| Cleaning recommendations | Berfungsi |
| Automatic cleaning | Berfungsi |
| Before-after preview | Berfungsi |
| Quality gate | Berfungsi |
| Manual review | Berfungsi |
| Manual validation | Berfungsi |
| Final export | Berfungsi menggunakan temporary storage |
| Gemini fallback | Berfungsi |
| Gemini real API | Belum dapat digunakan karena package belum terpasang dan API key tidak tersedia |

### Quality score

Skor dimulai dari 100:

- Critical: dikurangi 5 poin.
- Warning: dikurangi 2 poin.
- Info: dikurangi 1 poin.
- Skor minimum: 0.

Status kualitas:

- 85–100: `Good`
- 70–84: `Needs Review`
- 50–69: `Poor`
- Di bawah 50: `Critical`

### Automatic cleaning

Action yang tersedia:

- `trim_whitespace`
- `normalize_phone`
- `remove_duplicates`
- `standardize_missing_values`
- `remove_strange_characters`

Email invalid dan angka negatif tidak diubah otomatis karena membutuhkan keputusan pengguna.

### Manual review

Isu manual dapat berupa:

- Email invalid.
- Phone invalid.
- Angka negatif mencurigakan.
- Strange character.
- Missing value.

Backend menggunakan `stable_key` dengan format:

```text
row:column:type
```

### Quality gate

Quality gate memblokir ekspor apabila masih terdapat isu penting yang belum diperbaiki atau belum secara eksplisit ditandai valid oleh pengguna.

### Storage

`dataset_store.py`:

- Menyimpan DataFrame di memory.
- Menyimpan metadata dataset.
- Dataset kedaluwarsa sekitar 30 menit.
- Data hilang saat backend restart.

`file_store.py`:

- Menyimpan hasil CSV di memory.
- File kedaluwarsa sekitar 30 menit.
- File hilang saat backend restart.

---

## G. Cloud Run Dependency

### Ketergantungan langsung

Tidak ditemukan ketergantungan langsung pada SDK Google Cloud atau API Cloud Run di source code aplikasi.

Tidak ada penggunaan langsung terhadap:

- `google.cloud`.
- Cloud Run SDK.
- Google Secret Manager SDK.

### Bagian yang terkait Cloud Run

1. **`PORT`** digunakan Dockerfile agar sesuai dengan aturan Cloud Run.
2. **Dockerfile** disiapkan untuk container deployment.
3. **`.env.production.example`** berisi konfigurasi production dan placeholder secret.
4. **`docs/DEPLOYMENT_GUIDE.md`** berisi instruksi Cloud Run dan Secret Manager.

### Kesimpulan Cloud Run

Backend tidak terkunci pada Cloud Run. Ketergantungannya hanya berupa konfigurasi port, Docker runtime, dan dokumentasi deployment.

Namun, in-memory storage perlu diperhatikan apabila backend dipindahkan ke Vercel atau platform serverless lain, karena instance serverless tidak menjamin memory yang sama antar-request.

---

## H. Root Cause

### 1. Dependency environment tidak lengkap

`openpyxl` dan `google-generativeai` tercantum di `requirements.txt`, tetapi belum tersedia pada virtual environment.

Dampak:

- Excel tidak dapat digunakan.
- Gemini real API tidak dapat digunakan.
- Fallback AI tetap berjalan.

### 2. Versi runtime tidak konsisten

- Lokal: Python `3.14`.
- Docker: Python `3.11`.

Dampak:

- Perilaku package dapat berbeda.
- Environment production belum sepenuhnya reproducible.

### 3. `.env` tidak otomatis dimuat

Walaupun `python-dotenv` tercantum, aplikasi tidak memanggil `load_dotenv()`.

Dampak:

- Konfigurasi di `.env` tidak otomatis masuk ke `os.getenv()`.
- Konfigurasi harus disediakan oleh shell, Docker, atau platform deployment.

### 4. Requirements tidak dipin

Package tidak memiliki versi eksplisit.

Dampak:

- Instalasi baru dapat menghasilkan kombinasi versi berbeda.
- Risiko incompatibility meningkat.

### 5. Dokumentasi API tertinggal

`docs/API_SPEC.md` masih menjelaskan API lama berbasis JSON, sedangkan implementasi aktual menggunakan multipart upload dan dataset ID.

Dampak:

- Developer dapat mengirim request dengan format yang salah.
- Proses restore dapat mengikuti dokumentasi yang sudah tidak relevan.

---

## I. Recommended Fix Order

### Prioritas 1 — Stabilkan environment

- Tentukan versi Python resmi.
- Samakan dengan versi Docker atau tetapkan versi yang disepakati.
- Buat virtual environment bersih.
- Instal seluruh dependency yang tercantum.
- Verifikasi `openpyxl` dan `google-generativeai`.

### Prioritas 2 — Verifikasi startup

- Jalankan Uvicorn pada port yang tersedia.
- Uji `GET /health`.
- Verifikasi import seluruh router.
- Pastikan tidak ada port conflict.

### Prioritas 3 — Verifikasi endpoint inti

Urutan pengujian:

1. Upload.
2. Analyze.
3. Cleaning preview.
4. Cleaning apply.
5. Download.
6. Manual review.
7. Quality gate.
8. AI fallback.

### Prioritas 4 — Validasi environment configuration

- Tentukan apakah aplikasi akan memuat `.env` sendiri atau environment disediakan platform.
- Jangan memasukkan API key asli ke repository.
- Verifikasi CORS frontend production.

### Prioritas 5 — Sinkronisasi dokumentasi

- Perbarui `docs/API_SPEC.md`.
- Dokumentasikan seluruh format file yang benar-benar didukung.
- Dokumentasikan quality gate.
- Dokumentasikan unified flow `Clean → Manual Review → Report`.
- Dokumentasikan keterbatasan in-memory storage.

### Prioritas 6 — Evaluasi migrasi Vercel

Migrasi belum dilakukan. Sebelum migrasi, analisis:

- Keterbatasan runtime serverless.
- Upload file sementara.
- Durasi proses Pandas.
- In-memory dataset store.
- In-memory download store.
- Kebutuhan persistent storage untuk production.

---

## J. Changes

Tidak ada perubahan yang dilakukan.

Tidak ada file yang:

- Diubah.
- Dihapus.
- Ditambahkan selain dokumen walkthrough ini.
- Direfactor.
- Dipindahkan.

Audit yang dilakukan:

- Membaca struktur dan source code backend.
- Memeriksa dependency.
- Menjalankan compile check.
- Menjalankan backend lokal.
- Menguji `/health`.
- Menguji upload.
- Menguji analisis sample dataset.
- Menguji fallback AI.
- Menginventarisasi seluruh route FastAPI.

## Kesimpulan

Backend CleanSheet AI masih dapat dijalankan dan endpoint `/health` berhasil.

Kondisi saat ini:

- Arsitektur utama masih utuh.
- Semua endpoint yang diminta tersedia.
- Business logic utama masih ada.
- Quality gate dan unified manual review sudah terimplementasi.
- Tidak ada ketergantungan keras terhadap Cloud Run.
- Masalah utama berada pada konsistensi environment dan dependency yang belum lengkap.
- Migrasi ke Vercel belum dilakukan.

---

## Riwayat Pengerjaan Terbaru

Tanggal: 26 Agustus 2026

Pekerjaan yang sudah dilakukan:

1. Memastikan Python 3.11 tersedia untuk backend.
2. Membuat virtual environment baru di `backend/.venv311` menggunakan Python 3.11.15.
3. Menginstal dependency dari `backend/requirements.txt` tanpa melakukan pinning versi.
4. Memastikan dependency utama tersedia:
	- FastAPI 0.141.1
	- Uvicorn 0.52.4
	- Pandas 3.0.5
	- openpyxl 3.1.5
	- python-multipart 0.0.32
	- python-dotenv 1.2.3
	- google-generativeai 0.8.6
5. Memverifikasi import FastAPI, Uvicorn, Pandas, openpyxl, dotenv, dan Gemini.
6. Menjalankan `python -m compileall app` dan hasilnya berhasil.
7. Menjalankan backend menggunakan Python 3.11 pada port `8001` karena port `8000` sedang digunakan instance lama.
8. Menguji `GET /health` dan mendapatkan HTTP 200.
9. Memverifikasi seluruh endpoint target muncul pada OpenAPI.
10. Menambahkan `load_dotenv()` secara minimal di `backend/app/main.py` agar `.env` lokal terbaca otomatis.
11. Memverifikasi bahwa `APP_ENV=development` terbaca dari `.env`.
12. Menghentikan instance backend uji setelah proses verifikasi selesai.

Perubahan file:

- `backend/app/main.py` — menambahkan pembacaan `.env` lokal.
- `backend/.venv311` — environment baru Python 3.11; tidak mengubah source code.

Tidak dilakukan:

- Tidak mengubah frontend.
- Tidak mengubah endpoint atau API contract.
- Tidak mengubah business logic.
- Tidak mengubah `requirements.txt`.
- Tidak mengubah Dockerfile.
- Tidak mengubah konfigurasi production.
- Tidak membuat atau mengubah API key.
- Tidak melakukan migrasi ke Vercel.

---

## End-to-End Test Report

Tanggal: 26 Agustus 2026

### A. Test Environment

- Python: `3.11.15`.
- Virtual environment: `backend/.venv311`.
- Backend: FastAPI melalui Uvicorn.
- Test server: `127.0.0.1:8002`, karena port `8000` mengalami stale port conflict Windows.
- Hanya satu instance server yang digunakan selama pengujian pada port `8002`.
- Gemini API key: tidak diaktifkan.
- AI mode: fallback.
- Frontend: tidak dijalankan dan tidak diubah.
- Source code: tidak diubah selama E2E test.

### B. Test Dataset

Dataset dibuat hanya di memory request dan tidak disimpan ke repository. Dataset berisi 4 baris dan 6 kolom:

- `id`
- `name`
- `phone`
- `email`
- `total_spent`
- `notes`

Kasus yang diuji:

- Duplicate row.
- Missing phone.
- Leading/trailing/double whitespace pada `name`.
- Invalid email `budi@@gmail.com`.
- Invalid phone `08xx-123`.
- Suspicious negative values `-50000` dan `-10000`.
- Strange characters pada email dan notes.

### C. Workflow Test

| Step | Endpoint | Expected | Actual | Status |
|---|---|---|---|---|
| Health | `GET /health` | HTTP 200 | HTTP 200 | PASS |
| Upload | `POST /api/upload/` | Metadata dan preview | HTTP 200; 4 baris, 6 kolom, dataset ID tersedia | PASS |
| Analyze | `GET /api/analyze/{dataset_id}` | Semua isu terdeteksi | Score 46, status `Critical`, 15 isu, 7 tipe isu | PASS |
| Cleaning preview | `POST /api/clean/preview` | Preview before-after | HTTP 200; 4 perubahan terpreview | PASS |
| Automatic cleaning | `POST /api/clean/apply` | Dataset cleaned dibuat | HTTP 200; 4 menjadi 3 baris, 1 duplikat dihapus, 2 cell berubah | PASS |
| Cleaned quality gate | `GET /api/quality-gate/{cleaned_dataset_id}` | Isu manual tetap blocking | HTTP 200; 6 blocking issue, gate `false` | PASS |
| Manual issue scan | `GET /api/manual-review/issues/{cleaned_dataset_id}` | Isu manual dari dataset cleaned | HTTP 200; 6 isu; stable key konsisten | PASS |
| Manual validation | `POST /api/manual-review/validate` | Nilai invalid ditolak dan valid diterima | Email, phone, missing, negative, strange character sesuai | PASS |
| Manual apply dengan edit numerik | `POST /api/manual-review/apply` | Semua edit valid diterapkan | HTTP 500 karena string ditulis ke kolom `int64` | FAIL |
| Manual apply dengan mark-valid | `POST /api/manual-review/apply` | Edit dan acknowledgement diterima | HTTP 200; response menyatakan gate lulus | PASS* |
| Final quality gate | `GET /api/quality-gate/{final_dataset_id}` | Tidak ada blocking issue | 2 negative issue muncul kembali | FAIL* |
| Download | `GET /api/clean/download/{download_id}` | CSV terbaca dan phone aman | HTTP 200; CSV terbaca; tidak ada scientific notation | PASS |
| AI insight | `POST /api/ai/insight` | Fallback tanpa API key | HTTP 200; fallback aktif | PASS |

Keterangan `*`: hasil Manual Apply dan pemeriksaan final tidak konsisten, sehingga dicatat sebagai bug.

Detail analisis:

- Duplicate: 1.
- Missing value: 1.
- Whitespace: 2.
- Strange character: 4.
- Invalid email: 2.
- Invalid phone: 2.
- Suspicious negative number: 3.
- Total: 15 isu.

Hasil automatic cleaning:

- Baris awal: 4.
- Baris akhir: 3.
- Baris dihapus: 1.
- Cell berubah: 2.
- Manual issue tersisa: 6.
- Quality gate: `false`, sesuai ekspektasi.

### D. Issues Found

#### Critical

1. **Manual Apply mengembalikan HTTP 500 saat mengedit kolom numerik.**
	- Endpoint: `POST /api/manual-review/apply`.
	- Request: edit valid pada `total_spent`, misalnya nilai baru `100`.
	- Expected: edit diterapkan dan proses manual review selesai.
	- Actual: HTTP 500 `Internal Server Error`.
	- Traceback: `manual_review_service.py`, fungsi `apply_manual_edits()`, saat menetapkan string ke kolom Pandas bertipe `int64`.
	- Root cause: nilai `new_value` selalu berupa string, sedangkan Pandas 3 menolak penulisan string ke kolom integer.
	- Source code tidak diubah sesuai instruksi.

2. **Acknowledgement mark-valid tidak bertahan pada final dataset.**
	- Endpoint: `POST /api/manual-review/apply`, dilanjutkan `GET /api/quality-gate/{final_dataset_id}`.
	- Request: dua suspicious negative number ditandai valid, sementara isu lain diperbaiki.
	- Expected: final quality gate tetap lulus setelah acknowledgement.
	- Actual: response Manual Apply menyatakan `quality_gate_passed=true`, tetapi final quality gate menemukan kembali 2 negative issue sebagai blocking.
	- Root cause kemungkinan: `acknowledged_issue_keys` hanya digunakan saat gate di dalam request apply dan tidak disimpan bersama dataset final. Saat final dataset dibaca ulang, quality gate tidak mengetahui acknowledgement sebelumnya.
	- Download tetap dibuat meskipun pemeriksaan ulang final tidak lulus.

#### High

Tidak ditemukan masalah lain dengan severity High.

#### Medium

1. **TestClient tidak dapat digunakan pada environment baru.**
	- Saat mencoba import `fastapi.testclient.TestClient`, Starlette meminta package `httpx2`.
	- `httpx2` tidak tercantum di `requirements.txt`.
	- Dampak: pengujian HTTP harus dilakukan melalui server Uvicorn langsung.
	- Ini tidak memengaruhi runtime API production secara langsung.

#### Low

1. Server dengan `--reload` pada Windows dapat meninggalkan child process/stale port setelah dihentikan paksa.
2. Script E2E sementara pertama gagal mencetak JSON karena bug pada reporter test, lalu diperbaiki di memory dan dijalankan ulang. Tidak ada file script yang disimpan.

### E. Root Cause Analysis

#### Bug 1 — Tipe nilai manual tidak disesuaikan dengan tipe kolom

`ManualEditRequest.new_value` didefinisikan sebagai string. `apply_manual_edits()` langsung menulis string tersebut ke DataFrame. Pada Pandas 3, penulisan string ke kolom integer menghasilkan `TypeError` dan tidak ditangani oleh route sebagai error terkontrol.

#### Bug 2 — Acknowledgement tidak dipersistenkan

Quality gate menerima `acknowledged_issue_keys` hanya selama request `POST /api/manual-review/apply`. Dataset final disimpan sebagai DataFrame dan metadata umum, tetapi daftar acknowledgement tidak ikut disimpan. Request quality gate berikutnya melakukan scan baru tanpa daftar acknowledgement.

#### Dependency issue — TestClient membutuhkan httpx2

Versi Starlette/FastAPI pada environment hasil restore memiliki integrasi TestClient yang memerlukan package `httpx2`, sementara package tersebut tidak ada di requirements. Pengujian melalui Uvicorn tetap berhasil.

### F. Recommended Fix Order

1. Perbaiki penanganan tipe nilai pada manual edit tanpa mengubah API contract: konversi nilai berdasarkan dtype kolom atau gunakan strategi assignment yang kompatibel.
2. Tambahkan error handling terkontrol untuk kegagalan assignment agar tidak berubah menjadi HTTP 500 tanpa detail.
3. Persistenkan acknowledgement secara internal pada metadata dataset final, lalu gunakan kembali saat quality gate final dijalankan.
4. Tambahkan regression test untuk numeric edit, mark-valid, final quality gate, dan download.
5. Evaluasi penambahan dependency test `httpx2` atau gunakan client HTTP eksternal yang sudah tersedia; jangan mengubah dependency production tanpa keputusan eksplisit.
6. Setelah workflow stabil, lakukan pinning dependency secara terkontrol.

### G. Changes Made

- Tidak ada source code yang diubah selama E2E test.
- Tidak ada frontend yang diubah.
- Tidak ada API key yang dibuat atau diaktifkan.
- Tidak ada dataset production yang diubah.
- Dataset pengujian hanya dibuat di memory request.
- Tidak ada file test sementara yang disimpan.
- Tidak ada migrasi Vercel.

---

## Manual Review Bug Fix Report

Tanggal: 26 Agustus 2026

### A. Root Cause

#### Bug 1 — Numeric manual edit menghasilkan HTTP 500

`ManualEditRequest.new_value` tetap berupa string sesuai API contract, tetapi service sebelumnya langsung menulis string tersebut ke kolom DataFrame. Pada Pandas 3, penulisan string seperti `"100"` ke kolom `int64` menghasilkan `TypeError`.

#### Bug 2 — Acknowledgement mark-valid tidak persisten

Acknowledgement sebelumnya hanya dikirim ke quality gate selama request `POST /api/manual-review/apply`. Saat dataset final disimpan, daftar stable key tidak ikut disimpan ke metadata. Pemeriksaan ulang final dataset kemudian melakukan scan tanpa acknowledgement.

### B. Files Changed

- `backend/app/services/manual_review_service.py` — konversi nilai edit berdasarkan dtype dan assignment dua tahap.
- `backend/app/services/quality_gate_service.py` — helper membaca acknowledgement tervalidasi dari metadata dataset.
- `backend/app/routers/manual_review.py` — menyimpan acknowledgement dan mengubah kegagalan assignment menjadi HTTP 400.
- `backend/app/routers/quality_gate.py` — menggunakan acknowledgement dari metadata saat pemeriksaan dataset.
- `backend/test_manual_review_regression.py` — regression test untuk integer, float, invalid numeric, dan acknowledgement.
- `docs/BACKEND_AUDIT_WALKTHROUGH.md` — laporan hasil pengerjaan ini.

Tidak ada perubahan pada frontend, endpoint, request schema, Dockerfile, `requirements.txt`, quality score, severity rules, atau storage architecture.

### C. Implementation

1. Input API `new_value` tetap string.
2. `coerce_manual_value()` mengonversi nilai berdasarkan dtype kolom:
	- Integer string menjadi `int`.
	- Decimal string menjadi `float`.
	- Nilai boolean menerima representasi umum true/false.
	- Nilai tanggal dikonversi menggunakan Pandas datetime.
	- Kolom object/string tetap string untuk menjaga leading zero nomor telepon.
3. Semua nilai edit dikonversi sebelum assignment pertama dilakukan.
4. Nilai numerik tidak valid menghasilkan validation error HTTP 400, bukan HTTP 500.
5. `_resolve_acknowledged_keys()` hanya menerima stable key atau legacy issue ID yang benar-benar terdapat pada pending issues.
6. Arbitrary string dengan karakter `:` tidak lagi dapat digunakan untuk bypass quality gate.
7. `acknowledged_issue_keys` disimpan pada metadata dataset final.
8. `GET /api/quality-gate/{dataset_id}` membaca metadata tersebut dan hanya mengabaikan issue yang stable key-nya memang diakui.

### D. Regression Tests

| Test | Expected | Actual | Status |
|---|---|---|---|
| Integer edit `"100"` ke kolom integer | HTTP 200; nilai menjadi integer | HTTP 200; `total_spent=100`; final dataset dan download dibuat | PASS |
| Float edit `"100.50"` ke kolom float | HTTP 200; nilai numerik benar | HTTP 200; final dataset dan download dibuat | PASS |
| Invalid numeric `"abc"` | HTTP 4xx, bukan 500 | HTTP 400 dengan validation error | PASS |
| Mark satu suspicious negative sebagai valid | Acknowledgement diterima | HTTP 200; `marked_valid_count=1` | PASS |
| Final gate setelah mark-valid | Issue acknowledged tidak blocking | `passed=true`, blocking issue `0` | PASS |
| Issue lain tetap blocking | Invalid email tidak ikut diabaikan | HTTP 400 saat invalid email belum diselesaikan | PASS |
| Final download | HTTP 200 dan CSV valid | HTTP 200; `text/csv`; CSV terbaca; tidak ada scientific notation | PASS |
| Unit regression suite | Semua test lulus | 4 test lulus | PASS |
| Compile check | Backend dapat dikompilasi | `compileall` lulus | PASS |

### E. Backward Compatibility

- Endpoint tidak berubah.
- `ManualEditRequest.new_value` tetap `string`.
- Format response API tetap kompatibel dengan frontend.
- `dataset_store` tetap in-memory.
- Metadata tambahan bersifat internal dan tidak merusak response API.
- Frontend tidak diubah.
- Quality score dan severity rules tidak diubah.
- Tidak ada migrasi Vercel.

### F. Remaining Issues

1. `QualityGateResult.acknowledged_count` masih dapat menghitung acknowledgement yang sama lebih dari sekali pada internal scan. Ini tidak memengaruhi keputusan blocking/passed, tetapi dapat dirapikan pada task terpisah.
2. `fastapi.testclient.TestClient` pada environment ini meminta dependency `httpx2`; regression HTTP dijalankan melalui Uvicorn dan `requests` yang sudah tersedia.
3. Package `google-generativeai` masih menampilkan warning deprecated. Tidak diubah karena berada di luar scope task.

### G. Changes Made

- Bug numeric manual edit diperbaiki.
- Bug persistence acknowledgement diperbaiki.
- Error input numeric invalid menjadi HTTP 400.
- Regression test ditambahkan dan lulus.
- Walkthrough ini diperbarui dengan hasil implementasi dan verifikasi.
- Tidak dilakukan migrasi Vercel.
