# backend/app/services/dataset_store.py

import time
import uuid
from typing import Any
from datetime import datetime
import pandas as pd

# Temporary in-memory storage for MVP (session-based)
# NOTE: This resets on backend restart.
DATASETS: dict[str, dict[str, Any]] = {}
MAX_AGE_SECONDS = 60 * 60  # 1 hour


def _cleanup_expired_datasets() -> None:
    """Remove expired datasets from storage."""
    now = time.time()
    expired_ids = [
        dataset_id
        for dataset_id, payload in DATASETS.items()
        if (now - payload.get("created_at", now)) > MAX_AGE_SECONDS
    ]
    for dataset_id in expired_ids:
        DATASETS.pop(dataset_id, None)


def save_dataset(
    df: pd.DataFrame,
    file_name: str,
    stage: str = "uploaded",
    metadata: dict[str, Any] | None = None,
) -> str:
    """
    Save a dataset to temporary storage.
    
    Args:
        df: Pandas DataFrame to store
        file_name: Original filename
        stage: Current stage (uploaded, auto_cleaned, manually_reviewed)
        metadata: Additional metadata to store
    
    Returns:
        dataset_id for later retrieval
    """
    _cleanup_expired_datasets()
    dataset_id = f"ds_{uuid.uuid4().hex[:10]}"
    
    DATASETS[dataset_id] = {
        "dataframe": df.copy(),
        "file_name": file_name,
        "stage": stage,
        "created_at": time.time(),
        "metadata": metadata or {},
    }
    return dataset_id


def get_dataset(dataset_id: str) -> tuple[pd.DataFrame, dict[str, Any]] | None:
    """
    Retrieve a dataset and its metadata.
    
    Returns:
        Tuple of (dataframe, metadata_dict) or None if not found
    """
    _cleanup_expired_datasets()
    payload = DATASETS.get(dataset_id)
    if payload is None:
        return None
    
    return payload["dataframe"].copy(), {
        "file_name": payload["file_name"],
        "stage": payload["stage"],
        "created_at": payload["created_at"],
        **payload["metadata"],
    }


def update_dataset(
    dataset_id: str,
    df: pd.DataFrame,
    stage: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> bool:
    """
    Update an existing dataset.
    
    Args:
        dataset_id: ID of dataset to update
        df: New dataframe
        stage: New stage (optional)
        metadata: Additional metadata to merge (optional)
    
    Returns:
        True if updated, False if dataset not found
    """
    if dataset_id not in DATASETS:
        return False
    
    if stage is not None:
        DATASETS[dataset_id]["stage"] = stage
    
    DATASETS[dataset_id]["dataframe"] = df.copy()
    
    if metadata is not None:
        DATASETS[dataset_id]["metadata"].update(metadata)
    
    return True


def delete_dataset(dataset_id: str) -> bool:
    """Delete a dataset from storage."""
    if dataset_id in DATASETS:
        DATASETS.pop(dataset_id)
        return True
    return False


def list_datasets() -> list[dict[str, Any]]:
    """List all datasets in storage (for debugging/cleanup)."""
    _cleanup_expired_datasets()
    return [
        {
            "dataset_id": dataset_id,
            "file_name": payload["file_name"],
            "stage": payload["stage"],
            "created_at": datetime.fromtimestamp(payload["created_at"]).isoformat(),
        }
        for dataset_id, payload in DATASETS.items()
    ]