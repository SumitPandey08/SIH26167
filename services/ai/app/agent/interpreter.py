"""
SatQuery AI — Agentic Query Interpreter & Intent Classifier
Standard: SIH26167 Remote Sensing Assistant
"""

import logging
from typing import List, Dict, Any, Tuple
from ..schemas.metadata import QueryIntent, ModalityType, RasterMetadata

logger = logging.getLogger("satquery.interpreter")


class QueryInterpreter:
    """
    Parses natural language requests into structured geospatial execution intents.
    Analyzes both the semantic question and the available input image modalities.
    """

    @staticmethod
    def classify_intent(query: str, images: List[Dict[str, Any]]) -> Tuple[QueryIntent, Dict[str, Any]]:
        """
        Classifies intent based on query keywords, question structure, and input raster modalities.
        """
        q = query.lower()
        num_images = len(images)

        roles = [img.get("role", "") for img in images]
        modalities = [img.get("metadata", {}).get("modality", "UNKNOWN") for img in images]

        # Case 1: Cross-Modal Optical + SAR
        has_sar = any(m == "SAR" or "sar" in r for m, r in zip(modalities, roles))
        has_optical = any(m in ["OPTICAL", "MULTISPECTRAL"] or "optical" in r for m, r in zip(modalities, roles))

        if (num_images >= 2 and has_sar and has_optical) or any(k in q for k in ["sar and optical", "optical and sar", "fuse", "radar and optical", "cloud cover"]):
            return QueryIntent.OPTICAL_SAR_FUSION, {
                "target_feature": "water_or_urban",
                "reasoning": "Cross-modal analysis requested with complementary optical and SAR microwave imagery."
            }

        # Case 2: Bi-Temporal Analysis
        is_bitemporal = num_images >= 2 or any(k in q for k in ["change", "changed", "between", "before and after", "compare", "increased", "decreased", "growth", "difference"])

        if is_bitemporal:
            if any(k in q for k in ["how much", "area", "percentage", "km2", "increased by", "decreased by", "stat"]):
                return QueryIntent.TEMPORAL_CHANGE_QUANTITATIVE, {
                    "subtask": "QUANTITATIVE_AREA_DIFFERENCE",
                    "reasoning": "Bi-temporal quantitative physical change measurement requested."
                }
            if any(k in q for k in ["what happened", "what changed", "why", "describe the change"]):
                return QueryIntent.TEMPORAL_CHANGE_VQA, {
                    "subtask": "SEMANTIC_CHANGE_QA",
                    "reasoning": "Bi-temporal change question answering requested."
                }
            return QueryIntent.TEMPORAL_CHANGE_DETECTION, {
                "subtask": "BINARY_AND_CATEGORICAL_CHANGE_MAP",
                "reasoning": "Bi-temporal change mapping requested."
            }

        # Case 3: Single SAR Analysis
        if has_sar or any(k in q for k in ["sar", "backscatter", "radar", "speckle", "sentinel-1", "microwave"]):
            return QueryIntent.SINGLE_SAR_ANALYSIS, {
                "subtask": "SAR_MICROWAVE_PROCESSING",
                "reasoning": "Single SAR image backscatter and flood/structure analysis requested."
            }

        # Case 4: Single Image Grounding
        if any(k in q for k in ["where", "highlight", "locate", "outline", "find", "show me the"]):
            return QueryIntent.REGION_GROUNDING, {
                "subtask": "TEXT_GUIDED_GROUNDING",
                "reasoning": "Spatial region grounding requested with coordinates and bounding boxes."
            }

        # Case 5: Single Image Captioning / Scene Description
        if any(k in q for k in ["describe", "what is visible", "caption", "overview", "what type of land"]):
            return QueryIntent.SCENE_CAPTIONING, {
                "subtask": "DENSE_SCENE_CAPTIONING",
                "reasoning": "Dense remote sensing scene description requested."
            }

        # Default Single Image VQA
        return QueryIntent.SINGLE_IMAGE_VQA, {
            "subtask": "VISUAL_QUESTION_ANSWERING",
            "reasoning": "Single-image visual question answering."
        }
