"""
ArogyaOne — Hospital Health Score Dataset Generator (Upgraded)
Produces synthetic operational snapshots for training the XGBoost scoring model.

Upgraded to include:
- Realistic temporal behaviors (deterioration, slow recovery)
- Correlated features (OPD load drives occupancy, which drives medicine shortages)
- Major operational events (Monsoon, Dengue, Heatwaves, Power Failures)
- Wide health score distribution (20–98)
- Strict adherence to operational boundaries (no negative values, percentages 0-1)
"""

import numpy as np
import pandas as pd
from datetime import date, timedelta, datetime, UTC
import random
import os
import yaml
import json

with open(os.path.join(os.path.dirname(__file__), "../configs/generator_config.yaml")) as f:
    config = yaml.safe_load(f)

random_seed = config.get("random_seed", 42)
random.seed(random_seed)
np.random.seed(random_seed)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "../datasets/scoring_dataset_v1.csv")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "../datasets/dataset_metadata.json")

HOSPITAL_TYPES = ["PHC", "CHC", "DH"]
DISTRICTS      = ["Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad", "Thane"]

# ── Scoring Formula ──────────────────────────────────────────────────────────

SCORE_WEIGHTS = {
    "medicine_availability":   0.25,
    "bed_availability":        0.20,
    "staff_attendance":        0.20,
    "infrastructure_health":   0.15,
    "citizen_satisfaction":    0.10,
    "issue_resolution_rate":   0.10,
}

def compute_health_score(row: dict) -> float:
    medicine_score = (
        row["medicine_availability_pct"] * 0.6 +
        (1 - row["critical_stockout_count"] / 10.0) * 0.4
    )
    bed_score = (
        (1 - row["icu_occupancy_rate"]) * 0.5 +
        (1 - row["general_occupancy_rate"]) * 0.5
    )
    bed_score = max(0, bed_score)
    staff_score = (
        row["doctor_attendance_rate"] * 0.5 +
        row["nurse_attendance_rate"]  * 0.3 +
        row["pharmacist_present"]     * 0.2
    )
    infra_score = (
        (1 - row["active_critical_issues"] / 5.0) * 0.6 +
        row["equipment_uptime_rate"] * 0.4
    )
    infra_score = max(0, infra_score)
    citizen_score = max(0, 1 - row["complaint_rate_7d"] / 20.0)
    resolution_score = row["issue_resolution_rate_30d"]

    raw = (
        medicine_score      * SCORE_WEIGHTS["medicine_availability"] +
        bed_score           * SCORE_WEIGHTS["bed_availability"] +
        staff_score         * SCORE_WEIGHTS["staff_attendance"] +
        infra_score         * SCORE_WEIGHTS["infrastructure_health"] +
        citizen_score       * SCORE_WEIGHTS["citizen_satisfaction"] +
        resolution_score    * SCORE_WEIGHTS["issue_resolution_rate"]
    )
    noise = np.random.normal(0, 1.5)
    return float(np.clip(raw * 100 + noise, 0, 100))

# ── Hospital Profiles ────────────────────────────────────────────────────────

def make_hospital_profile(hid: int) -> dict:
    h_type = random.choices(HOSPITAL_TYPES, weights=[0.58, 0.30, 0.12])[0]
    # Wider baseline distribution to get scores between 20 and 98
    # PHC: 0.3 - 0.9, CHC: 0.4 - 0.95, DH: 0.5 - 0.98
    base_min = {"PHC": 0.30, "CHC": 0.40, "DH": 0.50}[h_type]
    base_max = {"PHC": 0.90, "CHC": 0.95, "DH": 0.98}[h_type]
    baseline = random.uniform(base_min, base_max)
    
    return {
        "hospital_id":   f"H{hid:03d}",
        "hospital_type": h_type,
        "district":      random.choice(DISTRICTS),
        "baseline_perf": baseline,
        "current_perf":  baseline,
        "bed_capacity":  {"PHC": 30, "CHC": 100, "DH": 300}[h_type],
    }

# ── Row Generation ───────────────────────────────────────────────────────────

def generate_row(hosp: dict, d: date) -> dict:
    # 1. Temporal Drift & Events
    # Occasional major shocks or improvements
    if random.random() < 0.01:
        # 1% chance of major management change / infrastructure upgrade
        hosp["current_perf"] += random.uniform(-0.15, 0.20)
    else:
        # Slow random walk
        drift = np.random.normal(0, 0.005)
        hosp["current_perf"] += drift
        
    # Mean reversion back towards their baseline
    hosp["current_perf"] += (hosp["baseline_perf"] - hosp["current_perf"]) * 0.01
    hosp["current_perf"] = np.clip(hosp["current_perf"], 0.15, 0.99)
    
    b = hosp["current_perf"]
    cap = hosp["bed_capacity"]
    month = d.month

    # Seasonal Events
    is_monsoon = int(month in [6, 7, 8, 9])
    is_dengue = int(month in [9, 10, 11])
    is_heatwave = int(month in [4, 5, 6])
    is_festival = int(month in [10, 11])
    is_weekend = int(d.weekday() >= 5)

    # Operational Events
    power_failure = int(random.random() < (0.15 if is_monsoon else 0.05))
    water_interruption = int(random.random() < (0.20 if is_heatwave else 0.05))
    supplier_delay = int(random.random() < (0.25 if is_festival else 0.08))
    doctor_shortage_event = int(random.random() < (0.10 if is_festival else 0.05))

    # Base Efficiency Modifiers
    eff = b - (0.05 * is_monsoon) - (0.05 * is_heatwave) - (0.08 * is_weekend) - (0.1 * power_failure)
    eff = np.clip(eff, 0.15, 0.99)

    # 2. Patient Load (OPD & IPD)
    opd_multiplier = 1.0 + (0.3 * is_monsoon) + (0.4 * is_dengue) + (0.2 * is_heatwave)
    base_opd = {"PHC": 80, "CHC": 250, "DH": 600}[hosp["hospital_type"]]
    daily_opd = int(base_opd * opd_multiplier * random.uniform(0.7, 1.3))
    
    # High OPD drives high IPD
    ipd_ratio = random.uniform(0.05, 0.15) + (0.05 * is_dengue)
    requested_ipd = int(daily_opd * ipd_ratio)
    
    icu_beds = max(2, int(cap * 0.08))
    general_beds = cap - icu_beds
    
    daily_ipd = min(requested_ipd, icu_beds + general_beds)
    
    # Distribute requested IPD into available beds
    icu_occupancy_rate = np.clip((requested_ipd * 0.15) / icu_beds, 0.0, 1.0)
    general_occupancy_rate = np.clip((requested_ipd * 0.85) / general_beds, 0.0, 1.0)
    
    icu_available = int(icu_beds * (1 - icu_occupancy_rate))
    general_available = int(general_beds * (1 - general_occupancy_rate))
    emergency_admissions = int(np.random.poisson(daily_opd * 0.05))

    # 3. Staff Attendance
    doctor_attendance_rate = np.clip(eff - (0.3 * doctor_shortage_event) + np.random.normal(0, 0.05), 0.1, 1.0)
    nurse_attendance_rate = np.clip(eff + np.random.normal(0, 0.05), 0.2, 1.0)
    pharmacist_present = int(random.random() < (eff * 1.2))
    lab_tech_present = int(random.random() < (eff * 1.1))
    
    base_doctors = {"PHC": 3, "CHC": 10, "DH": 35}[hosp["hospital_type"]]
    total_doctors_present = max(1, int(base_doctors * doctor_attendance_rate))

    # 4. Medicine Availability (Correlated to OPD load and Supplier delays)
    load_stress = (daily_opd / base_opd) - 1.0  # >0 means higher load than normal
    med_availability = eff - (0.1 * load_stress) - (0.2 * supplier_delay)
    medicine_availability_pct = np.clip(med_availability + np.random.normal(0, 0.05), 0.1, 1.0)
    
    critical_stockout_count = int(np.clip(np.random.poisson((1 - medicine_availability_pct) * 10), 0, 15))
    low_stock_count = int(np.clip(np.random.poisson((1 - medicine_availability_pct) * 25), 0, 40))
    medicines_tracked = random.randint(40, 80)

    # 5. Infrastructure Issues (Correlated to Power/Water failures)
    active_critical_issues = int(np.clip(np.random.poisson((1 - eff) * 3 + power_failure * 2), 0, 8))
    active_medium_issues = int(np.clip(np.random.poisson((1 - eff) * 6 + water_interruption * 3), 0, 15))
    
    equip_uptime_base = eff - (0.3 * power_failure)
    equipment_uptime_rate = np.clip(equip_uptime_base + np.random.normal(0, 0.05), 0.2, 1.0)
    
    power_outage_hours_7d = int(np.clip(np.random.exponential((1 - eff) * 12 + power_failure * 24), 0, 48))
    water_supply_ok = 0 if water_interruption else int(random.random() < (0.4 + eff * 0.6))
    pending_issues_count = active_critical_issues + active_medium_issues

    # 6. Citizen Feedback & Resolution (Correlated to Wait time and Medicine shortages)
    # Wait time depends on patient load vs doctors present
    patients_per_doc = daily_opd / total_doctors_present
    avg_wait_time_min = int(np.clip(patients_per_doc * 3 + np.random.normal(0, 15), 10, 360))
    
    # Complaints rise with long waits, low medicine, and infrastructure issues
    complaint_pressure = (avg_wait_time_min / 60.0) + (1.0 - medicine_availability_pct) * 5 + active_critical_issues
    complaint_rate_7d = int(np.clip(np.random.poisson(complaint_pressure * 2), 0, 50))
    
    citizen_satisfaction = np.clip(5.0 - (complaint_pressure * 0.5) + np.random.normal(0, 0.4), 1, 5)
    avg_complaint_severity = np.clip((1 - eff) * 4 + np.random.normal(0, 0.3), 1, 5)

    # Resolution slows down if staff is missing
    issue_resolution_rate_30d = np.clip(eff * nurse_attendance_rate + np.random.normal(0, 0.05), 0.1, 1.0)
    avg_resolution_days = np.clip((1 - issue_resolution_rate_30d) * 20 + np.random.normal(0, 2), 0.5, 45)

    # Target
    input_dict = {
        "medicine_availability_pct":  medicine_availability_pct,
        "critical_stockout_count":    critical_stockout_count,
        "icu_occupancy_rate":         icu_occupancy_rate,
        "general_occupancy_rate":     general_occupancy_rate,
        "doctor_attendance_rate":     doctor_attendance_rate,
        "nurse_attendance_rate":      nurse_attendance_rate,
        "pharmacist_present":         pharmacist_present,
        "active_critical_issues":     active_critical_issues,
        "equipment_uptime_rate":      equipment_uptime_rate,
        "complaint_rate_7d":          complaint_rate_7d,
        "issue_resolution_rate_30d":  issue_resolution_rate_30d,
    }
    health_score = compute_health_score(input_dict)

    return {
        # Identity
        "hospital_id":                hosp["hospital_id"],
        "hospital_type":              hosp["hospital_type"],
        "district":                   hosp["district"],
        "date":                       d.isoformat(),
        "month":                      month,
        "quarter":                    (month - 1) // 3 + 1,
        "day_of_week":                d.weekday(),
        "is_weekend":                 is_weekend,
        "is_monsoon":                 is_monsoon,
        # Medicine
        "medicine_availability_pct":  round(medicine_availability_pct, 4),
        "critical_stockout_count":    critical_stockout_count,
        "low_stock_count":            low_stock_count,
        "medicines_tracked":          medicines_tracked,
        # Beds
        "icu_occupancy_rate":         round(icu_occupancy_rate, 4),
        "general_occupancy_rate":     round(general_occupancy_rate, 4),
        "icu_available":              icu_available,
        "general_available":          general_available,
        "total_bed_capacity":         cap,
        # Staff
        "doctor_attendance_rate":     round(doctor_attendance_rate, 4),
        "nurse_attendance_rate":      round(nurse_attendance_rate, 4),
        "pharmacist_present":         pharmacist_present,
        "lab_tech_present":           lab_tech_present,
        "total_doctors_present":      total_doctors_present,
        # Infrastructure
        "active_critical_issues":     active_critical_issues,
        "active_medium_issues":       active_medium_issues,
        "equipment_uptime_rate":      round(equipment_uptime_rate, 4),
        "power_outage_hours_7d":      power_outage_hours_7d,
        "water_supply_ok":            water_supply_ok,
        "pending_issues_count":       pending_issues_count,
        # Patients
        "daily_opd":                  daily_opd,
        "daily_ipd":                  daily_ipd,
        "emergency_admissions":       emergency_admissions,
        "avg_wait_time_min":          avg_wait_time_min,
        # Citizen feedback
        "complaint_rate_7d":          complaint_rate_7d,
        "avg_complaint_severity":     round(avg_complaint_severity, 2),
        "citizen_satisfaction":       round(citizen_satisfaction, 2),
        # Resolution
        "issue_resolution_rate_30d":  round(issue_resolution_rate_30d, 4),
        "avg_resolution_days":        round(avg_resolution_days, 2),
        # Target
        "health_score":               round(health_score, 2),
    }

# ── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    n_hospitals = config["scoring"]["hospitals_count"]
    target_rows = config["scoring"]["target_rows"]
    
    print("Building hospital profiles...")
    hospitals = [make_hospital_profile(i + 1) for i in range(n_hospitals)]
        
    start_date = date.fromisoformat(config["scoring"]["start_date"])
    end_date   = date.fromisoformat(config["scoring"]["end_date"])
    date_range = [start_date + timedelta(days=i) for i in range((end_date - start_date).days + 1)]

    sample_prob = target_rows / (n_hospitals * len(date_range))
    sample_prob = min(sample_prob, 1.0)

    print(f"Generating scoring snapshots for {n_hospitals} hospitals over {len(date_range)} days (sample rate: {sample_prob:.2%})...")
    records = []
    
    row_count = 0
    for hosp in hospitals:
        for d in date_range:
            # Advance simulation for all days to maintain Markov Chain state
            record = generate_row(hosp, d)
            
            # Sample for output
            if random.random() <= sample_prob:
                records.append(record)
                row_count += 1
                if row_count % 50_000 == 0:
                    print(f"  Generated {row_count:,} rows...")

    df = pd.DataFrame(records)
    print(f"\nDataset shape: {df.shape}")
    print(f"\nHealth score distribution:")
    print(df["health_score"].describe())
    
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSaved to: {OUTPUT_PATH}")
    
    # Construct extended metadata
    score_bins = pd.cut(df["health_score"], bins=[0, 30, 50, 70, 85, 100]).value_counts().to_dict()
    district_dist = df["district"].value_counts().to_dict()
    correlation = df[["health_score", "daily_opd", "medicine_availability_pct", "complaint_rate_7d", "doctor_attendance_rate"]].corr().to_dict()
    
    metadata = {
        "dataset_version": "v1.1",
        "dataset_type": "scoring",
        "generation_timestamp": datetime.now(UTC).isoformat(),
        "random_seed": random_seed,
        "row_count": len(df),
        "feature_count": len(df.columns),
        "generator_version": "2.0.0",
        "statistics": {
            "score_distribution_summary": {str(k): int(v) for k, v in score_bins.items()},
            "district_distribution": district_dist,
            "feature_correlation_summary": correlation,
            "missing_values": int(df.isnull().sum().sum()),
            "events_recorded": {
                "monsoon_days": int(df["is_monsoon"].sum()),
                "critical_stockouts": int(df[df["critical_stockout_count"] > 5].shape[0]),
                "power_failures": int(df[df["power_outage_hours_7d"] > 12].shape[0])
            }
        }
    }
    
    meta_list = []
    if os.path.exists(METADATA_PATH):
        try:
            with open(METADATA_PATH, "r") as f:
                meta_list = json.load(f)
        except json.JSONDecodeError:
            pass
            
    meta_list.append(metadata)
    
    with open(METADATA_PATH, "w") as f:
        json.dump(meta_list, f, indent=4)
    print(f"Saved extended metadata to {METADATA_PATH}")