"""
ArogyaOne — AI Dependency Providers

Provides dependency injection wrappers for the FastAPI application.
Ensures that routers receive the unified Orchestrator rather than 
attempting to instantiate AI components manually.
"""

from fastapi import Request
from app.intelligence.services.ai_orchestrator import AIOrchestrator

def get_ai_orchestrator(request: Request) -> AIOrchestrator:
    """
    Returns the centralized AI Orchestrator.
    Attached to the app state or instantiated purely since it delegates
    to a centralized thread-safe registry.
    """
    if not hasattr(request.app.state, "ai_orchestrator"):
        request.app.state.ai_orchestrator = AIOrchestrator()
        
    return request.app.state.ai_orchestrator
