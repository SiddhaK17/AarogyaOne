"""
ArogyaOne — AI Health Monitoring

Provides diagnostic checks and readiness endpoints for the AI subsystem.
Utilizes the centralized EngineRegistry for state inspection.
"""

from dataclasses import dataclass
from typing import Dict, Any, List

from app.intelligence.core.engine_registry import EngineRegistry

@dataclass
class AIHealthStatus:
    is_loaded: bool
    model_version: str
    dataset_version: str
    device: str
    memory_usage_mb: float
    training_quality_r2: float
    status: str

def _build_status(engine_name: str) -> AIHealthStatus:
    registry = EngineRegistry.get_instance()
    is_loaded = registry.is_loaded(engine_name)
    metrics = registry.get_training_metrics(engine_name)
    mem_usage = registry.get_memory_usage()
    
    return AIHealthStatus(
        is_loaded=is_loaded,
        model_version=registry.get_model_version(engine_name),
        dataset_version=registry.get_dataset_version(engine_name),
        device=registry.get_device(),
        memory_usage_mb=mem_usage.get("allocated_mb", 0.0),
        training_quality_r2=metrics.get("r2", 0.0),
        status="READY" if is_loaded else "OFFLINE"
    )

def check_forecaster() -> AIHealthStatus:
    return _build_status("lightgbm_forecaster")

def check_scorer() -> AIHealthStatus:
    return _build_status("xgboost_scorer")

def check_whisper() -> AIHealthStatus:
    return _build_status("whisper_large_v3")

def check_indicbert() -> AIHealthStatus:
    return _build_status("indicbert_classifier")

def check_florence() -> AIHealthStatus:
    return _build_status("florence_2_vision")

def get_overall_subsystem_health() -> Dict[str, Any]:
    registry = EngineRegistry.get_instance()
    loaded_models = registry.list_loaded_models()
    registered = registry.list_registered_models()
    
    return {
        "status": "HEALTHY" if len(loaded_models) >= 2 else "DEGRADED",
        "device": registry.get_device(),
        "memory_allocated_mb": registry.get_memory_usage().get("allocated_mb", 0.0),
        "loaded_models_count": len(loaded_models),
        "registered_models_count": len(registered),
        "loaded_models": loaded_models
    }
