"""
SatQuery AI — Pydantic Schemas for Evidence Engine & Evidence Graph
Standard: SIH26167 Remote Sensing Assistant
"""

from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
from datetime import datetime

from .metadata import QueryIntent, RasterMetadata


class EvidenceNodeType(str, Enum):
    BINARY_SEGMENTATION_MASK = "BINARY_SEGMENTATION_MASK"
    SPATIAL_DIFFERENCE = "SPATIAL_DIFFERENCE"
    BOUNDING_BOX_GROUNDING = "BOUNDING_BOX_GROUNDING"
    SPECTRAL_INDEX_HEATMAP = "SPECTRAL_INDEX_HEATMAP"
    SAR_BACKSCATTER_MAP = "SAR_BACKSCATTER_MAP"
    NUMERICAL_MEASUREMENT = "NUMERICAL_MEASUREMENT"
    OBJECT_POLYGON = "OBJECT_POLYGON"
    MODEL_OUTPUT = "MODEL_OUTPUT"


class SpatialMetric(BaseModel):
    pixel_count: Optional[int] = None
    area_m2: Optional[float] = None
    area_km2: Optional[float] = None
    delta_area_km2: Optional[float] = None
    percentage_change: Optional[float] = None
    mean_confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    centroid: Optional[Tuple[float, float]] = None  # (longitude, latitude) or (x, y)
    cluster_count: Optional[int] = None
    additional_stats: Optional[Dict[str, Any]] = None


class EvidenceNode(BaseModel):
    node_id: str
    type: EvidenceNodeType
    title: str
    timestamp: Optional[str] = None
    model_provenance: str
    metric: SpatialMetric
    raster_uri: Optional[str] = None
    vector_geojson_uri: Optional[str] = None
    preview_png_uri: Optional[str] = None
    raw_bounding_box: Optional[Tuple[float, float, float, float]] = None  # (ymin, xmin, ymax, xmax)
    source_tool: Optional[str] = None
    source_model: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None
    asset: Optional[str] = None
    confidence: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None


class Claim(BaseModel):
    claim_id: str
    statement: str
    status: str = Field(default="VERIFIED", description="VERIFIED | PARTIALLY_SUPPORTED | INSUFFICIENT_EVIDENCE | UNSUPPORTED")
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    supporting_evidence_nodes: List[str] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    supporting_tools: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class ExecutionStepTrace(BaseModel):
    step_number: int
    tool_name: str
    status: str = Field(default="SUCCESS", description="PENDING | RUNNING | SUCCESS | FAILED | SKIPPED | UNAVAILABLE")
    duration_ms: float
    parameters: Dict[str, Any] = Field(default_factory=dict)
    output_summary: Optional[str] = None
    error: Optional[str] = None


class EvidenceGraph(BaseModel):
    investigation_id: str
    query: str
    intent: QueryIntent
    spatial_context: Optional[Dict[str, Any]] = None
    claims: List[Claim] = Field(default_factory=list)
    evidence_nodes: Dict[str, EvidenceNode] = Field(default_factory=dict)
    execution_trace: List[ExecutionStepTrace] = Field(default_factory=list)
    confidence_breakdown: Optional[Dict[str, float]] = None
    aggregate_confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    provenance: Optional[List[str]] = None
    warnings: List[str] = Field(default_factory=list)
    answer_markdown: str
    generated_at: str


class AnalysisRequest(BaseModel):
    investigation_id: str
    query: str
    images: List[Dict[str, Any]]  # [{"filepath": str, "role": str, "metadata": dict}]
    enable_cloud_adapters: bool = False
    requested_mode: Optional[str] = None  # "standard" | "investigation"


class AnalysisResponse(BaseModel):
    status: str
    evidence_graph: EvidenceGraph
