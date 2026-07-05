"""
AarogyaOne Backend — Hospital Portal Router
============================================
All endpoints require an authenticated Hospital Portal user.
Each user's `hospital_id` is extracted from their Firebase token claims
so they can only ever access their own hospital's data.

Endpoints:
  GET  /api/hospitals/dashboard
  GET  /api/hospitals/profile
  PUT  /api/hospitals/profile
  GET  /api/hospitals/inventory
  POST /api/hospitals/inventory
  PUT  /api/hospitals/inventory/{item_id}
  GET  /api/hospitals/beds
  PUT  /api/hospitals/beds/{bed_id}
  GET  /api/hospitals/staff
  POST /api/hospitals/staff
  GET  /api/hospitals/statistics
  POST /api/hospitals/statistics
  GET  /api/hospitals/issues
  POST /api/hospitals/issues
  GET  /api/hospitals/transfers
  POST /api/hospitals/transfers/request
  PUT  /api/hospitals/transfers/{transfer_id}
  GET  /api/hospitals/notifications
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.security import (
    AuthenticatedUser,
    require_hospital_role,
    require_role,
)
from app.database.connection import get_db, SessionLocal
from app.database import models
from app.core.dependencies import get_hospital_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hospitals", tags=["Hospital Portal"])


# ---------------------------------------------------------------------------
# Shared guard: extract & validate hospital_id from token claims
# ---------------------------------------------------------------------------

def _get_hospital(user: AuthenticatedUser, db: Session) -> models.Hospital:
    """Ensures the caller has a valid, active hospital assignment."""
    if not user.hospital_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not linked to a hospital.",
        )
    hospital = db.query(models.Hospital).filter(
        models.Hospital.id == user.hospital_id,
        models.Hospital.status == "Active",
    ).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found or not yet activated.",
        )
    return hospital


# ===========================================================================
# Pydantic Schemas
# ===========================================================================

class HospitalProfileResponse(BaseModel):
    id: int
    name: str
    registration_no: str
    facility_type: str
    district: str
    taluka: str
    address: str
    latitude: float
    longitude: float
    phone: str
    email: str
    total_beds: int
    icu_capacity: int
    has_laboratory: bool
    has_ambulance: bool
    status: str
    health_score: float
    model_config = {"from_attributes": True}


class HospitalProfileUpdateRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    has_laboratory: Optional[bool] = None
    has_ambulance: Optional[bool] = None


class InventoryItemResponse(BaseModel):
    id: int
    item_id: int
    item_name: str
    category: str
    unit: str
    current_quantity: int
    min_threshold: int
    max_capacity: int
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    predicted_stockout_days: Optional[float] = None
    recommended_restock_qty: Optional[int] = None
    last_updated: Optional[datetime] = None
    model_config = {"from_attributes": True}


class InventoryCreateRequest(BaseModel):
    item_id: int
    current_quantity: int
    min_threshold: int = 50
    max_capacity: int = 500
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None


class InventoryUpdateRequest(BaseModel):
    current_quantity: Optional[int] = None
    min_threshold: Optional[int] = None
    max_capacity: Optional[int] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None


class BedOccupancyResponse(BaseModel):
    id: int
    category: str
    total_capacity: int
    occupied_count: int
    reserved_count: int
    available_count: int
    occupancy_percent: float
    predicted_occupancy_tomorrow: Optional[float] = None
    last_updated: Optional[datetime] = None
    model_config = {"from_attributes": True}


class BedUpdateRequest(BaseModel):
    total_capacity: Optional[int] = None
    occupied_count: Optional[int] = None
    reserved_count: Optional[int] = None


class StaffAttendanceResponse(BaseModel):
    id: int
    employee_name: str
    employee_id: Optional[str]
    designation: str
    department: str
    shift: str
    status: str
    check_in_time: Optional[datetime]
    date: date
    model_config = {"from_attributes": True}


class StaffAttendanceCreateRequest(BaseModel):
    employee_name: str
    employee_id: Optional[str] = None
    designation: str
    department: str
    shift: str
    status: str  # Present / Absent / On Leave
    check_in_time: Optional[datetime] = None
    date: Optional[date] = None


class PatientStatsResponse(BaseModel):
    id: int
    opd_count: int
    ipd_count: int
    emergency_admissions: int
    discharges: int
    referrals_out: int
    critical_cases: int
    ambulance_arrivals: int
    avg_wait_time_minutes: int
    date: date
    model_config = {"from_attributes": True}


class PatientStatsCreateRequest(BaseModel):
    opd_count: int = 0
    ipd_count: int = 0
    emergency_admissions: int = 0
    discharges: int = 0
    referrals_out: int = 0
    critical_cases: int = 0
    ambulance_arrivals: int = 0
    avg_wait_time_minutes: int = 30
    date: Optional[date] = None


class IssueResponse(BaseModel):
    id: int
    title: str
    description: str
    issue_type: str
    department: str
    priority: str
    status: str
    photo_url: Optional[str]
    voice_note_url: Optional[str]
    reporter_name: str
    ai_category: Optional[str]
    ai_severity: Optional[str]
    ai_assigned_department: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class IssueCreateRequest(BaseModel):
    title: str
    description: str
    issue_type: str
    department: str
    priority: str = "Medium"
    reporter_name: str
    photo_url: Optional[str] = None
    voice_note_url: Optional[str] = None


class TransferResponse(BaseModel):
    id: int
    item_id: int
    item_name: str
    quantity: int
    from_hospital_id: int
    from_hospital_name: str
    to_hospital_id: int
    to_hospital_name: str
    status: str
    distance_km: Optional[float]
    eta_minutes: Optional[int]
    ai_recommended: bool
    ai_reasoning: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class TransferRequestBody(BaseModel):
    item_id: int
    quantity: int
    from_hospital_id: int  # source hospital suggested by AI or chosen by staff


class TransferStatusUpdate(BaseModel):
    status: str  # Approved / Declined / In Transit / Completed


class NotificationResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    category: Optional[str]
    action_url: Optional[str]
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class DashboardSummaryResponse(BaseModel):
    hospital: HospitalProfileResponse
    inventory_summary: dict
    bed_summary: dict
    staff_summary: dict
    recent_notifications: List[NotificationResponse]
    open_issues_count: int
    pending_transfers_count: int


# ===========================================================================
# Helper: background task stubs (called after data mutations)
# ===========================================================================

async def _run_hospital_ai_inventory(hospital_id: int, item_id: int, current_quantity: int):
    """Background task: Re-run demand forecasting after an inventory change."""
    db = SessionLocal()
    try:
        service = get_hospital_service(db)
        await service.update_and_forecast_inventory(str(hospital_id), str(item_id), current_quantity)
        db.commit()
    except Exception as e:
        logger.exception(
            "Background task failed",
            extra={
                "operation": "_run_hospital_ai_inventory",
                "hospital_id": hospital_id,
                "exception": str(e)
            }
        )
        try:
            db.rollback()
        except Exception as rollback_e:
            logger.exception(
                "Background task rollback failed",
                extra={
                    "operation": "_run_hospital_ai_inventory_rollback",
                    "hospital_id": hospital_id,
                    "rollback_exception": str(rollback_e)
                }
            )
    finally:
        db.close()

async def _run_hospital_ai_beds(hospital_id: int, category: str, occupied_count: int):
    """Background task: Forecast bed capacity."""
    db = SessionLocal()
    try:
        service = get_hospital_service(db)
        await service.update_and_forecast_beds(str(hospital_id), category, occupied_count)
        db.commit()
    except Exception as e:
        logger.exception(
            "Background task failed",
            extra={
                "operation": "_run_hospital_ai_beds",
                "hospital_id": hospital_id,
                "exception": str(e)
            }
        )
        try:
            db.rollback()
        except Exception as rollback_e:
            logger.exception(
                "Background task rollback failed",
                extra={
                    "operation": "_run_hospital_ai_beds_rollback",
                    "hospital_id": hospital_id,
                    "rollback_exception": str(rollback_e)
                }
            )
    finally:
        db.close()

async def _run_hospital_ai_scoring(hospital_id: int):
    """Background task: Recalculate the hospital's AI health score."""
    db = SessionLocal()
    try:
        service = get_hospital_service(db)
        await service.calculate_hospital_scoring(str(hospital_id))
        db.commit()
    except Exception as e:
        logger.exception(
            "Background task failed",
            extra={
                "operation": "_run_hospital_ai_scoring",
                "hospital_id": hospital_id,
                "exception": str(e)
            }
        )
        try:
            db.rollback()
        except Exception as rollback_e:
            logger.exception(
                "Background task rollback failed",
                extra={
                    "operation": "_run_hospital_ai_scoring_rollback",
                    "hospital_id": hospital_id,
                    "rollback_exception": str(rollback_e)
                }
            )
    finally:
        db.close()

async def _run_hospital_ai_issue(hospital_id: int, category: str, priority: str, dept: str):
    """Background task: Orchestrate critical incident workflow for high-priority issues."""
    if priority not in ["High", "Critical"]:
        return
        
    db = SessionLocal()
    try:
        service = get_hospital_service(db)
        priority_score = 95 if priority == "Critical" else 80
        await service.process_critical_incident(str(hospital_id), category, priority_score, dept)
        db.commit()
    except Exception as e:
        logger.exception(
            "Background task failed",
            extra={
                "operation": "_run_hospital_ai_issue",
                "hospital_id": hospital_id,
                "exception": str(e)
            }
        )
        try:
            db.rollback()
        except Exception as rollback_e:
            logger.exception(
                "Background task rollback failed",
                extra={
                    "operation": "_run_hospital_ai_issue_rollback",
                    "hospital_id": hospital_id,
                    "rollback_exception": str(rollback_e)
                }
            )
    finally:
        db.close()


# ===========================================================================
# Endpoints
# ===========================================================================

# ---- Dashboard ----

@router.get("/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard(
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)

    # Inventory summary: total items, items below threshold
    inventories = db.query(models.Inventory).filter(
        models.Inventory.hospital_id == hospital.id
    ).all()
    low_stock = [i for i in inventories if i.current_quantity <= i.min_threshold]
    critical_stock = [i for i in inventories if i.current_quantity == 0]

    # Bed summary: available beds across all categories
    beds = db.query(models.BedOccupancy).filter(
        models.BedOccupancy.hospital_id == hospital.id
    ).all()
    total_beds = sum(b.total_capacity for b in beds)
    occupied_beds = sum(b.occupied_count for b in beds)

    # Staff summary: today's attendance
    today = date.today()
    staff_today = db.query(models.StaffAttendance).filter(
        models.StaffAttendance.hospital_id == hospital.id,
        models.StaffAttendance.date == today,
    ).all()
    present_count = sum(1 for s in staff_today if s.status == "Present")

    # Notifications (last 10)
    notifications = (
        db.query(models.Notification)
        .filter(
            models.Notification.recipient_role == "hospital",
            models.Notification.recipient_id == str(hospital.id),
        )
        .order_by(desc(models.Notification.created_at))
        .limit(10)
        .all()
    )

    open_issues = db.query(models.InfrastructureIssue).filter(
        models.InfrastructureIssue.hospital_id == hospital.id,
        models.InfrastructureIssue.status != "Resolved",
    ).count()

    pending_transfers = db.query(models.ResourceTransfer).filter(
        (models.ResourceTransfer.to_hospital_id == hospital.id) |
        (models.ResourceTransfer.from_hospital_id == hospital.id),
        models.ResourceTransfer.status == "Pending",
    ).count()

    return {
        "hospital": hospital,
        "inventory_summary": {
            "total_items": len(inventories),
            "low_stock_count": len(low_stock),
            "critical_stock_count": len(critical_stock),
            "low_stock_items": [i.item.name for i in low_stock[:5]],
        },
        "bed_summary": {
            "total_capacity": total_beds,
            "occupied": occupied_beds,
            "available": total_beds - occupied_beds,
            "occupancy_percent": round((occupied_beds / total_beds * 100) if total_beds else 0, 1),
        },
        "staff_summary": {
            "total_logged_today": len(staff_today),
            "present": present_count,
            "absent": len(staff_today) - present_count,
        },
        "recent_notifications": notifications,
        "open_issues_count": open_issues,
        "pending_transfers_count": pending_transfers,
    }


# ---- Hospital Profile ----

@router.get("/profile", response_model=HospitalProfileResponse)
async def get_hospital_profile(
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    return _get_hospital(user, db)


@router.put("/profile", response_model=HospitalProfileResponse)
async def update_hospital_profile(
    body: HospitalProfileUpdateRequest,
    user: AuthenticatedUser = Depends(require_role("medical_superintendent", "hospital_administrator")),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(hospital, field, value)
    db.commit()
    db.refresh(hospital)
    return hospital


# ---- Inventory ----

@router.get("/inventory", response_model=List[InventoryItemResponse])
async def get_inventory(
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    rows = db.query(models.Inventory).filter(
        models.Inventory.hospital_id == hospital.id
    ).all()
    result = []
    for r in rows:
        result.append({
            **{c: getattr(r, c) for c in r.__table__.columns.keys()},
            "item_name": r.item.name,
            "category": r.item.category,
            "unit": r.item.unit,
        })
    return result


@router.post("/inventory", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
async def add_inventory_item(
    body: InventoryCreateRequest,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(require_role("pharmacist", "inventory_manager", "medical_superintendent", "hospital_administrator")),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)

    # Check item exists
    item = db.query(models.Item).filter(models.Item.id == body.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")

    # Check for duplicate (hospital already tracks this item)
    existing = db.query(models.Inventory).filter(
        models.Inventory.hospital_id == hospital.id,
        models.Inventory.item_id == body.item_id,
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This item is already tracked. Use PUT to update.")

    inv = models.Inventory(
        hospital_id=hospital.id,
        updated_by_uid=user.uid,
        **body.model_dump(),
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)

    background_tasks.add_task(_run_hospital_ai_inventory, hospital.id, body.item_id, body.current_quantity)
    return {**{c: getattr(inv, c) for c in inv.__table__.columns.keys()},
            "item_name": item.name, "category": item.category, "unit": item.unit}


@router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(
    item_id: int,
    body: InventoryUpdateRequest,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(require_role("pharmacist", "inventory_manager", "medical_superintendent", "hospital_administrator")),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    inv = db.query(models.Inventory).filter(
        models.Inventory.id == item_id,
        models.Inventory.hospital_id == hospital.id,
    ).first()
    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory record not found.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(inv, field, value)
    inv.updated_by_uid = user.uid
    db.commit()
    db.refresh(inv)

    background_tasks.add_task(_run_hospital_ai_inventory, hospital.id, item_id, inv.current_quantity)
    background_tasks.add_task(_run_hospital_ai_scoring, hospital.id)
    return {**{c: getattr(inv, c) for c in inv.__table__.columns.keys()},
            "item_name": inv.item.name, "category": inv.item.category, "unit": inv.item.unit}


# ---- Beds ----

@router.get("/beds", response_model=List[BedOccupancyResponse])
async def get_beds(
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    beds = db.query(models.BedOccupancy).filter(
        models.BedOccupancy.hospital_id == hospital.id
    ).all()
    result = []
    for b in beds:
        available = b.total_capacity - b.occupied_count - b.reserved_count
        pct = round((b.occupied_count / b.total_capacity * 100) if b.total_capacity else 0, 1)
        result.append({**{c: getattr(b, c) for c in b.__table__.columns.keys()},
                        "available_count": available, "occupancy_percent": pct})
    return result


@router.put("/beds/{bed_id}", response_model=BedOccupancyResponse)
async def update_bed(
    bed_id: int,
    body: BedUpdateRequest,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(require_role("nurse_supervisor", "hospital_administrator", "medical_superintendent")),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    bed = db.query(models.BedOccupancy).filter(
        models.BedOccupancy.id == bed_id,
        models.BedOccupancy.hospital_id == hospital.id,
    ).first()
    if not bed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bed record not found.")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(bed, field, value)
    db.commit()
    db.refresh(bed)

    background_tasks.add_task(_run_hospital_ai_beds, hospital.id, bed.category, bed.occupied_count)
    background_tasks.add_task(_run_hospital_ai_scoring, hospital.id)
    available = bed.total_capacity - bed.occupied_count - bed.reserved_count
    pct = round((bed.occupied_count / bed.total_capacity * 100) if bed.total_capacity else 0, 1)
    return {**{c: getattr(bed, c) for c in bed.__table__.columns.keys()},
            "available_count": available, "occupancy_percent": pct}


# ---- Staff ----

@router.get("/staff", response_model=List[StaffAttendanceResponse])
async def get_staff(
    attendance_date: Optional[date] = None,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    query_date = attendance_date or date.today()
    records = db.query(models.StaffAttendance).filter(
        models.StaffAttendance.hospital_id == hospital.id,
        models.StaffAttendance.date == query_date,
    ).all()
    return records


@router.post("/staff", response_model=StaffAttendanceResponse, status_code=status.HTTP_201_CREATED)
async def log_staff_attendance(
    body: StaffAttendanceCreateRequest,
    user: AuthenticatedUser = Depends(require_role("nurse_supervisor", "hospital_administrator", "medical_superintendent")),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    record = models.StaffAttendance(
        hospital_id=hospital.id,
        date=body.date or date.today(),
        **{k: v for k, v in body.model_dump().items() if k != "date"},
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ---- Patient Statistics ----

@router.get("/statistics", response_model=List[PatientStatsResponse])
async def get_statistics(
    days: int = 7,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    records = (
        db.query(models.PatientStatistics)
        .filter(models.PatientStatistics.hospital_id == hospital.id)
        .order_by(desc(models.PatientStatistics.date))
        .limit(days)
        .all()
    )
    return records


@router.post("/statistics", response_model=PatientStatsResponse, status_code=status.HTTP_201_CREATED)
async def submit_statistics(
    body: PatientStatsCreateRequest,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(require_role("medical_officer", "hospital_administrator", "medical_superintendent")),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    record = models.PatientStatistics(
        hospital_id=hospital.id,
        submitted_by_uid=user.uid,
        date=body.date or date.today(),
        **{k: v for k, v in body.model_dump().items() if k != "date"},
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    background_tasks.add_task(_run_hospital_ai_scoring, hospital.id)
    return record


# ---- Infrastructure Issues ----

@router.get("/issues", response_model=List[IssueResponse])
async def get_issues(
    status_filter: Optional[str] = None,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    q = db.query(models.InfrastructureIssue).filter(
        models.InfrastructureIssue.hospital_id == hospital.id
    )
    if status_filter:
        q = q.filter(models.InfrastructureIssue.status == status_filter)
    return q.order_by(desc(models.InfrastructureIssue.created_at)).all()


@router.post("/issues", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
async def report_issue(
    body: IssueCreateRequest,
    background_tasks: BackgroundTasks,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    issue = models.InfrastructureIssue(
        hospital_id=hospital.id,
        reporter_uid=user.uid,
        **body.model_dump(),
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    
    # Trigger AI: classify the issue and auto-route to government department
    background_tasks.add_task(_run_hospital_ai_issue, hospital.id, issue.issue_type, issue.priority, issue.department)
    return issue


# ---- Resource Transfers ----

@router.get("/transfers", response_model=List[TransferResponse])
async def get_transfers(
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    transfers = db.query(models.ResourceTransfer).filter(
        (models.ResourceTransfer.from_hospital_id == hospital.id) |
        (models.ResourceTransfer.to_hospital_id == hospital.id)
    ).order_by(desc(models.ResourceTransfer.created_at)).limit(50).all()

    result = []
    for t in transfers:
        result.append({
            **{c: getattr(t, c) for c in t.__table__.columns.keys()},
            "item_name": t.item.name,
            "from_hospital_name": t.from_hospital.name,
            "to_hospital_name": t.to_hospital.name,
        })
    return result


@router.post("/transfers/request", response_model=TransferResponse, status_code=status.HTTP_201_CREATED)
async def request_transfer(
    body: TransferRequestBody,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)

    source = db.query(models.Hospital).filter(models.Hospital.id == body.from_hospital_id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source hospital not found.")

    item = db.query(models.Item).filter(models.Item.id == body.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")

    transfer = models.ResourceTransfer(
        item_id=body.item_id,
        quantity=body.quantity,
        from_hospital_id=body.from_hospital_id,
        to_hospital_id=hospital.id,
        ai_recommended=False,
        status="Pending",
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    return {
        **{c: getattr(transfer, c) for c in transfer.__table__.columns.keys()},
        "item_name": item.name,
        "from_hospital_name": source.name,
        "to_hospital_name": hospital.name,
    }


@router.put("/transfers/{transfer_id}", response_model=TransferResponse)
async def update_transfer_status(
    transfer_id: int,
    body: TransferStatusUpdate,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    transfer = db.query(models.ResourceTransfer).filter(
        models.ResourceTransfer.id == transfer_id,
        (models.ResourceTransfer.from_hospital_id == hospital.id) |
        (models.ResourceTransfer.to_hospital_id == hospital.id),
    ).first()
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")

    transfer.status = body.status
    if body.status == "Completed":
        transfer.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(transfer)
    return {
        **{c: getattr(transfer, c) for c in transfer.__table__.columns.keys()},
        "item_name": transfer.item.name,
        "from_hospital_name": transfer.from_hospital.name,
        "to_hospital_name": transfer.to_hospital.name,
    }


# ---- Notifications ----

@router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(
    unread_only: bool = False,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    q = db.query(models.Notification).filter(
        models.Notification.recipient_role == "hospital",
        models.Notification.recipient_id == str(hospital.id),
    )
    if unread_only:
        q = q.filter(models.Notification.is_read == False)  # noqa: E712
    return q.order_by(desc(models.Notification.created_at)).limit(50).all()


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    user: AuthenticatedUser = Depends(require_hospital_role),
    db: Session = Depends(get_db),
):
    hospital = _get_hospital(user, db)
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.recipient_id == str(hospital.id),
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"status": "ok"}
