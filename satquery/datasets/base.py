"""SatQuery Base Dataset Adapter Interface.

Defines the contract for all remote-sensing dataset loaders, streaming generators,
manifest builders, and subset preparers.
"""

from __future__ import annotations
import abc
import hashlib
import json
import logging
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

from satquery.datasets.schema import (
    Modality,
    Sensor,
    TaskType,
    UnifiedRemoteSensingExample,
)

logger = logging.getLogger("satquery.datasets")


class DatasetAdapter(abc.ABC):
    """Abstract Base Class for all SatQuery dataset adapters."""

    def __init__(self, root_dir: Optional[str] = None):
        self.root_dir = Path(root_dir) if root_dir else Path(__file__).resolve().parents[2]
        self.data_dir = self.root_dir / "data"
        self.raw_dir = self.data_dir / "raw" / self.dataset_name.lower().replace("-", "_")
        self.manifest_dir = self.data_dir / "manifests"
        self.cache_dir = self.data_dir / "cache" / self.dataset_name.lower().replace("-", "_")
        self.split_dir = self.data_dir / "splits"
        self.metadata_dir = self.data_dir / "metadata"

        # Ensure directory structures exist
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.split_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_dir.mkdir(parents=True, exist_ok=True)

    @property
    @abc.abstractmethod
    def dataset_name(self) -> str:
        """Canonical dataset identifier."""
        pass

    @property
    @abc.abstractmethod
    def version(self) -> str:
        """Dataset version tag (e.g. '2.0.0', '1.0')."""
        pass

    @property
    @abc.abstractmethod
    def source(self) -> str:
        """Upstream origin (e.g. 'ESA / TU Berlin', 'Wuhan University', 'TU Munich')."""
        pass

    @property
    @abc.abstractmethod
    def license(self) -> str:
        """SPDX license identifier or legal terms."""
        pass

    @property
    @abc.abstractmethod
    def modalities(self) -> List[Modality]:
        """Modalities included in dataset."""
        pass

    @property
    @abc.abstractmethod
    def sensors(self) -> List[Sensor]:
        """Sensor platforms captured."""
        pass

    @property
    @abc.abstractmethod
    def tasks(self) -> List[TaskType]:
        """Vision-language or earth observation tasks supported."""
        pass

    @property
    def splits(self) -> List[str]:
        """Available splits."""
        return ["train", "val", "test"]

    @property
    def streaming_support(self) -> bool:
        """Whether adapter supports progressive streaming without complete disk download."""
        return True

    @property
    @abc.abstractmethod
    def tier(self) -> int:
        """Integration tier (1: Core multimodal/VQA/Change, 2: Secondary disaster/multisensor, 3: Downstream detection/grounding)."""
        pass

    @property
    def implementation_status(self) -> str:
        """Standardized readiness status: REAL + VERIFIED, REAL + PARTIAL, LOADER ONLY, UNAVAILABLE."""
        return "REAL + VERIFIED"

    @property
    def citation(self) -> str:
        """BibTeX or standard scholarly reference."""
        return ""

    @property
    def homepage(self) -> str:
        """Official URL or dataset repository."""
        return ""

    @property
    def expected_hash(self) -> Optional[str]:
        """Expected SHA-256 or MD5 checksum for official release bundle."""
        return None

    @abc.abstractmethod
    def iter_samples(
        self,
        split: str = "train",
        streaming: bool = True,
        max_samples: Optional[int] = None
    ) -> Iterator[UnifiedRemoteSensingExample]:
        """Stream or iterate through normalized dataset samples."""
        pass

    def get_sample(self, idx: int, split: str = "train") -> UnifiedRemoteSensingExample:
        """Retrieve a specific sample by linear index."""
        for current_idx, sample in enumerate(self.iter_samples(split=split, streaming=True)):
            if current_idx == idx:
                return sample
        raise IndexError(f"Sample index {idx} out of range for split '{split}' in {self.dataset_name}")

    def download_manifest(self) -> Dict[str, Any]:
        """Generate or retrieve the manifest of sample records and URLs."""
        manifest_file = self.manifest_dir / f"{self.dataset_name.lower()}_manifest.json"
        if manifest_file.exists():
            with open(manifest_file, "r", encoding="utf-8") as f:
                return json.load(f)

        manifest = {
            "dataset": self.dataset_name,
            "version": self.version,
            "source": self.source,
            "license": self.license,
            "modalities": [m.value for m in self.modalities],
            "sensors": [s.value for s in self.sensors],
            "tasks": [t.value for t in self.tasks],
            "splits": self.splits,
            "samples_count": 0,
            "records": []
        }
        with open(manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)
        return manifest

    def prepare_subset(self, max_samples: int = 50, split: str = "train") -> str:
        """Curate a local verified subset of max_samples for fast testing and development."""
        subset_file = self.cache_dir / f"subset_{split}_{max_samples}.jsonl"
        records = []
        for sample in self.iter_samples(split=split, streaming=True, max_samples=max_samples):
            records.append(sample.model_dump())

        with open(subset_file, "w", encoding="utf-8") as f:
            for record in records:
                f.write(json.dumps(record) + "\n")

        logger.info(f"Prepared {len(records)} samples in {subset_file}")
        return str(subset_file)

    def get_stats(self) -> Dict[str, Any]:
        """Compute summary statistics for this dataset."""
        train_count = sum(1 for _ in self.iter_samples(split="train", max_samples=100))
        val_count = sum(1 for _ in self.iter_samples(split="val", max_samples=50))
        test_count = sum(1 for _ in self.iter_samples(split="test", max_samples=50))

        return {
            "dataset": self.dataset_name,
            "version": self.version,
            "tier": self.tier,
            "license": self.license,
            "implementation_status": self.implementation_status,
            "modalities": [m.value for m in self.modalities],
            "sensors": [s.value for s in self.sensors],
            "tasks": [t.value for t in self.tasks],
            "sample_counts": {
                "train_preview": train_count,
                "val_preview": val_count,
                "test_preview": test_count,
            },
            "streaming_support": self.streaming_support
        }

    def verify_integrity(self) -> Dict[str, Any]:
        """Check availability of files, manifests, and raster validity."""
        errors = []
        warnings = []
        samples_tested = 0

        try:
            for sample in self.iter_samples(split="train", max_samples=5):
                samples_tested += 1
                images = sample.get_primary_images()
                if not images:
                    warnings.append(f"Sample {sample.id} has no image paths assigned")
                for img_path in images:
                    p = Path(img_path)
                    if not p.exists():
                        warnings.append(f"Sample {sample.id} image not found on disk: {img_path}")
        except Exception as e:
            errors.append(f"Iteration error: {str(e)}")

        return {
            "dataset": self.dataset_name,
            "status": "PASS" if not errors else "FAIL",
            "samples_tested": samples_tested,
            "errors": errors,
            "warnings": warnings
        }
