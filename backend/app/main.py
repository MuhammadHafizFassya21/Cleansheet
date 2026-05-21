import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import health, upload, analyze, clean
from .routers import ai

app = FastAPI(
    title="CleanSheet AI API",
    description="Backend API for CleanSheet AI data quality checker.",
    version="0.1.0",
)


def get_allowed_origins() -> list[str]:
    app_env = os.getenv("APP_ENV", "development").strip().lower()
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
    frontend_url = os.getenv("FRONTEND_URL", "").strip()

    if allowed_origins:
        origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]
    elif frontend_url:
        origins = [frontend_url]
    else:
        origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

    if app_env == "development":
        origins.extend(["http://localhost:3000", "http://127.0.0.1:3000"])

    if app_env != "development":
        origins = [origin for origin in origins if origin != "*"]

    return list(dict.fromkeys(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(analyze.router, prefix="/api/analyze", tags=["Analyze"])
app.include_router(clean.router, prefix="/api/clean", tags=["Clean"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])


@app.get("/")
def root():
    return {
        "name": "CleanSheet AI API",
        "version": "0.1.0",
        "status": "running",
    }
