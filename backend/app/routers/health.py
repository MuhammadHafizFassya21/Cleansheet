import os
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "cleansheet-ai-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "app_env": os.getenv("APP_ENV", "development"),
    }
