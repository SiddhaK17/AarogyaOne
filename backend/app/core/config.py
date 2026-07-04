"""
AarogyaOne Backend — Centralised Application Settings
======================================================
Uses pydantic-settings to load and validate all environment variables
from the .env file at startup. A single `settings` singleton is imported
across all modules, keeping configuration in one place.
"""

from __future__ import annotations

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
    app_name: str = "AarogyaOne"
    app_version: str = "1.0.0"
    debug: bool = False

    # ---- CORS ----
    # Comma-separated list of allowed origins, e.g. "http://localhost:3000,https://app.example.com"
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:3003,http://127.0.0.1:3003,http://localhost:3004,http://127.0.0.1:3004,http://localhost:3005,http://127.0.0.1:3005"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    # ---- Supabase ----
    database_url: str = "sqlite:///./aarogyaone.db"  # overridden by .env in production
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""

    # ---- Supabase Storage Bucket Names ----
    supabase_bucket_complaint_media: str = "complaint-media"
    supabase_bucket_infra_photos: str = "infrastructure-photos"
    supabase_bucket_completion_evidence: str = "completion-evidence"
    supabase_bucket_reports: str = "reports"

    # ---- Firebase Admin ----
    firebase_project_id: str = "aarogyaone"
    firebase_admin_credentials_path: str = "./firebase-adminsdk.json"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings singleton. Import this everywhere."""
    return Settings()


# Convenience singleton — import this in all modules
settings = get_settings()
