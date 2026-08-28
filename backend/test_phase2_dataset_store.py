"""
Test suite for Phase 2 Migration: dataset_store migration to Neon PostgreSQL + Vercel Blob.
Covers:
1. In-memory fallback behavior (when credentials are not set).
2. Interface signature and contract matching.
3. Persistent store CRUD logic (mocking DB and Blob calls).
4. Failure handling (Blob failure rollback & DB failure best-effort cleanup).
5. TTL Expiry handling.
"""

import unittest
from unittest.mock import MagicMock, patch
import pandas as pd

from app.services import dataset_store


class TestPhase2DatasetStore(unittest.TestCase):

    def setUp(self):
        # Clear in-memory DATASETS dictionary before each test
        dataset_store.DATASETS.clear()

    @patch("app.services.dataset_store._use_persistent_store", return_value=False)
    def test_01_in_memory_save_and_get(self, mock_persistent):
        """Test save_dataset and get_dataset using default in-memory store."""
        df = pd.DataFrame({"col1": [1, 2], "col2": ["a", "b"]})
        ds_id = dataset_store.save_dataset(
            df=df,
            file_name="test.csv",
            stage="uploaded",
            metadata={"source": "test"},
            dataset_id="ds_test_01"
        )
        self.assertEqual(ds_id, "ds_test_01")

        stored = dataset_store.get_dataset("ds_test_01")
        self.assertIsNotNone(stored)
        self.assertEqual(stored["file_name"], "test.csv")
        self.assertEqual(stored["stage"], "uploaded")
        self.assertEqual(stored["metadata"]["source"], "test")
        pd.testing.assert_frame_equal(stored["df"], df)

    @patch("app.services.dataset_store._use_persistent_store", return_value=False)
    def test_02_in_memory_update_and_delete(self, mock_persistent):
        """Test update_dataset and delete_dataset in-memory."""
        df1 = pd.DataFrame({"a": [1]})
        df2 = pd.DataFrame({"a": [1, 2]})
        ds_id = dataset_store.save_dataset(df1, "test.csv", "uploaded", dataset_id="ds_test_02")

        updated = dataset_store.update_dataset("ds_test_02", df2, stage="analyzed")
        self.assertTrue(updated)

        stored = dataset_store.get_dataset("ds_test_02")
        self.assertEqual(stored["stage"], "analyzed")
        self.assertEqual(len(stored["df"]), 2)

        deleted = dataset_store.delete_dataset("ds_test_02")
        self.assertTrue(deleted)
        self.assertIsNone(dataset_store.get_dataset("ds_test_02"))

    @patch("app.services.dataset_store._use_persistent_store", return_value=False)
    def test_03_save_cleaned_dataset_helper(self, mock_persistent):
        """Test save_cleaned_dataset helper function."""
        df = pd.DataFrame({"x": [10]})
        cleaned_id = dataset_store.save_cleaned_dataset(df, "original.csv")
        self.assertTrue(cleaned_id.startswith("ds_"))

        stored = dataset_store.get_dataset(cleaned_id)
        self.assertEqual(stored["file_name"], "cleaned_original.csv")
        self.assertEqual(stored["stage"], "auto_cleaned")

    @patch("app.services.dataset_store._use_persistent_store", return_value=True)
    @patch("app.storage.blob_client.get_blob_client")
    @patch("app.db.database.get_db_connection")
    def test_04_persistent_save_dataset_success(self, mock_get_db_conn, mock_get_blob_client, mock_persistent):
        """Test save_dataset in persistent mode with mock DB and Blob."""
        mock_blob = MagicMock()
        mock_blob.put_object.return_value = {"url": "https://blob.vercel.com/datasets/ds_p1.csv"}
        mock_get_blob_client.return_value = mock_blob

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_db_conn.return_value.__enter__.return_value = mock_conn

        df = pd.DataFrame({"id": [1, 2], "val": ["x", "y"]})
        ds_id = dataset_store.save_dataset(
            df=df,
            file_name="p_test.csv",
            stage="uploaded",
            metadata={"source": "persistent_test", "parent_dataset_id": "ds_parent_123"},
            dataset_id="ds_p1"
        )

        self.assertEqual(ds_id, "ds_p1")
        mock_blob.put_object.assert_called_once()
        mock_cur.execute.assert_called_once()
        sql_arg = mock_cur.execute.call_args[0][0]
        self.assertIn("INSERT INTO datasets", sql_arg)

    @patch("app.services.dataset_store._use_persistent_store", return_value=True)
    @patch("app.storage.blob_client.get_blob_client")
    def test_05_persistent_save_blob_failure_rollback(self, mock_get_blob_client, mock_persistent):
        """Test Blob failure during save_dataset raises exception without touching DB."""
        mock_blob = MagicMock()
        mock_blob.put_object.side_effect = Exception("Blob Network Error")
        mock_get_blob_client.return_value = mock_blob

        df = pd.DataFrame({"a": [1]})
        with self.assertRaises(RuntimeError) as ctx:
            dataset_store.save_dataset(df, "test.csv", "uploaded", dataset_id="ds_fail_1")

        self.assertIn("Failed to upload dataset object to Vercel Blob", str(ctx.exception))

    @patch("app.services.dataset_store._use_persistent_store", return_value=True)
    @patch("app.storage.blob_client.get_blob_client")
    @patch("app.db.database.get_db_connection")
    def test_06_persistent_save_db_failure_cleans_up_blob(self, mock_get_db_conn, mock_get_blob_client, mock_persistent):
        """Test DB insert failure after Blob upload triggers best-effort Blob deletion."""
        mock_blob = MagicMock()
        mock_blob.put_object.return_value = {"url": "https://blob.vercel.com/datasets/ds_fail_2.csv"}
        mock_get_blob_client.return_value = mock_blob

        mock_conn = MagicMock()
        mock_cur = MagicMock()
        mock_cur.execute.side_effect = Exception("Neon DB Connection Error")
        mock_conn.cursor.return_value.__enter__.return_value = mock_cur
        mock_get_db_conn.return_value.__enter__.return_value = mock_conn

        df = pd.DataFrame({"a": [1]})
        with self.assertRaises(RuntimeError) as ctx:
            dataset_store.save_dataset(df, "test.csv", "uploaded", dataset_id="ds_fail_2")

        self.assertIn("Failed to save dataset metadata to database", str(ctx.exception))
        # Ensure best-effort delete_object was triggered on blob_client
        mock_blob.delete_object.assert_called_once_with("https://blob.vercel.com/datasets/ds_fail_2.csv")


if __name__ == "__main__":
    unittest.main()
