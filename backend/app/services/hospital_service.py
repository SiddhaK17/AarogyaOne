"""
AarogyaOne — Hospital Service Layer
=========================================================================
Handles all hospital-side intelligence orchestration including inventory
updates, ML forecasting, scoring, and internal alerts.
Connects domain endpoints to underlying intelligence modules.
"""

import asyncio
import logging
import time
import uuid
from typing import Any, Dict, List, Protocol, Optional, Callable
from datetime import datetime, UTC

from app.database import models
from app.intelligence.services.fusion import UnifiedEvidence
from app.intelligence.services.priority import PriorityDecision, PriorityLevel, EscalationLevel, ResponseTime
from app.intelligence.services.recommendation import RecommendationEngine, RecommendationBundle
from app.intelligence.services.dispatcher import DispatcherEngine, DispatchPlan

logger = logging.getLogger("aarogya.services.hospital")

# ════════════════════════════════════════════════════════════════════════════
#  EXCEPTIONS
# ════════════════════════════════════════════════════════════════════════════

class HospitalServiceError(Exception):
    """Base exception for hospital service errors."""
    pass

class HospitalNotFoundError(HospitalServiceError):
    """Raised when a hospital cannot be located in the system."""
    pass

class ForecastingPipelineUnavailableError(HospitalServiceError):
    """Raised when the ML forecasting engine is not deployed."""
    pass

class HospitalScoringEngineUnavailableError(HospitalServiceError):
    """Raised when the ML hospital scoring engine is not deployed."""
    pass

class RepositoryError(HospitalServiceError):
    """Raised when a repository operation fails."""
    pass

class NotificationError(HospitalServiceError):
    """Raised when an alert or notification generation fails."""
    pass

# ════════════════════════════════════════════════════════════════════════════
#  PROTOCOLS (DEPENDENCY INJECTION INTERFACES)
# ════════════════════════════════════════════════════════════════════════════

class HospitalRepository(Protocol):
    async def get_by_id(self, hospital_id: int) -> Optional[models.Hospital]: ...
    async def save_performance_score(self, hospital_id: int, score: float, timestamp: datetime) -> None: ...
    async def get_resolution_metrics(self, hospital_id: int) -> Optional[Dict[str, Any]]: ...

class InventoryRepository(Protocol):
    async def update_inventory(self, hospital_id: int, item_id: int, quantity: int) -> None: ...
    async def get_historical_inventory(self, hospital_id: int, days: int = 30) -> List[Dict[str, Any]]: ...

class BedOccupancyRepository(Protocol):
    async def update_occupancy(self, hospital_id: int, category: str, occupied_count: int) -> None: ...
    async def get_historical_occupancy(self, hospital_id: int, category: str, days: int = 30) -> List[Dict[str, Any]]: ...

class AlertRepository(Protocol):
    async def create_internal_alert(self, hospital_id: int, alert_type: str, message: str, severity: str) -> str: ...
    async def generate_notification(self, hospital_id: int, audience: str, payload: Dict[str, Any]) -> str: ...

class ForecastingEngineProtocol(Protocol):
    def predict_inventory_depletion(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predicts inventory depletion based on historical usage."""
        ...
    def predict_bed_capacity(self, historical_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Predicts bed occupancy levels."""
        ...

class HospitalScoringEngineProtocol(Protocol):
    def calculate_health_score(self, metrics: Dict[str, Any]) -> float:
        """Calculates hospital performance score based on metrics."""
        ...

# ════════════════════════════════════════════════════════════════════════════
#  SERVICE
# ════════════════════════════════════════════════════════════════════════════

class HospitalService:
    """
    Orchestrates intelligence and operational workflows specific to hospital 
    administration, inventory, and automated scoring.
    """

    def __init__(
        self,
        hospital_repo: HospitalRepository,
        inventory_repo: InventoryRepository,
        bed_repo: BedOccupancyRepository,
        alert_repo: AlertRepository,
        forecaster: ForecastingEngineProtocol,
        scorer: HospitalScoringEngineProtocol,
        recommender_factory: Callable[[PriorityDecision], RecommendationEngine],
        dispatcher_factory: Callable[[PriorityDecision, RecommendationBundle], DispatcherEngine]
    ) -> None:
        """
        Initializes the HospitalService with data and intelligence dependencies.
        """
        self._hospital_repo = hospital_repo
        self._inventory_repo = inventory_repo
        self._bed_repo = bed_repo
        self._alert_repo = alert_repo
        self._forecaster = forecaster
        self._scorer = scorer
        self._recommender_factory = recommender_factory
        self._dispatcher_factory = dispatcher_factory

    async def _ensure_hospital_exists(self, hospital_id: str, log_ctx: dict) -> models.Hospital:
        """Validates existence of hospital record."""
        try:
            hospital = await self._hospital_repo.get_by_id(int(hospital_id))
        except Exception as e:
            raise RepositoryError(f"Database error fetching hospital: {e}") from e
            
        if not hospital:
            raise HospitalNotFoundError(f"Hospital {hospital_id} not found.")
        return hospital

    async def update_and_forecast_inventory(self, hospital_id: str, item_id: str, current_quantity: int) -> Dict[str, Any]:
        """
        Updates the current inventory for an item, fetches historical data,
        and triggers a forecast to predict depletion.
        """
        start_time = time.perf_counter()
        correlation_id = f"HOSP-INV-{uuid.uuid4()}"
        log_ctx = {"hospital_id": hospital_id, "correlation_id": correlation_id}
        
        logger.info("Updating inventory for item %s", item_id, extra=log_ctx)
        await self._ensure_hospital_exists(hospital_id, log_ctx)
        
        try:
            await self._inventory_repo.update_inventory(int(hospital_id), int(item_id), current_quantity)
            history = await self._inventory_repo.get_historical_inventory(int(hospital_id), days=60)
        except Exception as e:
            raise RepositoryError(f"Failed to update or fetch inventory: {e}") from e
        
        if not history:
            logger.warning("Insufficient historical data for forecasting", extra=log_ctx)
            return {"forecast_available": False, "reason": "Insufficient history"}

        logger.info("Triggering inventory forecasting", extra=log_ctx)
        try:
            forecast = await asyncio.to_thread(self._forecaster.predict_inventory_depletion, history)
            forecast_confidence = forecast.get("confidence", 0.0)
            log_ctx["forecast_confidence"] = forecast_confidence
        except NotImplementedError as e:
            logger.warning("Forecasting pipeline is currently unavailable", extra=log_ctx)
            raise ForecastingPipelineUnavailableError("Forecasting engine not yet implemented.") from e
        except Exception as e:
            logger.exception("Forecasting engine failed", extra=log_ctx)
            raise ForecastingPipelineUnavailableError(f"Forecasting engine error: {e}") from e

        try:
            days_remaining = forecast.get("estimated_days_remaining", 999)
            if days_remaining < 7:
                await self._alert_repo.create_internal_alert(
                    hospital_id=int(hospital_id),
                    alert_type="INVENTORY_SHORTAGE",
                    message=f"Critical depletion predicted for item {item_id} in {days_remaining} days.",
                    severity="HIGH"
                )
        except Exception as e:
            raise NotificationError(f"Failed to create inventory alert: {e}") from e
                
        exec_time = round(time.perf_counter() - start_time, 3)
        log_ctx["execution_time"] = exec_time
        logger.info("Inventory updated and forecast generated successfully", extra=log_ctx)
            
        return {"forecast_available": True, "predictions": forecast}

    async def update_and_forecast_beds(self, hospital_id: str, category: str, occupied_count: int) -> Dict[str, Any]:
        """
        Updates the bed occupancy and predicts future capacity issues.
        """
        start_time = time.perf_counter()
        correlation_id = f"HOSP-BED-{uuid.uuid4()}"
        log_ctx = {"hospital_id": hospital_id, "correlation_id": correlation_id}
        
        logger.info("Updating bed occupancy for category %s", category, extra=log_ctx)
        await self._ensure_hospital_exists(hospital_id, log_ctx)
        
        try:
            await self._bed_repo.update_occupancy(int(hospital_id), category, occupied_count)
            history = await self._bed_repo.get_historical_occupancy(int(hospital_id), category, days=30)
        except Exception as e:
            raise RepositoryError(f"Failed to update or fetch bed occupancy: {e}") from e

        if not history:
            logger.warning("Insufficient historical data for bed forecasting", extra=log_ctx)
            return {"forecast_available": False, "reason": "Insufficient history"}

        logger.info("Triggering bed capacity forecasting", extra=log_ctx)
        try:
            forecast = await asyncio.to_thread(self._forecaster.predict_bed_capacity, history)
            forecast_confidence = forecast.get("confidence", 0.0)
            log_ctx["forecast_confidence"] = forecast_confidence
        except NotImplementedError as e:
            logger.warning("Forecasting pipeline is currently unavailable", extra=log_ctx)
            raise ForecastingPipelineUnavailableError("Forecasting engine not yet implemented.") from e
        except Exception as e:
            logger.exception("Bed forecasting engine failed", extra=log_ctx)
            raise ForecastingPipelineUnavailableError(f"Bed forecasting engine error: {e}") from e

        try:
            overload_probability = forecast.get("overload_probability", 0.0)
            if overload_probability > 0.8:
                await self._alert_repo.create_internal_alert(
                    hospital_id=int(hospital_id),
                    alert_type="CAPACITY_WARNING",
                    message=f"High probability of {category} bed overload in the next 24 hours.",
                    severity="CRITICAL"
                )
        except Exception as e:
            raise NotificationError(f"Failed to create capacity alert: {e}") from e
                
        exec_time = round(time.perf_counter() - start_time, 3)
        log_ctx["execution_time"] = exec_time
        logger.info("Bed occupancy updated and forecast generated successfully", extra=log_ctx)
            
        return {"forecast_available": True, "predictions": forecast}

    async def calculate_hospital_scoring(self, hospital_id: str) -> float:
        """
        Computes the performance score of a hospital based on metrics using the scoring engine.
        If metrics are unavailable, defaults to a neutral score (e.g., 100).
        """
        start_time = time.perf_counter()
        correlation_id = f"HOSP-SCORE-{uuid.uuid4()}"
        log_ctx = {"hospital_id": hospital_id, "correlation_id": correlation_id}
        
        logger.info("Calculating performance score", extra=log_ctx)
        await self._ensure_hospital_exists(hospital_id, log_ctx)
        
        try:
            metrics = await self._hospital_repo.get_resolution_metrics(int(hospital_id))
        except Exception as e:
            raise RepositoryError(f"Failed to fetch resolution metrics: {e}") from e
        
        if metrics is None:
            logger.warning("Resolution metrics unavailable for scoring, defaulting score.", extra=log_ctx)
            score = 100.0
        else:
            logger.info("Triggering scoring engine", extra=log_ctx)
            try:
                score = await asyncio.to_thread(self._scorer.calculate_health_score, metrics)
            except NotImplementedError as e:
                logger.warning("Scoring pipeline is currently unavailable", extra=log_ctx)
                raise HospitalScoringEngineUnavailableError("Scoring engine not yet implemented.") from e
            except Exception as e:
                logger.exception("Scoring engine failed", extra=log_ctx)
                raise HospitalScoringEngineUnavailableError(f"Scoring engine error: {e}") from e
        
        score = round(score, 2)
        try:
            await self._hospital_repo.save_performance_score(int(hospital_id), score, datetime.now(UTC))
            if score < 60.0:
                await self._alert_repo.create_internal_alert(
                    hospital_id=int(hospital_id),
                    alert_type="PERFORMANCE_WARNING",
                    message=f"Hospital score dropped to {score}. Immediate management review required.",
                    severity="CRITICAL"
                )
        except Exception as e:
            raise RepositoryError(f"Failed to save score or create alert: {e}") from e
            
        exec_time = round(time.perf_counter() - start_time, 3)
        log_ctx["execution_time"] = exec_time
        logger.info("Calculated score %.2f", score, extra=log_ctx)
        
        return score

    async def process_critical_incident(self, hospital_id: str, incident_category: str, priority_score: int, recommended_department: str) -> Dict[str, Any]:
        """
        Orchestrates recommendations and dispatch tasks for a critical incident.
        """
        start_time = time.perf_counter()
        correlation_id = f"HOSP-INCIDENT-{uuid.uuid4()}"
        log_ctx = {"hospital_id": hospital_id, "correlation_id": correlation_id}
        
        logger.info("Processing critical incident for category %s", incident_category, extra=log_ctx)
        await self._ensure_hospital_exists(hospital_id, log_ctx)
        
        # 1. Map to PriorityDecision (Simulation of priority pipeline output for this incident)
        priority_level = PriorityLevel.CRITICAL if priority_score > 80 else PriorityLevel.HIGH
        decision = PriorityDecision(
            decision_id=f"INCIDENT-{uuid.uuid4()}",
            timestamp=datetime.now(UTC).isoformat(),
            priority_score=priority_score,
            priority_level=priority_level,
            escalation_level=EscalationLevel.DISTRICT,
            recommended_department=recommended_department,
            confidence=0.95,
            decision_summary=f"Category: {incident_category}",
            response_time=ResponseTime.IMMEDIATE,
            government_action="Awaiting generation",
            hospital_action="Awaiting generation",
            reasoning="Critical incident triggered from service layer.",
            breakdown=None
        )
        
        try:
            # 2. Generate Recommendations
            recommender = self._recommender_factory(decision)
            bundle = await asyncio.to_thread(recommender.generate)
            
            recommendation_count = (
                len(bundle.government_recommendations) +
                len(bundle.hospital_recommendations) +
                len(bundle.preventive_recommendations) +
                len(bundle.technical_recommendations)
            )
            log_ctx["recommendation_count"] = recommendation_count
            logger.info("Generated %d recommendations", recommendation_count, extra=log_ctx)
            
            # 3. Generate Dispatch Plan
            dispatcher = self._dispatcher_factory(decision, bundle)
            dispatch_plan = await asyncio.to_thread(dispatcher.dispatch)
            logger.info("Generated dispatch plan with %d tasks", len(dispatch_plan.tasks), extra=log_ctx)
            
            # 4. Notify via Alert Repository
            for target in dispatch_plan.notification_targets:
                await self._alert_repo.generate_notification(
                    hospital_id=int(hospital_id),
                    audience=target,
                    payload={"action": "CRITICAL_INCIDENT", "plan_id": dispatch_plan.plan_id}
                )
                
        except Exception as e:
            logger.exception("Failed to process critical incident workflow", extra=log_ctx)
            raise HospitalServiceError(f"Incident processing error: {e}") from e
            
        exec_time = round(time.perf_counter() - start_time, 3)
        log_ctx["execution_time"] = exec_time
        logger.info("Incident processed successfully", extra=log_ctx)
                
        return {
            "recommendation_bundle_id": bundle.bundle_id,
            "dispatch_plan_id": dispatch_plan.plan_id,
            "tasks_generated": len(dispatch_plan.tasks),
            "estimated_duration": dispatch_plan.estimated_total_duration
        }
