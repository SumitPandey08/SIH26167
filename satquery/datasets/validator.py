"""SatQuery Dataset Quality & Anomaly Detection Pipeline.

Validates raster integrity, bounding box coordinates, temporal image pairs,
optical-SAR sensor alignments, text quality, and generates data quality reports.
"""

from __future__ import annotations
from datetime import datetime, timezone
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Set
from PIL import Image

from satquery.datasets.schema import TaskType, UnifiedRemoteSensingExample

logger = logging.getLogger("satquery.validator")


class DatasetValidator:
    """Rigorous data quality assurance validator for remote sensing datasets."""

    def __init__(self, output_report_path: Optional[str] = None):
        self.report_path = (
            Path(output_report_path)
            if output_report_path
            else Path(__file__).resolve().parents[2] / "data" / "metadata" / "data_quality_report.json"
        )
        self.report_path.parent.mkdir(parents=True, exist_ok=True)

    def validate_sample(self, sample: UnifiedRemoteSensingExample) -> List[Dict[str, Any]]:
        """Validate a single unified example, returning any detected anomalies."""
        issues = []

        # 1. Check ID and task
        if not sample.id or not sample.id.strip():
            issues.append({"level": "ERROR", "code": "EMPTY_ID", "message": "Sample ID cannot be empty"})

        # 2. Raster accessibility and integrity
        images_to_check = []
        if sample.optical_path:
            images_to_check.append(("optical", sample.optical_path))
        if sample.sar_path:
            images_to_check.append(("sar", sample.sar_path))
        if sample.t1_path:
            images_to_check.append(("t1", sample.t1_path))
        if sample.t2_path:
            images_to_check.append(("t2", sample.t2_path))

        image_dims = {}
        for role, img_path in images_to_check:
            p = Path(img_path)
            if not p.exists():
                issues.append({
                    "level": "ERROR",
                    "code": "MISSING_RASTER",
                    "message": f"Raster file missing for role '{role}': {img_path}"
                })
            else:
                try:
                    with Image.open(p) as img:
                        w, h = img.size
                        if w <= 0 or h <= 0:
                            issues.append({
                                "level": "ERROR",
                                "code": "CORRUPTED_RASTER",
                                "message": f"Invalid raster dimensions ({w}x{h}) for {img_path}"
                            })
                        image_dims[role] = (w, h)
                except Exception as exc:
                    issues.append({
                        "level": "ERROR",
                        "code": "UNREADABLE_RASTER",
                        "message": f"Failed to open raster {img_path}: {str(exc)}"
                    })

        # 3. Bi-temporal coherence check
        if sample.task in [TaskType.TEMPORAL_CHANGE, TaskType.CHANGE_CAPTIONING, TaskType.CHANGE_VQA]:
            if not sample.t1_path or not sample.t2_path:
                issues.append({
                    "level": "ERROR",
                    "code": "MISSING_TEMPORAL_PARTNER",
                    "message": f"Temporal change task requires both t1_path and t2_path, found t1={bool(sample.t1_path)}, t2={bool(sample.t2_path)}"
                })
            elif "t1" in image_dims and "t2" in image_dims:
                if image_dims["t1"] != image_dims["t2"]:
                    issues.append({
                        "level": "WARNING",
                        "code": "TEMPORAL_DIMENSION_MISMATCH",
                        "message": f"T1 size {image_dims['t1']} does not match T2 size {image_dims['t2']}"
                    })

        # 4. Optical-SAR cross-modal coherence
        if sample.task == TaskType.OPTICAL_SAR:
            if not sample.optical_path or not sample.sar_path:
                issues.append({
                    "level": "ERROR",
                    "code": "MISSING_CROSSMODAL_PARTNER",
                    "message": "Optical-SAR task requires both optical_path and sar_path"
                })
            elif "optical" in image_dims and "sar" in image_dims:
                if image_dims["optical"] != image_dims["sar"]:
                    issues.append({
                        "level": "WARNING",
                        "code": "MULTIMODAL_DIMENSION_MISMATCH",
                        "message": f"Optical size {image_dims['optical']} != SAR size {image_dims['sar']}"
                    })

        # 5. Bounding box validity
        if sample.target_boxes:
            for i, bbox in enumerate(sample.target_boxes):
                ymin, xmin, ymax, xmax = bbox.box_2d
                if bbox.is_normalized:
                    if not (0.0 <= ymin <= 1.0 and 0.0 <= xmin <= 1.0 and 0.0 <= ymax <= 1.0 and 0.0 <= xmax <= 1.0):
                        issues.append({
                            "level": "ERROR",
                            "code": "OUT_OF_BOUNDS_BBOX",
                            "message": f"Box {i} normalized coords out of [0, 1] range: {bbox.box_2d}"
                        })
                if ymin >= ymax or xmin >= xmax:
                    issues.append({
                        "level": "ERROR",
                        "code": "DEGENERATE_BBOX",
                        "message": f"Box {i} has degenerate area: {bbox.box_2d}"
                    })

        # 6. Text quality checks
        if sample.task in [TaskType.VQA, TaskType.CHANGE_VQA]:
            if not sample.question or len(sample.question.strip()) < 3:
                issues.append({"level": "ERROR", "code": "EMPTY_QUESTION", "message": "VQA question is empty or too short"})
            if not sample.answer or len(sample.answer.strip()) < 1:
                issues.append({"level": "ERROR", "code": "EMPTY_ANSWER", "message": "VQA answer is missing"})

        if sample.task in [TaskType.CAPTIONING, TaskType.CHANGE_CAPTIONING, TaskType.SCENE_DESCRIPTION]:
            if not sample.caption or len(sample.caption.strip()) < 5:
                issues.append({"level": "ERROR", "code": "EMPTY_CAPTION", "message": "Caption is missing or too short"})

        return issues

    def validate_dataset(
        self,
        samples: List[UnifiedRemoteSensingExample],
        dataset_name: str
    ) -> Dict[str, Any]:
        """Validate a collection of dataset samples and export quality telemetry."""
        seen_ids: Set[str] = set()
        duplicate_ids: List[str] = []
        all_issues: List[Dict[str, Any]] = []
        total_samples = len(samples)
        passed_samples = 0

        for sample in samples:
            if sample.id in seen_ids:
                duplicate_ids.append(sample.id)
                all_issues.append({
                    "sample_id": sample.id,
                    "level": "ERROR",
                    "code": "DUPLICATE_ID",
                    "message": f"Duplicate sample ID: {sample.id}"
                })
            else:
                seen_ids.add(sample.id)

            sample_issues = self.validate_sample(sample)
            if sample_issues:
                for issue in sample_issues:
                    issue["sample_id"] = sample.id
                    all_issues.append(issue)
            else:
                passed_samples += 1

        error_count = sum(1 for iss in all_issues if iss["level"] == "ERROR")
        warning_count = sum(1 for iss in all_issues if iss["level"] == "WARNING")
        quality_score = (passed_samples / total_samples * 100.0) if total_samples > 0 else 100.0

        report = {
            "dataset": dataset_name,
            "validated_at": datetime.now(timezone.utc).isoformat(),
            "total_samples": total_samples,
            "passed_samples": passed_samples,
            "quality_score_percent": round(quality_score, 2),
            "errors": error_count,
            "warnings": warning_count,
            "duplicates": len(duplicate_ids),
            "status": "PASS" if error_count == 0 else "FAIL",
            "findings": all_issues[:100]  # Cap findings list
        }

        # Save to disk
        with open(self.report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        logger.info(f"Dataset quality report written to {self.report_path} (Score: {quality_score:.1f}%)")
        return report
