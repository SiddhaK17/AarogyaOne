"""
ArogyaOne — XGBoost Hospital Health Scoring Service

Computes an explainable 0–100 operational health score for each hospital.
Called whenever a hospital updates any operational metric, and on a daily schedule.
"""

import os
import json
import joblib
import threading
import pandas as pd
import numpy as np
from dataclasses import dataclass, field
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

MODEL_PATH = TRAINED_MODELS_DIR / "xgboost_scorer.pkl"
METRICS_PATH = TRAINED_MODELS_DIR / "xgboost_training_metrics.json"
METADATA_PATH = TRAINED_MODELS_DIR / "xgboost_model_metadata.json"
SCHEMA_PATH = TRAINED_MODELS_DIR / "xgboost_feature_schema.json"

# ── Singleton loader ─────────────────────────────────────────────────────────

class ScorerSingleton(BaseAIEngine):
    _instance = None
    _lock = threading.Lock()
    
    def __init__(self):
        self.model = None
        self.encoders = {}
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
                
            logger.info("scoring_loading", extra={"status": "started"})

            # 1. Model & Encoders
            if not os.path.exists(MODEL_PATH):
                raise ArtifactMissingError(f"XGBoost model not found at {MODEL_PATH}")
            try:
                bundle = joblib.load(MODEL_PATH)
                self.model = bundle["model"]
                self.encoders = bundle["encoders"]
            except Exception as e:
                raise ModelLoadError(f"Failed to load XGBoost bundle: {e}")

            # 2. JSON Artifacts
            self.metrics = self._load_json(METRICS_PATH, "metrics")
            self._metadata = self._load_json(METADATA_PATH, "metadata")
            self.schema = self._load_json(SCHEMA_PATH, "schema")
            
            # 3. Artifact Version Validation
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

            # 4. The warmup is now explicitly called via the BaseAIEngine interface.
            
            self._loaded = True
            
            logger.info("scoring_loading", extra={
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
            
            expected = list(self.model.feature_names_in_)
            if list(mock_payload.keys()) != expected:
                raise FeatureValidationError("Startup Mock: Built feature array does not match expected XGBoost ordering.")

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
        Delegates to the module-level functional compute_score to preserve backward compatibility.
        """
        from app.intelligence.pipelines.scoring import compute_score
        return compute_score(request)

# ── Input / Output types ─────────────────────────────────────────────────────

@dataclass
class ScoringRequest:
    hospital_id:                 str
    hospital_type:               str    # PHC | CHC | DH
    district:                    str
    # Medicine
    medicine_availability_pct:   float  # 0–1
    critical_stockout_count:     int
    low_stock_count:             int
    medicines_tracked:           int
    # Beds
    icu_occupancy_rate:          float  # 0–1
    general_occupancy_rate:      float  # 0-1
    icu_available:               int
    general_available:           int
    total_bed_capacity:          int
    # Staff
    doctor_attendance_rate:      float  # 0-1
    nurse_attendance_rate:       float  # 0-1
    pharmacist_present:          int    # 0 or 1
    lab_tech_present:            int
    total_doctors_present:       int
    # Infrastructure
    active_critical_issues:      int
    active_medium_issues:        int
    equipment_uptime_rate:       float  # 0-1
    power_outage_hours_7d:       int
    water_supply_ok:             int
    pending_issues_count:        int
    # Patients
    daily_opd:                   int
    daily_ipd:                   int
    emergency_admissions:        int
    avg_wait_time_min:           int
    # Citizen feedback
    complaint_rate_7d:           float
    avg_complaint_severity:      float  # 1–5
    citizen_satisfaction:        float  # 1–5
    # Resolution
    issue_resolution_rate_30d:   float  # 0–1
    avg_resolution_days:         float
    # Temporal (auto-computed if not supplied)
    month:                       Optional[int] = None
    quarter:                     Optional[int] = None
    day_of_week:                 Optional[int] = None
    is_weekend:                  Optional[int] = None
    is_monsoon:                  Optional[int] = None
    # Logging Correlation
    correlation_id:              str = "UNKNOWN"


@dataclass
class ScoreResult:
    health_score:      float               # 0–100
    risk_category:     str                 # excellent | good | fair | poor | critical
    risk_color:        str
    contributing_factors: list[dict] = field(default_factory=list)
    improvement_suggestions: list[str] = field(default_factory=list)


def _categorise_score(score: float) -> tuple[str, str]:
    if score >= 80:   return "excellent", "green"
    elif score >= 65: return "good",      "teal"
    elif score >= 50: return "fair",      "yellow"
    elif score >= 35: return "poor",      "orange"
    else:             return "critical",  "red"


def _generate_suggestions(req: ScoringRequest, score: float) -> list[str]:
    suggestions = []
    if req.medicine_availability_pct < 0.7:
        suggestions.append("Medicine availability is below 70%. Initiate emergency procurement.")
    if req.critical_stockout_count > 2:
        suggestions.append(f"{req.critical_stockout_count} critical medicines at stockout risk. Request inter-facility transfer.")
    if req.doctor_attendance_rate < 0.6:
        suggestions.append("Doctor attendance below 60%. Escalate to District Health Officer.")
    if req.active_critical_issues > 1:
        suggestions.append(f"{req.active_critical_issues} critical infrastructure issues unresolved. Contact PWD immediately.")
    if req.complaint_rate_7d > 10:
        suggestions.append(f"Citizen complaints elevated ({req.complaint_rate_7d:.0f} in 7 days). Review service quality.")
    if req.icu_occupancy_rate > 0.9:
        suggestions.append("ICU at >90% capacity. Activate patient diversion protocol.")
    if req.equipment_uptime_rate < 0.75:
        suggestions.append("Equipment uptime below 75%. Contact Biomedical Engineering.")
    if not suggestions:
        suggestions.append("All operational indicators are within acceptable ranges.")
    return suggestions

# ── Validations ──────────────────────────────────────────────────────────────

def _schema_validate(feature_dict: Dict[str, Any], schema: List[Dict[str, Any]]):
    for rule in schema:
        fname = rule["feature_name"]
        if fname not in feature_dict:
            raise FeatureValidationError(f"Missing mandatory feature: {fname}")
            
        val = feature_dict[fname]
        
        if isinstance(val, float) and (np.isnan(val) or np.isinf(val)):
            raise FeatureValidationError(f"Feature '{fname}' cannot be NaN or Infinity.")
            
        if "minimum" in rule and val < rule["minimum"]:
            raise FeatureValidationError(f"Feature '{fname}' ({val}) is below schema minimum ({rule['minimum']}).")
        if "maximum" in rule and val > rule["maximum"]:
            raise FeatureValidationError(f"Feature '{fname}' ({val}) is above schema maximum ({rule['maximum']}).")


# ── Core inference ───────────────────────────────────────────────────────────

def compute_score(req: ScoringRequest) -> ScoreResult:
    start_time = time.perf_counter()
    from datetime import date as _date
    
    loader = ScorerSingleton.get_instance()
    if not loader.is_loaded():
        loader.load()
    
    today = _date.today()
    month      = req.month       or today.month
    quarter    = req.quarter     or (today.month - 1) // 3 + 1
    day_of_week= req.day_of_week or today.weekday()
    is_weekend = req.is_weekend  if req.is_weekend is not None else int(today.weekday() >= 5)
    is_monsoon = req.is_monsoon  if req.is_monsoon is not None else int(month in [6,7,8,9])

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
    except Exception as e:
        logger.error("scoring_validation_failed", extra={"correlation_id": req.correlation_id, "error": str(e)})
        raise e

    feature_dict = {
        "hospital_type":               encoded_type,
        "district":                    encoded_dist,
        "month":                       month,
        "quarter":                     quarter,
        "day_of_week":                 day_of_week,
        "is_weekend":                  is_weekend,
        "is_monsoon":                  is_monsoon,
        "medicine_availability_pct":   req.medicine_availability_pct,
        "critical_stockout_count":     req.critical_stockout_count,
        "low_stock_count":             req.low_stock_count,
        "medicines_tracked":           req.medicines_tracked,
        "icu_occupancy_rate":          req.icu_occupancy_rate,
        "general_occupancy_rate":      req.general_occupancy_rate,
        "icu_available":               req.icu_available,
        "general_available":           req.general_available,
        "total_bed_capacity":          req.total_bed_capacity,
        "doctor_attendance_rate":      req.doctor_attendance_rate,
        "nurse_attendance_rate":       req.nurse_attendance_rate,
        "pharmacist_present":          req.pharmacist_present,
        "lab_tech_present":            req.lab_tech_present,
        "total_doctors_present":       req.total_doctors_present,
        "active_critical_issues":      req.active_critical_issues,
        "active_medium_issues":        req.active_medium_issues,
        "equipment_uptime_rate":       req.equipment_uptime_rate,
        "power_outage_hours_7d":       req.power_outage_hours_7d,
        "water_supply_ok":             req.water_supply_ok,
        "pending_issues_count":        req.pending_issues_count,
        "daily_opd":                   req.daily_opd,
        "daily_ipd":                   req.daily_ipd,
        "emergency_admissions":        req.emergency_admissions,
        "avg_wait_time_min":           req.avg_wait_time_min,
        "complaint_rate_7d":           req.complaint_rate_7d,
        "avg_complaint_severity":      req.avg_complaint_severity,
        "citizen_satisfaction":        req.citizen_satisfaction,
        "issue_resolution_rate_30d":   req.issue_resolution_rate_30d,
        "avg_resolution_days":         req.avg_resolution_days,
    }

    try:
        _schema_validate(feature_dict, loader.schema)
    except FeatureValidationError as e:
        logger.error("scoring_validation_failed", extra={"correlation_id": req.correlation_id, "error": str(e)})
        raise e

    expected_features = list(loader.model.feature_names_in_)
    if list(feature_dict.keys()) != expected_features:
        missing = set(expected_features) - set(feature_dict.keys())
        extra = set(feature_dict.keys()) - set(expected_features)
        err = f"Feature ordering mismatch. Missing: {missing}, Extra: {extra}."
        logger.error("scoring_validation_failed", extra={"correlation_id": req.correlation_id, "error": err})
        raise FeatureValidationError(err)

    try:
        X = pd.DataFrame([feature_dict])
        score = float(loader.model.predict(X)[0])
        score = max(0.0, min(score, 100.0))
    except Exception as e:
        err = f"XGBoost prediction failed: {e}"
        logger.error("scoring_inference_error", extra={"correlation_id": req.correlation_id, "error": err})
        raise InferenceError(err)

    risk_category, risk_color = _categorise_score(score)
    suggestions = _generate_suggestions(req, score)

    importance = dict(zip(
        loader.model.feature_names_in_,
        loader.model.feature_importances_
    ))
    top_factors = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:5]
    contributing_factors = [
        {"feature": k.replace("_", " ").title(), "importance": round(v, 4)}
        for k, v in top_factors
    ]

    exec_time_ms = (time.perf_counter() - start_time) * 1000.0

    logger.info("scoring_completed", extra={
        "correlation_id": req.correlation_id,
        "model_name": "xgboost_scorer",
        "model_version": loader.metadata.get("model_version", "unknown"),
        "dataset_version": loader.metadata.get("dataset_version", "unknown"),
        "execution_time_ms": round(exec_time_ms, 2),
        "hospital_id": req.hospital_id,
        "prediction_health_score": round(score, 1),
        "risk_category": risk_category,
        "top_feature": top_factors[0][0] if top_factors else "None",
        "training_quality": float(loader.metrics.get("r2", 0.0))
    })

    return ScoreResult(
        health_score          = round(score, 1),
        risk_category         = risk_category,
        risk_color            = risk_color,
        contributing_factors  = contributing_factors,
        improvement_suggestions = suggestions,
    )