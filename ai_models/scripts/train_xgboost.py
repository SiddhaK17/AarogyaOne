"""
ArogyaOne — XGBoost Hospital Health Score Trainer
Trains a regressor to predict health_score (0–100) from operational metrics.

Output: trained_models/xgboost_scorer.pkl
"""

import os
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import yaml
import json
import logging
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from utils.validation import validate_scoring_dataset, generate_quality_report
from utils.metadata import save_metadata, save_feature_schema

# Set up logging
LOG_PATH = os.path.join(os.path.dirname(__file__), "../trained_models/xgboost_training.log")
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
logging.basicConfig(
    filename=LOG_PATH, 
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

with open(os.path.join(os.path.dirname(__file__), "../configs/xgboost_config.yaml")) as f:
    config = yaml.safe_load(f)

DATASET_PATH = os.path.join(os.path.dirname(__file__), f"../datasets/{config['dataset']}")
MODEL_OUT    = os.path.join(os.path.dirname(__file__), "../trained_models/xgboost_scorer.pkl")
METRICS_OUT  = os.path.join(os.path.dirname(__file__), "../trained_models/xgboost_training_metrics.json")
IMPORTANCE_OUT = os.path.join(os.path.dirname(__file__), "../trained_models/xgboost_feature_importance.csv")
METADATA_OUT = os.path.join(os.path.dirname(__file__), "../trained_models/xgboost_model_metadata.json")
SCHEMA_OUT   = os.path.join(os.path.dirname(__file__), "../trained_models/xgboost_feature_schema.json")
QUALITY_OUT  = os.path.join(os.path.dirname(__file__), "../trained_models/xgboost_data_quality_report.json")
TRAIN_CSV    = os.path.join(os.path.dirname(__file__), "../datasets/xgboost_train.csv")
TEST_CSV     = os.path.join(os.path.dirname(__file__), "../datasets/xgboost_test.csv")

CATEGORICAL_FEATURES = ["hospital_type", "district"]
NUMERIC_FEATURES = [
    "month", "quarter", "day_of_week", "is_weekend", "is_monsoon",
    "medicine_availability_pct", "critical_stockout_count",
    "low_stock_count", "medicines_tracked",
    "icu_occupancy_rate", "general_occupancy_rate",
    "icu_available", "general_available", "total_bed_capacity",
    "doctor_attendance_rate", "nurse_attendance_rate",
    "pharmacist_present", "lab_tech_present", "total_doctors_present",
    "active_critical_issues", "active_medium_issues",
    "equipment_uptime_rate", "power_outage_hours_7d",
    "water_supply_ok", "pending_issues_count",
    "daily_opd", "daily_ipd", "emergency_admissions", "avg_wait_time_min",
    "complaint_rate_7d", "avg_complaint_severity", "citizen_satisfaction",
    "issue_resolution_rate_30d", "avg_resolution_days",
]
TARGET       = "health_score"
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES


def load_and_preprocess(path: str):
    logging.info("Loading dataset...")
    df = pd.read_csv(path)
    
    # ── Data Validation ──
    logging.info("Running dataset validation...")
    report = validate_scoring_dataset(df)
    generate_quality_report(report, QUALITY_OUT)
    logging.info("Validation completed successfully.")

    encoders = {}
    for col in CATEGORICAL_FEATURES:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    X = df[ALL_FEATURES]
    y = df[TARGET]
    return X, y, encoders


def train(X, y, df):
    logging.info("Splitting train/test (80/20)...")
    X_train, X_test, y_train, y_test, df_train, df_test = train_test_split(
        X, y, df, test_size=0.2, random_state=config["random_state"]
    )
    
    # Export deterministic split
    df_train.to_csv(TRAIN_CSV, index=False)
    df_test.to_csv(TEST_CSV, index=False)
    logging.info(f"Saved splits to {TRAIN_CSV} and {TEST_CSV}")

    params = {
        "objective":        config["objective"],
        "eval_metric":      config["eval_metric"],
        "n_estimators":     config["n_estimators"],
        "learning_rate":    config["learning_rate"],
        "max_depth":        config["max_depth"],
        "subsample":        config["subsample"],
        "colsample_bytree": config["colsample_bytree"],
        "min_child_weight": config["min_child_weight"],
        "gamma":            config["gamma"],
        "reg_alpha":        config["reg_alpha"],
        "reg_lambda":       config["reg_lambda"],
        "random_state":     config["random_state"],
        "n_jobs":           config["n_jobs"],
        "verbosity":        config["verbosity"],
        "early_stopping_rounds": config["early_stopping_rounds"],
    }

    logging.info("Training XGBoost scorer...")
    model = xgb.XGBRegressor(**params)
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=100,
    )

    print("\nEvaluating on test set...")
    y_pred = model.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    print(f"  MAE  (score points): {mae:.3f}")
    print(f"  RMSE              : {rmse:.3f}")
    print(f"  R²                : {r2:.4f}")

    # Feature importance
    importance = pd.Series(
        model.feature_importances_,
        index=ALL_FEATURES
    ).sort_values(ascending=False)
    
    importance.to_csv(IMPORTANCE_OUT, index=True, header=["importance"])
    logging.info(f"Feature importance saved to {IMPORTANCE_OUT}")

    metrics = {"mae": float(mae), "rmse": float(rmse), "r2": float(r2)}
    
    with open(METRICS_OUT, "w") as f:
        json.dump(metrics, f, indent=4)
        
    logging.info(f"Final metrics: MAE={mae:.2f} pts | RMSE={rmse:.2f} | R²={r2:.4f}")
    return model, metrics


if __name__ == "__main__":
    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    logging.info("Starting XGBoost ML Pipeline")

    X, y, encoders = load_and_preprocess(DATASET_PATH)
    model, metrics = train(X, y, pd.read_csv(DATASET_PATH))

    logging.info(f"Saving model to {MODEL_OUT}...")
    joblib.dump({"model": model, "encoders": encoders, "metrics": metrics}, MODEL_OUT)
    
    # Save Metadata and Schema
    save_feature_schema(SCHEMA_OUT, ALL_FEATURES, CATEGORICAL_FEATURES)
    meta = {
        "model_type": "XGBoost",
        "model_version": config["model_version"],
        "dataset_rows": len(X),
        "features": len(ALL_FEATURES),
        "library_versions": {
            "xgboost": xgb.__version__,
            "pandas": pd.__version__,
            "numpy": np.__version__
        }
    }
    save_metadata(METADATA_OUT, meta)
    
    # Mock Inference Verification
    logging.info("Running post-training compatibility check...")
    try:
        loaded = joblib.load(MODEL_OUT)
        test_vector = X.iloc[0:1].copy()
        pred = loaded["model"].predict(test_vector)
        if pred.shape != (1,):
            raise ValueError("Prediction shape mismatch")
        logging.info("Post-training check passed.")
    except Exception as e:
        logging.error(f"Post-training compatibility check failed: {e}")
        raise RuntimeError(f"Post-training compatibility check failed: {e}")
        
    logging.info("Pipeline completed successfully.")
    print("Done.")