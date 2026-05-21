# CleanSheet AI Demo Script

## Opening Pitch
Banyak orang mengandalkan data CSV dan spreadsheet untuk laporan, riset, marketing, dan operasional. Masalahnya, data sering terlihat rapi tetapi memiliki isu tersembunyi seperti duplikat, nilai kosong, email tidak valid, format telepon berantakan, spasi berlebih, dan karakter aneh. Isu kecil ini bisa membuat analisis dan keputusan menjadi tidak akurat.

CleanSheet AI membantu pengguna mendeteksi, memahami, dan membersihkan isu tersebut dengan aman sebelum data digunakan.

## Walkthrough Produk (Flow Demo)

### 1) Homepage
- Buka `http://localhost:3000/`
- Jelaskan value: cek kualitas data + insight AI + pembersihan aman + unduh CSV bersih.

### 2) Dashboard Analysis
- Buka `http://localhost:3000/dashboard`
- Upload `sample-data/sample_customer_dirty_data.csv`
- Klik **Analisis Data**
- Tunjukkan:
  - Skor kualitas
  - Ringkasan isu
  - Kolom paling bermasalah
  - Tabel isu + filter

### 3) Gemini AI Insight (Privacy-aware)
- Jelaskan bahwa CleanSheet AI **tidak mengirim dataset penuh** ke Gemini.
- Hanya mengirim ringkasan statistik: skor, jumlah isu, kolom bermasalah, dan rekomendasi.
- Tunjukkan insight AI pada **Report** (atau halaman lain yang menampilkan insight).

### 4) Cleaning Recommendations
- Buka `http://localhost:3000/clean`
- Upload CSV yang sama
- Klik **Dapatkan Rekomendasi Pembersihan**
- Tunjukkan daftar aksi dan badge aman/perlu ditinjau.

### 5) Before–After Preview
- Centang beberapa aksi
- Klik **Pratinjau Perbaikan Terpilih**
- Tunjukkan tabel perubahan sebelum–sesudah.

### 6) Apply Cleaning & Download
- Klik **Terapkan Perbaikan Terpilih**
- Klik **Unduh CSV Bersih**
- Jelaskan bahwa file unduhan disimpan sementara di memori backend (tidak permanen).

### 7) Report Page (Final Summary)
- Buka `http://localhost:3000/report`
- Upload CSV lagi → **Buat Laporan**
- Tunjukkan: overview, skor, ringkasan isu, top kolom, insight AI, rekomendasi, next steps.

## Feature Highlights (untuk disampaikan singkat)
- Rule-based quality checks: duplikat, missing value, whitespace, karakter aneh, email/telepon tidak valid.
- Skor kualitas 0–100 dan ringkasan isu.
- Rekomendasi pembersihan + pratinjau sebelum diterapkan.
- Gemini insight dengan desain privasi (summary-only).

## Impact Statement
CleanSheet AI membuat data quality checking lebih mudah untuk mahasiswa, UMKM, peneliti, admin sekolah, dan tim operasional yang bekerja dengan CSV tetapi tidak punya skill data engineering yang mendalam.

## Closing
Data bersih menghasilkan laporan yang lebih benar, keputusan yang lebih baik, dan lebih sedikit kesalahan operasional.

