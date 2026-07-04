"""
AarogyaOne Backend — Government Authority Portal Router
========================================================
All endpoints require a Government-role user (engineer or supplier).
Department isolation is enforced via the `department` claim in the Firebase token —
users only see tasks assigned to their specific department.

Endpoints:
  GET  /api/government/tasks                        — All pending tasks for this department
  GET  /api/government/tasks/{task_id}              — Detailed task view
  PUT  /api/government/tasks/{task_id}/status       — Update task progress status
  POST /api/government/tasks/{task_id}/upload       — Upload completion evidence to Supabase Storage
  GET  /api/government/completed                    — Completed task archive
  GET  /api/government/analytics                    — Department performance metrics
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, require_government_role
from app.database.connection import get_db
from app.database import models
from app.database.supabase_client import upload_file_bytes, get_signed_url

router = APIRouter(prefix="/api/government", tags=["Government Authority Portal"])


# ---------------------------------------------------------------------------
# Guard: require department claim
# ---------------------------------------------------------------------------

def _get_department(user: AuthenticatedUser) -> str:
    if not user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is not assigned to a department.",
        )
    return user.department


# ===========================================================================
# Pydantic Schemas
# ===========================================================================

VALID_TASK_STATUSES = {
    "Pending",
    "Accepted",
    "Inspection Scheduled",
    "Work in Progress",
    "Waiting for Parts",
    "Awaiting Verification",
    "Completed",
}


class TaskListItem(BaseModel):
    id: int
    source_type: str
    title: str
    description: str
    priority: str
    status: str
    hospital_name: Optional[str]
    assigned_at: datetime
    due_date: Optional[datetime]
    model_config = {"from_attributes": True}


class ProgressLogResponse(BaseModel):
    id: int
    status: str
    note: Optional[str]
    officer_name: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


class TaskDetailResponse(BaseModel):
    id: int
    source_type: str
    source_id: int
    title: str
    description: str
    priority: str
    status: str
    hospital_name: Optional[str]
    assigned_department: str
    assigned_at: datetime
    due_date: Optional[datetime]
    completed_at: Optional[datetime]
    completion_notes: Optional[str]
    completion_photo_url: Optional[str]
    verified_by_hospital: bool
    progress_logs: List[ProgressLogResponse]


class TaskStatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None
    officer_name: Optional[str] = None


class EvidenceUploadResponse(BaseModel):
    task_id: int
    photo_url: str
    signed_url: str
    expires_in_seconds: int


class DepartmentAnalytics(BaseModel):
    department: str
    total_tasks: int
    pending_count: int
    in_progress_count: int
    completed_count: int
    overdue_count: int
    avg_resolution_hours: Optional[float]
    critical_tasks: int
    high_tasks: int


# ===========================================================================
# Endpoints
# ===========================================================================

@router.get("/tasks", response_model=List[TaskListItem])
async def get_assigned_tasks(
    priority: Optional[str] = Query(None),
    task_status: Optional[str] = Query(None, alias="status"),
    user: AuthenticatedUser = Depends(require_government_role),
    db: Session = Depends(get_db),
):
    """Returns all open tasks assigned to this user's department."""
    department = _get_department(user)

    q = db.query(models.GovernmentTask).filter(
        models.GovernmentTask.assigned_department.ilike(f"%{department}%"),
        models.GovernmentTask.status != "Completed",
    )
    if priority:
        q = q.filter(models.GovernmentTask.priority == priority)
    if task_status:
        q = q.filter(models.GovernmentTask.status == task_status)

    tasks = q.order_by(
        desc(models.GovernmentTask.priority),
        desc(models.GovernmentTask.assigned_at),
    ).all()

    result = []
    for t in tasks:
        hospital_name = None
        if t.hospital_id:
            h = db.query(models.Hospital).filter(models.Hospital.id == t.hospital_id).first()
            hospital_name = h.name if h else None
        result.append({
            **{c: getattr(t, c) for c in ["id", "source_type", "title", "description",
                                           "priority", "status", "assigned_at", "due_date"]},
            "hospital_name": hospital_name,
        })
    return result


@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
async def get_task_detail(
    task_id: int,
    user: AuthenticatedUser = Depends(require_government_role),
    db: Session = Depends(get_db),
):
    department = _get_department(user)
    task = db.query(models.GovernmentTask).filter(
        models.GovernmentTask.id == task_id,
        models.GovernmentTask.assigned_department.ilike(f"%{department}%"),
    ).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Task not found or not assigned to your department.")

    hospital_name = None
    if task.hospital_id:
        h = db.query(models.Hospital).filter(models.Hospital.id == task.hospital_id).first()
        hospital_name = h.name if h else None

    return {
        **{c: getattr(task, c) for c in [
            "id", "source_type", "source_id", "title", "description",
            "priority", "status", "assigned_department", "assigned_at",
            "due_date", "completed_at", "completion_notes",
            "completion_photo_url", "verified_by_hospital",
        ]},
        "hospital_name": hospital_name,
        "progress_logs": task.progress_logs,
    }


@router.put("/tasks/{task_id}/status")
async def update_task_status(
    task_id: int,
    body: TaskStatusUpdateRequest,
    user: AuthenticatedUser = Depends(require_government_role),
    db: Session = Depends(get_db),
):
    """Update the progress status of a task and append a log entry."""
    if body.status not in VALID_TASK_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid status '{body.status}'. Valid values: {sorted(VALID_TASK_STATUSES)}",
        )

    department = _get_department(user)
    task = db.query(models.GovernmentTask).filter(
        models.GovernmentTask.id == task_id,
        models.GovernmentTask.assigned_department.ilike(f"%{department}%"),
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    old_status = task.status
    task.status = body.status

    if body.status == "Completed":
        task.completed_at = datetime.utcnow()
        if body.note:
            task.completion_notes = body.note

    # Append progress log
    log = models.TaskProgressLog(
        task_id=task.id,
        status=body.status,
        note=body.note,
        officer_name=body.officer_name or user.name,
        officer_uid=user.uid,
    )
    db.add(log)
    db.commit()

    return {
        "task_id": task_id,
        "old_status": old_status,
        "new_status": body.status,
    }


@router.post("/tasks/{task_id}/upload", response_model=EvidenceUploadResponse)
async def upload_completion_evidence(
    task_id: int,
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(require_government_role),
    db: Session = Depends(get_db),
):
    """
    Upload a photo or document as completion evidence for a task.
    Files are stored in Supabase 'completion-evidence' bucket.
    Returns a 1-hour signed URL for verification preview.

    Allowed types: image/*, application/pdf
    """
    department = _get_department(user)
    task = db.query(models.GovernmentTask).filter(
        models.GovernmentTask.id == task_id,
        models.GovernmentTask.assigned_department.ilike(f"%{department}%"),
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    content_type = file.content_type or "application/octet-stream"
    if not (content_type.startswith("image/") or content_type == "application/pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only image files and PDFs are accepted as evidence.",
        )

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    storage_path = f"tasks/{task_id}/evidence_{uuid.uuid4().hex[:8]}{ext}"
    file_bytes = await file.read()

    upload_file_bytes("completion_evidence", storage_path, file_bytes, content_type)
    signed_url = get_signed_url("completion_evidence", storage_path, expires_in=3600)

    task.completion_photo_url = storage_path
    db.commit()

    return {
        "task_id": task_id,
        "photo_url": storage_path,
        "signed_url": signed_url,
        "expires_in_seconds": 3600,
    }


@router.get("/completed")
async def get_completed_tasks(
    limit: int = Query(default=50, le=200),
    user: AuthenticatedUser = Depends(require_government_role),
    db: Session = Depends(get_db),
):
    """Returns completed tasks for audit and record purposes."""
    department = _get_department(user)
    tasks = db.query(models.GovernmentTask).filter(
        models.GovernmentTask.assigned_department.ilike(f"%{department}%"),
        models.GovernmentTask.status == "Completed",
    ).order_by(desc(models.GovernmentTask.completed_at)).limit(limit).all()

    result = []
    for t in tasks:
        hospital_name = None
        if t.hospital_id:
            h = db.query(models.Hospital).filter(models.Hospital.id == t.hospital_id).first()
            hospital_name = h.name if h else None
        result.append({
            "id": t.id,
            "title": t.title,
            "priority": t.priority,
            "hospital_name": hospital_name,
            "assigned_at": t.assigned_at,
            "completed_at": t.completed_at,
            "completion_notes": t.completion_notes,
            "has_evidence": bool(t.completion_photo_url),
            "verified_by_hospital": t.verified_by_hospital,
        })
    return result


@router.get("/analytics", response_model=DepartmentAnalytics)
async def get_department_analytics(
    user: AuthenticatedUser = Depends(require_government_role),
    db: Session = Depends(get_db),
):
    """Returns performance metrics for the user's government department."""
    department = _get_department(user)
    tasks = db.query(models.GovernmentTask).filter(
        models.GovernmentTask.assigned_department.ilike(f"%{department}%"),
    ).all()

    now = datetime.utcnow()
    total = len(tasks)
    pending = sum(1 for t in tasks if t.status == "Pending")
    in_progress = sum(1 for t in tasks if t.status not in {"Pending", "Completed"})
    completed_tasks = [t for t in tasks if t.status == "Completed"]
    overdue = sum(1 for t in tasks if t.due_date and t.due_date < now and t.status != "Completed")

    # Average resolution time in hours
    resolution_times = []
    for t in completed_tasks:
        if t.completed_at and t.assigned_at:
            delta = (t.completed_at - t.assigned_at).total_seconds() / 3600
            resolution_times.append(delta)
    avg_resolution = round(sum(resolution_times) / len(resolution_times), 1) if resolution_times else None

    return {
        "department": department,
        "total_tasks": total,
        "pending_count": pending,
        "in_progress_count": in_progress,
        "completed_count": len(completed_tasks),
        "overdue_count": overdue,
        "avg_resolution_hours": avg_resolution,
        "critical_tasks": sum(1 for t in tasks if t.priority == "Critical" and t.status != "Completed"),
        "high_tasks": sum(1 for t in tasks if t.priority == "High" and t.status != "Completed"),
    }
