"""
AarogyaOne — AI Workflow Engine
=========================================================================
Final orchestration layer that coordinates Speech, Vision, NLP, Fusion,
Priority, Recommendation, and Dispatcher engines.

Performs NO AI inference, NO database operations, NO HTTP requests, 
NO Celery executions, and NO file writes. Only orchestrates execution.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, UTC
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.intelligence.pipelines.speech import SpeechEngine, TranscriptResult
from app.intelligence.pipelines.vision import VisionEngine, VisionResult
from app.intelligence.pipelines.nlp import NLPEngine
from app.intelligence.services.fusion import FusionEngine, UnifiedEvidence, SpeechEvidence, VisionEvidence, NLPEvidence
from app.intelligence.services.priority import PriorityEngine, PriorityDecision
from app.intelligence.services.recommendation import RecommendationEngine, RecommendationBundle
from app.intelligence.services.dispatcher import DispatcherEngine, DispatchPlan

# ── LOGGING ─────────────────────────────────────────────────────────────────
logger = logging.getLogger("aarogya.workflow_engine")

# ════════════════════════════════════════════════════════════════════════════
#  ENUMERATIONS
# ════════════════════════════════════════════════════════════════════════════

class WorkflowStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS"
    FAILED = "FAILED"

# ════════════════════════════════════════════════════════════════════════════
#  DATACLASSES
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class WorkflowMetrics:
    """Tracks execution time of each independent orchestration stage."""
    speech_time: float = 0.0
    vision_time: float = 0.0
    nlp_time: float = 0.0
    fusion_time: float = 0.0
    priority_time: float = 0.0
    recommendation_time: float = 0.0
    dispatcher_time: float = 0.0
    total_time: float = 0.0

@dataclass(frozen=True)
class WorkflowResult:
    """The complete, immutable final outcome of the grievance execution pipeline."""
    workflow_id: str
    timestamp: str
    status: WorkflowStatus
    speech_result: Optional[Any]
    vision_result: Optional[Any]
    nlp_result: Optional[Any]
    fusion_result: Optional[UnifiedEvidence]
    priority_result: Optional[PriorityDecision]
    recommendation_result: Optional[RecommendationBundle]
    dispatch_result: Optional[DispatchPlan]
    metrics: WorkflowMetrics
    errors: List[str]

# ════════════════════════════════════════════════════════════════════════════
#  ENGINE
# ════════════════════════════════════════════════════════════════════════════

class WorkflowEngine:
    """
    Final orchestration layer coordinating the progression of a grievance 
    through all AI and deterministic logic stages.
    """

    def __init__(
        self, 
        text: Optional[str] = None, 
        audio_path: Optional[str] = None, 
        image_path: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Initializes the WorkflowEngine. Modalities are optional.

        Args:
            text (Optional[str]): Text complaint (if available).
            audio_path (Optional[str]): Path to audio complaint (if available).
            image_path (Optional[str]): Path to image evidence (if available).
            metadata (Optional[Dict[str, Any]]): Additional metadata context.
        """
        self.text = text
        self.audio_path = audio_path
        self.image_path = image_path
        self.metadata = metadata or {}
        
        self.metrics = WorkflowMetrics()
        self.errors: List[str] = []
        
        self.speech_result: Optional[Any] = None
        self.vision_result: Optional[Any] = None
        self.nlp_result: Optional[Any] = None
        self.fusion_result: Optional[UnifiedEvidence] = None
        self.priority_result: Optional[PriorityDecision] = None
        self.recommendation_result: Optional[RecommendationBundle] = None
        self.dispatch_result: Optional[DispatchPlan] = None
        self._result: Optional[WorkflowResult] = None

    def _validate_input(self) -> None:
        """
        Validates the initial input payload to ensure at least one modality exists.
        
        Raises:
            ValueError: If completely empty payload.
            FileNotFoundError: If audio or image paths are missing.
        """
        if not self.text and not self.audio_path and not self.image_path:
            raise ValueError("Payload must contain at least one of: text, audio_path, image_path.")
            
        if self.audio_path:
            p = Path(self.audio_path)
            if not p.is_file():
                raise FileNotFoundError(f"Audio file not found: {self.audio_path}")
                
        if self.image_path:
            p = Path(self.image_path)
            if not p.is_file():
                raise FileNotFoundError(f"Image file not found: {self.image_path}")
                
        if self.text and not str(self.text).strip():
            raise ValueError("Text payload provided but is empty.")
            
        logger.info("Input validated")

    def _run_speech(self) -> None:
        """Executes the SpeechEngine if an audio path is provided."""
        if not self.audio_path:
            return
            
        t0 = time.perf_counter()
        try:
            engine = SpeechEngine()
            raw_res = engine.transcribe(self.audio_path)
            self.speech_result = SpeechEvidence(
                transcript=raw_res.transcript,
                language=raw_res.language,
                language_code=raw_res.language_code,
                processing_time=raw_res.processing_time,
                confidence=None,
                metadata=raw_res.audio_metadata
            )
            logger.info("Speech completed")
        except Exception as e:
            logger.exception("Failed to execute Speech Engine.")
            self.errors.append(f"SpeechEngine Error: {type(e).__name__}: {e}")
        finally:
            self.metrics.speech_time = round(time.perf_counter() - t0, 3)

    def _run_vision(self) -> None:
        """Executes the VisionEngine if an image path is provided."""
        if not self.image_path:
            return
            
        t0 = time.perf_counter()
        try:
            engine = VisionEngine()
            raw_res = engine.process_image(self.image_path)
            self.vision_result = VisionEvidence(
                detected_objects=[asdict(obj) for obj in raw_res.objects],
                ocr_text=raw_res.ocr_text,
                caption=raw_res.caption,
                scene_summary=raw_res.scene_summary,
                evidence_summary="",
                risk_level=raw_res.overall_risk,
                confidence=raw_res.overall_confidence,
                annotated_image_path=raw_res.annotated_image_path,
                image_metadata=raw_res.image_metadata,
                processing_time=raw_res.processing_time
            )
            logger.info("Vision completed")
        except Exception as e:
            logger.exception("Failed to execute Vision Engine.")
            self.errors.append(f"VisionEngine Error: {type(e).__name__}: {e}")
        finally:
            self.metrics.vision_time = round(time.perf_counter() - t0, 3)

    def _run_nlp(self) -> None:
        """Executes the NLPEngine using direct text or fallback speech transcript."""
        t0 = time.perf_counter()
        try:
            text_to_process = self.text
            if not text_to_process and self.speech_result:
                text_to_process = getattr(self.speech_result, 'transcript', None)
                
            if text_to_process:
                text_to_process = str(text_to_process).strip()
                
            if not text_to_process:
                return
                
            engine = NLPEngine()
            raw_res = engine.predict(text_to_process)
            res_dict = raw_res[0] if isinstance(raw_res, list) else raw_res
            self.nlp_result = NLPEvidence(
                complaint_category=res_dict.get("category", "Unknown"),
                sentiment="Negative" if res_dict.get("severity") in ["Critical", "High"] else "Neutral",
                urgency=res_dict.get("severity", "Medium"),
                confidence=res_dict.get("confidence", 0.0),
                entities=[],
                keywords=[],
                processing_time=round(time.perf_counter() - t0, 3)
            )
            logger.info("NLP completed")
        except Exception as e:
            logger.exception("Failed to execute NLP Engine.")
            self.errors.append(f"NLPEngine Error: {type(e).__name__}: {e}")
        finally:
            self.metrics.nlp_time = round(time.perf_counter() - t0, 3)

    def _run_fusion(self) -> None:
        """Executes the FusionEngine to combine all available multi-modal evidence."""
        t0 = time.perf_counter()
        try:
            engine = FusionEngine(
                speech_output=self.speech_result,
                vision_output=self.vision_result,
                nlp_output=self.nlp_result,
                metadata=self.metadata
            )
            self.fusion_result = engine.fuse()
            logger.info("Fusion completed")
        except Exception as e:
            logger.exception("Failed to execute Fusion Engine.")
            self.errors.append(f"FusionEngine Error: {type(e).__name__}: {e}")
        finally:
            self.metrics.fusion_time = round(time.perf_counter() - t0, 3)

    def _run_priority(self) -> None:
        """Executes the PriorityEngine utilizing the unified fusion evidence."""
        if not self.fusion_result:
            return
            
        t0 = time.perf_counter()
        try:
            engine = PriorityEngine(self.fusion_result)
            self.priority_result = engine.evaluate()
            logger.info("Priority completed")
        except Exception as e:
            logger.exception("Failed to execute Priority Engine.")
            self.errors.append(f"PriorityEngine Error: {type(e).__name__}: {e}")
        finally:
            self.metrics.priority_time = round(time.perf_counter() - t0, 3)

    def _run_recommendation(self) -> None:
        """Executes the RecommendationEngine based on priority decisions."""
        if not self.priority_result:
            return
            
        t0 = time.perf_counter()
        try:
            engine = RecommendationEngine(self.priority_result)
            self.recommendation_result = engine.generate()
            logger.info("Recommendation completed")
        except Exception as e:
            logger.exception("Failed to execute Recommendation Engine.")
            self.errors.append(f"RecommendationEngine Error: {type(e).__name__}: {e}")
        finally:
            self.metrics.recommendation_time = round(time.perf_counter() - t0, 3)

    def _run_dispatcher(self) -> None:
        """Executes the DispatcherEngine to build the final workflow execution plan."""
        if not self.priority_result or not self.recommendation_result:
            return
            
        t0 = time.perf_counter()
        try:
            engine = DispatcherEngine(self.priority_result, self.recommendation_result)
            self.dispatch_result = engine.dispatch()
            logger.info("Dispatcher completed")
        except Exception as e:
            logger.exception("Failed to execute Dispatcher Engine.")
            self.errors.append(f"DispatcherEngine Error: {type(e).__name__}: {e}")
        finally:
            self.metrics.dispatcher_time = round(time.perf_counter() - t0, 3)

    def _determine_status(self) -> WorkflowStatus:
        """
        Determines the final workflow status based on component success.

        Returns:
            WorkflowStatus: Calculated overall orchestration status.
        """
        if not self.errors and self.dispatch_result:
            return WorkflowStatus.SUCCESS
        elif self.dispatch_result or self.fusion_result:
            return WorkflowStatus.PARTIAL_SUCCESS
        return WorkflowStatus.FAILED

    def _collect_metrics(self, start_time: float) -> None:
        """
        Calculates total workflow execution time.

        Args:
            start_time (float): The perf_counter timestamp when workflow started.
        """
        self.metrics.total_time = round(time.perf_counter() - start_time, 3)

    def run(self) -> WorkflowResult:
        """
        Executes the fully orchestrated pipeline with extensive fault tolerance.
        Resets internal state so the same instance can execute multiple workflows safely.

        Returns:
            WorkflowResult: The immutable collection of all engine outputs.
        """
        logger.info("Workflow started")
        start_time = time.perf_counter()
        
        # Reset state for fresh execution
        self.metrics = WorkflowMetrics()
        self.errors = []
        self.speech_result = None
        self.vision_result = None
        self.nlp_result = None
        self.fusion_result = None
        self.priority_result = None
        self.recommendation_result = None
        self.dispatch_result = None
        self._result = None
        
        try:
            self._validate_input()
        except Exception as e:
            logger.exception("Input validation failed.")
            self.errors.append(f"ValidationError: {type(e).__name__}: {e}")
            self._collect_metrics(start_time)
            
            result = WorkflowResult(
                workflow_id=str(uuid.uuid4()),
                timestamp=datetime.now(UTC).isoformat(),
                status=WorkflowStatus.FAILED,
                speech_result=None,
                vision_result=None,
                nlp_result=None,
                fusion_result=None,
                priority_result=None,
                recommendation_result=None,
                dispatch_result=None,
                metrics=self.metrics,
                errors=self.errors
            )
            self._result = result
            logger.info("Workflow completed with status %s in %.3f seconds.", result.status.value, self.metrics.total_time)
            return result

        # Execute isolated pipeline steps
        self._run_speech()
        self._run_vision()
        self._run_nlp()
        self._run_fusion()
        self._run_priority()
        self._run_recommendation()
        self._run_dispatcher()
        
        self._collect_metrics(start_time)
        status = self._determine_status()
        
        result = WorkflowResult(
            workflow_id=str(uuid.uuid4()),
            timestamp=datetime.now(UTC).isoformat(),
            status=status,
            speech_result=self.speech_result,
            vision_result=self.vision_result,
            nlp_result=self.nlp_result,
            fusion_result=self.fusion_result,
            priority_result=self.priority_result,
            recommendation_result=self.recommendation_result,
            dispatch_result=self.dispatch_result,
            metrics=self.metrics,
            errors=self.errors
        )
        
        self._result = result
        logger.info("Workflow completed with status %s in %.3f seconds.", result.status.value, self.metrics.total_time)
        return result

    def export_dict(self) -> Dict[str, Any]:
        """
        Serializes the previously generated WorkflowResult into a dictionary.
        Will trigger a workflow run if it hasn't been executed yet.

        Returns:
            Dict[str, Any]: Nested dictionary representation of WorkflowResult.
        """
        result = self._result if self._result else self.run()
        
        def _enum_handler(obj: Any) -> Any:
            if isinstance(obj, Enum):
                return obj.value
            if hasattr(obj, "__dict__"):
                return {k: _enum_handler(v) for k, v in asdict(obj).items()}
            if isinstance(obj, list):
                return [_enum_handler(i) for i in obj]
            if isinstance(obj, dict):
                return {k: _enum_handler(v) for k, v in obj.items()}
            return obj
            
        exported = asdict(result)
        for k, v in exported.items():
            exported[k] = _enum_handler(v)
            
        logger.info("Dictionary exported")
        return exported

    def export_json(self) -> str:
        """
        Serializes the previously generated WorkflowResult into JSON.

        Returns:
            str: Deterministic, localized JSON string.
        """
        res_dict = self.export_dict()
        logger.info("JSON exported")
        return json.dumps(
            res_dict, 
            indent=4, 
            sort_keys=True, 
            ensure_ascii=False
        )
