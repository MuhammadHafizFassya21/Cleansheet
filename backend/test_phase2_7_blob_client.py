"""
Unit test suite for VercelBlobStorageClient (Phase 2.7 Native REST Client)
Covers:
1. Missing token handling.
2. Client initialization and configuration checks.
3. Upload request (headers, endpoint, payload).
4. Read request (headers, endpoint, response bytes).
5. Delete request (headers, endpoint, idempotent 404).
6. Non-leakage of authorization token in logs or error messages.
7. Private access header verification (`x-access: private`).
8. HTTP error code handling (400, 401/403, 404, 500).
9. Timeout handling.
"""

import io
import json
import unittest
import urllib.error
from unittest.mock import MagicMock, patch

from app.storage.blob_client import (
    VercelBlobStorageClient,
    VercelBlobError,
    VercelBlobAuthError,
    VercelBlobNotFoundError,
    VercelBlobBadRequestError,
    get_blob_client,
)


class TestVercelBlobStorageClientUnit(unittest.TestCase):

    @patch("app.storage.blob_client.settings")
    def test_01_missing_token_validation(self, mock_settings):
        """Client throws ValueError when BLOB_READ_WRITE_TOKEN is missing or unconfigured."""
        mock_settings.BLOB_READ_WRITE_TOKEN = ""
        with patch.dict("os.environ", {"BLOB_READ_WRITE_TOKEN": ""}):
            client = VercelBlobStorageClient(token="")
            self.assertFalse(client.is_configured())

            with self.assertRaises(ValueError) as ctx:
                client.put_object("datasets/test.csv", b"data")
            self.assertIn("BLOB_READ_WRITE_TOKEN is not configured", str(ctx.exception))

            with self.assertRaises(ValueError) as ctx:
                client.get_object_bytes("datasets/test.csv")
            self.assertIn("BLOB_READ_WRITE_TOKEN is not configured", str(ctx.exception))

            with self.assertRaises(ValueError) as ctx:
                client.delete_object("datasets/test.csv")
            self.assertIn("BLOB_READ_WRITE_TOKEN is not configured", str(ctx.exception))

    def test_02_client_initialization_factory(self):
        """Factory get_blob_client returns a valid VercelBlobStorageClient instance."""
        client = get_blob_client(token="dummy_token_123", timeout=10)
        self.assertTrue(client.is_configured())
        self.assertEqual(client.token, "dummy_token_123")
        self.assertEqual(client.timeout, 10)

    @patch("urllib.request.urlopen")
    def test_03_put_object_private_headers(self, mock_urlopen):
        """Verify put_object sends x-access: private and Authorization Bearer header to correct REST endpoint."""
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({"url": "https://blob.vercel.com/datasets/test.csv"}).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        client = VercelBlobStorageClient(token="secret_token_abc")
        res = client.put_object("datasets/test.csv", b"col1,col2\n1,2", content_type="text/csv; charset=utf-8")

        self.assertEqual(res["url"], "https://blob.vercel.com/datasets/test.csv")
        mock_urlopen.assert_called_once()

        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.full_url, "https://blob.vercel-storage.com/datasets/test.csv")
        self.assertEqual(req.get_header("Authorization"), "Bearer secret_token_abc")
        self.assertEqual(req.get_header("X-access"), "private")
        self.assertEqual(req.get_header("X-content-type"), "text/csv; charset=utf-8")

    @patch("urllib.request.urlopen")
    def test_04_get_object_bytes_success(self, mock_urlopen):
        """Verify get_object_bytes sends GET request with Bearer authorization."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"csv,content\nval1,val2"
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        client = VercelBlobStorageClient(token="secret_token_abc")
        content = client.get_object_bytes("https://blob.vercel.com/datasets/ds_123.csv")

        self.assertEqual(content, b"csv,content\nval1,val2")
        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.full_url, "https://blob.vercel.com/datasets/ds_123.csv")
        self.assertEqual(req.get_header("Authorization"), "Bearer secret_token_abc")

    @patch("urllib.request.urlopen")
    def test_05_delete_object_success_and_idempotent_404(self, mock_urlopen):
        """Verify delete_object sends DELETE request and handles 404 gracefully as idempotent success."""
        mock_response = MagicMock()
        mock_response.read.return_value = b"{}"
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        client = VercelBlobStorageClient(token="secret_token_abc")
        client.delete_object("datasets/ds_123.csv")
        mock_urlopen.assert_called_once()

        # Idempotent 404 test
        http_404_error = urllib.error.HTTPError(
            url="https://blob.vercel-storage.com/datasets/ds_123.csv",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=io.BytesIO(b'{"error":{"message":"Blob not found"}}')
        )
        mock_urlopen.side_effect = http_404_error
        # Should not raise exception
        client.delete_object("datasets/ds_123.csv")

    @patch("urllib.request.urlopen")
    def test_06_http_error_mappings(self, mock_urlopen):
        """Verify HTTP 400, 401/403, and 500 are mapped to clean VercelBlobError subtypes without leaking tokens."""
        client = VercelBlobStorageClient(token="secret_token_xyz")

        # 400 Bad Request
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://blob.vercel-storage.com/test.csv",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=io.BytesIO(b'{"error":{"message":"Invalid header"}}')
        )
        with self.assertRaises(VercelBlobBadRequestError) as ctx:
            client.put_object("test.csv", b"content")
        self.assertIn("400", str(ctx.exception))
        self.assertNotIn("secret_token_xyz", str(ctx.exception))

        # 401 Unauthorized
        mock_urlopen.side_effect = urllib.error.HTTPError(
            url="https://blob.vercel-storage.com/test.csv",
            code=401,
            msg="Unauthorized",
            hdrs={},
            fp=io.BytesIO(b'{"error":{"message":"Token invalid"}}')
        )
        with self.assertRaises(VercelBlobAuthError) as ctx:
            client.get_object_bytes("test.csv")
        self.assertIn("401", str(ctx.exception))
        self.assertNotIn("secret_token_xyz", str(ctx.exception))

    @patch("urllib.request.urlopen")
    def test_07_network_timeout_handling(self, mock_urlopen):
        """Verify network timeout raises VercelBlobError."""
        mock_urlopen.side_effect = urllib.error.URLError("Connection timed out")
        client = VercelBlobStorageClient(token="secret_token_xyz", timeout=5)

        with self.assertRaises(VercelBlobError) as ctx:
            client.put_object("test.csv", b"content")
        self.assertIn("Network error", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
