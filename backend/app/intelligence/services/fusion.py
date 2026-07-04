"""
AarogyaOne — Evidence Fusion Service
=========================================================================
Central AI orchestration service that merges outputs from:
- Speech (Whisper Large-v3)
- Vision (Grounding DINO + Florence-2)
- NLP (IndicBERT)
- Citizen Metadata
- Hospital Metadata
- Location Metadata

Produces a standardized UnifiedEvidence object with weighted confidence,
total processing time, human-readable summaries, risk aggregation,
evidence statistics, quality scoring, and cryptographic hashing for
duplicate detection. Performs no ML inference.
"""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, List, Optional

# ── Logging ─────────────────────────────────────────────────────────────────
logger = logging.getLogger("aarogya.fusion_service")

# ── Weights Configuration ──────────────────────────────────────────────────
WEIGHT_NLP = 0.45
WEIGHT_VISION = 0.35
WEIGHT_SPEECH = 0.20

# ════════════════════════════════════════════════════════════════════════════
#  ENUMERATIONS
# ════════════════════════════════════════════════════════════════════════════

class RiskLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class UrgencyLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class PipelineStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    NOT_AVAILABLE = "NOT_AVAILABLE"
    SKIPPED = "SKIPPED"


# ════════════════════════════════════════════════════════════════════════════
#  DATACLASSES
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class SpeechEvidence:
    """Standardized output from the Whisper speech pipeline."""
    transcript: str
    language: str
    language_code: Optional[str]
    processing_time: float
    confidence: Optional[float]
    metadata: Dict[str, Any]

@dataclass
class VisionEvidence:
    """Standardized output from Grounding DINO and Florence-2 pipelines."""
    detected_objects: List[Dict[str, Any]]
    ocr_text: str
    caption: str
    scene_summary: str
    evidence_summary: str
    risk_level: str
    confidence: float
    annotated_image_path: Optional[str]
    image_metadata: Dict[str, Any]
    processing_time: float

@dataclass
class NLPEvidence:
    """Standardized output from the IndicBERT NLP pipeline."""
    complaint_category: str
    sentiment: str
    urgency: str
    confidence: float
    entities: List[str]
    keywords: List[str]
    processing_time: float

@dataclass
class CitizenMetadata:
    """Contextual metadata regarding the reporting citizen."""
    citizen_id: str
    complaint_id: str
    age: Optional[int] = None
    gender: Optional[str] = None

@dataclass
class HospitalMetadata:
    """Contextual metadata regarding the target healthcare facility."""
    hospital_id: str
    hospital_name: str
    district: str
    state: str

@dataclass
class LocationMetadata:
    """Geospatial metadata associated with the grievance."""
    latitude: float
    longitude: float
    address: str

@dataclass(frozen=True)
class ConfidenceBreakdown:
    """Detailed breakdown of confidence scores across pipelines."""
    speech: float
    vision: float
    nlp: float
    overall: float

@dataclass(frozen=True)
class EvidenceStatistics:
    """Quantitative metrics derived from the collected evidence."""
    number_of_detected_objects: int
    ocr_character_count: int
    keyword_count: int
    entity_count: int
    speech_length: int
    processing_pipeline_count: int

@dataclass(frozen=True)
class UnifiedEvidence:
    """Final merged evidence packet ready for the Workflow Engine routing."""
    evidence_id: str
    timestamp: str
    
    # Metadata context
    citizen: CitizenMetadata
    hospital: HospitalMetadata
    location: LocationMetadata
    
    # AI stream results
    speech: Optional[SpeechEvidence]
    vision: Optional[VisionEvidence]
    nlp: Optional[NLPEvidence]
    
    # Pipeline status
    pipeline_status: Dict[str, PipelineStatus]
    
    # Derived unified insights
    overall_confidence: float
    confidence_breakdown: ConfidenceBreakdown
    overall_risk: RiskLevel
    evidence_quality_score: int
    total_processing_time: float
    evidence_sources: List[str]
    evidence_summary: str
    evidence_statistics: EvidenceStatistics
    
    # Security / Deduplication
    evidence_hash: str


# ════════════════════════════════════════════════════════════════════════════
#  FUSION SERVICE
# ════════════════════════════════════════════════════════════════════════════

class EvidenceFusionService:
    """
    Central orchestration service to combine and validate outputs from AI pipelines.
    Enriches the data and generates a UnifiedEvidence object.
    """

    def __init__(self) -> None:
        """Initializes an empty state for a new grievance fusion process."""
        self._speech: Optional[SpeechEvidence] = None
        self._vision: Optional[VisionEvidence] = None
        self._nlp: Optional[NLPEvidence] = None
        self._citizen: Optional[CitizenMetadata] = None
        self._hospital: Optional[HospitalMetadata] = None
        self._location: Optional[LocationMetadata] = None

    def merge_speech(self, speech: SpeechEvidence) -> None:
        """Merges speech-to-text evidence."""
        self._speech = speech
        logger.info("Speech evidence merged.")

    def merge_vision(self, vision: VisionEvidence) -> None:
        """Merges computer vision evidence."""
        self._vision = vision
        logger.info("Vision evidence merged.")

    def merge_nlp(self, nlp: NLPEvidence) -> None:
        """Merges natural language processing evidence."""
        self._nlp = nlp
        logger.info("NLP evidence merged.")

    def merge_metadata(
        self, 
        citizen: CitizenMetadata, 
        hospital: HospitalMetadata, 
        location: LocationMetadata
    ) -> None:
        """Merges citizen, hospital, and location metadata context."""
        self._citizen = citizen
        self._hospital = hospital
        self._location = location
        logger.info("Metadata (Citizen, Hospital, Location) merged.")

    def _determine_pipeline_status(self) -> Dict[str, PipelineStatus]:
        """Determines the availability status of each AI pipeline."""
        return {
            "Speech": PipelineStatus.SUCCESS if self._speech else PipelineStatus.NOT_AVAILABLE,
            "Vision": PipelineStatus.SUCCESS if self._vision else PipelineStatus.NOT_AVAILABLE,
            "NLP": PipelineStatus.SUCCESS if self._nlp else PipelineStatus.NOT_AVAILABLE,
        }

    def _compile_evidence_statistics(self) -> EvidenceStatistics:
        """Compiles quantitative metrics from the merged evidence streams."""
        num_objects = len(self._vision.detected_objects) if self._vision and self._vision.detected_objects else 0
        ocr_len = len(self._vision.ocr_text.strip()) if self._vision and self._vision.ocr_text else 0
        kw_count = len(self._nlp.keywords) if self._nlp and self._nlp.keywords else 0
        ent_count = len(self._nlp.entities) if self._nlp and self._nlp.entities else 0
        speech_len = len(self._speech.transcript.strip()) if self._speech and self._speech.transcript else 0
        
        pipeline_count = sum(1 for status in self._determine_pipeline_status().values() if status == PipelineStatus.SUCCESS)

        return EvidenceStatistics(
            number_of_detected_objects=num_objects,
            ocr_character_count=ocr_len,
            keyword_count=kw_count,
            entity_count=ent_count,
            speech_length=speech_len,
            processing_pipeline_count=pipeline_count
        )

    def calculate_overall_confidence(self) -> float:
        """Calculates a weighted average confidence based on provided AI streams."""
        total_weight = 0.0
        weighted_sum = 0.0

        if self._nlp:
            total_weight += WEIGHT_NLP
            weighted_sum += self._nlp.confidence * WEIGHT_NLP

        if self._vision:
            total_weight += WEIGHT_VISION
            weighted_sum += self._vision.confidence * WEIGHT_VISION

        if self._speech and self._speech.confidence is not None:
            total_weight += WEIGHT_SPEECH
            weighted_sum += self._speech.confidence * WEIGHT_SPEECH

        if total_weight == 0.0:
            return 0.0

        confidence = weighted_sum / total_weight
        logger.info("Overall confidence calculated: %.4f", confidence)
        return round(confidence, 4)

    def _build_confidence_breakdown(self, overall: float) -> ConfidenceBreakdown:
        """Constructs a detailed breakdown of confidence metrics."""
        return ConfidenceBreakdown(
            speech=self._speech.confidence if self._speech and self._speech.confidence is not None else 0.0,
            vision=self._vision.confidence if self._vision else 0.0,
            nlp=self._nlp.confidence if self._nlp else 0.0,
            overall=overall
        )

    def calculate_overall_risk(self) -> RiskLevel:
        """
        Combines Vision risk, NLP urgency, and Sentiment into an overall risk assessment.
        """
        score = 0
        
        # NLP Urgency
        if self._nlp:
            urg = self._nlp.urgency.upper()
            if urg == UrgencyLevel.CRITICAL.value.upper(): score += 4
            elif urg == UrgencyLevel.HIGH.value.upper(): score += 3
            elif urg == UrgencyLevel.MEDIUM.value.upper(): score += 2
            elif urg == UrgencyLevel.LOW.value.upper(): score += 1
            
            # Sentiment modifier
            if self._nlp.sentiment.lower() == "negative": score += 1
            
        # Vision Risk
        if self._vision:
            vr = self._vision.risk_level.upper()
            if vr == RiskLevel.CRITICAL.value.upper(): score += 4
            elif vr == RiskLevel.HIGH.value.upper(): score += 3
            elif vr == RiskLevel.MEDIUM.value.upper(): score += 2
            elif vr == RiskLevel.LOW.value.upper(): score += 1

        logger.info("Risk calculated.")
        
        if score >= 6: return RiskLevel.CRITICAL
        if score >= 4: return RiskLevel.HIGH
        if score >= 2: return RiskLevel.MEDIUM
        return RiskLevel.LOW

    def calculate_quality_score(self) -> int:
        """
        Calculates an evidence quality score (0-100) based on input thoroughness and confidence.
        """
        score = 0
        
        overall_conf = self.calculate_overall_confidence()
        score += overall_conf * 40  # Up to 40 points from confidence
        
        if self._vision:
            if self._vision.ocr_text and len(self._vision.ocr_text.strip()) > 0:
                score += 10
            if self._vision.detected_objects and len(self._vision.detected_objects) > 0:
                score += 10
                
        if self._speech:
            if self._speech.transcript and len(self._speech.transcript.strip()) > 20:
                score += 20
                
        if self._nlp:
            score += self._nlp.confidence * 20  # Up to 20 points from NLP consistency
            
        final_score = int(min(100, max(0, score)))
        logger.info("Quality score calculated: %d", final_score)
        return final_score

    def _generate_evidence_hash(self) -> str:
        """
        Generates a SHA256 cryptographic hash based on transcripts, OCR, captions, 
        and identifiers for duplicate detection.
        """
        components = []
        
        if self._speech and self._speech.transcript:
            components.append(self._speech.transcript.strip().lower())
        if self._vision and self._vision.caption:
            components.append(self._vision.caption.strip().lower())
        if self._vision and self._vision.ocr_text:
            components.append(self._vision.ocr_text.strip().lower())
        if self._citizen:
            components.append(self._citizen.complaint_id)
        if self._hospital:
            components.append(self._hospital.hospital_id)
            
        raw_string = "||".join(components).encode('utf-8')
        digest = hashlib.sha256(raw_string).hexdigest()
        
        logger.info("Hash generated.")
        return digest

    def calculate_processing_time(self) -> float:
        """Sums up the individual processing times of all AI pipelines."""
        total_time = 0.0
        if self._speech:
            total_time += self._speech.processing_time
        if self._vision:
            total_time += self._vision.processing_time
        if self._nlp:
            total_time += self._nlp.processing_time
        return round(total_time, 2)

    def generate_evidence_summary(self) -> str:
        """
        Generates a concise, human-readable summary combining all available evidence streams.
        """
        summary_parts = []
        
        if self._citizen:
            summary_parts.append(f"Citizen reports grievance regarding {self._hospital.hospital_name}.")
            
        if self._speech and self._speech.transcript:
            snippet = self._speech.transcript.strip()
            if len(snippet) > 80:
                snippet = snippet[:77] + "..."
            summary_parts.append(f"Speech transcript indicates: '{snippet}'.")
            
        if self._vision:
            vision_context = []
            if self._vision.detected_objects:
                vision_context.append(f"{len(self._vision.detected_objects)} objects detected")
            if self._vision.ocr_text:
                vision_context.append(f"OCR extracted relevant text")
            if self._vision.risk_level:
                vision_context.append(f"risk assessed as {self._vision.risk_level.upper()}")
                
            if vision_context:
                summary_parts.append("Vision confirms " + ", ".join(vision_context) + ".")
                
        if self._nlp:
            summary_parts.append(
                f"Complaint classified as {self._nlp.complaint_category.upper()} with {self._nlp.urgency.upper()} urgency."
            )
            
        if not summary_parts:
            return "No AI evidence available for summarization."
            
        return " ".join(summary_parts)

    def validate(self) -> None:
        """
        Validates the integrity and completeness of the collected evidence 
        before executing the final merge. Ensures data sanitation.
        """
        if not self._citizen or not self._hospital or not self._location:
            raise ValueError("Missing critical metadata. Metadata merge required.")
            
        if not self._hospital.hospital_name.strip():
            raise ValueError("Invalid HospitalMetadata: hospital_name is empty.")
            
        if not self._citizen.complaint_id.strip():
            raise ValueError("Invalid CitizenMetadata: complaint_id is empty.")
            
        if self._nlp:
            if not self._nlp.complaint_category:
                raise ValueError("NLP evidence provided but missing complaint category.")
            if self._nlp.processing_time < 0:
                raise ValueError("NLP evidence contains negative processing time.")
            if len(self._nlp.keywords) != len(set(self._nlp.keywords)):
                raise ValueError("NLP evidence contains duplicate keywords.")
            if len(self._nlp.entities) != len(set(self._nlp.entities)):
                raise ValueError("NLP evidence contains duplicate entities.")
            
        if self._speech:
            if not self._speech.transcript:
                raise ValueError("Speech evidence provided but missing transcript.")
            if self._speech.processing_time < 0:
                raise ValueError("Speech evidence contains negative processing time.")
                
        if self._vision:
            if self._vision.detected_objects is None:
                raise ValueError("Vision evidence provided but detected_objects array is missing.")
            if self._vision.processing_time < 0:
                raise ValueError("Vision evidence contains negative processing time.")
                
        if self._location.latitude < -90 or self._location.latitude > 90:
            raise ValueError(f"Invalid location coordinates (latitude out of bounds): {self._location.latitude}")
            
        if self._location.longitude < -180 or self._location.longitude > 180:
            raise ValueError(f"Invalid location coordinates (longitude out of bounds): {self._location.longitude}")
            
        overall_conf = self.calculate_overall_confidence()
        if overall_conf < 0.0 or overall_conf > 1.0:
            raise ValueError(f"Calculated overall confidence {overall_conf} is out of bounds [0.0, 1.0].")
            
        logger.info("Validation completed.")

    def merge(self) -> UnifiedEvidence:
        """
        Validates state, calculates final aggregations, and produces 
        the immutable UnifiedEvidence structure.
        """
        logger.info("Fusion started.")
        self.validate()
        
        evidence_sources = [k for k, v in self._determine_pipeline_status().items() if v == PipelineStatus.SUCCESS]
        overall_confidence = self.calculate_overall_confidence()
        
        unified = UnifiedEvidence(
            evidence_id=str(uuid.uuid4()),
            timestamp=datetime.now(UTC).isoformat(),
            citizen=self._citizen,
            hospital=self._hospital,
            location=self._location,
            speech=self._speech,
            vision=self._vision,
            nlp=self._nlp,
            pipeline_status=self._determine_pipeline_status(),
            overall_confidence=overall_confidence,
            confidence_breakdown=self._build_confidence_breakdown(overall_confidence),
            overall_risk=self.calculate_overall_risk(),
            evidence_quality_score=self.calculate_quality_score(),
            total_processing_time=self.calculate_processing_time(),
            evidence_sources=evidence_sources,
            evidence_summary=self.generate_evidence_summary(),
            evidence_statistics=self._compile_evidence_statistics(),
            evidence_hash=self._generate_evidence_hash()
        )
        
        logger.info("Fusion completed. Evidence ID: %s", unified.evidence_id)
        return unified

    def export_dict(self) -> Dict[str, Any]:
        """Exports the UnifiedEvidence as a Python dictionary."""
        unified = self.merge()
        exported = asdict(unified)
        logger.info("Export completed: dictionary format.")
        return exported
        
    def export_json(self) -> str:
        """Exports the UnifiedEvidence as a serialized JSON string."""
        unified = self.merge()
        # Custom handling for Enums in JSON serialization
        def custom_encoder(obj):
            if isinstance(obj, Enum):
                return obj.value
            raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")
            
        exported = json.dumps(asdict(unified), default=custom_encoder, indent=4)
        logger.info("Export completed: JSON format.")
        return exported
        
    def export_summary(self) -> str:
        """Exports a formatted human-readable report summarizing the evidence."""
        unified = self.merge()
        
        report = [
            f"EVIDENCE REPORT - {unified.timestamp}",
            f"{'='*50}",
            f"Evidence ID: {unified.evidence_id}",
            f"Quality Score: {unified.evidence_quality_score}/100",
            f"Overall Risk: {unified.overall_risk.value}",
            f"Overall Confidence: {unified.overall_confidence:.2f}",
            "",
            "METADATA:",
            f"Citizen Complaint: {unified.citizen.complaint_id}",
            f"Hospital: {unified.hospital.hospital_name} ({unified.hospital.district}, {unified.hospital.state})",
            "",
            "SUMMARY:",
            unified.evidence_summary,
            "",
            "PIPELINE STATUS:",
        ]
        
        for p, s in unified.pipeline_status.items():
            report.append(f"- {p}: {s.value}")
            
        logger.info("Export completed: summary report.")
        return "\n".join(report)

    def reset(self) -> None:
        """Resets the internal service state for processing a new grievance."""
        self.__init__()
