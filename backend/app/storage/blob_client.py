import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 15
VERCEL_BLOB_BASE_URL = "https://blob.vercel-storage.com"
VERCEL_BLOB_API_VERSION = "7"


class VercelBlobError(Exception):
    """Base exception for Vercel Blob operations."""
    pass


class VercelBlobAuthError(VercelBlobError):
    """Raised when authentication or authorization fails (401/403)."""
    pass


class VercelBlobNotFoundError(VercelBlobError):
    """Raised when the target Blob object is not found (404)."""
    pass


class VercelBlobBadRequestError(VercelBlobError):
    """Raised when invalid request parameters or headers are supplied (400)."""
    pass


class VercelBlobStorageClient:
    """
    Direct Vercel Blob REST API (v7) server-side client supporting Private Store.
    Does not rely on third-party SDKs with hardcoded public access headers.
    """

    def __init__(self, token: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT_SECONDS):
        self.token = token or settings.BLOB_READ_WRITE_TOKEN or os.getenv("BLOB_READ_WRITE_TOKEN")
        self.timeout = timeout

    def is_configured(self) -> bool:
        """Check if BLOB_READ_WRITE_TOKEN is present and non-empty."""
        return bool(self.token and self.token.strip())

    def _get_headers(self, extra_headers: Optional[dict[str, str]] = None) -> dict[str, str]:
        """Build standard authorization & API version headers without leaking secrets."""
        if not self.is_configured():
            raise ValueError("BLOB_READ_WRITE_TOKEN is not configured.")

        headers = {
            "authorization": f"Bearer {self.token}",
            "x-api-version": VERCEL_BLOB_API_VERSION,
        }
        if extra_headers:
            headers.update(extra_headers)
        return headers

    def put_object(
        self,
        path: str,
        body: bytes,
        content_type: str = "text/csv; charset=utf-8",
        access: str = "private",
    ) -> dict[str, Any]:
        """
        Upload bytes object to Vercel Blob using direct REST PUT call.
        Supports Private Store (`x-access: private` or `x-mp-access: private`).
        """
        clean_path = path.lstrip("/")
        encoded_path = urllib.parse.quote(clean_path, safe="/")
        url = f"{VERCEL_BLOB_BASE_URL}/{encoded_path}"

        headers = self._get_headers({
            "x-access": access,
            "x-content-type": content_type,
            "x-add-random-suffix": "0",
            "x-allow-overwrite": "1",
        })

        req = urllib.request.Request(url, data=body, headers=headers, method="PUT")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                resp_bytes = resp.read()
                data = json.loads(resp_bytes.decode("utf-8")) if resp_bytes else {}
                return data
        except urllib.error.HTTPError as http_err:
            self._handle_http_error(http_err, f"upload object at path '{clean_path}'")
        except urllib.error.URLError as url_err:
            logger.error(f"Network failure uploading object '{clean_path}': {url_err}")
            raise VercelBlobError(f"Network error during Blob upload: {url_err}")
        except Exception as exc:
            logger.error(f"Unexpected error uploading object '{clean_path}': {exc}")
            raise VercelBlobError(f"Blob upload failed: {exc}")

    def get_object_bytes(self, url_or_path: str) -> bytes:
        """
        Fetch raw bytes of a Blob object server-side using bearer authorization.
        """
        if not self.is_configured():
            raise ValueError("BLOB_READ_WRITE_TOKEN is not configured.")

        url = self._resolve_url(url_or_path)
        headers = self._get_headers()

        req = urllib.request.Request(url, headers=headers, method="GET")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as http_err:
            self._handle_http_error(http_err, f"get object at '{url_or_path}'")
        except urllib.error.URLError as url_err:
            logger.error(f"Network failure reading Blob object '{url_or_path}': {url_err}")
            raise VercelBlobError(f"Network error during Blob read: {url_err}")
        except Exception as exc:
            logger.error(f"Unexpected error reading Blob object '{url_or_path}': {exc}")
            raise VercelBlobError(f"Blob read failed: {exc}")

    def head_object(self, url_or_path: str) -> dict[str, Any]:
        """
        Fetch metadata of a Blob object via server-side GET or REST metadata endpoint.
        """
        if not self.is_configured():
            raise ValueError("BLOB_READ_WRITE_TOKEN is not configured.")

        url = self._resolve_url(url_or_path)
        headers = self._get_headers()

        req = urllib.request.Request(url, headers=headers, method="GET")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                headers_dict = dict(resp.headers)
                return {
                    "url": url,
                    "contentType": headers_dict.get("content-type", "application/octet-stream"),
                    "size": int(headers_dict.get("content-length", 0)),
                }
        except urllib.error.HTTPError as http_err:
            self._handle_http_error(http_err, f"check metadata at '{url_or_path}'")
        except Exception as exc:
            raise VercelBlobError(f"Blob head failed: {exc}")

    def delete_object(self, url_or_path: str) -> None:
        """
        Delete a Blob object from Vercel Blob using server-side DELETE REST call.
        """
        if not self.is_configured():
            raise ValueError("BLOB_READ_WRITE_TOKEN is not configured.")

        url = self._resolve_url(url_or_path)
        headers = self._get_headers()

        req = urllib.request.Request(url, headers=headers, method="DELETE")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                _ = resp.read()
        except urllib.error.HTTPError as http_err:
            if http_err.code == 404:
                # Idempotent delete: if already gone, treat as success
                logger.info(f"Blob object already deleted or not found: {url_or_path}")
                return
            self._handle_http_error(http_err, f"delete object at '{url_or_path}'")
        except urllib.error.URLError as url_err:
            logger.error(f"Network failure deleting Blob object '{url_or_path}': {url_err}")
            raise VercelBlobError(f"Network error during Blob delete: {url_err}")
        except Exception as exc:
            logger.error(f"Unexpected error deleting Blob object '{url_or_path}': {exc}")
            raise VercelBlobError(f"Blob delete failed: {exc}")

    def _resolve_url(self, url_or_path: str) -> str:
        """Helper to ensure full URL format for Vercel Blob REST endpoints."""
        if url_or_path.startswith("http://") or url_or_path.startswith("https://"):
            return url_or_path
        clean_path = url_or_path.lstrip("/")
        encoded_path = urllib.parse.quote(clean_path, safe="/")
        return f"{VERCEL_BLOB_BASE_URL}/{encoded_path}"

    def _handle_http_error(self, http_err: urllib.error.HTTPError, action_desc: str) -> None:
        """Parse HTTP status code and throw specific VercelBlobError exceptions without leaking credentials."""
        status = http_err.code
        body_msg = ""
        try:
            err_body = http_err.read().decode("utf-8")
            err_json = json.loads(err_body)
            body_msg = err_json.get("error", {}).get("message", err_body)
        except Exception:
            body_msg = str(http_err)

        log_msg = f"HTTP {status} when attempting to {action_desc}: {body_msg}"
        logger.error(log_msg)

        if status in (401, 403):
            raise VercelBlobAuthError(f"Authentication/Authorization failed ({status}): {body_msg}")
        elif status == 404:
            raise VercelBlobNotFoundError(f"Blob object not found (404): {body_msg}")
        elif status == 400:
            raise VercelBlobBadRequestError(f"Bad request to Vercel Blob (400): {body_msg}")
        else:
            raise VercelBlobError(f"Vercel Blob server error ({status}): {body_msg}")


def get_blob_client(token: Optional[str] = None, timeout: int = DEFAULT_TIMEOUT_SECONDS) -> VercelBlobStorageClient:
    """Factory helper to obtain a configured VercelBlobStorageClient."""
    return VercelBlobStorageClient(token=token, timeout=timeout)
