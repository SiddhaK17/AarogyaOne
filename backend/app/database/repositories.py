"""
AarogyaOne Backend — Database Repositories
=========================================================================
Concrete SQLAlchemy repository implementations for domain services.
"""
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import models

class SQLAlchemyComplaintRepository:
    def __init__(self, db: Session):
        self.db = db
        
    async def get_by_id(self, complaint_id: int) -> Optional[models.CitizenComplaint]:
        return self.db.query(models.CitizenComplaint).filter(models.CitizenComplaint.id == complaint_id).first()
        
    async def update_status(self, complaint_id: int, status: str, updated_at: datetime) -> None:
        complaint = self.db.query(models.CitizenComplaint).filter(models.CitizenComplaint.id == complaint_id).first()
        if complaint:
            complaint.status = status
            complaint.updated_at = updated_at
            self.db.flush()
            
    async def save_ai_metadata(self, complaint_id: int, metadata: Dict[str, Any]) -> None:
        complaint = self.db.query(models.CitizenComplaint).filter(models.CitizenComplaint.id == complaint_id).first()
        if complaint:
            if "priority_result" in metadata and metadata["priority_result"]:
                complaint.ai_priority = metadata["priority_result"].get("priority_level")
            self.db.flush()

class SQLAlchemyTaskRepository:
    def __init__(self, db: Session):
        self.db = db

    async def create_government_task(self, complaint_id: int, target: str, description: str, priority: str, duration: int) -> str:
        task = models.GovernmentTask(
            source_type="complaint",
            source_id=complaint_id,
            assigned_department=target,
            title=description[:250],
            description=description,
            priority=priority
        )
        self.db.add(task)
        self.db.flush()
        return str(task.id)
        
    async def create_hospital_action(self, complaint_id: int, department: str, description: str, priority: str, duration: int) -> str:
        task = models.GovernmentTask(
            source_type="complaint",
            source_id=complaint_id,
            assigned_department=department,
            title=description[:250],
            description=description,
            priority=priority
        )
        self.db.add(task)
        self.db.flush()
        return str(task.id)

class SQLAlchemyNotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    async def schedule_notification(self, complaint_id: int, target_group: str, message: str, priority: str) -> str:
        notification = models.Notification(
            recipient_role=target_group,
            recipient_id=target_group,
            title=f"New AI Task for Complaint {complaint_id}",
            body=message,
            priority=priority,
            category="complaint"
        )
        self.db.add(notification)
        self.db.flush()
        return str(notification.id)

    async def create_internal_alert(self, hospital_id: int, alert_type: str, message: str, severity: str) -> str:
        notification = models.Notification(
            recipient_role="hospital",
            recipient_id=str(hospital_id),
            title=alert_type,
            body=message,
            priority=severity,
            category=alert_type.lower()
        )
        self.db.add(notification)
        self.db.flush()
        return str(notification.id)

    async def generate_notification(self, hospital_id: int, audience: str, payload: Dict[str, Any]) -> str:
        notification = models.Notification(
            recipient_role=audience,
            recipient_id=str(hospital_id),
            title="Action Required",
            body=json.dumps(payload),
            priority="HIGH",
            category="alert"
        )
        self.db.add(notification)
        self.db.flush()
        return str(notification.id)

class SQLAlchemyTransaction:
    def __init__(self, db: Session):
        self.db = db
        
    async def commit(self) -> None:
        self.db.commit()
        
    async def rollback(self) -> None:
        self.db.rollback()

class SQLAlchemyInventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    async def update_inventory(self, hospital_id: int, item_id: int, quantity: int) -> None:
        inv = self.db.query(models.Inventory).filter(
            models.Inventory.hospital_id == hospital_id,
            models.Inventory.item_id == item_id
        ).first()
        if inv:
            inv.current_quantity = quantity
            self.db.flush()
        
    async def get_historical_inventory(self, hospital_id: int, days: int = 30) -> List[Dict[str, Any]]:
        """
        Returns an empty collection to indicate that historical inventory data 
        is currently unavailable, allowing the service layer to handle it gracefully.
        """
        return []

class SQLAlchemyHospitalRepository:
    def __init__(self, db: Session):
        self.db = db
        
    async def get_by_id(self, hospital_id: int) -> Optional[models.Hospital]:
        """Fetch hospital by strongly typed integer ID."""
        return self.db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
        
    async def save_performance_score(self, hospital_id: int, score: float, timestamp: datetime) -> None:
        hosp = self.db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
        if hosp:
            hosp.health_score = score
            hosp.health_score_updated_at = timestamp
            self.db.flush()
            
    async def get_resolution_metrics(self, hospital_id: int) -> Optional[Dict[str, Any]]:
        """
        Returns None to clearly communicate that resolution metrics are 
        currently unavailable in the system.
        """
        return None

class SQLAlchemyBedOccupancyRepository:
    def __init__(self, db: Session):
        self.db = db
        
    async def update_occupancy(self, hospital_id: int, category: str, occupied_count: int) -> None:
        bed = self.db.query(models.BedOccupancy).filter(
            models.BedOccupancy.hospital_id == hospital_id,
            models.BedOccupancy.category == category
        ).first()
        if bed:
            bed.occupied_count = occupied_count
            self.db.flush()
            
    async def get_historical_occupancy(self, hospital_id: int, category: str, days: int = 30) -> List[Dict[str, Any]]:
        """
        Returns an empty collection to indicate that historical bed occupancy data 
        is currently unavailable, allowing the service layer to handle it gracefully.
        """
        return []
