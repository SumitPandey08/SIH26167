"""
SatQuery AI — Pydantic Schemas for Raster Metadata, Modalities & Structured Query Intent
Standard: SIH26167 Remote Sensing Assistant
"""

from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field


class ModalityType(str, Enum):
    OPTICAL = "OPTICAL"
    SAR = "SAR"
    MULTISPECTRAL = "MULTISPECTRAL"
    OPTICAL_SAR = "OPTICAL_SAR"
    UNKNOWN = "UNKNOWN"


class QueryIntent(str, Enum):
    # Benchmark & Primary Intents
    TEMPORAL_CHANGE_DETECTION = "TEMPORAL_CHANGE_DETECTION"
    TEMPORAL_CHANGE_QUANTITATIVE = "TEMPORAL_CHANGE_QUANTITATIVE"
    TEMPORAL_CHANGE_VQA = "TEMPORAL_CHANGE_VQA"
    OPTICAL_SAR_FUSION = "OPTICAL_SAR_FUSION"
    SINGLE_SAR_ANALYSIS = "SINGLE_SAR_ANALYSIS"
    REGION_GROUNDING = "REGION_GROUNDING"
    SCENE_CAPTIONING = "SCENE_CAPTIONING"
    SINGLE_IMAGE_VQA = "SINGLE_IMAGE_VQA"
    INVESTIGATION = "INVESTIGATION"

    # Canonical Task Names
    TEMPORAL_CHANGE = "TEMPORAL_CHANGE"
    CHANGE_VQA = "CHANGE_VQA"
    CHANGE_DESCRIPTION = "CHANGE_DESCRIPTION"
    OPTICAL_SAR_COMPARISON = "OPTICAL_SAR_COMPARISON"
    OBJECT_GROUNDING = "OBJECT_GROUNDING"
    OBJECT_DETECTION = "OBJECT_DETECTION"
    SCENE_DESCRIPTION = "SCENE_DESCRIPTION"
    WATER_ANALYSIS = "WATER_ANALYSIS"
    VEGETATION_ANALYSIS = "VEGETATION_ANALYSIS"
    SPATIAL_ANALYSIS = "SPATIAL_ANALYSIS"
    GENERAL_REMOTE_SENSING_QA = "GENERAL_REMOTE_SENSING_QA"
    SINGLE_OPTICAL_ANALYSIS = "SINGLE_OPTICAL_ANALYSIS"
    GENERAL_GEOSPATIAL_QUERY = "GENERAL_GEOSPATIAL_QUERY"


class QueryUnderstanding(BaseModel):
    task: str
    target: Optional[str] = None  # e.g., "building", "water", "vegetation", "cloud"
    action: Optional[str] = None  # e.g., "detect", "describe", "compare", "measure"
    modality_hint: Optional[str] = None
    requires_temporal_pair: bool = False
    requires_spatial_evidence: bool = True
    requires_sar: bool = False
    requires_optical: bool = False
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    raw_intent: QueryIntent = QueryIntent.SINGLE_IMAGE_VQA
    reasoning: str = ""


class RasterMetadata(BaseModel):
    filename: str
    filepath: str
    crs: Optional[str] = None
    bbox: Optional[Tuple[float, float, float, float]] = None  # (minx, miny, maxx, maxy)
    width: int
    height: int
    channels: int
    dtype: str
    gsd_m: Optional[float] = None  # Ground Sampling Distance in meters
    acquisition_date: Optional[str] = None
    modality: ModalityType = ModalityType.UNKNOWN
    nodata_value: Optional[float] = None
    statistics: Optional[Dict[str, List[float]]] = None
    sensor_name: Optional[str] = None
    band_names: Optional[List[str]] = None
