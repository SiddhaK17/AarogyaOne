import os
import sys
import logging
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.intelligence.pipelines.forecasting import ForecasterSingleton
from app.intelligence.pipelines.scoring import ScorerSingleton
from app.intelligence.pipelines.nlp import NLPEngine
from app.intelligence.pipelines.speech import SpeechEngine
from app.intelligence.pipelines.vision import VisionEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model_validation")

def main():
    logger.info("Starting AI Model Validation...")
    
    engines = {
        "Forecaster": ForecasterSingleton.get_instance(),
        "Scorer": ScorerSingleton.get_instance(),
        "NLP": NLPEngine(),
        "Speech": SpeechEngine(),
        "Vision": VisionEngine()
    }
    
    for name, engine in engines.items():
        try:
            logger.info(f"Loading {name}...")
            engine.load()
            logger.info(f"{name} loaded successfully.")
            
            logger.info(f"Warming up {name}...")
            engine.warmup()
            logger.info(f"{name} warmup successful.")
            
            health = engine.health()
            logger.info(f"{name} Health: {health}")
            
        except Exception as e:
            logger.error(f"Failed to validate {name}: {e}")

if __name__ == "__main__":
    main()
