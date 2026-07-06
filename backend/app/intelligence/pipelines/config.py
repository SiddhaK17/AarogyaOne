"""
AarogyaOne NLP Pipeline — Configuration
========================================
Central configuration for model training, dataset generation, and inference.
All paths, hyperparameters, category definitions, and routing rules live here.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional
import torch

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------

_INTELLIGENCE_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = Path(__file__).resolve().parents[4]

AI_MODELS_DIR = PROJECT_ROOT / "ai_models"
TRAINED_MODELS_DIR = AI_MODELS_DIR / "trained_models"

_STORE_ROOT = _INTELLIGENCE_ROOT / "store"

WEIGHTS_DIR = _STORE_ROOT / "weights"
DATASETS_DIR = _STORE_ROOT / "datasets"
RESULTS_DIR = _STORE_ROOT / "results"
LOGS_DIR = _STORE_ROOT / "logs"

BASE_MODEL_DIR = WEIGHTS_DIR / "indic-bert-base"
FINETUNED_MODEL_DIR = WEIGHTS_DIR / "aarogya-grievance-classifier"

GENERATED_DATASET_PATH = DATASETS_DIR / "grievances_v1.json"
LABEL_ENCODER_PATH = FINETUNED_MODEL_DIR / "label_encoder.json"
TRAINING_STATS_PATH = RESULTS_DIR / "training_statistics.json"
CONFUSION_MATRIX_PATH = RESULTS_DIR / "confusion_matrix.png"
CLASSIFICATION_REPORT_PATH = RESULTS_DIR / "classification_report.json"
LOSS_CURVES_PATH = RESULTS_DIR / "loss_curves.png"

for _d in (WEIGHTS_DIR, DATASETS_DIR, RESULTS_DIR, LOGS_DIR, FINETUNED_MODEL_DIR):
    _d.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Grievance categories
# ---------------------------------------------------------------------------

class GrievanceCategory(str, Enum):
    """Operational grievance categories for Indian public healthcare facilities."""
    INFRASTRUCTURE = "Infrastructure"
    MEDICINE_STOCK = "Medicine Stock"
    MEDICAL_EQUIPMENT = "Medical Equipment"
    DOCTOR_AVAILABILITY = "Doctor Availability"
    NURSE_BEHAVIOUR = "Nurse Behaviour"
    HOSPITAL_STAFF = "Hospital Staff"
    CLEANLINESS = "Cleanliness"
    ELECTRICITY = "Electricity"
    WATER_SUPPLY = "Water Supply"
    AMBULANCE = "Ambulance"
    BLOOD_BANK = "Blood Bank"
    LABORATORY = "Laboratory"
    RADIOLOGY = "Radiology"
    PHARMACY = "Pharmacy"
    OPERATION_THEATRE = "Operation Theatre"
    EMERGENCY_SERVICES = "Emergency Services"
    BILLING = "Billing"
    GOVERNMENT_SCHEMES = "Government Schemes"
    APPOINTMENT = "Appointment"
    GENERAL_INQUIRY = "General Inquiry"
    MEDICAL_NEGLIGENCE = "Medical Negligence"
    PATIENT_SAFETY = "Patient Safety"
    SECURITY = "Security"
    SANITATION = "Sanitation"
    IT_SYSTEMS = "IT Systems"
    POWER_BACKUP = "Power Backup"
    QUEUE_MANAGEMENT = "Queue Management"
    ACCESSIBILITY = "Accessibility"
    WASTE_DISPOSAL = "Waste Disposal"
    OTHER = "Other"


CATEGORY_LIST: List[str] = [c.value for c in GrievanceCategory]
NUM_LABELS: int = len(CATEGORY_LIST)


# ---------------------------------------------------------------------------
# Portal routing rules
# ---------------------------------------------------------------------------

CATEGORY_PORTAL_MAP: Dict[str, str] = {
    "Infrastructure": "PWD_PORTAL",
    "Medicine Stock": "MEDICAL_STORES_PORTAL",
    "Medical Equipment": "BIOMEDICAL_ENGINEERING_PORTAL",
    "Doctor Availability": "DISTRICT_COMMAND_CENTER",
    "Nurse Behaviour": "NURSING_DIRECTORATE_PORTAL",
    "Hospital Staff": "HR_ADMIN_PORTAL",
    "Cleanliness": "SANITATION_DEPARTMENT_PORTAL",
    "Electricity": "STATE_ELECTRICITY_BOARD_PORTAL",
    "Water Supply": "JALNIGAM_PORTAL",
    "Ambulance": "EMERGENCY_MEDICAL_SERVICES_PORTAL",
    "Blood Bank": "BLOOD_TRANSFUSION_COUNCIL_PORTAL",
    "Laboratory": "PATHOLOGY_DEPARTMENT_PORTAL",
    "Radiology": "RADIOLOGY_DEPARTMENT_PORTAL",
    "Pharmacy": "PHARMACY_COUNCIL_PORTAL",
    "Operation Theatre": "SURGERY_DEPARTMENT_PORTAL",
    "Emergency Services": "EMERGENCY_MEDICAL_SERVICES_PORTAL",
    "Billing": "ACCOUNTS_DEPARTMENT_PORTAL",
    "Government Schemes": "SCHEME_MANAGEMENT_PORTAL",
    "Appointment": "OPD_MANAGEMENT_PORTAL",
    "General Inquiry": "HELPDESK_PORTAL",
    "Medical Negligence": "MEDICAL_COUNCIL_PORTAL",
    "Patient Safety": "PATIENT_SAFETY_CELL_PORTAL",
    "Security": "SECURITY_DIVISION_PORTAL",
    "Sanitation": "SANITATION_DEPARTMENT_PORTAL",
    "IT Systems": "IT_DEPARTMENT_PORTAL",
    "Power Backup": "STATE_ELECTRICITY_BOARD_PORTAL",
    "Queue Management": "OPD_MANAGEMENT_PORTAL",
    "Accessibility": "DISABILITY_COMMISSION_PORTAL",
    "Waste Disposal": "BIOMEDICAL_WASTE_MANAGEMENT_PORTAL",
    "Other": "HELPDESK_PORTAL",
}

CATEGORY_DEPARTMENT_MAP: Dict[str, str] = {
    "Infrastructure": "Public Works Department",
    "Medicine Stock": "Central Medical Stores",
    "Medical Equipment": "Biomedical Engineering Division",
    "Doctor Availability": "District Health Office",
    "Nurse Behaviour": "Directorate of Nursing",
    "Hospital Staff": "Human Resources & Administration",
    "Cleanliness": "Hospital Sanitation Wing",
    "Electricity": "State Electricity Board Liaison",
    "Water Supply": "Jal Nigam / Municipal Water Supply",
    "Ambulance": "Emergency Medical Services (108/102)",
    "Blood Bank": "State Blood Transfusion Council",
    "Laboratory": "Pathology & Diagnostics Department",
    "Radiology": "Radiology & Imaging Department",
    "Pharmacy": "Hospital Pharmacy Division",
    "Operation Theatre": "Surgery & Anaesthesia Department",
    "Emergency Services": "Emergency & Trauma Division",
    "Billing": "Accounts & Finance Department",
    "Government Schemes": "Scheme Implementation Cell",
    "Appointment": "OPD Registration & Scheduling",
    "General Inquiry": "Public Relations & Helpdesk",
    "Medical Negligence": "State Medical Council / Ethics Committee",
    "Patient Safety": "Patient Safety & Quality Cell",
    "Security": "Hospital Security Division",
    "Sanitation": "Sanitation & Hygiene Department",
    "IT Systems": "Health IT & Informatics Division",
    "Power Backup": "Electrical & Maintenance Wing",
    "Queue Management": "OPD Management & Token System",
    "Accessibility": "Disability Services & Accessibility Cell",
    "Waste Disposal": "Biomedical Waste Management Cell",
    "Other": "General Administration",
}

SEVERITY_RESPONSE_MAP: Dict[str, str] = {
    "Critical": "1 hour",
    "High": "4 hours",
    "Medium": "24 hours",
    "Low": "72 hours",
}


# ---------------------------------------------------------------------------
# Supported languages
# ---------------------------------------------------------------------------

class Language(str, Enum):
    ENGLISH = "English"
    HINDI = "Hindi"
    MARATHI = "Marathi"
    GUJARATI = "Gujarati"
    PUNJABI = "Punjabi"
    BENGALI = "Bengali"
    TAMIL = "Tamil"
    TELUGU = "Telugu"
    KANNADA = "Kannada"
    MALAYALAM = "Malayalam"
    ODIA = "Odia"
    ASSAMESE = "Assamese"
    URDU = "Urdu"
    KONKANI = "Konkani"
    SINDHI = "Sindhi"
    MANIPURI = "Manipuri"
    BODO = "Bodo"
    DOGRI = "Dogri"
    KASHMIRI = "Kashmiri"
    SANSKRIT = "Sanskrit"


LANGUAGE_LIST: List[str] = [lang.value for lang in Language]


# ---------------------------------------------------------------------------
# Training hyperparameters
# ---------------------------------------------------------------------------

@dataclass
class TrainingConfig:
    """All hyperparameters and settings for the training pipeline."""

    # Model
    base_model_path: str = str(BASE_MODEL_DIR)
    output_dir: str = str(FINETUNED_MODEL_DIR)
    num_labels: int = NUM_LABELS

    # Dataset
    dataset_path: str = str(GENERATED_DATASET_PATH)
    num_samples: int = 100_000
    validation_split: float = 0.15
    max_seq_length: int = 128
    seed: int = 42

    # Training
    num_epochs: int = 6
    train_batch_size: int = 64
    eval_batch_size: int = 128
    learning_rate: float = 3e-5
    weight_decay: float = 0.01
    warmup_ratio: float = 0.1
    max_grad_norm: float = 1.0
    fp16: bool = True
    gradient_accumulation_steps: int = 1
    dataloader_num_workers: int = 4

    # Early stopping
    early_stopping_patience: int = 3
    early_stopping_threshold: float = 0.001
    metric_for_best_model: str = "f1_weighted"
    greater_is_better: bool = True

    # Logging
    logging_steps: int = 100
    eval_steps: int = 500
    save_steps: int = 500
    save_total_limit: int = 2
    log_level: str = "info"
    report_to: str = "none"

    # Results
    results_dir: str = str(RESULTS_DIR)
    logs_dir: str = str(LOGS_DIR)


@dataclass
class DatasetGeneratorConfig:
    """Configuration for the synthetic dataset generator."""
    num_samples: int = 100_000
    output_path: str = str(GENERATED_DATASET_PATH)
    languages: List[str] = field(default_factory=lambda: LANGUAGE_LIST)
    categories: List[str] = field(default_factory=lambda: CATEGORY_LIST)
    seed: int = 42
    balance_categories: bool = True
    balance_languages: bool = True


@dataclass
class InferenceConfig:
    """Configuration for running inference."""
    model_path: str = str(FINETUNED_MODEL_DIR)
    label_encoder_path: str = str(LABEL_ENCODER_PATH)
    max_seq_length: int = 128
    device: Optional[str] = None  # auto-detect




# ---------------------------------------------------------------------------
# Speech Recognition Configuration
# ---------------------------------------------------------------------------

WHISPER_MODEL_ID = "openai/whisper-large-v3"

HF_CACHE_DIR = WEIGHTS_DIR / "huggingface_cache"

TRANSCRIPTS_DIR = _STORE_ROOT / "transcripts"

TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_AUDIO_EXTENSIONS = (
    ".wav",
    ".mp3",
    ".m4a",
    ".flac",
    ".ogg",
    ".webm",
)

MAX_AUDIO_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

MAX_AUDIO_DURATION = 30 * 60  # 30 minutes

TARGET_AUDIO_SAMPLE_RATE = 16000

WHISPER_MODEL_NAME = "openai/whisper-large-v3"




# ==========================================================
# COMPUTER VISION CONFIGURATION
# ==========================================================

# Hugging Face Models
GROUNDING_DINO_MODEL_ID = "IDEA-Research/grounding-dino-base"
FLORENCE_MODEL_ID = "microsoft/Florence-2-large"

# Cache
VISION_CACHE_DIR = WEIGHTS_DIR / "huggingface_cache"

# Storage
IMAGES_DIR = _STORE_ROOT / "images"
VISION_RESULTS_DIR = _STORE_ROOT / "vision_results"

IMAGES_DIR.mkdir(parents=True, exist_ok=True)
VISION_RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# Image Processing
SUPPORTED_IMAGE_FORMATS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".tiff",
    ".webp",
}

MAX_IMAGE_SIZE_MB = 25
MAX_IMAGE_DIMENSION = 4096

# Detection
CONFIDENCE_THRESHOLD = 0.35

# Runtime
VISION_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

TEXT_CONFIDENCE_THRESHOLD = 0.30


# ==========================================================
# AI ORCHESTRATION & RESOURCE MANAGEMENT
# ==========================================================

@dataclass
class AIOrchestratorConfig:
    """Central settings for the unified AI subsystem."""
    # Lifecycle
    auto_warmup_on_startup: bool = True
    fail_fast_on_corruption: bool = False
    
    # Device preferences
    prefer_gpu: bool = True
    allow_cpu_fallback: bool = True
    
    # Inference limits (milliseconds)
    max_inference_time_ms: int = 5000
    
    # Threads
    max_concurrent_inferences: int = 10

ORCHESTRATOR_CONFIG = AIOrchestratorConfig()