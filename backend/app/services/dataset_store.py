import io
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

import pandas as pd
from app.services.cleaning_engine import dataframe_to_csv_bytes

logger = logging.getLogger(__name__)

# Fallback in-memory storage if credentials are not configured
DATASETS: dict[str, dict[str, Any]] = {}
MAX_AGE_SECONDS = 30 * 60  # 30 minutes


def _use_persistent_store() -> bool:
    """Check if Neon DB and Vercel Blob credentials are configured."""
    try:
        from app.config import settings
        return bool(
            settings.DATABASE_URL
            and settings.DATABASE_URL.strip()
            and settings.BLOB_READ_WRITE_TOKEN
            and settings.BLOB_READ_WRITE_TOKEN.strip()
        )
    except Exception:
        return False


def _cleanup_expired_datasets_in_memory() -> None:
    """Removes in-memory datasets older than MAX_AGE_SECONDS."""
    now = time.time()
    expired_ids = [
        ds_id
        for ds_id, payload in DATASETS.items()
        if (now - payload.get("created_at", now)) > MAX_AGE_SECONDS
    ]
    for ds_id in expired_ids:
        DATASETS.pop(ds_id, None)


def _serialize_df_to_csv(df: pd.DataFrame) -> bytes:
    """Serialize DataFrame to CSV bytes using cleaning_engine behavior."""
    return dataframe_to_csv_bytes(df)


def _deserialize_csv_to_df(csv_bytes: bytes, file_name: str = "dataset.csv") -> pd.DataFrame:
    """Reconstruct DataFrame from CSV bytes using parser_service behavior."""
    return parse_data_file_bytes(csv_bytes, file_name)


def parse_data_file_bytes(file_bytes: bytes, file_name: str = "dataset.csv") -> pd.DataFrame:
    from app.services.parser_service import read_data_file
    return read_data_file(file_bytes, file_name)


def save_dataset(
    df: pd.DataFrame,
    file_name: str,
    stage: str,
    metadata: dict = None,
    dataset_id: str | None = None,
) -> str:
    """
    Save a dataset and return its unique ID.
    Uses Neon PostgreSQL + Vercel Blob when configured, or in-memory fallback.
    """
    if not _use_persistent_store():
        _cleanup_expired_datasets_in_memory()
        ds_id = dataset_id or f"ds_{uuid.uuid4().hex[:12]}"
        DATASETS[ds_id] = {
            "df": df.copy(),
            "file_name": file_name,
            "stage": stage,
            "created_at": time.time(),
            "metadata": metadata or {},
        }
        return ds_id

    # Persistent Storage Mode
    from app.db.database import get_db_connection
    from app.storage.blob_client import get_blob_client

    ds_id = dataset_id or f"ds_{uuid.uuid4().hex[:12]}"
    object_key = f"datasets/{ds_id}.csv"
    now_dt = datetime.now(timezone.utc)
    expires_dt = datetime.fromtimestamp(now_dt.timestamp() + MAX_AGE_SECONDS, tz=timezone.utc)
    
    meta = metadata.copy() if metadata else {}
    parent_dataset_id = meta.pop("parent_dataset_id", None)
    acknowledged_keys = meta.get("acknowledged_issue_keys", [])
    if isinstance(acknowledged_keys, set):
        acknowledged_keys = list(acknowledged_keys)

    csv_bytes = _serialize_df_to_csv(df)
    blob_client = get_blob_client()

    # Step 1: Upload object to Vercel Blob
    try:
        blob_res = blob_client.put_object(
            path=object_key,
            body=csv_bytes,
            content_type="text/csv; charset=utf-8"
        )
        blob_url = blob_res.get("url") if isinstance(blob_res, dict) else getattr(blob_res, "url", None)
    except Exception as exc:
        logger.exception(f"Blob upload failed for dataset {ds_id}: {exc}")
        raise RuntimeError(f"Failed to upload dataset object to Vercel Blob: {exc}")

    # Step 2: Insert/Update metadata in Neon PostgreSQL
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO datasets (
                        id, object_key, parent_dataset_id, file_name, stage,
                        created_at, expires_at, metadata, acknowledged_issue_keys, storage_status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        object_key = EXCLUDED.object_key,
                        parent_dataset_id = EXCLUDED.parent_dataset_id,
                        file_name = EXCLUDED.file_name,
                        stage = EXCLUDED.stage,
                        created_at = EXCLUDED.created_at,
                        expires_at = EXCLUDED.expires_at,
                        metadata = EXCLUDED.metadata,
                        acknowledged_issue_keys = EXCLUDED.acknowledged_issue_keys,
                        storage_status = EXCLUDED.storage_status;
                    """,
                    (
                        ds_id,
                        blob_url or object_key,
                        parent_dataset_id,
                        file_name,
                        stage,
                        now_dt,
                        expires_dt,
                        json.dumps(meta),
                        acknowledged_keys,
                        "ready"
                    )
                )
    except Exception as db_exc:
        logger.exception(f"Neon DB insert failed for dataset {ds_id}. Cleaning up Blob object: {db_exc}")
        # Best-effort cleanup of Blob object
        try:
            blob_client.delete_object(blob_url or object_key)
        except Exception as del_exc:
            logger.warning(f"Failed best-effort Blob cleanup for {ds_id}: {del_exc}")
        raise RuntimeError(f"Failed to save dataset metadata to database: {db_exc}")

    return ds_id


def get_dataset(dataset_id: str) -> dict[str, Any] | None:
    """
    Retrieve a dataset payload by ID.
    Returns dict payload with 'df', 'file_name', 'stage', 'created_at', 'metadata'
    matching exact existing interface contract.
    """
    if not _use_persistent_store():
        _cleanup_expired_datasets_in_memory()
        return DATASETS.get(dataset_id)

    # Persistent Storage Mode
    from psycopg.rows import dict_row
    from app.db.database import get_db_connection
    from app.storage.blob_client import get_blob_client

    now_dt = datetime.now(timezone.utc)

    # Step 1: Query Neon PostgreSQL for metadata
    try:
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT id, object_key, parent_dataset_id, file_name, stage,
                           created_at, expires_at, metadata, acknowledged_issue_keys, storage_status
                    FROM datasets
                    WHERE id = %s;
                    """,
                    (dataset_id,)
                )
                row = cur.fetchone()
    except Exception as db_exc:
        logger.exception(f"Database query failed for get_dataset({dataset_id}): {db_exc}")
        return None

    if not row:
        return None

    # Check storage status and expiry
    if row["storage_status"] != "ready":
        return None

    expires_at = row["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now_dt >= expires_at:
        logger.info(f"Dataset {dataset_id} is expired. Deleting best-effort.")
        delete_dataset(dataset_id)
        return None

    # Step 2: Fetch CSV object from Vercel Blob / URL
    object_key_or_url = row["object_key"]
    blob_client = get_blob_client()

    try:
        csv_bytes = blob_client.get_object_bytes(object_key_or_url)
    except Exception as fetch_exc:
        logger.exception(f"Failed to fetch Blob object for dataset {dataset_id}: {fetch_exc}")
        return None

    try:
        df = _deserialize_csv_to_df(csv_bytes, row["file_name"])
    except Exception as parse_exc:
        logger.exception(f"Failed to parse CSV bytes for dataset {dataset_id}: {parse_exc}")
        return None

    meta = row["metadata"] or {}
    if row["acknowledged_issue_keys"]:
        meta["acknowledged_issue_keys"] = row["acknowledged_issue_keys"]
    if row["parent_dataset_id"]:
        meta["parent_dataset_id"] = row["parent_dataset_id"]

    created_at_ts = row["created_at"].timestamp() if isinstance(row["created_at"], datetime) else time.time()

    return {
        "df": df,
        "file_name": row["file_name"],
        "stage": row["stage"],
        "created_at": created_at_ts,
        "metadata": meta,
    }


def update_dataset(dataset_id: str, df: pd.DataFrame, stage: str = None) -> bool:
    """
    Update an existing dataset's DataFrame, stage, and reset its expiry time.
    """
    if not _use_persistent_store():
        _cleanup_expired_datasets_in_memory()
        if dataset_id in DATASETS:
            DATASETS[dataset_id]["df"] = df.copy()
            if stage:
                DATASETS[dataset_id]["stage"] = stage
            DATASETS[dataset_id]["created_at"] = time.time()
            return True
        return False

    # Persistent Storage Mode
    existing = get_dataset(dataset_id)
    if not existing:
        return False

    file_name = existing.get("file_name", "dataset.csv")
    meta = existing.get("metadata", {})
    new_stage = stage or existing.get("stage", "uploaded")

    # Save dataset will overwrite Blob object and update Neon row while resetting created_at & expires_at
    save_dataset(
        df=df,
        file_name=file_name,
        stage=new_stage,
        metadata=meta,
        dataset_id=dataset_id,
    )
    return True


def delete_dataset(dataset_id: str) -> bool:
    """
    Explicitly delete a dataset from Neon PostgreSQL and Vercel Blob (idempotent).
    """
    if not _use_persistent_store():
        if dataset_id in DATASETS:
            del DATASETS[dataset_id]
            return True
        return False

    # Persistent Storage Mode
    from psycopg.rows import dict_row
    from app.db.database import get_db_connection
    from app.storage.blob_client import get_blob_client

    object_key_or_url = None
    try:
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT object_key FROM datasets WHERE id = %s;", (dataset_id,))
                row = cur.fetchone()
                if row:
                    object_key_or_url = row["object_key"]

                cur.execute("DELETE FROM datasets WHERE id = %s;", (dataset_id,))
    except Exception as db_exc:
        logger.exception(f"Failed to delete metadata for dataset {dataset_id}: {db_exc}")

    if object_key_or_url:
        try:
            blob_client = get_blob_client()
            blob_client.delete_object(object_key_or_url)
        except Exception as blob_exc:
            logger.warning(f"Failed best-effort delete of Blob object {object_key_or_url}: {blob_exc}")

    return True


def save_cleaned_dataset(df: pd.DataFrame, original_file_name: str) -> str:
    """Helper for saving a dataset right after auto-cleaning."""
    cleaned_name = f"cleaned_{original_file_name}"
    return save_dataset(df, cleaned_name, stage="auto_cleaned")