import sys
import os

sys.path.append(os.path.abspath('backend'))

from app.intelligence.pipelines.nlp import NLPEngine
from app.intelligence.pipelines.vision import VisionEngine
from app.intelligence.pipelines.speech import SpeechEngine
from app.intelligence.pipelines.forecasting import ForecasterSingleton
from app.intelligence.pipelines.scoring import ScorerSingleton

print("=== AI Model Validation ===")

try:
    nlp = NLPEngine()
    nlp.load()
    print("NLP: Successfully loaded.")
except Exception as e:
    print(f"NLP Failed: {type(e).__name__} - {e}")

try:
    vision = VisionEngine()
    vision.load()
    print("Vision: Successfully loaded.")
except Exception as e:
    print(f"Vision Failed: {type(e).__name__} - {e}")

try:
    speech = SpeechEngine()
    speech.load()
    print("Speech: Successfully loaded.")
except Exception as e:
    print(f"Speech Failed: {type(e).__name__} - {e}")

try:
    forecast = ForecasterSingleton()
    forecast.load()
    print("Forecasting: Successfully loaded.")
except Exception as e:
    print(f"Forecasting Failed: {type(e).__name__} - {e}")

try:
    scorer = ScorerSingleton()
    scorer.load()
    print("Scoring: Successfully loaded.")
except Exception as e:
    print(f"Scoring Failed: {type(e).__name__} - {e}")

try:
    from app.intelligence.pipelines.translation import TranslationEngine
    translation = TranslationEngine()
    translation.load()
    print("Translation: Successfully loaded.")
    test_in = "अस्पताल में डॉक्टर नहीं है"
    test_out = translation.translate(test_in)
    print(f"Translation Test: '{test_in}' -> '{test_out}'")
except Exception as e:
    print(f"Translation Failed: {type(e).__name__} - {e}")

