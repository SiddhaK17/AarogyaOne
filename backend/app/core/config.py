"""
AarogyaOne Backend — Centralised Application Settings
======================================================
Uses pydantic-settings to load and validate all environment variables
from the .env file at startup. A single `settings` singleton is imported
across all modules, keeping configuration in one place.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import List

from pydantic import AnyUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- Application ----
    app_name: str = os.environ.get("APP_NAME") or "AarogyaOne"
    app_version: str = os.environ.get("APP_VERSION") or "1.0.0"
    debug: bool = os.environ.get("DEBUG", "False").lower() in ("true", "1", "yes")

    # ---- CORS ----
    # Comma-separated list of allowed origins, e.g. "http://localhost:3000,https://app.example.com"
    allowed_origins: str = os.environ.get("ALLOWED_ORIGINS") or "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004,http://localhost:3005,http://127.0.0.1:3005"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ---- Supabase ----
    database_url: str = os.environ.get("DATABASE_URL") or "sqlite:///./aarogyaone.db"
    supabase_url: str = os.environ.get("SUPABASE_URL") or ""
    supabase_service_role_key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    supabase_anon_key: str = os.environ.get("SUPABASE_ANON_KEY") or ""

    # ---- Supabase Storage Bucket Names ----
    supabase_bucket_complaint_media: str = os.environ.get("SUPABASE_BUCKET_COMPLAINT_MEDIA") or "complaint-media"
    supabase_bucket_infra_photos: str = os.environ.get("SUPABASE_BUCKET_INFRA_PHOTOS") or "infrastructure-photos"
    supabase_bucket_completion_evidence: str = os.environ.get("SUPABASE_BUCKET_COMPLETION_EVIDENCE") or "completion-evidence"
    supabase_bucket_reports: str = os.environ.get("SUPABASE_BUCKET_REPORTS") or "reports"

    # ---- Firebase Admin ----
    firebase_project_id: str = os.environ.get("FIREBASE_PROJECT_ID") or "aarogyaone"
    firebase_admin_credentials_path: str = os.environ.get("FIREBASE_ADMIN_CREDENTIALS_PATH") or "./firebase-adminsdk.json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings singleton. Import this everywhere."""
    return Settings()


# Convenience singleton — import this in all modules
settings = get_settings()
