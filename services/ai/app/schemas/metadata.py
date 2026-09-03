"""
SatQuery AI — Pydantic Schemas for Raster Metadata & Modalities
Standard: SIH26167 Remote Sensing Assistant
"""

from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field


class ModalityType(str, Enum):
    OPTICAL = "OPTICAL"
    SAR = "SAR"
    MULTISPECTRAL = "MULTISPECTRAL"
    UNKNOWN = "UNKNOWN"


class QueryIntent(str, Enum):
    SINGLE_OPTICAL_ANALYSIS = "SINGLE_OPTICAL_ANALYSIS"
    SINGLE_SAR_ANALYSIS = "SINGLE_SAR_ANALYSIS"
    SINGLE_IMAGE_VQA = "SINGLE_IMAGE_VQA"
    SCENE_CAPTIONING = "SCENE_CAPTIONING"
    REGION_GROUNDING = "REGION_GROUNDING"
    TEMPORAL_CHANGE_DETECTION = "TEMPORAL_CHANGE_DETECTION"
    TEMPORAL_CHANGE_QUANTITATIVE = "TEMPORAL_CHANGE_QUANTITATIVE"
    TEMPORAL_CHANGE_VQA = "TEMPORAL_CHANGE_VQA"
    OPTICAL_SAR_FUSION = "OPTICAL_SAR_FUSION"
    GENERAL_GEOSPATIAL_QUERY = "GENERAL_GEOSPATIAL_QUERY"


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
