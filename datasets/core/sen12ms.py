"""
SatQuery AI — SEN12MS Multimodal Dataset Loader
Sentinel-1 SAR + Sentinel-2 Optical Fusion Benchmark
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image

from ..abstraction import BaseRemoteSensingDataset

logger = logging.getLogger("satquery.datasets.sen12ms")


class SEN12MSDataset(BaseRemoteSensingDataset):
    """
    SEN12MS loader providing co-registered triplets of:
    - Sentinel-1 dual-pol SAR (VV, VH)
    - Sentinel-2 multispectral imagery
    - MODIS / Corine land-cover ground truth labels
    """

    def _initialize(self) -> None:
        self.samples = [
            {
                "triplet_id": f"SEN12MS_{self.split}_001",
                "optical_path": str(self.root_dir.parent / "demo" / "nepal_2026_cloud_covered_optical.png"),
                "sar_path": str(self.root_dir.parent / "demo" / "sentinel1_2026_sar_flood.png"),
                "season": "monsoon",
                "cloud_percentage": 30.0,
                "land_cover": ["water", "forest", "urban"],
            }
        ]

    def get_sample(self, index: int) -> Dict[str, Any]:
        item = self.samples[index % len(self.samples)]

        opt_arr = np.zeros((3, 512, 512), dtype=np.float32)
        sar_arr = np.zeros((2, 512, 512), dtype=np.float32)

        if Path(item["optical_path"]).exists():
            with Image.open(item["optical_path"]) as img:
                opt_arr = np.transpose(np.array(img.convert("RGB"), dtype=np.float32) / 255.0, (2, 0, 1))

        if Path(item["sar_path"]).exists():
            with Image.open(item["sar_path"]) as img:
                gray = np.array(img.convert("L"), dtype=np.float32) / 255.0
                sar_arr[0] = gray
                sar_arr[1] = gray * 0.45

        return {
            "sample_id": item["triplet_id"],
            "modality": "CROSS_MODAL",
            "images": [opt_arr, sar_arr],
            "metadata": {
                "cloud_pct": item["cloud_percentage"],
                "season": item["season"],
                "classes": item["land_cover"],
            },
            "ground_truth": {
                "mask": None,
                "text_captions": ["Co-registered Sentinel-1 SAR and cloud-obscured Sentinel-2 optical pair."],
                "qa_pairs": [
                    ("How does SAR backscatter complement the optical imagery?", "Radar C-band microwaves penetrate cloud cover to reliably detect specular water reflection.")
                ],
                "bounding_boxes": None,
            }
        }
