# AarogyaOne AI Models — Production ML Pipeline

This folder contains the complete, production-grade machine learning pipeline for the AarogyaOne platform.

## Overview

The pipeline trains two core models:
1. **LightGBM Forecaster**: Predicts `stockout_days` (time until zero stock) for inventory management.
2. **XGBoost Scorer**: Predicts `health_score` (operational performance 0-100) for hospital evaluation.

**Highest Priority Rule: Backward Compatibility**
All trained models, exported metadata, label encoders, and feature schemas are strictly maintained to be compatible with the backend `app/intelligence/pipelines/forecasting.py` and `scoring.py`. Never introduce a new feature during training without making the exact same transformation available to the backend inference engine.

## Directory Structure

- `configs/`: YAML configurations controlling dataset generation constraints, seeds, and training hyperparameters.
- `datasets/`: Storage for versioned `.csv` datasets (e.g., `inventory_dataset_v1.csv`, `scoring_dataset_v1.csv`).
- `scripts/`: Generation and training scripts.
- `trained_models/`: Output directory for `.pkl` models, training logs, quality reports, and JSON schemas.
- `utils/`: Reusable validation and metadata extraction logic.

## Usage

### 1. Configure
Edit parameters in `configs/generator_config.yaml`, `configs/lightgbm_config.yaml`, and `configs/xgboost_config.yaml`.

### 2. Generate Datasets
Run the dataset generators. These modules implement temporal dependencies (e.g., Markov chains for hospital baseline performance) and adhere to strict, real-world constraints (no negative occupancies).
```bash
python scripts/generate_inventory_dataset.py
python scripts/generate_scoring_dataset.py
python scripts/generate_resource_transfer_dataset.py
```

### 3. Train Models
Run the training scripts. The scripts will first run data validation via `utils/validation.py`. If validation passes, they will split the data deterministically, train with early stopping, export metrics, and run a final mock inference to ensure model corruption did not occur.
```bash
python scripts/train_lightgbm.py
python scripts/train_xgboost.py
```

### 4. Review Artifacts
Navigate to `trained_models/` to inspect:
- `training.log` (Complete execution trace)
- `data_quality_report.json` (Assurance of valid input data)
- `model_metadata.json` (Versioning and environment info)
- `feature_schema.json` (Exact inference contract expected by the backend)
