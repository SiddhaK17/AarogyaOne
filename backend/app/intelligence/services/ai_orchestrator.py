"""
ArogyaOne — AI Orchestrator

The single entry point for all backend business services (HospitalService, ComplaintService)
to interact with the AI subsystem.

It strictly delegates to the underlying engines via the EngineRegistry,
enforcing unified logging and preventing direct instantiation by external modules.
No business logic or database access occurs here.
"""

import logging
from typing import List

from app.intelligence.core.engine_registry import EngineRegistry
from app.intelligence.utils.logging import log_execution_time
from app.intelligence.pipelines.forecasting import ForecastRequest, ForecastResult
from app.intelligence.pipelines.scoring import ScoringRequest, ScoreResult
from app.intelligence.pipelines.optimization import HospitalNode, OptimisationResult

logger = logging.getLogger(__name__)

class AIOrchestrator:
    def __init__(self):
        self.registry = EngineRegistry.get_instance()

    @log_execution_time("orchestrate_forecast")
    def predict_inventory_stockout(self, request: ForecastRequest) -> ForecastResult:
        """Delegates to the LightGBM Forecasting Engine."""
        engine = self.registry.get_forecaster()
        return engine.predict(request)

    @log_execution_time("orchestrate_scoring")
    def score_hospital_health(self, request: ScoringRequest) -> ScoreResult:
        """Delegates to the XGBoost Scoring Engine."""
        engine = self.registry.get_scorer()
        return engine.predict(request)

    @log_execution_time("orchestrate_optimization")
    def optimize_resource_transfer(
        self, 
        deficit_hospital: HospitalNode, 
        all_hospitals: List[HospitalNode],
        resource_name: str,
        required_quantity: float,
        correlation_id: str = "UNKNOWN"
    ) -> OptimisationResult:
        """Delegates to the OR-Tools Optimization Engine."""
        opt_engine = self.registry.get_optimizer()
        return opt_engine.find_optimal_transfer(
            deficit_hospital, 
            all_hospitals, 
            resource_name, 
            required_quantity, 
            correlation_id
        )

    @log_execution_time("orchestrate_transcription")
    def transcribe_audio(self, audio_path: str, correlation_id: str = "UNKNOWN"):
        """Delegates to the Whisper Speech-to-Text Engine."""
        engine = self.registry.get_whisper()
        return engine.transcribe(audio_path)

    @log_execution_time("orchestrate_nlp_classification")
    def classify_grievance(self, text: str, correlation_id: str = "UNKNOWN"):
        """Delegates to the IndicBERT Classification Engine."""
        engine = self.registry.get_indicbert()
        return engine.predict(text)

    @log_execution_time("orchestrate_vision_analysis")
    def analyze_image(self, image_path: str, correlation_id: str = "UNKNOWN"):
        """Delegates to the Florence-2 Vision Engine."""
        engine = self.registry.get_florence()
        return engine.analyze(image_path)
