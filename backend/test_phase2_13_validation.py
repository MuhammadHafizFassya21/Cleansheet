"""
Unit test suite for Phase 2.13 Vercel Validation Endpoint (/api/phase2-13/health and /api/phase2-13/blob-test).
"""

import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestPhase213ValidationEndpoints(unittest.TestCase):

    def test_health_endpoint(self):
        """Test GET /api/phase2-13/health returns status ok."""
        response = client.get("/api/phase2-13/health")
        self.assertEqual(response.status_code, 200)
        json_data = response.json()
        self.assertEqual(json_data["status"], "ok")
        self.assertEqual(json_data["runtime"], "vercel")

    @patch("app.routers.phase2_13_validation.get_blob_client")
    def test_blob_test_endpoint_success(self, mock_get_client):
        """Test POST /api/phase2-13/blob-test executes 5-step validation and returns success."""
        mock_blob = MagicMock()
        mock_blob.is_configured.return_value = True
        mock_blob.put_object.return_value = {"url": "https://blob.vercel.com/phase2-13-test/sample.txt"}
        
        # Side effect for get_object_bytes: first call returns bytes (step 2), second call raises VercelBlobError (step 5)
        from app.storage.blob_client import VercelBlobError
        mock_blob.get_object_bytes.side_effect = [
            b"CleanSheet Phase 2.13 Live Validation Payload sample",
            VercelBlobError("Not found"),
        ]
        mock_get_client.return_value = mock_blob

        with patch("uuid.uuid4", return_value="sample"):
            response = client.post("/api/phase2-13/blob-test")

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("verify_deletion", data["steps_completed"])

    @patch("app.routers.phase2_13_validation.get_blob_client")
    def test_blob_test_endpoint_unconfigured(self, mock_get_client):
        """Test POST /api/phase2-13/blob-test fails when client is unconfigured."""
        mock_blob = MagicMock()
        mock_blob.is_configured.return_value = False
        mock_get_client.return_value = mock_blob

        response = client.post("/api/phase2-13/blob-test")
        self.assertEqual(response.status_code, 500)
        self.assertIn("unconfigured", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
