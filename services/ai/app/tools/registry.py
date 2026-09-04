"""
SatQuery AI — Centralized Specialist Tool Registry & Capability Scorer
Standard: SIH26167 Remote Sensing Assistant
Maintains authoritative registry of all 24 Remote Sensing specialist tools.
"""

import logging
from typing import Dict, Any, List, Optional, Tuple

from ..schemas.tools import RSAnalysisTool, DAGNode, InvestigationContext
from ..schemas.metadata import ModalityType, QueryUnderstanding, QueryIntent

# Import all 24 specialists
from .specialists.validators import (
    ImageValidator,
    MetadataReader,
    GeoTIFFInspector,
    ImagePreprocessor,
    CRSValidator,
    TemporalPairValidator,
    CoRegistrationValidator,
    OpticalNormalizer,
)
from .specialists.sar_tools import (
    SARPreprocessor,
    SARLeeFilter,
    OpticalSARTool,
)
from .specialists.change_tools import (
    ChangeDetectionTool,
    ChangeVQATool,
)
from .specialists.vision_tools import (
    BuildingDetectionTool,
    GroundingTool,
    SegmentationTool,
    VQATool,
    CaptioningTool,
    RemoteCLIPMatcher,
)
from .specialists.spectral_tools import (
    WaterDetectionTool,
    VegetationAnalysisTool,
    SpatialStatisticsTool,
)
from .specialists.evidence_tools import (
    EvidenceRenderer,
    EvidenceVerifier,
    ReportGenerator,
)

logger = logging.getLogger("satquery.tool_registry")


class SpecialistToolRegistry:
    """
    Central repository for all remote sensing analytical tools.
    Provides capability scoring, dynamic DAG resolution, and resource audits.
    """
    def __init__(self):
        self._tools: Dict[str, RSAnalysisTool] = {}
        self._register_all_specialists()

    def _register_all_specialists(self):
        all_tools = [
            # 1-8 Input & Geospatial Validation
            ImageValidator(),
            MetadataReader(),
            GeoTIFFInspector(),
            ImagePreprocessor(),
            CRSValidator(),
            TemporalPairValidator(),
            CoRegistrationValidator(),
            OpticalNormalizer(),
            # 9-10 SAR Processing
            SARPreprocessor(),
            SARLeeFilter(),
            # 11 Change Detection
            ChangeDetectionTool(),
            # 12-16 Vision, Buildings & VQA
            BuildingDetectionTool(),
            GroundingTool(),
            SegmentationTool(),
            VQATool(),
            CaptioningTool(),
            RemoteCLIPMatcher(),
            # 17 Change VQA
            ChangeVQATool(),
            # 18 Cross-Modal Fusion
            OpticalSARTool(),
            # 19-21 Spectral & Spatial Analytics
            WaterDetectionTool(),
            VegetationAnalysisTool(),
            SpatialStatisticsTool(),
            # 22-24 Evidence & Reporting
            EvidenceRenderer(),
            EvidenceVerifier(),
            ReportGenerator(),
        ]
        for t in all_tools:
            self._tools[t.name] = t
        logger.info(f"✓ Initialized SpecialistToolRegistry with {len(self._tools)} tools.")

    def get_tool(self, name: str) -> Optional[RSAnalysisTool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t.name,
                "version": t.version,
                "description": t.description,
                "capabilities": t.capabilities,
                "accepted_modalities": [m.value for m in t.accepted_modalities],
                "resource_requirements": t.resource_requirements,
            }
            for t in self._tools.values()
        ]

    def score_tools_for_task(
        self,
        qu: QueryUnderstanding,
        modalities: List[ModalityType],
        num_assets: int
    ) -> List[Tuple[float, str]]:
        """
        Calculates relevance scores [0.0 - 1.0] for candidate tools based on query intent, target, and input modalities.
        """
        scores: Dict[str, float] = {}
        task = qu.task
        target = (qu.target or "").lower()

        for name, tool in self._tools.items():
            score = 0.1  # base score

            # Universal tools
            if name in ["ImageValidator", "MetadataReader", "ImagePreprocessor", "EvidenceVerifier", "EvidenceRenderer"]:
                score = 0.95

            # Modality match
            if any(m in tool.accepted_modalities for m in modalities):
                score += 0.2

            # Task-specific scoring
            if task in ["TEMPORAL_CHANGE", "TEMPORAL_CHANGE_QUANTITATIVE"] and num_assets >= 2:
                if name in ["TemporalPairValidator", "CoRegistrationValidator", "ChangeDetectionTool"]:
                    score = 0.99
                if target == "building" and name == "BuildingDetectionTool":
                    score = 0.98

            elif task == "CHANGE_VQA" and num_assets >= 2:
                if name in ["TemporalPairValidator", "CoRegistrationValidator", "ChangeDetectionTool", "ChangeVQATool"]:
                    score = 0.99
                if target == "building" and name == "BuildingDetectionTool":
                    score = 0.98

            elif task in ["OPTICAL_SAR_COMPARISON", "OPTICAL_SAR_FUSION"]:
                if name in ["OpticalSARTool", "SARPreprocessor", "SARLeeFilter"]:
                    score = 0.99

            elif task == "SINGLE_SAR_ANALYSIS":
                if name in ["SARPreprocessor", "SARLeeFilter"]:
                    score = 0.99

            elif task in ["OBJECT_GROUNDING", "REGION_GROUNDING"]:
                if name in ["GroundingTool", "SegmentationTool"]:
                    score = 0.99
                if target == "building" and name == "BuildingDetectionTool":
                    score = 0.99

            elif task in ["SCENE_DESCRIPTION", "SCENE_CAPTIONING"]:
                if name in ["CaptioningTool", "VQATool", "VegetationAnalysisTool", "WaterDetectionTool"]:
                    score = 0.95

            elif task == "WATER_ANALYSIS":
                if name == "WaterDetectionTool":
                    score = 0.99

            elif task == "VEGETATION_ANALYSIS":
                if name == "VegetationAnalysisTool":
                    score = 0.99

            elif task == "INVESTIGATION":
                # Investigation mode runs all relevant specialists
                score = 0.90

            scores[name] = min(round(score, 2), 1.0)

        # Sort descending
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return ranked

    def build_execution_dag(
        self,
        qu: QueryUnderstanding,
        modalities: List[ModalityType],
        num_assets: int,
        is_investigation: bool = False
    ) -> List[DAGNode]:
        """
        Constructs an ordered Execution DAG of specialist tools.
        """
        dag: List[DAGNode] = []
        step = 1

        # Phase 1: Ingestion & Validation
        dag.append(DAGNode(step_number=step, tool_name="ImageValidator", description="Verify file integrity and headers")); step += 1
        dag.append(DAGNode(step_number=step, tool_name="MetadataReader", description="Read sensor metadata and GSD", dependencies=["ImageValidator"])); step += 1
        dag.append(DAGNode(step_number=step, tool_name="ImagePreprocessor", description="Load normalized raster array into memory", dependencies=["MetadataReader"])); step += 1

        # Investigation Mode: Auto-composite deep investigation
        if is_investigation:
            if num_assets >= 2 and any(m == ModalityType.SAR for m in modalities) and any(m == ModalityType.OPTICAL for m in modalities):
                dag.append(DAGNode(step_number=step, tool_name="OpticalSARTool", description="Cross-modal cloud-penetrating water delineation")); step += 1
            elif num_assets >= 2:
                dag.append(DAGNode(step_number=step, tool_name="TemporalPairValidator", description="Check temporal pairing")); step += 1
                dag.append(DAGNode(step_number=step, tool_name="CoRegistrationValidator", description="Verify spatial alignment")); step += 1
                dag.append(DAGNode(step_number=step, tool_name="ChangeDetectionTool", description="TinyCD bi-temporal change detection")); step += 1
                dag.append(DAGNode(step_number=step, tool_name="BuildingDetectionTool", description="Building footprint change intersection")); step += 1
            else:
                dag.append(DAGNode(step_number=step, tool_name="WaterDetectionTool", description="NDWI water delineation")); step += 1
                dag.append(DAGNode(step_number=step, tool_name="VegetationAnalysisTool", description="NDVI canopy analysis")); step += 1
                dag.append(DAGNode(step_number=step, tool_name="BuildingDetectionTool", description="Building footprint detection")); step += 1

            dag.append(DAGNode(step_number=step, tool_name="SpatialStatisticsTool", description="Aggregate spatial surface measurements")); step += 1
            dag.append(DAGNode(step_number=step, tool_name="EvidenceRenderer", description="Render visual overlays and masks")); step += 1
            dag.append(DAGNode(step_number=step, tool_name="EvidenceVerifier", description="Zero-hallucination claim verification")); step += 1
            dag.append(DAGNode(step_number=step, tool_name="ReportGenerator", description="Compile scientific dossier")); step += 1
            return dag

        # Standard Targeted Modes
        task = qu.task
        target = (qu.target or "").lower()

        # Multi-temporal
        if task in ["TEMPORAL_CHANGE", "TEMPORAL_CHANGE_QUANTITATIVE", "CHANGE_VQA"] or (num_assets >= 2 and "sar" not in [m.value.lower() for m in modalities]):
            dag.append(DAGNode(step_number=step, tool_name="TemporalPairValidator", description="Validate temporal image pairing")); step += 1
            dag.append(DAGNode(step_number=step, tool_name="CoRegistrationValidator", description="Measure spatial alignment and resolution ratio")); step += 1
            dag.append(DAGNode(step_number=step, tool_name="ChangeDetectionTool", description="Execute TinyCD Siamese U-Net + MAMB inference")); step += 1

            if target == "building" or "building" in qu.reasoning.lower():
                dag.append(DAGNode(step_number=step, tool_name="BuildingDetectionTool", description="Intersect candidate building footprints with change mask")); step += 1

            if task == "CHANGE_VQA":
                dag.append(DAGNode(step_number=step, tool_name="ChangeVQATool", description="Grounded temporal change QA explanation")); step += 1

        # Optical + SAR
        elif task in ["OPTICAL_SAR_COMPARISON", "OPTICAL_SAR_FUSION"] or (num_assets >= 2 and any(m == ModalityType.SAR for m in modalities)):
            dag.append(DAGNode(step_number=step, tool_name="SARPreprocessor", description="Calibrate SAR amplitude to decibels")); step += 1
            dag.append(DAGNode(step_number=step, tool_name="OpticalSARTool", description="Execute dual-stream cloud-penetrating water delineation")); step += 1

        # Single SAR
        elif task == "SINGLE_SAR_ANALYSIS" or (num_assets == 1 and modalities and modalities[0] == ModalityType.SAR):
            dag.append(DAGNode(step_number=step, tool_name="SARPreprocessor", description="Extract polarization and calibrate dB")); step += 1
            dag.append(DAGNode(step_number=step, tool_name="SARLeeFilter", description="Enhanced Lee speckle filter and backscatter segmentation")); step += 1

        # Buildings / Grounding
        elif task in ["OBJECT_GROUNDING", "OBJECT_DETECTION"] or target == "building":
            dag.append(DAGNode(step_number=step, tool_name="BuildingDetectionTool", description="Isolate candidate building footprints")); step += 1

        elif task == "WATER_ANALYSIS":
            dag.append(DAGNode(step_number=step, tool_name="WaterDetectionTool", description="NDWI water delineation")); step += 1

        elif task == "VEGETATION_ANALYSIS":
            dag.append(DAGNode(step_number=step, tool_name="VegetationAnalysisTool", description="NDVI canopy biomass analysis")); step += 1

        # Default Single VQA / Scene Description
        else:
            dag.append(DAGNode(step_number=step, tool_name="VQATool", description="Remote sensing VQA and scene grounding")); step += 1

        # Final Verification & Aggregation
        dag.append(DAGNode(step_number=step, tool_name="SpatialStatisticsTool", description="Aggregate spatial surface measurements")); step += 1
        dag.append(DAGNode(step_number=step, tool_name="EvidenceRenderer", description="Render visual overlays and masks")); step += 1
        dag.append(DAGNode(step_number=step, tool_name="EvidenceVerifier", description="Zero-hallucination claim verification")); step += 1
        dag.append(DAGNode(step_number=step, tool_name="ReportGenerator", description="Compile scientific dossier")); step += 1

        return dag


# Global singleton instance
tool_registry = SpecialistToolRegistry()
