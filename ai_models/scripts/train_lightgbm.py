"""
ArogyaOne — LightGBM Demand Forecasting Model Trainer
Trains a regressor to predict stockout_days from inventory features.

Output: trained_models/lightgbm_forecaster.pkl
        trained_models/lightgbm_feature_names.pkl
"""

import os
import joblib
import numpy as np
import pandas as pd
import lightgbm as lgb
import yaml
import json
import logging
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from utils.validation import validate_inventory_dataset, generate_quality_report
from utils.metadata import save_metadata, save_feature_schema

# Set up logging
LOG_PATH = os.path.join(os.path.dirname(__file__), "../trained_models/training.log")
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
logging.basicConfig(
    filename=LOG_PATH, 
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

with open(os.path.join(os.path.dirname(__file__), "../configs/lightgbm_config.yaml")) as f:
    config = yaml.safe_load(f)

DATASET_PATH  = os.path.join(os.path.dirname(__file__), f"../datasets/{config['dataset']}")
MODEL_OUT     = os.path.join(os.path.dirname(__file__), "../trained_models/lightgbm_forecaster.pkl")
FEATURES_OUT  = os.path.join(os.path.dirname(__file__), "../trained_models/lightgbm_feature_names.pkl")
METRICS_OUT   = os.path.join(os.path.dirname(__file__), "../trained_models/training_metrics.json")
IMPORTANCE_OUT= os.path.join(os.path.dirname(__file__), "../trained_models/feature_importance.csv")
METADATA_OUT  = os.path.join(os.path.dirname(__file__), "../trained_models/model_metadata.json")
SCHEMA_OUT    = os.path.join(os.path.dirname(__file__), "../trained_models/feature_schema.json")
QUALITY_OUT   = os.path.join(os.path.dirname(__file__), "../trained_models/data_quality_report.json")
TRAIN_CSV     = os.path.join(os.path.dirname(__file__), "../datasets/lightgbm_train.csv")
TEST_CSV      = os.path.join(os.path.dirname(__file__), "../datasets/lightgbm_test.csv")

# Features used for training — mirrors what forecasting.py will send at inference time
CATEGORICAL_FEATURES = [
    "hospital_type", "district", "medicine_category", "criticality",
]
NUMERIC_FEATURES = [
    "day_of_week", "month", "quarter", "day_of_year", "is_weekend",
    "current_stock", "min_threshold", "max_capacity", "stock_ratio",
    "below_threshold", "daily_consumption", "avg_daily_usage",
    "rolling_7d_usage", "rolling_30d_usage",
    "days_since_delivery", "delivery_schedule", "supplier_delay_days",
    "last_delivery_qty", "season_multiplier", "is_outbreak",
    "is_high_demand_period", "hospital_capacity_mult",
]
TARGET = "stockout_days"
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERIC_FEATURES


def load_and_preprocess(path: str):
    logging.info("Loading dataset...")
    df = pd.read_csv(path)
    
    # ── Data Validation ──
    logging.info("Running dataset validation...")
    report = validate_inventory_dataset(df)
    generate_quality_report(report, QUALITY_OUT)
    logging.info("Validation completed successfully.")

    # Encode categoricals as integers (LightGBM handles these natively)
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
    
    cat_indices = [X_train.columns.get_loc(c) for c in CATEGORICAL_FEATURES]

    params = {
        "objective":        config["objective"],
        "metric":           config["metric"],
        "num_leaves":       config["num_leaves"],
        "learning_rate":    config["learning_rate"],
        "feature_fraction": config["feature_fraction"],
        "bagging_fraction": config["bagging_fraction"],
        "bagging_freq":     config["bagging_freq"],
        "min_child_samples":config["min_child_samples"],
        "n_estimators":     config["n_estimators"],
        "random_state":     config["random_state"],
        "verbose":          config["verbose"],
        "n_jobs":           config["n_jobs"],
    }

    logging.info("Training LightGBM forecaster...")
    model = lgb.LGBMRegressor(**params)
    model.fit(
        X_train, y_train,
        categorical_feature=cat_indices,
        eval_set=[(X_test, y_test)],
        callbacks=[lgb.early_stopping(config["early_stopping_rounds"], verbose=False),
                   lgb.log_evaluation(100)],
    )

    logging.info("Evaluating on test set...")
    y_pred = model.predict(X_test)
    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    print(f"  MAE  (days): {mae:.3f}")
    print(f"  RMSE (days): {rmse:.3f}")
    print(f"  R²         : {r2:.4f}")

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
        
    logging.info(f"Final metrics: MAE={mae:.2f} days | RMSE={rmse:.2f} | R²={r2:.4f}")
    return model, metrics


if __name__ == "__main__":
    os.makedirs(os.path.dirname(MODEL_OUT), exist_ok=True)
    logging.info("Starting LightGBM ML Pipeline")

    X, y, encoders = load_and_preprocess(DATASET_PATH)
    model, metrics = train(X, y, pd.read_csv(DATASET_PATH))

    logging.info(f"Saving model to {MODEL_OUT}...")
    joblib.dump({"model": model, "encoders": encoders, "metrics": metrics}, MODEL_OUT)
    joblib.dump(ALL_FEATURES, FEATURES_OUT)
    
    # Save Metadata and Schema
    save_feature_schema(SCHEMA_OUT, ALL_FEATURES, CATEGORICAL_FEATURES)
    meta = {
        "model_type": "LightGBM",
        "model_version": config["model_version"],
        "dataset_rows": len(X),
        "features": len(ALL_FEATURES),
        "library_versions": {
            "lightgbm": lgb.__version__,
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