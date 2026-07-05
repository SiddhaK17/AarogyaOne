"""
ArogyaOne — AI Subsystem Lifecycle Manager

Executed exclusively during the FastAPI lifespan hook.
Pre-loads all models into memory (GPU/CPU), validates artifacts,
and runs a lightweight warmup inference to eliminate first-request latency.
"""

import logging
from app.intelligence.core.engine_registry import EngineRegistry
from app.intelligence.pipelines.config import ORCHESTRATOR_CONFIG
from app.intelligence.pipelines.exceptions import WarmupFailureError, AIInitializationError
from app.intelligence.core.base_engine import BaseAIEngine

logger = logging.getLogger(__name__)

def initialize_ai_subsystem():
    """
    Called by FastAPI lifespan.
    Iterates over all registered engines, forcing a load and warmup.
    Validation happens automatically as EngineRegistry requires BaseAIEngine.
    """
    logger.info("ai_subsystem_startup_started", extra={"event_message": "Beginning AI subsystem initialization."})
    
    registry = EngineRegistry.get_instance()
    
    try:
        for engine_name, engine in registry.get_all_engines().items():
            logger.info("ai_engine_loading", extra={"engine": engine_name})
            engine.load()
            
            logger.info("ai_engine_warming_up", extra={"engine": engine_name})
            engine.warmup()
            
            health = engine.health()
            if not health.get("is_loaded", False):
                raise AIInitializationError(f"Engine {engine_name} reported false is_loaded after warmup.")
                
            logger.info("ai_engine_loaded", extra={
                "engine": engine_name,
                "metadata": engine.metadata()
            })
            
        logger.info("ai_subsystem_startup_complete", extra={
            "loaded_models": registry.list_loaded_models()
        })
        
    except Exception as e:
        logger.error("ai_subsystem_startup_failed", extra={"error": str(e)})
        if ORCHESTRATOR_CONFIG.fail_fast_on_corruption:
            raise AIInitializationError(f"Fatal error during AI subsystem startup: {e}") from e


def shutdown_ai_subsystem():
    """
    Gracefully shuts down the AI subsystem.
    Iterates through all engines, releasing GPU/CPU resources.
    """
    logger.info("ai_subsystem_shutdown_started", extra={"event_message": "Beginning AI subsystem shutdown."})
    
    registry = EngineRegistry.get_instance()
    
    for engine_name, engine in registry.get_all_engines().items():
        try:
            if engine.is_loaded():
                logger.info("ai_engine_shutting_down", extra={"engine": engine_name})
                engine.shutdown()
        except Exception as e:
            logger.error(f"Error shutting down {engine_name}: {e}", exc_info=True)
            
    logger.info("ai_subsystem_shutdown_complete")
