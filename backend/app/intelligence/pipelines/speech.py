"""
AarogyaOne — Speech-to-Text Pipeline
=========================================================================
Audio processing and transcription pipeline that:
  1. Validates and preprocesses incoming multilingual audio complaints
  2. Loads the OpenAI Whisper Large-v3 model from Hugging Face and automatically caches it locally for future use.
  3. Uses CUDA for hardware acceleration if available
  4. Automatically detects the language of the speaker
  5. Generates transcripts and extracts audio metadata
  6. Saves structured transcript results to JSON format

This module is exclusively for speech-to-text generation.
Classification of the resulting text is delegated to the NLP pipeline.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
try:
    import torchaudio
except (ImportError, RuntimeError) as e:
    import logging
    logging.getLogger("aarogya.speech_pipeline").warning(
        "torchaudio could not be imported (FFmpeg/driver issue). Speech pipeline will fallback to soundfile/librosa. Error: %s", e
    )
    torchaudio = None
import numpy as np

from app.intelligence.core.base_engine import BaseAIEngine

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("aarogya.speech_pipeline")

# ── Path configuration ─────────────────────────────────────────────────────
_FILE_DIR = Path(__file__).resolve().parent
if str(_FILE_DIR) not in sys.path:
    sys.path.insert(0, str(_FILE_DIR))

try:
    from app.intelligence.pipelines.config import (
        WHISPER_MODEL_ID,
        HF_CACHE_DIR,
        TRANSCRIPTS_DIR,
    )

    OUTPUT_DIR = Path(TRANSCRIPTS_DIR)

except ImportError:

    WHISPER_MODEL_ID = "openai/whisper-large-v3"

    HF_CACHE_DIR = None

    _PROJECT_ROOT = _FILE_DIR.parent.parent.parent

    OUTPUT_DIR = (
        _PROJECT_ROOT
        / "backend"
        / "app"
        / "intelligence"
        / "store"
        / "transcripts"
    )

SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm"}
MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_DURATION_SECONDS = 30 * 60  # 30 minutes
TARGET_SAMPLE_RATE = 16000

# ── Lazy imports (heavy) ───────────────────────────────────────────────────
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

# ════════════════════════════════════════════════════════════════════════════
#  SECTION 1 — DATACLASSES
# ════════════════════════════════════════════════════════════════════════════

@dataclass
class AudioMetadata:
    """Metadata extracted from the source audio file."""
    file_name: str
    file_extension: str
    file_size_bytes: int
    duration_seconds: float
    sample_rate: int
    channels: int

@dataclass
class TranscriptSegment:
    """A segment of transcribed text with timestamps."""
    start: float
    end: float
    text: str

@dataclass
class TranscriptResult:
    """Structured output containing the transcription and execution metadata."""
    transcript_id: str
    file_name: str
    language: str
    language_code: Optional[str]
    processing_device: str
    model_name: str
    transcript: str
    segments: List[TranscriptSegment]
    audio_metadata: Dict[str, Any]
    processing_time: float
    timestamp: str


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 2 — SPEECH RECOGNIZER
# ════════════════════════════════════════════════════════════════════════════

class SpeechRecognizer:
    """
    Multilingual speech recognition engine using OpenAI Whisper Large-v3.
    Handles device placement, audio validation, preprocessing, inference, and persistence.
    """

    def __init__(self, output_dir: Path = OUTPUT_DIR):
        """
        Initializes the SpeechRecognizer. Does not load the model immediately.
        Call `load_model()` to allocate weights to GPU/CPU.
        """
        self.model_id = WHISPER_MODEL_ID
        self.cache_dir = HF_CACHE_DIR
        self.output_dir = output_dir
        
        if torch.cuda.is_available():
            self.device = "cuda:0"
            self.torch_dtype = torch.float16
        else:
            self.device = "cpu"
            self.torch_dtype = torch.float32
            
        self.model = None
        self.processor = None
        self.pipe = None
        self.model_name = WHISPER_MODEL_ID
        
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.lang_code_to_name = {
            "en": "English",
            "hi": "Hindi",
            "mr": "Marathi",
            "ta": "Tamil",
            "te": "Telugu",
            "bn": "Bengali",
            "gu": "Gujarati",
            "kn": "Kannada",
            "ml": "Malayalam",
            "pa": "Punjabi",
            "ur": "Urdu",
            "as": "Assamese",
            "or": "Odia",
            "sa": "Sanskrit",
            "kok": "Konkani",
            "sd": "Sindhi",
            "ks": "Kashmiri",
        }

    def load_model(self) -> None:
        """
        Loads the Whisper model and processor into memory and initializes the pipeline.
        Falls back gracefully if the path is missing or weights are corrupted.
        """
        logger.info("Initializing Speech Recognizer...")
        
        if self.device.startswith("cuda"):
            logger.info("GPU Detected | Precision: %s", self.torch_dtype)
        else:
            logger.info("CPU Fallback | Precision: %s", self.torch_dtype)

        try:
            logger.info("Loading Whisper processor...")
            self.processor = AutoProcessor.from_pretrained(
                self.model_id,
                cache_dir=self.cache_dir,
            )

            logger.info("Loading Whisper model...")
            
            self.model = AutoModelForSpeechSeq2Seq.from_pretrained(
                self.model_id,
                cache_dir=self.cache_dir,
                torch_dtype=self.torch_dtype,
                low_cpu_mem_usage=True,
                use_safetensors=True
            )
            self.model.to(self.device)
            
            logger.info("Initializing HuggingFace pipeline...")
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=self.model,
                tokenizer=self.processor.tokenizer,
                feature_extractor=self.processor.feature_extractor,
                max_new_tokens=256,
                chunk_length_s=30,
                batch_size=1,
                return_timestamps=True,
                torch_dtype=self.torch_dtype,
                device=self.device,
            )
            logger.info("Model Loaded successfully.")
            
        except Exception as e:
            logger.error("Failed to load the Whisper model. Error: %s", str(e))
            raise RuntimeError("Model loading failed.") from e

    def _validate_audio(self, audio_path: Path) -> AudioMetadata:
        """
        Ensures the audio file exists, is within size and duration limits, 
        and extracts metadata.
        """
        logger.info("Audio Validation Started for: %s", audio_path.name)
        
        if not audio_path.exists():
            logger.error("Audio file not found: %s", audio_path)
            raise FileNotFoundError(f"Audio file not found: {audio_path}")
            
        if not audio_path.is_file():
            logger.error("Path is not a file: %s", audio_path)
            raise ValueError(f"Path is not a file: {audio_path}")
            
        file_size = audio_path.stat().st_size
        if file_size == 0:
            logger.error("Audio file is empty: %s", audio_path)
            raise ValueError(f"Audio file is empty: {audio_path}")
            
        if file_size > MAX_FILE_SIZE_BYTES:
            logger.error("File size %d exceeds 100MB limit", file_size)
            raise ValueError(f"File size exceeds maximum limit of 100MB: {file_size / (1024*1024):.2f}MB")
            
        ext = audio_path.suffix.lower()
        if ext not in SUPPORTED_AUDIO_EXTENSIONS:
            logger.error("Unsupported audio extension: %s", ext)
            raise ValueError(
                f"Unsupported audio extension: {ext}. "
                f"Supported formats are: {', '.join(SUPPORTED_AUDIO_EXTENSIONS)}"
            )

        try:
            if torchaudio is not None:
                info = torchaudio.info(str(audio_path))
                duration = info.num_frames / info.sample_rate if info.sample_rate > 0 else 0.0
                sample_rate = info.sample_rate
                channels = info.num_channels
            else:
                import soundfile as sf
                info = sf.info(str(audio_path))
                duration = info.duration
                sample_rate = info.samplerate
                channels = info.channels
            
            if duration < 0.1:
                logger.error("Audio duration too short: %.2fs", duration)
                raise ValueError(f"Audio duration too short ({duration:.2f}s) to transcribe.")
            if duration > MAX_DURATION_SECONDS:
                logger.error("Audio duration %.2fs exceeds 30 minutes limit", duration)
                raise ValueError(f"Audio duration exceeds 30 minutes limit: {duration / 60:.2f} minutes.")
            
            logger.info("Audio Validation Passed.")
            return AudioMetadata(
                file_name=audio_path.name,
                file_extension=ext,
                file_size_bytes=file_size,
                duration_seconds=round(duration, 2),
                sample_rate=sample_rate,
                channels=channels,
            )
        except Exception as e:
            logger.error("Failed to validate or extract metadata from %s: %s", audio_path, str(e))
            raise ValueError(f"Corrupted or unreadable audio file: {audio_path}") from e

    def _preprocess_audio(self, audio_path: Path, metadata: AudioMetadata) -> np.ndarray:
        """
        Professional audio preprocessing:
        1. Loads audio via torchaudio or librosa fallback
        2. Converts to Mono
        3. Resamples to 16kHz
        4. Normalizes audio
        """
        logger.info("Audio Preprocessing Started.")
        try:
            if torchaudio is not None:
                waveform, sample_rate = torchaudio.load(str(audio_path))
                
                # Convert to Mono
                if waveform.shape[0] > 1:
                    waveform = torch.mean(waveform, dim=0, keepdim=True)
                
                # Resample to 16kHz
                if sample_rate != TARGET_SAMPLE_RATE:
                    resampler = torchaudio.transforms.Resample(orig_freq=sample_rate, new_freq=TARGET_SAMPLE_RATE)
                    waveform = resampler(waveform)
                    
                # Normalize Audio
                max_val = torch.abs(waveform).max()
                if max_val > 0:
                    waveform = waveform / max_val
                    
                logger.info("Audio Preprocessing Completed.")
                return waveform.squeeze().numpy()
            else:
                import librosa
                waveform, sr = librosa.load(str(audio_path), sr=TARGET_SAMPLE_RATE)
                logger.info("Audio Preprocessing Completed via librosa fallback.")
                return waveform
                
        except Exception as e:
            logger.error("Audio Preprocessing failed for %s: %s", audio_path, str(e))
            raise RuntimeError("Audio preprocessing failed.") from e

    def process_audio(self, audio_path: Path) -> TranscriptResult:
        """
        End-to-end processing of a single audio file.
        Extracts metadata, performs preprocessing, inference, and structures the result.
        """
        if self.pipe is None:
            raise RuntimeError("Pipeline is not initialized. Call load_model() first.")

        start_time = time.time()
        metadata = self._validate_audio(audio_path)
        audio_array = self._preprocess_audio(audio_path, metadata)

        logger.info("Inference Started for: %s", audio_path.name)
        try:
            result = self.pipe(
                audio_array,
                generate_kwargs={"task": "transcribe"},
                return_timestamps=True,
                return_language=True
            )
            logger.info("Inference Completed.")
            
            # Extract transcript text
            transcript_text = result.get("text", "").strip()
            
            # Extract timestamps
            segments = []
            if "chunks" in result:
                for chunk in result["chunks"]:
                    timestamp = chunk.get("timestamp", (0.0, 0.0))
                    start = timestamp[0] if timestamp[0] is not None else 0.0
                    end = timestamp[1] if timestamp[1] is not None else start
                    segments.append(
                        TranscriptSegment(
                            start=round(float(start), 2),
                            end=round(float(end), 2),
                            text=chunk.get("text", "").strip()
                        )
                    )
            
            # Extract Language
            language_code = None
            if "language" in result:
                language_code = result["language"]
                
            language = self.lang_code_to_name.get(language_code, "Unknown")
            if language == "Unknown" and language_code is not None:
                language = language_code.capitalize()
                
            logger.info("Language Detection: %s", language)

            processing_time = round(time.time() - start_time, 2)
            logger.info(
                "Execution Time: %.2fs for %.2fs of audio.",
                processing_time, metadata.duration_seconds
            )

            return TranscriptResult(
                transcript_id=str(uuid.uuid4()),
                file_name=metadata.file_name,
                language=language,
                language_code=language_code,
                processing_device=self.device.upper(),
                model_name=self.model_name,
                transcript=transcript_text,
                segments=segments,
                audio_metadata=asdict(metadata),
                processing_time=processing_time,
                timestamp=datetime.utcnow().isoformat() + "Z",
            )

        except Exception as e:
            logger.error("Transcription inference failed for %s: %s", audio_path.name, str(e))
            raise RuntimeError("Speech recognition inference failure.") from e

    def save_transcript(self, result: TranscriptResult) -> Path:
        """
        Saves the structured transcription result to a JSON file.
        Uses a unique identifier to prevent overwriting previous files.
        """
        output_filename = f"{result.file_name}_{result.transcript_id}.json"
        output_path = self.output_dir / output_filename

        self.output_dir.mkdir(parents=True, exist_ok=True)

        try:
            def _custom_serializer(obj):
                if isinstance(obj, TranscriptSegment):
                    return asdict(obj)
                raise TypeError(f"Type {type(obj)} not serializable")
                
            result_dict = asdict(result)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result_dict, f, ensure_ascii=False, indent=4, default=_custom_serializer)
                
            logger.info("Transcript Saved: %s", output_path)
            return output_path
        except Exception as e:
            logger.error("Failed to save transcript to %s: %s", output_path, str(e))
            raise IOError("Could not write transcript JSON to disk.") from e

    def transcribe_file(self, file_path: str) -> Path:
        """
        Convenience method to process an audio file and save its transcript in one go.
        """
        path = Path(file_path).resolve()
        result = self.process_audio(path)
        saved_path = self.save_transcript(result)
        return saved_path


class SpeechEngine(BaseAIEngine):
    """
    Standardized wrapper for the SpeechRecognizer.
    """
    def __init__(self):
        self._recognizer = SpeechRecognizer()
        self._is_loaded = False
        self._last_warmup = None

    def load(self) -> None:
        if not self._is_loaded:
            self._recognizer.load_model()
            self._is_loaded = True

    def reload(self) -> None:
        self.shutdown()
        self.load()

    def shutdown(self) -> None:
        if self._is_loaded:
            self._recognizer.model = None
            self._recognizer.processor = None
            self._recognizer.pipe = None
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            self._is_loaded = False

    def warmup(self) -> None:
        if not self._is_loaded:
            raise RuntimeError("Cannot warmup SpeechEngine before loading.")
        # Minimal warmup: Just a tiny dummy array to prime CUDA
        try:
            dummy_audio = np.zeros(16000, dtype=np.float32)
            self._recognizer.pipe(dummy_audio, generate_kwargs={"language": "english"})
            self._last_warmup = time.time()
        except Exception as e:
            raise RuntimeError(f"Speech warmup failed: {e}")

    def is_loaded(self) -> bool:
        return self._is_loaded

    def health(self) -> Dict[str, Any]:
        return {
            "is_loaded": self._is_loaded,
            "device": self._recognizer.device,
            "model_version": "whisper-large-v3",
            "dataset_version": "N/A",
            "training_quality_r2": 0.0,
            "last_warmup_timestamp": self._last_warmup
        }

    def metadata(self) -> Dict[str, Any]:
        return {
            "model_id": self._recognizer.model_id,
            "device": self._recognizer.device
        }

    def transcribe(self, audio_path: str) -> TranscriptResult:
        if not self._is_loaded:
            self.load()
        return self._recognizer.process_audio(Path(audio_path))
