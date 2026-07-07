"""
ArogyaOne — Central Engine & Metadata Registry

Maintains wrapped singleton references to all production AI engines.
Does NOT instantiate models directly; rather, it coordinates the existing
module-level Singletons to ensure safe lifecycle management, metadata reporting,
and strict initialization validation.
"""

import logging
from typing import Dict, Any, List

from app.intelligence.pipelines.exceptions import ModelUnavailableError
from app.intelligence.utils.device import get_device_info
from app.intelligence.core.base_engine import BaseAIEngine

logger = logging.getLogger(__name__)

# Import the individual singletons/engines
from app.intelligence.pipelines.forecasting import ForecasterSingleton
from app.intelligence.pipelines.scoring import ScorerSingleton
from app.intelligence.pipelines.nlp import NLPEngine
from app.intelligence.pipelines.speech import SpeechEngine
from app.intelligence.pipelines.vision import VisionEngine
from app.intelligence.pipelines.translation import TranslationEngine

class EngineRegistry:
    _instance = None
    
    def __init__(self):
        self._engines: Dict[str, BaseAIEngine] = {}
        
        # Register engines during construction
        self.register_engine("lightgbm_forecaster", ForecasterSingleton.get_instance())
        self.register_engine("xgboost_scorer", ScorerSingleton.get_instance())
        self.register_engine("whisper_large_v3", SpeechEngine())
        self.register_engine("indicbert_classifier", NLPEngine())
        self.register_engine("florence_2_vision", VisionEngine())
        self.register_engine("indictrans2_translator", TranslationEngine())

    def register_engine(self, engine_name: str, engine: BaseAIEngine) -> None:
        """Validates and registers an engine."""
        if engine_name in self._engines:
            raise ValueError(f"Engine {engine_name} is already registered.")
        if not isinstance(engine, BaseAIEngine):
            raise TypeError(f"Engine {engine_name} must inherit from BaseAIEngine.")
        self._engines[engine_name] = engine
        
    @classmethod
    def get_instance(cls) -> "EngineRegistry":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_engine(self, engine_name: str) -> BaseAIEngine:
        engine = self._engines.get(engine_name)
        if engine is None:
            raise ModelUnavailableError(f"Engine {engine_name} not found in registry.")
        if not engine.is_loaded():
            raise ModelUnavailableError(f"Engine {engine_name} is not loaded. Ensure startup warmup completed.")
        return engine
        
    def get_all_engines(self) -> Dict[str, BaseAIEngine]:
        return self._engines

    # ── Engine Accessors (Legacy Helpers) ────────────────────────────────────

    def get_forecaster(self):
        return self.get_engine("lightgbm_forecaster")

    def get_scorer(self):
        return self.get_engine("xgboost_scorer")
        
    def get_optimizer(self):
        # Optimization is a functional pipeline relying on pywraplp, no singleton object needed.
        # But we return the module reference for consistency.
        from app.intelligence.pipelines import optimization
        return optimization

    def get_whisper(self):
        return self.get_engine("whisper_large_v3")

    def get_indicbert(self):
        return self.get_engine("indicbert_classifier")

    def get_florence(self):
        return self.get_engine("florence_2_vision")

    # ── Metadata APIs ────────────────────────────────────────────────────────
    
    def list_registered_models(self) -> List[str]:
        # Include optimization for backward compatibility in reporting
        return list(self._engines.keys()) + ["ortools_optimizer"]
        
    def list_loaded_models(self) -> List[str]:
        loaded = [name for name, engine in self._engines.items() if engine.is_loaded()]
        loaded.append("ortools_optimizer") # always available if imported
        return loaded

    def get_model_version(self, engine_name: str) -> str:
        if engine_name in self._engines:
            return self._engines[engine_name].metadata().get("model_version", "unknown")
        return "1.0"

    def get_dataset_version(self, engine_name: str) -> str:
        if engine_name in self._engines:
            return self._engines[engine_name].metadata().get("dataset_version", "unknown")
        return "unknown"

    def get_training_metrics(self, engine_name: str) -> Dict[str, Any]:
        if engine_name == "lightgbm_forecaster":
            # Backward compat for health module explicitly grabbing metrics from the property
            return self.get_forecaster().metrics if self.get_forecaster().is_loaded() else {}
        if engine_name == "xgboost_scorer":
            return self.get_scorer().metrics if self.get_scorer().is_loaded() else {}
        return {}

    def get_device(self) -> str:
        info = get_device_info()
        return info["current_device"]

    def get_memory_usage(self) -> Dict[str, Any]:
        info = get_device_info()
        return {
            "allocated_mb": info.get("memory_allocated_mb", 0.0),
            "reserved_mb": info.get("memory_reserved_mb", 0.0)
        }

    def is_loaded(self, engine_name: str) -> bool:
        if engine_name in self._engines:
            return self._engines[engine_name].is_loaded()
        if engine_name == "ortools_optimizer":
            return True
        return False
