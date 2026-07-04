"""
AarogyaOne Backend — Report Generator
=======================================
Generates structured operational reports from live database data.
Uses Jinja2 HTML templates for formatting, with optional PDF export.

Reports available:
  - Hospital Daily Summary
  - District Weekly Report

Each report function returns a structured dict (for JSON response)
and optionally exports a PDF bytes payload via WeasyPrint.
"""

from __future__ import annotations

import logging
import os
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy.orm import Session

from app.database import models

logger = logging.getLogger("aarogyaone.reports")

# Template directory
TEMPLATES_DIR = Path(__file__).parent / "templates"

_jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


# ===========================================================================
# Helper: gather hospital data snapshot
# ===========================================================================

def _hospital_snapshot(hospital: models.Hospital, db: Session, report_date: date) -> Dict[str, Any]:
    """Returns a comprehensive data snapshot for one hospital on a given date."""
    # Inventory
    inventories = db.query(models.Inventory).filter(
        models.Inventory.hospital_id == hospital.id
    ).all()
    low_stock = [i for i in inventories if i.current_quantity <= i.min_threshold]
    critical_stock = [i for i in inventories if i.current_quantity == 0]

    # Beds
    beds = db.query(models.BedOccupancy).filter(
        models.BedOccupancy.hospital_id == hospital.id
    ).all()
    total_cap = sum(b.total_capacity for b in beds)
    total_occ = sum(b.occupied_count for b in beds)
    available = total_cap - total_occ

    # Staff
    staff = db.query(models.StaffAttendance).filter(
        models.StaffAttendance.hospital_id == hospital.id,
        models.StaffAttendance.date == report_date,
    ).all()
    present = [s for s in staff if s.status == "Present"]
    doctors = [s for s in present if s.designation == "Doctor"]

    # Patient Stats
    stats = db.query(models.PatientStatistics).filter(
        models.PatientStatistics.hospital_id == hospital.id,
        models.PatientStatistics.date == report_date,
    ).first()

    # Issues
    open_issues = db.query(models.InfrastructureIssue).filter(
        models.InfrastructureIssue.hospital_id == hospital.id,
        models.InfrastructureIssue.status != "Resolved",
    ).all()
    critical_issues = [i for i in open_issues if i.priority == "Critical"]

    # Complaints (last 7 days)
    since = datetime.combine(report_date, datetime.min.time()) - timedelta(days=7)
    complaints = db.query(models.CitizenComplaint).filter(
        models.CitizenComplaint.hospital_id == hospital.id,
        models.CitizenComplaint.created_at >= since,
    ).all()

    # AI Recommendations
    recommendations = db.query(models.AIRecommendation).filter(
        models.AIRecommendation.hospital_id == hospital.id,
        models.AIRecommendation.is_actioned == False,  # noqa: E712
    ).order_by(models.AIRecommendation.created_at.desc()).limit(3).all()

    return {
        "hospital": {
            "id": hospital.id,
            "name": hospital.name,
            "type": hospital.facility_type,
            "district": hospital.district,
            "taluka": hospital.taluka,
            "health_score": hospital.health_score,
        },
        "inventory": {
            "total_items": len(inventories),
            "low_stock_count": len(low_stock),
            "critical_stock_count": len(critical_stock),
            "critical_items": [
                {"name": i.item.name, "quantity": i.current_quantity, "threshold": i.min_threshold,
                 "days_remaining": i.predicted_stockout_days}
                for i in (low_stock + critical_stock)[:10]
            ],
        },
        "beds": {
            "total_capacity": total_cap,
            "occupied": total_occ,
            "available": available,
            "occupancy_percent": round((total_occ / total_cap * 100) if total_cap else 0, 1),
        },
        "staff": {
            "total_logged": len(staff),
            "present": len(present),
            "doctors_on_duty": len(doctors),
            "attendance_percent": round((len(present) / len(staff) * 100) if staff else 0, 1),
        },
        "patients": {
            "opd": stats.opd_count if stats else 0,
            "ipd": stats.ipd_count if stats else 0,
            "emergency": stats.emergency_admissions if stats else 0,
            "discharges": stats.discharges if stats else 0,
            "avg_wait_minutes": stats.avg_wait_time_minutes if stats else None,
        },
        "issues": {
            "open_count": len(open_issues),
            "critical_count": len(critical_issues),
            "list": [
                {"title": i.title, "type": i.issue_type, "priority": i.priority}
                for i in critical_issues[:5]
            ],
        },
        "complaints": {
            "count_last_7_days": len(complaints),
            "negative_count": sum(1 for c in complaints if c.ai_sentiment == "Negative"),
        },
        "recommendations": [
            {"type": r.recommendation_type, "title": r.title, "description": r.description}
            for r in recommendations
        ],
    }


# ===========================================================================
# Report 1: Hospital Daily Summary
# ===========================================================================

def generate_hospital_daily_report(
    hospital_id: int,
    report_date: Optional[date],
    db: Session,
) -> Dict[str, Any]:
    """
    Generates a daily operational summary for one hospital.
    Returns a structured dict (usable as JSON response).
    """
    report_date = report_date or date.today()

    hospital = db.query(models.Hospital).filter(
        models.Hospital.id == hospital_id
    ).first()
    if not hospital:
        raise ValueError(f"Hospital {hospital_id} not found.")

    snapshot = _hospital_snapshot(hospital, db, report_date)

    return {
        "report_type": "hospital_daily",
        "report_date": str(report_date),
        "generated_at": datetime.utcnow().isoformat(),
        **snapshot,
    }


# ===========================================================================
# Report 2: District Weekly Summary
# ===========================================================================

def generate_district_weekly_report(
    district: str,
    end_date: Optional[date],
    db: Session,
) -> Dict[str, Any]:
    """
    Generates a 7-day district-wide operational summary.
    Aggregates data across all active hospitals in the district.
    """
    end_date = end_date or date.today()
    start_date = end_date - timedelta(days=6)

    hospitals = db.query(models.Hospital).filter(
        models.Hospital.district.ilike(district),
        models.Hospital.status == "Active",
    ).all()

    if not hospitals:
        raise ValueError(f"No active hospitals found in district '{district}'.")

    snapshots = [_hospital_snapshot(h, db, end_date) for h in hospitals]

    # Aggregate district-level numbers
    total_beds = sum(s["beds"]["total_capacity"] for s in snapshots)
    total_available = sum(s["beds"]["available"] for s in snapshots)
    total_opd = sum(s["patients"]["opd"] for s in snapshots)
    total_ipd = sum(s["patients"]["ipd"] for s in snapshots)
    total_open_issues = sum(s["issues"]["open_count"] for s in snapshots)
    total_critical_issues = sum(s["issues"]["critical_count"] for s in snapshots)
    total_complaints = sum(s["complaints"]["count_last_7_days"] for s in snapshots)

    avg_score = round(sum(h.health_score for h in hospitals) / len(hospitals), 1)
    critical_hospitals = [s for s in snapshots if s["hospital"]["health_score"] < 25]
    high_risk_hospitals = [s for s in snapshots if 25 <= s["hospital"]["health_score"] < 50]

    # Sort hospitals by health score ascending (worst first)
    snapshots.sort(key=lambda x: x["hospital"]["health_score"])

    return {
        "report_type": "district_weekly",
        "district": district,
        "period": {"start": str(start_date), "end": str(end_date)},
        "generated_at": datetime.utcnow().isoformat(),
        "summary": {
            "total_hospitals": len(hospitals),
            "district_health_score": avg_score,
            "critical_hospitals": len(critical_hospitals),
            "high_risk_hospitals": len(high_risk_hospitals),
            "total_beds": total_beds,
            "total_available_beds": total_available,
            "total_opd_patients": total_opd,
            "total_ipd_patients": total_ipd,
            "open_issues": total_open_issues,
            "critical_issues": total_critical_issues,
            "citizen_complaints": total_complaints,
        },
        "hospitals": snapshots,
        "top_risks": [
            {
                "hospital": s["hospital"]["name"],
                "score": s["hospital"]["health_score"],
                "critical_issues": s["issues"]["critical_count"],
                "low_stock": s["inventory"]["low_stock_count"],
            }
            for s in snapshots[:5]  # worst 5
        ],
    }


# ===========================================================================
# PDF Export (optional — requires WeasyPrint)
# ===========================================================================

def export_report_as_pdf(report_data: Dict[str, Any], template_name: str) -> bytes:
    """
    Renders a report dict into an HTML template and converts it to PDF.
    Returns the PDF as bytes.

    Args:
        report_data:   Dict returned by generate_* functions.
        template_name: Template filename in reports/templates/, e.g. "hospital_daily.html"

    Returns:
        PDF bytes.

    Raises:
        ImportError: If WeasyPrint is not installed.
        TemplateNotFound: If the template file doesn't exist.
    """
    try:
        from weasyprint import HTML
    except ImportError:
        raise ImportError(
            "WeasyPrint is required for PDF export. Install it with: pip install weasyprint"
        )

    template = _jinja_env.get_template(template_name)
    html_content = template.render(**report_data)
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
