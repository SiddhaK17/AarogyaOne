import json
import logging
import pandas as pd
from typing import Dict, Any

logger = logging.getLogger(__name__)

def validate_inventory_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """Validates the inventory dataset for logical consistency."""
    report = {
        "rows": len(df),
        "missing_values": df.isnull().sum().to_dict(),
        "duplicates": int(df.duplicated().sum()),
        "invalid_stock": int((df["current_stock"] < 0).sum()),
        "invalid_consumption": int((df["daily_consumption"] < 0).sum()),
    }
    if report["invalid_stock"] > 0:
        raise ValueError("Invalid negative stock found.")
    if report["invalid_consumption"] > 0:
        raise ValueError("Invalid negative consumption found.")
    return report

def validate_scoring_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    """Validates the scoring dataset for logical consistency."""
    report = {
        "rows": len(df),
        "missing_values": df.isnull().sum().to_dict(),
        "duplicates": int(df.duplicated().sum()),
        "invalid_percentages": int(
            ((df["medicine_availability_pct"] < 0) | (df["medicine_availability_pct"] > 1)).sum()
        ),
        "invalid_occupancy": int(
            ((df["icu_occupancy_rate"] < 0) | (df["icu_occupancy_rate"] > 1)).sum()
        ),
        "invalid_attendance": int(
            ((df["doctor_attendance_rate"] < 0) | (df["doctor_attendance_rate"] > 1)).sum()
        ),
        "negative_patients": int(
            ((df["daily_opd"] < 0) | (df["daily_ipd"] < 0) | (df["emergency_admissions"] < 0)).sum()
        ),
        "negative_wait_time": int((df["avg_wait_time_min"] < 0).sum())
    }
    if report["invalid_percentages"] > 0 or report["invalid_occupancy"] > 0 or report["invalid_attendance"] > 0:
        raise ValueError("Invalid percentages found (>100% or <0%).")
    if report["negative_patients"] > 0 or report["negative_wait_time"] > 0:
        raise ValueError("Invalid negative counts/wait times found.")
    return report

def generate_quality_report(report: Dict[str, Any], filepath: str) -> None:
    with open(filepath, "w") as f:
        json.dump(report, f, indent=4)
    logger.info(f"Data quality report saved to {filepath}")
