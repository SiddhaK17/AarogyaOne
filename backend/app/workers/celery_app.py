"""
AarogyaOne Backend — Background Task Orchestrator
==================================================
Replaces Celery + Redis with FastAPI BackgroundTasks for the hackathon.
Each function here is called via `background_tasks.add_task(fn, ...)` in
API route handlers after a data mutation.

The orchestration chain:
  Inventory updated  → run_forecast → run_optimization (if shortage) → create_notification
  Issue reported     → run_issue_nlp → run_workflow_routing → create_government_task
  Complaint submitted → run_complaint_nlp → run_workflow_routing → create_government_task
  Any major change   → recalculate_hospital_score → update_district_score
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.database import models

logger = logging.getLogger("aarogyaone.workers")


# ===========================================================================
# Notification helper
# ===========================================================================

def _push_notification(
    db: Session,
    recipient_role: str,
    recipient_id: str,
    title: str,
    body: str,
    priority: str = "Informational",
    category: Optional[str] = None,
    action_url: Optional[str] = None,
) -> None:
    """Writes a Notification row. Supabase Realtime broadcasts the INSERT to subscribed frontends."""
    notif = models.Notification(
        recipient_role=recipient_role,
        recipient_id=recipient_id,
        title=title,
        body=body,
        priority=priority,
        category=category,
        action_url=action_url,
    )
    db.add(notif)
    db.commit()
    logger.info(f"[notify] {priority} → {recipient_role}:{recipient_id} — {title}")


# ===========================================================================
# Task 1: Demand Forecasting
# ===========================================================================

async def run_forecast(hospital_id: int, db: Session) -> None:
    """
    Re-runs the LightGBM demand forecasting model for all inventory items
    at the specified hospital. Updates `predicted_stockout_days` and
    `recommended_restock_qty` on each Inventory row.

    If any item is predicted to stock out within 3 days, creates a Critical
    notification for the hospital and a recommendation for DHIC.
    """
    logger.info(f"[forecast] Starting for hospital_id={hospital_id}")
    try:
        # Batch 2: Replace stub with actual LightGBM forecasting call:
        # from app.intelligence.pipelines.forecasting import ForecastingEngine
        # engine = ForecastingEngine()
        # predictions = engine.predict_for_hospital(hospital_id, db)

        inventories = db.query(models.Inventory).filter(
            models.Inventory.hospital_id == hospital_id
        ).all()

        for inv in inventories:
            # Stub: simple linear extrapolation until model is wired
            if inv.current_quantity <= 0:
                inv.predicted_stockout_days = 0.0
            elif inv.min_threshold > 0:
                days_of_stock = inv.current_quantity / max(inv.min_threshold / 7, 1)
                inv.predicted_stockout_days = round(days_of_stock, 1)
            inv.forecast_updated_at = datetime.utcnow()

        db.commit()

        # Notify for critical items (≤ 3 days remaining)
        critical_items = [
            inv for inv in inventories
            if inv.predicted_stockout_days is not None and inv.predicted_stockout_days <= 3
        ]
        if critical_items:
            hospital = db.query(models.Hospital).filter(
                models.Hospital.id == hospital_id
            ).first()
            item_names = ", ".join(inv.item.name for inv in critical_items[:3])
            count = len(critical_items)

            _push_notification(
                db=db,
                recipient_role="hospital",
                recipient_id=str(hospital_id),
                title=f"⚠️ Critical Stock Alert: {count} item(s) running out",
                body=f"Items expected to stock out within 72 hours: {item_names}. "
                     "Request transfers immediately.",
                priority="Critical",
                category="medicine_shortage",
                action_url="/hospital/inventory",
            )

            if hospital:
                _push_notification(
                    db=db,
                    recipient_role="dhic",
                    recipient_id=hospital.district,
                    title=f"Critical Stock: {hospital.name}",
                    body=f"{count} item(s) predicted to stock out within 72 hours: {item_names}.",
                    priority="Critical",
                    category="medicine_shortage",
                    action_url=f"/dhic/hospitals/{hospital_id}",
                )

        logger.info(f"[forecast] Completed for hospital_id={hospital_id}")

    except Exception as exc:
        logger.error(f"[forecast] Failed for hospital_id={hospital_id}: {exc}", exc_info=True)


# ===========================================================================
# Task 2: Hospital Health Score Calculation
# ===========================================================================

async def recalculate_hospital_score(hospital_id: int, db: Session) -> None:
    """
    Recalculates the AI hospital health score (0–100) using a weighted
    combination of: medicine availability, bed occupancy, staff attendance,
    open issues, and recent citizen complaints.

    Batch 2: Replace weighted rule-based stub with XGBoost model inference.
    """
    logger.info(f"[scoring] Starting for hospital_id={hospital_id}")
    try:
        hospital = db.query(models.Hospital).filter(
            models.Hospital.id == hospital_id
        ).first()
        if not hospital:
            return

        # --- Component 1: Medicine Availability (weight 30%) ---
        inventories = db.query(models.Inventory).filter(
            models.Inventory.hospital_id == hospital_id
        ).all()
        if inventories:
            ok_items = sum(1 for i in inventories if i.current_quantity > i.min_threshold)
            medicine_score = (ok_items / len(inventories)) * 100
        else:
            medicine_score = 50.0

        # --- Component 2: Bed Availability (weight 20%) ---
        beds = db.query(models.BedOccupancy).filter(
            models.BedOccupancy.hospital_id == hospital_id
        ).all()
        if beds:
            total_cap = sum(b.total_capacity for b in beds)
            total_occ = sum(b.occupied_count for b in beds)
            occupancy_pct = (total_occ / total_cap * 100) if total_cap else 0
            bed_score = max(0, 100 - occupancy_pct)  # lower occupancy = better score
        else:
            bed_score = 50.0

        # --- Component 3: Staff Attendance (weight 20%) ---
        from datetime import date as date_type
        today_staff = db.query(models.StaffAttendance).filter(
            models.StaffAttendance.hospital_id == hospital_id,
            models.StaffAttendance.date == date_type.today(),
        ).all()
        if today_staff:
            present = sum(1 for s in today_staff if s.status == "Present")
            staff_score = (present / len(today_staff)) * 100
        else:
            staff_score = 50.0

        # --- Component 4: Open Issues (weight 15%) ---
        critical_issues = db.query(models.InfrastructureIssue).filter(
            models.InfrastructureIssue.hospital_id == hospital_id,
            models.InfrastructureIssue.status != "Resolved",
            models.InfrastructureIssue.priority.in_(["Critical", "High"]),
        ).count()
        issue_score = max(0, 100 - (critical_issues * 15))

        # --- Component 5: Citizen Complaints (weight 15%) ---
        from datetime import timedelta
        since = datetime.utcnow() - timedelta(days=30)
        recent_complaints = db.query(models.CitizenComplaint).filter(
            models.CitizenComplaint.hospital_id == hospital_id,
            models.CitizenComplaint.created_at >= since,
        ).count()
        complaint_score = max(0, 100 - (recent_complaints * 5))

        # --- Weighted Composite ---
        final_score = round(
            (medicine_score * 0.30) +
            (bed_score * 0.20) +
            (staff_score * 0.20) +
            (issue_score * 0.15) +
            (complaint_score * 0.15),
            1,
        )

        old_score = hospital.health_score
        hospital.health_score = final_score
        hospital.health_score_updated_at = datetime.utcnow()
        db.commit()

        # Notify DHIC if score drops into a new risk tier
        if old_score >= 50 and final_score < 50:
            _push_notification(
                db=db,
                recipient_role="dhic",
                recipient_id=hospital.district,
                title=f"⚠️ Hospital Risk Escalated: {hospital.name}",
                body=f"Health score dropped from {old_score} to {final_score}. "
                     "Intervention recommended.",
                priority="High",
                category="score",
                action_url=f"/dhic/hospitals/{hospital_id}",
            )

        logger.info(f"[scoring] Hospital {hospital_id} score: {old_score} → {final_score}")

    except Exception as exc:
        logger.error(f"[scoring] Failed for hospital_id={hospital_id}: {exc}", exc_info=True)


# ===========================================================================
# Task 3: Infrastructure Issue NLP Classification + Routing
# ===========================================================================

async def run_issue_routing(issue_id: int, db: Session) -> None:
    """
    Runs NLP classification on a new infrastructure issue description
    (using the NLP pipeline or Gemini API), then:
    1. Updates the issue with AI category, severity, and assigned department.
    2. Creates a GovernmentTask row routed to the correct department.
    3. Notifies the DHIC.
    4. Updates ComplaintTracking status to 'Assigned to Department'.
    """
    logger.info(f"[routing] Starting for issue_id={issue_id}")
    try:
        issue = db.query(models.InfrastructureIssue).filter(
            models.InfrastructureIssue.id == issue_id
        ).first()
        if not issue:
            return

        # Batch 2: Replace stub with NLP + workflow pipeline:
        # from app.intelligence.pipelines.nlp import GrievanceClassifier
        # from app.intelligence.pipelines.workflow import WorkflowEngine
        # classifier = GrievanceClassifier().load()
        # result = classifier.predict(issue.description)
        # department = WorkflowEngine.route(result["category"])

        # Stub classification based on issue_type
        category_to_dept = {
            "Equipment Failure": "Biomedical Engineering Division",
            "Electrical": "Electrical & Maintenance Wing",
            "Plumbing": "Jal Nigam / Municipal Water Supply",
            "Civil": "Public Works Department",
            "IT": "Health IT & Informatics Division",
        }
        assigned_dept = category_to_dept.get(issue.issue_type, "General Administration")

        # Update issue with AI classification
        issue.ai_category = issue.issue_type
        issue.ai_severity = issue.priority
        issue.ai_assigned_department = assigned_dept
        issue.ai_confidence = 0.85  # stub

        # Create Government Task
        task = models.GovernmentTask(
            source_type="infrastructure_issue",
            source_id=issue.id,
            assigned_department=assigned_dept,
            title=issue.title,
            description=issue.description,
            hospital_id=issue.hospital_id,
            priority=issue.priority,
            status="Pending",
        )
        db.add(task)
        db.flush()

        issue.government_task_id = task.id
        db.commit()

        # Notify DHIC
        hospital = db.query(models.Hospital).filter(
            models.Hospital.id == issue.hospital_id
        ).first()
        if hospital:
            _push_notification(
                db=db,
                recipient_role="dhic",
                recipient_id=hospital.district,
                title=f"New Issue: {issue.title}",
                body=f"{hospital.name} reported a {issue.priority} {issue.issue_type} issue. "
                     f"Auto-routed to: {assigned_dept}.",
                priority=issue.priority,
                category="issue",
                action_url=f"/dhic/infrastructure",
            )

        logger.info(f"[routing] Issue {issue_id} routed to '{assigned_dept}' (task_id={task.id})")

    except Exception as exc:
        logger.error(f"[routing] Failed for issue_id={issue_id}: {exc}", exc_info=True)


# ===========================================================================
# Task 4: Citizen Complaint NLP Classification
# ===========================================================================

async def run_complaint_classification(complaint_id: int, db: Session) -> None:
    """
    Runs the NLP classification pipeline on a citizen complaint:
    1. Classifies the complaint (IndicBERT / Gemini).
    2. Updates AI fields on CitizenComplaint row.
    3. Creates a ComplaintTracking entry with new status.
    4. If severity is High/Critical, creates a GovernmentTask.
    5. Notifies DHIC.
    """
    logger.info(f"[complaint_nlp] Starting for complaint_id={complaint_id}")
    try:
        complaint = db.query(models.CitizenComplaint).filter(
            models.CitizenComplaint.id == complaint_id
        ).first()
        if not complaint:
            return

        # Batch 2: Replace stub with actual classifier:
        # from app.intelligence.pipelines.nlp import GrievanceClassifier
        # result = GrievanceClassifier().load().predict(complaint.description)

        # Stub: map categories to departments
        category_to_dept = {
            "Medicine Not Available": "Central Medical Stores",
            "Doctor Unavailable": "District Health Office",
            "Equipment Not Working": "Biomedical Engineering Division",
            "Infrastructure Damage": "Public Works Department",
            "Cleanliness Issues": "Hospital Sanitation Wing",
            "Long Waiting Time": "OPD Management & Scheduling",
        }
        assigned_dept = category_to_dept.get(complaint.category, "General Administration")
        severity = "Medium"  # stub default

        complaint.ai_category = complaint.category
        complaint.ai_severity = severity
        complaint.ai_priority = "Medium"
        complaint.ai_assigned_department = assigned_dept
        complaint.ai_sentiment = "Negative"
        complaint.ai_confidence = 0.82
        complaint.ai_processed_at = datetime.utcnow()
        complaint.status = "Assigned to Department"

        # Tracking entry
        tracking = models.ComplaintTracking(
            complaint_id=complaint.id,
            status="Assigned to Department",
            note=f"AI classified as '{complaint.category}'. Routed to: {assigned_dept}.",
            updated_by="AarogyaOne AI System",
        )
        db.add(tracking)

        # Create GovernmentTask for High/Critical complaints
        if severity in ("High", "Critical"):
            task = models.GovernmentTask(
                source_type="complaint",
                source_id=complaint.id,
                assigned_department=assigned_dept,
                title=f"Citizen Complaint: {complaint.category}",
                description=complaint.description,
                hospital_id=complaint.hospital_id,
                priority=severity,
                status="Pending",
            )
            db.add(task)

        db.commit()

        # Notify DHIC
        hospital = db.query(models.Hospital).filter(
            models.Hospital.id == complaint.hospital_id
        ).first()
        if hospital:
            _push_notification(
                db=db,
                recipient_role="dhic",
                recipient_id=hospital.district,
                title=f"Citizen Complaint: {complaint.category}",
                body=f"New {severity} complaint at {hospital.name}. Ref: {complaint.reference_number}",
                priority=severity,
                category="complaint",
                action_url="/dhic/feedback",
            )

        logger.info(f"[complaint_nlp] Complaint {complaint_id} processed → {assigned_dept}")

    except Exception as exc:
        logger.error(f"[complaint_nlp] Failed for complaint_id={complaint_id}: {exc}", exc_info=True)
