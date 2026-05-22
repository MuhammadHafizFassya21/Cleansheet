# TODO - CleanSheet

## Manual Review Sync (Clean -> Manual)
- [x] Tambahkan tombol **“Perbaiki data manual”** setelah `Clean` selesai (redirect ke `/manual-review`).
- [ ] Update `Manual Review` supaya mengambil CSV hasil **clean** (pakai `download_id` dari `clean/apply`) alih-alih dataset upload awal.
- [ ] Kurangi duplikasi/overcount issue `invalid_phone` pada tampilan manual review sesuai hasil clean terakhir.

## Runtime TypeError (__webpack_modules__)
- [x] Bersihkan artefak build (`.next`) dan perbaiki import di `frontend/app/clean/page.tsx`.

