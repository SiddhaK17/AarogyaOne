"""
ArogyaOne — Abstract Base Engine Contract

Enforces a consistent interface for every AI module in the intelligence subsystem.
Ensures uniform loading, warmup, health reporting, and shutdown mechanisms across all models.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseAIEngine(ABC):
    """
    Abstract contract that must be implemented by every production AI engine wrapper.
    """

    @abstractmethod
    def load(self) -> None:
        """
        Allocates weights to device (GPU/CPU).
        Must validate artifacts and establish necessary memory footprints.
        """
        pass

    @abstractmethod
    def reload(self) -> None:
        """
        Clears existing memory allocation and forces a fresh load.
        """
        pass

    @abstractmethod
    def shutdown(self) -> None:
        """
        Releases GPU/CPU resources, clears caches (e.g. torch.cuda.empty_cache()),
        and safely tears down the engine.
        """
        pass

    @abstractmethod
    def warmup(self) -> None:
        """
        Executes a mock payload or standard tensor mapping to prime CUDA/memory
        and eliminate first-request latency.
        """
        pass

    @abstractmethod
    def is_loaded(self) -> bool:
        """
        Returns True if the engine is currently loaded into memory.
        """
        pass

    @abstractmethod
    def health(self) -> Dict[str, Any]:
        """
        Returns health telemetry dict containing standard fields:
        {
            "is_loaded": bool,
            "device": str,
            "model_version": str,
            "dataset_version": str,
            "training_quality_r2": float,
            "last_warmup_timestamp": str
        }
        """
        pass

    @abstractmethod
    def metadata(self) -> Dict[str, Any]:
        """
        Returns raw metadata dictionary describing the underlying model/artifacts.
        """
        pass
