# TODO - Phase 11.6 Manual Review & Inline Data Editor

- [x] Step 1: Backend models: add `backend/app/models/manual_review.py` (Pydantic models)
- [x] Step 2: Backend service: add `backend/app/services/manual_review_service.py` (issue filtering, edits/apply, validation, CSV generation)
- [x] Step 3: Backend router: add `backend/app/routers/manual_review.py` with 3 endpoints
- [x] Step 4: Backend register router in `backend/app/main.py`

- [ ] Step 5: Frontend: add `frontend/app/manual-review/page.tsx` implementing upload, queue, edit/validate, apply, download
- [ ] Step 6: Frontend components under `frontend/components/manual-review/*`
- [ ] Step 7: Frontend API client updates in `frontend/lib/api.ts`
- [ ] Step 8: Frontend types updates in `frontend/lib/types.ts`
- [ ] Step 9: Update navbar to include Manual Review
- [ ] Step 10: Add link/button from Clean page to Manual Review (only when manual-review eligible issues exist)
- [ ] Step 11: Optional: Dashboard CTA for manual-review eligible issues
- [ ] Step 12: Update README.md, docs/FLOW_DIAGRAM.md, docs/DATA_QUALITY_RULES.md, docs/QA_CHECKLIST.md
- [ ] Step 13: Run backend/frontend and test with `backend/test_data.csv`

