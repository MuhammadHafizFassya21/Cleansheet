# Backend Audit Walkthrough — CleanSheet AI

Dokumen ini berisi hasil audit backend CleanSheet AI secara read-only. Tidak ada kode aplikasi, dependency, endpoint, frontend, atau arsitektur yang diubah. Migrasi backend ke Vercel belum dilakukan.

Tanggal audit: 26 Agustus 2026

- **Health check:** Berhasil.
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

```text
backend/app/main.py
```

```text
app
```

Perintah eksekusi lokal:


### Router

Router yang diregistrasikan di `main.py`:

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

---

## Final Regression Test Report

Tanggal: 27 Agustus 2026

### A. Final Regression Summary

| Area | Status |
|---|---|
| Health | PASS |
| Upload | PASS |
| Analyze | PASS |
| Cleaning Preview | PASS |
| Cleaning Apply | PASS |
| Quality Gate | PASS; unresolved issues tetap blocking |
| Manual Review | PASS |
| Numeric Edit | PASS; integer dan float berhasil |
| Mark Valid | PASS; acknowledgement persisten |
| Final Gate | PASS; `passed=true`, blocking `0` |
| Download | PASS |
| AI Fallback | PASS |
| Error Handling | PASS; tidak ada unexpected HTTP 500 |
| Compile | PASS |

### B. Detailed Test

| # | Test | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Health | HTTP 200 | HTTP 200 | PASS |
| 2 | Upload | Dataset ID, filename, rows, columns, preview | 4 rows, 6 columns, preview tersedia | PASS |
| 3 | Analyze | Masalah dataset terdeteksi | Score 46, status `Critical`, 15 issues, 7 tipe isu | PASS |
| 4 | Cleaning Preview | Before-after dan source tidak berubah | 4 changes; source dataset tetap sama | PASS |
| 5 | Automatic Cleaning | Dataset cleaned dan metrics tersedia | 4 menjadi 3 rows, 1 duplicate dihapus, 2 cells berubah | PASS |
| 6 | Quality Gate cleaned | Isu unresolved tetap blocking | 6 blocking issues; gate `false` | PASS |
| 7 | Manual Review Scan | Issue list dan stable key valid | 6 issues; format `row:column:type` valid | PASS |
| 8 | Manual Validation | Valid diterima, invalid ditolak | Email, phone, numeric sesuai | PASS |
| 9 | Integer Edit | String `100` menjadi integer | HTTP 200; final dataset dibuat | PASS |
| 10 | Float Edit | String `100.50` menjadi float | HTTP 200; final dataset dibuat | PASS |
| 11 | Invalid Numeric | HTTP 4xx, bukan 500 | HTTP 400 dengan validation error | PASS |
| 12 | Mark Valid Persistence | Acknowledged issue tidak blocking | Final gate `passed=true`, blocking `0` | PASS |
| 13 | Other Issue Blocking | Issue lain tetap blocking | Invalid email yang belum selesai menolak request | PASS |
| 14 | Final Clean Dataset | Semua blocking selesai | `passed=true`, blocking `0` | PASS |
| 15 | Download | CSV terbaca dan phone aman | HTTP 200; CSV valid; tanpa scientific notation | PASS |
| 16 | AI Insight | Fallback tanpa API key | HTTP 200; fallback response | PASS |
| 17 | Error Handling | Error terkontrol | Unknown ID 404, invalid request 422, file errors 400 | PASS |
| 18 | Compilation | Compile berhasil | `python -m compileall app` berhasil | PASS |

### C. Regression Issues

#### Critical

Tidak ada regression issue baru.

#### High

Tidak ada regression issue baru.

#### Medium

- `fastapi.testclient.TestClient` memerlukan `httpx2` pada kombinasi package saat ini; test HTTP dijalankan melalui Uvicorn langsung.
- `google.generativeai` menampilkan warning deprecated, tetapi fallback dan endpoint AI tetap berjalan.

#### Low

- Parser menampilkan warning Pandas saat infer format tanggal pada beberapa input.
- Port Windows dapat menyisakan stale connection setelah proses Uvicorn dihentikan paksa.

### D. Deployment Readiness

**NOT READY untuk migrasi Vercel.**

Regression test API lulus, tetapi deployment belum dinyatakan siap karena storage masih in-memory, dependency belum dipin, dan diperlukan keputusan arsitektur storage untuk lingkungan serverless.

### E. Changes Made

- Tidak ada source code yang diubah selama final regression test.
- Tidak ada frontend, `requirements.txt`, atau Dockerfile yang diubah.
- Tidak ada API contract, quality score, atau severity rule yang diubah.
- Tidak ada API key yang dibuat atau diaktifkan.
- Tidak ada dataset production yang diubah.
- Tidak ada migrasi Vercel.
- Walkthrough ini diperbarui dengan hasil final regression.

---

# Vercel Compatibility Audit Report

Tanggal audit: 27 Agustus 2026

Audit ini hanya memeriksa kompatibilitas backend terhadap Vercel/serverless. Tidak ada deployment, project Vercel, perubahan source code, perubahan frontend, perubahan dependency, perubahan Dockerfile, atau perubahan API contract.

## 1. Executive Summary

### Code compatibility

**PARTIALLY COMPATIBLE.** FastAPI dapat dijalankan sebagai ASGI Function dan objek `app` tersedia. Endpoint menggunakan pola HTTP standar dan tidak membutuhkan SDK Cloud Run.

### Architecture compatibility

**NOT READY.** Backend saat ini menggunakan `dataset_store` dan `file_store` berbasis global in-memory dictionary. Workflow membutuhkan request berikutnya membaca state dari request sebelumnya, sedangkan serverless tidak menjamin request berikutnya menuju instance yang sama.

### Production readiness

**NOT READY.** Masalah utama adalah persistence dataset/file, runtime Python 3.11 yang tidak tercantum sebagai runtime Vercel yang tersedia saat audit, ukuran bundle dependency Pandas/Excel, dan belum adanya konfigurasi packaging Vercel untuk entrypoint nested.

### Kesimpulan keseluruhan

Backend **belum siap untuk migrasi Vercel production**. Untuk demo satu instance atau traffic rendah, Option A masih mungkin bekerja secara best-effort, tetapi tidak reliabel. Option B dengan external persistent storage adalah pilihan production yang lebih tepat.

## 2. Entrypoint Audit

| Item | Kondisi |
|---|---|
| File FastAPI | `backend/app/main.py` |
| Object FastAPI | `app` |
| Startup lokal | `uvicorn app.main:app --reload --port 8000` |
| Startup Docker | `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}` |
| Router registration | Health, Upload, Analyze, Clean, Manual Review, Quality Gate, AI |
| ASGI compatibility | Secara kode kompatibel; FastAPI app adalah ASGI application |
| Vercel auto-detection | Belum dapat diasumsikan dari root project karena file berada di nested `backend/app/main.py` |
| `vercel.json` | Tidak ada; belum dapat dipastikan wajib jika entrypoint dikonfigurasi melalui mekanisme Vercel lain |
| `pyproject.toml` | Tidak ada; belum ada `tool.vercel.entrypoint` |
| Perubahan struktur | Belum dilakukan sesuai scope audit |

Dokumentasi Vercel yang diperiksa menyatakan Vercel dapat memuat FastAPI dari entrypoint dengan nama file yang didukung dan object top-level `app`. Dokumentasi juga menyediakan konfigurasi `tool.vercel.entrypoint` untuk module custom. Karena project saat ini memiliki `backend/app/main.py` dan tidak memiliki konfigurasi Vercel custom, packaging/routing perlu diverifikasi pada tahap migrasi.

Vercel menjalankan FastAPI sebagai satu Vercel Function. Ini berbeda dari command Uvicorn lokal/Docker; command Uvicorn tidak perlu dijadikan startup command pada Function.

## 3. Filesystem Audit

| File/Location | Usage | Persistent? | Serverless Risk |
|---|---|---|---|
| `backend/app/main.py` | Import konfigurasi dan router | Tidak berlaku | Rendah |
| `backend/app/routers/*.py` | `Path(...)` hanya dependency parameter FastAPI, bukan filesystem path | Tidak | Rendah |
| `backend/app/services/parser_service.py` | Membaca upload dari bytes melalui `io.BytesIO` | Tidak | Rendah–Medium; dibatasi memory request |
| `backend/app/services/cleaning_engine.py` | Menghasilkan CSV ke bytes melalui Pandas | Tidak | Medium; seluruh output berada di memory |
| `backend/app/services/dataset_store.py` | Dictionary global berisi DataFrame | Tidak | **Critical**; hilang saat instance restart/berbeda |
| `backend/app/services/file_store.py` | Dictionary global berisi bytes CSV | Tidak | **Critical**; download ID dapat gagal pada instance berbeda |
| Repository files | Tidak dibaca oleh production code saat runtime | Tidak digunakan | Rendah |
| Local filesystem | Tidak ada `open()`, `pathlib` filesystem, `tempfile`, `shutil`, `os.path`, mkdir, file delete, atau file write di `backend/app` | Tidak | Rendah |

Klasifikasi:

- **File hanya dibaca:** tidak ada file runtime yang dibaca; upload diproses dari bytes.
- **File temporary:** FastAPI/Python dapat memakai buffering internal untuk upload, tetapi aplikasi sendiri tidak membuat temporary file.
- **File harus bertahan antar-request:** dataset dan CSV hasil cleaning secara konsep harus bertahan, tetapi saat ini hanya ada di memory.
- **File repository:** source Python dan konfigurasi dibundel saat deployment, bukan ditulis runtime.
- **Local filesystem:** tidak digunakan sebagai persistent storage.

Tidak ditemukan operasi `open()`, `Path` filesystem, `tempfile`, `shutil`, `os.path`, directory creation, file deletion, atau file write pada backend application code. `Path` yang ditemukan hanya digunakan sebagai parameter path FastAPI.

## 4. In-Memory Storage Audit

### `dataset_store.py`

Menyimpan:

- DataFrame lengkap.
- Nama file.
- Stage workflow.
- Timestamp.
- Metadata, termasuk acknowledgement issue.

Masa hidup: sekitar 30 menit berdasarkan lazy cleanup. Data hilang jika process restart.

Endpoint yang bergantung pada persistence ini:

- `GET /api/analyze/{dataset_id}`
- `POST /api/clean/preview` dengan `dataset_id`
- `POST /api/clean/apply` dengan `dataset_id`
- `GET /api/manual-review/issues/{dataset_id}`
- `POST /api/manual-review/apply` dengan `dataset_id`
- `GET /api/quality-gate/{dataset_id}`

### `file_store.py`

Menyimpan:

- Bytes CSV hasil cleaning.
- Nama file.
- Timestamp.

Masa hidup: sekitar 30 menit berdasarkan lazy cleanup.

Endpoint yang bergantung pada persistence ini:

- `GET /api/clean/download/{download_id}`

### Risiko serverless

Request A membuat `dataset_id` atau `download_id`. Request B kemudian memakai ID tersebut. Jika Request B masuk ke instance berbeda, dictionary global kosong dan API mengembalikan 404. Ini adalah risiko **Critical** untuk workflow multi-request production.

## 5. Upload Audit

Endpoint upload membaca seluruh body upload ke memory:

```text
contents = file.file.read()
```

Batas aplikasi:

- Maksimum: 5 MB (`5 * 1024 * 1024`).
- Multipart handling: `python-multipart`.
- CSV/TXT: `pandas.read_csv(io.BytesIO(...))`.
- TSV: `pandas.read_csv(..., sep="\t")`.
- XLSX: `pandas.read_excel(..., engine="openpyxl")`.
- XLS: `pandas.read_excel(...)`.

Risiko:

- File bytes berada di memory sebelum Pandas membuat DataFrame.
- Pandas membuat salinan/intermediate object tambahan.
- Analisis berikutnya melakukan banyak scan cell dengan `iterrows()`.
- Excel parsing lebih berat daripada CSV.
- Batas 5 MB aplikasi tidak otomatis sama dengan batas request/body Vercel plan.
- Sebelum migration, limit tersebut harus dibandingkan dengan limit Vercel account/plan yang dipakai; audit ini tidak mengubah limit dan tidak melakukan deployment.

Penilaian: **Medium** untuk CSV kecil, **High** untuk Excel atau request yang mendekati batas 5 MB.

## 6. Processing & Memory Risk

### Endpoint processing

| Endpoint | Operasi | Time Risk | Memory Risk |
|---|---|---|---|
| `POST /api/upload/` | Buffer upload, Pandas parse, metadata, sample detection | Medium | Medium |
| `POST /api/analyze/` | Parse dan 7 detector kualitas seluruh DataFrame | High | High |
| `GET /api/analyze/{dataset_id}` | 7 detector terhadap DataFrame tersimpan | High | High |
| `POST /api/clean/preview` | Analisis, rekomendasi, preview action | High | High |
| `POST /api/clean/apply` | Cleaning, safety net, quality gate, CSV jika lulus | High | High |
| `POST /api/manual-review/issues` | Parse dan scan manual issue | Medium–High | Medium–High |
| `GET /api/manual-review/issues/{dataset_id}` | Scan DataFrame tersimpan | Medium–High | Medium |
| `POST /api/manual-review/apply` | Edit, quality gate, CSV export | High | High |
| `GET /api/quality-gate/{dataset_id}` | Safety net dan full quality scan | High | High |
| `POST /api/ai/insight` | Synchronous Gemini call jika key aktif; fallback jika tidak | Medium/variable | Rendah |

Tidak dilakukan benchmark eksternal sesuai instruksi. Penilaian di atas adalah static risk berdasarkan jumlah scan, operasi Pandas, dan synchronous network call.

## 7. Environment Variables

### Required secara runtime saat ini

Tidak ada environment variable yang wajib untuk startup dasar. Default digunakan jika variable tidak tersedia.

### Optional

- `APP_ENV`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `PORT`

### Development-oriented

- `APP_ENV=development`
- `FRONTEND_URL=http://localhost:3000`
- `ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`
- `PORT=8000`

### Production

- `APP_ENV=production`
- `FRONTEND_URL` dengan domain frontend production.
- `ALLOWED_ORIGINS` dengan origin frontend production.
- `GEMINI_API_KEY` melalui platform secret, bukan source code.
- `GEMINI_MODEL` jika ingin menentukan model.
- `PORT` dikelola platform/container; tidak diperlukan sebagai startup command Vercel Function dengan pola Uvicorn Docker.

`load_dotenv()` sekarang dipanggil oleh `main.py`. Nilai environment yang sudah disediakan platform tidak ditimpa karena default `override=False`.

## 8. Dependency Audit

| Dependency | Peran | Status Vercel/serverless | Risiko |
|---|---|---|---|
| `fastapi` | Web framework ASGI | Cocok secara konsep | Rendah |
| `uvicorn` | Local/Docker ASGI server | Tidak menjadi server process utama pada Vercel Function | Rendah; runtime-specific |
| `pandas` | Processing dan quality engine | Bisa dipakai, tetapi berat dan memory-intensive | High untuk bundle/memory |
| `openpyxl` | XLSX parsing | Pure Python, dapat dibundel | Medium; menambah ukuran dan processing time |
| `python-multipart` | Multipart upload | Dibutuhkan endpoint upload | Rendah |
| `python-dotenv` | Membaca `.env` lokal | Tidak dibutuhkan jika platform inject env; tetap kompatibel | Rendah |
| `google-generativeai` | Gemini API | Terpasang, tetapi deprecated | Medium–High; perlu evaluasi sebelum production |
| `requests` | Test helper | Dipakai script test, bukan requirements production | Rendah; tidak tercantum di requirements |

Package yang berpotensi berat:

- `pandas`.
- Dependency transitive Pandas seperti NumPy.
- `openpyxl`.
- Dependency transitive Google Gemini seperti gRPC/protobuf/auth.

Package yang membutuhkan native/system behavior: Pandas/NumPy dapat membawa binary wheels; kompatibilitas tergantung Python runtime dan build image. `openpyxl` lebih ringan secara native, tetapi Excel parsing tetap CPU/memory intensive.

Package deprecated: `google-generativeai` menampilkan warning bahwa dukungan package telah berakhir. Library tidak diganti pada audit ini sesuai instruksi.

Package testing: script test menggunakan `requests`; `requests` tidak ada pada `requirements.txt`, tetapi bukan dependency application route.

## 9. Python Version

Dockerfile project menggunakan Python `3.11-slim` dan environment restore menggunakan Python `3.11.15`.

Dokumentasi Vercel yang diperiksa saat audit mencantumkan runtime Python:

- 3.12 sebagai default.
- 3.13.
- 3.14.

Python 3.11 tidak tercantum dalam daftar runtime Vercel tersebut. Karena itu, Python 3.11 **tidak boleh diasumsikan tersedia** sebagai runtime native Vercel target.

Penilaian: **High blocking compatibility risk**. Kode Python mungkin kompatibel dengan 3.12+, tetapi dependency dan behavior harus diuji pada runtime target. Audit ini tidak mengubah versi Python.

## 10. Cloud Run Dependency

| Item | Classification | Keterangan |
|---|---|---|
| FastAPI/Pandas business logic | Not required | Tidak bergantung Cloud Run |
| `PORT` pada Dockerfile | Deployment only | Diperlukan pola container/Cloud Run; bukan kebutuhan utama Function |
| Dockerfile | Deployment only | Dipakai container, tidak otomatis menjadi Vercel Function packaging |
| Cloud Run command | Not required on Vercel | Vercel memuat Function dari entrypoint |
| Google Secret Manager | Deployment only | Hanya rekomendasi secret production Cloud Run |
| Cloud Storage | Not used | Tidak ada kode Cloud Storage |
| Service account | Not used | Tidak ditemukan |
| GCP metadata | Not used | Tidak ditemukan |
| Google Cloud SDK | Not used | Tidak ada import `google.cloud` |

Kesimpulan: tidak ada hard dependency Cloud Run. `PORT`, Dockerfile, dan dokumentasi Cloud Run adalah deployment-specific.

## 11. Gemini Audit

Implementasi berada di `backend/app/services/ai_service.py`.

- API key dibaca dari `GEMINI_API_KEY`.
- Model dibaca dari `GEMINI_MODEL`.
- SDK di-import secara lazy.
- Request dilakukan secara synchronous melalui `model.generate_content()`.
- Tidak ada timeout eksplisit pada panggilan Gemini.
- Exception ditangkap dan diarahkan ke fallback.
- Response JSON diekstrak dengan parser aman.
- Prompt hanya berisi summary statistik, bukan full dataset.
- Tanpa API key, fallback langsung digunakan.

Serverless risk:

- Synchronous AI call dapat memperpanjang duration Function.
- Tidak ada timeout eksplisit di level SDK call.
- Dependency package deprecated.
- Secret harus di-inject sebagai environment variable platform.

Penilaian: **Medium** jika fallback-only; **High** jika Gemini real call digunakan pada endpoint production tanpa timeout dan library replacement plan.

## 12. CORS Audit

Konfigurasi:

- Jika `ALLOWED_ORIGINS` tersedia, digunakan sebagai daftar utama.
- Jika tidak, `FRONTEND_URL` digunakan.
- Jika keduanya kosong, default localhost digunakan.
- Pada development, localhost ditambahkan.
- Pada non-development, wildcard `*` difilter.
- `allow_credentials=True`.
- Methods dan headers diizinkan `*`.

Production requirement:

- `ALLOWED_ORIGINS` harus berisi domain frontend production yang benar.
- Jangan menggunakan wildcard production.
- Jika frontend tetap di Vercel, origin preview/production perlu direncanakan.

Penilaian: **Medium configuration risk**, bukan blocker kode. Konfigurasi deployment wajib benar.

## 13. API Compatibility

Secara kontrak, endpoint berikut dapat dipertahankan:

- HTTP method.
- Path.
- Multipart fields.
- JSON body AI/validation.
- Response models.
- `dataset_id`.
- `cleaned_dataset_id`.
- `final_dataset_id`.
- `download_id`.

Potensi masalah saat serverless:

1. `dataset_id` mengasumsikan state in-memory lintas request.
2. `download_id` mengasumsikan file bytes tersedia pada request download berikutnya.
3. Function instance berbeda dapat menyebabkan 404 meskipun ID valid secara waktu.
4. Cold start dan dependency bundle dapat menambah latency.
5. Python 3.11 belum tercantum sebagai runtime Vercel target yang diperiksa.

Kesimpulan: API contract **dapat dipertahankan**, tetapi backend storage implementation di belakang contract belum serverless-safe.

## 14. Architecture Comparison

### Option A — Vercel Frontend → Vercel FastAPI → In-memory storage

- Compatibility: kode endpoint cukup dekat, tetapi runtime/entrypoint perlu packaging.
- Complexity: rendah.
- Reliability: rendah; request lintas instance dapat kehilangan dataset/download.
- Cocok demo/event: hanya demo singkat, satu instance, traffic rendah.
- Cocok production: tidak cocok.

### Option B — Vercel Frontend → Vercel FastAPI → External persistent storage

- Compatibility: paling sesuai untuk workflow multi-request.
- Complexity: medium–high.
- Reliability: tinggi jika storage dan expiry dirancang baik.
- Cocok demo/event: cocok, tetapi setup lebih banyak.
- Cocok production: paling direkomendasikan.
- Catatan: dapat memakai object storage/database/managed storage sesuai keputusan arsitektur berikutnya; tidak diimplementasikan pada audit ini.

### Option C — Vercel Frontend → Vercel FastAPI → Cloud Run

- Compatibility: frontend dan backend terpisah; backend tetap memakai model container yang sudah ada.
- Complexity: medium.
- Reliability: lebih baik daripada in-memory Vercel, terutama jika Cloud Run tetap single service dan workflow masih sesuai.
- Cocok demo/event: sangat cocok jika deployment Cloud Run yang ada masih aktif.
- Cocok production: cocok sebagai transitional architecture, tetapi tetap perlu storage persistent jika scaling/availability penting.

### Ringkasan

| Option | Compatibility | Complexity | Reliability | Demo/Event | Production |
|---|---|---|---|---|---|
| A: In-memory Vercel | Partial | Rendah | Rendah | Terbatas | Tidak cocok |
| B: External storage | Tinggi setelah adaptasi | Medium–High | Tinggi | Cocok | Paling cocok |
| C: Cloud Run backend | Tinggi dengan perubahan minimal | Medium | Medium–High | Sangat cocok | Cocok sebagai transisi |

Tidak ada opsi yang diimplementasikan.

## 15. Blocking Issues

### CRITICAL

1. In-memory `dataset_store` tidak menjamin dataset tersedia pada request berikutnya di serverless instance berbeda.
2. In-memory `file_store` tidak menjamin `download_id` dapat di-download pada instance berbeda.

### HIGH

1. Python `3.11` project tidak tercantum pada runtime Vercel yang diperiksa; target terdokumentasi adalah 3.12–3.14.
2. Pandas/NumPy dan dependency Google berpotensi menghasilkan bundle besar serta cold start/memory tinggi.
3. Endpoint analisis/cleaning melakukan full DataFrame processing dan synchronous scans sehingga risk duration tinggi untuk file besar.
4. Entrypoint nested `backend/app/main.py` belum memiliki konfigurasi Vercel custom seperti `tool.vercel.entrypoint` dan belum diuji deployment.

### MEDIUM

1. Tidak ada timeout eksplisit untuk synchronous Gemini call.
2. `google-generativeai` deprecated.
3. CORS production bergantung pada environment variable yang harus tepat.
4. Batas 5 MB aplikasi belum diverifikasi terhadap batas platform/plan Vercel target.
5. Upload dibaca penuh ke memory dan Excel lebih berat daripada CSV.

### LOW

1. `uvicorn` tetap ada sebagai dependency untuk local/Docker, tetapi bukan process model utama Vercel Function.
2. `python-dotenv` kemungkinan tidak dibutuhkan di production jika environment disediakan platform.
3. Warning inferensi tanggal Pandas dapat menambah noise/log dan sedikit overhead.

## Recommended Migration Strategy

Tidak ada migrasi yang dilakukan dalam audit ini. Urutan paling aman untuk tahap berikutnya:

1. Putuskan target runtime Vercel yang benar-benar tersedia, lalu uji dependency pada Python target tanpa mengubah production dulu.
2. Tentukan packaging entrypoint nested: konfigurasi custom entrypoint atau struktur deployment terpisah.
3. Pertahankan API contract yang ada.
4. Ganti hanya persistence internal dari global memory ke external persistent storage; jangan mengubah business logic lebih luas dari kebutuhan.
5. Pastikan dataset dan download object memiliki expiry, ownership/session binding, dan cleanup.
6. Tambahkan timeout/error policy untuk Gemini; tetap pertahankan fallback.
7. Evaluasi bundle size dan cold start dependency Pandas, Excel, dan Gemini.
8. Validasi limit upload platform terhadap limit aplikasi 5 MB.
9. Uji CORS dengan domain production dan preview yang diperlukan.
10. Jalankan regression test yang sama pada environment target.
11. Lakukan deployment preview terbatas, bukan production langsung.
12. Uji workflow multi-request pada cold start dan beberapa instance.
13. Setelah hasil stabil, baru putuskan antara Option B atau Option C.

## Audit Changes

- Tidak ada source code yang diubah.
- Tidak ada frontend yang diubah.
- Tidak ada `requirements.txt` yang diubah.
- Tidak ada Dockerfile yang diubah.
- Tidak ada API contract yang diubah.
- Tidak ada deployment.
- Tidak ada project Vercel yang dibuat.
- Tidak ada API key yang diaktifkan.
- Tidak ada migrasi Vercel.
- Hanya walkthrough ini yang akan memuat hasil audit ini.

---

## Final Migration Implementation Plan

Plan implementasi persistent storage telah dibuat di:

`docs/FINAL_MIGRATION_IMPLEMENTATION_PLAN.md`

Dokumen tersebut berisi final architecture, interface store, schema database, struktur Vercel Blob, lifecycle, acknowledgement persistence, failure handling, atomicity, environment variables, dependencies, file change plan, API compatibility, migration phases, rollback, migration risk, dan checklist implementasi.

Status pekerjaan:

- Tidak ada source code yang diubah.
- Tidak ada package yang di-install.
- Tidak ada database yang dibuat.
- Tidak ada deployment.
- Tidak ada project Vercel.
- Tidak ada frontend atau API contract yang diubah.

---

# Persistent Storage Architecture Design Report

Tanggal: 27 Agustus 2026

Status: **DESIGN ONLY — NO CODE CHANGES**

Tidak ada source code, frontend, API contract, business logic, dependency, database, deployment, atau project Vercel yang dibuat/diubah dalam desain ini.

## A. Current Storage Architecture

Saat ini backend menggunakan dua global dictionary in-memory:

```text
dataset_store.DATASETS
└── dataset_id -> {
			df: pandas.DataFrame,
			file_name: string,
			stage: string,
			created_at: timestamp,
			metadata: object
		}

file_store.CLEANED_FILES
└── download_id -> {
			bytes: bytes,
			file_name: string,
			created_at: timestamp
		}
```

Storage ini hanya hidup di process memory. Ia bukan database, bukan object storage, dan tidak bertahan ketika process restart atau request masuk ke instance berbeda.

## B. Dataset Store Analysis

### Struktur internal

- Key: `dataset_id`, biasanya `ds_` diikuti token UUID.
- Value: object dictionary berisi DataFrame dan metadata workflow.
- DataFrame: salinan (`df.copy()`) dari dataset yang diunggah atau hasil transformasi.
- `file_name`: nama file asal atau nama hasil cleaning.
- `stage`: contoh `uploaded`, `analyzed`, `auto_cleaned`, `manually_reviewed`.
- `created_at`: timestamp Unix untuk expiry.
- `metadata`: dictionary bebas, termasuk source dan acknowledgement key pada final dataset.
- `acknowledged_issue_keys`: saat ini disimpan di metadata final dataset, bukan field top-level terpisah.

### Expiry mechanism

- TTL nominal: 30 menit (`MAX_AGE_SECONDS = 30 * 60`).
- Cleanup bersifat lazy: dijalankan ketika `save_dataset()`, `get_dataset()`, `update_dataset()`, atau operasi terkait dipanggil.
- Tidak ada scheduler/background cleanup.
- Akses dataset tidak memperpanjang TTL pada `get_dataset()`.
- Restart process menghapus seluruh dataset tanpa menunggu TTL.

### Public dan internal methods

| Method | Jenis | Fungsi |
|---|---|---|
| `save_dataset()` | Public | Menyimpan DataFrame, nama file, stage, metadata, dan dataset ID |
| `get_dataset()` | Public | Mengambil payload berdasarkan dataset ID |
| `update_dataset()` | Public | Mengganti DataFrame/stage dan mereset timestamp |
| `delete_dataset()` | Public | Menghapus dataset berdasarkan ID |
| `save_cleaned_dataset()` | Public helper | Menyimpan hasil auto-clean dengan stage `auto_cleaned` |
| `_cleanup_expired_datasets()` | Internal | Menghapus dataset melewati TTL |

### Data inventory

| Data | Tipe | Digunakan Oleh | Harus Persistent? | Bisa Direkonstruksi? |
|---|---|---|---|---|
| Dataset DataFrame | `pandas.DataFrame` | Analyze, Clean, Manual Review, Quality Gate | Ya selama workflow aktif | Ya, dari dataset object CSV/Parquet |
| `dataset_id` | `str` | Semua endpoint berbasis dataset | Ya selama TTL | Tidak untuk referensi client yang sudah diterima |
| `file_name` | `str` | Clean, Report, export | Ya | Sebagian, jika nama asal ikut metadata object |
| `stage` | `str` | Report dan status workflow | Ya | Ya dari event/history, tetapi lebih baik disimpan |
| `created_at` | `float` | Expiry cleanup | Ya | Ya, tetapi harus authoritative |
| Source metadata | `dict` | Upload, analyze, manual review | Ya jika audit diperlukan | Sebagian |
| `acknowledged_issue_keys` | `list[str]` | Manual Apply dan Quality Gate | Ya, wajib | Tidak boleh ditebak ulang dari DataFrame |

## C. File Store Analysis

### Struktur internal

- Key: `download_id`, format `clean_` diikuti token UUID.
- `bytes`: isi CSV final dalam memory.
- `file_name`: nama file download.
- `created_at`: timestamp Unix.
- Content type: tidak disimpan sebagai field; endpoint selalu mengembalikan `text/csv; charset=utf-8`.

### Expiry mechanism

- TTL nominal: 30 menit.
- Cleanup lazy melalui `_cleanup_expired_files()`.
- Tidak ada persistence setelah restart.
- Tidak ada checksum, ukuran file, atau relasi explicit ke `dataset_id`.

### Methods

| Method | Jenis | Fungsi |
|---|---|---|
| `save_cleaned_csv()` | Public | Menyimpan bytes CSV dan mengembalikan `download_id` |
| `get_cleaned_csv()` | Public | Mengambil bytes/nama file untuk download |
| `_cleanup_expired_files()` | Internal | Menghapus file yang melewati TTL |

### Data inventory

| Data | Tipe | Digunakan Oleh | Harus Persistent? | Bisa Direkonstruksi? |
|---|---|---|---|---|
| CSV bytes | `bytes` | Download endpoint | Ya sampai download/TTL | Ya dari final DataFrame, tetapi mahal jika dataset sudah tidak tersedia |
| `download_id` | `str` | Frontend download link | Ya sampai download/TTL | Tidak untuk link yang sudah dikirim |
| Filename | `str` | `Content-Disposition` | Ya | Ya dari dataset metadata |
| Content type | Tidak disimpan | Download endpoint | Sebaiknya metadata tetap | Ya, saat ini selalu CSV |
| `created_at` | `float` | Expiry cleanup | Ya | Ya, tetapi harus authoritative |
| Dataset relation | Tidak ada field langsung | Workflow audit/cleanup | Sebaiknya ya | Tidak dari bytes saja |

## D. Workflow Persistence Map

```text
UPLOAD
	↓ creates dataset_id
STORE ORIGINAL DATASET
	↓ reads dataset_id
ANALYZE
	↓ reads dataset_id
CLEAN PREVIEW
	↓ reads dataset_id
CLEAN APPLY
	↓ creates cleaned_dataset_id and optionally download_id
MANUAL REVIEW
	↓ reads cleaned_dataset_id
MANUAL APPLY
	↓ creates final_dataset_id and download_id
FINAL QUALITY GATE
	↓ reads final_dataset_id and acknowledgement metadata
DOWNLOAD
	↓ reads download_id
EXPIRE
	↓ delete dataset objects, download objects, and metadata
```

### ID trace

| ID | Dibuat Oleh | Dibaca Oleh | Data terkait | Expire | Harus persistent? |
|---|---|---|---|---|---|
| `dataset_id` | Upload, Analyze, Clean, atau Manual Review upload | Analyze, Clean, Manual Review, Quality Gate | Dataset original/current DataFrame + metadata | 30 menit saat ini | Ya, wajib lintas request |
| `cleaned_dataset_id` | `POST /api/clean/apply` | Manual Review, Quality Gate, Report | DataFrame setelah auto-clean + metadata | 30 menit saat ini | Ya, wajib lintas request |
| `final_dataset_id` | `POST /api/manual-review/apply` | Report, Quality Gate | DataFrame final + stage + acknowledgement | 30 menit saat ini | Ya sampai final download/report |
| `download_id` | `save_cleaned_csv()` pada Clean/Manual Apply | `GET /api/clean/download/{download_id}` | CSV bytes + filename | 30 menit saat ini | Ya sampai download |

### Consumer trace

| File | Endpoint/Fungsi | Pemakaian |
|---|---|---|
| `routers/upload.py` | `POST /api/upload/` → `save_dataset()` | Menyimpan DataFrame original dengan stage `uploaded` |
| `routers/analyze.py` | `POST /api/analyze/` → `save_dataset()` | Menyimpan upload dengan stage `analyzed` |
| `routers/analyze.py` | `GET /api/analyze/{dataset_id}` → `get_dataset()` | Membaca DataFrame untuk analisis ulang |
| `routers/clean.py` | `_load_dataframe()` → `get_dataset()` | Memuat dataset untuk preview/apply |
| `routers/clean.py` | `POST /api/clean/apply` → `save_dataset()` | Menyimpan `cleaned_dataset_id` |
| `routers/clean.py` | `POST /api/clean/apply` → `save_cleaned_csv()` | Membuat `download_id` jika gate lulus |
| `routers/clean.py` | `GET /api/clean/download/{download_id}` → `get_cleaned_csv()` | Mengambil bytes untuk StreamingResponse |
| `routers/manual_review.py` | `POST /issues` → `save_dataset()` | Menyimpan dataset upload manual review |
| `routers/manual_review.py` | `GET /issues/{dataset_id}` → `get_dataset()` | Membaca dataset untuk scan manual |
| `routers/manual_review.py` | `POST /apply` → `get_dataset()` | Membaca dataset cleaned/current |
| `routers/manual_review.py` | `POST /apply` → `save_cleaned_csv()` | Membuat final download ID |
| `routers/manual_review.py` | `POST /apply` → `save_dataset()` | Menyimpan final dataset dan acknowledgement metadata |
| `routers/quality_gate.py` | `GET /{dataset_id}` → `get_dataset()` | Membaca DataFrame dan metadata acknowledgement |

Tidak ditemukan consumer `dataset_store` atau `file_store` lain di luar router dan service yang tercantum.

## E. Storage Options Comparison

| Criteria | Blob | DB + Blob | Object + DB |
|---|---|---|---|
| Bentuk | Vercel Blob menyimpan dataset, metadata JSON, dan CSV | Managed database menyimpan metadata; Vercel Blob menyimpan dataset/file | Object storage provider menyimpan dataset/file; database menyimpan metadata |
| Cocok | Demo kecil dan workflow sederhana | Sangat cocok untuk Vercel-native portfolio | Sangat cocok untuk production multi-provider |
| Complexity | Rendah | Medium | Medium–High |
| Reliability | Medium; metadata/query terbatas | Tinggi | Tinggi |
| Cost | Rendah pada traffic kecil | Rendah–Medium tergantung DB | Rendah–Medium tergantung provider |
| Python compatibility | Memerlukan HTTP SDK/API call | Memerlukan DB client + Blob API | Memerlukan object SDK + DB client |
| Dataset <5 MB | Cocok | Cocok | Cocok |
| Workflow 30 menit | Bisa, dengan object metadata/TTL | Cocok dan mudah dilacak | Cocok dan fleksibel |
| Project mahasiswa | Paling sederhana | Masih realistis | Bisa terlalu kompleks |
| Production | Tidak ideal untuk state kompleks | Cocok | Paling kuat secara umum |
| Dataset storage | Blob object CSV/Parquet | Blob object CSV/Parquet | Object CSV/Parquet |
| Metadata storage | JSON object atau blob metadata | Row metadata di managed DB | Row metadata di database |
| Download storage | CSV object dengan download ID | CSV object dengan download record | CSV object dengan download record |
| Cleanup | Cron/lazy listing diperlukan | TTL/cron DB + Blob cleanup | Lifecycle policy object + metadata cleanup |

### Evaluasi format DataFrame

#### A. CSV/Parquet di object storage

Paling sesuai dengan workload saat ini. Backend tetap mengambil seluruh object ke memory ketika perlu memprosesnya dengan Pandas. Parquet lebih efisien untuk tipe data dan ukuran, sedangkan CSV lebih mudah dipertahankan kompatibilitasnya dengan export/download saat ini.

#### B. Database rows

Kurang sesuai untuk MVP ini. Quality engine memindai DataFrame penuh, sehingga dataset tetap harus direkonstruksi menjadi DataFrame. Penyimpanan per-row menambah mapping, schema handling, serialization, dan kompleksitas tanpa keuntungan besar untuk dataset maksimal 5 MB.

#### C. Metadata database + dataset object storage

Paling seimbang untuk jangka panjang. Object menyimpan isi dataset/version, database menyimpan ID, object key, stage, TTL, filename, status quality gate, acknowledgement keys, dan relasi download.

## F. Recommended Architecture

### Rekomendasi untuk kondisi sekarang

**Option B: Managed metadata store + Vercel Blob.**

Secara logis ini memakai pola **metadata database + dataset object storage**, tetapi Vercel Blob dipilih sebagai object layer karena backend target adalah Vercel dan dataset maksimal hanya 5 MB.

### Rancangan internal

```text
metadata store
├── dataset_id
├── object_key
├── file_name
├── stage
├── created_at
├── expires_at
├── acknowledged_issue_keys
└── current_download_id/object_key

Vercel Blob
├── original/{dataset_id}.csv
├── cleaned/{cleaned_dataset_id}.csv
├── final/{final_dataset_id}.csv
└── downloads/{download_id}.csv
```

### Alasan teknis

- Tidak menyimpan DataFrame sebagai database rows.
- Pandas tetap dapat membaca object secara penuh saat processing.
- API contract tetap memakai ID yang sama.
- Metadata acknowledgement dapat dibaca konsisten oleh final quality gate.
- Download tidak bergantung pada memory instance.
- Cocok untuk dataset kecil dan TTL sekitar 30 menit.
- Lebih sederhana daripada membangun schema database untuk setiap cell.
- Lebih reliable daripada Blob saja untuk stage, expiry, dan relasi ID.
- Tidak mengharuskan Cloud Run tetap hidup.

## G. Data Lifecycle

| Stage | Dataset original | Cleaned dataset | Final dataset | CSV download | Metadata |
|---|---|---|---|---|---|
| Upload | Simpan object original | Belum ada | Belum ada | Belum ada | Simpan dataset ID, filename, created/expiry, stage |
| Analyze | Baca object original | Belum ada | Belum ada | Belum ada | Simpan status/analysis summary jika dibutuhkan |
| Clean | Tetap sampai TTL | Simpan object cleaned | Belum ada | Simpan bila gate lulus | Simpan cleaned ID dan stage |
| Manual Review | Opsional sebagai ancestor | Baca cleaned object | Belum ada | Belum ada | Baca issue/acknowledgement state |
| Final | Opsional | Opsional | Simpan final object | Simpan final CSV | Simpan final ID dan acknowledgement |
| Download | Tidak berubah | Tidak berubah | Tidak berubah | Baca download object | Update access jika diperlukan |
| Expire | Hapus | Hapus | Hapus | Hapus | Hapus metadata |

Rekomendasi lifecycle:

- TTL default: 30 menit seperti behavior saat ini.
- `expires_at` harus disimpan sebagai metadata authoritative.
- Cleanup: object lifecycle policy jika tersedia, ditambah scheduled cleanup untuk metadata; lazy cleanup dapat menjadi fallback.
- Dataset asli: simpan selama workflow agar retry/analyze tetap mungkin.
- Cleaned dataset: simpan sampai final workflow selesai.
- Final dataset: simpan sampai TTL selesai atau sampai download/report selesai.
- CSV download: simpan sebagai object terpisah atau gunakan final object langsung dengan download token.
- Metadata: wajib disimpan sampai seluruh object terkait expired.
- Penghapusan harus idempotent; object yang sudah hilang tidak boleh menggagalkan cleanup berikutnya.

## H. Security Considerations

Saat ini belum ada authentication atau authorization.

### Jika `dataset_id` diketahui

Seseorang dapat mencoba membaca metadata/isi workflow, melakukan analyze, clean preview, atau memicu operasi lain pada dataset tersebut selama ID masih aktif.

### Jika `download_id` diketahui

Seseorang dapat mengunduh CSV hasil cleaning selama token masih aktif. Ini lebih sensitif karena download ID langsung merepresentasikan akses file.

### Apakah ID saat ini cukup sulit ditebak?

ID berbasis UUID hex pendek lebih sulit ditebak daripada integer berurutan, tetapi bukan pengganti authorization. Token tersebut harus dianggap bearer token.

### Rekomendasi tanpa implementasi

- Gunakan token acak cryptographically secure dengan entropy memadai.
- Jangan menampilkan dataset/file ID di log publik.
- Tambahkan session binding atau ownership token ketika login/auth tersedia.
- Validasi bahwa dataset dan download masih aktif serta saling terkait.
- Gunakan signed/expiring download URL atau server-side authorization.
- Hindari metadata yang memuat data pribadi mentah.
- Pertahankan TTL pendek untuk demo tanpa login.

## I. Files Likely To Change

Kemungkinan perubahan pada tahap implementasi:

- `backend/app/services/dataset_store.py` — adapter persistence dataset/metadata.
- `backend/app/services/file_store.py` — adapter object storage dan download metadata.
- `backend/app/routers/upload.py` — menyimpan object dan metadata melalui adapter.
- `backend/app/routers/analyze.py` — mengambil dataset object berdasarkan ID.
- `backend/app/routers/clean.py` — menyimpan cleaned object dan download object.
- `backend/app/routers/manual_review.py` — membaca/menyimpan acknowledgement dan final object.
- `backend/app/routers/quality_gate.py` — membaca metadata acknowledgement persisted.
- `backend/app/services/quality_gate_service.py` — kemungkinan hanya jika bentuk metadata berubah.
- `backend/.env.example` dan environment deployment — URL/bucket/token storage non-secret names.
- `requirements.txt` — hanya jika SDK storage/DB memang dipilih dan diperlukan.

File yang **tidak perlu diubah secara konseptual**:

- `frontend/**`, selama API contract tetap sama.
- `backend/app/models/**`, selama response/request schema dipertahankan.
- `backend/app/services/quality_engine.py`, `cleaning_engine.py`, dan parser, kecuali adapter loading membutuhkan interface baru.

Tidak ada file yang diubah dalam task desain ini.

## J. Migration Risk

### CRITICAL

1. Global in-memory dataset store menyebabkan dataset hilang antar-instance.
2. Global in-memory file store menyebabkan download ID dapat menghasilkan 404 antar-instance.
3. Tanpa authentication, siapa pun yang memiliki ID dapat mencoba mengakses resource bearer-token.

### HIGH

1. Migrasi harus mempertahankan format `dataset_id`, `cleaned_dataset_id`, `final_dataset_id`, dan `download_id` agar frontend tidak rusak.
2. Runtime Vercel target dan entrypoint nested perlu divalidasi sebelum deployment.
3. Pandas full-load processing dapat melebihi memory/duration Function untuk file yang mendekati limit.
4. Kegagalan partial write antara metadata dan object dapat membuat ID menunjuk object yang tidak ada.

### MEDIUM

1. TTL object dan TTL metadata dapat tidak sinkron.
2. Upload/download 5 MB perlu dibandingkan dengan limit plan Vercel.
3. SDK storage menambah dependency dan kemungkinan cold start.
4. Gemini synchronous call tetap tidak memiliki timeout eksplisit.

### LOW

1. Lazy cleanup memory saat ini harus diganti atau dilengkapi lifecycle cleanup.
2. Content type belum menjadi field file store, walaupun saat ini seluruh output berupa CSV.
3. Metadata saat ini tidak memiliki relasi download yang eksplisit.

## K. Final Recommendation

Untuk mahasiswa, portfolio project, dataset maksimal 5 MB, workflow sekitar 30 menit, tanpa login, traffic rendah, frontend Vercel, dan target backend Vercel:

**Gunakan Option B: Vercel Blob untuk dataset/file + managed metadata store untuk state workflow.**

Prinsip implementasinya:

1. Simpan dataset sebagai object CSV/Parquet, bukan sebagai database rows.
2. Simpan metadata, stage, TTL, object key, dan acknowledgement di metadata store.
3. Simpan CSV final/download sebagai object yang dirujuk oleh `download_id`.
4. Pertahankan semua endpoint dan response API yang sudah ada.
5. Ambil ulang object menjadi DataFrame pada setiap request processing.
6. Terapkan TTL 30 menit dan cleanup terjadwal/lifecycle policy.
7. Jangan memilih PostgreSQL atau database rows sebelum kebutuhan query relasional benar-benar muncul.

Option A cukup untuk demo sangat singkat tetapi tidak reliable. Option C paling fleksibel untuk production multi-cloud, tetapi lebih kompleks daripada kebutuhan project saat ini. Option B adalah kompromi terbaik antara kesederhanaan Vercel, persistence workflow, kompatibilitas Python, dan reliability.

## Design Changes

- Tidak ada source code yang diubah.
- Tidak ada database yang dibuat.
- Tidak ada package yang di-install.
- Tidak ada deployment.
- Tidak ada project Vercel.
- Tidak ada frontend yang diubah.
- Tidak ada API contract yang diubah.
- Tidak ada business logic yang diubah.
- Hanya dokumen walkthrough ini yang diperbarui dengan desain persistent storage.

---

## Neon + Vercel Blob Migration Audit

Audit implementasi konkret untuk target Neon PostgreSQL + Vercel Blob telah dibuat di:

`docs/NEON_BLOB_MIGRATION_AUDIT.md`

Dokumen tersebut mencatat entrypoint, seluruh consumer `dataset_store`/`file_store`, public signature, endpoint berbasis ID, schema Neon, struktur Blob, environment variables, dependency yang kemungkinan diperlukan, failure/rollback, TTL cleanup, security, dan urutan implementasi.

Status:

- Tidak ada source code yang diubah.
- Tidak ada package yang di-install.
- Tidak ada database yang dibuat.
- Tidak ada deployment atau project Vercel.
- Tidak ada frontend, API contract, atau business logic yang diubah.
