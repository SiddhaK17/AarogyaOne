"""
AarogyaOne Hackathon Comprehensive Database Seeding Script
==========================================================
Populates SQLite/Supabase with realistic hospitals, inventory, beds,
staff attendance, citizen grievances, infrastructure issues, and PWD/Govt tasks.
Run via: python -m scripts.seed_hackathon_data
"""

import sys
import os
from datetime import datetime, date, timedelta

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import SessionLocal, engine, Base
from app.database import models

def seed_database():
    print("[INIT] Initializing AarogyaOne Hackathon Database Seeder...")
    print("[INIT] Recreating database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Clear existing hackathon demo data if present
        print("[CLEAN] Cleaning previous demo records...")
        db.query(models.TaskProgressLog).delete()
        db.query(models.GovernmentTask).delete()
        db.query(models.ComplaintMedia).delete()
        db.query(models.ComplaintTracking).delete()
        db.query(models.CitizenComplaint).delete()
        db.query(models.ResourceTransfer).delete()
        db.query(models.InfrastructureIssue).delete()
        db.query(models.AIRecommendation).delete()
        db.query(models.PatientStatistics).delete()
        db.query(models.StaffAttendance).delete()
        db.query(models.BedOccupancy).delete()
        db.query(models.Inventory).delete()
        db.query(models.Item).delete()
        db.query(models.Hospital).delete()
        db.commit()

        # 2. Seed 6 Major District Hospitals in Palghar / Maharashtra
        print("[SEED] Seeding District Hospitals & Healthcare Centres...")
        hospitals_data = [
            models.Hospital(
                name="District Hospital Palghar", registration_no="MH-PLG-001", facility_type="District Hospital",
                district="Palghar", taluka="Palghar", address="Kacheri Road, Palghar West, Maharashtra 401404",
                latitude=19.6967, longitude=72.7699, phone="02525-252100", email="dh.palghar@maharashtra.gov.in",
                total_beds=250, icu_capacity=30, has_laboratory=True, has_ambulance=True, status="Active", health_score=94.5
            ),
            models.Hospital(
                name="Rural Hospital Manor", registration_no="MH-MNR-002", facility_type="CHC",
                district="Palghar", taluka="Palghar", address="Manor Highway Junction, Manor 401403",
                latitude=19.7420, longitude=72.9080, phone="02525-263200", email="rh.manor@maharashtra.gov.in",
                total_beds=80, icu_capacity=10, has_laboratory=True, has_ambulance=True, status="Active", health_score=88.2
            ),
            models.Hospital(
                name="Sub-District Hospital Kasa", registration_no="MH-KSA-003", facility_type="Sub-District Hospital",
                district="Palghar", taluka="Dahanu", address="Mumbai-Ahmedabad NH-48, Kasa 401602",
                latitude=19.9830, longitude=72.9330, phone="02528-242111", email="sdh.kasa@maharashtra.gov.in",
                total_beds=120, icu_capacity=15, has_laboratory=True, has_ambulance=True, status="Active", health_score=91.0
            ),
            models.Hospital(
                name="Primary Health Centre Jawhar", registration_no="MH-JWH-004", facility_type="PHC",
                district="Palghar", taluka="Jawhar", address="Hill Station Road, Jawhar 401603",
                latitude=19.9050, longitude=73.2330, phone="02520-222300", email="phc.jawhar@maharashtra.gov.in",
                total_beds=40, icu_capacity=4, has_laboratory=False, has_ambulance=True, status="Active", health_score=82.4
            ),
            models.Hospital(
                name="CHC Dahanu", registration_no="MH-DHN-005", facility_type="CHC",
                district="Palghar", taluka="Dahanu", address="Irani Road, Dahanu Beach Road 401601",
                latitude=19.9700, longitude=72.7300, phone="02528-222400", email="chc.dahanu@maharashtra.gov.in",
                total_beds=100, icu_capacity=12, has_laboratory=True, has_ambulance=True, status="Active", health_score=89.7
            ),
            models.Hospital(
                name="PHC Mokhada", registration_no="MH-MKD-006", facility_type="PHC",
                district="Palghar", taluka="Mokhada", address="Main Bazaar, Mokhada 401604",
                latitude=19.9330, longitude=73.3450, phone="02520-233111", email="phc.mokhada@maharashtra.gov.in",
                total_beds=30, icu_capacity=2, has_laboratory=False, has_ambulance=False, status="Active", health_score=78.5
            )
        ]
        db.add_all(hospitals_data)
        db.commit()

        # Retrieve hospital IDs
        hospitals = db.query(models.Hospital).all()
        h_map = {h.name: h.id for h in hospitals}

        # 3. Seed Master Inventory Items
        print("[SEED] Seeding Medicine & Supply Catalog...")
        items_data = [
            models.Item(name="Amoxicillin 250mg Syrup", category="Medicines", unit="Bottles", description="Broad spectrum antibiotic syrup for pediatric care."),
            models.Item(name="Paracetamol 500mg Tablets", category="Medicines", unit="Strips", description="Standard antipyretic and analgesic."),
            models.Item(name="Medical Oxygen Cylinders (D-Type)", category="Oxygen", unit="Cylinders", description="High-pressure medical oxygen for ICU."),
            models.Item(name="Anti-Rabies Vaccine (ARV)", category="Vaccines", unit="Vials", description="Post-exposure prophylaxis for animal bites."),
            models.Item(name="Anti-Snake Venom (ASV Polyvalent)", category="Vaccines", unit="Vials", description="Life-saving serum for venomous snake bites."),
            models.Item(name="Insulin Glargine 100 IU/ml", category="Medicines", unit="Vials", description="Long-acting basal insulin."),
            models.Item(name="Normal Saline 0.9% IV Fluid", category="Consumables", unit="Bags", description="500ml sterile isotonic solution."),
            models.Item(name="PPE Kits (Level 3 Full Body)", category="PPE", unit="Kits", description="Complete protective gear for infectious wards."),
            models.Item(name="Azithromycin 500mg Tablets", category="Medicines", unit="Strips", description="Macrolide antibiotic for respiratory infections."),
            models.Item(name="Cetirizine 10mg Tablets", category="Medicines", unit="Strips", description="Antihistamine for allergic reactions.")
        ]
        db.add_all(items_data)
        db.commit()

        items = db.query(models.Item).all()

        # 4. Seed Hospital Inventory Stocks
        print("[SEED] Populating Hospital Inventory Levels...")
        inv_records = []
        for h in hospitals:
            for idx, item in enumerate(items):
                # Make Jawhar and Mokhada have low stock on ARV & ASV to trigger AI alerts
                qty = 450 - (idx * 30)
                if ("Jawhar" in h.name or "Mokhada" in h.name) and "Vaccine" in item.name:
                    qty = 12 # Critical shortage!
                elif "Palghar" in h.name:
                    qty = 850 # Surplus at District Command!

                inv_records.append(models.Inventory(
                    hospital_id=h.id, item_id=item.id, current_quantity=qty,
                    min_threshold=50, max_capacity=1000, batch_number=f"BATCH-{202600+idx}",
                    expiry_date=date.today() + timedelta(days=365),
                    predicted_stockout_days=4.5 if qty < 30 else 45.0,
                    recommended_restock_qty=200 if qty < 30 else 0
                ))
        db.add_all(inv_records)

        # 5. Seed Bed Occupancy
        print("[SEED] Populating Live Bed Occupancy...")
        bed_categories = [
            ("General Ward", 120, 95), ("ICU Ward", 20, 18),
            ("Pediatric Ward", 40, 32), ("Maternity Ward", 35, 28),
            ("Emergency / Trauma", 25, 22), ("Isolation Ward", 10, 3)
        ]
        for h in hospitals:
            for cat, total, occ in bed_categories:
                scale = 0.4 if "PHC" in h.name else (0.7 if "CHC" in h.name else 1.0)
                db.add(models.BedOccupancy(
                    hospital_id=h.id, category=cat, total_capacity=int(total * scale),
                    occupied_count=int(occ * scale), reserved_count=2,
                    predicted_occupancy_tomorrow=88.5
                ))

        # 6. Seed Staff Attendance
        print("[SEED] Populating Staff & Attendance...")
        staff_list = [
            ("Dr. Rajesh Mehta", "Doctor", "General Medicine", "Present"),
            ("Dr. Ananya Sharma", "Doctor", "Pediatrics", "Present"),
            ("Sister Sunita Patil", "Nurse", "ICU Ward", "Present"),
            ("Anil Deshmukh", "Lab Technician", "Pathology Lab", "Present"),
            ("Priya Nair", "Pharmacist", "Medical Store", "Present"),
            ("Dr. Vikram Rathod", "Doctor", "Surgery / Trauma", "Emergency")
        ]
        for h in hospitals[:4]:
            for name, desig, dept, status in staff_list:
                db.add(models.StaffAttendance(
                    hospital_id=h.id, employee_name=name, designation=desig,
                    department=dept, shift="Morning", status=status,
                    check_in_time=datetime.now() - timedelta(hours=4), date=date.today()
                ))

        # 7. Seed Citizen Grievances
        print("[SEED] Populating Citizen Grievances & AI Triage...")
        complaints = [
            models.CitizenComplaint(
                reference_number="ARP-2026-8801", hospital_id=h_map["Primary Health Centre Jawhar"],
                contact_info="Suresh More (9823001122)",
                category="Medicine Not Available",
                description="My son was bitten by a stray dog in Jawhar. The PHC staff informed us that ARV vials are completely out of stock and asked us to travel 60km to Palghar.",
                status="In Progress",
                ai_category="Medicine Shortage", ai_severity="Critical", ai_sentiment="Negative",
                ai_metadata={"summary": "Urgent stock-out of ARV vaccine at Jawhar PHC requiring immediate district redistribution."}
            ),
            models.CitizenComplaint(
                reference_number="ARP-2026-8802", hospital_id=h_map["Sub-District Hospital Kasa"],
                contact_info="Meena Gaikwad (9823003344)",
                category="Infrastructure",
                description="There was a power cut at 2 AM and the backup generator took over 45 minutes to start. The emergency ward lights were out.",
                status="Received",
                ai_category="Equipment Failure", ai_severity="High", ai_sentiment="Negative",
                ai_metadata={"summary": "Generator maintenance issue at SDH Kasa causing dangerous delay in backup power."}
            ),
            models.CitizenComplaint(
                reference_number="ARP-2026-8803", hospital_id=h_map["District Hospital Palghar"],
                contact_info="Amitabh Verma (9823005566)",
                category="Staff / Service",
                description="Waited over 2.5 hours just to get the OPD case paper. Only two registration windows were open despite heavy morning rush.",
                status="Resolved",
                ai_category="OPD Bottleneck", ai_severity="Medium", ai_sentiment="Neutral",
                ai_metadata={"summary": "OPD bottleneck due to insufficient staff windows at peak hours."}
            )
        ]
        db.add_all(complaints)
        db.commit()

        c_items = db.query(models.CitizenComplaint).all()
        c_id = c_items[0].id if c_items else 1

        # 8. Seed Government Authority Tasks
        print("[SEED] Populating Government Authority Infrastructure Work Orders...")
        govt_tasks = [
            models.GovernmentTask(
                source_type="complaint", source_id=c_id,
                hospital_id=h_map["Sub-District Hospital Kasa"],
                title="Emergency Diesel Generator Overhaul & Automatic Transfer Switch Repair",
                description="Following automated AI monitoring alerts and citizen grievances, the backup 125kVA diesel generator requires immediate inspection of fuel pumps and relay switches.",
                assigned_department="Public Works Department (PWD)",
                priority="Critical", status="Work in Progress",
                due_date=datetime.now() + timedelta(days=2),
                completion_notes="Dispatch PWD electrical division team with spare relay contactors."
            ),
            models.GovernmentTask(
                source_type="infrastructure_issue", source_id=c_id,
                hospital_id=h_map["District Hospital Palghar"],
                title="ICU Multiparameter Monitor Calibration & Sensor Replacement",
                description="Routine quarterly biomedical calibration check for 8 ICU patient monitors in Bed Bay B.",
                assigned_department="Biomedical Engineering Team",
                priority="High", status="Pending",
                due_date=datetime.now() + timedelta(days=5),
                completion_notes="Verify SpO2 and NIBP module drift against standard calibration simulator."
            ),
            models.GovernmentTask(
                source_type="complaint", source_id=c_id,
                hospital_id=h_map["Primary Health Centre Jawhar"],
                title="Emergency Cold Chain Vaccine Delivery (ARV & ASV Polyvalent)",
                description="AI inventory forecasting detected severe stock depletion of Anti-Rabies Vaccine at PHC Jawhar. Initiate cold chain transport from District Depot.",
                assigned_department="District Medical Store",
                priority="Critical", status="Completed",
                due_date=datetime.now() - timedelta(days=1),
                completion_notes="Transfer 50 vials of ARV from Palghar District Hospital surplus."
            )
        ]
        db.add_all(govt_tasks)

        # 9. Seed AI Recommendations for DHIC Command
        print("[SEED] Populating AI Decision Support Recommendations...")
        recommendations = [
            models.AIRecommendation(
                hospital_id=h_map["Primary Health Centre Jawhar"],
                recommendation_type="transfer",
                title="AI Stock Redistribution: Transfer ARV from Palghar to Jawhar",
                description="OR-Tools optimization route identified 50 surplus vials of Anti-Rabies Vaccine at District Hospital Palghar. Reallocating to PHC Jawhar resolves 100% of predicted stockout risk.",
                confidence=0.96, is_actioned=False,
                supporting_data={"action_taken": "Waiting for DHO Approval"}
            ),
            models.AIRecommendation(
                hospital_id=h_map["Rural Hospital Manor"],
                recommendation_type="restock",
                title="Predictive Bed Surge Warning: Highway Accident Corridor",
                description="Weekend traffic volume density indicates 35% higher trauma admission probability at Manor Highway CHC. Recommend keeping 4 emergency reserve beds on standby.",
                confidence=0.89, is_actioned=True,
                supporting_data={"action_taken": "4 Trauma beds reserved by Chief Medical Officer"}
            )
        ]
        db.add_all(recommendations)

        db.commit()
        print("\n[SUCCESS] AarogyaOne Hackathon Database fully seeded with 100+ live operational records across all 5 portals!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {str(e)}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
