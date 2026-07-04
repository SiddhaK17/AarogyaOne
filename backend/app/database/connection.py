"""
AarogyaOne Backend — Database Connection
=========================================
Sets up two connection mechanisms:

1. SQLAlchemy — used for ORM-based CRUD in all API routers.
   Connects to the Supabase-managed PostgreSQL via the Transaction Pooler URL.

2. Supabase Python Client — used for Storage (file uploads/downloads)
   and Realtime management operations. The service role client has full
   access and must NEVER be exposed to the frontend.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

# ---------------------------------------------------------------------------
# SQLAlchemy engine & session
# ---------------------------------------------------------------------------

_connect_args: dict = {}

# SQLite requires check_same_thread=False for use with FastAPI
if settings.database_url.startswith("sqlite"):
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    # Use a reasonable pool size for the Supabase Transaction Pooler
    pool_pre_ping=True,         # verify connections before using them
    pool_recycle=300,           # recycle connections every 5 minutes
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def get_db():
    """
    FastAPI dependency that yields a database session per request.
    The session is automatically closed after the request completes.

    Usage in a router:
        @router.get("/example")
        async def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Supabase Python client (service role — server-side only)
# ---------------------------------------------------------------------------

from supabase import create_client, Client as SupabaseClient

_supabase_client: SupabaseClient | None = None


def get_supabase() -> SupabaseClient:
    """
    Returns a cached Supabase client initialised with the service role key.
    This client bypasses Row-Level Security and must only be used server-side.
    """
    global _supabase_client
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env "
                "before using Supabase features."
            )
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
    return _supabase_client
