"""
Test suite for Phase 1 Migration Infrastructure (Neon PostgreSQL & Vercel Blob)
Ensures:
1. Environment validation works correctly with or without credentials.
2. Database connection module initializes safely and validates URL requirements.
3. Blob client module initializes safely and validates token requirements.
4. Schema migration SQL file is reproducible and syntactically valid.
"""

import os
import unittest
from unittest.mock import patch

from app.config import settings, Settings
from app.db.database import get_db_url, run_migrations
from app.storage.blob_client import get_blob_client, VercelBlobStorageClient


class TestPhase1Infrastructure(unittest.TestCase):

    def test_01_environment_validation_without_credentials(self):
        """Ensure settings can be instantiated and validation reports missing credentials gracefully."""
        test_settings = Settings(DATABASE_URL=None, BLOB_READ_WRITE_TOKEN=None)
        validation = test_settings.validate_infrastructure_credentials()
        
        self.assertFalse(validation["database_url_configured"])
        self.assertFalse(validation["blob_token_configured"])
        self.assertFalse(validation["fully_configured"])

    def test_02_environment_validation_with_dummy_credentials(self):
        """Ensure settings validation returns True when dummy environment variables are provided."""
        test_settings = Settings(
            DATABASE_URL="postgresql://user:pass@localhost:5432/testdb",
            BLOB_READ_WRITE_TOKEN="vercel_blob_rw_dummy_123"
        )
        validation = test_settings.validate_infrastructure_credentials()
        
        self.assertTrue(validation["database_url_configured"])
        self.assertTrue(validation["blob_token_configured"])
        self.assertTrue(validation["fully_configured"])

    def test_03_database_module_unconfigured_error(self):
        """Ensure attempting to run migrations without DATABASE_URL raises ValueError."""
        # Temporarily clear DATABASE_URL from settings/env
        original_db_url = os.environ.get("DATABASE_URL")
        if "DATABASE_URL" in os.environ:
            del os.environ["DATABASE_URL"]
        settings.DATABASE_URL = None

        with self.assertRaises(ValueError) as ctx:
            run_migrations()
        self.assertIn("DATABASE_URL is not set", str(ctx.exception))

        # Restore original if present
        if original_db_url:
            os.environ["DATABASE_URL"] = original_db_url
            settings.DATABASE_URL = original_db_url

    @patch("app.storage.blob_client.settings")
    def test_04_blob_client_initialization_and_unconfigured_error(self, mock_settings):
        """Ensure Blob client initializes safely and raises ValueError if token is missing when uploading."""
        mock_settings.BLOB_READ_WRITE_TOKEN = ""
        with patch.dict("os.environ", {"BLOB_READ_WRITE_TOKEN": ""}):
            client = VercelBlobStorageClient(token="")
            self.assertFalse(client.is_configured())

            with self.assertRaises(ValueError) as ctx:
                client.put_object("datasets/test.csv", b"col1,col2\n1,2")
            self.assertIn("BLOB_READ_WRITE_TOKEN is not configured", str(ctx.exception))

    def test_05_schema_migration_file_exists_and_valid_sql(self):
        """Ensure migration file exists and contains expected SQL tables and indexes."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        migration_path = os.path.join(
            current_dir, "app", "db", "migrations", "001_initial_schema.sql"
        )
        self.assertTrue(os.path.exists(migration_path), f"Migration file missing at {migration_path}")

        with open(migration_path, "r", encoding="utf-8") as f:
            sql_content = f.read()

        # Check required tables
        self.assertIn("CREATE TABLE IF NOT EXISTS datasets", sql_content)
        self.assertIn("CREATE TABLE IF NOT EXISTS downloads", sql_content)

        # Check required columns and types
        self.assertIn("id TEXT PRIMARY KEY", sql_content)
        self.assertIn("object_key TEXT NOT NULL UNIQUE", sql_content)
        self.assertIn("parent_dataset_id TEXT NULL REFERENCES datasets(id)", sql_content)
        self.assertIn("metadata JSONB NOT NULL DEFAULT '{}'::jsonb", sql_content)
        self.assertIn("acknowledged_issue_keys TEXT[] NOT NULL DEFAULT '{}'", sql_content)
        self.assertIn("content_type TEXT NOT NULL DEFAULT 'text/csv; charset=utf-8'", sql_content)
        self.assertIn("size_bytes BIGINT NULL", sql_content)

        # Check required indexes
        self.assertIn("datasets_expires_at_idx", sql_content)
        self.assertIn("datasets_parent_dataset_id_idx", sql_content)
        self.assertIn("datasets_stage_idx", sql_content)
        self.assertIn("downloads_dataset_id_idx", sql_content)
        self.assertIn("downloads_expires_at_idx", sql_content)

    def test_06_live_credentials_test(self):
        """
        If live DATABASE_URL and BLOB_READ_WRITE_TOKEN are provided in environment,
        test live connection and migration execution. Skip if not configured.
        """
        db_url = os.getenv("DATABASE_URL")
        blob_token = os.getenv("BLOB_READ_WRITE_TOKEN")

        if not db_url or not blob_token:
            self.skipTest("Live credentials for Neon / Vercel Blob not provided in environment.")

        # If credentials provided, execute live test
        migration_success = run_migrations()
        self.assertTrue(migration_success)

        blob_client = get_blob_client(token=blob_token)
        self.assertTrue(blob_client.is_configured())


if __name__ == "__main__":
    unittest.main()
