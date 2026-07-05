"""
ArogyaOne — LightGBM Demand Forecasting Service

Loaded once at application startup. Inference is synchronous and fast (~5ms per call).
Called by the Hospital inventory update endpoint whenever stock changes.
"""

import os
import json
import joblib
import threading
import numpy as np
import pandas as pd
from dataclasses import dataclass
from typing import Optional, Any, Dict, List
import logging
import time

from .exceptions import (
    ModelLoadError, 
    ArtifactMissingError, 
    InferenceError, 
    FeatureValidationError,
    ModelVersionMismatchError
)
from app.intelligence.core.base_engine import BaseAIEngine

logger = logging.getLogger(__name__)

from app.intelligence.pipelines.config import TRAINED_MODELS_DIR

MODEL_PATH = TRAINED_MODELS_DIR / "lightgbm_forecaster.pkl"
FEATURES_PATH = TRAINED_MODELS_DIR / "lightgbm_feature_names.pkl"
METRICS_PATH = TRAINED_MODELS_DIR / "lightgbm_training_metrics.json"
METADATA_PATH = TRAINED_MODELS_DIR / "lightgbm_model_metadata.json"
SCHEMA_PATH = TRAINED_MODELS_DIR / "lightgbm_feature_schema.json"

# ── Singleton loader ─────────────────────────────────────────────────────────

class ForecasterSingleton(BaseAIEngine):
    _instance = None
    _lock = threading.Lock()
    
    def __init__(self):
        self.model = None
        self.encoders = {}
        self.expected_features: List[str] = []
        self._metadata: Dict[str, Any] = {}
        self.metrics: Dict[str, Any] = {}
        self.schema: List[Dict[str, Any]] = []
        self._loaded = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance
    
    def is_loaded(self) -> bool:
        return self._loaded

    def reload(self):
        with self._lock:
            self._loaded = False
            self.load()

    def load(self):
        """Loads and validates all artifacts. Thread-safe."""
        if self._loaded:
            return
            
        with self._lock:
            if self._loaded:
                return
                
            logger.info("forecast_loading", extra={"status": "started"})
            
            # 1. Model & Encoders
            if not os.path.exists(MODEL_PATH):
                raise ArtifactMissingError(f"LightGBM model not found at {MODEL_PATH}")
            try:
                bundle = joblib.load(MODEL_PATH)
                self.model = bundle["model"]
                self.encoders = bundle["encoders"]
            except Exception as e:
                raise ModelLoadError(f"Failed to load LightGBM bundle: {e}")

            # 2. Feature Names (Ordering)
            if not os.path.exists(FEATURES_PATH):
                raise ArtifactMissingError(f"Feature names not found at {FEATURES_PATH}")
            try:
                self.expected_features = joblib.load(FEATURES_PATH)
            except Exception as e:
                raise ModelLoadError(f"Failed to load feature names: {e}")

            # 3. JSON Artifacts (Metrics, Metadata, Schema)
            self.metrics = self._load_json(METRICS_PATH, "metrics")
            self._metadata = self._load_json(METADATA_PATH, "metadata")
            self.schema = self._load_json(SCHEMA_PATH, "schema")
            
            # 4. Artifact Version Validation
            model_ver = self._metadata.get("model_version")
            if not model_ver:
                raise ModelVersionMismatchError("Metadata is missing 'model_version'")
            
            # Only compare versions for artifacts that legitimately declare one.
            artifacts_to_check = [("Metrics", self.metrics), ("Schema", self.schema)]
            for name, artifact in artifacts_to_check:
                if isinstance(artifact, dict) and "model_version" in artifact:
                    if artifact["model_version"] != model_ver:
                        raise ModelVersionMismatchError(
                            f"Version mismatch: {name} has {artifact['model_version']} but Metadata has {model_ver}"
                        )
            
            # The warmup is now explicitly called via the BaseAIEngine interface.
            
            self._loaded = True
            
            logger.info("forecast_loading", extra={
                "status": "completed",
                "model_version": model_ver,
                "dataset_version": self._metadata.get("dataset_version", "unknown"),
                "training_quality": self.metrics.get("r2", 0.0)
            })

    def _load_json(self, path: str, name: str) -> Any:
        if not os.path.exists(path):
            raise ArtifactMissingError(f"Required artifact '{name}' missing at {path}")
        try:
            with open(path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise ModelLoadError(f"Failed to parse {name} JSON: {e}")

    def warmup(self) -> None:
        """Perform a mock inference to validate schema bounds and model health."""
        if not self._loaded:
            raise ModelLoadError("Cannot warmup before load().")
        try:
            mock_payload = {}
            for schema_def in self.schema:
                fname = schema_def["feature_name"]
                if schema_def["dtype"] == "categorical":
                    mock_payload[fname] = 0
                else:
                    mock_payload[fname] = schema_def.get("minimum", 0.0)
            
            # Feature ordering check
            if list(mock_payload.keys()) != self.expected_features:
                raise FeatureValidationError("Startup Mock: Built feature array does not match expected ordering.")

            X = pd.DataFrame([mock_payload])
            self.model.predict(X)
            self._last_warmup = time.time()
        except Exception as e:
            raise ModelLoadError(f"Startup warmup mock prediction failed: {e}")

    def shutdown(self) -> None:
        """Clear memory and reset."""
        with self._lock:
            self.model = None
            self.encoders = {}
            self._loaded = False

    def health(self) -> Dict[str, Any]:
        return {
            "is_loaded": self._loaded,
            "device": "cpu",
            "model_version": self._metadata.get("model_version", "unknown"),
            "dataset_version": self._metadata.get("dataset_version", "unknown"),
            "training_quality_r2": self.metrics.get("r2", 0.0),
            "last_warmup_timestamp": getattr(self, "_last_warmup", None)
        }

    def metadata(self) -> Dict[str, Any]:
        return self._metadata if self._loaded else {}

    def predict(self, request: Any) -> Any:
        """
        Standardized inference entry point.
        Delegates to the module-level functional predict_stockout to preserve backward compatibility.
        """
        # We import here to avoid circular dependencies if predict_stockout uses the singleton.
        from app.intelligence.pipelines.forecasting import predict_stockout
        return predict_stockout(request)

# ── Input / Output types ─────────────────────────────────────────────────────

@dataclass
class ForecastRequest:
    hospital_id:          str
    hospital_type:        str          # PHC | CHC | DH
    district:             str
    medicine_name:        str
    medicine_category:    str
    criticality:          str          # low | medium | high | critical
    current_stock:        float
    min_threshold:        float
    max_capacity:         float
    daily_consumption:    float
    avg_daily_usage:      float
    rolling_7d_usage:     float
    rolling_30d_usage:    float
    days_since_delivery:  int
    delivery_schedule:    int          # days between deliveries
    supplier_delay_days:  int
    last_delivery_qty:    float
    hospital_capacity_mult: float
    # Temporal (auto-computed if not passed)
    month:                Optional[int] = None
    day_of_week:          Optional[int] = None
    quarter:              Optional[int] = None
    day_of_year:          Optional[int] = None
    is_weekend:           Optional[int] = None
    season_multiplier:    float = 1.0
    is_outbreak:          int = 0
    is_high_demand_period: int = 0
    # Logging Correlation
    correlation_id:       str = "UNKNOWN"


@dataclass
class ForecastResult:
    stockout_days:     float
    risk_level:        str          # safe | warning | critical | emergency
    risk_color:        str          # green | yellow | orange | red
    recommendation:    str
    confidence:        float        # corresponds to training R2 (model_quality)
    restock_quantity:  float        # suggested reorder quantity


# ── Risk classification ──────────────────────────────────────────────────────

def _classify_risk(stockout_days: float, criticality: str) -> tuple[str, str]:
    """Returns (risk_level, risk_color) based on days and medicine criticality."""
    thresholds = {
        "critical": (14, 7, 3),
        "high":     (10, 5, 2),
        "medium":   (7,  3, 1),
        "low":      (5,  2, 1),
    }
    safe, warn, crit = thresholds.get(criticality.lower(), (7, 3, 1))

    if stockout_days > safe:
        return "safe",      "green"
    elif stockout_days > warn:
        return "warning",   "yellow"
    elif stockout_days > crit:
        return "critical",  "orange"
    else:
        return "emergency", "red"


def _build_recommendation(stockout_days: float, risk_level: str,
                           medicine_name: str, restock_qty: float) -> str:
    if risk_level == "safe":
        return f"{medicine_name} stock is sufficient for ~{stockout_days:.0f} days."
    elif risk_level == "warning":
        return (f"{medicine_name} will deplete in ~{stockout_days:.0f} days. "
                f"Initiate restock of {restock_qty:.0f} units.")
    elif risk_level == "critical":
        return (f"⚠️ {medicine_name} CRITICAL — {stockout_days:.1f} days remaining. "
                f"Urgent restock of {restock_qty:.0f} units required.")
    else:
        return (f"🚨 {medicine_name} EMERGENCY — stockout in < {stockout_days:.1f} days. "
                f"Request inter-facility transfer immediately.")


# ── Validations ──────────────────────────────────────────────────────────────

def _schema_validate(feature_dict: Dict[str, Any], schema: List[Dict[str, Any]]):
    """Dynamic schema-driven validation."""
    for rule in schema:
        fname = rule["feature_name"]
        if fname not in feature_dict:
            raise FeatureValidationError(f"Missing mandatory feature: {fname}")
            
        val = feature_dict[fname]
        
        # Check nan / inf
        if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
            raise FeatureValidationError(f"Feature '{fname}' cannot be NaN or Infinity.")
            
        # Check constraints
        if "minimum" in rule and val < rule["minimum"]:
            raise FeatureValidationError(f"Feature '{fname}' ({val}) is below schema minimum ({rule['minimum']}).")
        if "maximum" in rule and val > rule["maximum"]:
            raise FeatureValidationError(f"Feature '{fname}' ({val}) is above schema maximum ({rule['maximum']}).")


# ── Core inference ───────────────────────────────────────────────────────────

def predict_stockout(req: ForecastRequest) -> ForecastResult:
    """
    Run LightGBM inference and return a structured forecast result.
    """
    start_time = time.perf_counter()
    from datetime import date as _date
    
    loader = ForecasterSingleton.get_instance()
    if not loader.is_loaded():
        loader.load()
    
    today = _date.today()
    month      = req.month       or today.month
    day_of_week= req.day_of_week or today.weekday()
    quarter    = req.quarter     or (today.month - 1) // 3 + 1
    day_of_year= req.day_of_year or today.timetuple().tm_yday
    is_weekend = req.is_weekend  if req.is_weekend is not None else int(today.weekday() >= 5)

    if req.max_capacity <= 0:
        raise FeatureValidationError("max_capacity must be > 0 to prevent division by zero.")
    
    stock_ratio = req.current_stock / req.max_capacity

    def strict_encode(encoder, value: str) -> int:
        if not value:
            raise FeatureValidationError("Categorical string cannot be empty.")
        classes = list(encoder.classes_)
        if value not in classes:
            raise FeatureValidationError(f"Unknown category '{value}' for encoder. Allowed: {classes}")
        return encoder.transform([value])[0]

    try:
        encoded_type = strict_encode(loader.encoders["hospital_type"], req.hospital_type)
        encoded_dist = strict_encode(loader.encoders["district"], req.district)
        encoded_med = strict_encode(loader.encoders["medicine_category"], req.medicine_category)
        encoded_crit = strict_encode(loader.encoders["criticality"], req.criticality)
    except Exception as e:
        logger.error("forecast_validation_failed", extra={"correlation_id": req.correlation_id, "error": str(e)})
        raise e

    feature_dict = {
        "hospital_type":          encoded_type,
        "district":               encoded_dist,
        "medicine_category":      encoded_med,
        "criticality":            encoded_crit,
        "day_of_week":            day_of_week,
        "month":                  month,
        "quarter":                quarter,
        "day_of_year":            day_of_year,
        "is_weekend":             is_weekend,
        "current_stock":          req.current_stock,
        "min_threshold":          req.min_threshold,
        "max_capacity":           req.max_capacity,
        "stock_ratio":            round(stock_ratio, 4),
        "below_threshold":        int(req.current_stock < req.min_threshold),
        "daily_consumption":      req.daily_consumption,
        "avg_daily_usage":        req.avg_daily_usage,
        "rolling_7d_usage":       req.rolling_7d_usage,
        "rolling_30d_usage":      req.rolling_30d_usage,
        "days_since_delivery":    req.days_since_delivery,
        "delivery_schedule":      req.delivery_schedule,
        "supplier_delay_days":    req.supplier_delay_days,
        "last_delivery_qty":      req.last_delivery_qty,
        "season_multiplier":      req.season_multiplier,
        "is_outbreak":            req.is_outbreak,
        "is_high_demand_period":  req.is_high_demand_period,
        "hospital_capacity_mult": req.hospital_capacity_mult,
    }

    # 1. Schema-driven validation
    try:
        _schema_validate(feature_dict, loader.schema)
    except FeatureValidationError as e:
        logger.error("forecast_validation_failed", extra={"correlation_id": req.correlation_id, "error": str(e)})
        raise e

    # 2. Validate exact feature ordering mapping
    if list(feature_dict.keys()) != loader.expected_features:
        missing = set(loader.expected_features) - set(feature_dict.keys())
        extra = set(feature_dict.keys()) - set(loader.expected_features)
        err = f"Feature ordering mismatch. Missing: {missing}, Extra: {extra}."
        logger.error("forecast_validation_failed", extra={"correlation_id": req.correlation_id, "error": err})
        raise FeatureValidationError(err)

    try:
        X = pd.DataFrame([feature_dict])
        raw_pred = float(loader.model.predict(X)[0])
        stockout_days = max(0.0, min(raw_pred, 90.0))
    except Exception as e:
        err = f"LightGBM prediction failed: {e}"
        logger.error("forecast_inference_error", extra={"correlation_id": req.correlation_id, "error": err})
        raise InferenceError(err)

    risk_level, risk_color = _classify_risk(stockout_days, req.criticality)

    restock_qty = max(0.0, req.avg_daily_usage * 30)
    
    training_quality = float(loader.metrics.get("r2", 0.0))
    
    exec_time_ms = (time.perf_counter() - start_time) * 1000.0

    # Structured Logging
    logger.info("forecast_completed", extra={
        "correlation_id": req.correlation_id,
        "model_name": "lightgbm_forecaster",
        "model_version": loader.metadata.get("model_version", "unknown"),
        "dataset_version": loader.metadata.get("dataset_version", "unknown"),
        "execution_time_ms": round(exec_time_ms, 2),
        "hospital_id": req.hospital_id,
        "medicine_name": req.medicine_name,
        "prediction_stockout_days": round(stockout_days, 1),
        "risk_level": risk_level,
        "training_quality": round(training_quality, 4)
    })

    return ForecastResult(
        stockout_days    = round(stockout_days, 1),
        risk_level       = risk_level,
        risk_color       = risk_color,
        recommendation   = _build_recommendation(
                               stockout_days, risk_level,
                               req.medicine_name, restock_qty),
        confidence       = training_quality,
        restock_quantity = round(restock_qty, 0),
    )