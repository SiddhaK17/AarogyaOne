"""
AarogyaOne — Complaint Service
=========================================================================
Bridging service between FastAPI routers and the AI Workflow Engine.
Handles database orchestration, transaction management, and workflow 
triggering. Contains strictly application logic, not AI logic.
"""

import asyncio
import logging
import time
import uuid
from typing import Any, Dict, Optional, Protocol
from datetime import datetime, UTC
from dataclasses import asdict

from app.database import models
from app.intelligence.pipelines.workflow import (
    WorkflowResult, 
    WorkflowStatus
)
from app.intelligence.services.dispatcher import DispatchTarget, DispatchPlan

logger = logging.getLogger("aarogya.services.complaint")

# ════════════════════════════════════════════════════════════════════════════
#  EXCEPTIONS
# ════════════════════════════════════════════════════════════════════════════

class ComplaintServiceError(Exception):
    """Base exception for complaint service errors."""
    pass

class ComplaintNotFoundError(ComplaintServiceError):
    pass

class InvalidComplaintStateError(ComplaintServiceError):
    pass

class AIWorkflowExecutionError(ComplaintServiceError):
    pass

class DatabaseError(ComplaintServiceError):
    pass

class RepositoryError(ComplaintServiceError):
    pass

class NotificationError(ComplaintServiceError):
    pass

# ════════════════════════════════════════════════════════════════════════════
#  PROTOCOLS (DEPENDENCY INJECTION INTERFACES)
# ════════════════════════════════════════════════════════════════════════════

class DatabaseTransaction(Protocol):
    async def commit(self) -> None: ...
    async def rollback(self) -> None: ...

class ComplaintRepository(Protocol):
    async def get_by_id(self, complaint_id: int) -> Optional[models.CitizenComplaint]: ...
    async def update_status(self, complaint_id: int, status: str, updated_at: datetime) -> None: ...
    async def save_ai_metadata(self, complaint_id: int, metadata: Dict[str, Any]) -> None: ...

class TaskRepository(Protocol):
    async def create_government_task(self, complaint_id: int, target: str, description: str, priority: str, duration: int) -> str: ...
    async def create_hospital_action(self, complaint_id: int, department: str, description: str, priority: str, duration: int) -> str: ...

class NotificationRepository(Protocol):
    async def schedule_notification(self, complaint_id: int, target_group: str, message: str, priority: str) -> str: ...

class WorkflowEngineProtocol(Protocol):
    def run(self) -> WorkflowResult: ...

class WorkflowEngineFactory(Protocol):
    def __call__(
        self,
        text: Optional[str] = None,
        audio_path: Optional[str] = None,
        image_path: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> WorkflowEngineProtocol: ...

# ════════════════════════════════════════════════════════════════════════════
#  SERVICE
# ════════════════════════════════════════════════════════════════════════════

class ComplaintService:
    def __init__(
        self,
        complaint_repo: ComplaintRepository,
        task_repo: TaskRepository,
        notification_repo: NotificationRepository,
        transaction: DatabaseTransaction,
        workflow_engine_factory: WorkflowEngineFactory
    ) -> None:
        self._complaint_repo = complaint_repo
        self._task_repo = task_repo
        self._notification_repo = notification_repo
        self._transaction = transaction
        self._workflow_engine_factory = workflow_engine_factory

    async def mark_ai_failed(self, complaint_id: str, error_message: str) -> None:
        """
        Marks a complaint as AI_FAILED safely. Exposed for router failovers.
        """
        try:
            await self._complaint_repo.update_status(int(complaint_id), "AI_FAILED", datetime.now(UTC))
            await self._transaction.commit()
            logger.info("Marked complaint %s as AI_FAILED", complaint_id)
        except Exception as e:
            logger.error("Failed to mark complaint %s as AI_FAILED: %s", complaint_id, e)
            try:
                await self._transaction.rollback()
            except Exception:
                logger.exception("Rollback operation failed for complaint %s", complaint_id)
            raise DatabaseError("Failed to update status to AI_FAILED") from e

    async def process_complaint_intelligence(self, complaint_id: str) -> WorkflowResult:
        correlation_id = f"COMP-{uuid.uuid4()}"
        log_ctx = {"complaint_id": complaint_id, "correlation_id": correlation_id}
        
        logger.info("Initiating intelligence processing for complaint", extra=log_ctx)
        start_time = time.perf_counter()

        try:
            try:
                complaint = await self._complaint_repo.get_by_id(int(complaint_id))
            except Exception as e:
                raise RepositoryError(f"Database error fetching complaint: {e}") from e
                
            if not complaint:
                raise ComplaintNotFoundError(f"Complaint ID {complaint_id} not found.")

            status = getattr(complaint, "status", "UNKNOWN")
            if status in ("PROCESSED", "CLOSED", "ARCHIVED"):
                raise InvalidComplaintStateError(f"Complaint {complaint_id} is in non-processable state: {status}.")

            text_input = getattr(complaint, "description", None)
            audio_path = getattr(complaint, "audio_evidence_path", None)
            image_path = getattr(complaint, "image_evidence_path", None)
            metadata = getattr(complaint, "metadata", {})

            logger.info("Dispatching complaint to WorkflowEngine", extra=log_ctx)
            engine = self._workflow_engine_factory(
                text=text_input,
                audio_path=audio_path,
                image_path=image_path,
                metadata=metadata
            )
            
            try:
                result: WorkflowResult = await asyncio.to_thread(engine.run)
            except Exception as e:
                raise AIWorkflowExecutionError(f"AI Workflow failed to execute: {e}") from e

            log_ctx["workflow_status"] = result.status.value

            if result.status == WorkflowStatus.FAILED:
                logger.error("WorkflowEngine failed. Errors: %s", result.errors, extra=log_ctx)
                raise AIWorkflowExecutionError(f"AI Workflow failed: {result.errors}")

            try:
                plan = await self._persist_workflow_results(complaint_id, result, log_ctx)
            except Exception as e:
                raise RepositoryError(f"Failed to persist workflow results: {e}") from e

            try:
                await self._transaction.commit()
            except Exception as e:
                raise DatabaseError(f"Transaction commit failed: {e}") from e
                
            # Attempt notifications (DO NOT ROLLBACK IF IT FAILS)
            if plan:
                try:
                    await self._send_notifications(complaint_id, plan, log_ctx)
                except Exception as e:
                    logger.error("Notification failures occurred, but transaction is committed: %s", e, extra=log_ctx)
            
            exec_time = round(time.perf_counter() - start_time, 3)
            log_ctx["execution_time"] = exec_time
            logger.info("Successfully processed complaint", extra=log_ctx)
            return result

        except ComplaintServiceError:
            logger.exception("Domain error processing complaint. Rolling back transaction.", extra=log_ctx)
            try:
                await self._transaction.rollback()
            except Exception:
                logger.exception("Rollback operation failed.", extra=log_ctx)
            raise
        except Exception as e:
            logger.exception("Unexpected error processing complaint. Rolling back transaction.", extra=log_ctx)
            try:
                await self._transaction.rollback()
            except Exception:
                logger.exception("Rollback operation failed.", extra=log_ctx)
            raise DatabaseError("Database transaction failed due to unexpected error") from e

    async def _persist_workflow_results(self, complaint_id: str, result: WorkflowResult, log_ctx: dict) -> Optional[DispatchPlan]:
        def _enum_serializer(obj: Any) -> Any:
            if hasattr(obj, "value"): return obj.value
            if isinstance(obj, list): return [_enum_serializer(i) for i in obj]
            if isinstance(obj, dict): return {k: _enum_serializer(v) for k, v in obj.items()}
            return obj
            
        serialized_result = _enum_serializer(asdict(result))
        await self._complaint_repo.save_ai_metadata(int(complaint_id), serialized_result)
        await self._complaint_repo.update_status(int(complaint_id), "PROCESSED", datetime.now(UTC))

        if not result.dispatch_result:
            logger.warning("No DispatchPlan found. Skipping task generation.", extra=log_ctx)
            return None

        plan = result.dispatch_result
        priority = plan.priority_level
        department = "GENERAL"
        
        if result.priority_result and result.priority_result.recommended_department:
            department = result.priority_result.recommended_department

        for task in plan.tasks:
            duration = task.estimated_duration_hours
            desc = f"{task.title}: {task.description}"
            
            if task.assigned_target in [DispatchTarget.HOSPITAL, DispatchTarget.TECHNICAL]:
                await self._task_repo.create_hospital_action(
                    complaint_id=int(complaint_id),
                    department=department,
                    description=desc,
                    priority=priority,
                    duration=duration
                )
            else:
                await self._task_repo.create_government_task(
                    complaint_id=int(complaint_id),
                    target=task.assigned_target.value,
                    description=desc,
                    priority=priority,
                    duration=duration
                )

        logger.info("Persisted %d tasks", len(plan.tasks), extra=log_ctx)
        return plan
        
    async def _send_notifications(self, complaint_id: str, plan: DispatchPlan, log_ctx: dict) -> None:
        priority = plan.priority_level
        for target in plan.notification_targets:
            await self._notification_repo.schedule_notification(
                complaint_id=int(complaint_id),
                target_group=target,
                message=f"New {priority} priority complaint assigned.",
                priority=priority
            )
        logger.info("Persisted %d notifications", len(plan.notification_targets), extra=log_ctx)
