import time
import uuid
from typing import Any

# Temporary in-memory storage for MVP
# NOTE: This resets on backend restart.
CLEANED_FILES: dict[str, dict[str, Any]] = {}
MAX_AGE_SECONDS = 30 * 60  # 30 minutes


def _cleanup_expired_files() -> None:
    now = time.time()
    expired_ids = [
        download_id
        for download_id, payload in CLEANED_FILES.items()
        if (now - payload.get("created_at", now)) > MAX_AGE_SECONDS
    ]
    for download_id in expired_ids:
        CLEANED_FILES.pop(download_id, None)


def save_cleaned_csv(csv_bytes: bytes, file_name: str) -> str:
    _cleanup_expired_files()
    download_id = f"clean_{uuid.uuid4().hex[:10]}"
    CLEANED_FILES[download_id] = {
        "bytes": csv_bytes,
        "file_name": file_name,
        "created_at": time.time(),
    }
    return download_id


def get_cleaned_csv(download_id: str) -> dict[str, Any] | None:
    _cleanup_expired_files()
    return CLEANED_FILES.get(download_id)
