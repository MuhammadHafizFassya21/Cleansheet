# CleanSheet AI Deployment Guide

## Deployment Overview

Recommended deployment:
- Frontend: Vercel, Firebase Hosting, or Cloud Run
- Backend: Google Cloud Run
- AI: Gemini API
- Secrets: Google Secret Manager for production

This phase prepares deployment configuration only. It does not deploy the app.

## Recommended Architecture

- Browser users open the frontend domain.
- The frontend calls the FastAPI backend through `NEXT_PUBLIC_API_BASE_URL`.
- The backend receives CSV files, processes them in memory, and returns JSON or temporary cleaned CSV downloads.
- Gemini AI insight receives summary statistics only, not the full dataset.

## Backend Deployment Preparation

Backend production-ready files:
- `backend/Dockerfile`
- `backend/.dockerignore`
- `backend/.env.example`
- `backend/.env.production.example`

The Docker container runs:

```bash
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Cloud Run injects `PORT`, so the container must listen on that environment variable.

## Backend Local Docker Test

From the repository root:

```bash
docker build -t cleansheet-ai-backend ./backend
docker run --env-file backend/.env.example -p 8000:8000 cleansheet-ai-backend
```

Open:

```text
http://localhost:8000/health
```

Expected response includes:
- `status`
- `service`
- `timestamp`
- `app_env`

## Backend Local Non-Docker Test

Windows:

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

macOS/Linux:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Open:

```text
http://localhost:8000/health
```

## Backend Cloud Run Preparation

Command template only. Do not run until the project is ready for real deployment:

```bash
gcloud run deploy cleansheet-ai-backend \
  --source ./backend \
  --region asia-southeast2 \
  --allow-unauthenticated \
  --set-env-vars FRONTEND_URL=https://your-frontend-domain.example.com,ALLOWED_ORIGINS=https://your-frontend-domain.example.com,GEMINI_MODEL=gemini-1.5-flash
```

For production, store `GEMINI_API_KEY` in Google Secret Manager instead of committing it to source code or writing it in public docs.

After backend deployment, update frontend:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend-cloud-run-url.example.com
```

## Frontend Deployment Preparation

Local frontend env:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ENABLE_AI_INSIGHT=true
```

Production frontend env:

```text
NEXT_PUBLIC_API_BASE_URL=https://your-backend-cloud-run-url.example.com
NEXT_PUBLIC_ENABLE_AI_INSIGHT=true
```

Use `frontend/.env.production.example` as the template for deployment platforms.

## Environment Variables

Backend local:

```text
APP_ENV=development
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=8000
```

Backend production:

```text
APP_ENV=production
FRONTEND_URL=https://your-frontend-domain.example.com
ALLOWED_ORIGINS=https://your-frontend-domain.example.com
GEMINI_API_KEY=use_secret_manager_or_cloud_run_secret
GEMINI_MODEL=gemini-1.5-flash
PORT=8080
```

## Gemini API Key Handling

- Do not commit real `GEMINI_API_KEY`.
- Prefer Google Secret Manager for production.
- For MVP demos, environment variables are acceptable if kept outside source control.
- The app has fallback AI insight if Gemini is not configured.

## CORS Configuration

Local:

```text
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Production:

```text
ALLOWED_ORIGINS=https://your-frontend-domain.example.com
```

Do not use wildcard origins in production.

## Production Checklist

- [ ] Backend image builds locally.
- [ ] `GET /health` returns `status: ok`.
- [ ] `ALLOWED_ORIGINS` matches the deployed frontend domain.
- [ ] `NEXT_PUBLIC_API_BASE_URL` points to deployed backend.
- [ ] Gemini key is stored securely.
- [ ] Sample CSV upload/analyze/clean/report flows work.
- [ ] No real secrets are committed.

## Known MVP Limitations

- CSV only.
- No persistent storage.
- Cleaned files are stored in backend memory only.
- No user login.
- No database.
- Report page is self-contained and does not persist history.
- PDF export is not implemented.
