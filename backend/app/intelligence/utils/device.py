"""
ArogyaOne — AI Device Management Utilities
"""

import logging
try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

def get_optimal_device(prefer_gpu: bool = True) -> str:
    """Detects the best available compute device."""
    if not prefer_gpu:
        return "cpu"
        
    if TORCH_AVAILABLE and torch.cuda.is_available():
        return "cuda"
        
    return "cpu"

def get_device_info() -> dict:
    """Returns memory and capability info for the current environment."""
    info = {
        "torch_available": TORCH_AVAILABLE,
        "cuda_available": False,
        "device_count": 0,
        "current_device": "cpu"
    }
    
    if TORCH_AVAILABLE and torch.cuda.is_available():
        info["cuda_available"] = True
        info["device_count"] = torch.cuda.device_count()
        info["current_device"] = "cuda"
        info["device_name"] = torch.cuda.get_device_name(0)
        
        # Calculate memory footprint if possible
        try:
            allocated = torch.cuda.memory_allocated(0)
            reserved = torch.cuda.memory_reserved(0)
            info["memory_allocated_mb"] = allocated / (1024 ** 2)
            info["memory_reserved_mb"] = reserved / (1024 ** 2)
        except Exception:
            pass
            
    return info
