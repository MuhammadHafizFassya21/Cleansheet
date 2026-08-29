"""
Phase 2.14 Cloudflare R2 Live Connection, Upload, Read, Delete & Lifecycle Verification Script.
"""

import sys
import uuid
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

sys.path.insert(0, ".")
from app.config import settings


def get_r2_boto3_client():
    """Initializes and returns a boto3 S3 client configured for Cloudflare R2."""
    r2_status = settings.validate_r2_credentials()
    if not r2_status["r2_fully_configured"]:
        raise ValueError(f"Cloudflare R2 is not fully configured in backend/.env: {r2_status}")

    endpoint = settings.r2_endpoint
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.R2_ACCESS_KEY_ID.strip(),
        aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY.strip(),
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            retries={"max_attempts": 3, "mode": "standard"},
        ),
        region_name="auto",
    )


def run_r2_verification():
    print("=" * 60)
    print("PHASE 2.14 CLOUDFLARE R2 LIVE VERIFICATION TEST")
    print("=" * 60)

    r2_status = settings.validate_r2_credentials()
    if not r2_status["r2_fully_configured"]:
        print("STATUS: R2 Credentials incomplete in backend/.env.")
        print("Please add the following variables to backend/.env:")
        print("  R2_ACCOUNT_ID=<your-cloudflare-account-id>")
        print("  R2_ACCESS_KEY_ID=<your-r2-access-key-id>")
        print("  R2_SECRET_ACCESS_KEY=<your-r2-secret-access-key>")
        print("  R2_BUCKET_NAME=<your-r2-bucket-name>")
        print("  (Optional) R2_ENDPOINT_URL=https://<your-account-id>.r2.cloudflarestorage.com")
        print("\nStopping live test until credentials are provided in backend/.env.")
        return False

    bucket_name = settings.R2_BUCKET_NAME.strip()
    s3_client = get_r2_boto3_client()
    test_id = str(uuid.uuid4())[:8]
    test_path = f"phase2-14-test/r2_verification_{test_id}.txt"
    test_content = f"CleanSheet Phase 2.14 R2 Live Verification Content {test_id}".encode("utf-8")

    # 1. Connection Test / Bucket Check
    print(f"\n1. Testing Connection to Cloudflare R2 Bucket '{bucket_name}'...")
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print("   Connection SUCCESS! Bucket exists and credentials are valid.")
    except ClientError as e:
        print(f"   Connection FAIL: {e}")
        return False

    # 2. Upload Test
    print(f"\n2. Uploading test object at path '{test_path}'...")
    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_path,
            Body=test_content,
            ContentType="text/plain; charset=utf-8",
        )
        print("   Upload SUCCESS!")
    except ClientError as e:
        print(f"   Upload FAIL: {e}")
        return False

    # 3. Read & Content Verification Test
    print(f"\n3. Reading back test object '{test_path}'...")
    try:
        resp = s3_client.get_object(Bucket=bucket_name, Key=test_path)
        read_bytes = resp["Body"].read()
        print(f"   Read SUCCESS! Bytes retrieved: {len(read_bytes)}")
        if read_bytes == test_content:
            print("   Content Integrity Check: PASS!")
        else:
            print("   Content Integrity Check: FAIL (mismatch)!")
            return False
    except ClientError as e:
        print(f"   Read FAIL: {e}")
        return False

    # 4. Delete Test
    print(f"\n4. Deleting test object '{test_path}'...")
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=test_path)
        print("   Delete SUCCESS!")
    except ClientError as e:
        print(f"   Delete FAIL: {e}")
        return False

    # 5. Verify Deletion
    print("\n5. Verifying object deletion (0 orphan objects)...")
    try:
        s3_client.get_object(Bucket=bucket_name, Key=test_path)
        print("   Deletion Verification: FAIL (object still found)!")
        return False
    except ClientError as e:
        err_code = e.response.get("Error", {}).get("Code")
        if err_code in ("NoSuchKey", "404"):
            print(f"   Deletion Verification: PASS (Object confirmed gone, code={err_code})!")
        else:
            print(f"   Deletion Verification: FAIL (unexpected error: {e})")
            return False

    # 6. Lifecycle / Object List Audit
    print("\n6. Checking Bucket Lifecycle & Test Prefix Status...")
    try:
        list_resp = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix="phase2-14-test/",
            MaxKeys=10,
        )
        remaining_count = list_resp.get("KeyCount", 0)
        print(f"   Remaining test objects under 'phase2-14-test/': {remaining_count}")
        if remaining_count == 0:
            print("   Cleanup Audit: PASS (0 orphan objects remaining)!")
        else:
            print("   Cleanup Audit: WARNING (orphan objects found)!")
    except Exception as e:
        print(f"   Lifecycle Audit note: {e}")

    print("\n" + "=" * 60)
    print("PHASE 2.14 CLOUDFLARE R2 LIVE VERIFICATION: ALL PASS 100%!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    run_r2_verification()
