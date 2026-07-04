"""
AarogyaOne Backend — District Health Intelligence Centre (DHIC) Router
=======================================================================
All endpoints require a DHIC-role user (DHO, CMO, Surveillance Officer).
District isolation is enforced via the `district` claim in the Firebase token —
users only see hospitals in their assigned district.

Endpoints:
  GET  /api/dhic/dashboard
  GET  /api/dhic/map
  GET  /api/dhic/hospitals
  GET  /api/dhic/hospitals/{hospital_id}
  GET  /api/dhic/resources/transfers
  PUT  /api/dhic/resources/transfers/{transfer_id}/approve
  PUT  /api/dhic/resources/transfers/{transfer_id}/reject
  GET  /api/dhic/alerts
  PUT  /api/dhic/alerts/{alert_id}/acknowledge
  GET  /api/dhic/feedback
  GET  /api/dhic/infrastructure
  GET  /api/dhic/reports/district
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, require_dhic_role
from app.database.connection import get_db
from app.database import models

router = APIRouter(prefix="/api/dhic", tags=["District Health Intelligence Centre"])


# ---------------------------------------------------------------------------
# Guard: require district claim
# ---------------------------------------------------------------------------

def _get_district(user: AuthenticatedUser) -> str:
    if not user.district:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not assigned to a district.",
        )
    return user.district


def _district_hospitals(district: str, db: Session):
    """Returns all active hospitals in the user's district."""
    return db.query(models.Hospital).filter(
        models.Hospital.district.ilike(district),
        models.Hospital.status == "Active",
    ).all()


# ===========================================================================
# Pydantic Schemas
# ===========================================================================

class DistrictSummaryCard(BaseModel):
    total_hospitals: int
    phc_count: int
    chc_count: int
    district_hospitals_count: int
    total_available_beds: int
    icu_beds_available: int
    doctors_on_duty: int
    active_ambulances: int
    pending_critical_issues: int
    district_health_score: float


class HospitalMapMarker(BaseModel):
    id: int
    name: str
    facility_type: str
    latitude: float
    longitude: float
    health_score: float
    risk_level: str  # Low / Medium / High / Critical
    available_beds: int
    active_issues: int


class HospitalListItem(BaseModel):
    id: int
    name: str
    facility_type: str
    taluka: str
    health_score: float
    risk_level: str
    total_beds: int
    available_beds: int
    low_stock_count: int
    open_issues: int
    model_config = {"from_attributes": True}


class TransferApprovalRequest(BaseModel):
    note: Optional[str] = None


class AlertResponse(BaseModel):
    id: int
    title: str
    body: str
    priority: str
    category: Optional[str]
    action_url: Optional[str]
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class ComplaintSummary(BaseModel):
    id: int
    reference_number: str
    hospital_id: int
    hospital_name: str
    category: str
    ai_severity: Optional[str]
    ai_assigned_department: Optional[str]
    status: str
    created_at: datetime


class InfrastructureIssueSummary(BaseModel):
    id: int
    hospital_id: int
    hospital_name: str
    title: str
    issue_type: str
    priority: str
    status: str
    ai_assigned_department: Optional[str]
    created_at: datetime


# ===========================================================================
# Helpers
# ===========================================================================

def _health_score_to_risk(score: float) -> str:
    if score >= 75:
        return "Low"
    if score >= 50:
        return "Medium"
    if score >= 25:
        return "High"
    return "Critical"


def _get_available_beds(hospital: models.Hospital, db: Session) -> int:
    beds = db.query(models.BedOccupancy).filter(
        models.BedOccupancy.hospital_id == hospital.id
    ).all()
    return sum(
        max(0, b.total_capacity - b.occupied_count - b.reserved_count) for b in beds
    )


def _get_icu_available(hospital: models.Hospital, db: Session) -> int:
    icu = db.query(models.BedOccupancy).filter(
        models.BedOccupancy.hospital_id == hospital.id,
        models.BedOccupancy.category == "ICU",
    ).first()
    if not icu:
        return 0
    return max(0, icu.total_capacity - icu.occupied_count - icu.reserved_count)


def _get_doctors_on_duty(hospital: models.Hospital, db: Session) -> int:
    return db.query(models.StaffAttendance).filter(
        models.StaffAttendance.hospital_id == hospital.id,
        models.StaffAttendance.date == date.today(),
        models.StaffAttendance.designation == "Doctor",
        models.StaffAttendance.status == "Present",
    ).count()


def _get_low_stock_count(hospital: models.Hospital, db: Session) -> int:
    invs = db.query(models.Inventory).filter(
        models.Inventory.hospital_id == hospital.id,
        models.Inventory.current_quantity <= models.Inventory.min_threshold,
    ).count()
    return invs


# ===========================================================================
# Endpoints
# ===========================================================================

@router.get("/dashboard", response_model=DistrictSummaryCard)
async def get_district_dashboard(
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospitals = _district_hospitals(district, db)

    total_available_beds = sum(_get_available_beds(h, db) for h in hospitals)
    icu_available = sum(_get_icu_available(h, db) for h in hospitals)
    doctors = sum(_get_doctors_on_duty(h, db) for h in hospitals)
    ambulances = sum(1 for h in hospitals if h.has_ambulance)

    pending_critical = db.query(models.InfrastructureIssue).filter(
        models.InfrastructureIssue.hospital_id.in_([h.id for h in hospitals]),
        models.InfrastructureIssue.priority == "Critical",
        models.InfrastructureIssue.status != "Resolved",
    ).count()

    avg_score = (
        sum(h.health_score for h in hospitals) / len(hospitals)
        if hospitals else 50.0
    )

    return {
        "total_hospitals": len(hospitals),
        "phc_count": sum(1 for h in hospitals if h.facility_type == "PHC"),
        "chc_count": sum(1 for h in hospitals if h.facility_type == "CHC"),
        "district_hospitals_count": sum(1 for h in hospitals if h.facility_type == "District Hospital"),
        "total_available_beds": total_available_beds,
        "icu_beds_available": icu_available,
        "doctors_on_duty": doctors,
        "active_ambulances": ambulances,
        "pending_critical_issues": pending_critical,
        "district_health_score": round(avg_score, 1),
    }


@router.get("/map", response_model=List[HospitalMapMarker])
async def get_district_map(
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    """GeoJSON-style hospital markers for the Leaflet live district map."""
    district = _get_district(user)
    hospitals = _district_hospitals(district, db)

    markers = []
    for h in hospitals:
        available = _get_available_beds(h, db)
        open_issues = db.query(models.InfrastructureIssue).filter(
            models.InfrastructureIssue.hospital_id == h.id,
            models.InfrastructureIssue.status != "Resolved",
        ).count()
        markers.append({
            "id": h.id,
            "name": h.name,
            "facility_type": h.facility_type,
            "latitude": h.latitude,
            "longitude": h.longitude,
            "health_score": h.health_score,
            "risk_level": _health_score_to_risk(h.health_score),
            "available_beds": available,
            "active_issues": open_issues,
        })
    return markers


@router.get("/hospitals", response_model=List[HospitalListItem])
async def list_hospitals(
    risk_level: Optional[str] = Query(None),
    facility_type: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospitals = _district_hospitals(district, db)

    result = []
    for h in hospitals:
        available = _get_available_beds(h, db)
        low_stock = _get_low_stock_count(h, db)
        open_issues = db.query(models.InfrastructureIssue).filter(
            models.InfrastructureIssue.hospital_id == h.id,
            models.InfrastructureIssue.status != "Resolved",
        ).count()
        risk = _health_score_to_risk(h.health_score)

        if risk_level and risk != risk_level:
            continue
        if facility_type and h.facility_type != facility_type:
            continue

        result.append({
            "id": h.id,
            "name": h.name,
            "facility_type": h.facility_type,
            "taluka": h.taluka,
            "health_score": h.health_score,
            "risk_level": risk,
            "total_beds": h.total_beds,
            "available_beds": available,
            "low_stock_count": low_stock,
            "open_issues": open_issues,
        })

    result.sort(key=lambda x: x["health_score"])  # lowest score first
    return result


@router.get("/hospitals/{hospital_id}")
async def get_hospital_detail(
    hospital_id: int,
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospital = db.query(models.Hospital).filter(
        models.Hospital.id == hospital_id,
        models.Hospital.district.ilike(district),
    ).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found in your district.",
        )

    inventory = db.query(models.Inventory).filter(
        models.Inventory.hospital_id == hospital_id
    ).all()
    beds = db.query(models.BedOccupancy).filter(
        models.BedOccupancy.hospital_id == hospital_id
    ).all()
    today_stats = db.query(models.PatientStatistics).filter(
        models.PatientStatistics.hospital_id == hospital_id,
        models.PatientStatistics.date == date.today(),
    ).first()
    open_issues = db.query(models.InfrastructureIssue).filter(
        models.InfrastructureIssue.hospital_id == hospital_id,
        models.InfrastructureIssue.status != "Resolved",
    ).all()
    recent_complaints = db.query(models.CitizenComplaint).filter(
        models.CitizenComplaint.hospital_id == hospital_id,
    ).order_by(desc(models.CitizenComplaint.created_at)).limit(10).all()
    recommendations = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.hospital_id == hospital_id,
        models.AIRecommendation.is_actioned == False,  # noqa: E712
    ).order_by(desc(models.AIRecommendation.created_at)).limit(5).all()

    return {
        "hospital": hospital,
        "health_score": hospital.health_score,
        "risk_level": _health_score_to_risk(hospital.health_score),
        "inventory": [
            {"item": i.item.name, "category": i.item.category, "unit": i.item.unit,
             "current": i.current_quantity, "threshold": i.min_threshold,
             "predicted_stockout_days": i.predicted_stockout_days}
            for i in inventory
        ],
        "beds": [
            {"category": b.category, "total": b.total_capacity,
             "occupied": b.occupied_count, "available": b.total_capacity - b.occupied_count - b.reserved_count,
             "predicted_tomorrow": b.predicted_occupancy_tomorrow}
            for b in beds
        ],
        "today_stats": today_stats,
        "open_issues": open_issues,
        "recent_complaints": recent_complaints,
        "ai_recommendations": recommendations,
    }


# ---- Resource Transfers ----

@router.get("/resources/transfers")
async def list_district_transfers(
    status_filter: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospital_ids = [h.id for h in _district_hospitals(district, db)]

    q = db.query(models.ResourceTransfer).filter(
        (models.ResourceTransfer.from_hospital_id.in_(hospital_ids)) |
        (models.ResourceTransfer.to_hospital_id.in_(hospital_ids))
    )
    if status_filter:
        q = q.filter(models.ResourceTransfer.status == status_filter)

    transfers = q.order_by(desc(models.ResourceTransfer.created_at)).limit(100).all()
    return [
        {
            "id": t.id,
            "item": t.item.name,
            "quantity": t.quantity,
            "from_hospital": t.from_hospital.name,
            "to_hospital": t.to_hospital.name,
            "status": t.status,
            "distance_km": t.distance_km,
            "eta_minutes": t.eta_minutes,
            "ai_recommended": t.ai_recommended,
            "ai_reasoning": t.ai_reasoning,
            "created_at": t.created_at,
        }
        for t in transfers
    ]


@router.put("/resources/transfers/{transfer_id}/approve")
async def approve_transfer(
    transfer_id: int,
    body: TransferApprovalRequest,
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospital_ids = [h.id for h in _district_hospitals(district, db)]

    transfer = db.query(models.ResourceTransfer).filter(
        models.ResourceTransfer.id == transfer_id,
        (models.ResourceTransfer.from_hospital_id.in_(hospital_ids)) |
        (models.ResourceTransfer.to_hospital_id.in_(hospital_ids)),
    ).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found in your district.")
    if transfer.status != "Pending":
        raise HTTPException(status_code=409, detail=f"Transfer is already '{transfer.status}'.")

    transfer.status = "Approved"
    transfer.approved_by_uid = user.uid
    transfer.approved_at = datetime.utcnow()
    db.commit()

    return {"status": "approved", "transfer_id": transfer_id}


@router.put("/resources/transfers/{transfer_id}/reject")
async def reject_transfer(
    transfer_id: int,
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospital_ids = [h.id for h in _district_hospitals(district, db)]

    transfer = db.query(models.ResourceTransfer).filter(
        models.ResourceTransfer.id == transfer_id,
        (models.ResourceTransfer.from_hospital_id.in_(hospital_ids)) |
        (models.ResourceTransfer.to_hospital_id.in_(hospital_ids)),
    ).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found.")
    if transfer.status != "Pending":
        raise HTTPException(status_code=409, detail="Transfer is not pending.")

    transfer.status = "Declined"
    db.commit()
    return {"status": "declined", "transfer_id": transfer_id}


# ---- AI Alert Centre ----

@router.get("/alerts", response_model=List[AlertResponse])
async def get_district_alerts(
    priority: Optional[str] = Query(None),
    unread_only: bool = False,
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    q = db.query(models.Notification).filter(
        models.Notification.recipient_role == "dhic",
        models.Notification.recipient_id == district,
    )
    if priority:
        q = q.filter(models.Notification.priority == priority)
    if unread_only:
        q = q.filter(models.Notification.is_read == False)  # noqa: E712

    return q.order_by(desc(models.Notification.created_at)).limit(100).all()


@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    alert = db.query(models.Notification).filter(
        models.Notification.id == alert_id,
        models.Notification.recipient_id == district,
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.is_read = True
    db.commit()
    return {"status": "acknowledged"}


# ---- Citizen Feedback Intelligence ----

@router.get("/feedback")
async def get_citizen_feedback(
    days: int = Query(default=30, le=90),
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospital_ids = [h.id for h in _district_hospitals(district, db)]
    since = datetime.utcnow() - timedelta(days=days)

    complaints = db.query(models.CitizenComplaint).filter(
        models.CitizenComplaint.hospital_id.in_(hospital_ids),
        models.CitizenComplaint.created_at >= since,
    ).order_by(desc(models.CitizenComplaint.created_at)).all()

    # Aggregate by category and severity for dashboard
    by_category: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    for c in complaints:
        cat = c.ai_category or c.category
        by_category[cat] = by_category.get(cat, 0) + 1
        sev = c.ai_severity or "Unknown"
        by_severity[sev] = by_severity.get(sev, 0) + 1

    return {
        "total_complaints": len(complaints),
        "period_days": days,
        "by_category": by_category,
        "by_severity": by_severity,
        "recent": [
            {
                "reference_number": c.reference_number,
                "hospital_name": c.hospital.name,
                "category": c.category,
                "ai_severity": c.ai_severity,
                "status": c.status,
                "created_at": c.created_at,
            }
            for c in complaints[:20]
        ],
    }


# ---- Infrastructure Monitoring ----

@router.get("/infrastructure")
async def get_district_infrastructure(
    priority: Optional[str] = Query(None),
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    district = _get_district(user)
    hospital_ids = [h.id for h in _district_hospitals(district, db)]

    q = db.query(models.InfrastructureIssue).filter(
        models.InfrastructureIssue.hospital_id.in_(hospital_ids),
        models.InfrastructureIssue.status != "Resolved",
    )
    if priority:
        q = q.filter(models.InfrastructureIssue.priority == priority)

    issues = q.order_by(
        desc(models.InfrastructureIssue.priority),
        desc(models.InfrastructureIssue.created_at),
    ).all()

    return [
        {
            "id": i.id,
            "hospital_name": i.hospital.name,
            "title": i.title,
            "issue_type": i.issue_type,
            "priority": i.priority,
            "status": i.status,
            "ai_assigned_department": i.ai_assigned_department,
            "created_at": i.created_at,
        }
        for i in issues
    ]


# ---- District Reports ----

@router.get("/reports/district")
async def get_district_report(
    user: AuthenticatedUser = Depends(require_dhic_role),
    db: Session = Depends(get_db),
):
    """Returns a structured district summary report. PDF export available via POST."""
    district = _get_district(user)
    hospitals = _district_hospitals(district, db)

    report_data = {
        "district": district,
        "generated_at": datetime.utcnow().isoformat(),
        "generated_by": user.email,
        "hospital_count": len(hospitals),
        "hospitals": [],
    }

    for h in hospitals:
        report_data["hospitals"].append({
            "name": h.name,
            "type": h.facility_type,
            "health_score": h.health_score,
            "risk_level": _health_score_to_risk(h.health_score),
            "available_beds": _get_available_beds(h, db),
            "doctors_on_duty": _get_doctors_on_duty(h, db),
            "low_stock_items": _get_low_stock_count(h, db),
        })

    report_data["hospitals"].sort(key=lambda x: x["health_score"])
    return report_data
