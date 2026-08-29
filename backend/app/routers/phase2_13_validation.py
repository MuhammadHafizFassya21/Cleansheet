"""
Phase 2.13 Minimal Vercel Runtime & Private Blob Validation Endpoint.
Allows testing Blob authentication, upload, read, delete, and cleanup on Vercel Preview runtime.
"""

import logging
import uuid
from fastapi import APIRouter, HTTPException
from app.storage.blob_client import get_blob_client, VercelBlobError

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
def phase2_13_health():
    """Simple health check endpoint for Phase 2.13 validation."""
    return {
        "status": "ok",
        "runtime": "vercel",
    }


@router.post("/blob-test")
def phase2_13_blob_test():
    """
    Executes a minimal, safe 5-step live validation against Vercel Blob Private Store:
    1. Generate random test object ID (prefix: phase2-13-test/<uuid>.txt)
    2. Upload small text payload
    3. Read object content
    4. Verify content integrity
    5. Delete object and verify deletion (0 orphan objects)
    """
    client = get_blob_client()
    if not client.is_configured():
        raise HTTPException(
            status_code=500,
            detail="BLOB_READ_WRITE_TOKEN is missing or unconfigured.",
        )

    test_uuid = str(uuid.uuid4())
    test_path = f"phase2-13-test/{test_uuid}.txt"
    test_content = f"CleanSheet Phase 2.13 Live Validation Payload {test_uuid}".encode("utf-8")

    steps_completed = []

    try:
        # Step 1: Upload
        upload_res = client.put_object(
            path=test_path,
            body=test_content,
            content_type="text/plain; charset=utf-8",
        )
        steps_completed.append("upload")

        # Step 2: Read
        read_bytes = client.get_object_bytes(test_path)
        steps_completed.append("read")

        # Step 3: Verify content
        if read_bytes != test_content:
            raise HTTPException(
                status_code=500,
                detail="Content verification failed: retrieved bytes do not match uploaded bytes.",
            )
        steps_completed.append("verify_content")

        # Step 4: Delete
        client.delete_object(test_path)
        steps_completed.append("delete")

        # Step 5: Verify deletion
        try:
            _ = client.get_object_bytes(test_path)
            # If no exception raised, deletion failed
            raise HTTPException(
                status_code=500,
                detail="Deletion verification failed: test object still accessible after delete.",
            )
        except VercelBlobError:
            # Expected exception (404 or not found)
            steps_completed.append("verify_deletion")

        return {
            "status": "success",
            "message": "Phase 2.13 Live Private Blob Validation Passed 100%",
            "test_path": test_path,
            "steps_completed": steps_completed,
            "cleanup": "verified",
        }

    except Exception as exc:
        # Ensure emergency cleanup attempt if upload succeeded
        if "upload" in steps_completed and "delete" not in steps_completed:
            try:
                client.delete_object(test_path)
                logger.info(f"Emergency cleanup succeeded for failed test object '{test_path}'")
            except Exception as cleanup_exc:
                logger.error(f"Emergency cleanup failed for '{test_path}': {cleanup_exc}")

        if isinstance(exc, HTTPException):
            raise exc

        error_msg = str(exc)
        logger.error(f"Phase 2.13 Blob validation error: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "fail",
                "error": error_msg,
                "steps_completed": steps_completed,
                "test_path": test_path,
            },
        )
