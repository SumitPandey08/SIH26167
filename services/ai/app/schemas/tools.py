"""
SatQuery AI — Specialist Tool Contracts, DAG Schemas & Investigation Context
Standard: SIH26167 Remote Sensing Assistant
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Optional, List, Dict, Any, Tuple
from pydantic import BaseModel, Field
import numpy as np

from .metadata import ModalityType, RasterMetadata, QueryUnderstanding
from .evidence import EvidenceNode, Claim, ExecutionStepTrace


class ToolStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    UNAVAILABLE = "unavailable"
    SKIPPED = "skipped"


class ToolOutput(BaseModel):
    type: str  # "change_mask" | "bounding_box" | "polygon" | "statistic" | "preview" | "features"
    path: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None
    statistics: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class ToolResult(BaseModel):
    tool: str
    status: ToolStatus = ToolStatus.SUCCESS
    confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    outputs: List[ToolOutput] = Field(default_factory=list)
    claims: List[Claim] = Field(default_factory=list)
    evidence: List[EvidenceNode] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)
    runtime_ms: float = 0.0
    provenance: str = ""
    error_message: Optional[str] = None


class DAGNode(BaseModel):
    step_number: int
    tool_name: str
    description: str
    dependencies: List[str] = Field(default_factory=list)
    required: bool = True
    estimated_cost_ms: float = 100.0


class AssetRecord(BaseModel):
    asset_id: str
    filepath: str
    role: str  # "primary" | "t1" | "t2" | "optical" | "sar"
    metadata: RasterMetadata
    cached_array: Optional[Any] = Field(default=None, exclude=True)  # in-memory numpy cache


class InvestigationContext(BaseModel):
    investigation_id: str
    query: str
    query_understanding: Optional[QueryUnderstanding] = None
    input_assets: List[AssetRecord] = Field(default_factory=list)
    modalities: List[ModalityType] = Field(default_factory=list)
    candidate_tools: List[str] = Field(default_factory=list)
    selected_tools: List[str] = Field(default_factory=list)
    execution_dag: List[DAGNode] = Field(default_factory=list)
    tool_results: Dict[str, ToolResult] = Field(default_factory=dict)
    evidence_nodes: Dict[str, EvidenceNode] = Field(default_factory=dict)
    claims: List[Claim] = Field(default_factory=list)
    execution_trace: List[ExecutionStepTrace] = Field(default_factory=list)
    confidence_components: Dict[str, float] = Field(default_factory=dict)
    aggregate_confidence: float = Field(default=0.90, ge=0.0, le=1.0)
    warnings: List[str] = Field(default_factory=list)
    answer_markdown: str = ""
    report_metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        arbitrary_types_allowed = True


class RSAnalysisTool(ABC):
    """
    Unified abstract contract for all Remote Sensing specialist tools.
    Every specialist must implement can_run, validate, execute, and explain_result.
    """
    name: str = "base_tool"
    version: str = "1.0.0"
    description: str = "Base remote sensing specialist tool"
    capabilities: List[str] = []
    accepted_modalities: List[ModalityType] = []
    accepted_input_types: List[str] = ["raster", "path"]
    required_metadata: List[str] = []
    output_types: List[str] = []
    resource_requirements: Dict[str, Any] = {"vram_mb": 0, "cpu_cores": 1}
    confidence_characteristics: Dict[str, Any] = {"base_confidence": 0.90}

    @abstractmethod
    def can_run(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        """
        Quick capability check: can this tool run given the context, inputs, and environment?
        """
        pass

    @abstractmethod
    def validate(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        """
        Deep validation of inputs, CRS, resolutions, bands, and prerequisite tool outputs.
        """
        pass

    @abstractmethod
    def execute(self, context: InvestigationContext) -> ToolResult:
        """
        Executes the tool's core specialist algorithm and returns structured ToolResult.
        """
        pass

    @abstractmethod
    def explain_result(self, result: ToolResult) -> str:
        """
        Generates structured, objective natural-language explanation of findings.
        """
        pass
