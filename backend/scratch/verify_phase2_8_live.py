import os
import sys
import unittest
import pandas as pd
from unittest.mock import patch, MagicMock

from app.config import settings
from app.storage.blob_client import get_blob_client, VercelBlobNotFoundError
from app.services import dataset_store
from app.db.database import get_db_connection
from psycopg.rows import dict_row

class TestPhase28LiveVerification(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        print("\n--- PHASE 2.8 LIVE VERCEL BLOB & INTEGRATION VERIFICATION ---\n")
        cls.token_present = bool(settings.BLOB_READ_WRITE_TOKEN and settings.BLOB_READ_WRITE_TOKEN.strip())
        cls.db_present = bool(settings.DATABASE_URL and settings.DATABASE_URL.strip())
        
        print(f"1. BLOB_READ_WRITE_TOKEN DETECTED: {'PASS' if cls.token_present else 'FAIL'}")
        print(f"2. DATABASE_URL DETECTED: {'PASS' if cls.db_present else 'FAIL'}")
        
        if not cls.token_present or not cls.db_present:
            raise RuntimeError("Missing required credentials in backend/.env for live verification.")
        
        cls.client = get_blob_client()

    def test_01_live_blob_crud(self):
        """Test Basic CRUD directly against REAL Vercel Blob Private Store."""
        test_key = "phase2-8-test/blob-client-verification.txt"
        content = b"CleanSheet AI Phase 2.8 live verification"

        # Upload
        print(f"\nUploading to REAL Vercel Blob Private Store ({test_key})...")
        res = self.client.put_object(test_key, content, content_type="text/plain; charset=utf-8", access="private")
        self.assertIsNotNone(res)
        print(" -> Live Blob Upload: PASS")

        # Read
        print("Reading uploaded object from REAL Vercel Blob...")
        downloaded = self.client.get_object_bytes(test_key)
        self.assertEqual(downloaded, content)
        print(" -> Live Blob Read: PASS")

        # Delete
        print("Deleting test object from REAL Vercel Blob...")
        self.client.delete_object(test_key)
        print(" -> Live Blob Delete: PASS")

        # Verify Cleanup
        print("Verifying non-existence after deletion...")
        with self.assertRaises((VercelBlobNotFoundError, Exception)):
            self.client.get_object_bytes(test_key)
        print(" -> Cleanup Verification: PASS (0 objects remaining)")

    def test_02_live_dataset_store_integration(self):
        """Test end-to-end dataset_store CRUD with REAL Neon PostgreSQL + REAL Vercel Blob."""
        print("\nRunning Live dataset_store Integration Test...")
        test_df = pd.DataFrame({"id": [1, 2], "name": ["Alpha", "Beta"], "score": [95.5, 88.0]})
        test_ds_id = "ds_phase28_live_test"

        # Save dataset
        returned_id = dataset_store.save_dataset(
            df=test_df,
            file_name="phase28_test.csv",
            stage="uploaded",
            metadata={"source": "phase28_live_test"},
            dataset_id=test_ds_id
        )
        self.assertEqual(returned_id, test_ds_id)
        print(" -> dataset_store.save_dataset(): PASS")

        # Verify DB metadata exists
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT id, object_key, storage_status FROM datasets WHERE id = %s;", (test_ds_id,))
                row = cur.fetchone()
                self.assertIsNotNone(row)
                self.assertEqual(row["storage_status"], "ready")
                print(" -> Neon DB Metadata Verification: PASS")

        # Get dataset & reconstruct DataFrame
        stored = dataset_store.get_dataset(test_ds_id)
        self.assertIsNotNone(stored)
        self.assertEqual(stored["file_name"], "phase28_test.csv")
        self.assertEqual(stored["stage"], "uploaded")
        pd.testing.assert_frame_equal(stored["df"], test_df)
        print(" -> dataset_store.get_dataset() & DataFrame Reconstruction: PASS")

        # Delete dataset
        deleted = dataset_store.delete_dataset(test_ds_id)
        self.assertTrue(deleted)
        print(" -> dataset_store.delete_dataset(): PASS")

        # Verify DB row deleted
        with get_db_connection() as conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT id FROM datasets WHERE id = %s;", (test_ds_id,))
                self.assertIsNone(cur.fetchone())
                print(" -> Neon DB Row Cleanup Verification: PASS")

    def test_03_rollback_fault_injection(self):
        """Test rollback behavior: DB failure after successful Blob upload triggers Blob cleanup."""
        print("\nRunning Rollback Fault Injection Test...")
        test_df = pd.DataFrame({"col": [100]})
        fault_ds_id = "ds_phase28_fault_test"
        expected_blob_key = f"datasets/{fault_ds_id}.csv"

        with patch("app.db.database.get_db_connection") as mock_db_conn:
            mock_conn = MagicMock()
            mock_cur = MagicMock()
            mock_cur.execute.side_effect = Exception("Simulated Neon DB Failure")
            mock_conn.cursor.return_value.__enter__.return_value = mock_cur
            mock_db_conn.return_value.__enter__.return_value = mock_conn

            with self.assertRaises(RuntimeError) as ctx:
                dataset_store.save_dataset(
                    df=test_df,
                    file_name="fault_test.csv",
                    stage="uploaded",
                    dataset_id=fault_ds_id
                )
            self.assertIn("Failed to save dataset metadata to database", str(ctx.exception))
            print(" -> Fault Injection Caught: PASS")

        # Verify Blob object was cleaned up and does not exist in Vercel Blob
        with self.assertRaises((VercelBlobNotFoundError, Exception)):
            self.client.get_object_bytes(expected_blob_key)
        print(" -> Rollback Blob Cleanup Verification: PASS (0 orphan objects)")

if __name__ == "__main__":
    unittest.main()
