"""
AarogyaOne Backend — Citizen Portal Router
===========================================
Endpoints are intentionally semi-public:
  - Complaint submission and tracking: no login required
  - Media upload: Firebase auth required
  - Hospital search: public

Endpoints:
  POST /api/citizens/report            — Submit complaint
  POST /api/citizens/report/upload     — Upload media to Supabase Storage
  GET  /api/citizens/track/{ref}       — Track complaint by reference number
  GET  /api/citizens/hospitals         — Search hospitals
  GET  /api/citizens/hospitals/nearby  — Find hospitals by lat/lng
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from datetime import date, datetime
from math import asin, cos, radians, sin, sqrt
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_optional_user
from app.database.connection import get_db
from app.database import models
from app.database.supabase_client import upload_file_bytes, get_signed_url, BUCKETS
from app.core.config import settings
from app.services.complaint_service import ComplaintService
from app.core.dependencies import get_complaint_service

logger = logging.getLogger("aarogya.api.citizens")

router = APIRouter(prefix="/api/citizens", tags=["Citizen Portal"])


# ===========================================================================
# Pydantic Schemas
# ===========================================================================

class ComplaintCreateRequest(BaseModel):
    hospital_id: int
    category: str
    description: str
    date_of_visit: Optional[date] = None
    is_anonymous: bool = True
    contact_info: Optional[str] = None


class ComplaintSubmittedResponse(BaseModel):
    id: int
    reference_number: str
    hospital_name: str
    category: str
    status: str
    created_at: datetime


class TrackingEntry(BaseModel):
    status: str
    note: Optional[str]
    updated_by: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class ComplaintTrackingResponse(BaseModel):
    reference_number: str
    hospital_name: str
    category: str
    status: str
    ai_severity: Optional[str]
    ai_assigned_department: Optional[str]
    created_at: datetime
    tracking_history: List[TrackingEntry]


class MediaUploadResponse(BaseModel):
    media_id: int
    complaint_id: int
    media_type: str
    signed_url: str
    expires_in_seconds: int


class HospitalPublicResponse(BaseModel):
    id: int
    name: str
    facility_type: str
    district: str
    taluka: str
    address: str
    phone: str
    latitude: float
    longitude: float
    has_laboratory: bool
    has_ambulance: bool
    model_config = {"from_attributes": True}


class NearbyHospitalResponse(HospitalPublicResponse):
    distance_km: float


# ===========================================================================
# Helpers
# ===========================================================================

def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points on Earth in km."""
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return R * 2 * asin(sqrt(a))


def _generate_reference_number() -> str:
    return f"ARP-{uuid.uuid4().hex[:8].upper()}"


async def _run_complaint_ai(
    complaint_id: int,
    user_id: Optional[str]
):
    """
    Background task: Orchestrates the AI intelligence pipeline via ComplaintService.
    Safely creates a new database session instead of reusing the request session.
    """
    from app.database.connection import SessionLocal

    correlation_id = f"COMP-BG-{uuid.uuid4()}"
    log_ctx = {
        "operation": "_run_complaint_ai",
        "complaint_id": complaint_id,
        "user_id": user_id or "anonymous",
        "correlation_id": correlation_id
    }

    logger.info("Background Task started", extra=log_ctx)
    start_time = time.perf_counter()

    db = SessionLocal()
    try:
        complaint_service = get_complaint_service(db)
        await complaint_service.process_complaint_intelligence(str(complaint_id))
    except Exception as e:
        log_ctx["exception"] = str(e)
        logger.exception("AI processing failed", extra=log_ctx)
        try:
            await complaint_service.mark_ai_failed(str(complaint_id), str(e))
        except Exception as failover_e:
            log_ctx["failover_exception"] = str(failover_e)
            logger.exception("Failed to mark complaint as AI_FAILED during fallback", extra=log_ctx)
    finally:
        db.close()

    duration = round(time.perf_counter() - start_time, 3)
    log_ctx["execution_duration"] = duration
    logger.info("Background Task finished", extra=log_ctx)


# ===========================================================================
# Endpoints
# ===========================================================================

@router.post("/report", response_model=ComplaintSubmittedResponse, status_code=status.HTTP_201_CREATED)
async def submit_complaint(
    body: ComplaintCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db),
    complaint_service: ComplaintService = Depends(get_complaint_service),
):
    """
    Submit a citizen complaint. Authentication is optional — anonymous
    complaints are fully supported. If logged in, the Firebase UID is stored
    for future tracking without revealing identity in reports.
    """
    hospital = db.query(models.Hospital).filter(
        models.Hospital.id == body.hospital_id,
        models.Hospital.status == "Active",
    ).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active hospital found with id={body.hospital_id}.",
        )

    complaint = models.CitizenComplaint(
        reference_number=_generate_reference_number(),
        hospital_id=body.hospital_id,
        citizen_firebase_uid=current_user.uid if current_user else None,
        is_anonymous=body.is_anonymous,
        contact_info=body.contact_info,
        date_of_visit=body.date_of_visit,
        category=body.category,
        description=body.description,
        status="Received",
    )
    db.add(complaint)
    db.flush()  # get the id before commit

    # Initial tracking entry
    tracking = models.ComplaintTracking(
        complaint_id=complaint.id,
        status="Received",
        note="Complaint received successfully.",
        updated_by="AarogyaOne System",
    )
    db.add(tracking)
    db.commit()
    db.refresh(complaint)

    # Trigger async AI orchestration
    background_tasks.add_task(
        _run_complaint_ai, 
        complaint.id, 
        current_user.uid if current_user else None
    )

    return {
        "id": complaint.id,
        "reference_number": complaint.reference_number,
        "hospital_name": hospital.name,
        "category": complaint.category,
        "status": complaint.status,
        "created_at": complaint.created_at,
    }


@router.post("/report/upload", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_complaint_media(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: Optional[AuthenticatedUser] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """
    Upload a photo, audio recording, or video for an existing complaint.
    Files are stored in the Supabase 'complaint-media' bucket.
    Returns a time-limited signed URL (1 hour) for preview.

    Allowed types: image/*, audio/*, video/*
    Max size: 50 MB (enforced by Supabase bucket policy).
    """
    # Validate complaint exists
    complaint = db.query(models.CitizenComplaint).filter(
        models.CitizenComplaint.id == complaint_id
    ).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Determine media type
    content_type = file.content_type or "application/octet-stream"
    if content_type.startswith("image/"):
        media_type = "photo"
        bucket_key = "complaint_media"
    elif content_type.startswith("audio/"):
        media_type = "audio"
        bucket_key = "complaint_media"
    elif content_type.startswith("video/"):
        media_type = "video"
        bucket_key = "complaint_media"
    else:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only image, audio, and video files are accepted.",
        )

    # Build storage path
    ext = os.path.splitext(file.filename or "")[1] or ""
    storage_path = f"complaints/{complaint.id}/{media_type}_{uuid.uuid4().hex[:8]}{ext}"

    # Upload to Supabase
    file_bytes = await file.read()
    upload_file_bytes(bucket_key, storage_path, file_bytes, content_type)

    # Generate signed URL (1 hour)
    signed_url = get_signed_url(bucket_key, storage_path, expires_in=3600)

    # Persist media record
    media = models.ComplaintMedia(
        complaint_id=complaint.id,
        media_type=media_type,
        storage_bucket=settings.supabase_bucket_complaint_media,
        storage_path=storage_path,
        public_url=signed_url,
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    return {
        "media_id": media.id,
        "complaint_id": complaint.id,
        "media_type": media_type,
        "signed_url": signed_url,
        "expires_in_seconds": 3600,
    }


@router.get("/track/{reference_number}", response_model=ComplaintTrackingResponse)
async def track_complaint(
    reference_number: str,
    db: Session = Depends(get_db),
):
    """
    Public endpoint — no authentication required.
    Citizens use their reference number (e.g. ARP-A3F7B21C) to see
    the current status and full timeline of their complaint.
    """
    complaint = db.query(models.CitizenComplaint).filter(
        models.CitizenComplaint.reference_number == reference_number.upper()
    ).first()
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No complaint found with reference '{reference_number}'.",
        )

    metadata = complaint.ai_metadata or {}
    
    # Extract telemetry explicitly from the WorkflowResult payload
    speech_result = metadata.get("speech_result") or {}
    vision_result = metadata.get("vision_result") or {}
    priority_result = metadata.get("priority_result") or {}

    return {
        "reference_number": complaint.reference_number,
        "hospital_name": complaint.hospital.name,
        "category": complaint.category,
        "status": complaint.status,
        "ai_severity": complaint.ai_severity,
        "ai_assigned_department": complaint.ai_assigned_department,
        "ai_confidence": complaint.ai_confidence,
        "ai_sentiment": complaint.ai_sentiment,
        "ai_transcript": speech_result.get("transcript"),
        "ai_ocr_text": vision_result.get("ocr_text"),
        "ai_reasoning": priority_result.get("reasoning"),
        "created_at": complaint.created_at,
        "tracking_history": complaint.tracking,
    }


@router.get("/hospitals", response_model=List[HospitalPublicResponse])
async def search_hospitals(
    name: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    taluka: Optional[str] = Query(None),
    facility_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Public search — returns basic public information about hospitals.
    Operational metrics (inventory, beds) are never exposed here.
    """
    q = db.query(models.Hospital).filter(models.Hospital.status == "Active")

    if name:
        q = q.filter(models.Hospital.name.ilike(f"%{name}%"))
    if district:
        q = q.filter(models.Hospital.district.ilike(f"%{district}%"))
    if taluka:
        q = q.filter(models.Hospital.taluka.ilike(f"%{taluka}%"))
    if facility_type:
        q = q.filter(models.Hospital.facility_type == facility_type)

    return q.limit(50).all()


@router.get("/hospitals/nearby", response_model=List[NearbyHospitalResponse])
async def find_nearby_hospitals(
    lat: float = Query(..., description="User's latitude"),
    lng: float = Query(..., description="User's longitude"),
    radius_km: float = Query(default=25.0, le=100.0),
    db: Session = Depends(get_db),
):
    """
    Returns active hospitals within `radius_km` kilometres of the user's location,
    sorted by distance ascending. Uses Haversine formula for in-memory filtering.
    """
    hospitals = db.query(models.Hospital).filter(models.Hospital.status == "Active").all()

    nearby = []
    for h in hospitals:
        dist = _haversine_km(lat, lng, h.latitude, h.longitude)
        if dist <= radius_km:
            nearby.append({**{c: getattr(h, c) for c in h.__table__.columns.keys()},
                           "distance_km": round(dist, 2)})

    nearby.sort(key=lambda x: x["distance_km"])
    return nearby
