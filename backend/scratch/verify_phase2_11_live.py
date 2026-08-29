"""
Live test verification script for Phase 2.11 - Vercel Blob Private Store Signed-Token Client.
Runs live I/O against real Neon DB & real Vercel Blob Private Store using credentials in backend/.env.
"""

import uuid
import pandas as pd
import sys

sys.path.insert(0, ".")

from app.config import settings
from app.storage.blob_client import get_blob_client
from app.services.dataset_store import (
    save_dataset,
    get_dataset,
    update_dataset,
    delete_dataset,
)


def run_live_tests():
    print("=" * 60)
    print("PHASE 2.11 LIVE VERIFICATION TEST")
    print("=" * 60)

    # Check credentials
    if not settings.BLOB_READ_WRITE_TOKEN:
        print("FAIL: BLOB_READ_WRITE_TOKEN is missing in environment!")
        sys.exit(1)
    if not settings.DATABASE_URL:
        print("FAIL: DATABASE_URL is missing in environment!")
        sys.exit(1)

    print("Credentials detected: BLOB_READ_WRITE_TOKEN & DATABASE_URL present.")

    client = get_blob_client()
    test_id = str(uuid.uuid4())[:8]
    test_path = f"phase2-11-test/live_verification_{test_id}.txt"
    test_content = f"CleanSheet Phase 2.11 Signed Token Verification Content {test_id}".encode("utf-8")

    print(f"\n--- STEP 1: LIVE BLOB I/O TEST (Path: {test_path}) ---")

    # 1. Upload
    print("1. Uploading test object via signed-token delegation flow...")
    upload_res = client.put_object(test_path, test_content, content_type="text/plain; charset=utf-8")
    print("   Upload SUCCESS! Object URL:", upload_res.get("url", "N/A"))

    # 2. Read
    print("2. Reading test object bytes...")
    read_bytes = client.get_object_bytes(test_path)
    print("   Read SUCCESS! Bytes length:", len(read_bytes))

    # 3. Verify content
    print("3. Verifying content integrity...")
    if read_bytes == test_content:
        print("   Content Verification: PASS!")
    else:
        print("   Content Verification: FAIL (mismatch)!")
        sys.exit(1)

    # 4. Delete
    print("4. Deleting test object...")
    client.delete_object(test_path)
    print("   Delete SUCCESS!")

    # 5. Verify deletion
    print("5. Verifying object deletion...")
    try:
        _ = client.get_object_bytes(test_path)
        print("   Deletion Verification: FAIL (object still exists)!")
        sys.exit(1)
    except Exception as e:
        print("   Deletion Verification: PASS (object gone, caught expected exception):", type(e).__name__)

    print("\n--- STEP 2: LIVE DATASET STORE INTEGRATION TEST ---")

    # Create small test DataFrame
    df = pd.DataFrame({
        "id": [1, 2, 3],
        "name": ["Alice", "Bob", "Charlie"],
        "score": [85.5, 90.0, 95.5]
    })
    filename = f"live_test_{test_id}.csv"

    # A. save_dataset
    print("A. Calling save_dataset()...")
    dataset_id, meta = save_dataset(df, filename=filename)
    print(f"   save_dataset() SUCCESS! Dataset ID: {dataset_id}")

    # B. get_dataset
    print("B. Calling get_dataset()...")
    retrieved_df, retrieved_meta = get_dataset(dataset_id)
    print(f"   get_dataset() SUCCESS! Retrieved rows: {len(retrieved_df)}")

    # Verify DataFrame equality
    if len(retrieved_df) == len(df) and list(retrieved_df.columns) == list(df.columns):
        print("   DataFrame Reconstruction Verification: PASS!")
    else:
        print("   DataFrame Reconstruction Verification: FAIL!")
        sys.exit(1)

    # C. update_dataset
    print("C. Calling update_dataset() with modified DataFrame...")
    updated_df = df.copy()
    updated_df["score"] = [88.0, 92.0, 98.0]
    updated_meta = update_dataset(dataset_id, updated_df)
    print("   update_dataset() SUCCESS! New row count:", updated_meta["row_count"])

    # D. delete_dataset
    print("D. Calling delete_dataset()...")
    delete_dataset(dataset_id)
    print("   delete_dataset() SUCCESS!")

    # Verify dataset is completely gone from DB & Blob
    print("E. Verifying dataset deletion from store...")
    gone_df, gone_meta = get_dataset(dataset_id)
    if gone_df is None and gone_meta is None:
        print("   Dataset Store Deletion Verification: PASS!")
    else:
        print("   Dataset Store Deletion Verification: FAIL!")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("PHASE 2.11 ALL LIVE TESTS PASSED 100%!")
    print("=" * 60)


if __name__ == "__main__":
    run_live_tests()
