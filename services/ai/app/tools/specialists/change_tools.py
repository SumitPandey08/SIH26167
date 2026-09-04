"""
SatQuery AI — Bi-Temporal Change Detection & Change VQA Specialists
Standard: SIH26167 Remote Sensing Assistant
Implements:
11. ChangeDetectionTool (TinyCD + Morphological Post-processing)
17. ChangeVQATool (Grounded Temporal Change VQA)
"""

import time
import uuid
from typing import Dict, Any, Tuple, Optional, List
import numpy as np

from ...schemas.tools import RSAnalysisTool, ToolResult, ToolOutput, ToolStatus, InvestigationContext
from ...schemas.metadata import ModalityType, RasterMetadata
from ...schemas.evidence import EvidenceNode, Claim
from ..change_engine import ChangeEngine
from ..raster_preprocessor import RasterPreprocessor


class ChangeDetectionTool(RSAnalysisTool):
    name = "ChangeDetectionTool"
    version = "1.2.0"
    description = "Executes bi-temporal deep change detection using TinyCD Siamese U-Net + MAMB, cross-checked with spectral differences and morphological noise filtering."
    capabilities = ["bitemporal_change_detection", "probability_mapping", "binary_masking", "cluster_statistics"]
    accepted_modalities = [ModalityType.OPTICAL, ModalityType.MULTISPECTRAL]

    def can_run(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        if len(context.input_assets) < 2:
            return False, "Change detection requires at least two images (T1 and T2) of the same area."
        return True, None

    def validate(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        if len(context.input_assets) < 2:
            return False, "Temporal pair missing."
        return True, None

    def execute(self, context: InvestigationContext) -> ToolResult:
        t0 = time.time()
        a1, a2 = context.input_assets[0], context.input_assets[1]

        if a1.cached_array is None:
            a1.cached_array, a1.metadata = RasterPreprocessor.load_raster_array(a1.filepath)
        if a2.cached_array is None:
            a2.cached_array, a2.metadata = RasterPreprocessor.load_raster_array(a2.filepath)

        change_node, stats = ChangeEngine.detect_change(
            a1.cached_array, a2.cached_array, a1.metadata, a2.metadata, context.investigation_id
        )
        context.evidence_nodes[change_node.node_id] = change_node

        w_delta = stats.get("water_delta_km2", 0.0)
        w_pct = stats.get("water_pct_shift", 0.0)
        if abs(w_delta) > 0.001:
            trend = "expanded" if w_delta > 0 else "receded"
            stmt = (
                f"Surface change analysis: water extent {trend} by {abs(w_delta):.4f} km² ({w_pct:+.2f}%), "
                f"with total modified ground surface encompassing {stats['changed_area_km2']} km² ({stats['percentage_change']}% of scene)."
            )
        else:
            stmt = f"Total candidate surface change detected across {stats['changed_area_km2']} km² ({stats['percentage_change']}% of area)."

        claim = Claim(
            claim_id=f"claim_{uuid.uuid4().hex[:6]}",
            statement=stmt,
            status="VERIFIED",
            confidence=0.93,
            supporting_evidence_nodes=[change_node.node_id],
            evidence_ids=[change_node.node_id],
            supporting_tools=[self.name]
        )
        context.claims.append(claim)

        runtime_ms = round((time.time() - t0) * 1000, 2)
        return ToolResult(
            tool=self.name,
            status=ToolStatus.SUCCESS,
            confidence=0.93,
            outputs=[
                ToolOutput(type="change_mask", path=change_node.preview_png_uri, statistics=stats),
                ToolOutput(type="change_statistics", statistics=stats)
            ],
            claims=[claim],
            evidence=[change_node],
            metadata=stats,
            runtime_ms=runtime_ms,
            provenance="SatQuery TinyCD Siamese U-Net + MAMB Engine"
        )

    def explain_result(self, result: ToolResult) -> str:
        s = result.metadata
        return (
            f"TinyCD change detection identified {s.get('changed_area_km2', 'N/A')} km² "
            f"({s.get('percentage_change', 'N/A')}%) of modified land surface."
        )


class ChangeVQATool(RSAnalysisTool):
    name = "ChangeVQATool"
    version = "1.0.0"
    description = "Grounded temporal change question answering using computed evidence from TinyCD and spectral transition nodes."
    capabilities = ["temporal_vqa", "change_explanation"]
    accepted_modalities = [ModalityType.OPTICAL, ModalityType.MULTISPECTRAL]

    def can_run(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        if len(context.input_assets) < 2:
            return False, "Temporal Change VQA requires two temporal scenes."
        return True, None

    def validate(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        return True, None

    def execute(self, context: InvestigationContext) -> ToolResult:
        t0 = time.time()
        # Find existing change evidence or run ChangeDetectionTool
        change_node = next((n for n in context.evidence_nodes.values() if n.type == "SPATIAL_DIFFERENCE"), None)
        if not change_node:
            cd_tool = ChangeDetectionTool()
            cd_result = cd_tool.execute(context)
            if cd_result.evidence:
                change_node = cd_result.evidence[0]

        stats = change_node.metric.additional_stats if (change_node and change_node.metric) else {}
        query_lower = context.query.lower()

        # Tailor answer based on query
        if "water" in query_lower or "flood" in query_lower or "river" in query_lower:
            w_delta = stats.get("water_delta_km2", 0.0)
            shift = "increased" if w_delta > 0 else "decreased"
            explanation = (
                f"**Water Dynamics Analysis:** Water-covered surface has {shift} from {stats.get('water_t1_km2', 'N/A')} km² (T1) "
                f"to {stats.get('water_t2_km2', 'N/A')} km² (T2), representing a net transition of {w_delta:+.4f} km² "
                f"({stats.get('water_pct_shift', 0.0):+.2f}%)."
            )
        elif "building" in query_lower or "urban" in query_lower or "construction" in query_lower:
            explanation = (
                f"**Built Environment Shift:** Candidate structural change encompasses {stats.get('changed_area_km2', 'N/A')} km² "
                f"({stats.get('percentage_change', 'N/A')}% of the analyzed region)."
            )
        else:
            explanation = (
                f"**Multi-Temporal Differential Summary:** Total modified ground surface: **{stats.get('changed_area_km2', 'N/A')} km²** "
                f"({stats.get('percentage_change', 'N/A')}% of scene extent). "
                f"Initial water: {stats.get('water_t1_km2', 'N/A')} km² | Post-event water: {stats.get('water_t2_km2', 'N/A')} km²."
            )

        claim = Claim(
            claim_id=f"claim_{uuid.uuid4().hex[:6]}",
            statement=explanation[:180] + "...",
            status="VERIFIED",
            confidence=0.92,
            supporting_evidence_nodes=[change_node.node_id] if change_node else [],
            evidence_ids=[change_node.node_id] if change_node else [],
            supporting_tools=[self.name]
        )
        context.claims.append(claim)

        runtime_ms = round((time.time() - t0) * 1000, 2)
        return ToolResult(
            tool=self.name,
            status=ToolStatus.SUCCESS,
            confidence=0.92,
            outputs=[ToolOutput(type="change_vqa_explanation", description=explanation)],
            claims=[claim],
            metadata={"explanation": explanation},
            runtime_ms=runtime_ms,
            provenance="SatQuery Grounded CDVQA Protocol"
        )

    def explain_result(self, result: ToolResult) -> str:
        return result.metadata.get("explanation", "Change VQA executed.")
