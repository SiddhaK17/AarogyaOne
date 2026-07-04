"""
AarogyaOne Backend — FastAPI Application Entry Point
=====================================================
Initialises the FastAPI app, registers all routers, configures
CORS and error handlers, and runs startup checks (DB tables + Supabase buckets).
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.database.connection import Base, engine

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("aarogyaone")

# ---------------------------------------------------------------------------
# Create database tables (idempotent: safe to call on every startup)
# ---------------------------------------------------------------------------

Base.metadata.create_all(bind=engine)

# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    description=(
        "AarogyaOne — AI-Powered Public Healthcare Intelligence & Resource Management Platform. "
        "Connects hospitals, district administration, government departments, and citizens "
        "in a unified operational ecosystem."
    ),
    version=settings.app_version,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS — allow the Next.js frontend to communicate with this API
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

# ---------------------------------------------------------------------------
# Startup event
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event():
    logger.info(f"🚀 {settings.app_name} v{settings.app_version} starting up…")

    # Ensure Supabase Storage buckets exist (creates them if missing)
    if settings.supabase_url and settings.supabase_service_role_key:
        try:
            from app.database.supabase_client import ensure_buckets_exist
            ensure_buckets_exist()
            logger.info("✅ Supabase Storage buckets verified.")
        except Exception as exc:
            logger.warning(f"⚠️  Supabase bucket check failed (non-fatal): {exc}")
    else:
        logger.warning("⚠️  Supabase credentials not configured. Storage features will be unavailable.")

    logger.info("✅ Database tables initialised.")
    logger.info(f"📖 API docs available at: /api/docs")

# ---------------------------------------------------------------------------
# Register routers
# ---------------------------------------------------------------------------

from app.api import auth, hospitals, citizens, dhic, government  # noqa: E402

app.include_router(auth.router)
app.include_router(hospitals.router)
app.include_router(citizens.router)
app.include_router(dhic.router)
app.include_router(government.router)

# ---------------------------------------------------------------------------
# Health check (no auth required)
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Public health check endpoint. Used by load balancers and deployment pipelines
    to confirm the API is running and the database connection is live.
    """
    from sqlalchemy import text
    from app.database.connection import SessionLocal

    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "error"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "app": settings.app_name,
        "version": settings.app_version,
        "database": db_status,
    }
