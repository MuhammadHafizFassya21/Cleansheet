# Final Migration Implementation Plan — CleanSheet AI

Tanggal: 27 Agustus 2026

Status: **DESIGN ONLY — NO CODE CHANGES**

## A. Final Architecture

```text
Vercel Frontend
      ↓
FastAPI Vercel Function
      ├── Vercel Blob
      │     ├── original dataset
      │     ├── cleaned dataset
      │     ├── final dataset
      │     └── download CSV
      └── Managed PostgreSQL-compatible Database
            ├── dataset metadata
            ├── workflow state
            ├── relationships
            ├── TTL
            └── acknowledgement keys
```

DataFrame tidak disimpan sebagai database rows. Blob menyimpan file/version, sedangkan database menyimpan metadata dan state. Setiap endpoint processing mengambil object ke memory lalu membuat DataFrame Pandas seperti implementasi saat ini.

Keputusan ini menjaga API contract, menghilangkan ketergantungan Cloud Run, dan menghilangkan ketergantungan global in-memory storage.

## B. Storage Interface

### Interface existing

`dataset_store.py`:

```text
save_dataset(df, file_name, stage, metadata=None, dataset_id=None) -> str
get_dataset(dataset_id) -> dict | None
update_dataset(dataset_id, df, stage=None) -> bool
delete_dataset(dataset_id) -> bool
save_cleaned_dataset(df, original_file_name) -> str
```

`file_store.py`:

```text
save_cleaned_csv(csv_bytes, file_name) -> str
get_cleaned_csv(download_id) -> dict | None
```

Internal methods existing:

```text
_cleanup_expired_datasets() -> None
_cleanup_expired_files() -> None
```

### Interface proposed

Signature publik dipertahankan sebisa mungkin. Router tetap menerima ID yang sama dan `get_dataset()` tetap mengembalikan:

```text
{
  "df": DataFrame,
  "file_name": str,
  "stage": str,
  "metadata": dict
}
```

Internal metadata tambahan:

- `object_key`
- `parent_dataset_id`
- `created_at`
- `expires_at`
- `storage_status`
- `acknowledged_issue_keys`

`get_cleaned_csv()` tetap mengembalikan `bytes` dan `file_name` agar `StreamingResponse` existing tetap kompatibel.

## C. Database Schema

Migration file tidak dibuat pada tahap ini.

### Table `datasets`

| Kolom | PostgreSQL type | Keterangan |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | Mempertahankan `ds_...`, `ds_final_...` |
| `object_key` | `TEXT NOT NULL UNIQUE` | Object utama di Blob |
| `parent_dataset_id` | `TEXT NULL REFERENCES datasets(id)` | Lineage dataset |
| `file_name` | `TEXT NOT NULL` | Nama file |
| `stage` | `TEXT NOT NULL` | Stage workflow |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Waktu dibuat |
| `expires_at` | `TIMESTAMPTZ NOT NULL` | Waktu expire |
| `metadata` | `JSONB NOT NULL DEFAULT '{}'` | Metadata tambahan |
| `acknowledged_issue_keys` | `TEXT[] NOT NULL DEFAULT '{}'` | Stable keys yang diakui |
| `storage_status` | `TEXT NOT NULL DEFAULT 'ready'` | `pending`, `ready`, `failed`, atau `deleted` |

Index:

- `expires_at` untuk cleanup.
- `parent_dataset_id` untuk lineage/orphan detection.
- `stage` untuk filter workflow.

### Table `downloads`

| Kolom | PostgreSQL type | Keterangan |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | `download_id` dengan format `clean_...` |
| `dataset_id` | `TEXT NOT NULL REFERENCES datasets(id)` | Dataset sumber |
| `object_key` | `TEXT NOT NULL UNIQUE` | Object CSV download |
| `file_name` | `TEXT NOT NULL` | Nama download |
| `content_type` | `TEXT NOT NULL DEFAULT 'text/csv; charset=utf-8'` | MIME type |
| `size_bytes` | `BIGINT NULL` | Ukuran file |
| `created_at` | `TIMESTAMPTZ NOT NULL` | Waktu dibuat |
| `expires_at` | `TIMESTAMPTZ NOT NULL` | Waktu expire |
| `storage_status` | `TEXT NOT NULL DEFAULT 'ready'` | Status object |

Index:

- `dataset_id` untuk relasi.
- `expires_at` untuk cleanup.

`TEXT` dipilih untuk semua public ID agar response API tidak berubah. `TEXT[]` cukup untuk acknowledgement karena jumlah key per dataset kecil.

## D. Object Storage Structure

```text
datasets/original/{dataset_id}.csv
datasets/cleaned/{dataset_id}.csv
datasets/final/{dataset_id}.csv
downloads/{download_id}.csv
```

Aturan object key:

- ID dibuat backend dan bersifat unik.
- Filename user tidak dijadikan key utama.
- Prefix stage memudahkan debugging dan cleanup.
- Token Blob tidak ditaruh di key.
- `download_id` tetap dipakai untuk endpoint download.

## E. Data Lifecycle

```text
UPLOAD
  ↓ upload original object + metadata
STORE
  ↓ database row ready
ANALYZE
  ↓ read object by dataset_id
CLEAN
  ↓ write cleaned object + child metadata
MANUAL REVIEW
  ↓ read cleaned object
FINAL
  ↓ write final object + acknowledgement metadata
DOWNLOAD
  ↓ write/read download object + metadata
EXPIRE
  ↓ delete objects and metadata
```

### TTL

- Pertahankan TTL saat ini: 30 menit.
- `created_at` mencatat pembuatan.
- `expires_at = created_at + 30 menit`.
- Setiap request memeriksa metadata database sebelum membaca Blob.
- Object lifecycle policy menghapus object expired.
- Scheduled cleanup menghapus metadata dan orphan object.
- Cleanup harus idempotent.

### Retention

- Original: disimpan sampai workflow selesai/TTL.
- Cleaned: disimpan sampai final dataset/TTL.
- Final: disimpan sampai report/download/TTL.
- Download CSV: disimpan sampai TTL.
- Metadata: disimpan selama object terkait masih aktif.

## F. Acknowledgement Persistence

```text
POST /api/manual-review/apply
        ↓
validasi key terhadap pending issue dataset yang sama
        ↓
quality gate menggunakan key tervalidasi
        ↓
upload final object ke Blob
        ↓
commit final dataset + acknowledged_issue_keys ke database
        ↓
GET /api/quality-gate/{final_dataset_id}
        ↓
baca metadata acknowledgement
        ↓
hanya stable key yang sama yang diabaikan
```

Aturan:

- Arbitrary key tidak boleh disimpan.
- Key harus berasal dari pending issue dataset yang sama.
- Acknowledgement satu issue tidak memengaruhi issue lain.
- Negative number lain tetap blocking jika tidak diacknowledge.
- Acknowledgement tidak mengubah quality score atau severity rule.

## G. Failure Handling

| Kondisi | Behavior | Status |
|---|---|---|
| Database tersedia, Blob gagal | Jangan return success; log internal; controlled dependency error | 502/503 |
| Blob berhasil, database gagal | Return failure; tandai object orphan candidate | 503 |
| Metadata ada, Blob hilang | Return unavailable/not found, bukan raw 500 | 404/502 |
| Blob ada, metadata hilang | Jangan expose lewat workflow ID; cleanup orphan | 404 |
| Download metadata ada, Blob hilang | Return download unavailable/expired | 404/502 |
| Metadata expired | Jangan baca Blob; return expired/not found | 404 |
| DB timeout | Controlled service unavailable; jangan fallback ke memory | 503 |
| Blob token invalid | Controlled dependency error tanpa detail secret | 503 |

Pesan error existing yang dipakai frontend dipertahankan sebisa mungkin. Detail SQL, token, dan credential tidak boleh dikirim ke client.

## H. Atomicity

Blob dan database bukan satu transaction. Urutan upload yang direkomendasikan:

```text
Generate ID/object key
        ↓
Upload object ke Blob
        ↓
Insert metadata database dengan storage_status=ready
```

Jika Blob gagal, tidak ada metadata ready. Jika database gagal setelah Blob sukses, object menjadi orphan candidate untuk reconciliation.

Untuk final dataset:

1. Validasi semua edit dan acknowledgement.
2. Upload final object.
3. Commit row final dan acknowledgement dalam satu database transaction.
4. Return success hanya setelah Blob dan database berhasil.

Status pending/ready mencegah request berikutnya membaca metadata yang belum lengkap.

## I. Environment Variables

### Local

- `BLOB_READ_WRITE_TOKEN` — secret token Vercel Blob.
- `DATABASE_URL` — secret connection string PostgreSQL-compatible database.
- `APP_ENV=development`.
- `FRONTEND_URL=http://localhost:3000`.
- `ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`.
- `GEMINI_API_KEY` — optional secret.
- `GEMINI_MODEL` — optional.

### Production

- `BLOB_READ_WRITE_TOKEN` — required.
- `DATABASE_URL` — required.
- `APP_ENV=production`.
- `FRONTEND_URL` — frontend production origin.
- `ALLOWED_ORIGINS` — allowed frontend origin.
- `GEMINI_API_KEY` — optional platform secret.
- `GEMINI_MODEL` — optional.

`PORT` tetap dipertahankan untuk local/Docker compatibility, tetapi bukan kebutuhan utama Vercel Function. Tidak ada nilai secret yang ditampilkan.

## J. Dependencies

Tidak ada package yang di-install atau diubah pada tahap plan.

| Action | Package | Alasan |
|---|---|---|
| KEEP | `fastapi` | API ASGI |
| KEEP | `pandas` | DataFrame processing |
| KEEP | `openpyxl` | Excel parser |
| KEEP | `python-multipart` | Multipart upload |
| KEEP | `python-dotenv` | Local `.env` |
| KEEP sementara | `google-generativeai` | Existing logic; deprecation terpisah |
| KEEP | `uvicorn` | Local/Docker |
| ADD later | PostgreSQL driver/client | Saat adapter DB dibuat |
| ADD later | Vercel Blob SDK atau HTTP client | Dipilih setelah API resmi diverifikasi |
| ADD later | Migration tool | Saat schema dibuat |
| REMOVE | Tidak ada | Tidak menghapus dependency sekarang |

HTTP API Blob mengurangi dependency tetapi membutuhkan implementasi auth/retry/error parsing. SDK lebih mudah tetapi menambah bundle size. Keputusan package dilakukan pada fase implementasi.

## K. File Change Plan

### MUST CHANGE

| File | Change | Reason | Risk |
|---|---|---|---|
| `backend/app/services/dataset_store.py` | Ganti dictionary dengan Blob + DB di balik signature existing | Persistence dataset | High |
| `backend/app/services/file_store.py` | Ganti dictionary dengan Blob + DB download metadata | Persistence download | High |

### MAY CHANGE

| File | Change | Reason | Risk |
|---|---|---|---|
| `backend/app/routers/upload.py` | Metadata/object integration jika diperlukan | Upload persistence | Medium |
| `backend/app/routers/analyze.py` | Loading persistent object | Analyze by ID | Medium |
| `backend/app/routers/clean.py` | Parent relation dan object status | Cleaned object | High |
| `backend/app/routers/manual_review.py` | Final relation dan acknowledgement | Final gate consistency | High |
| `backend/app/routers/quality_gate.py` | Baca persisted acknowledgement | Final gate | Medium |
| `backend/app/services/quality_gate_service.py` | Hanya jika bentuk metadata berubah | Acknowledgement adapter | Medium |
| `backend/.env.example` | Tambah nama variable, tanpa secret | Configuration docs | Low |
| `requirements.txt` | Tambah driver/SDK bila diperlukan | Storage adapter | Medium |

### NO CHANGE

| File/Area | Reason |
|---|---|
| `frontend/**` | API contract tetap |
| `backend/app/models/**` | Request/response tetap |
| `quality_engine.py` | Rule/score tetap |
| `cleaning_engine.py` | Business logic tetap |
| `backend/Dockerfile` | Tidak diperlukan untuk design plan |

## L. API Compatibility

Endpoint, method, request fields, response models, dan public ID tetap:

- `POST /api/upload/`
- `GET /api/analyze/{dataset_id}`
- `POST /api/clean/preview`
- `POST /api/clean/apply`
- `GET /api/clean/download/{download_id}`
- `GET /api/manual-review/issues/{dataset_id}`
- `POST /api/manual-review/validate`
- `POST /api/manual-review/apply`
- `GET /api/quality-gate/{dataset_id}`
- `POST /api/ai/insight`

Perubahan hanya internal:

- Dataset store mengambil object lalu mengembalikan DataFrame.
- File store mengambil Blob lalu mengembalikan bytes.
- Acknowledgement dibaca dari database.
- Error provider dipetakan sebagai controlled HTTP error.

## M. Migration Phases

1. **Phase 1 — Storage adapter:** pertahankan signature dan return payload existing.
2. **Phase 2 — Database schema:** buat `datasets`, `downloads`, index, dan migration.
3. **Phase 3 — Blob integration:** upload/read/delete, retry terbatas, orphan cleanup.
4. **Phase 4 — Dataset store migration:** original, cleaned, final object.
5. **Phase 5 — File store migration:** download object dan metadata.
6. **Phase 6 — Router integration:** relations, expiry, acknowledgement, error mapping.
7. **Phase 7 — Regression test:** multi-request, cold start, expiry, missing object, download.
8. **Phase 8 — Vercel deployment:** entrypoint, runtime, secret, preview, CORS, production.

Tidak ada phase yang dijalankan pada task ini.

## N. Rollback Plan

1. Kembalikan `dataset_store.py` ke in-memory implementation.
2. Kembalikan `file_store.py` ke in-memory implementation.
3. Kembalikan router jika pemanggilan adapter berubah.
4. Nonaktifkan konfigurasi persistent storage melalui environment/feature switch.
5. Jalankan regression suite lokal dengan `backend/.venv311`.
6. Jangan menghapus object/row hasil migration sebelum lineage dan orphan diperiksa.

Karena API contract dipertahankan, frontend tidak memerlukan rollback.

## O. Migration Risk

### CRITICAL

- Global memory tetap gagal pada request lintas instance.
- Partial failure Blob/DB dapat menghasilkan orphan atau metadata rusak.
- Acknowledgement yang tidak tersimpan membuat final gate tidak konsisten.

### HIGH

- Runtime Python dan nested entrypoint Vercel belum diuji deployment.
- Pandas full-load dapat mendekati duration/memory limit.
- Adapter yang mengubah return payload dapat merusak router/frontend.
- TTL object dan metadata yang tidak sinkron dapat menyebabkan 404.

### MEDIUM

- Connection pooling database serverless perlu dirancang.
- SDK storage menambah cold start/bundle size.
- Tanpa authentication, ID menjadi bearer token.
- Limit upload provider perlu dibandingkan dengan 5 MB aplikasi.

### LOW

- `uvicorn` tetap diperlukan local/Docker.
- `python-dotenv` terutama berguna local.
- Content type dan download relation perlu metadata internal.

## P. Final Implementation Checklist

### Design approval

- [x] Vercel Blob dipilih untuk dataset/file.
- [x] Managed PostgreSQL-compatible database dipilih untuk metadata.
- [x] DataFrame tidak disimpan sebagai database rows.
- [x] API contract dipertahankan.
- [x] TTL 30 menit dipertahankan.

### Before implementation

- [ ] Pastikan runtime Python Vercel target.
- [ ] Pastikan Blob dan database tersedia.
- [ ] Pilih SDK/HTTP client resmi.
- [ ] Tentukan connection strategy serverless.
- [ ] Definisikan migration dan orphan cleanup policy.
- [ ] Siapkan test matrix multi-request.

### Acceptance

- [ ] Original, cleaned, dan final object dapat dibaca lintas request.
- [ ] Semua ID API tetap kompatibel.
- [ ] Acknowledgement bertahan setelah request selesai.
- [ ] Missing object menghasilkan controlled HTTP error.
- [ ] Partial failure tidak menghasilkan resource aktif rusak.
- [ ] TTL dan cleanup terverifikasi.
- [ ] Final regression tetap lulus.
- [ ] Preview deployment lulus sebelum production.

## Q. Changes Made

- Tidak ada source code yang diubah.
- Tidak ada package yang di-install.
- Tidak ada database yang dibuat.
- Tidak ada migration file.
- Tidak ada Vercel project.
- Tidak ada deployment.
- Tidak ada frontend yang diubah.
- Tidak ada API contract atau business logic yang diubah.
- Hanya dokumen plan ini yang dibuat.
