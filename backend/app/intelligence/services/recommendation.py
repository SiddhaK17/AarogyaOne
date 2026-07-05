"""
AarogyaOne — AI Recommendation Engine
=========================================================================
Consumes PriorityDecision objects to deterministically generate structured,
actionable recommendations across multiple audiences (Government, Hospital, 
Preventive, Technical).

Performs no machine learning, inference, API calls, or database operations.
All logic is purely deterministic and rule-based.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from app.intelligence.services.priority import (
    PriorityDecision, 
    PriorityLevel, 
    EscalationLevel
)

# ── LOGGING ─────────────────────────────────────────────────────────────────
logger = logging.getLogger("aarogya.recommendation_engine")

# ════════════════════════════════════════════════════════════════════════════
#  ENUMERATIONS
# ════════════════════════════════════════════════════════════════════════════

class RecommendationType(str, Enum):
    IMMEDIATE_ACTION = "IMMEDIATE_ACTION"
    SHORT_TERM = "SHORT_TERM"
    LONG_TERM = "LONG_TERM"
    PREVENTIVE = "PREVENTIVE"

class RecommendationAudience(str, Enum):
    HOSPITAL = "HOSPITAL"
    DISTRICT = "DISTRICT"
    STATE = "STATE"
    EMERGENCY = "EMERGENCY"
    TECHNICAL = "TECHNICAL"
    PUBLIC_HEALTH = "PUBLIC_HEALTH"

class RecommendationStatus(str, Enum):
    PENDING = "PENDING"
    READY = "READY"
    COMPLETED = "COMPLETED"

# ════════════════════════════════════════════════════════════════════════════
#  DATACLASSES
# ════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class Recommendation:
    """Individual actionable recommendation for a specific audience."""
    recommendation_id: str
    title: str
    description: str
    type: RecommendationType
    audience: RecommendationAudience
    priority_level: str
    estimated_completion_hours: int
    status: RecommendationStatus

@dataclass(frozen=True)
class RecommendationBundle:
    """Grouped collection of recommendations for a specific grievance."""
    bundle_id: str
    timestamp: str
    priority_score: int
    priority_level: str
    generated_for_department: str
    government_recommendations: List[Recommendation]
    hospital_recommendations: List[Recommendation]
    preventive_recommendations: List[Recommendation]
    technical_recommendations: List[Recommendation]
    confidence: float
    summary: str


# ════════════════════════════════════════════════════════════════════════════
#  ENGINE
# ════════════════════════════════════════════════════════════════════════════

class RecommendationEngine:
    """
    Consumes a PriorityDecision to deterministically generate
    structured Recommendation objects.
    """

    def __init__(self, decision: PriorityDecision) -> None:
        """
        Initializes the RecommendationEngine.

        Args:
            decision (PriorityDecision): The immutable priority decision object.
        """
        self._decision = decision
        self._bundle: Optional[RecommendationBundle] = None
        self._used_titles: Set[str] = set()
        self._base_hours = 72
        
    def _validate(self) -> None:
        """
        Validates the incoming PriorityDecision object.

        Raises:
            ValueError: If the decision object is missing or contains invalid fields.
        """
        if not self._decision:
            raise ValueError("PriorityDecision is missing.")
            
        if self._decision.priority_score < 0 or self._decision.priority_score > 100:
            raise ValueError(f"Invalid priority score range: {self._decision.priority_score}")
            
        if not isinstance(self._decision.priority_level, PriorityLevel):
            raise ValueError("Invalid priority level.")
            
        if not self._decision.recommended_department:
            raise ValueError("Recommended department is missing.")
            
        if not isinstance(
            self._decision.escalation_level,
            EscalationLevel,
        ):
            raise ValueError("Invalid escalation level.")
            
        if self._decision.confidence < 0.0 or self._decision.confidence > 1.0:
            raise ValueError(f"Invalid confidence range: {self._decision.confidence}")
            
        logger.info("Validation complete")

    def _extract_category(self) -> str:
        """
        Extracts category dynamically from the decision properties.
        Prioritizes explicit complaint_category if available, otherwise falls back
        to summary parsing or department inference.

        Returns:
            str: The extracted category string in lowercase.
        """
        if hasattr(self._decision, "complaint_category") and self._decision.complaint_category:
            return str(self._decision.complaint_category).strip().lower()
            
        parts = [p.strip() for p in self._decision.decision_summary.split("|")]
        for part in parts:
            if part.startswith("Category:"):
                return part.replace("Category:", "").strip().lower()
        
        # Fallback to department inference
        dept = self._decision.recommended_department.lower()
        if "inventory" in dept or "pharmacy" in dept: return "medicine"
        if "engineering" in dept: return "infrastructure"
        if "biomedical" in dept: return "equipment"
        if "staff" in dept or "admin" in dept or "inspection" in dept: return "doctor"
        if "emergency" in dept: return "emergency"
        if "health" in dept or "sanitation" in dept: return "sanitation"
        
        return "unknown"
        
    def _get_base_hours(self) -> int:
        """
        Determines baseline completion hours based on priority level.

        Returns:
            int: Baseline hours.
        """
        if self._decision.priority_level == PriorityLevel.CRITICAL: return 2
        if self._decision.priority_level == PriorityLevel.HIGH: return 6
        if self._decision.priority_level == PriorityLevel.MEDIUM: return 24
        return 72
        
    def _create_rec(self, title: str, description: str, rtype: RecommendationType, aud: RecommendationAudience, hrs_modifier: int = 0) -> Optional[Recommendation]:
        """
        Helper to create unique recommendations and avoid duplicates.

        Args:
            title (str): Title of the recommendation.
            description (str): Detailed description.
            rtype (RecommendationType): Type of recommendation.
            aud (RecommendationAudience): Target audience.
            hrs_modifier (int): Modifier for completion time.

        Returns:
            Optional[Recommendation]: The created Recommendation object, or None if a duplicate title exists.
        """
        normalized_title = title.strip().lower()

        if normalized_title in self._used_titles:
            return None

        self._used_titles.add(normalized_title)
        return Recommendation(
            recommendation_id=str(uuid.uuid4()),
            title=title,
            description=description,
            type=rtype,
            audience=aud,
            priority_level=self._decision.priority_level.value,
            estimated_completion_hours=max(1, self._base_hours + hrs_modifier),
            status=RecommendationStatus.READY
        )

    def _generate_government(self, category: str, is_critical: bool, aud: RecommendationAudience) -> List[Recommendation]:
        """
        Generates 3-5 government recommendations based on category and severity.

        Args:
            category (str): The inferred complaint category.
            is_critical (bool): True if priority is HIGH or CRITICAL.
            aud (RecommendationAudience): Determined target government audience.

        Returns:
            List[Recommendation]: List of generated government recommendations.
        """
        recs: List[Recommendation] = []
        
        if "medicine" in category or "oxygen" in category or "blood" in category:
            if rec := self._create_rec("Allocate Emergency Medicines", "Immediately dispatch emergency inventory to the affected facility.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Audit Inventory Supplier", "Initiate a district-level audit of the pharmaceutical supply chain.", RecommendationType.SHORT_TERM, aud, 24): recs.append(rec)
            if rec := self._create_rec("Verify Vendor Contracts", "Review delivery SLA compliance of existing medical suppliers.", RecommendationType.LONG_TERM, aud, 72): recs.append(rec)
            
        elif "doctor" in category or "nurse" in category or "staff" in category:
            if rec := self._create_rec("Dispatch Inspection", "Send district medical officer for an unannounced inspection.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Verify Attendance Logs", "Audit biometric and manual attendance registers for anomalies.", RecommendationType.SHORT_TERM, aud, 12): recs.append(rec)
            if is_critical:
                if rec := self._create_rec("Deploy Reserve Staff", "Temporarily reallocate doctors from nearby primary health centers.", RecommendationType.IMMEDIATE_ACTION, aud, 2): recs.append(rec)
                
        elif "equipment" in category or "machine" in category:
            if rec := self._create_rec("Approve Emergency Repair", "Bypass standard procurement to immediately approve repair funds.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Request OEM Diagnostic", "Summon the Original Equipment Manufacturer for urgent inspection.", RecommendationType.SHORT_TERM, aud, 24): recs.append(rec)
            
        elif "infrastructure" in category or "electricity" in category or "water" in category:
            if rec := self._create_rec("Approve Civil Work", "Release emergency funds for critical infrastructure stabilization.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Dispatch Engineering Team", "Send public works department engineers to assess structural damage.", RecommendationType.SHORT_TERM, aud, 12): recs.append(rec)
            
        elif "emergency" in category or "fire" in category or "casualty" in category:
            if rec := self._create_rec("Notify District Authority", "Alert district collector and disaster management cell.", RecommendationType.IMMEDIATE_ACTION, RecommendationAudience.EMERGENCY): recs.append(rec)
            if rec := self._create_rec("Activate Emergency Response", "Deploy all available ambulances to the hospital vicinity.", RecommendationType.IMMEDIATE_ACTION, RecommendationAudience.EMERGENCY): recs.append(rec)
            if rec := self._create_rec("Coordinate Resource Relief", "Mobilize disaster relief funds and external medical teams.", RecommendationType.SHORT_TERM, RecommendationAudience.STATE, 12): recs.append(rec)
            
        else:
            if rec := self._create_rec("Review Grievance", f"District officer must review the incoming {category} complaint.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Contact Hospital Admin", "Establish direct communication with the Chief Medical Officer.", RecommendationType.SHORT_TERM, aud, 6): recs.append(rec)
            if rec := self._create_rec("Schedule Follow-up", "Ensure resolution is achieved within the SLA timeframe.", RecommendationType.LONG_TERM, aud, 48): recs.append(rec)

        if len(recs) < 3:
            if rec := self._create_rec("Escalate to Health Commissioner", "Provide summary report to state health authorities.", RecommendationType.SHORT_TERM, RecommendationAudience.STATE, 24): recs.append(rec)
            if rec := self._create_rec("Monitor Compliance", "Track resolution metrics against district averages.", RecommendationType.LONG_TERM, RecommendationAudience.PUBLIC_HEALTH, 120): recs.append(rec)
            
        logger.info(f"Government recommendations generated: {len(recs)}")
        return recs[:5]

    def _generate_hospital(self, category: str, is_critical: bool) -> List[Recommendation]:
        """
        Generates 3-5 hospital recommendations.

        Args:
            category (str): The inferred complaint category.
            is_critical (bool): True if priority is HIGH or CRITICAL.

        Returns:
            List[Recommendation]: List of generated hospital recommendations.
        """
        recs: List[Recommendation] = []
        aud = RecommendationAudience.HOSPITAL
        
        if "medicine" in category or "oxygen" in category or "blood" in category:
            if rec := self._create_rec("Replenish Stock", "Move inventory from backup storage to the active dispensing counter.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Notify Pharmacy", "Alert all dispensing units to restrict non-critical distribution.", RecommendationType.SHORT_TERM, aud, 4): recs.append(rec)
            if rec := self._create_rec("Update Inventory Register", "Log the shortage in the central inventory management system.", RecommendationType.SHORT_TERM, aud, 8): recs.append(rec)
            
        elif "doctor" in category or "nurse" in category or "staff" in category:
            if rec := self._create_rec("Assign Alternate Doctor", "Immediately map available on-call physicians to the unstaffed ward.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Update Duty Roster", "Reflect emergency staffing changes in the public notice board.", RecommendationType.SHORT_TERM, aud, 4): recs.append(rec)
            if is_critical:
                if rec := self._create_rec("Activate Reserve Staff", "Call in off-duty personnel with overtime approval.", RecommendationType.IMMEDIATE_ACTION, aud, 2): recs.append(rec)
                
        elif "equipment" in category or "machine" in category:
            if rec := self._create_rec("Take Equipment Offline", "Isolate the malfunctioning machine to prevent patient harm.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Arrange Replacement", "Divert patients to functioning machines in adjacent wards.", RecommendationType.SHORT_TERM, aud, 4): recs.append(rec)
            if rec := self._create_rec("Log Downtime", "Record exact time of failure for vendor SLA tracking.", RecommendationType.SHORT_TERM, aud, 8): recs.append(rec)
            
        elif "infrastructure" in category or "electricity" in category or "water" in category:
            if rec := self._create_rec("Restrict Affected Area", "Cordon off the damaged zone to ensure patient safety.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Activate Backup Systems", "Ensure generators or reserve water tanks are fully operational.", RecommendationType.IMMEDIATE_ACTION, aud, 2): recs.append(rec)
            
        elif "emergency" in category or "fire" in category or "casualty" in category:
            if rec := self._create_rec("Prepare Emergency Ward", "Clear ICU and casualty beds for incoming trauma patients.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Mobilize Staff", "Initiate Code Red protocol and assemble all available trauma surgeons.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Evacuate Non-Critical", "Begin safe transfer of stable patients to clear capacity.", RecommendationType.SHORT_TERM, aud, 4): recs.append(rec)
            
        else:
            if rec := self._create_rec("Internal Escalation", "Notify the Chief Medical Officer of the grievance immediately.", RecommendationType.IMMEDIATE_ACTION, aud): recs.append(rec)
            if rec := self._create_rec("Open Incident Ticket", "Register the complaint in the hospital's internal tracking portal.", RecommendationType.SHORT_TERM, aud, 4): recs.append(rec)
            if rec := self._create_rec("Assign Investigation", "Delegate a floor manager to physically verify the reported issue.", RecommendationType.SHORT_TERM, aud, 8): recs.append(rec)

        if len(recs) < 3:
            if rec := self._create_rec("Counsel Patient Party", "Deploy public relations officer to calm affected citizens.", RecommendationType.IMMEDIATE_ACTION, aud, 2): recs.append(rec)
            if rec := self._create_rec("Draft Incident Report", "Prepare formal explanation for district authorities.", RecommendationType.SHORT_TERM, aud, 24): recs.append(rec)

        logger.info(f"Hospital recommendations generated: {len(recs)}")
        return recs[:5]

    def _generate_preventive(self, category: str) -> List[Recommendation]:
        """
        Generates 2-4 preventive recommendations.

        Args:
            category (str): The inferred complaint category.

        Returns:
            List[Recommendation]: List of generated preventive recommendations.
        """
        recs: List[Recommendation] = []
        aud = RecommendationAudience.PUBLIC_HEALTH
        
        if "medicine" in category or "oxygen" in category:
            if rec := self._create_rec("Weekly Stock Audits", "Mandate physical verification of critical inventory every Friday.", RecommendationType.PREVENTIVE, aud, 168): recs.append(rec)
            if rec := self._create_rec("Low-Stock Alerts", "Configure digital threshold warnings before stocks deplete.", RecommendationType.PREVENTIVE, aud, 72): recs.append(rec)
            if rec := self._create_rec("Forecast Demand", "Analyze historical seasonal data for proactive procurement.", RecommendationType.PREVENTIVE, aud, 336): recs.append(rec)
            
        elif "doctor" in category or "staff" in category:
            if rec := self._create_rec("Attendance Monitoring", "Establish daily district-level review of physician punch-in times.", RecommendationType.PREVENTIVE, aud, 72): recs.append(rec)
            if rec := self._create_rec("Digital Shift Management", "Implement dynamic scheduling software with automated gap detection.", RecommendationType.PREVENTIVE, aud, 168): recs.append(rec)
            
        elif "equipment" in category or "machine" in category:
            if rec := self._create_rec("Maintenance Schedule", "Enforce strict preventive maintenance logging for all biomedical assets.", RecommendationType.PREVENTIVE, aud, 168): recs.append(rec)
            if rec := self._create_rec("Vendor Penalty Clause", "Review AMC contracts to strictly enforce uptime guarantees.", RecommendationType.PREVENTIVE, aud, 336): recs.append(rec)
            
        elif "infrastructure" in category or "sanitation" in category:
            if rec := self._create_rec("Monthly Inspections", "Schedule recurring safety and cleanliness audits by external agencies.", RecommendationType.PREVENTIVE, aud, 720): recs.append(rec)
            if rec := self._create_rec("Feedback Kiosks", "Install digital citizen feedback machines near high-traffic zones.", RecommendationType.PREVENTIVE, aud, 168): recs.append(rec)
            
        elif "emergency" in category or "fire" in category:
            if rec := self._create_rec("Emergency Drills", "Conduct quarterly mock drills for staff readiness.", RecommendationType.PREVENTIVE, aud, 720): recs.append(rec)
            if rec := self._create_rec("Evacuation Mapping", "Clearly mark and maintain all emergency exits and triage paths.", RecommendationType.PREVENTIVE, aud, 168): recs.append(rec)
            
        else:
            if rec := self._create_rec("Standard Operating Procedure Review", "Update grievance handling SOPs to prevent recurrence.", RecommendationType.PREVENTIVE, aud, 168): recs.append(rec)
            if rec := self._create_rec("Staff Training", "Conduct empathy and operational training for frontline hospital staff.", RecommendationType.PREVENTIVE, aud, 336): recs.append(rec)

        logger.info(f"Preventive recommendations generated: {len(recs)}")
        return recs[:4]

    def _generate_technical(self, category: str) -> List[Recommendation]:
        """
        Generates 2-4 technical recommendations.

        Args:
            category (str): The inferred complaint category.

        Returns:
            List[Recommendation]: List of generated technical recommendations.
        """
        recs: List[Recommendation] = []
        aud = RecommendationAudience.TECHNICAL
        
        if "medicine" in category or "oxygen" in category:
            if rec := self._create_rec("Validate Inventory Database", "Run integrity checks on the pharmacy supply SQL database.", RecommendationType.LONG_TERM, aud, 24): recs.append(rec)
            if rec := self._create_rec("Monitor Warehouse Sensors", "Calibrate IoT temperature and humidity sensors in storage units.", RecommendationType.LONG_TERM, aud, 48): recs.append(rec)
            
        elif "doctor" in category or "staff" in category:
            if rec := self._create_rec("Sync Biometric Attendance", "Force a manual data sync between local biometric scanners and state servers.", RecommendationType.SHORT_TERM, aud, 12): recs.append(rec)
            if rec := self._create_rec("Check Network Connectivity", "Ensure hospital LAN has stable connection to central HR systems.", RecommendationType.SHORT_TERM, aud, 12): recs.append(rec)
            
        elif "equipment" in category or "machine" in category:
            if rec := self._create_rec("Run Diagnostics", "Execute OEM diagnostic scripts on the affected hardware.", RecommendationType.SHORT_TERM, aud, 12): recs.append(rec)
            if rec := self._create_rec("Verify API Integrations", "Check HL7/DICOM data streams for the diagnostic imaging suites.", RecommendationType.LONG_TERM, aud, 48): recs.append(rec)
            
        elif "infrastructure" in category or "electricity" in category or "water" in category:
            if rec := self._create_rec("Facility Monitoring", "Inspect SCADA and building management systems for unlogged faults.", RecommendationType.LONG_TERM, aud, 48): recs.append(rec)
            if rec := self._create_rec("Camera Audit", "Extract CCTV footage matching the grievance timestamp for verification.", RecommendationType.SHORT_TERM, aud, 12): recs.append(rec)
            
        elif "emergency" in category or "fire" in category:
            if rec := self._create_rec("Verify Emergency Communication Systems", "Test PA systems, pagers, and localized radio networks.", RecommendationType.IMMEDIATE_ACTION, aud, 6): recs.append(rec)
            if rec := self._create_rec("Server Failover Check", "Ensure critical health records databases are on redundant power.", RecommendationType.SHORT_TERM, aud, 24): recs.append(rec)
            
        else:
            if rec := self._create_rec("Audit System Logs", "Review application logs around the grievance timestamp for anomalies.", RecommendationType.SHORT_TERM, aud, 24): recs.append(rec)
            if rec := self._create_rec("Enhance Data Telemetry", "Add granular monitoring for the affected hospital subsystem.", RecommendationType.LONG_TERM, aud, 72): recs.append(rec)

        logger.info(f"Technical recommendations generated: {len(recs)}")
        return recs[:4]

    def _generate_summary(self, category: str, gov_recs: List[Recommendation], hosp_recs: List[Recommendation], is_critical: bool) -> str:
        """
        Generates a concise executive summary based on the priority and generated recommendations.

        Args:
            category (str): The inferred complaint category.
            gov_recs (List[Recommendation]): Generated government recommendations.
            hosp_recs (List[Recommendation]): Generated hospital recommendations.
            is_critical (bool): True if priority is HIGH or CRITICAL.

        Returns:
            str: The composed executive summary.
        """
        summary = []
        prefix = "Critical" if is_critical else "Reported"
        summary.append(f"{prefix} {category} issue detected.")
        
        if hosp_recs:
            summary.append(f"Immediate {hosp_recs[0].title.lower()} required.")
            
        if gov_recs:
            if self._decision.escalation_level in [EscalationLevel.STATE, EscalationLevel.EMERGENCY]:
                summary.append("State authorities notified.")
            else:
                summary.append("District authority notified.")
                
        if is_critical:
            summary.append("Hospital instructed to execute emergency protocols.")
        else:
            summary.append("Hospital instructed to follow the recommended corrective actions.")
        
        logger.info("Summary generated")
        return " ".join(summary)

    def generate(self) -> RecommendationBundle:
        """
        Executes the deterministic generation pipeline and returns 
        the immutable RecommendationBundle. Fault-tolerant logic handles
        individual category generation failures gracefully.

        Returns:
            RecommendationBundle: The fully constructed, immutable recommendation object.
        """
        logger.info("Recommendation generation started")
        
        self._validate()
        category = self._extract_category()
        logger.info(f"Category extracted: {category}")
        
        # Precompute frequently used values
        is_critical = self._decision.priority_level in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]
        self._base_hours = self._get_base_hours()
        aud_gov = RecommendationAudience.STATE if self._decision.escalation_level in [EscalationLevel.STATE, EscalationLevel.EMERGENCY] else RecommendationAudience.DISTRICT
        
        gov_recs: List[Recommendation] = []
        hosp_recs: List[Recommendation] = []
        prev_recs: List[Recommendation] = []
        tech_recs: List[Recommendation] = []
        
        try:
            gov_recs = self._generate_government(category, is_critical, aud_gov)
        except Exception:
            logger.exception(f"Failed to generate government recommendations:")
            
        try:
            hosp_recs = self._generate_hospital(category, is_critical)
        except Exception:
            logger.exception(f"Failed to generate hospital recommendations:")
            
        try:
            prev_recs = self._generate_preventive(category)
        except Exception:
            logger.exception(f"Failed to generate preventive recommendations:")
            
        try:
            tech_recs = self._generate_technical(category)
        except Exception:
            logger.exception(f"Failed to generate technical recommendations:")
        
        summary = self._generate_summary(category, gov_recs, hosp_recs, is_critical)
        
        bundle = RecommendationBundle(
            bundle_id=str(uuid.uuid4()),
            timestamp=datetime.now(UTC).isoformat(),
            priority_score=self._decision.priority_score,
            priority_level=self._decision.priority_level.value,
            generated_for_department=self._decision.recommended_department,
            government_recommendations=gov_recs,
            hospital_recommendations=hosp_recs,
            preventive_recommendations=prev_recs,
            technical_recommendations=tech_recs,
            confidence=self._decision.confidence,
            summary=summary
        )
        
        self._bundle = bundle
        logger.info("Recommendation bundle creation completed")
        return bundle

    def export_dict(self) -> Dict[str, Any]:
        """
        Evaluates and exports the RecommendationBundle as a dictionary.

        Returns:
            Dict[str, Any]: A serialized dictionary representation of the recommendation bundle.
        """
        bundle = self.generate()
        
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
            
        exported = asdict(bundle)
        for k, v in exported.items():
            exported[k] = _enum_handler(v)
            
        logger.info("Dictionary export completed")
        return exported

    def export_json(self) -> str:
        """
        Evaluates and exports the RecommendationBundle as a JSON string with deterministic sorting.

        Returns:
            str: JSON string of the recommendation bundle.
        """
        bundle_dict = self.export_dict()
        logger.info("JSON export completed")
        return json.dumps(
            bundle_dict,
            indent=4,
            sort_keys=True,
            ensure_ascii=False,
        )