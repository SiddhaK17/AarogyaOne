"""
ArogyaOne — AI Pipeline Domain Exceptions
"""

class ModelLoadError(Exception):
    """Raised when a model file cannot be loaded or deserialized."""
    pass

class ArtifactMissingError(Exception):
    """Raised when required metadata, schemas, or metrics are missing."""
    pass

class InferenceError(Exception):
    """Raised when a prediction fails unexpectedly during execution."""
    pass

class FeatureValidationError(Exception):
    """Raised when inference features are malformed, out of bounds, or ordered incorrectly."""
    pass

class ModelVersionMismatchError(Exception):
    """Raised when the loaded model artifacts have conflicting versions."""
    pass

class AIInitializationError(Exception):
    """Raised when the AI subsystem fails to initialize."""
    pass

class ModelUnavailableError(Exception):
    """Raised when an engine is invoked but has not been loaded."""
    pass

class InferenceTimeoutError(Exception):
    """Raised when inference execution exceeds maximum allowed time."""
    pass

class WarmupFailureError(Exception):
    """Raised when a mock prediction fails during startup warmup."""
    pass

class HealthCheckFailureError(Exception):
    """Raised when a scheduled health check fails."""
    pass

class DeviceInitializationError(Exception):
    """Raised when a requested device (e.g. CUDA GPU) cannot be initialized."""
    pass
