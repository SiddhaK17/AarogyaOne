from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from .connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # superintendent, pharmacist, nurse, officer, dho, engineer, etc.
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    hospital = relationship("Hospital", back_populates="users")

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    registration_no = Column(String, unique=True, nullable=False)
    facility_type = Column(String, nullable=False)  # PHC, CHC, District Hospital
    district = Column(String, nullable=False)
    taluka = Column(String, nullable=False)
    address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    status = Column(String, default="Pending")  # Pending, Active, Suspended

    users = relationship("User", back_populates="hospital")
    inventories = relationship("Inventory", back_populates="hospital")
    beds = relationship("BedOccupancy", back_populates="hospital")
    attendance = relationship("StaffAttendance", back_populates="hospital")
    patient_stats = relationship("PatientStatistics", back_populates="hospital")
    issues = relationship("InfrastructureIssue", back_populates="hospital")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)  # Medicines, Oxygen, Blood Units, PPE Kits, Vaccines
    unit = Column(String, nullable=False)  # Tablets, Cylinders, Units, Pieces, Doses

    inventories = relationship("Inventory", back_populates="item")
    transfers = relationship("ResourceTransfer", back_populates="item")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    current_quantity = Column(Integer, default=0)
    min_threshold = Column(Integer, default=50)
    max_capacity = Column(Integer, default=500)
    batch_number = Column(String, nullable=True)
    expiry_date = Column(Date, nullable=True)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="inventories")
    item = relationship("Item", back_populates="inventories")

class BedOccupancy(Base):
    __tablename__ = "bed_occupancy"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    category = Column(String, nullable=False)  # General, ICU, Emergency, Isolation, Pediatric, Maternity
    total_capacity = Column(Integer, nullable=False)
    occupied_count = Column(Integer, default=0)
    reserved_count = Column(Integer, default=0)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())

    hospital = relationship("Hospital", back_populates="beds")

class StaffAttendance(Base):
    __tablename__ = "staff_attendance"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    employee_name = Column(String, nullable=False)
    designation = Column(String, nullable=False)  # Doctor, Nurse, Pharmacist, Lab Technician, Driver
    department = Column(String, nullable=False)
    shift = Column(String, nullable=False)  # Morning, Afternoon, Night
    status = Column(String, nullable=False)  # Present, Absent, On Leave
    check_in_time = Column(DateTime, nullable=True)
    check_out_time = Column(DateTime, nullable=True)
    date = Column(Date, default=func.current_date())

    hospital = relationship("Hospital", back_populates="attendance")

class PatientStatistics(Base):
    __tablename__ = "patient_statistics"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    opd_count = Column(Integer, default=0)
    ipd_count = Column(Integer, default=0)
    emergency_admissions = Column(Integer, default=0)
    discharges = Column(Integer, default=0)
    referrals_out = Column(Integer, default=0)
    avg_wait_time_minutes = Column(Integer, default=30)
    date = Column(Date, default=func.current_date())

    hospital = relationship("Hospital", back_populates="patient_stats")

class InfrastructureIssue(Base):
    __tablename__ = "infrastructure_issues"

    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    issue_type = Column(String, nullable=False)  # Equipment Failure, Plumbing, Electrical, IT, Civil
    department = Column(String, nullable=False)
    priority = Column(String, default="Medium")  # Low, Medium, High, Critical
    status = Column(String, default="Open")  # Open, In Progress, Resolved
    photo_url = Column(String, nullable=True)
    reporter_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=func.now())
    resolved_at = Column(DateTime, nullable=True)

    hospital = relationship("Hospital", back_populates="issues")

class ResourceTransfer(Base):
    __tablename__ = "resource_transfers"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    from_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    to_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, In Transit, Completed, Declined
    distance_km = Column(Float, nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    ai_recommended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())

    item = relationship("Item", back_populates="transfers")
    from_hospital = relationship("Hospital", foreign_keys=[from_hospital_id])
    to_hospital = relationship("Hospital", foreign_keys=[to_hospital_id])
