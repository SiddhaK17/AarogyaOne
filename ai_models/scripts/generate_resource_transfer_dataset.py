import os
import random
import yaml
import pandas as pd
from datetime import date, timedelta
import numpy as np

with open(os.path.join(os.path.dirname(__file__), "../configs/generator_config.yaml")) as f:
    config = yaml.safe_load(f)

random_seed = config.get("random_seed", 42)
random.seed(random_seed)
np.random.seed(random_seed)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "../datasets/resource_transfer_dataset.csv")

def generate_transfer_data():
    target_rows = config["resource_transfer"]["target_rows"]
    districts = ["Mumbai", "Pune", "Nashik", "Nagpur", "Aurangabad", "Thane"]
    resources = ["Ventilator", "Ambulance", "O-Negative Blood", "A-Positive Blood", "Oxygen Cylinder"]
    priorities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    
    records = []
    
    start_date = date(2024, 1, 1)
    
    for i in range(target_rows):
        d = start_date + timedelta(days=random.randint(0, 365))
        dist = random.choice(districts)
        res = random.choice(resources)
        
        # Determine distance constraints
        distance_km = round(random.uniform(2.0, 150.0), 1)
        priority = random.choice(priorities)
        
        # Time constraints
        if priority == "CRITICAL":
            max_wait = random.randint(15, 60)
        elif priority == "HIGH":
            max_wait = random.randint(60, 180)
        else:
            max_wait = random.randint(180, 1440)
            
        records.append({
            "request_id": f"TRF-{i:06d}",
            "date": d.isoformat(),
            "district": dist,
            "resource_type": res,
            "priority": priority,
            "distance_km": distance_km,
            "max_wait_time_min": max_wait,
            "fulfilled": int(random.random() > 0.15)  # 85% success rate
        })
        
    df = pd.DataFrame(records)
    
    # Save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Generated OR-Tools dataset with {len(df)} rows.")

if __name__ == "__main__":
    generate_transfer_data()
