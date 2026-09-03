"""
SatQuery AI — BRIGHT & UrbanSARFloods Dataset Loader
Optical + SAR Semantic Change Detection for Extreme Disaster Events
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

from ..abstraction import BaseRemoteSensingDataset

logger = logging.getLogger("satquery.datasets.bright")


class BrightUrbanSARDataset(BaseRemoteSensingDataset):
    """
    BRIGHT & UrbanSARFloods loader supporting multimodal optical + SAR
    disaster damage assessment and flood change detection across global events.
    """

    def _initialize(self) -> None:
        self.samples = [
            {
                "event_id": "BRIGHT_NEPAL_FLOOD_01",
                "disaster_type": "FLOOD_AND_DEBRIS",
                "sensor_combination": "SENTINEL1_SAR_AND_SENTINEL2_OPTICAL",
                "pre_event_optical": str(self.root_dir.parent / "demo" / "nepal_2020_t1_optical.png"),
                "post_event_optical": str(self.root_dir.parent / "demo" / "nepal_2026_t2_optical.png"),
                "post_event_sar": str(self.root_dir.parent / "demo" / "sentinel1_2026_sar_flood.png"),
                "ground_truth_change_summary": "Extensive riverbank scouring, mud deposit accumulation, and floodplain submergence.",
            }
        ]

    def get_sample(self, index: int) -> Dict[str, Any]:
        item = self.samples[index % len(self.samples)]
        return {
            "sample_id": item["event_id"],
            "modality": "CROSS_MODAL_TEMPORAL",
            "images": [],
            "metadata": {
                "disaster_type": item["disaster_type"],
                "sensors": item["sensor_combination"],
            },
            "ground_truth": {
                "mask": None,
                "text_captions": [item["ground_truth_change_summary"]],
                "qa_pairs": [
                    ("What caused the high radar backscatter in the northwest?", "Double-bounce scattering from built structures standing above the flood plain.")
                ],
                "bounding_boxes": None,
            }
        }
