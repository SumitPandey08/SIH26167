"""
SatQuery AI — Unified Remote Sensing Dataset Abstraction Layer
Standard: SIH26167 Remote Sensing Assistant
"""

import os
import json
import logging
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Iterator
import numpy as np

logger = logging.getLogger("satquery.datasets")


class BaseRemoteSensingDataset(ABC):
    """
    Abstract base class for all remote sensing datasets in SatQuery AI.
    Standardizes image loading, coordinate georeferencing, train/val/test splits,
    and annotation formats across optical, multispectral, and SAR modalities.
    """

    def __init__(self, root_dir: str, split: str = "val", download: bool = False):
        self.root_dir = Path(root_dir)
        self.split = split
        self.download = download
        self.samples: List[Dict[str, Any]] = []
        self._initialize()

    @abstractmethod
    def _initialize(self) -> None:
        """Scan local files, load index manifests, or trigger streaming."""
        pass

    def __len__(self) -> int:
        return len(self.samples)

    @abstractmethod
    def get_sample(self, index: int) -> Dict[str, Any]:
        """
        Returns standardized sample dictionary:
        {
            "sample_id": str,
            "modality": "OPTICAL" | "SAR" | "MULTISPECTRAL" | "CROSS_MODAL",
            "images": [np.ndarray], # normalized float32 [0, 1] shape (C, H, W)
            "metadata": {
                "crs": str,
                "bbox": [minx, miny, maxx, maxy],
                "gsd_m": float,
                "timestamps": [str]
            },
            "ground_truth": {
                "mask": Optional[np.ndarray], # binary or categorical mask
                "text_captions": Optional[List[str]],
                "qa_pairs": Optional[List[Tuple[str, str]]], # [(question, answer)]
                "bounding_boxes": Optional[List[Dict[str, Any]]] # [{label, box: [ymin, xmin, ymax, xmax]}]
            }
        }
        """
        pass

    def iterate_split(self, max_samples: Optional[int] = None) -> Iterator[Dict[str, Any]]:
        """Yields standardized samples up to max_samples."""
        count = 0
        for i in range(len(self)):
            if max_samples and count >= max_samples:
                break
            yield self.get_sample(i)
            count += 1
