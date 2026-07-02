import sys
import os
from datetime import date, datetime, timedelta

# Add backend directory to path to enable imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database.connection import engine, SessionLocal, Base
from app.database.models import User, Hospital, Item, Inventory, BedOccupancy, StaffAttendance, PatientStatistics, InfrastructureIssue, ResourceTransfer

def seed():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Seed User
        if db.query(User).count() == 0:
            print("Seeding users...")
            # For the demo, we seed a default superintendent and pharmacist
            db.add_all([
                User(
                    username="superintendent",
                    email="superintendent@aarogya.gov.in",
                    hashed_password="$2b$12$KkQo2uR6z9G/Xk6i1QY2U.mXW2F.Yv8p2P1T1U.Ff8K.y4K1eF6G.", # hashes "password"
                    role="medical_superintendent",
                    hospital_id=1,
                ),
                User(
                    username="pharmacist",
                    email="pharmacist@aarogya.gov.in",
                    hashed_password="$2b$12$KkQo2uR6z9G/Xk6i1QY2U.mXW2F.Yv8p2P1T1U.Ff8K.y4K1eF6G.", # hashes "password"
                    role="pharmacist",
                    hospital_id=1,
                )
            ])
            db.commit()

        # 2. Seed Hospitals
        if db.query(Hospital).count() == 0:
            print("Seeding hospitals...")
            db.add_all([
                Hospital(
                    id=1,
                    name="Primary Health Centre (PHC) Kothrud",
                    registration_no="MH-PUNE-PHC-00347",
                    facility_type="Primary Health Centre (PHC)",
                    district="Pune",
                    taluka="Haveli",
                    address="Plot No. 42, Kothrud Main Road, Near Paud Phata, Kothrud, Pune - 411038",
                    latitude=18.5074,
                    longitude=73.8077,
                    phone="+91-20-2543-8800",
                    email="phc.kothrud@nhm.gov.in",
                    status="Active",
                ),
                Hospital(
                    id=2,
                    name="Community Health Centre (CHC) Warje",
                    registration_no="MH-PUNE-CHC-00109",
                    facility_type="Community Health Centre (CHC)",
                    district="Pune",
                    taluka="Haveli",
                    address="Sr. No. 12, Behind Warje Malwadi Bus Stand, Warje, Pune - 411058",
                    latitude=18.4876,
                    longitude=73.8012,
                    phone="+91-20-2520-4400",
                    email="chc.warje@nhm.gov.in",
                    status="Active",
                ),
                Hospital(
                    id=3,
                    name="Primary Health Centre (PHC) Hadapsar",
                    registration_no="MH-PUNE-PHC-00512",
                    facility_type="Primary Health Centre (PHC)",
                    district="Pune",
                    taluka="Haveli",
                    address="Solapur Road, Near Gadital, Hadapsar, Pune - 411028",
                    latitude=18.5012,
                    longitude=73.9245,
                    phone="+91-20-2687-1100",
                    email="phc.hadapsar@nhm.gov.in",
                    status="Active",
                )
            ])
            db.commit()

        # 3. Seed Items
        if db.query(Item).count() == 0:
            print("Seeding items...")
            db.add_all([
                Item(id=1, name="Paracetamol 500mg", category="Medicines", unit="Tablets"),
                Item(id=2, name="Amoxicillin 250mg", category="Medicines", unit="Tablets"),
                Item(id=3, name="Insulin Glargine", category="Medicines", unit="Units"),
                Item(id=4, name="Oxygen Cylinder (Type D)", category="Oxygen", unit="Cylinders"),
                Item(id=5, name="Blood Unit A+", category="Blood Units", unit="Units"),
                Item(id=6, name="N95 Masks", category="PPE Kits", unit="Pieces"),
                Item(id=7, name="Covishield Dose", category="Vaccines", unit="Doses"),
                Item(id=8, name="Defibrillator Pads", category="Emergency", unit="Pieces")
            ])
            db.commit()

        # 4. Seed Inventory
        if db.query(Inventory).count() == 0:
            print("Seeding inventory...")
            # Seed stock for PHC Kothrud (hospital_id=1)
            db.add_all([
                Inventory(hospital_id=1, item_id=1, current_quantity=120, min_threshold=200, max_capacity=1000, batch_number="B-PR102", expiry_date=date(2027, 3, 15)),
                Inventory(hospital_id=1, item_id=2, current_quantity=380, min_threshold=150, max_capacity=800, batch_number="B-AM509", expiry_date=date(2027, 6, 20)),
                Inventory(hospital_id=1, item_id=3, current_quantity=45, min_threshold=50, max_capacity=200, batch_number="B-IN772", expiry_date=date(2026, 12, 1)),
                Inventory(hospital_id=1, item_id=4, current_quantity=8, min_threshold=15, max_capacity=50, batch_number="B-OX001", expiry_date=None),
                Inventory(hospital_id=1, item_id=5, current_quantity=3, min_threshold=10, max_capacity=30, batch_number="B-BL901", expiry_date=date(2026, 8, 10)),
                Inventory(hospital_id=1, item_id=6, current_quantity=420, min_threshold=100, max_capacity=500, batch_number="B-MS441", expiry_date=date(2028, 1, 1)),
                Inventory(hospital_id=1, item_id=7, current_quantity=180, min_threshold=200, max_capacity=1000, batch_number="B-VC303", expiry_date=date(2026, 11, 30)),
                Inventory(hospital_id=1, item_id=8, current_quantity=12, min_threshold=5, max_capacity=20, batch_number="B-EQ881", expiry_date=date(2027, 9, 1))
            ])
            # Seed some stock for CHC Warje (hospital_id=2) to enable transfers
            db.add_all([
                Inventory(hospital_id=2, item_id=3, current_quantity=620, min_threshold=50, max_capacity=1000, batch_number="B-IN882", expiry_date=date(2027, 1, 1)),
                Inventory(hospital_id=2, item_id=4, current_quantity=35, min_threshold=15, max_capacity=100, batch_number="B-OX002", expiry_date=None)
            ])
            db.commit()

        # 5. Seed Beds
        if db.query(BedOccupancy).count() == 0:
            print("Seeding beds...")
            db.add_all([
                BedOccupancy(hospital_id=1, category="General", total_capacity=80, occupied_count=38, reserved_count=4),
                BedOccupancy(hospital_id=1, category="ICU", total_capacity=20, occupied_count=14, reserved_count=2),
                BedOccupancy(hospital_id=1, category="Emergency", total_capacity=12, occupied_count=8, reserved_count=1),
                BedOccupancy(hospital_id=1, category="Isolation", total_capacity=10, occupied_count=3, reserved_count=0),
                BedOccupancy(hospital_id=1, category="Pediatric", total_capacity=15, occupied_count=6, reserved_count=1),
                BedOccupancy(hospital_id=1, category="Maternity", total_capacity=10, occupied_count=7, reserved_count=1)
            ])
            db.commit()

        # 6. Seed Staff Attendance
        if db.query(StaffAttendance).count() == 0:
            print("Seeding staff attendance...")
            db.add_all([
                StaffAttendance(hospital_id=1, employee_name="Dr. Arjun Mehta", designation="Medical Superintendent", department="General Medicine", shift="Morning", status="Present", check_in_time=datetime.now() - timedelta(hours=4)),
                StaffAttendance(hospital_id=1, employee_name="Dr. Priya Sharma", designation="Senior Doctor", department="ICU", shift="Morning", status="Present", check_in_time=datetime.now() - timedelta(hours=4.2)),
                StaffAttendance(hospital_id=1, employee_name="Dr. Rajesh Kulkarni", designation="Medical Officer", department="Emergency", shift="Night", status="On Leave", check_in_time=None),
                StaffAttendance(hospital_id=1, employee_name="Nurse Anita Desai", designation="Nurse Supervisor", department="General Ward", shift="Morning", status="Present", check_in_time=datetime.now() - timedelta(hours=4.5)),
                StaffAttendance(hospital_id=1, employee_name="Sanjay Patil", designation="Chief Pharmacist", department="Pharmacy", shift="Morning", status="Present", check_in_time=datetime.now() - timedelta(hours=3.8)),
                StaffAttendance(hospital_id=1, employee_name="Dr. Neha Joshi", designation="Junior Doctor", department="Pediatrics", shift="Evening", status="Absent", check_in_time=None),
                StaffAttendance(hospital_id=1, employee_name="Ravi Kumar", designation="Lab Technician", department="Radiology", shift="Morning", status="Present", check_in_time=datetime.now() - timedelta(hours=4.1)),
                StaffAttendance(hospital_id=1, employee_name="Suresh Gade", designation="Ambulance Driver", department="Transport", shift="Morning", status="Present", check_in_time=datetime.now() - timedelta(hours=4.7))
            ])
            db.commit()

        # 7. Seed Patient Statistics
        if db.query(PatientStatistics).count() == 0:
            print("Seeding patient statistics...")
            db.add_all([
                PatientStatistics(hospital_id=1, opd_count=412, ipd_count=67, emergency_admissions=12, discharges=23, referrals_out=5, avg_wait_time_minutes=28)
            ])
            db.commit()

        # 8. Seed Infrastructure Issues
        if db.query(InfrastructureIssue).count() == 0:
            print("Seeding infrastructure issues...")
            db.add_all([
                InfrastructureIssue(
                    hospital_id=1,
                    title="X-Ray Machine Malfunction",
                    description="X-Ray machine in Radiology Department producing blurred images. Emergency patients being redirected.",
                    issue_type="Equipment Failure",
                    department="Radiology",
                    priority="Critical",
                    status="Open",
                    reporter_name="Dr. Priya Sharma",
                ),
                InfrastructureIssue(
                    hospital_id=1,
                    title="Oxygen Pipeline Leak – Ward B",
                    description="Detected a slow leak in the central oxygen pipeline supplying Ward B. Current supply is maintained via portable cylinders.",
                    issue_type="Infrastructure",
                    department="General Ward",
                    priority="Critical",
                    status="In Progress",
                    reporter_name="Nurse Anita Desai",
                ),
                InfrastructureIssue(
                    hospital_id=1,
                    title="Generator Not Starting",
                    description="Backup diesel generator failed to start during morning power outage. Electrician has been notified.",
                    issue_type="Electrical",
                    department="Facilities",
                    priority="High",
                    status="Open",
                    reporter_name="Suresh Gade",
                )
            ])
            db.commit()

        # 9. Seed Resource Transfers
        if db.query(ResourceTransfer).count() == 0:
            print("Seeding resource transfers...")
            db.add_all([
                ResourceTransfer(
                    item_id=3,
                    quantity=250,
                    from_hospital_id=1,
                    to_hospital_id=3,
                    status="Approved",
                    distance_km=4.2,
                    eta_minutes=48,
                    ai_recommended=True,
                ),
                ResourceTransfer(
                    item_id=4,
                    quantity=10,
                    from_hospital_id=2,
                    to_hospital_id=1,
                    status="In Transit",
                    distance_km=3.1,
                    eta_minutes=35,
                    ai_recommended=True,
                )
            ])
            db.commit()

        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
