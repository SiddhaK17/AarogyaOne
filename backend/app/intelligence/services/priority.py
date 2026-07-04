"""
AarogyaOne — AI Decision Engine (Priority & Escalation)
=========================================================================
Central decision-making module that processes UnifiedEvidence and determines
the appropriate priority level, escalation protocols, and recommended
actions for government and hospital administrators.

Performs deterministic, rule-based inference without external API calls,
machine learning, or database operations.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, Optional

# Attempt to safely import dependencies from fusion.py
try:
    from backend.app.intelligence.services.fusion import UnifiedEvidence
except ImportError:
    # Fallback to local import if executed dynamically
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).resolve().parent))
    from fusion import UnifiedEvidence

# ── LOGGING ─────────────────────────────────────────────────────────────────
logger = logging.getLogger("aarogya.priority_engine")

# ── WEIGHT CONFIGURATION ───────────────────────────────────────────────────
WEIGHT_RISK = 0.35
WEIGHT_URGENCY = 0.20
WEIGHT_CONFIDENCE = 0.15
WEIGHT_QUALITY = 0.10
WEIGHT_OBJECTS = 0.10
WEIGHT_SENTIMENT = 0.10

MAX_BASE_SCORE = 100.0

# Threshold Multipliers for Base Categories
SCORE_RISK_CRITICAL = 1.0
SCORE_RISK_HIGH = 0.75
SCORE_RISK_MEDIUM = 0.50
SCORE_RISK_LOW = 0.25

SCORE_URGENCY_CRITICAL = 1.0
SCORE_URGENCY_HIGH = 0.75
SCORE_URGENCY_MEDIUM = 0.50
SCORE_URGENCY_LOW = 0.25

SCORE_SENTIMENT_NEGATIVE = 1.0
SCORE_SENTIMENT_NEUTRAL = 0.5
SCORE_SENTIMENT_POSITIVE = 0.0

OBJECTS_HIGH_THRESHOLD = 5
OBJECTS_LOW_THRESHOLD = 0
SCORE_OBJECTS_HIGH = 1.0
SCORE_OBJECTS_LOW = 0.5

# Bonuses and Penalties
BONUS_CATEGORY_CRITICAL = 10.0
BONUS_CATEGORY_HIGH = 5.0
BONUS_DUPLICATE = 5.0

CONFIDENCE_PENALTY_THRESHOLD = 0.50
CONFIDENCE_PENALTY_VALUE = 10.0

# Priority Level Thresholds
THRESHOLD_CRITICAL = 85
THRESHOLD_HIGH = 60
THRESHOLD_MEDIUM = 30

# ════════════════════════════════════════════════════════════════════════════
#  ENUMERATIONS
# ════════════════════════════════════════════════════════════════════════════

class PriorityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class EscalationLevel(str, Enum):
    NONE = "NONE"
    HOSPITAL = "HOSPITAL"
    DISTRICT = "DISTRICT"
    STATE = "STATE"
    EMERGENCY = "EMERGENCY"

class ResponseTime(str, Enum):
    IMMEDIATE = "IMMEDIATE"
    ONE_HOUR = "ONE_HOUR"
    SIX_HOURS = "SIX_HOURS"
    TWENTY_FOUR_HOURS = "TWENTY_FOUR_HOURS"
    THREE_DAYS = "THREE_DAYS"

# ════════════════════════════════════════════════════════════════════════════
#  DATACLASSES
# ════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class PriorityFactors:
    """Extracted features from UnifiedEvidence used for scoring."""
    overall_risk: str
    overall_confidence: float
    quality_score: int
    urgency: str
    sentiment: str
    complaint_category: str
    detected_object_count: int
    ocr_present: bool
    duplicate_detection: bool
    hospital_type: str
    citizen_priority: str
    processing_time: float

@dataclass(frozen=True)
class PriorityBreakdown:
    """Detailed breakdown of how the priority score was computed."""
    risk_score: float
    confidence_score: float
    urgency_score: float
    quality_score: float
    vision_score: float
    speech_score: float
    nlp_score: float
    category_score: float
    duplicate_score: float
    final_priority_score: int

@dataclass(frozen=True)
class PriorityDecision:
    """The final deterministic decision packet for the workflow engine."""
    decision_id: str
    timestamp: str
    priority_level: PriorityLevel
    priority_score: int
    escalation_level: EscalationLevel
    response_time: ResponseTime
    recommended_department: str
    government_action: str
    hospital_action: str
    confidence: float
    reasoning: str
    decision_summary: str
    breakdown: PriorityBreakdown


# ════════════════════════════════════════════════════════════════════════════
#  ENGINE
# ════════════════════════════════════════════════════════════════════════════

class PriorityEngine:
    """
    AI Decision Engine that processes a UnifiedEvidence object immutably
    to compute deterministic PriorityDecision packets.
    """

    def __init__(self, evidence: UnifiedEvidence) -> None:
        """Initializes the engine with the provided immutable UnifiedEvidence."""
        self._evidence = evidence
        self._factors: Optional[PriorityFactors] = None
        self._breakdown: Optional[PriorityBreakdown] = None
        self._decision: Optional[PriorityDecision] = None
        self._confidence_penalty_applied = False

    def _validate(self) -> None:
        """Validates the incoming UnifiedEvidence object to ensure deterministic safety."""
        if not self._evidence:
            raise ValueError("UnifiedEvidence is missing.")
            
        if self._evidence.overall_confidence < 0.0 or self._evidence.overall_confidence > 1.0:
            raise ValueError(f"Invalid overall_confidence range: {self._evidence.overall_confidence}")
            
        if self._evidence.evidence_quality_score < 0 or self._evidence.evidence_quality_score > 100:
            raise ValueError(f"Invalid quality score range: {self._evidence.evidence_quality_score}")
            
        if self._evidence.total_processing_time < 0.0:
            raise ValueError(f"Invalid processing time: {self._evidence.total_processing_time}")
            
        if not getattr(self._evidence, "overall_risk", None):
            raise ValueError("overall_risk is missing in UnifiedEvidence.")
            
        if not self._evidence.citizen or not self._evidence.citizen.complaint_id:
            raise ValueError("Citizen Metadata or Complaint ID is missing.")
            
        if not self._evidence.hospital or not self._evidence.hospital.hospital_name:
            raise ValueError("Hospital Metadata or Hospital Name is missing.")
            
        # Ensure NLP exists for logic fallback
        if not self._evidence.nlp:
            logger.warning("NLP evidence is missing. Categorization will rely on defaults.")
            
        logger.info("Validation Complete")

    def _extract_factors(self) -> None:
        """Extracts and normalizes features from UnifiedEvidence."""
        overall_risk = self._evidence.overall_risk.value if hasattr(self._evidence.overall_risk, "value") else str(self._evidence.overall_risk)
        overall_confidence = self._evidence.overall_confidence
        quality_score = self._evidence.evidence_quality_score
        processing_time = self._evidence.total_processing_time
        
        # NLP Extracted
        urgency = "LOW"
        sentiment = "NEUTRAL"
        complaint_category = "UNKNOWN"
        if self._evidence.nlp:
            urgency = self._evidence.nlp.urgency
            sentiment = self._evidence.nlp.sentiment
            complaint_category = self._evidence.nlp.complaint_category
            
        # Vision Extracted
        detected_object_count = 0
        ocr_present = False
        if self._evidence.vision:
            detected_object_count = self._evidence.evidence_statistics.number_of_detected_objects if hasattr(self._evidence, "evidence_statistics") else len(self._evidence.vision.detected_objects)
            ocr_present = bool(self._evidence.vision.ocr_text and self._evidence.vision.ocr_text.strip())
            
        # Default assumptions for contextual metadata
        hospital_type = "GENERAL"
        citizen_priority = "NORMAL"
        
        # Detect duplicates dynamically (mock logic for demo, usually involves DB checks, we rely on hash checks or provided flags)
        duplicate_detection = bool(
            getattr(self._evidence, "is_duplicate", False)
        )
        
        self._factors = PriorityFactors(
            overall_risk=overall_risk,
            overall_confidence=overall_confidence,
            quality_score=quality_score,
            urgency=urgency,
            sentiment=sentiment,
            complaint_category=complaint_category,
            detected_object_count=detected_object_count,
            ocr_present=ocr_present,
            duplicate_detection=duplicate_detection,
            hospital_type=hospital_type,
            citizen_priority=citizen_priority,
            processing_time=processing_time
        )
        logger.info("Priority Factors Extracted")

    def _calculate_priority_score(self) -> int:
        """Calculates a weighted priority score between 0 and 100 based on configured weights."""
        if not self._factors:
            raise RuntimeError("Factors must be extracted before scoring.")
            
        risk_score = 0.0
        risk_val = self._factors.overall_risk.upper()
        if risk_val == "CRITICAL": risk_score = (MAX_BASE_SCORE * WEIGHT_RISK) * SCORE_RISK_CRITICAL
        elif risk_val == "HIGH": risk_score = (MAX_BASE_SCORE * WEIGHT_RISK) * SCORE_RISK_HIGH
        elif risk_val == "MEDIUM": risk_score = (MAX_BASE_SCORE * WEIGHT_RISK) * SCORE_RISK_MEDIUM
        elif risk_val == "LOW": risk_score = (MAX_BASE_SCORE * WEIGHT_RISK) * SCORE_RISK_LOW
        
        urgency_score = 0.0
        urg_val = self._factors.urgency.upper()
        if urg_val == "CRITICAL": urgency_score = (MAX_BASE_SCORE * WEIGHT_URGENCY) * SCORE_URGENCY_CRITICAL
        elif urg_val == "HIGH": urgency_score = (MAX_BASE_SCORE * WEIGHT_URGENCY) * SCORE_URGENCY_HIGH
        elif urg_val == "MEDIUM": urgency_score = (MAX_BASE_SCORE * WEIGHT_URGENCY) * SCORE_URGENCY_MEDIUM
        elif urg_val == "LOW": urgency_score = (MAX_BASE_SCORE * WEIGHT_URGENCY) * SCORE_URGENCY_LOW
        
        confidence_score = self._factors.overall_confidence * (MAX_BASE_SCORE * WEIGHT_CONFIDENCE)
        quality_score = (self._factors.quality_score / 100.0) * (MAX_BASE_SCORE * WEIGHT_QUALITY)
        
        vision_score = 0.0
        if self._factors.detected_object_count > OBJECTS_HIGH_THRESHOLD: 
            vision_score = (MAX_BASE_SCORE * WEIGHT_OBJECTS) * SCORE_OBJECTS_HIGH
        elif self._factors.detected_object_count > OBJECTS_LOW_THRESHOLD: 
            vision_score = (MAX_BASE_SCORE * WEIGHT_OBJECTS) * SCORE_OBJECTS_LOW
        
        sentiment_score = 0.0
        if self._factors.sentiment.upper() == "NEGATIVE": 
            sentiment_score = (MAX_BASE_SCORE * WEIGHT_SENTIMENT) * SCORE_SENTIMENT_NEGATIVE
        elif self._factors.sentiment.upper() == "NEUTRAL": 
            sentiment_score = (MAX_BASE_SCORE * WEIGHT_SENTIMENT) * SCORE_SENTIMENT_NEUTRAL
            
        # Category Weighting
        category_score = 0.0
        cat_lower = self._factors.complaint_category.lower()
        if any(w in cat_lower for w in ["emergency", "fire", "blood", "oxygen", "icu", "casualty", "ambulance", "electricity"]):
            category_score = BONUS_CATEGORY_CRITICAL
        elif any(w in cat_lower for w in ["doctor absent", "medicine shortage", "equipment failure", "water"]):
            category_score = BONUS_CATEGORY_HIGH
            
        # Duplicate detection bonus
        duplicate_score = BONUS_DUPLICATE if self._factors.duplicate_detection else 0.0
        
        total_score = risk_score + urgency_score + confidence_score + quality_score + vision_score + sentiment_score + category_score + duplicate_score
        
        # Confidence penalty
        self._confidence_penalty_applied = False
        if self._factors.overall_confidence < CONFIDENCE_PENALTY_THRESHOLD:
            total_score -= CONFIDENCE_PENALTY_VALUE
            self._confidence_penalty_applied = True
            
        final_score = int(min(100, max(0, total_score)))
        
        # Populate breakdown
        self._breakdown = PriorityBreakdown(
            risk_score=round(risk_score, 2),
            confidence_score=round(confidence_score, 2),
            urgency_score=round(urgency_score, 2),
            quality_score=round(quality_score, 2),
            vision_score=round(vision_score, 2),
            speech_score=0.0, # Incorporated in overall confidence
            nlp_score=round(sentiment_score, 2),
            category_score=round(category_score, 2),
            duplicate_score=round(duplicate_score, 2),
            final_priority_score=final_score
        )
        
        logger.info("Priority Score Calculated: %d", final_score)
        return final_score

    def _determine_priority_level(self, score: int) -> PriorityLevel:
        """Maps 0-100 score to PriorityLevel Enum using configured thresholds."""
        level = PriorityLevel.LOW
        if score >= THRESHOLD_CRITICAL:
            level = PriorityLevel.CRITICAL
        elif score >= THRESHOLD_HIGH:
            level = PriorityLevel.HIGH
        elif score >= THRESHOLD_MEDIUM:
            level = PriorityLevel.MEDIUM
            
        logger.info("Priority Level Assigned: %s", level.value)
        return level

    def _determine_escalation(self, level: PriorityLevel) -> EscalationLevel:
        """Determines the escalation routing based on priority."""
        if level == PriorityLevel.LOW:
            esc = EscalationLevel.HOSPITAL
        elif level == PriorityLevel.MEDIUM:
            esc = EscalationLevel.DISTRICT
        elif level == PriorityLevel.HIGH:
            # District + State Monitoring via STATE level
            esc = EscalationLevel.STATE
        elif level == PriorityLevel.CRITICAL:
            esc = EscalationLevel.EMERGENCY
        else:
            esc = EscalationLevel.NONE
            
        logger.info("Escalation Determined: %s", esc.value)
        return esc

    def _determine_response_time(self, level: PriorityLevel) -> ResponseTime:
        """Determines the exact SLA for resolution."""
        if level == PriorityLevel.LOW:
            return ResponseTime.THREE_DAYS
        if level == PriorityLevel.MEDIUM:
            return ResponseTime.TWENTY_FOUR_HOURS
        if level == PriorityLevel.HIGH:
            return ResponseTime.SIX_HOURS
        return ResponseTime.IMMEDIATE

    def _determine_department(self, category: str) -> str:
        """Maps NLP complaint category to Government/Hospital Department."""
        category = category.lower()
        
        if "oxygen" in category or "equipment" in category or "machine" in category or "ventilator" in category:
            dept = "Biomedical Engineering"
        elif "icu" in category or "emergency" in category or "casualty" in category or "ambulance" in category:
            dept = "Emergency Response Cell"
        elif "blood" in category or "laboratory" in category:
            dept = "Pathology and Laboratory Department"
        elif "pharmacy" in category or "medicine" in category or "stock" in category:
            dept = "Pharmacy and Inventory Management"
        elif "nurse" in category or "doctor" in category or "staff" in category:
            dept = "Hospital Administration and Staffing"
        elif "electricity" in category or "water" in category or "infrastructure" in category or "building" in category:
            dept = "Engineering and Maintenance Department"
        elif "fire" in category:
            dept = "Fire and Safety Department"
        elif "beds" in category or "wheelchair" in category:
            dept = "Patient Care Services"
        elif "vaccination" in category:
            dept = "Immunization Cell"
        elif "registration" in category:
            dept = "Outpatient Department (OPD)"
        elif "sanitation" in category or "clean" in category or "garbage" in category or "waste" in category:
            dept = "Public Health and Sanitation Department"
        else:
            dept = "District Medical Office"
            
        logger.info("Department Assigned: %s", dept)
        return dept

    def _generate_government_action(self, level: PriorityLevel, department: str, category: str) -> str:
        """Generates contextual deterministic actions for Government dashboards."""
        if level == PriorityLevel.CRITICAL:
            if "medicine" in category.lower():
                return "Allocate emergency medicine. Notify district collector immediately."
            return "Trigger ambulance deployment. Escalate to health commissioner."
            
        if level == PriorityLevel.HIGH:
            if "doctor" in category.lower():
                return "Dispatch medical officer. Schedule immediate inspection."
            return "Schedule infrastructure audit. Notify district administration."
            
        if level == PriorityLevel.MEDIUM:
            return f"Forward complaint to {department} for standard review."
            
        return "Log for monthly audit."

    def _generate_hospital_action(self, level: PriorityLevel, category: str) -> str:
        """Generates contextual actions for internal Hospital administrators."""
        if level == PriorityLevel.CRITICAL:
            return "Escalate internally to Chief Medical Officer immediately. Open P1 incident ticket."
            
        if level == PriorityLevel.HIGH:
            if "medicine" in category.lower():
                return "Replenish medicine inventory from backup stock."
            if "doctor" in category.lower() or "staff" in category.lower():
                return "Increase staffing. Assign available doctor from alternate ward."
            return "Open high-priority maintenance ticket."
            
        if level == PriorityLevel.MEDIUM:
            if "equipment" in category.lower():
                return "Repair equipment. Log downtime."
            return "Investigate and resolve within 24 hours."
            
        return "Review during next administrative meeting."

    def _generate_reasoning(self, level: PriorityLevel, score: int) -> str:
        """Creates a detailed textual explanation for the priority decision."""
        reasoning = []
        if self._factors.overall_risk.upper() in ["HIGH", "CRITICAL"]:
            reasoning.append(f"High visual risk ({self._factors.overall_risk}) detected.")
        
        if self._factors.ocr_present:
            reasoning.append("OCR evidence corroborates the issue.")
            
        if self._factors.sentiment.upper() == "NEGATIVE":
            reasoning.append("Negative sentiment detected in communication.")
            
        if self._breakdown and self._breakdown.category_score > 0:
            reasoning.append(f"Category weighting applied for critical healthcare category '{self._factors.complaint_category.title()}'.")
            
        if self._factors.duplicate_detection:
            reasoning.append("Duplicate complaint detection matched, increasing priority.")
            
        if self._confidence_penalty_applied:
            reasoning.append(f"Priority slightly reduced due to overall confidence being below threshold ({CONFIDENCE_PENALTY_THRESHOLD * 100}%).")
            
        reasoning.append(f"Overall confidence at {int(self._factors.overall_confidence * 100)}%.")
        reasoning.append(f"Evidence quality is scored at {self._factors.quality_score}/100.")
        reasoning.append(f"Complaint classified as {self._factors.complaint_category.title()}.")
        reasoning.append(f"Priority elevated to {level.value} (Score: {score}).")
        
        return " ".join(reasoning)

    def _generate_summary(self, level: PriorityLevel, action: str) -> str:
        """Generates a concise dashboard summary."""
        cat = self._factors.complaint_category.upper() if self._factors else "UNKNOWN"
        summary = (
            f"{level.value} PRIORITY | "
            f"Category: {cat} | "
            f"Recommended Action: {action}"
        )
        logger.info("Summary Generated")
        return summary
        
    def _calculate_confidence(self) -> float:
        """Passes through the fusion confidence as the decision confidence."""
        return self._factors.overall_confidence if self._factors else 0.0

    def evaluate(self) -> PriorityDecision:
        """
        Executes the deterministic decision pipeline and returns the immutable PriorityDecision.
        """
        logger.info("Evaluation Started")
        
        self._validate()
        self._extract_factors()
        
        score = self._calculate_priority_score()
        level = self._determine_priority_level(score)
        escalation = self._determine_escalation(level)
        response_time = self._determine_response_time(level)
        department = self._determine_department(self._factors.complaint_category)
        
        gov_action = self._generate_government_action(level, department, self._factors.complaint_category)
        hosp_action = self._generate_hospital_action(level, self._factors.complaint_category)
        
        reasoning = self._generate_reasoning(level, score)
        summary = self._generate_summary(level, gov_action)
        confidence = self._calculate_confidence()
        
        decision = PriorityDecision(
            decision_id=str(uuid.uuid4()),
            timestamp=datetime.now(UTC).isoformat(),
            priority_level=level,
            priority_score=score,
            escalation_level=escalation,
            response_time=response_time,
            recommended_department=department,
            government_action=gov_action,
            hospital_action=hosp_action,
            confidence=confidence,
            reasoning=reasoning,
            decision_summary=summary,
            breakdown=self._breakdown
        )
        
        self._decision = decision
        logger.info("Priority Evaluation Complete")
        
        return decision

    def export_dict(self) -> Dict[str, Any]:
        """Evaluates and exports the PriorityDecision as a Python dictionary."""
        decision = self.evaluate()
        
        # Helper to ensure enums are serialized properly
        def _enum_handler(obj):
            if isinstance(obj, Enum):
                return obj.value
            if hasattr(obj, "__dict__"):
                return {k: _enum_handler(v) for k, v in asdict(obj).items()}
            if isinstance(obj, list):
                return [_enum_handler(i) for i in obj]
            if isinstance(obj, dict):
                return {k: _enum_handler(v) for k, v in obj.items()}
            return obj
            
        # Standard asdict allows us to use dict_factory but we can also just serialize values
        exported = asdict(decision)
        for k, v in exported.items():
            exported[k] = _enum_handler(v)
            
        return exported

    def export_json(self) -> str:
        """Evaluates and exports the PriorityDecision as a JSON string."""
        decision_dict = self.export_dict()
        return json.dumps(decision_dict, indent=4)
