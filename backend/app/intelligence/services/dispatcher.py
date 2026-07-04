"""
AarogyaOne — AI Dispatcher Engine
=========================================================================
Consumes PriorityDecision and RecommendationBundle objects to deterministically 
build an execution plan for downstream workflow engines.

Performs no machine learning, inference, database operations, file operations, 
or network requests.
"""

from __future__ import annotations

import json
import logging
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, UTC
from enum import Enum
from typing import Any, Dict, List, Set

# Attempt to safely import dependencies
try:
    from backend.app.intelligence.services.priority import (
        PriorityDecision, 
        PriorityLevel, 
        EscalationLevel
    )
    from backend.app.intelligence.services.recommendation import (
        RecommendationBundle, 
        RecommendationAudience, 
        RecommendationType
    )
except ImportError:
    # Fallback to local import if executed dynamically
    import sys
    from pathlib import Path
    sys.path.append(str(Path(__file__).resolve().parent))
    from priority import PriorityDecision, PriorityLevel, EscalationLevel
    from recommendation import RecommendationBundle, RecommendationAudience, RecommendationType

# ── LOGGING ─────────────────────────────────────────────────────────────────
logger = logging.getLogger("aarogya.dispatcher_engine")

# ════════════════════════════════════════════════════════════════════════════
#  ENUMERATIONS
# ════════════════════════════════════════════════════════════════════════════

class DispatchTarget(str, Enum):
    HOSPITAL = "HOSPITAL"
    DISTRICT = "DISTRICT"
    STATE = "STATE"
    EMERGENCY = "EMERGENCY"
    TECHNICAL = "TECHNICAL"
    PUBLIC_HEALTH = "PUBLIC_HEALTH"

class WorkflowStage(str, Enum):
    VALIDATION = "VALIDATION"
    ASSIGNMENT = "ASSIGNMENT"
    NOTIFICATION = "NOTIFICATION"
    EXECUTION = "EXECUTION"
    MONITORING = "MONITORING"
    FOLLOW_UP = "FOLLOW_UP"
    CLOSED = "CLOSED"

class DispatchStatus(str, Enum):
    READY = "READY"
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

# ════════════════════════════════════════════════════════════════════════════
#  DATACLASSES
# ════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class DispatchRoute:
    """Represents a specific operational route for the grievance execution."""
    route_id: str
    target: DispatchTarget
    department: str
    priority: str
    response_time: str
    escalation_level: str

@dataclass(frozen=True)
class DispatchTask:
    """Individual workflow step for execution by downstream orchestrators."""
    task_id: str
    title: str
    description: str
    workflow_stage: WorkflowStage
    assigned_target: DispatchTarget
    estimated_duration_hours: int
    status: DispatchStatus
    execution_order: int

@dataclass(frozen=True)
class DispatchPlan:
    """The fully assembled, immutable workflow execution plan."""
    plan_id: str
    timestamp: str
    priority_level: str
    priority_score: int
    routes: List[DispatchRoute]
    tasks: List[DispatchTask]
    notification_targets: List[str]
    execution_summary: str
    estimated_total_duration: int
    confidence: float


# ════════════════════════════════════════════════════════════════════════════
#  ENGINE
# ════════════════════════════════════════════════════════════════════════════

class DispatcherEngine:
    """
    Consumes a PriorityDecision and RecommendationBundle to deterministically
    create a DispatchPlan.
    """

    def __init__(self, decision: PriorityDecision, bundle: RecommendationBundle) -> None:
        """
        Initializes the DispatcherEngine.

        Args:
            decision (PriorityDecision): The immutable PriorityDecision.
            bundle (RecommendationBundle): The immutable RecommendationBundle.
        """
        self._decision = decision
        self._bundle = bundle
        self._plan: DispatchPlan | None = None

    def _validate(self) -> None:
        """
        Validates the incoming PriorityDecision and RecommendationBundle.

        Raises:
            ValueError: If required dependencies are missing or invalid.
        """
        if not self._decision:
            raise ValueError("PriorityDecision is missing.")
            
        if not self._bundle:
            raise ValueError("RecommendationBundle is missing.")
            
        if self._decision.priority_score < 0 or self._decision.priority_score > 100:
            raise ValueError(f"Invalid priority score: {self._decision.priority_score}")
            
        if self._decision.confidence < 0.0 or self._decision.confidence > 1.0:
            raise ValueError(f"Invalid confidence: {self._decision.confidence}")
            
        if not isinstance(self._decision.priority_level, PriorityLevel):
            raise ValueError("Invalid priority level.")
            
        if not isinstance(
            self._decision.escalation_level,
            EscalationLevel,
        ):
            raise ValueError("Invalid escalation level.")
            
        if not getattr(self._decision, "recommended_department", None):
            raise ValueError("Recommended department is missing.")
            
        logger.info("Validation complete")

    def _build_routes(self) -> List[DispatchRoute]:
        """
        Constructs deterministic operational routes based on AI outputs.

        Returns:
            List[DispatchRoute]: Unique routes for the execution plan.
            
        Raises:
            Exception: Propagated from internal errors during routing.
        """
        routes = []
        dept = self._decision.recommended_department
        priority = self._decision.priority_level.value
        response = self._decision.response_time.value
        esc = self._decision.escalation_level.value
        
        # Determine logical flow of targets
        targets = [DispatchTarget.HOSPITAL]

        if self._decision.priority_level in (
            PriorityLevel.HIGH,
            PriorityLevel.CRITICAL,
        ):
            targets.append(DispatchTarget.DISTRICT)
                
        dept_lower = dept.lower()
        if "inventory" in dept_lower or "pharmacy" in dept_lower:
            targets.append(DispatchTarget.DISTRICT)
            if self._decision.priority_level in (
                PriorityLevel.CRITICAL,
                PriorityLevel.HIGH,
            ):
                targets.append(DispatchTarget.STATE)
                
        elif "admin" in dept_lower or "staff" in dept_lower:
            targets.append(DispatchTarget.DISTRICT)
            
        elif "biomedical" in dept_lower or "engineering" in dept_lower:
            targets.append(DispatchTarget.TECHNICAL)
            
        elif "emergency" in dept_lower:
            targets.append(DispatchTarget.EMERGENCY)
            targets.append(DispatchTarget.DISTRICT)
            if self._decision.priority_level == PriorityLevel.CRITICAL:
                targets.append(DispatchTarget.STATE)
                
        # Deduplicate targets while preserving general order
        seen_targets = set()
        for t in targets:
            if t not in seen_targets:
                routes.append(DispatchRoute(
                    route_id=str(uuid.uuid4()),
                    target=t,
                    department=dept,
                    priority=priority,
                    response_time=response,
                    escalation_level=esc
                ))
                seen_targets.add(t)
                
        logger.info("Routes generated: %d", len(routes))
        return routes

    def _build_tasks(self, routes: List[DispatchRoute]) -> List[DispatchTask]:
        """
        Translates workflow stages and recommendations into deterministic steps.

        Args:
            routes (List[DispatchRoute]): Computed dispatch routes.

        Returns:
            List[DispatchTask]: Ordered execution steps.
            
        Raises:
            Exception: If task generation fails unexpectedly.
        """
        tasks: List[DispatchTask] = []
        
        base_durations = {
            PriorityLevel.CRITICAL: 1,
            PriorityLevel.HIGH: 2,
            PriorityLevel.MEDIUM: 4,
            PriorityLevel.LOW: 8
        }
        base_hr = base_durations.get(self._decision.priority_level, 4)
        
        # Step 1: Validation
        tasks.append(DispatchTask(
            task_id=str(uuid.uuid4()),
            title="Initial Complaint Validation",
            description="Verify authenticity and context of the incoming evidence.",
            workflow_stage=WorkflowStage.VALIDATION,
            assigned_target=DispatchTarget.DISTRICT if self._decision.priority_level in [PriorityLevel.HIGH, PriorityLevel.CRITICAL] else DispatchTarget.HOSPITAL,
            estimated_duration_hours=max(1, base_hr // 2),
            status=DispatchStatus.READY,
            execution_order=1
        ))
        
        # Step 2: Assignment
        tasks.append(DispatchTask(
            task_id=str(uuid.uuid4()),
            title="Case Assignment",
            description=f"Assign task force within {self._decision.recommended_department}.",
            workflow_stage=WorkflowStage.ASSIGNMENT,
            assigned_target=DispatchTarget.HOSPITAL,
            estimated_duration_hours=max(1, base_hr // 2),
            status=DispatchStatus.QUEUED,
            execution_order=2
        ))
        
        # Step 3: Notification
        tasks.append(DispatchTask(
            task_id=str(uuid.uuid4()),
            title="Multi-channel Notification",
            description="Broadcast alerts to derived notification targets.",
            workflow_stage=WorkflowStage.NOTIFICATION,
            assigned_target=DispatchTarget.TECHNICAL,
            estimated_duration_hours=1,
            status=DispatchStatus.QUEUED,
            execution_order=3
        ))
        
        # Step 4: Execution
        primary_target = routes[0].target if routes else DispatchTarget.HOSPITAL
        tasks.append(DispatchTask(
            task_id=str(uuid.uuid4()),
            title="Execute Core Recommendations",
            description="Perform the immediate and short-term actions listed in the recommendation bundle.",
            workflow_stage=WorkflowStage.EXECUTION,
            assigned_target=primary_target,
            estimated_duration_hours=base_hr * 3,
            status=DispatchStatus.QUEUED,
            execution_order=4
        ))
        
        # Step 5: Monitoring
        monitor_target = DispatchTarget.STATE if self._decision.escalation_level in [EscalationLevel.STATE, EscalationLevel.EMERGENCY] else DispatchTarget.DISTRICT
        tasks.append(DispatchTask(
            task_id=str(uuid.uuid4()),
            title="SLA Monitoring",
            description="Track progress against designated response SLA.",
            workflow_stage=WorkflowStage.MONITORING,
            assigned_target=monitor_target,
            estimated_duration_hours=base_hr * 4,
            status=DispatchStatus.QUEUED,
            execution_order=5
        ))
        
        # Step 6: Follow-up
        tasks.append(DispatchTask(
            task_id=str(uuid.uuid4()),
            title="Corrective Follow-up",
            description="Confirm resolution and implement preventive measures.",
            workflow_stage=WorkflowStage.FOLLOW_UP,
            assigned_target=DispatchTarget.PUBLIC_HEALTH,
            estimated_duration_hours=base_hr * 2,
            status=DispatchStatus.QUEUED,
            execution_order=6
        ))
        
        # Step 7: Close Case
        tasks.append(DispatchTask(
            task_id=str(uuid.uuid4()),
            title="Case Closure",
            description="Final sign-off and archiving of the grievance evidence.",
            workflow_stage=WorkflowStage.CLOSED,
            assigned_target=DispatchTarget.DISTRICT,
            estimated_duration_hours=1,
            status=DispatchStatus.QUEUED,
            execution_order=7
        ))
        
        logger.info("Tasks generated: %d", len(tasks))
        return tasks

    def _determine_notifications(self) -> List[str]:
        """
        Derives a deduplicated list of notification groups based on department and escalation.

        Returns:
            List[str]: Unique notification titles.
            
        Raises:
            Exception: If there is an unexpected error processing notifications.
        """
        targets: Set[str] = set(["Hospital Administrator"])
        dept = self._decision.recommended_department.lower()
        
        if "inventory" in dept or "pharmacy" in dept:
            targets.add("Inventory Manager")
            targets.add("Chief Medical Officer")
        elif "admin" in dept or "staff" in dept:
            targets.add("Chief Medical Officer")
            targets.add("District Health Officer")
        elif "engineering" in dept or "infrastructure" in dept:
            targets.add("Engineering Head")
            targets.add("Facility Manager")
        elif "biomedical" in dept or "equipment" in dept:
            targets.add("Biomedical Engineering Team")
        elif "emergency" in dept or "casualty" in dept:
            targets.add("Emergency Operations Center")
            targets.add("Chief Medical Officer")
            
        if self._decision.escalation_level in [EscalationLevel.DISTRICT, EscalationLevel.STATE, EscalationLevel.EMERGENCY]:
            targets.add("District Health Officer")
            
        if self._decision.escalation_level in [EscalationLevel.STATE, EscalationLevel.EMERGENCY]:
            targets.add("State Health Commissioner")
            
        final_targets = sorted(list(targets))
        logger.info("Notification targets generated: %d", len(final_targets))
        return final_targets

    def _calculate_execution_time(self, tasks: List[DispatchTask]) -> int:
        """
        Calculates total estimated hours across all tasks.
        
        Args:
            tasks (List[DispatchTask]): Current set of dispatch tasks.
            
        Returns:
            int: The total estimated hours for the workflow.
            
        Raises:
            Exception: If calculation fails unexpectedly.
        """
        return sum(t.estimated_duration_hours for t in tasks)

    def _generate_summary(self, routes: List[DispatchRoute], tasks: List[DispatchTask], total_duration: int) -> str:
        """
        Generates a concise execution summary.
        
        Args:
            routes (List[DispatchRoute]): Computed routes.
            tasks (List[DispatchTask]): Computed tasks.
            total_duration (int): Estimated total time.

        Returns:
            str: Concise summary string.
            
        Raises:
            Exception: If summary generation fails.
        """
        target_names = [r.target.value.title() for r in routes]
        if len(target_names) > 1:
            route_str = f"{', '.join(target_names[:-1])} and {target_names[-1]}"
        else:
            route_str = target_names[0] if target_names else "Hospital"
            
        summary = [f"Complaint routed to {route_str}."]
        
        if self._decision.escalation_level in [EscalationLevel.EMERGENCY, EscalationLevel.STATE]:
            summary.append("Emergency notification scheduled.")
            
        summary.append(f"Execution pipeline contains {len(tasks)} tasks.")
        summary.append(f"Estimated workflow completion: approximately {total_duration} hour(s).")
        
        logger.info("Execution summary generated")
        return " ".join(summary)

    def dispatch(self) -> DispatchPlan:
        """
        Executes the fault-tolerant planning pipeline and returns the 
        immutable DispatchPlan. Each major step is isolated to prevent 
        complete pipeline failure.

        Returns:
            DispatchPlan: The finalized execution plan.
        """
        logger.info("Dispatch started")
        
        self._validate()
        
        routes: List[DispatchRoute] = []
        try:
            routes = self._build_routes()
        except Exception:
            logger.exception("Failed to build routes.")
            
        tasks: List[DispatchTask] = []
        try:
            tasks = self._build_tasks(routes)
        except Exception:
            logger.exception("Failed to build tasks.")
            
        notifications: List[str] = []
        try:
            notifications = self._determine_notifications()
        except Exception:
            logger.exception("Failed to determine notifications.")
            
        total_duration = 0
        try:
            total_duration = self._calculate_execution_time(tasks)
        except Exception:
            logger.exception("Failed to calculate execution time.")
            
        summary = ""
        try:
            summary = self._generate_summary(routes, tasks, total_duration)
        except Exception:
            logger.exception("Failed to generate summary.")
        
        plan = DispatchPlan(
            plan_id=str(uuid.uuid4()),
            timestamp=datetime.now(UTC).isoformat(),
            priority_level=self._decision.priority_level.value,
            priority_score=self._decision.priority_score,
            routes=routes,
            tasks=tasks,
            notification_targets=notifications,
            execution_summary=summary,
            estimated_total_duration=total_duration,
            confidence=self._decision.confidence
        )
        
        self._plan = plan
        logger.info("Dispatch completed")
        return plan

    def export_dict(self) -> Dict[str, Any]:
        """
        Evaluates and exports the DispatchPlan as a dictionary.

        Returns:
            Dict[str, Any]: A serialized dictionary representation of the execution plan.
        """
        plan = self.dispatch()
        
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
            
        exported = asdict(plan)
        for k, v in exported.items():
            exported[k] = _enum_handler(v)
            
        logger.info("Dictionary exported")
        return exported

    def export_json(self) -> str:
        """
        Evaluates and exports the DispatchPlan as a deterministic JSON string.

        Returns:
            str: JSON string of the execution plan.
        """
        plan_dict = self.export_dict()
        logger.info("JSON exported")
        return json.dumps(
            plan_dict, 
            indent=4, 
            sort_keys=True, 
            ensure_ascii=False
        )
