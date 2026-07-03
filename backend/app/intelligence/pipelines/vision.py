"""
AarogyaOne — Vision Pipeline
=========================================================================
Image processing and visual evidence extraction pipeline that:
  1. Validates and preprocesses incoming grievance images
  2. Loads Grounding DINO Base and Florence-2 Large
  3. Uses CUDA for hardware acceleration with float16 if available
  4. Automatically downloads models to the configured cache
  5. Extracts bounding boxes, OCR, and scene understanding
  6. Evaluates risk levels using rule-based logic
  7. Saves structured JSON and annotated images

This module is exclusively for visual evidence extraction.
Routing and workflow operations are delegated to other modules.
"""

from __future__ import annotations

import os
from unittest.mock import patch
import json
import logging
import sys
import time
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import torch
from PIL import Image, ImageDraw, ImageFont, UnidentifiedImageError

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("aarogya.vision_pipeline")

# ── Path configuration ─────────────────────────────────────────────────────
_FILE_DIR = Path(__file__).resolve().parent
if str(_FILE_DIR) not in sys.path:
    sys.path.insert(0, str(_FILE_DIR))

try:
    from config import (
        GROUNDING_DINO_MODEL_ID,
        FLORENCE_MODEL_ID,
        VISION_CACHE_DIR,
        VISION_RESULTS_DIR,
        IMAGES_DIR,
        SUPPORTED_IMAGE_FORMATS,
        CONFIDENCE_THRESHOLD,
        TEXT_CONFIDENCE_THRESHOLD,
        MAX_IMAGE_SIZE_MB,
        MAX_IMAGE_DIMENSION,
        VISION_DEVICE
    )
except ImportError as e:
    logger.error("Failed to import configuration: %s", str(e))
    raise RuntimeError("Configuration missing. Check config.py.") from e

# ── Lazy imports (heavy) ───────────────────────────────────────────────────
from transformers import (
    AutoModelForCausalLM,
    AutoModelForZeroShotObjectDetection,
    AutoProcessor,
)

from transformers.dynamic_module_utils import get_imports



def fixed_get_imports(filename: str | os.PathLike) -> list[str]:
    """
    Removes the unnecessary flash_attn dependency check
    from Florence-2's dynamic module loading.
    """

    imports = get_imports(filename)

    if str(filename).endswith("modeling_florence2.py"):
        imports = [imp for imp in imports if imp != "flash_attn"]

    return imports

# ════════════════════════════════════════════════════════════════════════════
#  SECTION 1 — DATACLASSES
# ════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class ImageMetadata:
    """Metadata extracted from the source image."""
    file_name: str
    file_extension: str
    file_size_bytes: int
    width: int
    height: int
    mode: str

@dataclass(frozen=True)
class DetectedObject:
    """A detected object with bounding box, confidence, and assessed risk level."""
    label: str
    confidence: float
    box: List[float]  # [xmin, ymin, xmax, ymax]
    risk_level: str

@dataclass(frozen=True)
class VisionResult:
    """Structured output containing extracted evidence and metadata."""
    image_id: str
    timestamp: str
    processing_device: str
    processing_time: float
    model_versions: List[str]
    image_metadata: Dict[str, Any]
    objects: List[DetectedObject]
    caption: str
    scene_summary: str
    ocr_text: str
    ocr_category: str
    evidence_summary: str
    risk_level: str
    overall_confidence: float
    annotated_image_path: Optional[str]


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 2 — VISION ENGINE
# ════════════════════════════════════════════════════════════════════════════

class VisionEngine:
    """
    Computer Vision evidence extraction engine.
    Uses Grounding DINO for object detection and Florence-2 for captioning/OCR.
    """

    def __init__(self, cache_dir: Path = VISION_CACHE_DIR, output_dir: Path = VISION_RESULTS_DIR):
        """
        Initializes the VisionEngine. Does not load the models immediately.
        Call `load_models()` to allocate weights to GPU/CPU.
        """
        self.cache_dir = cache_dir
        self.output_dir = output_dir
        
        self.device = VISION_DEVICE
        self.torch_dtype = torch.float16 if "cuda" in self.device else torch.float32
            
        # Model instances
        self.dino_model = None
        self.dino_processor = None
        self.florence_model = None
        self.florence_processor = None
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        
        # Comprehensive detection prompt for healthcare environment
        self.detection_prompt = (
            "doctor . nurse . patient . visitor . hospital bed . wheelchair . stretcher . ICU bed . "
            "operation theatre . emergency ward . OPD . reception . registration desk . medicine counter . "
            "pharmacy . laboratory . X-ray machine . MRI machine . CT scanner . ultrasound machine . "
            "ventilator . oxygen cylinder . IV stand . glucose bottle . saline . syringe . medical equipment . "
            "biomedical waste . medical waste . garbage . overflowing garbage . dustbin . dirty floor . "
            "wet floor . water leakage . flooded floor . broken ceiling . broken wall . broken door . "
            "broken window . broken tiles . collapsed ceiling . construction debris . fire . smoke . "
            "fire extinguisher . fire alarm . electrical panel . generator . open drain . mosquito breeding . "
            "dog . cow . rat . cat . prescription . medicine strip . medicine bottle . medical report . "
            "patient file . identity card . hospital notice . warning board . sign board . department board . "
            "mask . gloves . PPE . wheelchair ramp . emergency exit . queue . crowd . waiting area . "
            "ambulance . hospital corridor . hospital entrance . hospital exit"
        )

    def load_models(self) -> None:
        """
        Loads Florence-2 and Grounding DINO into memory.
        Models are loaded ONLY ONCE. Subsequent calls are ignored.
        """
        if self.dino_model is not None and self.florence_model is not None:
            logger.info("Models already loaded. Skipping initialization.")
            return
            
        logger.info("Initializing Vision Engine...")
        if "cuda" in self.device:
            logger.info("GPU Detected | Precision: %s", self.torch_dtype)
        else:
            logger.info("CPU Fallback | Precision: %s", self.torch_dtype)

        try:
            logger.info("Downloading/Loading Grounding DINO (%s)...", GROUNDING_DINO_MODEL_ID)
            self.dino_processor = AutoProcessor.from_pretrained(
                GROUNDING_DINO_MODEL_ID, cache_dir=str(self.cache_dir)
            )
            self.dino_model = AutoModelForZeroShotObjectDetection.from_pretrained(
                GROUNDING_DINO_MODEL_ID, cache_dir=str(self.cache_dir)
            ).to(self.device)
            self.dino_model.eval()
            
            logger.info("Downloading/Loading Florence-2 (%s)...", FLORENCE_MODEL_ID)

            with patch(
                "transformers.dynamic_module_utils.get_imports",
                fixed_get_imports,
            ):
                self.florence_processor = AutoProcessor.from_pretrained(
                    FLORENCE_MODEL_ID,
                    trust_remote_code=True,
                    cache_dir=str(self.cache_dir),
                )

                self.florence_model = AutoModelForCausalLM.from_pretrained(
                    FLORENCE_MODEL_ID,
                    trust_remote_code=True,
                    cache_dir=str(self.cache_dir),
                    torch_dtype=self.torch_dtype,
                    attn_implementation="sdpa",
                ).to(self.device)

            self.florence_model.eval()
                        
            logger.info("All vision models loaded successfully.")
        except Exception as e:
            logger.error("Failed to load vision models: %s", str(e))
            raise RuntimeError("Vision model loading failed.") from e

    def _validate_image(self, image_path: Path) -> Tuple[Image.Image, ImageMetadata]:
        """
        Ensures the image file exists, is within size limits, has a supported extension,
        and is fully readable.
        """
        logger.info("Image Validation Started for: %s", image_path.name)
        
        if not image_path.exists():
            logger.error("Image file not found: %s", image_path)
            raise FileNotFoundError(f"Image file not found: {image_path}")
            
        if not image_path.is_file():
            logger.error("Path is not a file: %s", image_path)
            raise ValueError(f"Path is not a file: {image_path}")
            
        file_size = image_path.stat().st_size
        if file_size == 0:
            logger.error("Image file is empty: %s", image_path)
            raise ValueError(f"Image file is empty: {image_path}")
            
        max_size_bytes = MAX_IMAGE_SIZE_MB * 1024 * 1024
        if file_size > max_size_bytes:
            logger.error("File size %d exceeds %dMB limit", file_size, MAX_IMAGE_SIZE_MB)
            raise ValueError(f"File size {file_size} exceeds {MAX_IMAGE_SIZE_MB}MB limit.")
            
        ext = image_path.suffix.lower()
        if ext not in SUPPORTED_IMAGE_FORMATS:
            logger.error("Unsupported image extension: %s", ext)
            raise ValueError(f"Unsupported image extension: {ext}")
            
        try:
            image = Image.open(image_path)
            image.verify()  # Ensure image is not truncated or corrupted
            
            # Re-open after verify to be able to load pixels
            image = Image.open(image_path).convert("RGB")
            width, height = image.size
            if width == 0 or height == 0:
                logger.error("Invalid image dimensions: %dx%d", width, height)
                raise ValueError(f"Invalid image dimensions: {width}x{height}")
                
            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                logger.error("Image dimensions (%dx%d) exceed maximum %d.", width, height, MAX_IMAGE_DIMENSION)
                raise ValueError(f"Image dimensions ({width}x{height}) exceed maximum {MAX_IMAGE_DIMENSION}px.")
                
            metadata = ImageMetadata(
                file_name=image_path.name,
                file_extension=ext,
                file_size_bytes=file_size,
                width=width,
                height=height,
                mode=image.mode
            )
            logger.info("Image Validation Passed.")
            return image, metadata
            
        except UnidentifiedImageError as e:
            logger.error("Corrupted or unreadable image file: %s", image_path)
            raise ValueError(f"Corrupted or unreadable image file: {image_path}") from e
        except ValueError as e:
            raise e
        except Exception as e:
            logger.error("Image validation failed for %s: %s", image_path, str(e))
            raise ValueError(f"Image validation failed: {image_path}") from e

    def _evaluate_object_risk(self, label: str) -> str:
        """Assigns a risk level to individual detected objects."""
        label = label.lower()
        critical_items = ["fire", "blood", "smoke", "accident", "casualty", "unconscious"]
        high_items = [
            "doctor absent", "bleeding", "broken", "medical waste", "biohazard", 
            "syringe", "fight", "assault"
        ]
        medium_items = [
            "garbage", "trash", "overflowing", "dirty", "water leakage", "leak", 
            "queue", "crowd", "damage", "spill", "debris"
        ]
        
        for item in critical_items:
            if item in label:
                return "Critical"
        for item in high_items:
            if item in label:
                return "High"
        for item in medium_items:
            if item in label:
                return "Medium"
        return "Low"

    def _infer_overall_risk(self, detected_objects: List[DetectedObject], text_context: str) -> str:
        """
        Rule-based logic to evaluate the overall risk level of the grievance.
        Supports combination patterns for more accurate severity detection.
        """
        text_context = text_context.lower()
        labels = " ".join([obj.label.lower() for obj in detected_objects])
        full_context = text_context + " " + labels
        
        has_fire = "fire" in full_context
        has_smoke = "smoke" in full_context
        has_people = "person" in full_context or "people" in full_context
        has_crowd = "crowd" in full_context or "overcrowd" in full_context
        has_oxygen = "oxygen cylinder" in full_context
        has_water = "water leak" in full_context or "leakage" in full_context or "flooded" in full_context
        has_electrical = "electrical panel" in full_context or "generator" in full_context
        has_bio_waste = "biomedical waste" in full_context or "medical waste" in full_context or "biohazard" in full_context
        has_patient = "patient" in full_context
        has_garbage = "garbage" in full_context or "trash" in full_context or "dustbin" in full_context
        has_bed = "hospital bed" in full_context or "icu bed" in full_context or "stretcher" in full_context
        has_broken_equip = "broken equipment" in full_context or "damaged equipment" in full_context
        has_doctor_absent = "doctor absent" in full_context or "no doctor" in full_context
        has_waiting_area = "waiting area" in full_context or "reception" in full_context
        has_broken_infra = "broken wall" in full_context or "broken ceiling" in full_context or "broken door" in full_context
        has_blood = "blood" in full_context
        
        # High-severity combinations
        if (has_fire and has_people) or (has_smoke and has_crowd) or (has_fire and has_oxygen) or (has_water and has_electrical) or has_blood:
            return "Critical"
            
        if (has_bio_waste and has_patient) or (has_garbage and has_bed) or (has_garbage and has_patient) or \
           (has_broken_equip and has_patient) or (has_doctor_absent and has_crowd):
            return "High"
            
        if (has_crowd and has_waiting_area) or has_water or has_garbage or has_broken_infra:
            return "Medium"
            
        return "Low"

    def _categorize_ocr(self, ocr_text: str) -> str:
        """Categorizes extracted text based on keywords."""
        text = ocr_text.lower()
        if not text.strip():
            return "None"
            
        if "mg" in text or "ml" in text or "tablet" in text or "syrup" in text or "mfg" in text or "exp" in text:
            return "Medicine Label"
        if "inventory" in text or "stock" in text or "batch" in text:
            return "Medicine Inventory"
        if "rx" in text or "dr." in text or "prescription" in text or "diagnosis" in text:
            return "Prescription"
        if "report" in text or "test" in text or "scan" in text or "pathology" in text:
            return "Medical Report"
        if "patient name" in text or "age" in text or "gender" in text or "ward no" in text:
            return "Patient Record"
        if "notice" in text or "order" in text or "circular" in text or "attention" in text:
            return "Hospital Notice"
        if "gov" in text or "department of health" in text or "ministry" in text or "government" in text:
            return "Government Notice"
        if "department" in text or "ward" in text or "icu" in text or "opd" in text or "operation theatre" in text:
            return "Department Name"
        if "emergency" in text or "exit" in text or "casualty" in text:
            return "Emergency Sign"
        if "danger" in text or "warning" in text or "caution" in text or "fire" in text or "biohazard" in text:
            return "Safety Sign"
        if "id" in text or "card" in text or "staff" in text or "name:" in text or "dob:" in text:
            return "Identity Card"
        if "registration" in text or "form" in text or "admit" in text:
            return "Registration Form"
        if "lab" in text or "result" in text or "blood" in text or "urine" in text:
            return "Laboratory Report"
            
        return "Unknown"

    def _calculate_overall_confidence(
        self, 
        dino_confidences: List[float], 
        has_ocr: bool, 
        scene_summary: str,
        caption: str
    ) -> float:
        """
        Calculates an evidence confidence score factoring in multiple dimensions.
        """
        base_conf = 0.4
        
        if dino_confidences:
            avg_dino = sum(dino_confidences) / len(dino_confidences)
            base_conf += (avg_dino * 0.3)
            
        if has_ocr:
            base_conf += 0.1
            
        if len(caption) > 10 and len(scene_summary) > 20:
            base_conf += 0.1
            
        if len(dino_confidences) > 3:
            base_conf += 0.1
            
        return round(min(1.0, max(0.0, base_conf)), 4)

    def _generate_evidence_summary(
        self, 
        detected_objects: List[DetectedObject], 
        caption: str, 
        scene_summary: str, 
        ocr_category: str, 
        risk_level: str
    ) -> str:
        """Combines multiple streams of evidence into a concise human-readable summary."""
        labels = list(set([obj.label for obj in detected_objects]))
        
        summary_parts = []
        if caption:
            summary_parts.append(f"The image shows {caption}.")
        elif scene_summary:
            summary_parts.append(f"The scene indicates {scene_summary}.")
            
        if labels:
            summary_parts.append(f"Detected objects include {', '.join(labels[:5])}.")
            
        if ocr_category not in ["None", "Unknown"]:
            summary_parts.append(f"OCR detected a {ocr_category}.")
            
        summary_parts.append(f"Overall risk assessed as {risk_level.upper()}.")
        
        return " ".join(summary_parts)

    def _run_florence_task(self, image: Image.Image, task_prompt: str) -> str:
        """Executes a specific Florence-2 task on the image."""
        if self.florence_processor is None or self.florence_model is None:
            raise RuntimeError("Florence models not loaded.")
            
        inputs = self.florence_processor(text=task_prompt, images=image, return_tensors="pt")
        inputs = {k: v.to(self.device, self.torch_dtype if torch.is_floating_point(v) else None) for k, v in inputs.items()}
        
        with torch.inference_mode():
            generated_ids = self.florence_model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=1024,
                num_beams=3
            )
            
        generated_text = self.florence_processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
        parsed_answer = self.florence_processor.post_process_generation(
            generated_text, task=task_prompt, image_size=(image.width, image.height)
        )
        
        answer = parsed_answer.get(task_prompt, "")
        if isinstance(answer, str):
            return answer
        return str(answer)
        
    def _get_color_for_risk(self, risk_level: str) -> str:
        """Returns visualization color based on risk severity."""
        mapping = {
            "Critical": "#FF0000", # Red
            "High": "#FFA500",     # Orange
            "Medium": "#FFFF00",   # Yellow
            "Low": "#00FF00"       # Green
        }
        return mapping.get(risk_level, "#FFFFFF")

    def process_image(self, image_path: Path, annotate: bool = True) -> VisionResult:
        """
        Complete processing pipeline for a single image.
        Extracts evidence using both models and aggregates the results.
        """
        
        image_path = Path(image_path)
        if self.dino_model is None or self.florence_model is None:
            raise RuntimeError("Models are not initialized. Call load_models() first.")

        start_time = time.time()
        image, metadata = self._validate_image(image_path)
        
        logger.info("Inference Started for: %s", image_path.name)
        image_id = str(uuid.uuid4())
        
        try:
            # 1. Grounding DINO: Detect critical operational and healthcare objects
            dino_inputs = self.dino_processor(images=image, text=self.detection_prompt, return_tensors="pt").to(self.device)
            
            with torch.inference_mode():
                dino_outputs = self.dino_model(**dino_inputs)
                
            dino_results = self.dino_processor.post_process_grounded_object_detection(
                dino_outputs,
                dino_inputs.input_ids,
                box_threshold=CONFIDENCE_THRESHOLD,
                text_threshold=TEXT_CONFIDENCE_THRESHOLD,
                target_sizes=[image.size[::-1]]
            )[0]
            
            detected_objects = []
            scores = dino_results["scores"].cpu().tolist()
            labels = dino_results["labels"]
            boxes = dino_results["boxes"].cpu().tolist()
            
            for score, label, box in zip(scores, labels, boxes):
                obj_risk = self._evaluate_object_risk(label)
                detected_objects.append(
                    DetectedObject(
                        label=label,
                        confidence=round(score, 4),
                        box=[round(c, 2) for c in box],
                        risk_level=obj_risk
                    )
                )

            # 2. Florence-2: Execute multiple vision tasks
            caption = self._run_florence_task(image, "<CAPTION>")
            scene_summary = self._run_florence_task(image, "<MORE_DETAILED_CAPTION>")
            ocr_text = self._run_florence_task(image, "<OCR>")
            
            # Enhancements
            ocr_category = self._categorize_ocr(ocr_text)
            overall_risk = self._infer_overall_risk(detected_objects, scene_summary + " " + caption)
            overall_confidence = self._calculate_overall_confidence(
                [obj.confidence for obj in detected_objects],
                bool(ocr_text.strip()),
                scene_summary,
                caption
            )
            evidence_summary = self._generate_evidence_summary(
                detected_objects, caption, scene_summary, ocr_category, overall_risk
            )
            
            logger.info(
                "Inference completed | Objects=%d | OCR Length=%d | Risk=%s | Confidence=%.2f", 
                len(detected_objects),
                len(ocr_text),
                overall_risk,
                overall_confidence,
            )
            processing_time = round(time.time() - start_time, 2)
            
            # Annotate Image
            annotated_path_str = None
            if annotate and detected_objects:
                annotated_img = image.copy()
                draw = ImageDraw.Draw(annotated_img)
                
                # Sort objects to avoid overlapping text prioritizing higher confidence
                detected_objects.sort(key=lambda x: x.confidence, reverse=True)
                
                for obj in detected_objects:
                    color = self._get_color_for_risk(obj.risk_level)
                    draw.rectangle(obj.box, outline=color, width=4)
                    
                    text_content = f"{obj.label} ({obj.confidence:.2f}) [{obj.risk_level}]"
                    text_x, text_y = obj.box[0], max(0, obj.box[1] - 15)
                    
                    try:
                        font = ImageFont.truetype("arial.ttf", 18)
                    except OSError:
                        font = ImageFont.load_default()

                    draw.text((text_x + 1, text_y + 1), text_content, fill="black", font=font)
                    draw.text((text_x - 1, text_y - 1), text_content, fill="black", font=font)
                    draw.text((text_x, text_y), text_content, fill=color, font=font)
                                    
                annotated_path = self.output_dir / f"{metadata.file_name}_{image_id}_annotated.jpg"
                annotated_img.save(annotated_path, "JPEG")
                annotated_path_str = str(annotated_path)
                logger.info("Saved annotated image to %s", annotated_path)
                
            logger.info("Processing Duration: %.2fs", processing_time)

            return VisionResult(
                image_id=image_id,
                timestamp=datetime.utcnow().isoformat() + "Z",
                processing_device=(
                    f"CUDA:{torch.cuda.current_device()}"
                    if torch.cuda.is_available()
                    else "CPU"
                ),
                processing_time=processing_time,
                model_versions=[GROUNDING_DINO_MODEL_ID, FLORENCE_MODEL_ID],
                image_metadata=asdict(metadata),
                objects=detected_objects,
                caption=caption,
                scene_summary=scene_summary,
                ocr_text=ocr_text,
                ocr_category=ocr_category,
                evidence_summary=evidence_summary,
                risk_level=overall_risk,
                overall_confidence=overall_confidence,
                annotated_image_path=annotated_path_str
            )
            
        except Exception as e:
            logger.error("Vision inference failed for %s: %s", image_path.name, str(e))
            raise RuntimeError("Vision inference failure.") from e

    def save_result(self, result: VisionResult) -> Path:
        """Saves the structured JSON output to disk."""
        output_filename = (
            f"{result.image_metadata['file_name']}_{result.image_id}.json"
        )
        output_path = self.output_dir / output_filename
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            def _custom_serializer(obj):
                if isinstance(obj, DetectedObject):
                    return asdict(obj)
                raise TypeError(f"Type {type(obj)} not serializable")
                
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(asdict(result), f, ensure_ascii=False, indent=4, default=_custom_serializer)
                
            logger.info("Vision JSON saved successfully to %s", output_path)
            return output_path
        except Exception as e:
            logger.error("Failed to save JSON to %s: %s", output_path, str(e))
            raise IOError("Could not write vision JSON to disk.") from e

    def extract_evidence(self, file_path: str, annotate: bool = True) -> Path:
        """
        Convenience method to process an image and save the results.
        """
        path = Path(file_path).resolve()
        result = self.process_image(path, annotate=annotate)
        saved_path = self.save_result(result)
        return saved_path
