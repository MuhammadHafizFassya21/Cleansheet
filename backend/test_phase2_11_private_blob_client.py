"""
Unit Test Suite for Phase 2.11 - Vercel Blob Private Store Signed-Token Client.
All tests use 100% mocks. No real credentials are used.
"""

import json
import logging
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

from app.storage.blob_client import (
    VercelBlobAuthError,
    VercelBlobBadRequestError,
    VercelBlobError,
    VercelBlobNotFoundError,
    VercelBlobStorageClient,
)


class TestPhase211PrivateBlobClient(unittest.TestCase):

    def setUp(self):
        self.mock_token = "vercel_blob_rw_31VulpnJlokzC4iv_mocksecret12345"
        self.client = VercelBlobStorageClient(token=self.mock_token)

    def test_01_missing_token(self):
        """Test client initialization and methods when token is missing."""
        client_unconfigured = VercelBlobStorageClient(token="")
        self.assertFalse(client_unconfigured.is_configured())

        with self.assertRaises(ValueError):
            client_unconfigured._get_auth_headers()

        with self.assertRaises(ValueError):
            client_unconfigured._issue_signed_token("test.csv", ["put"])

        with self.assertRaises(ValueError):
            client_unconfigured.get_object_bytes("test.csv")

        with self.assertRaises(ValueError):
            client_unconfigured.delete_object("test.csv")

    @patch("urllib.request.urlopen")
    def test_02_signed_token_request(self, mock_urlopen):
        """Test POST /signed-token control plane call format and headers."""
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "delegationToken": "mock_delegation_jwt_token",
            "clientSigningToken": "mock_signing_key",
            "validUntil": 1788019776433,
        }).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = self.client._issue_signed_token("datasets/test.csv", ["put"])

        self.assertEqual(res["delegationToken"], "mock_delegation_jwt_token")
        self.assertEqual(res["validUntil"], 1788019776433)

        # Inspect request
        called_req = mock_urlopen.call_args[0][0]
        self.assertEqual(called_req.full_url, "https://blob.vercel-storage.com/signed-token")
        self.assertEqual(called_req.method, "POST")
        self.assertEqual(called_req.headers.get("Authorization"), f"Bearer {self.mock_token}")
        self.assertEqual(called_req.headers.get("X-api-version"), "12")

        body_data = json.loads(called_req.data.decode("utf-8"))
        self.assertEqual(body_data["pathname"], "datasets/test.csv")
        self.assertEqual(body_data["operations"], ["put"])

    @patch("urllib.request.urlopen")
    def test_03_signed_token_response_parsing(self, mock_urlopen):
        """Test parsing valid signed-token JSON response."""
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "delegationToken": "dt_abcdef123",
            "clientSigningToken": "cst_456789",
            "validUntil": 1800000000000,
        }).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        res = self.client._issue_signed_token("datasets/file.csv", ["put", "get"])
        self.assertIn("delegationToken", res)
        self.assertIn("clientSigningToken", res)

    def test_04_delegation_token_no_log_leakage(self):
        """Test that logger does not leak delegationToken or read-write token."""
        with self.assertLogs("app.storage.blob_client", level="ERROR") as cm:
            http_err = urllib.error.HTTPError(
                url="https://blob.vercel-storage.com",
                code=400,
                msg="Bad Request",
                hdrs={},
                fp=MagicMock(read=lambda: json.dumps({"error": {"message": f"Invalid token {self.mock_token}"}}).encode("utf-8")),
            )
            try:
                self.client._handle_http_error(http_err, "test action")
            except VercelBlobBadRequestError:
                pass

            log_output = "\n".join(cm.output)
            self.assertNotIn(self.mock_token, log_output)
            self.assertIn("[REDACTED_TOKEN]", log_output)

    @patch("urllib.request.urlopen")
    def test_05_put_using_delegation_flow(self, mock_urlopen):
        """Test put_object flow executes signed-token issuance followed by delegation PUT."""
        # Setup mock responses for 1) signed-token, 2) put
        mock_token_resp = MagicMock()
        mock_token_resp.read.return_value = json.dumps({
            "delegationToken": "mock_del_token_xyz",
            "clientSigningToken": "mock_cst_key",
            "validUntil": 1788019776433,
        }).encode("utf-8")

        mock_put_resp = MagicMock()
        mock_put_resp.read.return_value = json.dumps({
            "url": "https://31VulpnJlokzC4iv.private.blob.vercel-storage.com/datasets/sample.csv",
            "pathname": "datasets/sample.csv",
            "contentType": "text/csv; charset=utf-8",
        }).encode("utf-8")

        mock_urlopen.side_effect = [
            MagicMock(__enter__=MagicMock(return_value=mock_token_resp)),
            MagicMock(__enter__=MagicMock(return_value=mock_put_resp)),
        ]

        result = self.client.put_object("datasets/sample.csv", b"col1,col2\n1,2", "text/csv; charset=utf-8")

        self.assertEqual(result["pathname"], "datasets/sample.csv")
        self.assertIn("31VulpnJlokzC4iv", result["url"])
        self.assertEqual(mock_urlopen.call_count, 2)

        # Inspect 2nd request (PUT)
        put_req = mock_urlopen.call_args_list[1][0][0]
        self.assertEqual(put_req.method, "PUT")
        self.assertIn("vercel_blob_client_31VulpnJlokzC4iv_mock_del_token_xyz", put_req.headers.get("Authorization"))

    @patch("urllib.request.urlopen")
    def test_06_get_using_delegation_flow(self, mock_urlopen):
        """Test get_object_bytes executes authenticated GET."""
        mock_resp = MagicMock()
        mock_resp.read.return_value = b"csv_content_data"
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        data = self.client.get_object_bytes("datasets/sample.csv")
        self.assertEqual(data, b"csv_content_data")

        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.method, "GET")
        self.assertEqual(req.headers.get("Authorization"), f"Bearer {self.mock_token}")

    @patch("urllib.request.urlopen")
    def test_07_delete_using_delegation_flow(self, mock_urlopen):
        """Test delete_object executes control-plane POST /delete."""
        mock_resp = MagicMock()
        mock_resp.read.return_value = b"{}"
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        self.client.delete_object("datasets/sample.csv")

        req = mock_urlopen.call_args[0][0]
        self.assertEqual(req.method, "POST")
        self.assertEqual(req.full_url, "https://blob.vercel-storage.com/delete")
        body_data = json.loads(req.data.decode("utf-8"))
        self.assertEqual(body_data["urls"], ["https://blob.vercel-storage.com/datasets/sample.csv"])

    @patch("urllib.request.urlopen")
    def test_08_400_handling(self, mock_urlopen):
        """Test HTTP 400 maps to VercelBlobBadRequestError."""
        http_err = urllib.error.HTTPError(
            url="https://blob.vercel-storage.com",
            code=400,
            msg="Bad Request",
            hdrs={},
            fp=MagicMock(read=lambda: json.dumps({"error": {"message": "Invalid parameter"}}).encode("utf-8")),
        )
        mock_urlopen.side_effect = http_err

        with self.assertRaises(VercelBlobBadRequestError):
            self.client._issue_signed_token("test.csv", ["put"])

    @patch("urllib.request.urlopen")
    def test_09_401_handling(self, mock_urlopen):
        """Test HTTP 401 maps to VercelBlobAuthError."""
        http_err = urllib.error.HTTPError(
            url="https://blob.vercel-storage.com",
            code=401,
            msg="Unauthorized",
            hdrs={},
            fp=MagicMock(read=lambda: json.dumps({"error": {"message": "Invalid token"}}).encode("utf-8")),
        )
        mock_urlopen.side_effect = http_err

        with self.assertRaises(VercelBlobAuthError):
            self.client.get_object_bytes("test.csv")

    @patch("urllib.request.urlopen")
    def test_10_403_handling(self, mock_urlopen):
        """Test HTTP 403 maps to VercelBlobAuthError."""
        http_err = urllib.error.HTTPError(
            url="https://blob.vercel-storage.com",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=MagicMock(read=lambda: json.dumps({"error": {"message": "Access denied"}}).encode("utf-8")),
        )
        mock_urlopen.side_effect = http_err

        with self.assertRaises(VercelBlobAuthError):
            self.client.get_object_bytes("test.csv")

    @patch("urllib.request.urlopen")
    def test_11_404_handling(self, mock_urlopen):
        """Test HTTP 404 maps to VercelBlobNotFoundError or idempotent delete success."""
        http_err = urllib.error.HTTPError(
            url="https://blob.vercel-storage.com",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=MagicMock(read=lambda: json.dumps({"error": {"message": "Blob not found"}}).encode("utf-8")),
        )
        mock_urlopen.side_effect = http_err

        with self.assertRaises(VercelBlobNotFoundError):
            self.client.get_object_bytes("nonexistent.csv")

        # Idempotent delete test (should NOT raise)
        mock_urlopen.side_effect = http_err
        self.client.delete_object("nonexistent.csv")

    @patch("urllib.request.urlopen")
    def test_12_timeout_handling(self, mock_urlopen):
        """Test URLError / timeout maps to VercelBlobError."""
        mock_urlopen.side_effect = urllib.error.URLError("Connection timed out")

        with self.assertRaises(VercelBlobError) as ctx:
            self.client.get_object_bytes("test.csv")
        self.assertIn("Network error", str(ctx.exception))

    @patch("urllib.request.urlopen")
    def test_13_malformed_signed_token_response(self, mock_urlopen):
        """Test handling malformed JSON response from /signed-token."""
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({"invalid_field": "no_delegation_token"}).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        with self.assertRaises(VercelBlobError) as ctx:
            self.client._issue_signed_token("test.csv", ["put"])
        self.assertIn("Malformed signed-token response", str(ctx.exception))

    @patch("urllib.request.urlopen")
    def test_14_empty_delegation_token(self, mock_urlopen):
        """Test handling empty string delegationToken in response."""
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({"delegationToken": ""}).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        with self.assertRaises(VercelBlobError) as ctx:
            self.client._issue_signed_token("test.csv", ["put"])
        self.assertIn("Malformed signed-token response", str(ctx.exception))

    @patch("urllib.request.urlopen")
    def test_15_head_object_metadata(self, mock_urlopen):
        """Test head_object returns metadata dict."""
        mock_resp = MagicMock()
        mock_resp.headers = {"content-type": "text/csv", "content-length": "123"}
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        meta = self.client.head_object("test.csv")
        self.assertEqual(meta["contentType"], "text/csv")
        self.assertEqual(meta["size"], 123)


if __name__ == "__main__":
    unittest.main()
