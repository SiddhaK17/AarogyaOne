"""
ArogyaOne — Inventory Forecasting Dataset Generator
Produces a realistic synthetic dataset for training the LightGBM stockout predictor.

Design decisions:
- 60 hospitals modelled on real Indian PHC/CHC/District Hospital mix
- 80 medicines drawn from the Indian Essential Medicines List (NLEM 2022)
- 2 years of daily snapshots = ~35M rows before filtering → sampled to ~120k clean rows
- Seasonal disease patterns calibrated to Indian epidemiological calendar
- Outbreak events, supplier delays, public holidays all encoded as features
- Target: stockout_days (how many days until stock hits zero at current consumption rate)
"""

import numpy as np
import pandas as pd
from datetime import date, timedelta
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

# ── Constants ────────────────────────────────────────────────────────────────

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "../datasets/inventory_dataset_v1.csv")
METADATA_PATH = os.path.join(os.path.dirname(__file__), "../datasets/dataset_metadata.json")

DISTRICTS = ["Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad", "Thane"]

HOSPITAL_TYPES = {
    "PHC": 35,       # Primary Health Centre — smallest, most constrained
    "CHC": 18,       # Community Health Centre — intermediate
    "DH":  7,        # District Hospital — largest capacity
}

# Indian Essential Medicines List (NLEM 2022) — realistic subset
# Format: (name, category, avg_daily_usage_phc, criticality)
MEDICINES = [
    ("Paracetamol 500mg", "analgesic",         85, "high"),
    ("Amoxicillin 500mg", "antibiotic",        40, "high"),
    ("Metformin 500mg",   "antidiabetic",      55, "high"),
    ("Amlodipine 5mg",    "antihypertensive",  48, "high"),
    ("Atenolol 50mg",     "antihypertensive",  35, "high"),
    ("ORS Sachet",        "rehydration",      120, "high"),
    ("Zinc 20mg",         "supplement",        65, "medium"),
    ("Vitamin A",         "supplement",        30, "medium"),
    ("Iron + Folic Acid", "supplement",        90, "high"),
    ("Cotrimoxazole",     "antibiotic",        28, "high"),
    ("Chloroquine 250mg", "antimalarial",      45, "seasonal"),
    ("Artesunate",        "antimalarial",      22, "seasonal"),
    ("Albendazole 400mg", "anthelmintic",      38, "periodic"),
    ("Atenolol 100mg",    "antihypertensive",  20, "medium"),
    ("Glibenclamide 5mg", "antidiabetic",      18, "medium"),
    ("Ranitidine 150mg",  "antacid",           55, "medium"),
    ("Omeprazole 20mg",   "antacid",           60, "medium"),
    ("Cetirizine 10mg",   "antihistamine",     35, "low"),
    ("Doxycycline 100mg", "antibiotic",        25, "medium"),
    ("Ciprofloxacin 500mg","antibiotic",       30, "medium"),
    ("Ibuprofen 400mg",   "analgesic",         45, "medium"),
    ("Diazepam 5mg",      "sedative",           8, "high"),
    ("Enalapril 5mg",     "antihypertensive",  22, "high"),
    ("Metronidazole 400mg","antibiotic",       38, "medium"),
    ("Rifampicin 450mg",  "antitubercular",    15, "high"),
    ("Isoniazid 300mg",   "antitubercular",    15, "high"),
    ("Ethambutol 800mg",  "antitubercular",    12, "high"),
    ("Pyrazinamide 750mg","antitubercular",    12, "high"),
    ("Insulin Regular",   "antidiabetic",      10, "critical"),
    ("Insulin NPH",       "antidiabetic",       8, "critical"),
    ("Salbutamol Inhaler","bronchodilator",    20, "high"),
    ("Prednisolone 5mg",  "steroid",           18, "medium"),
    ("Hydrocortisone Inj","steroid",            5, "critical"),
    ("Adrenaline 1mg",    "emergency",          3, "critical"),
    ("Atropine 0.6mg",    "emergency",          3, "critical"),
    ("Oxytocin 10IU",     "obstetric",         12, "critical"),
    ("Magnesium Sulphate","obstetric",          8, "critical"),
    ("Misoprostol",       "obstetric",         10, "critical"),
    ("Folic Acid 5mg",    "supplement",        75, "medium"),
    ("Calcium 500mg",     "supplement",        50, "medium"),
    ("Ringer Lactate",    "IV fluid",          25, "high"),
    ("Normal Saline",     "IV fluid",          30, "high"),
    ("Dextrose 5%",       "IV fluid",          18, "high"),
    ("Ceftriaxone 1g",    "antibiotic",        12, "high"),
    ("Diclofenac 50mg",   "analgesic",         40, "medium"),
    ("Phenobarbitone",    "anticonvulsant",     8, "high"),
    ("Phenytoin 100mg",   "anticonvulsant",     6, "high"),
    ("Carbamazepine",     "anticonvulsant",     5, "high"),
    ("Nifedipine 10mg",   "antihypertensive",  15, "medium"),
    ("Furosemide 40mg",   "diuretic",          12, "medium"),
]

# Indian public holidays + high-demand periods
HIGH_DEMAND_PERIODS = [
    (1, 14, 1, 26),   # Makar Sankranti → Republic Day
    (3, 1, 4, 15),    # Holi + spring fever season
    (6, 1, 9, 30),    # Monsoon — peak malaria/diarrhea
    (10, 1, 11, 15),  # Navratri/Diwali — travel, gatherings
    (12, 15, 12, 31), # Winter — respiratory peak
]

SEASONAL_DISEASE_SPIKES = {
    # month → (disease_category, multiplier)
    6:  ("antimalarial",   2.2),
    7:  ("antimalarial",   2.8),
    8:  ("antimalarial",   3.1),
    9:  ("antimalarial",   2.4),
    7:  ("rehydration",    2.5),  # monsoon diarrhea
    8:  ("rehydration",    2.3),
    12: ("analgesic",      1.4),  # winter respiratory
    1:  ("analgesic",      1.3),
}


# ── Helper Functions ─────────────────────────────────────────────────────────

def build_hospitals():
    hospitals = []
    hid = 1
    for h_type, count in HOSPITAL_TYPES.items():
        for _ in range(count):
            district = random.choice(DISTRICTS)
            capacity_multiplier = {"PHC": 1.0, "CHC": 2.5, "DH": 6.0}[h_type]
            hospitals.append({
                "hospital_id":   f"H{hid:03d}",
                "hospital_type": h_type,
                "district":      district,
                "capacity_mult": capacity_multiplier,
                "lat":           18.5 + random.uniform(-1.5, 1.5),
                "lon":           74.0 + random.uniform(-1.5, 1.5),
            })
            hid += 1
    return hospitals


def is_high_demand_period(d: date) -> float:
    """Returns a demand multiplier for known high-demand calendar periods."""
    for sm, sd, em, ed in HIGH_DEMAND_PERIODS:
        start = date(d.year, sm, sd)
        end   = date(d.year, em, ed)
        if start <= d <= end:
            return 1.35
    return 1.0


def seasonal_multiplier(d: date, category: str) -> float:
    m = d.month
    if m in SEASONAL_DISEASE_SPIKES:
        cat, mult = SEASONAL_DISEASE_SPIKES[m]
        if cat == category:
            return mult
    return 1.0


def simulate_outbreak(d: date) -> bool:
    """Roughly 2–3 outbreak events per year, each lasting ~14 days."""
    day_of_year = d.timetuple().tm_yday
    # Deterministic pseudo-outbreaks seeded on year
    outbreak_seeds = [(60 + (d.year % 7) * 17) % 365,
                      (180 + (d.year % 5) * 23) % 365,
                      (290 + (d.year % 3) * 31) % 365]
    for seed in outbreak_seeds:
        if abs(day_of_year - seed) <= 7:
            return True
    return False


def supplier_delay_days(d: date) -> int:
    """Simulate realistic supplier delays — higher around festivals."""
    base_delay = np.random.choice([0, 0, 0, 1, 2, 3, 7], p=[0.55, 0.15, 0.10, 0.08, 0.06, 0.04, 0.02])
    if is_high_demand_period(d) > 1.0:
        base_delay += np.random.randint(0, 3)
    return int(base_delay)


# ── Core Dataset Generation ──────────────────────────────────────────────────

def generate_inventory_dataset() -> pd.DataFrame:
    n_rows_target = config["inventory"]["target_rows"]
    print("Building hospital registry...")
    # Scale hospital list based on config if needed
    hospitals = build_hospitals()
    
    # Repeat hospitals to scale up to the needed amount if config asks for more
    while len(hospitals) < config["inventory"]["hospitals_count"]:
        hid = len(hospitals) + 1
        h_type = random.choice(list(HOSPITAL_TYPES.keys()))
        district = random.choice(DISTRICTS)
        capacity_multiplier = {"PHC": 1.0, "CHC": 2.5, "DH": 6.0}[h_type]
        hospitals.append({
            "hospital_id":   f"H{hid:03d}",
            "hospital_type": h_type,
            "district":      district,
            "capacity_mult": capacity_multiplier,
            "lat":           18.5 + random.uniform(-1.5, 1.5),
            "lon":           74.0 + random.uniform(-1.5, 1.5),
        })

    start_date = date.fromisoformat(config["inventory"]["start_date"])
    end_date   = date.fromisoformat(config["inventory"]["end_date"])
    date_range = [start_date + timedelta(days=i)
                  for i in range((end_date - start_date).days + 1)]

    print(f"Generating inventory snapshots ({len(hospitals)} hospitals × "
          f"{len(MEDICINES)} medicines × {len(date_range)} days)...")

    records = []
    row_count = 0

    # Sample subset to reach target row count efficiently
    sample_prob = n_rows_target / (len(hospitals) * len(MEDICINES) * len(date_range))
    sample_prob = min(sample_prob, 1.0)

    for hosp in hospitals:
        for med_name, med_cat, base_usage, criticality in MEDICINES:

            # Hospital-type usage scaling
            usage_scale = hosp["capacity_mult"] * random.uniform(0.7, 1.4)
            avg_daily   = base_usage * usage_scale

            # Initial stock — random realistic starting point
            stock = avg_daily * random.uniform(15, 90)
            min_threshold = avg_daily * random.uniform(5, 14)
            max_capacity  = avg_daily * random.uniform(60, 120)

            delivery_schedule = random.choice([7, 14, 30])  # days between deliveries
            days_since_delivery = random.randint(0, delivery_schedule)

            for d in date_range:
                if random.random() > sample_prob:
                    continue

                # Demand multipliers
                season_mult   = seasonal_multiplier(d, med_cat)
                period_mult   = is_high_demand_period(d)
                outbreak      = simulate_outbreak(d)
                outbreak_mult = random.uniform(1.8, 3.5) if outbreak else 1.0
                weekend_mult  = 0.7 if d.weekday() >= 5 else 1.0

                # Actual daily consumption
                noise         = np.random.normal(1.0, 0.15)
                daily_consumption = max(0, avg_daily * season_mult * period_mult
                                        * outbreak_mult * weekend_mult * noise)

                # Delivery logic
                days_since_delivery += 1
                delivery_received = 0
                delay = supplier_delay_days(d)
                if days_since_delivery >= (delivery_schedule + delay):
                    delivery_received = avg_daily * delivery_schedule * random.uniform(0.8, 1.1)
                    days_since_delivery = 0

                stock = max(0, stock - daily_consumption + delivery_received)
                stock = min(stock, max_capacity)

                # Target: days until stockout at current consumption rate
                if daily_consumption > 0:
                    stockout_days = stock / daily_consumption
                else:
                    stockout_days = 999.0
                stockout_days = min(stockout_days, 90.0)

                # Rolling features (approximated per row — full rolling needs df)
                roll7_usage  = daily_consumption * random.uniform(0.85, 1.15)
                roll30_usage = daily_consumption * random.uniform(0.80, 1.20)

                records.append({
                    # Identity
                    "hospital_id":          hosp["hospital_id"],
                    "hospital_type":        hosp["hospital_type"],
                    "district":             hosp["district"],
                    "medicine_name":        med_name,
                    "medicine_category":    med_cat,
                    "criticality":          criticality,
                    # Date features
                    "date":                 d.isoformat(),
                    "day_of_week":          d.weekday(),
                    "month":                d.month,
                    "quarter":              (d.month - 1) // 3 + 1,
                    "day_of_year":          d.timetuple().tm_yday,
                    "is_weekend":           int(d.weekday() >= 5),
                    # Stock features
                    "current_stock":        round(stock, 2),
                    "min_threshold":        round(min_threshold, 2),
                    "max_capacity":         round(max_capacity, 2),
                    "stock_ratio":          round(stock / max_capacity, 4),
                    "below_threshold":      int(stock < min_threshold),
                    # Consumption features
                    "daily_consumption":    round(daily_consumption, 2),
                    "avg_daily_usage":      round(avg_daily, 2),
                    "rolling_7d_usage":     round(roll7_usage, 2),
                    "rolling_30d_usage":    round(roll30_usage, 2),
                    # Supply features
                    "days_since_delivery":  days_since_delivery,
                    "delivery_schedule":    delivery_schedule,
                    "supplier_delay_days":  delay,
                    "last_delivery_qty":    round(delivery_received, 2),
                    # Context features
                    "season_multiplier":    round(season_mult, 3),
                    "is_outbreak":          int(outbreak),
                    "is_high_demand_period":int(period_mult > 1.0),
                    "hospital_capacity_mult": round(hosp["capacity_mult"], 2),
                    # Target
                    "stockout_days":        round(stockout_days, 2),
                })
                row_count += 1

                if row_count % 20_000 == 0:
                    print(f"  Generated {row_count:,} rows...")

    print(f"Total rows generated: {len(records):,}")
    return pd.DataFrame(records)


# ── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    df = generate_inventory_dataset()

    print(f"\nDataset shape: {df.shape}")
    print(f"Stockout days distribution:")
    print(df["stockout_days"].describe())
    print(f"\nHospital types: {df['hospital_type'].value_counts().to_dict()}")
    print(f"Medicine categories: {df['medicine_category'].value_counts().to_dict()}")

    df.to_csv(OUTPUT_PATH, index=False)
    print(f"\nSaved to: {OUTPUT_PATH}")
    
    # Save dataset metadata
    metadata = {
        "dataset_version": "v1",
        "dataset_type": "inventory",
        "generation_timestamp": datetime.now(UTC).isoformat(),
        "random_seed": random_seed,
        "row_count": len(df),
        "feature_count": len(df.columns),
        "generator_version": "1.1.0"
    }
    
    # Append to or create metadata file
    meta_list = []
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r") as f:
            meta_list = json.load(f)
    meta_list.append(metadata)
    
    with open(METADATA_PATH, "w") as f:
        json.dump(meta_list, f, indent=4)
    print(f"Saved metadata to {METADATA_PATH}")