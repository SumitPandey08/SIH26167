"""
SatQuery AI — Agentic Query Interpreter & Structured Understanding
Standard: SIH26167 Remote Sensing Assistant
Extracts task, target, action, temporal/spatial requirements, and confidence.
"""

import re
import logging
from typing import List, Dict, Any, Tuple
from ..schemas.metadata import QueryIntent, ModalityType, QueryUnderstanding, RasterMetadata

logger = logging.getLogger("satquery.interpreter")


class QueryInterpreter:
    """
    Parses natural language requests into structured geospatial execution tasks and parameters.
    """

    @staticmethod
    def understand_query(query: str, images: List[Dict[str, Any]], requested_mode: str = "standard") -> QueryUnderstanding:
        """
        Extracts structured task, target, action, temporal, and spatial requirements.
        """
        q = query.lower().strip()
        num_images = len(images)

        roles = [img.get("role", "") for img in images]
        modalities = [img.get("metadata", {}).get("modality", "UNKNOWN") for img in images]

        has_sar = any(m == "SAR" or "sar" in r.lower() or "sar" in img.get("filepath", "").lower() for m, r, img in zip(modalities, roles, images))
        has_optical = any(m in ["OPTICAL", "MULTISPECTRAL"] or "optical" in r.lower() or "opt" in img.get("filepath", "").lower() for m, r, img in zip(modalities, roles, images))

        # Investigation mode override
        if requested_mode == "investigation" or any(k in q for k in ["investigate this area", "investigate area", "deep survey", "full audit"]):
            return QueryUnderstanding(
                task="INVESTIGATION",
                target="multi_hazard_and_infrastructure",
                action="comprehensive_investigation",
                requires_temporal_pair=(num_images >= 2),
                requires_spatial_evidence=True,
                requires_sar=has_sar,
                requires_optical=has_optical,
                confidence=0.98,
                raw_intent=QueryIntent.INVESTIGATION,
                reasoning="Automated multi-criteria remote sensing area investigation requested."
            )

        # Extract target object/feature
        target = None
        if any(w in q for w in ["building", "buildings", "house", "houses", "urban", "roof", "settlement", "construction"]):
            target = "building"
        elif any(w in q for w in ["water", "river", "flood", "flooding", "lake", "reservoir", "inundat"]):
            target = "water"
        elif any(w in q for w in ["vegetation", "forest", "crop", "tree", "canopy", "agriculture"]):
            target = "vegetation"
        elif any(w in q for w in ["cloud", "clouds", "haze"]):
            target = "cloud"

        # Extract action
        action = "analyze"
        if any(w in q for w in ["where", "locate", "highlight", "outline", "find"]):
            action = "ground"
        elif any(w in q for w in ["describe", "overview", "what is in", "what is visible"]):
            action = "describe"
        elif any(w in q for w in ["how much", "percentage", "area", "measure", "stat"]):
            action = "measure"
        elif any(w in q for w in ["change", "changed", "compare", "increased", "decreased", "between"]):
            action = "compare"

        # Optical + SAR comparison / fusion
        if (num_images >= 2 and has_sar and has_optical) or any(k in q for k in ["sar and optical", "optical and sar", "fuse", "radar and optical", "cloud cover", "obscured in optical", "visible in sar"]):
            return QueryUnderstanding(
                task="OPTICAL_SAR_COMPARISON",
                target=target or "water",
                action="cross_modal_fusion",
                requires_temporal_pair=False,
                requires_spatial_evidence=True,
                requires_sar=True,
                requires_optical=True,
                confidence=0.96,
                raw_intent=QueryIntent.OPTICAL_SAR_FUSION,
                reasoning="Cross-modal analysis requested with complementary optical and SAR microwave imagery."
            )

        # Temporal change queries
        is_temporal = num_images >= 2 or any(k in q for k in [
            "change", "changed", "between", "before and after", "compare", "increased", "decreased", "growth", "difference", "increase"
        ])

        if is_temporal:
            if target == "building":
                return QueryUnderstanding(
                    task="TEMPORAL_CHANGE",
                    target="building",
                    action="detect_and_intersect",
                    requires_temporal_pair=True,
                    requires_spatial_evidence=True,
                    requires_sar=has_sar,
                    requires_optical=True,
                    confidence=0.95,
                    raw_intent=QueryIntent.TEMPORAL_CHANGE_DETECTION,
                    reasoning="Bi-temporal building footprint change detection and intersection requested."
                )

            if any(k in q for k in ["how much", "area", "percentage", "km2", "increased by", "decreased by", "stat"]):
                return QueryUnderstanding(
                    task="TEMPORAL_CHANGE_QUANTITATIVE",
                    target=target or "surface",
                    action="measure",
                    requires_temporal_pair=True,
                    requires_spatial_evidence=True,
                    confidence=0.95,
                    raw_intent=QueryIntent.TEMPORAL_CHANGE_QUANTITATIVE,
                    reasoning="Bi-temporal quantitative physical change measurement requested."
                )

            if any(k in q for k in ["why", "what happened", "describe the change", "explain the change", "did buildings"]):
                return QueryUnderstanding(
                    task="CHANGE_VQA",
                    target=target or "surface",
                    action="explain",
                    requires_temporal_pair=True,
                    requires_spatial_evidence=True,
                    confidence=0.93,
                    raw_intent=QueryIntent.TEMPORAL_CHANGE_VQA,
                    reasoning="Bi-temporal change visual question answering requested."
                )

            return QueryUnderstanding(
                task="TEMPORAL_CHANGE",
                target=target or "surface",
                action="detect",
                requires_temporal_pair=True,
                requires_spatial_evidence=True,
                confidence=0.94,
                raw_intent=QueryIntent.TEMPORAL_CHANGE_DETECTION,
                reasoning="Bi-temporal differential change mapping requested."
            )

        # Single SAR analysis
        if has_sar or any(k in q for k in ["sar", "backscatter", "radar", "speckle", "sentinel-1", "microwave"]):
            return QueryUnderstanding(
                task="SINGLE_SAR_ANALYSIS",
                target=target or "backscatter",
                action="filter_and_calibrate",
                requires_temporal_pair=False,
                requires_spatial_evidence=True,
                requires_sar=True,
                requires_optical=False,
                confidence=0.94,
                raw_intent=QueryIntent.SINGLE_SAR_ANALYSIS,
                reasoning="Single SAR image backscatter and flood/structure analysis requested."
            )

        # Grounding
        if action == "ground":
            return QueryUnderstanding(
                task="OBJECT_GROUNDING",
                target=target or "feature",
                action="ground",
                requires_temporal_pair=False,
                requires_spatial_evidence=True,
                requires_sar=False,
                requires_optical=True,
                confidence=0.92,
                raw_intent=QueryIntent.REGION_GROUNDING,
                reasoning="Spatial region grounding requested with coordinates and bounding boxes."
            )

        # Captioning
        if action == "describe":
            return QueryUnderstanding(
                task="SCENE_DESCRIPTION",
                target="scene",
                action="describe",
                requires_temporal_pair=False,
                requires_spatial_evidence=True,
                requires_sar=False,
                requires_optical=True,
                confidence=0.92,
                raw_intent=QueryIntent.SCENE_CAPTIONING,
                reasoning="Dense remote sensing scene description requested."
            )

        # Target-specific single image queries
        if target == "water":
            return QueryUnderstanding(
                task="WATER_ANALYSIS",
                target="water",
                action="detect",
                requires_temporal_pair=False,
                requires_spatial_evidence=True,
                confidence=0.94,
                raw_intent=QueryIntent.SINGLE_IMAGE_VQA,
                reasoning="Water body delineation via spectral NDWI."
            )

        if target == "vegetation":
            return QueryUnderstanding(
                task="VEGETATION_ANALYSIS",
                target="vegetation",
                action="detect",
                requires_temporal_pair=False,
                requires_spatial_evidence=True,
                confidence=0.94,
                raw_intent=QueryIntent.SINGLE_IMAGE_VQA,
                reasoning="Photosynthetic canopy vegetation analysis via NDVI."
            )

        # Default Single Image VQA
        return QueryUnderstanding(
            task="SINGLE_IMAGE_VQA",
            target=target or "general",
            action="answer",
            requires_temporal_pair=False,
            requires_spatial_evidence=True,
            confidence=0.90,
            raw_intent=QueryIntent.SINGLE_IMAGE_VQA,
            reasoning="Single-image remote sensing visual question answering."
        )

    @staticmethod
    def classify_intent(query: str, images: List[Dict[str, Any]]) -> Tuple[QueryIntent, Dict[str, Any]]:
        """
        Backward-compatible wrapper for existing callers and benchmark tests.
        """
        qu = QueryInterpreter.understand_query(query, images)
        return qu.raw_intent, {
            "subtask": qu.task,
            "target": qu.target,
            "action": qu.action,
            "reasoning": qu.reasoning,
            "confidence": qu.confidence
        }
