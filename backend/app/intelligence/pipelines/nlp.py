"""
AarogyaOne — IndicBERT Fine-Tuning Pipeline for Grievance Classification
=========================================================================
End-to-end training pipeline that:
  1. Loads/generates the multilingual grievance dataset
  2. Tokenises with the IndicBERT SentencePiece tokenizer
  3. Fine-tunes via HuggingFace Trainer with early stopping
  4. Evaluates with precision / recall / F1 / confusion matrix
  5. Exports all artefacts (model, tokenizer, label encoder, stats)
  6. Provides production-ready inference API

Usage
-----
    python nlp.py                      # full pipeline
    python nlp.py --num-samples 5000   # quick dev run
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch
from torch.utils.data import Dataset as TorchDataset

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("aarogya.nlp_pipeline")

# ── Path configuration ─────────────────────────────────────────────────────
_FILE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(_FILE_DIR))

from config import (
    BASE_MODEL_DIR,
    CATEGORY_DEPARTMENT_MAP,
    CATEGORY_LIST,
    CATEGORY_PORTAL_MAP,
    CLASSIFICATION_REPORT_PATH,
    CONFUSION_MATRIX_PATH,
    FINETUNED_MODEL_DIR,
    GENERATED_DATASET_PATH,
    LABEL_ENCODER_PATH,
    LOGS_DIR,
    LOSS_CURVES_PATH,
    NUM_LABELS,
    RESULTS_DIR,
    SEVERITY_RESPONSE_MAP,
    TRAINING_STATS_PATH,
    DatasetGeneratorConfig,
    InferenceConfig,
    TrainingConfig,
)

# ── Lazy imports (heavy) ───────────────────────────────────────────────────
# Imported at module level so linters are happy; actual loading happens at runtime.
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    EarlyStoppingCallback,
    Trainer,
    TrainingArguments,
)

try:
    from sklearn.metrics import (
        accuracy_score,
        classification_report,
        confusion_matrix,
        precision_recall_fscore_support,
    )
except ImportError:
    logger.warning("scikit-learn not found — install it for evaluation metrics.")

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ImportError:
    plt = None  # type: ignore[assignment]
    logger.warning("matplotlib not found — plots will be skipped.")


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 1 — LABEL ENCODER
# ════════════════════════════════════════════════════════════════════════════

class LabelEncoder:
    """Bidirectional mapping between category names and integer labels."""

    def __init__(self, categories: Optional[List[str]] = None):
        cats = categories or CATEGORY_LIST
        self._label_to_id: Dict[str, int] = {label: idx for idx, label in enumerate(cats)}
        self._id_to_label: Dict[int, str] = {idx: label for label, idx in self._label_to_id.items()}

    @property
    def num_labels(self) -> int:
        return len(self._label_to_id)

    def encode(self, label: str) -> int:
        return self._label_to_id[label]

    def decode(self, idx: int) -> str:
        return self._id_to_label[idx]

    def encode_batch(self, labels: List[str]) -> List[int]:
        return [self.encode(l) for l in labels]

    def decode_batch(self, indices: List[int]) -> List[str]:
        return [self.decode(i) for i in indices]

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "label_to_id": self._label_to_id,
            "id_to_label": {str(k): v for k, v in self._id_to_label.items()},
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info("Label encoder saved to %s", path)

    @classmethod
    def load(cls, path: Path) -> "LabelEncoder":
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        enc = cls.__new__(cls)
        enc._label_to_id = data["label_to_id"]
        enc._id_to_label = {int(k): v for k, v in data["id_to_label"].items()}
        logger.info("Label encoder loaded from %s (%d labels)", path, len(enc._label_to_id))
        return enc


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 2 — PYTORCH DATASET
# ════════════════════════════════════════════════════════════════════════════

class GrievanceDataset(TorchDataset):
    """
    PyTorch Dataset wrapping tokenised grievance samples.

    Holds pre-tokenised input_ids, attention_mask, and integer labels
    in memory for fast access during training.
    """

    def __init__(
        self,
        texts: List[str],
        labels: List[int],
        tokenizer: AutoTokenizer,
        max_length: int = 128,
    ):
        self.labels = labels
        logger.info("Tokenising %d samples (max_length=%d)…", len(texts), max_length)
        self.encodings = tokenizer(
            texts,
            max_length=max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        logger.info("Tokenisation complete.")

    def __len__(self) -> int:
        return len(self.labels)

    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        return {
            "input_ids": self.encodings["input_ids"][idx],
            "attention_mask": self.encodings["attention_mask"][idx],
            "labels": torch.tensor(self.labels[idx], dtype=torch.long),
        }


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 3 — METRICS
# ════════════════════════════════════════════════════════════════════════════

def compute_metrics(eval_pred) -> Dict[str, float]:
    """
    Compute accuracy, precision, recall, and weighted F1 from Trainer predictions.
    Called automatically by the HuggingFace Trainer at each evaluation step.
    """
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)

    accuracy = accuracy_score(labels, preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, preds, average="weighted", zero_division=0,
    )

    return {
        "accuracy": round(accuracy, 4),
        "precision_weighted": round(precision, 4),
        "recall_weighted": round(recall, 4),
        "f1_weighted": round(f1, 4),
    }


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 4 — TRAINING PIPELINE
# ════════════════════════════════════════════════════════════════════════════

class GrievanceTrainingPipeline:
    """
    Orchestrates the full fine-tuning lifecycle:
    data loading → tokenisation → training → evaluation → export.
    """

    def __init__(self, config: Optional[TrainingConfig] = None):
        self.config = config or TrainingConfig()
        self.label_encoder = LabelEncoder()
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model: Optional[AutoModelForSequenceClassification] = None
        self.trainer: Optional[Trainer] = None
        self.train_dataset: Optional[GrievanceDataset] = None
        self.eval_dataset: Optional[GrievanceDataset] = None
        self._raw_data: Optional[List[Dict]] = None
        self._training_history: List[Dict[str, Any]] = []

        self.device = self._resolve_device()
        logger.info("Pipeline initialised — device: %s", self.device)

    # ── helpers ────────────────────────────────────────────────────────

    @staticmethod
    def _resolve_device() -> str:
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            logger.info("CUDA available — using GPU: %s", name)
            return "cuda"
        logger.info("CUDA not available — falling back to CPU")
        return "cpu"

    # ── 1. Data loading ────────────────────────────────────────────────

    def load_or_generate_dataset(self) -> None:
        """Load the dataset from disk, generating it first if it does not exist."""
        dataset_path = Path(self.config.dataset_path)

        if not dataset_path.exists() or dataset_path.stat().st_size < 100:
            logger.info("Dataset not found at %s — generating now…", dataset_path)
            # Import generator from sibling directory
            datasets_dir = Path(__file__).resolve().parent.parent / "store" / "datasets"
            sys.path.insert(0, str(datasets_dir))
            from generate_dataset import generate_dataset as gen_ds
            gen_ds(
                num_samples=self.config.num_samples,
                output_path=str(dataset_path),
                seed=self.config.seed,
            )

        with open(dataset_path, "r", encoding="utf-8") as f:
            self._raw_data = json.load(f)

        logger.info("Loaded %d samples from %s", len(self._raw_data), dataset_path)

    # ── 2. Data preparation ────────────────────────────────────────────

    def prepare_data(self) -> None:
        """Split, encode labels, and tokenise into PyTorch datasets."""
        assert self._raw_data is not None, "Call load_or_generate_dataset() first."

        # Deterministic shuffle and split
        rng = np.random.RandomState(self.config.seed)
        indices = np.arange(len(self._raw_data))
        rng.shuffle(indices)

        split_idx = int(len(indices) * (1 - self.config.validation_split))
        train_indices = indices[:split_idx]
        eval_indices = indices[split_idx:]

        train_texts = [self._raw_data[i]["text"] for i in train_indices]
        eval_texts = [self._raw_data[i]["text"] for i in eval_indices]
        train_labels = self.label_encoder.encode_batch(
            [self._raw_data[i]["category"] for i in train_indices]
        )
        eval_labels = self.label_encoder.encode_batch(
            [self._raw_data[i]["category"] for i in eval_indices]
        )

        logger.info("Split: %d train / %d eval", len(train_texts), len(eval_texts))

        # Load tokenizer
        logger.info("Loading tokenizer from %s", self.config.base_model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.config.base_model_path,
            use_fast=False,
        )

        self.train_dataset = GrievanceDataset(
            train_texts, train_labels, self.tokenizer, self.config.max_seq_length,
        )
        self.eval_dataset = GrievanceDataset(
            eval_texts, eval_labels, self.tokenizer, self.config.max_seq_length,
        )

    # ── 3. Model loading ───────────────────────────────────────────────

    def build_model(self) -> None:
        """Load the pre-trained IndicBERT and attach a classification head."""
        logger.info(
            "Loading base model from %s (%d labels)…",
            self.config.base_model_path,
            self.config.num_labels,
        )
        self.model = AutoModelForSequenceClassification.from_pretrained(
            self.config.base_model_path,
            num_labels=self.config.num_labels,
        )
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        logger.info(
            "Model loaded — %.2fM params (%.2fM trainable)",
            total_params / 1e6,
            trainable / 1e6,
        )

    # ── 4. Training ────────────────────────────────────────────────────

    def train(self) -> None:
        """Run HuggingFace Trainer with early stopping."""
        assert self.model is not None, "Call build_model() first."
        assert self.train_dataset is not None, "Call prepare_data() first."

        output_dir = self.config.output_dir
        logging_dir = str(LOGS_DIR / "runs")

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=self.config.num_epochs,
            per_device_train_batch_size=self.config.train_batch_size,
            per_device_eval_batch_size=self.config.eval_batch_size,
            learning_rate=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            warmup_ratio=self.config.warmup_ratio,
            max_grad_norm=self.config.max_grad_norm,
            fp16=self.config.fp16 and self.device == "cuda",
            gradient_accumulation_steps=self.config.gradient_accumulation_steps,
            dataloader_num_workers=self.config.dataloader_num_workers,
            eval_strategy="steps",
            eval_steps=self.config.eval_steps,
            save_strategy="steps",
            save_steps=self.config.save_steps,
            save_total_limit=self.config.save_total_limit,
            logging_dir=logging_dir,
            logging_steps=self.config.logging_steps,
            load_best_model_at_end=True,
            metric_for_best_model=self.config.metric_for_best_model,
            greater_is_better=self.config.greater_is_better,
            report_to=self.config.report_to,
            seed=self.config.seed,
            log_level=self.config.log_level,
            remove_unused_columns=False,
        )

        self.trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=self.train_dataset,
            eval_dataset=self.eval_dataset,
            compute_metrics=compute_metrics,
            callbacks=[
                EarlyStoppingCallback(
                    early_stopping_patience=self.config.early_stopping_patience,
                    early_stopping_threshold=self.config.early_stopping_threshold,
                ),
            ],
        )

        logger.info("Starting training…")
        t0 = time.time()
        train_result = self.trainer.train()
        elapsed = time.time() - t0

        self._training_history = [
            {k: v for k, v in entry.items()}
            for entry in (self.trainer.state.log_history or [])
        ]

        logger.info(
            "Training complete in %.1f min — final loss: %.4f",
            elapsed / 60,
            train_result.training_loss,
        )

    # ── 5. Evaluation ──────────────────────────────────────────────────

    def evaluate(self) -> Dict[str, Any]:
        """Run full evaluation and export metrics, confusion matrix, loss curves."""
        assert self.trainer is not None, "Call train() first."

        logger.info("Running evaluation…")
        metrics = self.trainer.evaluate()
        logger.info("Eval metrics: %s", metrics)

        # Classification report
        predictions = self.trainer.predict(self.eval_dataset)
        preds = np.argmax(predictions.predictions, axis=-1)
        labels = predictions.label_ids

        label_names = [self.label_encoder.decode(i) for i in range(self.label_encoder.num_labels)]

        report_dict = classification_report(
            labels, preds, target_names=label_names, output_dict=True, zero_division=0,
        )

        report_path = CLASSIFICATION_REPORT_PATH
        report_path.parent.mkdir(parents=True, exist_ok=True)
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report_dict, f, indent=2)
        logger.info("Classification report saved to %s", report_path)

        # Confusion matrix
        self._export_confusion_matrix(labels, preds, label_names)

        # Loss curves
        self._export_loss_curves()

        # Training statistics
        self._export_training_stats(metrics, report_dict)

        return metrics

    def _export_confusion_matrix(
        self,
        labels: np.ndarray,
        preds: np.ndarray,
        label_names: List[str],
    ) -> None:
        """Render and save the confusion matrix as a PNG."""
        if plt is None:
            logger.warning("matplotlib unavailable — skipping confusion matrix plot.")
            return

        cm = confusion_matrix(labels, preds)
        fig, ax = plt.subplots(figsize=(18, 16))
        im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
        ax.figure.colorbar(im, ax=ax, shrink=0.8)

        ax.set(
            xticks=np.arange(cm.shape[1]),
            yticks=np.arange(cm.shape[0]),
            xticklabels=label_names,
            yticklabels=label_names,
            xlabel="Predicted",
            ylabel="True",
            title="AarogyaOne Grievance Classification — Confusion Matrix",
        )
        plt.setp(ax.get_xticklabels(), rotation=45, ha="right", rotation_mode="anchor", fontsize=7)
        plt.setp(ax.get_yticklabels(), fontsize=7)
        plt.tight_layout()

        path = CONFUSION_MATRIX_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(str(path), dpi=150, bbox_inches="tight")
        plt.close(fig)
        logger.info("Confusion matrix saved to %s", path)

    def _export_loss_curves(self) -> None:
        """Plot training and evaluation loss curves."""
        if plt is None or not self._training_history:
            return

        train_steps, train_losses = [], []
        eval_steps, eval_losses = [], []

        for entry in self._training_history:
            step = entry.get("step", 0)
            if "loss" in entry:
                train_steps.append(step)
                train_losses.append(entry["loss"])
            if "eval_loss" in entry:
                eval_steps.append(step)
                eval_losses.append(entry["eval_loss"])

        fig, ax = plt.subplots(figsize=(10, 6))
        if train_losses:
            ax.plot(train_steps, train_losses, label="Train Loss", alpha=0.8, linewidth=1.5)
        if eval_losses:
            ax.plot(eval_steps, eval_losses, label="Eval Loss", alpha=0.8, linewidth=1.5, linestyle="--")

        ax.set_xlabel("Step")
        ax.set_ylabel("Loss")
        ax.set_title("AarogyaOne Training — Loss Curves")
        ax.legend()
        ax.grid(True, alpha=0.3)
        plt.tight_layout()

        path = LOSS_CURVES_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(str(path), dpi=150, bbox_inches="tight")
        plt.close(fig)
        logger.info("Loss curves saved to %s", path)

    def _export_training_stats(
        self,
        eval_metrics: Dict[str, Any],
        report_dict: Dict[str, Any],
    ) -> None:
        """Persist training statistics as JSON."""
        stats = {
            "model": "AI4Bharat IndicBERT (fine-tuned)",
            "base_model_path": self.config.base_model_path,
            "num_labels": self.config.num_labels,
            "categories": CATEGORY_LIST,
            "dataset_samples": self.config.num_samples,
            "train_samples": len(self.train_dataset) if self.train_dataset else 0,
            "eval_samples": len(self.eval_dataset) if self.eval_dataset else 0,
            "hyperparameters": {
                "epochs": self.config.num_epochs,
                "batch_size": self.config.train_batch_size,
                "learning_rate": self.config.learning_rate,
                "weight_decay": self.config.weight_decay,
                "warmup_ratio": self.config.warmup_ratio,
                "max_seq_length": self.config.max_seq_length,
                "fp16": self.config.fp16,
                "early_stopping_patience": self.config.early_stopping_patience,
            },
            "eval_metrics": eval_metrics,
            "per_class_report": report_dict,
            "device": self.device,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }

        path = TRAINING_STATS_PATH
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
        logger.info("Training statistics saved to %s", path)

    # ── 6. Save artefacts ──────────────────────────────────────────────

    def save_artefacts(self) -> None:
        """Save the fine-tuned model, tokenizer, and label encoder."""
        output = Path(self.config.output_dir)
        output.mkdir(parents=True, exist_ok=True)

        # Model & tokenizer
        self.trainer.save_model(str(output))
        self.tokenizer.save_pretrained(str(output))
        logger.info("Model and tokenizer saved to %s", output)

        # Label encoder
        self.label_encoder.save(LABEL_ENCODER_PATH)

        # Model metadata
        meta = {
            "model_name": "aarogya-grievance-classifier",
            "base_model": "ai4bharat/indic-bert",
            "version": "1.0.0",
            "num_labels": self.config.num_labels,
            "max_seq_length": self.config.max_seq_length,
            "languages_supported": 20,
            "categories": CATEGORY_LIST,
        }
        meta_path = output / "model_metadata.json"
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)
        logger.info("Model metadata saved to %s", meta_path)

    # ── 7. Full pipeline ───────────────────────────────────────────────

    def run(self) -> Dict[str, Any]:
        """Execute the complete pipeline end-to-end."""
        logger.info("=" * 70)
        logger.info("  AarogyaOne NLP Pipeline — Starting")
        logger.info("=" * 70)

        t_start = time.time()

        self.load_or_generate_dataset()
        self.prepare_data()
        self.build_model()
        self.train()
        metrics = self.evaluate()
        self.save_artefacts()

        elapsed = time.time() - t_start
        logger.info("=" * 70)
        logger.info("  Pipeline complete in %.1f min", elapsed / 60)
        logger.info("  Final eval metrics: %s", metrics)
        logger.info("=" * 70)

        return metrics


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 5 — INFERENCE ENGINE
# ════════════════════════════════════════════════════════════════════════════

class GrievanceClassifier:
    """
    Production inference engine for the fine-tuned grievance classifier.

    Loads the saved model, tokenizer, and label encoder, then provides
    a `predict()` method returning structured classification output.
    """

    def __init__(self, config: Optional[InferenceConfig] = None):
        self.config = config or InferenceConfig()
        self.device = self._resolve_device()
        self.label_encoder: Optional[LabelEncoder] = None
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model: Optional[AutoModelForSequenceClassification] = None
        self._loaded = False

    @staticmethod
    def _resolve_device() -> str:
        return "cuda" if torch.cuda.is_available() else "cpu"

    def load(self) -> "GrievanceClassifier":
        """Load model, tokenizer, and label encoder from disk."""
        model_path = self.config.model_path
        le_path = self.config.label_encoder_path

        logger.info("Loading model from %s", model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=False)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.to(self.device)
        self.model.eval()

        logger.info("Loading label encoder from %s", le_path)
        self.label_encoder = LabelEncoder.load(Path(le_path))

        self._loaded = True
        logger.info("Inference engine ready on %s", self.device)
        return self

    @torch.no_grad()
    def predict(self, text: str) -> Dict[str, Any]:
        """
        Classify a single complaint text.

        Returns
        -------
        dict with keys:
            category, confidence, portal, department, severity, response_time
        """
        assert self._loaded, "Call load() before predict()."

        inputs = self.tokenizer(
            text,
            max_length=self.config.max_seq_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        ).to(self.device)

        outputs = self.model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1).squeeze()

        predicted_id = int(torch.argmax(probs).item())
        confidence = float(probs[predicted_id].item())
        category = self.label_encoder.decode(predicted_id)

        # Determine severity from confidence level
        if confidence >= 0.90:
            severity = "Critical" if category in (
                "Emergency Services", "Medical Negligence", "Patient Safety",
                "Blood Bank", "Operation Theatre", "Ambulance",
            ) else "High"
        elif confidence >= 0.70:
            severity = "High" if category in (
                "Emergency Services", "Medical Negligence",
            ) else "Medium"
        else:
            severity = "Medium" if confidence >= 0.50 else "Low"

        return {
            "category": category,
            "confidence": round(confidence, 4),
            "portal": CATEGORY_PORTAL_MAP.get(category, "HELPDESK_PORTAL"),
            "department": CATEGORY_DEPARTMENT_MAP.get(category, "General Administration"),
            "severity": severity,
            "response_time": SEVERITY_RESPONSE_MAP.get(severity, "72 hours"),
        }

    @torch.no_grad()
    def predict_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Classify multiple texts in a single forward pass."""
        assert self._loaded, "Call load() before predict_batch()."

        inputs = self.tokenizer(
            texts,
            max_length=self.config.max_seq_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        ).to(self.device)

        outputs = self.model(**inputs)
        probs = torch.softmax(outputs.logits, dim=-1)

        results = []
        for i in range(len(texts)):
            p = probs[i]
            predicted_id = int(torch.argmax(p).item())
            confidence = float(p[predicted_id].item())
            category = self.label_encoder.decode(predicted_id)

            if confidence >= 0.90:
                severity = "High"
            elif confidence >= 0.70:
                severity = "Medium"
            else:
                severity = "Low"

            results.append({
                "category": category,
                "confidence": round(confidence, 4),
                "portal": CATEGORY_PORTAL_MAP.get(category, "HELPDESK_PORTAL"),
                "department": CATEGORY_DEPARTMENT_MAP.get(category, "General Administration"),
                "severity": severity,
                "response_time": SEVERITY_RESPONSE_MAP.get(severity, "72 hours"),
            })
        return results


# ════════════════════════════════════════════════════════════════════════════
#  SECTION 6 — ENTRY POINT
# ════════════════════════════════════════════════════════════════════════════

def main() -> None:
    """CLI entry point for the NLP pipeline."""
    import argparse

    parser = argparse.ArgumentParser(
        description="AarogyaOne — IndicBERT Grievance Classification Pipeline",
    )
    parser.add_argument(
        "--num-samples", type=int, default=100_000,
        help="Dataset size if generation is needed (default: 100000)",
    )
    parser.add_argument(
        "--epochs", type=int, default=None,
        help="Override number of training epochs",
    )
    parser.add_argument(
        "--batch-size", type=int, default=None,
        help="Override training batch size",
    )
    parser.add_argument(
        "--lr", type=float, default=None,
        help="Override learning rate",
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Random seed",
    )
    args = parser.parse_args()

    config = TrainingConfig(
        num_samples=args.num_samples,
        seed=args.seed,
    )
    if args.epochs is not None:
        config.num_epochs = args.epochs
    if args.batch_size is not None:
        config.train_batch_size = args.batch_size
    if args.lr is not None:
        config.learning_rate = args.lr

    pipeline = GrievanceTrainingPipeline(config)
    pipeline.run()


if __name__ == "__main__":
    main()
