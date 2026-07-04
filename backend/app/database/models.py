"""
AarogyaOne Backend — SQLAlchemy ORM Models
============================================
Defines the full relational schema for the AarogyaOne platform.
All tables map to the Supabase (PostgreSQL) database.

Table inventory:
  Core entities:     User, Hospital, Item
  Hospital ops:      Inventory, BedOccupancy, StaffAttendance, PatientStatistics
                     InfrastructureIssue, ResourceTransfer
  Citizen layer:     CitizenComplaint, ComplaintMedia, ComplaintTracking
  Government layer:  GovernmentTask, TaskProgressLog
  AI layer:          AIRecommendation, Notification
"""

from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from .connection import Base


# ===========================================================================
# Helpers
# ===========================================================================

def _uuid_str() -> str:
    return str(uuid.uuid4())


# ===========================================================================
# Core Entities
# ===========================================================================

class User(Base):
    """
    Represents a platform user linked to their Firebase UID.
    Role-specific fields (hospital_id, district, department) are populated
    during registration and mirrored as Firebase custom claims.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    # Role values: medical_superintendent, hospital_administrator, pharmacist,
    # nurse_supervisor, medical_officer, inventory_manager,
    # district_health_officer, chief_medical_officer, surveillance_officer,
    # engineer, supplier, citizen
    role = Column(String(64), nullable=False, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    district = Column(String(100), nullable=True, index=True)   # for DHIC users
    department = Column(String(100), nullable=True)              # for Government users
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="users")


class Hospital(Base):
    """Government health centre — the primary operational unit."""
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    registration_no = Column(String(100), unique=True, nullable=False, index=True)
    # PHC / CHC / District Hospital / Sub-District Hospital
    facility_type = Column(String(50), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    taluka = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    total_beds = Column(Integer, default=0)
    icu_capacity = Column(Integer, default=0)
    has_laboratory = Column(Boolean, default=False)
    has_ambulance = Column(Boolean, default=False)
    # Pending / Active / Suspended
    status = Column(String(20), default="Pending", nullable=False, index=True)
    # AI-calculated score 0–100
    health_score = Column(Float, default=50.0)
    health_score_updated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="hospital")
    inventories = relationship("Inventory", back_populates="hospital", cascade="all, delete-orphan")
    beds = relationship("BedOccupancy", back_populates="hospital", cascade="all, delete-orphan")
    attendance = relationship("StaffAttendance", back_populates="hospital")
    patient_stats = relationship("PatientStatistics", back_populates="hospital")
    issues = relationship("InfrastructureIssue", back_populates="hospital")
    complaints = relationship("CitizenComplaint", back_populates="hospital")
    recommendations = relationship("AIRecommendation", back_populates="hospital")


class Item(Base):
    """Master list of medicine/resource items tracked across all hospitals."""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False, index=True)
    # Medicines / Oxygen / Blood Units / PPE Kits / Vaccines / Equipment
    category = Column(String(100), nullable=False, index=True)
    # Tablets / Cylinders / Units / Pieces / Doses / Litres
    unit = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    inventories = relationship("Inventory", back_populates="item")
    transfers = relationship("ResourceTransfer", back_populates="item")


# ===========================================================================
# Hospital Operations
# ===========================================================================

class Inventory(Base):
    """Real-time stock level of an item at a specific hospital."""
    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint("hospital_id", "item_id", name="uq_hospital_item"),
    )

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    current_quantity = Column(Integer, default=0, nullable=False)
    min_threshold = Column(Integer, default=50, nullable=False)
    max_capacity = Column(Integer, default=500, nullable=False)
    batch_number = Column(String(100), nullable=True)
    expiry_date = Column(Date, nullable=True)
    # AI forecast fields
    predicted_stockout_days = Column(Float, nullable=True)    # days until stock-out
    recommended_restock_qty = Column(Integer, nullable=True)
    forecast_updated_at = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
    updated_by_uid = Column(String(128), nullable=True)       # Firebase UID of last editor

    hospital = relationship("Hospital", back_populates="inventories")
    item = relationship("Item", back_populates="inventories")


class BedOccupancy(Base):
    """Current occupancy of a bed category at a specific hospital."""
    __tablename__ = "bed_occupancy"
    __table_args__ = (
        UniqueConstraint("hospital_id", "category", name="uq_hospital_bed_category"),
    )

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    # General / ICU / Emergency / Isolation / Pediatric / Maternity
    category = Column(String(50), nullable=False)
    total_capacity = Column(Integer, nullable=False)
    occupied_count = Column(Integer, default=0, nullable=False)
    reserved_count = Column(Integer, default=0, nullable=False)
    # AI forecast
    predicted_occupancy_tomorrow = Column(Float, nullable=True)  # percentage 0–100
    forecast_updated_at = Column(DateTime, nullable=True)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="beds")


class StaffAttendance(Base):
    """Daily attendance record for a single staff member."""
    __tablename__ = "staff_attendance"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    employee_name = Column(String(255), nullable=False)
    employee_id = Column(String(50), nullable=True)
    # Doctor / Nurse / Pharmacist / Lab Technician / Radiologist / Driver / Support
    designation = Column(String(100), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    # Morning / Afternoon / Night
    shift = Column(String(20), nullable=False)
    # Present / Absent / On Leave / Emergency
    status = Column(String(20), nullable=False, index=True)
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    date = Column(Date, server_default=func.current_date(), nullable=False, index=True)
    notes = Column(Text, nullable=True)

    hospital = relationship("Hospital", back_populates="attendance")


class PatientStatistics(Base):
    """Aggregate daily patient footfall statistics (no individual PII stored)."""
    __tablename__ = "patient_statistics"
    __table_args__ = (
        UniqueConstraint("hospital_id", "date", name="uq_hospital_date_stats"),
    )

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    opd_count = Column(Integer, default=0)
    ipd_count = Column(Integer, default=0)
    emergency_admissions = Column(Integer, default=0)
    discharges = Column(Integer, default=0)
    referrals_out = Column(Integer, default=0)
    critical_cases = Column(Integer, default=0)
    ambulance_arrivals = Column(Integer, default=0)
    avg_wait_time_minutes = Column(Integer, default=30)
    date = Column(Date, server_default=func.current_date(), nullable=False, index=True)
    submitted_by_uid = Column(String(128), nullable=True)

    hospital = relationship("Hospital", back_populates="patient_stats")


class InfrastructureIssue(Base):
    """Infrastructure/equipment issue reported by hospital staff."""
    __tablename__ = "infrastructure_issues"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    # Equipment Failure / Plumbing / Electrical / IT / Civil / Other
    issue_type = Column(String(100), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    # Low / Medium / High / Critical
    priority = Column(String(20), default="Medium", nullable=False, index=True)
    # Open / In Progress / Waiting for Parts / Resolved
    status = Column(String(50), default="Open", nullable=False, index=True)
    photo_url = Column(String(1024), nullable=True)          # Supabase Storage URL
    voice_note_url = Column(String(1024), nullable=True)     # Supabase Storage URL
    reporter_name = Column(String(255), nullable=False)
    reporter_uid = Column(String(128), nullable=True)
    # AI classification outputs
    ai_category = Column(String(100), nullable=True)
    ai_severity = Column(String(20), nullable=True)
    ai_assigned_department = Column(String(255), nullable=True)
    ai_confidence = Column(Float, nullable=True)
    government_task_id = Column(Integer, ForeignKey("government_tasks.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    resolved_at = Column(DateTime, nullable=True)

    hospital = relationship("Hospital", back_populates="issues")
    government_task = relationship("GovernmentTask", back_populates="infrastructure_issues")


class ResourceTransfer(Base):
    """A resource transfer request between two hospitals."""
    __tablename__ = "resource_transfers"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    from_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    to_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    # Pending / Approved / In Transit / Completed / Declined
    status = Column(String(20), default="Pending", nullable=False, index=True)
    distance_km = Column(Float, nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    ai_recommended = Column(Boolean, default=False)
    ai_reasoning = Column(Text, nullable=True)               # OR-Tools explanation
    approved_by_uid = Column(String(128), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    approved_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    item = relationship("Item", back_populates="transfers")
    from_hospital = relationship("Hospital", foreign_keys=[from_hospital_id])
    to_hospital = relationship("Hospital", foreign_keys=[to_hospital_id])


# ===========================================================================
# Citizen Layer
# ===========================================================================

class CitizenComplaint(Base):
    """
    A complaint submitted by a citizen about a healthcare facility.
    Citizens do not need an account — anonymous submissions are supported.
    Each complaint gets a unique human-readable reference number.
    """
    __tablename__ = "citizen_complaints"

    id = Column(Integer, primary_key=True, index=True)
    # Unique reference shown to the citizen for tracking (e.g. "ARP-2026-00143")
    reference_number = Column(String(30), unique=True, nullable=False, index=True,
                              default=lambda: f"ARP-{_uuid_str()[:8].upper()}")
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    citizen_firebase_uid = Column(String(128), nullable=True, index=True)  # None if anonymous
    is_anonymous = Column(Boolean, default=True)
    contact_info = Column(String(255), nullable=True)         # optional phone/email

    # Form fields
    date_of_visit = Column(Date, nullable=True)
    # Issue categories from spec: Medicine Not Available, Doctor Unavailable, etc.
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=False)

    # AI classification outputs (filled by background task)
    ai_category = Column(String(100), nullable=True)
    ai_severity = Column(String(20), nullable=True)            # Low/Medium/High/Critical
    ai_priority = Column(String(20), nullable=True)
    ai_assigned_department = Column(String(255), nullable=True)
    ai_sentiment = Column(String(20), nullable=True)           # Positive/Neutral/Negative
    ai_confidence = Column(Float, nullable=True)
    ai_processed_at = Column(DateTime, nullable=True)

    # Current status of the complaint
    # Received / Under AI Analysis / Assigned to Department / In Progress / Resolved / Closed
    status = Column(String(50), default="Received", nullable=False, index=True)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="complaints")
    media = relationship("ComplaintMedia", back_populates="complaint", cascade="all, delete-orphan")
    tracking = relationship("ComplaintTracking", back_populates="complaint",
                            order_by="ComplaintTracking.created_at",
                            cascade="all, delete-orphan")
    government_task = relationship("GovernmentTask",
                                   primaryjoin="and_(GovernmentTask.source_type=='complaint', "
                                               "GovernmentTask.source_id==CitizenComplaint.id)",
                                   foreign_keys="GovernmentTask.source_id",
                                   viewonly=True)


class ComplaintMedia(Base):
    """Photo, audio, or video uploaded alongside a citizen complaint."""
    __tablename__ = "complaint_media"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("citizen_complaints.id"), nullable=False, index=True)
    # photo / audio / video
    media_type = Column(String(20), nullable=False)
    storage_bucket = Column(String(100), nullable=False)
    storage_path = Column(String(1024), nullable=False)       # path inside bucket
    public_url = Column(String(2048), nullable=True)          # signed or public URL
    uploaded_at = Column(DateTime, server_default=func.now())

    complaint = relationship("CitizenComplaint", back_populates="media")


class ComplaintTracking(Base):
    """
    Status update timeline entry for a citizen complaint.
    Each status change appends a new row to this table, creating
    a full audit trail that citizens can view via reference number.
    """
    __tablename__ = "complaint_tracking"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("citizen_complaints.id"), nullable=False, index=True)
    # Received / Under AI Analysis / Assigned to Department / In Progress / Resolved / Closed
    status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    updated_by = Column(String(255), nullable=True)           # system / officer name
    created_at = Column(DateTime, server_default=func.now())

    complaint = relationship("CitizenComplaint", back_populates="tracking")


# ===========================================================================
# Government Layer
# ===========================================================================

class GovernmentTask(Base):
    """
    A work ticket automatically routed to a government department
    after AI classification of a complaint or infrastructure issue.
    """
    __tablename__ = "government_tasks"

    id = Column(Integer, primary_key=True, index=True)
    # complaint / infrastructure_issue
    source_type = Column(String(30), nullable=False, index=True)
    source_id = Column(Integer, nullable=False, index=True)

    assigned_department = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    # Low / Medium / High / Critical
    priority = Column(String(20), default="Medium", nullable=False, index=True)
    # Pending / Accepted / Inspection Scheduled / Work in Progress /
    # Waiting for Parts / Awaiting Verification / Completed
    status = Column(String(50), default="Pending", nullable=False, index=True)

    assigned_at = Column(DateTime, server_default=func.now())
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    completion_photo_url = Column(String(2048), nullable=True)  # Supabase Storage URL
    verified_by_hospital = Column(Boolean, default=False)

    progress_logs = relationship("TaskProgressLog", back_populates="task",
                                 order_by="TaskProgressLog.created_at",
                                 cascade="all, delete-orphan")
    infrastructure_issues = relationship("InfrastructureIssue",
                                         back_populates="government_task")


class TaskProgressLog(Base):
    """Timestamped status update made by the government department."""
    __tablename__ = "task_progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("government_tasks.id"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    note = Column(Text, nullable=True)
    officer_name = Column(String(255), nullable=True)
    officer_uid = Column(String(128), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    task = relationship("GovernmentTask", back_populates="progress_logs")


# ===========================================================================
# AI Layer
# ===========================================================================

class AIRecommendation(Base):
    """
    A recommendation generated by any AI service and stored for display
    in hospital or DHIC dashboards.
    """
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True, index=True)
    district = Column(String(100), nullable=True, index=True)  # for district-level recs
    # transfer / restock / staffing / inspection / procurement / redirect_patients
    recommendation_type = Column(String(50), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    # 0.0 – 1.0
    confidence = Column(Float, nullable=True)
    # JSON blob with supporting evidence: {"medicine": "insulin", "days_remaining": 2}
    supporting_data = Column(JSON, nullable=True)
    is_actioned = Column(Boolean, default=False)
    actioned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    hospital = relationship("Hospital", back_populates="recommendations")


class Notification(Base):
    """
    In-app notification record for any portal user.
    Written to by background tasks after AI processing completes.
    Supabase Realtime broadcasts INSERT events to subscribed frontends.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    # hospital / dhic / government / citizen
    recipient_role = Column(String(50), nullable=False, index=True)
    # Firebase UID, hospital_id, district name, or department name
    recipient_id = Column(String(255), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    # Critical / High / Medium / Informational
    priority = Column(String(20), default="Informational", nullable=False, index=True)
    # medicine_shortage / bed_capacity / staff_shortage / transfer / complaint / issue / score
    category = Column(String(50), nullable=True)
    # Relative URL to navigate to when clicked, e.g. "/hospital/inventory"
    action_url = Column(String(512), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
