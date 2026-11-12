#!/usr/bin/env python3
"""
Cloudflare R2 Bulk Audio Uploader
Uploads 1,417 sound effects from categories/ to Cloudflare R2 bucket with multi-threading,
optimal caching headers (Cache-Control: immutable), and size-based deduplication.
"""

import os
import sys
import argparse
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

BASE_DIR = Path(__file__).resolve().parent
CATEGORIES_DIR = BASE_DIR / "categories"
ENV_FILE = BASE_DIR / ".env"

def load_env():
    """Load simple key-value pairs from .env file if it exists."""
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key not in os.environ:
                        os.environ[key] = val

load_env()

def build_r2_key(category: str, filename: str) -> str:
    """Build S3/R2 object key convention: sounds/{category}/{filename}."""
    return f"sounds/{category.strip().lower()}/{filename.strip()}"

def scan_local_files() -> list[dict]:
    """Scan categories/ folder and return metadata for all .mp3 files."""
    results = []
    if not CATEGORIES_DIR.exists():
        return results

    for cat_dir in sorted(CATEGORIES_DIR.iterdir()):
        if cat_dir.is_dir():
            category = cat_dir.name
            for mp3_file in sorted(cat_dir.glob("*.mp3")):
                if mp3_file.is_file() and mp3_file.stat().st_size > 0:
                    results.append({
                        "local_path": mp3_file,
                        "category": category,
                        "filename": mp3_file.name,
                        "size": mp3_file.stat().st_size,
                        "r2_key": build_r2_key(category, mp3_file.name)
                    })
    return results

def get_r2_client(endpoint_url: str, access_key: str, secret_key: str):
    """Initialize boto3 S3 client configured for Cloudflare R2."""
    config = Config(
        signature_version="s3v4",
        retries={"max_attempts": 5, "mode": "standard"}
    )
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=config,
        region_name="auto"
    )

def check_remote_file_exists(s3_client, bucket: str, key: str, expected_size: int) -> bool:
    """Check if the object already exists in R2 with matching size."""
    try:
        head = s3_client.head_object(Bucket=bucket, Key=key)
        return head.get("ContentLength") == expected_size
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "404":
            return False
        # If permission or other error, proceed to upload attempt
        return False

def upload_single_file(s3_client, bucket: str, item: dict, dry_run: bool = False) -> tuple[bool, str]:
    """Upload a single file to R2 with caching headers."""
    r2_key = item["r2_key"]
    local_path = item["local_path"]
    size = item["size"]

    if dry_run:
        return True, f"[DRY-RUN] {r2_key} ({size / 1024:.1f} KB)"

    # Check if already uploaded with matching size
    if check_remote_file_exists(s3_client, bucket, r2_key, size):
        return True, f"[EXISTS] {r2_key}"

    try:
        with open(local_path, "rb") as f:
            s3_client.put_object(
                Bucket=bucket,
                Key=r2_key,
                Body=f,
                ContentType="audio/mpeg",
                CacheControl="public, max-age=31536000, immutable"
            )
        return True, f"[UPLOADED] {r2_key} ({size / 1024:.1f} KB)"
    except Exception as e:
        return False, f"[FAILED] {r2_key}: {e}"

def run_uploader(args):
    print("=" * 70)
    print(" CLOUDFLARE R2 BULK AUDIO UPLOADER")
    print("=" * 70)

    endpoint_url = args.endpoint or os.environ.get("R2_ENDPOINT_URL")
    access_key = args.access_key or os.environ.get("R2_ACCESS_KEY_ID")
    secret_key = args.secret_key or os.environ.get("R2_SECRET_ACCESS_KEY")
    bucket = args.bucket or os.environ.get("R2_BUCKET_NAME", "sounds-storage")

    files = scan_local_files()
    total_files = len(files)
    total_size_mb = sum(f["size"] for f in files) / (1024 * 1024)

    print(f"[*] Found {total_files} audio files ({total_size_mb:.1f} MB) in categories/")
    print(f"[*] Target Bucket: {bucket}")
    print(f"[*] Workers: {args.concurrency}")
    print(f"[*] Dry Run: {args.dry_run}")

    if not files:
        print("[!] No files found to upload.")
        return

    if not args.dry_run:
        if not (endpoint_url and access_key and secret_key and bucket):
            print("[!] Error: Missing R2 credentials. Please set in .env or pass as arguments.")
            sys.exit(1)
        s3_client = get_r2_client(endpoint_url, access_key, secret_key)
    else:
        s3_client = None

    start_time = time.time()
    success_count = 0
    fail_count = 0

    print("\n[*] Starting sync...")
    with ThreadPoolExecutor(max_workers=args.concurrency) as executor:
        future_to_item = {
            executor.submit(upload_single_file, s3_client, bucket, item, args.dry_run): item
            for item in files
        }

        for idx, future in enumerate(as_completed(future_to_item), 1):
            success, msg = future.result()
            if success:
                success_count += 1
            else:
                fail_count += 1

            if idx % 50 == 0 or idx == total_files or not success:
                pct = (idx / total_files) * 100
                print(f"  [{idx}/{total_files} | {pct:.1f}%] {msg}")

    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"[✓] SYNC COMPLETED in {elapsed / 60:.1f} minutes ({elapsed:.1f}s)")
    print(f"[✓] Successful: {success_count}/{total_files}")
    if fail_count > 0:
        print(f"[!] Failures: {fail_count}")
    print("=" * 70)

def main():
    parser = argparse.ArgumentParser(description="Upload audio files to Cloudflare R2")
    parser.add_argument("--endpoint", type=str, help="Cloudflare R2 S3 Endpoint URL")
    parser.add_argument("--access-key", type=str, help="R2 Access Key ID")
    parser.add_argument("--secret-key", type=str, help="R2 Secret Access Key")
    parser.add_argument("--bucket", type=str, default="sounds-storage", help="R2 Bucket Name (default: sounds-storage)")
    parser.add_argument("--concurrency", type=int, default=8, help="Number of concurrent upload threads (default: 8)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate upload without transferring data")
    args = parser.parse_args()

    run_uploader(args)

if __name__ == "__main__":
    main()
