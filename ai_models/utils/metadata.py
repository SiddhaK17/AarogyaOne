import json
import logging
import platform
from datetime import datetime, UTC
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def save_metadata(filepath: str, metadata: Dict[str, Any]) -> None:
    metadata["timestamp"] = datetime.now(UTC).isoformat()
    metadata["python_version"] = platform.python_version()
    with open(filepath, "w") as f:
        json.dump(metadata, f, indent=4)
    logger.info(f"Metadata saved to {filepath}")

def save_feature_schema(filepath: str, features: List[str], cat_features: List[str]) -> None:
    schema = []
    for f in features:
        schema.append({
            "feature_name": f,
            "type": "categorical" if f in cat_features else "numeric",
            "nullable": False,
            "engineered": True if "rolling" in f or "multiplier" in f or "rate" in f else False,
            "description": f"{f} feature"
        })
    with open(filepath, "w") as f:
        json.dump(schema, f, indent=4)
    logger.info(f"Feature schema saved to {filepath}")
