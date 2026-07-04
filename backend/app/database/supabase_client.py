"""
AarogyaOne Backend — Supabase Storage & Realtime Utilities
============================================================
Provides helper functions for:
  - Uploading files to Supabase Storage buckets
  - Generating signed download URLs for private files
  - Ensuring required buckets exist on first run
  - Supabase Realtime channel references (for documentation / server-side triggers)
"""

from __future__ import annotations

import mimetypes
import os
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.database.connection import get_supabase


# ---------------------------------------------------------------------------
# Bucket configuration
# ---------------------------------------------------------------------------

BUCKETS = {
    "complaint_media":       settings.supabase_bucket_complaint_media,
    "infra_photos":          settings.supabase_bucket_infra_photos,
    "completion_evidence":   settings.supabase_bucket_completion_evidence,
    "reports":               settings.supabase_bucket_reports,
}


def ensure_buckets_exist() -> None:
    """
    Called at application startup. Creates any Supabase Storage buckets
    that do not yet exist. Buckets are created as private by default
    (public=False) — URLs are generated via signed tokens.

    Exception: 'complaint-media' is semi-public to allow anonymous citizens
    to access their own upload previews via time-limited signed URLs.
    """
    client = get_supabase()
    existing = {b.name for b in client.storage.list_buckets()}

    for key, bucket_name in BUCKETS.items():
        if bucket_name not in existing:
            try:
                client.storage.create_bucket(
                    bucket_name,
                    options={"public": False, "file_size_limit": 52428800}  # 50 MB max
                )
            except Exception as exc:
                # Log but don't crash — bucket may have been created by another replica
                print(f"[storage] Could not create bucket '{bucket_name}': {exc}")


# ---------------------------------------------------------------------------
# Upload helpers
# ---------------------------------------------------------------------------

def upload_file_bytes(
    bucket_key: str,
    destination_path: str,
    file_bytes: bytes,
    content_type: Optional[str] = None,
) -> str:
    """
    Uploads raw bytes to a Supabase Storage bucket.

    Args:
        bucket_key:       Key from BUCKETS dict, e.g. "complaint_media"
        destination_path: Path inside the bucket, e.g. "complaints/2026/photo.jpg"
        file_bytes:       Raw file content
        content_type:     MIME type, e.g. "image/jpeg". Auto-detected if None.

    Returns:
        The storage path (use `get_signed_url` to produce a download URL).

    Raises:
        ValueError: If bucket_key is not recognised.
        RuntimeError: If the upload fails.
    """
    if bucket_key not in BUCKETS:
        raise ValueError(f"Unknown bucket key '{bucket_key}'. Valid keys: {list(BUCKETS)}")

    bucket_name = BUCKETS[bucket_key]

    if content_type is None:
        guessed, _ = mimetypes.guess_type(destination_path)
        content_type = guessed or "application/octet-stream"

    client = get_supabase()
    response = client.storage.from_(bucket_name).upload(
        path=destination_path,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )

    # supabase-py raises on error; if we reach here, upload succeeded
    return destination_path


def upload_file_from_path(bucket_key: str, destination_path: str, local_path: str) -> str:
    """Upload a local file from disk to Supabase Storage."""
    with open(local_path, "rb") as f:
        file_bytes = f.read()
    content_type, _ = mimetypes.guess_type(local_path)
    return upload_file_bytes(bucket_key, destination_path, file_bytes, content_type)


# ---------------------------------------------------------------------------
# URL generation helpers
# ---------------------------------------------------------------------------

def get_signed_url(bucket_key: str, storage_path: str, expires_in: int = 3600) -> str:
    """
    Generates a time-limited signed URL for a private file.

    Args:
        bucket_key:    Key from BUCKETS dict
        storage_path:  Path inside the bucket (as returned by upload_file_bytes)
        expires_in:    Seconds until expiry (default: 1 hour)

    Returns:
        A signed HTTPS URL valid for `expires_in` seconds.
    """
    bucket_name = BUCKETS[bucket_key]
    client = get_supabase()
    result = client.storage.from_(bucket_name).create_signed_url(
        path=storage_path,
        expires_in=expires_in,
    )
    return result["signedURL"]


def get_public_url(bucket_key: str, storage_path: str) -> str:
    """
    Returns the public URL for a file in a public bucket.
    Only use this for buckets that have been set to public.
    """
    bucket_name = BUCKETS[bucket_key]
    client = get_supabase()
    result = client.storage.from_(bucket_name).get_public_url(storage_path)
    return result


def delete_file(bucket_key: str, storage_path: str) -> None:
    """Deletes a file from Supabase Storage."""
    bucket_name = BUCKETS[bucket_key]
    client = get_supabase()
    client.storage.from_(bucket_name).remove([storage_path])


# ---------------------------------------------------------------------------
# Realtime channel reference names
# ---------------------------------------------------------------------------
# These string constants are used by the Next.js frontend to subscribe
# to the correct Supabase Realtime channels. Keep in sync with frontend api.ts.

REALTIME_CHANNELS = {
    "inventory_changes":     "public:inventory",
    "bed_occupancy_changes": "public:bed_occupancy",
    "new_complaints":        "public:citizen_complaints",
    "task_updates":          "public:government_tasks",
    "new_notifications":     "public:notifications",
}
