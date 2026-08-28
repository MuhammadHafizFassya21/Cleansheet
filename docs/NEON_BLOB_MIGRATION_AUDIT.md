# Neon + Vercel Blob Migration Audit — CleanSheet AI

Tanggal: 27 Agustus 2026

Status: **AUDIT / PLAN ONLY**

## A. Current Architecture Findings

Repository saat ini masih menggunakan:

- FastAPI app di `backend/app/main.py`.
- `dataset_store.py` dengan global `DATASETS: dict[str, dict[str, Any]]`.
- `file_store.py` dengan global `CLEANED_FILES: dict[str, dict[str, Any]]`.
- Pandas DataFrame sebagai nilai `df` di memory.
- CSV download sebagai `bytes` di memory.
- TTL nominal 30 menit melalui lazy cleanup.
- Tidak ada dependency Neon, PostgreSQL, Vercel Blob, object storage, atau database client.

Target yang diaudit:

```text
Vercel Frontend
      ↓
FastAPI Vercel Function
      ├── Vercel Blob: dataset/file objects
      └── Neon PostgreSQL: metadata/workflow state
```

Business logic Pandas tetap dipertahankan. DataFrame tidak disimpan sebagai database rows karena semua detector, cleaning, dan quality gate bekerja pada DataFrame penuh.

## B. Exact Files That Need Modification

### Must change during implementation

| File | Alasan konkret |
|---|---|
| `backend/app/services/dataset_store.py` | Mengganti `DATASETS` memory dengan Blob object + Neon metadata, sambil mempertahankan public function behavior |
| `backend/app/services/file_store.py` | Mengganti `CLEANED_FILES` memory dengan Blob object + Neon download metadata |

### May change only if adapter integration requires it

| File | Penggunaan aktual |
|---|---|
| `backend/app/routers/upload.py` | Memanggil `dataset_store.save_dataset()` saat `POST /api/upload/` |
| `backend/app/routers/analyze.py` | Memanggil `save_dataset()` untuk upload analyze dan `get_dataset()` untuk GET by ID |
| `backend/app/routers/clean.py` | Memanggil `get_dataset()`, `save_dataset()`, `save_cleaned_csv()`, dan `get_cleaned_csv()` |
| `backend/app/routers/manual_review.py` | Memanggil `save_dataset()`, `get_dataset()`, dan `save_cleaned_csv()`; menyimpan acknowledgement final |
| `backend/app/routers/quality_gate.py` | Memanggil `get_dataset()` dan membaca persisted acknowledgement melalui metadata |
| `backend/app/services/quality_gate_service.py` | Hanya bila bentuk metadata acknowledgement adapter perlu disesuaikan |
| `backend/app/services/parser_service.py` | Hanya bila format object internal berubah; business parsing tetap sama |
| `backend/.env.example` | Mendokumentasikan nama variable Blob/Neon tanpa secret |
| `backend/.env.production.example` | Mendokumentasikan variable production tanpa secret |
| `backend/requirements.txt` | Hanya menambah driver/SDK setelah provider dan approach disetujui |

## C. Exact Files That Must NOT Be Modified

Pada implementation phase, file berikut sebaiknya tidak diubah:

- `frontend/**` — frontend memakai API contract existing.
- `backend/app/models/ai.py` — schema AI tidak terkait persistence.
- `backend/app/models/cleaning.py` — response cleaning dipertahankan.
- `backend/app/models/dataset.py` — response upload dipertahankan.
- `backend/app/models/issue.py` — quality issue dan score dipertahankan.
- `backend/app/models/manual_review.py` — request/response Manual Review dipertahankan.
- `backend/app/services/quality_engine.py` — rules dan score tidak terkait storage.
- `backend/app/services/cleaning_engine.py` — transformasi dan CSV serialization dipertahankan.
- `backend/app/services/manual_review_service.py` — validasi/edit business logic dipertahankan kecuali interface loading secara eksplisit membutuhkan perubahan.
- `backend/app/main.py` — tidak perlu diubah untuk storage; hanya konfigurasi deployment yang mungkin berada di luar file ini.
- `backend/Dockerfile` — tidak terkait implementasi Vercel Function.

## D. Neon Database Schema Recommended

Tidak ada database atau migration file yang dibuat.

### `datasets`

| Kolom | PostgreSQL type | Keterangan |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Mempertahankan `ds_...`, `ds_final_...` |
| `object_key` | `TEXT NOT NULL UNIQUE` | Key object utama di Vercel Blob |
| `parent_dataset_id` | `TEXT NULL REFERENCES datasets(id)` | Relasi original → cleaned → final |
| `file_name` | `TEXT NOT NULL` | Nama file untuk workflow/export |
| `stage` | `TEXT NOT NULL` | `uploaded`, `analyzed`, `auto_cleaned`, `manually_reviewed` |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Waktu dibuat |
| `expires_at` | `TIMESTAMPTZ NOT NULL` | Batas TTL 30 menit |
| `metadata` | `JSONB NOT NULL DEFAULT '{}'::jsonb` | Source dan metadata tambahan |
| `acknowledged_issue_keys` | `TEXT[] NOT NULL DEFAULT '{}'` | Stable key yang diakui user |
| `storage_status` | `TEXT NOT NULL DEFAULT 'ready'` | `pending`, `ready`, `failed`, `deleted` |

Index:

- `datasets_expires_at_idx` pada `expires_at`.
- `datasets_parent_dataset_id_idx` pada `parent_dataset_id`.
- `datasets_stage_idx` pada `stage`.

### `downloads`

| Kolom | PostgreSQL type | Keterangan |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Mempertahankan `download_id` `clean_...` |
| `dataset_id` | `TEXT NOT NULL REFERENCES datasets(id)` | Dataset sumber |
| `object_key` | `TEXT NOT NULL UNIQUE` | Key CSV download di Blob |
| `file_name` | `TEXT NOT NULL` | Nama file download |
| `content_type` | `TEXT NOT NULL DEFAULT 'text/csv; charset=utf-8'` | MIME type existing |
| `size_bytes` | `BIGINT NULL` | Ukuran CSV |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Waktu dibuat |
| `expires_at` | `TIMESTAMPTZ NOT NULL` | Batas TTL |
| `storage_status` | `TEXT NOT NULL DEFAULT 'ready'` | Status object |

Index:

- `downloads_dataset_id_idx` pada `dataset_id`.
- `downloads_expires_at_idx` pada `expires_at`.

## E. Vercel Blob Object Structure

```text
datasets/original/{dataset_id}.csv
datasets/cleaned/{cleaned_dataset_id}.csv
datasets/final/{final_dataset_id}.csv
downloads/{download_id}.csv
```

Aturan:

- ID dibuat backend dengan UUID token yang tidak berurutan.
- Filename user tidak dijadikan object key utama.
- Prefix object membedakan lifecycle dan memudahkan cleanup.
- `download_id` tetap menjadi public API identifier.
- Blob token tidak pernah dimasukkan ke response atau object key.

## F. Environment Variables

### Local

- `DATABASE_URL` — connection string Neon PostgreSQL; required untuk persistent mode.
- `BLOB_READ_WRITE_TOKEN` — token Vercel Blob; required untuk persistent mode.
- `APP_ENV=development`.
- `FRONTEND_URL=http://localhost:3000`.
- `ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`.
- `GEMINI_API_KEY` — optional.
- `GEMINI_MODEL` — optional.

### Production

- `DATABASE_URL` — required.
- `BLOB_READ_WRITE_TOKEN` — required.
- `APP_ENV=production`.
- `FRONTEND_URL` — frontend Vercel production origin.
- `ALLOWED_ORIGINS` — origin frontend yang diizinkan.
- `GEMINI_API_KEY` — optional platform secret.
- `GEMINI_MODEL` — optional.

`PORT` tetap relevan untuk local/Docker, tetapi bukan dependency utama Vercel Function. Tidak ada secret value yang ditampilkan.

## G. Required Dependencies

### Current dependencies audited

| Package | Kondisi target |
|---|---|
| `fastapi` | Keep |
| `uvicorn` | Keep untuk local/Docker; bukan process server utama Vercel Function |
| `pandas` | Keep untuk business logic |
| `openpyxl` | Keep untuk Excel parser existing |
| `python-multipart` | Keep untuk upload |
| `python-dotenv` | Keep untuk local environment |
| `google-generativeai` | Keep sementara demi API/logic existing; deprecated, evaluasi terpisah |

### Potential additions, not installed

| Action | Kandidat | Catatan |
|---|---|---|
| ADD later | PostgreSQL driver async/sync yang kompatibel Neon | Pilih satu sesuai model execution Vercel; jangan menambah lebih dari perlu |
| ADD later | Vercel Blob Python SDK atau HTTP client resmi | SDK lebih mudah; HTTP lebih kecil tetapi perlu auth/retry manual |
| ADD later | Migration tool | Hanya saat schema implementasi dimulai |
| REMOVE | Tidak ada | Tidak ada package yang dihapus pada plan |

Tidak ada provider Neon/Blob saat ini di `requirements.txt`.

## H. Dataset Store Migration Strategy

### Current interface

```text
save_dataset(df, file_name, stage, metadata=None, dataset_id=None) -> str
get_dataset(dataset_id) -> dict | None
update_dataset(dataset_id, df, stage=None) -> bool
delete_dataset(dataset_id) -> bool
save_cleaned_dataset(df, original_file_name) -> str
```

### Proposed behavior

1. Tentukan `dataset_id` dan object key.
2. Serialize DataFrame ke CSV bytes menggunakan behavior existing.
3. Upload object ke Blob.
4. Insert metadata ke Neon dengan `storage_status='ready'`.
5. `get_dataset()` membaca row Neon.
6. Validasi `expires_at` dan `storage_status`.
7. Download object Blob.
8. Parse bytes ke DataFrame melalui parser existing.
9. Return payload lama agar router tetap kompatibel.

### Format internal

CSV direkomendasikan untuk original/cleaned/final karena:

- Parser existing sudah berbasis CSV/bytes.
- Mudah debugging dan inspeksi.
- Tidak membutuhkan perubahan besar pada Pandas flow.
- Download existing memang CSV.

Parquet bisa dipertimbangkan kemudian untuk internal optimization, tetapi akan menambah dependency/format handling dan tidak diperlukan untuk maksimum 5 MB.

## I. File Store Migration Strategy

### Current interface

```text
save_cleaned_csv(csv_bytes, file_name) -> str
get_cleaned_csv(download_id) -> dict | None
```

### Proposed behavior

1. Generate `download_id` dan `downloads/{download_id}.csv`.
2. Upload CSV bytes ke Blob.
3. Insert row `downloads` ke Neon dengan dataset relation.
4. `get_cleaned_csv()` membaca metadata download.
5. Validasi expiry/status.
6. Fetch Blob bytes.
7. Return `bytes` dan `file_name` seperti existing endpoint.

Content type tetap `text/csv; charset=utf-8` agar frontend tidak berubah.

## J. Router Changes

Router tidak perlu mengubah endpoint atau response schema.

| Router | Perubahan internal yang mungkin |
|---|---|
| `upload.py` | Store original object dan metadata persistent |
| `analyze.py` | Load dataset by ID dari adapter persistent |
| `clean.py` | Simpan cleaned dataset dengan parent ID dan download relation |
| `manual_review.py` | Simpan final dataset dan `acknowledged_issue_keys` persistent |
| `quality_gate.py` | Baca acknowledgement dari metadata Neon |
| `ai.py` | Tidak perlu perubahan; payload tetap summary-only |

Perhatian: `POST /api/clean/apply` saat ini membuat cleaned dataset dan hanya membuat download apabila gate lulus. Behavior tersebut dipertahankan.

## K. Vercel Deployment Structure

Target deployment perlu memisahkan root deployment dari repository root atau memakai custom entrypoint.

Current:

```text
backend/app/main.py
```

Object FastAPI:

```text
app
```

Yang perlu diputuskan pada fase implementasi:

- Deploy `backend` sebagai Vercel project root, atau.
- Gunakan konfigurasi custom entrypoint yang menunjuk ke `backend/app/main.py`, atau.
- Buat wrapper entrypoint yang hanya mengimpor `app` existing tanpa mengubah business logic.

Tidak ada `vercel.json` atau `pyproject.toml` Vercel saat ini. Jangan menambahkan keduanya pada task audit/plan ini.

Vercel Function harus memuat top-level ASGI object `app`; command Uvicorn Docker bukan model startup utama Function.

## L. Failure / Rollback Strategy

### Failure matrix

| Failure | Behavior |
|---|---|
| Blob upload gagal sebelum DB insert | Jangan membuat row `ready`; return controlled 502/503 |
| Blob berhasil, DB insert gagal | Return failure; tandai object sebagai orphan candidate untuk cleanup |
| DB tersedia, Blob read gagal | Return controlled unavailable error, bukan raw 500 |
| Metadata ada, object hilang | Return 404/502 sesuai existing error mapping; jangan return dataset parsial |
| Object ada, metadata hilang | Jangan expose object by workflow ID; cleanup orphan |
| Download row ada, Blob hilang | Return download unavailable/expired |
| DB timeout | Return 503; jangan diam-diam kembali ke global memory |
| Partial final write | Jangan return success sampai object dan metadata ready |

### Rollback

1. Kembalikan `dataset_store.py` ke in-memory version.
2. Kembalikan `file_store.py` ke in-memory version.
3. Kembalikan router jika adapter call berubah.
4. Nonaktifkan persistent mode melalui configuration/feature switch.
5. Jangan menghapus Blob/Neon data sebelum lineage dan orphan diperiksa.
6. Jalankan final regression suite terhadap in-memory fallback.

## M. TTL / Cleanup Strategy

Behavior existing: 30 menit.

Rancangan:

- Set `created_at` saat resource dibuat.
- Set `expires_at = created_at + interval '30 minutes'`.
- Setiap read mengecek expiry sebelum Blob fetch.
- Blob lifecycle/scheduled cleanup menghapus object expired.
- Scheduled cleanup menghapus metadata expired.
- Reconciliation mencari metadata tanpa object dan object tanpa metadata.
- Cleanup idempotent; resource yang sudah terhapus tidak menjadi error fatal.
- Parent/child lineage dipakai agar original, cleaned, final, dan download dapat dibersihkan bersama.

## N. Security Considerations

Belum ada authentication.

Risiko:

- `dataset_id` adalah bearer identifier untuk operasi dataset.
- `download_id` adalah bearer identifier untuk mengambil CSV.
- ID UUID hex pendek lebih baik daripada ID berurutan, tetapi bukan authorization.
- Public Blob URL tidak boleh diekspos sebagai pengganti controlled download endpoint.

Rekomendasi:

- Gunakan token acak dengan entropy memadai.
- Jangan log token/secret.
- Simpan Blob token dan `DATABASE_URL` sebagai platform secrets.
- Validasi dataset/download relation.
- Pertahankan TTL pendek.
- Tambahkan ownership/session binding jika authentication ditambahkan nanti.

## O. Step-by-Step Implementation Order

1. Bekukan API contract dan response fixtures dari final regression.
2. Pilih Neon connection approach dan satu Blob client approach.
3. Tambahkan schema migration untuk `datasets` dan `downloads`.
4. Implementasikan Blob object CRUD dan error mapping secara terisolasi.
5. Implementasikan metadata DB CRUD dan expiry checks.
6. Migrasikan `dataset_store.py` sambil mempertahankan signature/return payload.
7. Migrasikan `file_store.py` sambil mempertahankan `bytes`/filename return.
8. Tambahkan parent relations dan acknowledgement persistence.
9. Integrasikan router hanya jika signature internal memang membutuhkan perubahan.
10. Tambahkan controlled 404/502/503 untuk failure matrix.
11. Jalankan unit test store dan integration test multi-request.
12. Jalankan regression workflow dengan fresh process/instance simulation.
13. Uji TTL, missing object, missing metadata, orphan cleanup, dan rollback.
14. Validasi entrypoint Vercel dan runtime Python target.
15. Konfigurasi environment secrets lokal/preview/production.
16. Lakukan preview deployment saja.
17. Jalankan final regression pada preview.
18. Baru lakukan production migration jika semua acceptance criteria lulus.

Tidak ada langkah implementasi atau deployment yang dilakukan dalam task ini.

## Audit Changes

- Tidak ada source code yang diubah.
- Tidak ada package yang di-install.
- Tidak ada database yang dibuat.
- Tidak ada migration file yang dibuat.
- Tidak ada Vercel project atau deployment.
- Tidak ada frontend yang diubah.
- Tidak ada API contract atau business logic yang diubah.
- Hanya dokumen audit ini yang dibuat.
