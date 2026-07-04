"""
AarogyaOne Backend — Security & Authentication
===============================================
Provides:
  - Firebase Admin SDK initialisation (verifies Firebase ID Tokens)
  - FastAPI dependency `get_current_user` — injects authenticated user into endpoints
  - FastAPI dependency `require_role(*roles)` — enforces Role-Based Access Control
  - Helper `get_hospital_id` — asserts the current user belongs to a hospital
"""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any, Dict, List, Optional

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings

# ---------------------------------------------------------------------------
# Firebase Admin SDK initialisation (runs once at import time)
# ---------------------------------------------------------------------------

def _init_firebase() -> None:
    """Initialise the Firebase Admin SDK if not already initialised."""
    if firebase_admin._apps:
        return  # Already initialised — idempotent

    creds_path = settings.firebase_admin_credentials_path
    if os.path.isfile(creds_path):
        cred = credentials.Certificate(creds_path)
    else:
        # Fallback: initialise with just the project ID for token verification
        # (works when running on Google Cloud with ADC, or for demo purposes)
        cred = credentials.ApplicationDefault()

    firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})


_init_firebase()

# ---------------------------------------------------------------------------
# HTTP Bearer scheme — FastAPI reads "Authorization: Bearer <token>"
# ---------------------------------------------------------------------------

_bearer_scheme = HTTPBearer(auto_error=False)

# ---------------------------------------------------------------------------
# User payload model
# ---------------------------------------------------------------------------

class AuthenticatedUser:
    """Lightweight container for the verified Firebase token claims."""

    def __init__(self, decoded_token: Dict[str, Any]) -> None:
        self.uid: str = decoded_token["uid"]
        self.email: str = decoded_token.get("email", "")
        # Custom claims set via Firebase Admin SDK on user creation / role assignment
        self.role: str = decoded_token.get("role", "citizen")
        self.hospital_id: Optional[int] = decoded_token.get("hospital_id")
        self.district: Optional[str] = decoded_token.get("district")
        self.department: Optional[str] = decoded_token.get("department")
        self.name: str = decoded_token.get("name", self.email)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User uid={self.uid} role={self.role}>"


# ---------------------------------------------------------------------------
# Core dependency: verify token and return AuthenticatedUser
# ---------------------------------------------------------------------------

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
) -> AuthenticatedUser:
    """
    FastAPI dependency.
    Extracts the Firebase ID Token from the Authorization header,
    verifies its signature against the Firebase project, and returns
    an AuthenticatedUser with the token claims.

    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. Include 'Authorization: Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token, check_revoked=True)
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(decoded)


# ---------------------------------------------------------------------------
# Optional dependency: allows unauthenticated access but enriches if token present
# ---------------------------------------------------------------------------

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
) -> Optional[AuthenticatedUser]:
    """
    FastAPI dependency for semi-public endpoints (e.g. complaint tracking).
    Returns an AuthenticatedUser if a valid token is provided, else None.
    """
    if credentials is None or not credentials.credentials:
        return None
    try:
        decoded = firebase_auth.verify_id_token(credentials.credentials, check_revoked=True)
        return AuthenticatedUser(decoded)
    except Exception:
        return None


# ---------------------------------------------------------------------------
# RBAC dependency factory
# ---------------------------------------------------------------------------

def require_role(*allowed_roles: str):
    """
    Dependency factory for Role-Based Access Control.

    Usage in a router:
        @router.get("/protected")
        async def endpoint(user = Depends(require_role("dho", "cmo"))):
            ...
    """
    async def _check_role(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {list(allowed_roles)}. "
                       f"Your role: '{user.role}'.",
            )
        return user

    return _check_role


# ---------------------------------------------------------------------------
# Convenience RBAC shorthand groups
# ---------------------------------------------------------------------------

# Any hospital portal user
HOSPITAL_ROLES = (
    "medical_superintendent",
    "hospital_administrator",
    "pharmacist",
    "nurse_supervisor",
    "medical_officer",
    "inventory_manager",
)

# District Health Intelligence Centre users
DHIC_ROLES = (
    "district_health_officer",
    "chief_medical_officer",
    "surveillance_officer",
)

# Government department users
GOVERNMENT_ROLES = (
    "engineer",
    "supplier",
)

require_hospital_role = require_role(*HOSPITAL_ROLES)
require_dhic_role = require_role(*DHIC_ROLES)
require_government_role = require_role(*GOVERNMENT_ROLES)


# ---------------------------------------------------------------------------
# Firebase Admin helper: set custom claims (called during user registration)
# ---------------------------------------------------------------------------

def set_user_custom_claims(
    uid: str,
    role: str,
    hospital_id: Optional[int] = None,
    district: Optional[str] = None,
    department: Optional[str] = None,
) -> None:
    """
    Sets Firebase custom claims on a user so that role/hospital_id/district
    are embedded in every subsequent ID token the user obtains.

    Should be called once during user registration, and again when
    a user's role changes.
    """
    claims: Dict[str, Any] = {"role": role}
    if hospital_id is not None:
        claims["hospital_id"] = hospital_id
    if district is not None:
        claims["district"] = district
    if department is not None:
        claims["department"] = department

    firebase_auth.set_custom_user_claims(uid, claims)
