"""
ArogyaOne — AI Logging and Timing Utilities
"""

import time
import logging
from functools import wraps

logger = logging.getLogger(__name__)

def log_execution_time(event_name: str):
    """
    Decorator to log execution time of an AI inference function.
    Automatically calculates milliseconds and logs structured output.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                exec_ms = (time.perf_counter() - start) * 1000.0
                logger.info(f"{event_name}_success", extra={
                    "execution_time_ms": round(exec_ms, 2),
                    "target_function": func.__name__
                })
                return result
            except Exception as e:
                exec_ms = (time.perf_counter() - start) * 1000.0
                logger.error(f"{event_name}_failure", extra={
                    "execution_time_ms": round(exec_ms, 2),
                    "target_function": func.__name__,
                    "error": str(e)
                })
                raise
        return wrapper
    return decorator
