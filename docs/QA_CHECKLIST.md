# CleanSheet AI QA Checklist

## Frontend Checks
- [ ] Homepage renders (`/`)
- [ ] Upload page renders (`/upload`)
- [ ] Dashboard page renders (`/dashboard`)
- [ ] Clean page renders (`/clean`)
- [ ] Report page renders (`/report`)
- [ ] Navbar links work
- [ ] Loading states work (upload/dashboard/clean/report)
- [ ] Error states show user-friendly messages
- [ ] Empty states show clear guidance

## Backend Checks
- [ ] FastAPI starts successfully
- [ ] `GET /` works
- [ ] `GET /health` works
- [ ] `POST /api/upload/` works
- [ ] `POST /api/analyze/` works
- [ ] `POST /api/clean/preview` works
- [ ] `POST /api/clean/apply` works
- [ ] `GET /api/clean/download/{download_id}` works
- [ ] `POST /api/ai/insight` works (Gemini key optional)

## Demo Flow Checks
- [ ] Upload sample dirty CSV
- [ ] Analyze data (score + issue summary + top columns + issue table)
- [ ] Get cleaning recommendations
- [ ] Preview selected fixes
- [ ] Apply selected fixes
- [ ] Download cleaned CSV
- [ ] Generate report summary on Report page

## Known Limitations (expected)
- [ ] MVP supports CSV only
- [ ] No permanent file storage
- [ ] Cleaned CSV stored temporarily in backend memory
- [ ] No login / account system
- [ ] No database or history
- [ ] Report page is self-contained (upload ulang)
- [ ] AI insight uses summary statistics only (no full dataset sent)
- [ ] PDF export not implemented

## Pre-submission Checklist
- [ ] Frontend TypeScript check passes
- [ ] Frontend lint passes (if configured)
- [ ] Backend `python -m compileall app` passes
- [ ] All required endpoints respond with 200 on sample CSV
- [ ] README: setup + demo guide + pitch + limitations
- [ ] Roadmap updated

