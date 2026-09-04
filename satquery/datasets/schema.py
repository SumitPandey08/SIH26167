"""SatQuery Unified Remote Sensing Dataset Schema.

Provides normalized data structures for all earth-observation vision-language tasks,
multimodal optical-SAR representations, bi-temporal change sequences, and visual grounding.
"""

from __future__ import annotations
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator


class TaskType(str, Enum):
    """Remote sensing tasks supported across the dataset hub."""
    SCENE_CLASSIFICATION = "scene_classification"
    SCENE_DESCRIPTION = "scene_description"
    CAPTIONING = "captioning"
    VQA = "vqa"
    VISUAL_GROUNDING = "visual_grounding"
    OBJECT_DETECTION = "object_detection"
    TEMPORAL_CHANGE = "temporal_change"
    CHANGE_CAPTIONING = "change_captioning"
    CHANGE_VQA = "change_vqa"
    OPTICAL_SAR = "optical_sar"
    LAND_COVER = "land_cover"
    MULTIMODAL_REPRESENTATION = "multimodal_representation"


class Modality(str, Enum):
    """Supported sensor capture modalities."""
    OPTICAL = "optical"
    SAR = "sar"
    MULTISPECTRAL = "multispectral"
    DEM = "dem"
    HYPERSPECTRAL = "hyperspectral"


class Sensor(str, Enum):
    """Known earth observation satellite and airborne platforms."""
    SENTINEL_1 = "Sentinel-1"
    SENTINEL_2 = "Sentinel-2"
    LANDSAT_8 = "Landsat-8"
    LANDSAT_9 = "Landsat-9"
    GAOFEN_1 = "Gaofen-1"
    GAOFEN_2 = "Gaofen-2"
    PLANETSCOPE = "PlanetScope"
    AIRBORNE_OPTICAL = "Airborne-Optical"
    AIRBORNE_SAR = "Airborne-SAR"
    GENERIC_OPTICAL = "Generic-Optical"
    GENERIC_SAR = "Generic-SAR"


class BoundingBox(BaseModel):
    """Bounding box specification: [ymin, xmin, ymax, xmax]."""
    box_2d: List[float] = Field(
        ...,
        description="Coordinates in [ymin, xmin, ymax, xmax] format. Normalized [0.0, 1.0] by default."
    )
    is_normalized: bool = True
    label: str = Field(default="object", description="Semantic category label.")
    category_id: Optional[int] = None
    confidence: Optional[float] = None

    @field_validator("box_2d")
    @classmethod
    def validate_box_coords(cls, v: List[float]) -> List[float]:
        if len(v) != 4:
            raise ValueError(f"Bounding box must contain exactly 4 coordinates [ymin, xmin, ymax, xmax], got {len(v)}")
        ymin, xmin, ymax, xmax = v
        if ymin > ymax:
            raise ValueError(f"Invalid bounding box: ymin ({ymin}) cannot be greater than ymax ({ymax})")
        if xmin > xmax:
            raise ValueError(f"Invalid bounding box: xmin ({xmin}) cannot be greater than xmax ({xmax})")
        return v

    def to_xml_token(self) -> str:
        """Format as standard tokenized visual grounding string."""
        ymin, xmin, ymax, xmax = self.box_2d
        return f"<box>[{ymin:.2f}, {xmin:.2f}, {ymax:.2f}, {xmax:.2f}]</box>"


class GeoReference(BaseModel):
    """Geospatial coordinates and resolution metadata."""
    bbox: Optional[List[float]] = None  # [min_lon, min_lat, max_lon, max_lat]
    center: Optional[List[float]] = None  # [lon, lat]
    crs: str = "EPSG:4326"
    resolution_m: Optional[float] = None


class UnifiedRemoteSensingExample(BaseModel):
    """Single canonical schema for remote sensing vision-language & multimodal samples."""
    id: str = Field(..., description="Unique sample identifier.")
    dataset: str = Field(..., description="Origin dataset name.")
    split: str = Field(default="train", description="Dataset split (train, val, test, dev).")
    modalities: List[Modality] = Field(default_factory=list, description="Sensor modalities present.")
    sensors: List[Sensor] = Field(default_factory=list, description="Sensors involved.")
    task: TaskType = Field(..., description="Primary benchmark or training task.")
    spatial_resolution_m: Optional[float] = Field(default=None, description="Ground sampling distance in meters.")
    geo_reference: Optional[GeoReference] = None
    acquisition_time: Optional[str] = Field(default=None, description="ISO-8601 acquisition timestamp.")
    acquisition_time_t2: Optional[str] = Field(default=None, description="T2 acquisition timestamp for temporal pairs.")
    
    # Raster file paths
    optical_path: Optional[str] = None
    sar_path: Optional[str] = None
    t1_path: Optional[str] = None
    t2_path: Optional[str] = None
    mask_path: Optional[str] = None

    # Text & Grounding targets
    question: Optional[str] = None
    answer: Optional[str] = None
    caption: Optional[str] = None
    target_boxes: Optional[List[BoundingBox]] = None
    labels: Optional[List[str]] = None
    
    # Arbitrary metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def get_primary_images(self) -> List[str]:
        """Return list of valid image paths for this sample."""
        images = []
        if self.t1_path:
            images.append(self.t1_path)
        if self.t2_path:
            images.append(self.t2_path)
        if not images:
            if self.optical_path:
                images.append(self.optical_path)
            if self.sar_path:
                images.append(self.sar_path)
        return [p for p in images if p]

    def to_vlm_dialogue(self) -> Dict[str, Any]:
        """Convert sample into standardized conversational instruction format."""
        images = self.get_primary_images()
        conversations = []

        if self.task in [TaskType.TEMPORAL_CHANGE, TaskType.CHANGE_CAPTIONING, TaskType.CHANGE_VQA]:
            # Bi-temporal input
            if self.task == TaskType.CHANGE_VQA:
                user_msg = f"Time 1: <image>\nTime 2: <image>\nQuestion: {self.question or 'What changed between T1 and T2?'}"
                assistant_msg = self.answer or "Surface change detected between T1 and T2."
            elif self.task == TaskType.CHANGE_CAPTIONING:
                user_msg = "Time 1: <image>\nTime 2: <image>\nDescribe the environmental or structural changes between Time 1 and Time 2."
                assistant_msg = self.caption or "Between Time 1 and Time 2, land-cover modifications occurred."
            else:
                user_msg = "Time 1: <image>\nTime 2: <image>\nIdentify changed areas between these two satellite captures."
                assistant_msg = self.caption or "Change detection analysis identifies modified areas."
            
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif self.task == TaskType.OPTICAL_SAR:
            user_msg = "Optical: <image>\nSAR (VV/VH): <image>\nAnalyze the fused cross-modal imagery to identify terrain obscured by clouds or radar scatter."
            assistant_msg = self.caption or self.answer or "Cross-modal optical and SAR fusion provides all-weather terrain delineation."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif self.task == TaskType.VISUAL_GROUNDING:
            prompt = self.question or f"Locate all instances of {self.labels[0] if self.labels else 'the target object'}."
            box_tokens = " ".join([b.to_xml_token() for b in (self.target_boxes or [])])
            user_msg = f"<image>\n{prompt}"
            assistant_msg = f"Located target at {box_tokens}." if box_tokens else "No instances detected."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif self.task == TaskType.VQA:
            user_msg = f"<image>\n{self.question or 'What is in this image?'}"
            assistant_msg = self.answer or "Remote sensing scene analysis."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif self.task in [TaskType.CAPTIONING, TaskType.SCENE_DESCRIPTION]:
            user_msg = "<image>\nProvide a detailed remote sensing description of this satellite scene."
            assistant_msg = self.caption or "A remote sensing earth observation image showing surface features."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        else:
            # Classification / Representation / Land Cover
            labels_str = ", ".join(self.labels) if self.labels else "unknown"
            user_msg = "<image>\nIdentify the dominant land cover classes present in this scene."
            assistant_msg = f"The scene exhibits the following classes: {labels_str}."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        return {
            "id": self.id,
            "dataset": self.dataset,
            "split": self.split,
            "task": self.task.value,
            "images": images,
            "conversations": conversations
        }
