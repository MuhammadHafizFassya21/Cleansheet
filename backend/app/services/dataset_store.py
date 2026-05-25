import time
import uuid
from typing import Any

import pandas as pd

# Temporary in-memory storage for datasets during the workflow
# NOTE: This resets on backend restart. Use only for MVP/temporary flow.
# Structure: { dataset_id: { "df": pd.DataFrame, "file_name": str, "stage": str, "created_at": float, "metadata": dict } }
DATASETS: dict[str, dict[str, Any]] = {}
MAX_AGE_SECONDS = 30 * 60  # 30 minutes


def _cleanup_expired_datasets() -> None:
    """Removes datasets older than MAX_AGE_SECONDS."""
    now = time.time()
    expired_ids = [
        ds_id
        for ds_id, payload in DATASETS.items()
        if (now - payload.get("created_at", now)) > MAX_AGE_SECONDS
    ]
    for ds_id in expired_ids:
        DATASETS.pop(ds_id, None)


def save_dataset(
    df: pd.DataFrame,
    file_name: str,
    stage: str,
    metadata: dict = None,
    dataset_id: str | None = None,
) -> str:
    """Save a dataset and return its unique ID."""
    _cleanup_expired_datasets()
    ds_id = dataset_id or f"ds_{uuid.uuid4().hex[:12]}"
    DATASETS[ds_id] = {
        "df": df.copy(),
        "file_name": file_name,
        "stage": stage,
        "created_at": time.time(),
        "metadata": metadata or {},
    }
    return ds_id


def get_dataset(dataset_id: str) -> dict[str, Any] | None:
    """Retrieve a dataset payload by ID."""
    _cleanup_expired_datasets()
    payload = DATASETS.get(dataset_id)
    if payload:
        # Update accessed time to extend lifespan? For MVP, just return it.
        pass
    return payload


def update_dataset(dataset_id: str, df: pd.DataFrame, stage: str = None) -> bool:
    """Update an existing dataset."""
    _cleanup_expired_datasets()
    if dataset_id in DATASETS:
        DATASETS[dataset_id]["df"] = df.copy()
        if stage:
            DATASETS[dataset_id]["stage"] = stage
        DATASETS[dataset_id]["created_at"] = time.time()  # Reset expiry
        return True
    return False


def delete_dataset(dataset_id: str) -> bool:
    """Explicitly delete a dataset."""
    if dataset_id in DATASETS:
        del DATASETS[dataset_id]
        return True
    return False


def save_cleaned_dataset(df: pd.DataFrame, original_file_name: str) -> str:
    """Helper for saving a dataset right after auto-cleaning."""
    cleaned_name = f"cleaned_{original_file_name}"
    return save_dataset(df, cleaned_name, stage="auto_cleaned")