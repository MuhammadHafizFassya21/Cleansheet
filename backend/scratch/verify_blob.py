import os
import sys
import uuid
import urllib.request

from app.config import settings
from app.storage.blob_client import get_blob_client

print("1. DATABASE_URL DETECTED:", "PASS" if bool(settings.DATABASE_URL and settings.DATABASE_URL.strip()) else "FAIL")
print("2. BLOB_READ_WRITE_TOKEN DETECTED:", "PASS" if bool(settings.BLOB_READ_WRITE_TOKEN and settings.BLOB_READ_WRITE_TOKEN.strip()) else "FAIL")

if not settings.BLOB_READ_WRITE_TOKEN or not settings.BLOB_READ_WRITE_TOKEN.strip():
    print("ERROR: BLOB_READ_WRITE_TOKEN is missing or empty in backend/.env")
    sys.exit(1)

client = get_blob_client()
print("3. BLOB CLIENT INIT:", "PASS" if client.is_configured() else "FAIL")

test_filename = f"phase2-5-test/test_object_{uuid.uuid4().hex[:8]}.txt"
test_content = b"CleanSheet AI Vercel Blob Verification Test"
blob_url = None
upload_pass = False
read_pass = False
delete_pass = False
cleanup_pass = False

try:
    # Upload test
    print(f"Uploading test object: {test_filename}...")
    res = client.put_object(
        path=test_filename,
        body=test_content,
        content_type="text/plain; charset=utf-8"
    )
    blob_url = res.get("url") if isinstance(res, dict) else getattr(res, "url", None)
    upload_pass = bool(blob_url)
    print("4. BLOB UPLOAD:", "PASS" if upload_pass else "FAIL", f"URL Created: {bool(blob_url)}")

    # Read test
    if upload_pass and blob_url:
        req = urllib.request.Request(blob_url)
        with urllib.request.urlopen(req) as resp:
            downloaded_bytes = resp.read()
        read_pass = (downloaded_bytes == test_content)
        print("5. BLOB READ:", "PASS" if read_pass else "FAIL", f"Content Match: {read_pass}")

finally:
    # Delete & Cleanup test
    if blob_url or test_filename:
        try:
            client.delete_object(blob_url or test_filename)
            delete_pass = True
            print("6. BLOB DELETE:", "PASS")

            # Verify non-existence
            try:
                meta = client.head_object(blob_url or test_filename)
                print("7. CLEANUP VERIFY:", "FAIL - Object still metadata reachable")
                cleanup_pass = False
            except Exception:
                cleanup_pass = True
                print("7. CLEANUP VERIFY:", "PASS - Object successfully removed")

        except Exception as del_err:
            print("6/7. BLOB DELETE & CLEANUP: FAIL", type(del_err).__name__, str(del_err))

print("\n--- SUMMARY OF BLOB VERIFICATION ---")
print("Blob Upload:", "PASS" if upload_pass else "FAIL")
print("Blob Read:", "PASS" if read_pass else "FAIL")
print("Blob Delete:", "PASS" if delete_pass else "FAIL")
print("Blob Cleanup:", "PASS" if cleanup_pass else "FAIL")
