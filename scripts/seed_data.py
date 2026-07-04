"""
AarogyaOne — Palghar District Seed Data
=========================================
Seeds the SQLite (local dev) / Supabase (production) database with
all 29 real government health facilities of Palghar District, Maharashtra.
"""
import sys
import os
from datetime import date, datetime, timedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.database.connection import engine, SessionLocal, Base
from app.database.models import (
    User, Hospital, Item, Inventory, BedOccupancy,
    StaffAttendance, PatientStatistics, InfrastructureIssue
)

# ---------------------------------------------------------------------------
# Palghar Hospital Registry (mirrors frontend/src/data/palgharHospitals.ts)
# ---------------------------------------------------------------------------
PALGHAR_HOSPITALS = [
    # ── Palghar Taluka ─────────────────────────────────────────────────────
    dict(id=1,  name="District General Hospital Palghar",   registration_no="MH-PGR-DGH-00001", facility_type="District General Hospital",         district="Palghar", taluka="Palghar",   address="Civil Hospital Road, Near Collectorate, Palghar - 401404", latitude=19.6967, longitude=72.7677, phone="02525-252021", email="dgh.palghar@nhm.gov.in",   total_beds=200, icu_capacity=20, has_laboratory=True,  has_ambulance=True,  status="Active", health_score=78.0),
    dict(id=2,  name="Sub-District Hospital Palghar",       registration_no="MH-PGR-SDH-00002", facility_type="Sub-District Hospital",               district="Palghar", taluka="Palghar",   address="Station Road, Palghar West, Palghar - 401404",              latitude=19.7012, longitude=72.7710, phone="02525-252200", email="sdh.palghar@nhm.gov.in",   total_beds=100, icu_capacity=10, has_laboratory=True,  has_ambulance=True,  status="Active", health_score=72.0),
    dict(id=3,  name="Rural Hospital Manor",                registration_no="MH-PGR-RH-00003",  facility_type="Rural Hospital",                      district="Palghar", taluka="Palghar",   address="Manor Village, NH-48, Near Manor Naka, Palghar - 401403",  latitude=19.7519, longitude=72.9183, phone="02525-268100", email="rh.manor@nhm.gov.in",       total_beds=30,  icu_capacity=4,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=65.0),
    dict(id=4,  name="Primary Health Centre Agashi",        registration_no="MH-PGR-PHC-00004", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Palghar",   address="Agashi Village, Near Agashi Beach Road, Palghar - 401301", latitude=19.5897, longitude=72.7234, phone="02525-224100", email="phc.agashi@nhm.gov.in",    total_beds=10,  icu_capacity=0,  has_laboratory=True,  has_ambulance=False, status="Active", health_score=55.0),
    dict(id=5,  name="Primary Health Centre Nandgaon",      registration_no="MH-PGR-PHC-00005", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Palghar",   address="Nandgaon Road, Nandgaon Village, Palghar - 401404",        latitude=19.7310, longitude=72.7900, phone="02525-266300", email="phc.nandgaon@nhm.gov.in",  total_beds=10,  icu_capacity=0,  has_laboratory=True,  has_ambulance=False, status="Active", health_score=60.0),
    dict(id=6,  name="Primary Health Centre Saphala",       registration_no="MH-PGR-PHC-00006", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Palghar",   address="Saphala Village, Old Tarapur Road, Palghar - 401501",       latitude=19.6654, longitude=72.8012, phone="02525-241200", email="phc.saphala@nhm.gov.in",   total_beds=10,  icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=50.0),
    # ── Vasai Taluka ───────────────────────────────────────────────────────
    dict(id=7,  name="Sub-District Hospital Vasai",         registration_no="MH-PGR-SDH-00007", facility_type="Sub-District Hospital",               district="Palghar", taluka="Vasai",     address="Vasai Road West, Near Municipal Office, Vasai - 401202",   latitude=19.3758, longitude=72.8255, phone="0250-2339100",  email="sdh.vasai@nhm.gov.in",     total_beds=100, icu_capacity=10, has_laboratory=True,  has_ambulance=True,  status="Active", health_score=74.0),
    dict(id=8,  name="Rural Hospital Virar",                registration_no="MH-PGR-RH-00008",  facility_type="Rural Hospital",                      district="Palghar", taluka="Vasai",     address="Virar West, Near Virar Station, Vasai - 401303",           latitude=19.4560, longitude=72.8120, phone="0250-2504100",  email="rh.virar@nhm.gov.in",       total_beds=30,  icu_capacity=4,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=68.0),
    dict(id=9,  name="Primary Health Centre Navghar",       registration_no="MH-PGR-PHC-00009", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Vasai",     address="Navghar Road, Vasai East, Vasai - 401209",                 latitude=19.3681, longitude=72.8543, phone="0250-2312200",  email="phc.navghar@nhm.gov.in",   total_beds=10,  icu_capacity=0,  has_laboratory=True,  has_ambulance=False, status="Active", health_score=62.0),
    dict(id=10, name="Primary Health Centre Manickpur",     registration_no="MH-PGR-PHC-00010", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Vasai",     address="Manickpur Village, Vasai Virar Road, Vasai - 401202",      latitude=19.3900, longitude=72.8340, phone="0250-2351100",  email="phc.manickpur@nhm.gov.in", total_beds=10,  icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=58.0),
    dict(id=11, name="Primary Health Centre Pelhar",        registration_no="MH-PGR-PHC-00011", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Vasai",     address="Pelhar Village, Pelhar Road, Nalasopara East - 401209",    latitude=19.4238, longitude=72.8453, phone="0250-2491000",  email="phc.pelhar@nhm.gov.in",    total_beds=10,  icu_capacity=0,  has_laboratory=True,  has_ambulance=False, status="Active", health_score=57.0),
    # ── Dahanu Taluka ──────────────────────────────────────────────────────
    dict(id=12, name="Rural Hospital Dahanu",               registration_no="MH-PGR-RH-00012",  facility_type="Rural Hospital",                      district="Palghar", taluka="Dahanu",    address="Dahanu Road, Near Dahanu Railway Station, Dahanu - 401602",latitude=19.9658, longitude=72.7193, phone="02528-222100", email="rh.dahanu@nhm.gov.in",      total_beds=50,  icu_capacity=6,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=63.0),
    dict(id=13, name="Primary Health Centre Bordi",         registration_no="MH-PGR-PHC-00013", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Dahanu",    address="Bordi Beach Road, Bordi Village, Dahanu - 401701",         latitude=20.0561, longitude=72.7461, phone="02528-287200", email="phc.bordi@nhm.gov.in",     total_beds=10,  icu_capacity=0,  has_laboratory=True,  has_ambulance=False, status="Active", health_score=54.0),
    dict(id=14, name="Primary Health Centre Kaman",         registration_no="MH-PGR-PHC-00014", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Dahanu",    address="Kaman Village, Kaman Road, Dahanu - 401603",               latitude=19.9870, longitude=72.8010, phone="02528-241100", email="phc.kaman@nhm.gov.in",     total_beds=10,  icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=49.0),
    dict(id=15, name="Primary Health Centre Vangaon",       registration_no="MH-PGR-PHC-00015", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Dahanu",    address="Vangaon Station Road, Near Vangaon Railway Station - 401104",latitude=19.9100,longitude=72.7420, phone="02528-254300", email="phc.vangaon@nhm.gov.in",   total_beds=10,  icu_capacity=0,  has_laboratory=True,  has_ambulance=False, status="Active", health_score=52.0),
    # ── Talasari Taluka ────────────────────────────────────────────────────
    dict(id=16, name="Rural Hospital Talasari",             registration_no="MH-PGR-RH-00016",  facility_type="Rural Hospital",                      district="Palghar", taluka="Talasari",  address="Talasari Village, Main Road, Talasari - 401606",           latitude=20.1648, longitude=72.8256, phone="02529-271100", email="rh.talasari@nhm.gov.in",   total_beds=30,  icu_capacity=4,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=61.0),
    dict(id=17, name="Primary Health Centre Zai",           registration_no="MH-PGR-PHC-00017", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Talasari",  address="Zai Village, Talasari Taluka, Palghar - 401602",           latitude=20.1100, longitude=72.8100, phone="02529-255100", email="phc.zai@nhm.gov.in",       total_beds=10,  icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=48.0),
    dict(id=18, name="Primary Health Centre Aaos",          registration_no="MH-PGR-PHC-00018", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Talasari",  address="Aaos Village, Talasari, Palghar - 401606",                 latitude=20.1950, longitude=72.8400, phone="02529-263100", email="phc.aaos@nhm.gov.in",      total_beds=6,   icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=46.0),
    # ── Wada Taluka ────────────────────────────────────────────────────────
    dict(id=19, name="Rural Hospital Wada",                 registration_no="MH-PGR-RH-00019",  facility_type="Rural Hospital",                      district="Palghar", taluka="Wada",      address="Wada Bus Stand Road, Near Wada Town Centre, Wada - 421303",latitude=19.6647, longitude=73.1760, phone="02526-242100", email="rh.wada@nhm.gov.in",        total_beds=30,  icu_capacity=4,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=64.0),
    dict(id=20, name="Primary Health Centre Khardi",        registration_no="MH-PGR-PHC-00020", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Wada",      address="Khardi Village, Wada Taluka, Palghar - 421303",            latitude=19.6200, longitude=73.2100, phone="02526-261100", email="phc.khardi@nhm.gov.in",    total_beds=10,  icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=51.0),
    dict(id=21, name="Primary Health Centre Sativali",      registration_no="MH-PGR-PHC-00021", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Wada",      address="Sativali Village, Near Sativali Bus Stop, Wada - 421303",  latitude=19.7000, longitude=73.1500, phone="02526-278200", email="phc.sativali@nhm.gov.in",  total_beds=10,  icu_capacity=0,  has_laboratory=True,  has_ambulance=False, status="Active", health_score=56.0),
    # ── Vikramgad Taluka ───────────────────────────────────────────────────
    dict(id=22, name="Rural Hospital Vikramgad",            registration_no="MH-PGR-RH-00022",  facility_type="Rural Hospital",                      district="Palghar", taluka="Vikramgad", address="Vikramgad Town, Main Market Road, Vikramgad - 401605",     latitude=19.8381, longitude=73.0619, phone="02527-222100", email="rh.vikramgad@nhm.gov.in",  total_beds=30,  icu_capacity=4,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=59.0),
    dict(id=23, name="Primary Health Centre Dhansar",       registration_no="MH-PGR-PHC-00023", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Vikramgad", address="Dhansar Village, Vikramgad Road, Palghar - 401605",        latitude=19.8600, longitude=73.0900, phone="02527-238100", email="phc.dhansar@nhm.gov.in",   total_beds=6,   icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=44.0),
    # ── Jawhar Taluka ──────────────────────────────────────────────────────
    dict(id=24, name="Sub-District Hospital Jawhar",        registration_no="MH-PGR-SDH-00024", facility_type="Sub-District Hospital",               district="Palghar", taluka="Jawhar",    address="Jawhar Town, Hospital Road, Near Jawhar Palace - 401603",  latitude=19.9038, longitude=73.2265, phone="02520-222150", email="sdh.jawhar@nhm.gov.in",    total_beds=50,  icu_capacity=6,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=67.0),
    dict(id=25, name="Primary Health Centre Khodala",       registration_no="MH-PGR-PHC-00025", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Jawhar",    address="Khodala Village, Jawhar Taluka, Palghar - 401603",         latitude=19.9600, longitude=73.2600, phone="02520-251100", email="phc.khodala@nhm.gov.in",   total_beds=10,  icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=47.0),
    dict(id=26, name="Primary Health Centre Dabhon",        registration_no="MH-PGR-PHC-00026", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Jawhar",    address="Dabhon Village, Jawhar Taluka, Palghar - 401603",          latitude=19.8800, longitude=73.1900, phone="02520-261400", email="phc.dabhon@nhm.gov.in",    total_beds=6,   icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=45.0),
    # ── Mokhada Taluka ─────────────────────────────────────────────────────
    dict(id=27, name="Rural Hospital Mokhada",              registration_no="MH-PGR-RH-00027",  facility_type="Rural Hospital",                      district="Palghar", taluka="Mokhada",   address="Mokhada Town, Hospital Chowk, Mokhada - 401604",           latitude=19.9700, longitude=73.3570, phone="02533-222100", email="rh.mokhada@nhm.gov.in",    total_beds=30,  icu_capacity=4,  has_laboratory=True,  has_ambulance=True,  status="Active", health_score=60.0),
    dict(id=28, name="Primary Health Centre Eklahare",      registration_no="MH-PGR-PHC-00028", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Mokhada",   address="Eklahare Village, Mokhada Taluka, Palghar - 401604",       latitude=19.9500, longitude=73.3900, phone="02533-244100", email="phc.eklahare@nhm.gov.in",  total_beds=6,   icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=43.0),
    dict(id=29, name="Primary Health Centre Umberpada",     registration_no="MH-PGR-PHC-00029", facility_type="Primary Health Centre (PHC)",          district="Palghar", taluka="Mokhada",   address="Umberpada Village, Mokhada, Palghar - 401604",             latitude=20.0100, longitude=73.3200, phone="02533-258100", email="phc.umberpada@nhm.gov.in", total_beds=6,   icu_capacity=0,  has_laboratory=False, has_ambulance=False, status="Active", health_score=42.0),
]

def seed():
    print("=" * 60)
    print("AarogyaOne - Palghar District Seed")
    print("=" * 60)
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 1. Hospitals
        if db.query(Hospital).count() == 0:
            print(f"Seeding {len(PALGHAR_HOSPITALS)} Palghar hospitals...")
            db.add_all([Hospital(**h) for h in PALGHAR_HOSPITALS])
            db.commit()
            print("  [OK] Hospitals seeded")
        else:
            print("  [SKIP] Hospitals already seeded, skipping.")

        # 2. Demo users (linked to DGH Palghar, hospital_id=1)
        if db.query(User).count() == 0:
            print("Seeding demo users...")
            db.add_all([
                User(firebase_uid="mock-superintendent-uid", email="superintendent@aarogya.gov.in",
                     full_name="Dr. Arjun Mehta", role="medical_superintendent", hospital_id=1),
                User(firebase_uid="mock-pharmacist-uid", email="pharmacist@aarogya.gov.in",
                     full_name="Sanjay Patil", role="pharmacist", hospital_id=1),
                User(firebase_uid="mock-dho-uid", email="dho@palghar.gov.in",
                     full_name="Dr. Rajesh Patil", role="district_health_officer", district="Palghar"),
            ])
            db.commit()
            print("  [OK] Users seeded")

        # 3. Items (medicines / resources)
        if db.query(Item).count() == 0:
            print("Seeding item master list...")
            db.add_all([
                Item(id=1, name="Paracetamol 500mg",           category="Medicines",   unit="Tablets"),
                Item(id=2, name="Amoxicillin 250mg",           category="Medicines",   unit="Tablets"),
                Item(id=3, name="Insulin Glargine",            category="Medicines",   unit="Units"),
                Item(id=4, name="ORS Packets",                 category="Medicines",   unit="Packets"),
                Item(id=5, name="Cotrimoxazole 480mg",         category="Medicines",   unit="Tablets"),
                Item(id=6, name="Oxygen Cylinder (Type D)",    category="Oxygen",      unit="Cylinders"),
                Item(id=7, name="Blood Unit A+",               category="Blood Units", unit="Units"),
                Item(id=8, name="Blood Unit O+",               category="Blood Units", unit="Units"),
                Item(id=9, name="N95 Masks",                   category="PPE Kits",    unit="Pieces"),
                Item(id=10, name="Disposable Gloves (Box)",    category="PPE Kits",    unit="Boxes"),
                Item(id=11, name="Covishield Dose",            category="Vaccines",    unit="Doses"),
                Item(id=12, name="Defibrillator Pads",         category="Emergency",   unit="Pieces"),
            ])
            db.commit()
            print("  [OK] Items seeded")

        # 4. Inventory for DGH Palghar (id=1) and SDH Vasai (id=7)
        if db.query(Inventory).count() == 0:
            print("Seeding inventory for key hospitals...")
            db.add_all([
                # DGH Palghar
                Inventory(hospital_id=1, item_id=1, current_quantity=850,  min_threshold=500, max_capacity=3000, batch_number="B-PR102", expiry_date=date(2027, 3, 15)),
                Inventory(hospital_id=1, item_id=2, current_quantity=420,  min_threshold=200, max_capacity=1500, batch_number="B-AM509", expiry_date=date(2027, 6, 20)),
                Inventory(hospital_id=1, item_id=3, current_quantity=60,   min_threshold=80,  max_capacity=400,  batch_number="B-IN772", expiry_date=date(2026, 12, 1)),
                Inventory(hospital_id=1, item_id=4, current_quantity=30,   min_threshold=100, max_capacity=500,  batch_number="B-ORS01", expiry_date=date(2027, 8, 1)),
                Inventory(hospital_id=1, item_id=6, current_quantity=22,   min_threshold=20,  max_capacity=100,  batch_number="B-OX001"),
                Inventory(hospital_id=1, item_id=7, current_quantity=8,    min_threshold=15,  max_capacity=50,   batch_number="B-BL001", expiry_date=date(2026, 9, 1)),
                Inventory(hospital_id=1, item_id=9, current_quantity=650,  min_threshold=200, max_capacity=1000, batch_number="B-MS441", expiry_date=date(2028, 1, 1)),
                Inventory(hospital_id=1, item_id=11, current_quantity=240, min_threshold=300, max_capacity=2000, batch_number="B-VC303", expiry_date=date(2026, 11, 30)),
                Inventory(hospital_id=1, item_id=12, current_quantity=15,  min_threshold=5,   max_capacity=30,   batch_number="B-EQ881", expiry_date=date(2027, 9, 1)),
                # PHC Agashi (id=4)
                Inventory(hospital_id=4, item_id=1, current_quantity=0,   min_threshold=100, max_capacity=500,  batch_number="B-A001"), # Critical stockout
                Inventory(hospital_id=4, item_id=4, current_quantity=0,   min_threshold=50,  max_capacity=200,  batch_number="B-A002"), # ORS also out
                Inventory(hospital_id=4, item_id=5, current_quantity=45,  min_threshold=50,  max_capacity=200,  batch_number="B-A003", expiry_date=date(2027, 1, 1)),
                # SDH Vasai (id=7)
                Inventory(hospital_id=7, item_id=1, current_quantity=380,  min_threshold=200, max_capacity=1200, batch_number="B-V001", expiry_date=date(2027, 5, 1)),
                Inventory(hospital_id=7, item_id=6, current_quantity=12,   min_threshold=15,  max_capacity=60,   batch_number="B-V002"),
                Inventory(hospital_id=7, item_id=9, current_quantity=280,  min_threshold=100, max_capacity=600,  batch_number="B-V003", expiry_date=date(2028, 1, 1)),
            ])
            db.commit()
            print("  [OK] Inventory seeded")

        # 5. Bed occupancy for major hospitals
        if db.query(BedOccupancy).count() == 0:
            print("Seeding bed occupancy...")
            db.add_all([
                BedOccupancy(hospital_id=1, category="General",    total_capacity=140, occupied_count=98,  reserved_count=10),
                BedOccupancy(hospital_id=1, category="ICU",        total_capacity=20,  occupied_count=17,  reserved_count=2),
                BedOccupancy(hospital_id=1, category="Emergency",  total_capacity=20,  occupied_count=12,  reserved_count=2),
                BedOccupancy(hospital_id=1, category="Maternity",  total_capacity=20,  occupied_count=14,  reserved_count=1),
                BedOccupancy(hospital_id=7, category="General",    total_capacity=70,  occupied_count=42,  reserved_count=5),
                BedOccupancy(hospital_id=7, category="ICU",        total_capacity=10,  occupied_count=7,   reserved_count=1),
                BedOccupancy(hospital_id=12, category="General",   total_capacity=35,  occupied_count=22,  reserved_count=3),
                BedOccupancy(hospital_id=24, category="General",   total_capacity=35,  occupied_count=18,  reserved_count=2),
            ])
            db.commit()
            print("  [OK] Beds seeded")

        # 6. Staff attendance for DGH Palghar
        if db.query(StaffAttendance).count() == 0:
            print("Seeding staff attendance...")
            db.add_all([
                StaffAttendance(hospital_id=1, employee_name="Dr. Arjun Mehta",     employee_id="EMP001", designation="Medical Superintendent", department="General Medicine", shift="Morning", status="Present",  check_in_time=datetime.now()-timedelta(hours=4)),
                StaffAttendance(hospital_id=1, employee_name="Dr. Priya Sharma",    employee_id="EMP002", designation="Senior Doctor",          department="ICU",             shift="Morning", status="Present",  check_in_time=datetime.now()-timedelta(hours=4.2)),
                StaffAttendance(hospital_id=1, employee_name="Dr. Rajesh Kulkarni", employee_id="EMP003", designation="Medical Officer",         department="Emergency",       shift="Night",   status="On Leave", check_in_time=None),
                StaffAttendance(hospital_id=1, employee_name="Nurse Anita Desai",   employee_id="EMP004", designation="Nurse Supervisor",        department="General Ward",    shift="Morning", status="Present",  check_in_time=datetime.now()-timedelta(hours=4.5)),
                StaffAttendance(hospital_id=1, employee_name="Sanjay Patil",        employee_id="EMP005", designation="Chief Pharmacist",        department="Pharmacy",        shift="Morning", status="Present",  check_in_time=datetime.now()-timedelta(hours=3.8)),
                StaffAttendance(hospital_id=1, employee_name="Dr. Neha Joshi",      employee_id="EMP006", designation="Junior Doctor",           department="Pediatrics",      shift="Evening", status="Absent",   check_in_time=None),
                StaffAttendance(hospital_id=1, employee_name="Ravi Kumar",          employee_id="EMP007", designation="Lab Technician",          department="Radiology",       shift="Morning", status="Present",  check_in_time=datetime.now()-timedelta(hours=4.1)),
            ])
            db.commit()
            print("  [OK] Staff seeded")

        # 7. Infrastructure issues
        if db.query(InfrastructureIssue).count() == 0:
            print("Seeding infrastructure issues...")
            db.add_all([
                InfrastructureIssue(hospital_id=1, title="Generator Not Starting", description="Backup diesel generator failed during morning power outage. ICU on manual backup.", issue_type="Electrical", department="Facilities", priority="Critical", status="Open", reporter_name="Suresh Gade", ai_category="Electrical / MSEDCL", ai_severity="Critical", ai_assigned_department="Electricity Board", ai_confidence=92.5),
                InfrastructureIssue(hospital_id=7, title="Roof Leakage in Ward B",  description="Water leaking from roof in Ward B during rain. Patients shifted.", issue_type="Civil", department="General Ward", priority="High", status="In Progress", reporter_name="Ward Nurse", ai_category="PWD / Civil", ai_severity="High", ai_assigned_department="Public Works Department", ai_confidence=88.0),
            ])
            db.commit()
            print("  [OK] Infrastructure issues seeded")

        print("\n[SUCCESS] Palghar district seed completed successfully!")
        print(f"   {len(PALGHAR_HOSPITALS)} hospitals across 8 talukas loaded.")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seed failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
