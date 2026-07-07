"""
AarogyaOne Backend — Authentication Router
============================================
Endpoints:
  POST /api/auth/register   — Link a Firebase user to a platform role
  POST /api/auth/me         — Get current user's platform profile
  PUT  /api/auth/me         — Update display name / contact info
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.security import (
    AuthenticatedUser,
    get_current_user,
    set_user_custom_claims,
)
from app.database.connection import get_db
from app.database import models

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    firebase_uid: str
    email: str
    full_name: str
    role: str
    # Hospital staff: must provide their hospital_id
    hospital_id: Optional[int] = None
    # DHIC staff: must provide their district
    district: Optional[str] = None
    # Government staff: must provide their department
    department: Optional[str] = None


class UserProfileResponse(BaseModel):
    firebase_uid: str
    email: str
    full_name: str
    role: str
    hospital_id: Optional[int] = None
    district: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    sms_alerts: bool = True
    whatsapp_alerts: bool = True
    email_alerts: bool = False
    aadhaar_verified: bool = False
    is_active: bool

    model_config = {"from_attributes": True}


class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    language: Optional[str] = None
    sms_alerts: Optional[bool] = None
    whatsapp_alerts: Optional[bool] = None
    email_alerts: Optional[bool] = None
    aadhaar_verified: Optional[bool] = None


# ---------------------------------------------------------------------------
# Allowed roles (validated on registration)
# ---------------------------------------------------------------------------

VALID_ROLES = {
    "medical_superintendent",
    "hospital_administrator",
    "pharmacist",
    "nurse_supervisor",
    "medical_officer",
    "inventory_manager",
    "district_health_officer",
    "chief_medical_officer",
    "surveillance_officer",
    "engineer",
    "supplier",
    "citizen",
}

HOSPITAL_ROLES = {
    "medical_superintendent", "hospital_administrator", "pharmacist",
    "nurse_supervisor", "medical_officer", "inventory_manager",
}

DHIC_ROLES = {
    "district_health_officer", "chief_medical_officer", "surveillance_officer",
}

GOVERNMENT_ROLES = {"engineer", "supplier"}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Links the authenticated Firebase user to a platform role.
    Must be called once after the user's first Firebase sign-in.
    Sets Firebase custom claims so every subsequent token carries role/hospital_id.
    """
    # Validate role
    if body.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid role '{body.role}'. Valid roles: {sorted(VALID_ROLES)}",
        )

    # Contextual validation
    if body.role in HOSPITAL_ROLES and body.hospital_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Hospital staff must provide a hospital_id.",
        )
    if body.role in DHIC_ROLES and not body.district:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="DHIC staff must provide a district.",
        )
    if body.role in GOVERNMENT_ROLES and not body.department:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Government staff must provide a department.",
        )

    # Check for duplicate registration
    existing = db.query(models.User).filter(
        models.User.firebase_uid == body.firebase_uid
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already registered. Use PUT /api/auth/me to update.",
        )

    # Validate hospital exists if provided
    if body.hospital_id:
        hospital = db.query(models.Hospital).filter(
            models.Hospital.id == body.hospital_id,
            models.Hospital.status == "Active",
        ).first()
        if not hospital:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No active hospital found with id={body.hospital_id}.",
            )

    # Persist user profile in database
    user = models.User(
        firebase_uid=body.firebase_uid,
        email=body.email,
        full_name=body.full_name,
        role=body.role,
        hospital_id=body.hospital_id,
        district=body.district,
        department=body.department,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Set Firebase custom claims — embedded in all future ID tokens
    set_user_custom_claims(
        uid=body.firebase_uid,
        role=body.role,
        hospital_id=body.hospital_id,
        district=body.district,
        department=body.department,
    )

    return user


@router.post("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the authenticated user's platform profile."""
    user = db.query(models.User).filter(
        models.User.firebase_uid == current_user.uid
    ).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Please call POST /api/auth/register first.",
        )
    return user


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    body: UpdateProfileRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates the authenticated user's display name."""
    user = db.query(models.User).filter(
        models.User.firebase_uid == current_user.uid
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")

    if body.full_name is not None:
        user.full_name = body.full_name
    if body.location is not None:
        user.location = body.location
    if body.phone is not None:
        user.phone = body.phone
    if body.language is not None:
        user.language = body.language
    if body.sms_alerts is not None:
        user.sms_alerts = body.sms_alerts
    if body.whatsapp_alerts is not None:
        user.whatsapp_alerts = body.whatsapp_alerts
    if body.email_alerts is not None:
        user.email_alerts = body.email_alerts
    if body.aadhaar_verified is not None:
        user.aadhaar_verified = body.aadhaar_verified

    db.commit()
    db.refresh(user)
    return user
