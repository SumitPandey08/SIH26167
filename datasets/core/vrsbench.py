"""
SatQuery AI — VRSBench Dataset Loader
Captioning, Visual Grounding & Remote Sensing VQA Benchmark
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from PIL import Image

from ..abstraction import BaseRemoteSensingDataset

logger = logging.getLogger("satquery.datasets.vrsbench")


class VRSBenchDataset(BaseRemoteSensingDataset):
    """
    VRSBench loader supporting:
    1. Human-verified dense captions
    2. Referring expression object grounding bounding boxes [ymin, xmin, ymax, xmax]
    3. Multi-turn visual question answering (VQA)
    """

    def _initialize(self) -> None:
        manifest_file = self.root_dir / f"vrsbench_{self.split}.json"
        if manifest_file.exists():
            with open(manifest_file, "r") as f:
                self.samples = json.load(f)
        else:
            # Seed representative sample entries
            self.samples = [
                {
                    "image_id": f"VRS_{self.split}_1001",
                    "image_path": str(self.root_dir.parent / "demo" / "nepal_2020_t1_optical.png"),
                    "caption": "A high-resolution aerial overview exhibiting a meandering mountain river flanked by dense coniferous forest canopy and sedimentary banks.",
                    "grounding_targets": [
                        {
                            "query": "the river channel",
                            "box": [0, 180, 512, 330]  # [ymin, xmin, ymax, xmax]
                        }
                    ],
                    "qa_pairs": [
                        ("What is the natural feature flowing through the center of the image?", "A river channel with blue-tinted water."),
                        ("What type of vegetation dominates the terrain?", "Dense mixed forest canopy.")
                    ]
                }
            ]

    def get_sample(self, index: int) -> Dict[str, Any]:
        item = self.samples[index % len(self.samples)]
        arr = np.zeros((3, 512, 512), dtype=np.float32)

        if Path(item["image_path"]).exists():
            with Image.open(item["image_path"]) as img:
                arr = np.transpose(np.array(img.convert("RGB"), dtype=np.float32) / 255.0, (2, 0, 1))

        return {
            "sample_id": item["image_id"],
            "modality": "OPTICAL",
            "images": [arr],
            "metadata": {
                "gsd_m": 0.5,
                "dimensions": (512, 512),
            },
            "ground_truth": {
                "mask": None,
                "text_captions": [item["caption"]],
                "qa_pairs": item.get("qa_pairs", []),
                "bounding_boxes": item.get("grounding_targets", []),
            }
        }
