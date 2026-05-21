# TODO — Phase 7 (Apply Cleaning & Download Cleaned CSV)

## Backend
- [x] Update `backend/app/models/cleaning.py` with `CleaningApplyResponse` and `CleaningSummary`
- [x] Implement cleaning functions + apply metrics in `backend/app/services/cleaning_engine.py`
- [x] Add in-memory file store `backend/app/services/file_store.py`
- [x] Add endpoints in `backend/app/routers/clean.py`
  - [x] POST `/api/clean/apply`
  - [x] GET `/api/clean/download/{download_id}`

## Frontend
- [x] Add API calls in `frontend/lib/api.ts`:
  - [x] `applyCleaningActions`
  - [x] `getCleanedCsvDownloadUrl`
- [x] Add types in `frontend/lib/types.ts`:
  - [x] `CleaningApplyResponse`
- [x] Update UI in `frontend/app/clean/page.tsx`:
  - [x] Button “Apply Selected Fixes”
  - [x] Loading/apply error state
  - [x] Show cleaning summary after apply
  - [x] Enable “Download Cleaned CSV” after apply
- [x] Create `frontend/components/clean/CleaningSummaryCard.tsx`

## Docs
- [ ] Update `README.md` with Phase 7 testing instructions

## Validation
- [ ] Run backend + frontend locally and test full flow using `sample-data/sample_customer_dirty_data.csv`
- [ ] Verify download returns `text/csv` and correct Content-Disposition filename
