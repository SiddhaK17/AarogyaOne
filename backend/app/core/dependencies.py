"""
AarogyaOne Backend — Dependencies
=========================================================================
Provides FastAPI dependency injection functions.
"""
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
import app.intelligence.pipelines.nlp  # noqa: F401

from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database.connection import get_db
from app.services.complaint_service import ComplaintService
from app.intelligence.pipelines.workflow import WorkflowEngine
from app.database.repositories import (
    SQLAlchemyComplaintRepository,
    SQLAlchemyTaskRepository,
    SQLAlchemyNotificationRepository,
    SQLAlchemyTransaction,
    SQLAlchemyHospitalRepository,
    SQLAlchemyBedOccupancyRepository,
    SQLAlchemyInventoryRepository
)
from app.services.hospital_service import (
    HospitalService,
    ForecastingPipelineUnavailableError,
    HospitalScoringEngineUnavailableError
)
from app.intelligence.services.priority import PriorityDecision
from app.intelligence.services.recommendation import RecommendationEngine, RecommendationBundle
from app.intelligence.services.dispatcher import DispatcherEngine

def workflow_engine_factory(
    text: Optional[str] = None,
    audio_path: Optional[str] = None,
    image_path: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> WorkflowEngine:
    """Factory function for creating WorkflowEngine instances."""
    return WorkflowEngine(
        text=text,
        audio_path=audio_path,
        image_path=image_path,
        metadata=metadata
    )

def get_complaint_service(db: Session = Depends(get_db)) -> ComplaintService:
    """
    Constructs the ComplaintService using proper concrete repositories.
    """
    return ComplaintService(
        complaint_repo=SQLAlchemyComplaintRepository(db),
        task_repo=SQLAlchemyTaskRepository(db),
        notification_repo=SQLAlchemyNotificationRepository(db),
        transaction=SQLAlchemyTransaction(db),
        workflow_engine_factory=workflow_engine_factory
    )

class UnavailableForecastingEngine:
    def predict_inventory_depletion(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        raise ForecastingPipelineUnavailableError("Forecasting engine not yet implemented.")
        
    def predict_bed_capacity(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        raise ForecastingPipelineUnavailableError("Forecasting engine not yet implemented.")

class UnavailableHospitalScoringEngine:
    def calculate_health_score(self, metrics: Dict[str, Any]) -> float:
        raise HospitalScoringEngineUnavailableError("Scoring engine not yet implemented.")

def recommender_factory(decision: PriorityDecision) -> RecommendationEngine:
    return RecommendationEngine(decision=decision)

def dispatcher_factory(decision: PriorityDecision, bundle: RecommendationBundle) -> DispatcherEngine:
    return DispatcherEngine(decision=decision, bundle=bundle)

def get_hospital_service(db: Session = Depends(get_db)) -> HospitalService:
    """
    Constructs the HospitalService using concrete repositories and stubbed AI engines.
    """
    return HospitalService(
        hospital_repo=SQLAlchemyHospitalRepository(db),
        inventory_repo=SQLAlchemyInventoryRepository(db),
        bed_repo=SQLAlchemyBedOccupancyRepository(db),
        alert_repo=SQLAlchemyNotificationRepository(db),
        forecaster=UnavailableForecastingEngine(),
        scorer=UnavailableHospitalScoringEngine(),
        recommender_factory=recommender_factory,
        dispatcher_factory=dispatcher_factory
    )
