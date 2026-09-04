"""
SatQuery AI — Authoritative Remote Sensing Model Registry
Standard: SIH26167 Remote Sensing Assistant
Tracks model metadata, hardware footprints, CPU fallbacks, and operational status.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ModelInfo(BaseModel):
    name: str
    version: str
    license: str
    weights_source: str
    repository: str
    capabilities: List[str]
    input_modality: List[str]
    input_size: str
    gpu_requirement: str
    cpu_fallback: bool
    status: str = Field(description="active | adapter_only | unavailable | fallback | reference_only")
    citation_provenance: str


MODEL_CATALOG: Dict[str, ModelInfo] = {
    "tinycd": ModelInfo(
        name="TinyCD",
        version="1.0.0",
        license="MIT",
        weights_source="Local PyTorch weights / Self-contained Siamese U-Net + MAMB",
        repository="https://github.com/AndreaCodegoni/Tiny_model_4_CD",
        capabilities=["bi_temporal_change_detection", "probability_mapping", "binary_masking"],
        input_modality=["OPTICAL", "MULTISPECTRAL"],
        input_size="Dual (3, H, W)",
        gpu_requirement="Optional (< 1GB VRAM, fully runnable on CPU in < 50ms)",
        cpu_fallback=True,
        status="active",
        citation_provenance="Codegoni et al., 'A (Not So) Deep Learning Model For Change Detection', IEEE GRSL 2022"
    ),
    "sar_lee_filter": ModelInfo(
        name="Enhanced Lee Speckle Filter & dB Calibrator",
        version="1.2.0",
        license="MIT",
        weights_source="Deterministic mathematical operator (SciPy/NumPy)",
        repository="SatQuery Internal Geospatial Core",
        capabilities=["speckle_reduction", "radiometric_calibration", "radar_water_segmentation"],
        input_modality=["SAR"],
        input_size="(1, H, W) or (2, H, W)",
        gpu_requirement="None (CPU vectorized)",
        cpu_fallback=True,
        status="active",
        citation_provenance="Lee, J.S., 'Digital image enhancement and noise filtering by use of local statistics', IEEE PAMI 1980"
    ),
    "spectral_engine": ModelInfo(
        name="Spectral Index Vectorized Engine",
        version="2.0.0",
        license="MIT",
        weights_source="Deterministic multispectral band ratio equations",
        repository="SatQuery Internal Geospatial Core",
        capabilities=["ndvi", "ndwi", "mndwi", "canopy_analysis", "water_delineation"],
        input_modality=["OPTICAL", "MULTISPECTRAL"],
        input_size="(C, H, W)",
        gpu_requirement="None (CPU vectorized)",
        cpu_fallback=True,
        status="active",
        citation_provenance="Rouse et al., 1974 (NDVI); McFeeters, 1996 (NDWI); Xu, 2006 (MNDWI)"
    ),
    "optical_sar_fusion": ModelInfo(
        name="Optical-SAR Dual-Stream Fusion Engine",
        version="1.1.0",
        license="MIT",
        weights_source="Cross-modal backscatter + reflectance fusion pipeline",
        repository="SatQuery Internal Geospatial Core",
        capabilities=["cloud_penetrating_water_mapping", "multimodal_flood_extent", "urban_surface_verification"],
        input_modality=["OPTICAL", "SAR"],
        input_size="Dual co-registered rasters",
        gpu_requirement="None (CPU vectorized)",
        cpu_fallback=True,
        status="active",
        citation_provenance="Schmitt et al., 'SEN12MS: A Dataset for Deep Learning in Remote Sensing', ISPRS 2019"
    ),
    "remoteclip": ModelInfo(
        name="RemoteCLIP",
        version="ViT-B/32",
        license="Apache-2.0 / CC-BY-NC 4.0",
        weights_source="HuggingFace / ChenDelong1999/RemoteCLIP",
        repository="https://github.com/ChenDelong1999/RemoteCLIP",
        capabilities=["zero_shot_retrieval", "semantic_concept_matching", "image_text_alignment"],
        input_modality=["OPTICAL", "MULTISPECTRAL"],
        input_size="(3, 224, 224)",
        gpu_requirement="Low (~600MB VRAM, CPU runnable)",
        cpu_fallback=True,
        status="active",
        citation_provenance="Liu et al., 'RemoteCLIP: A Vision-Language Foundation Model for Remote Sensing', IEEE TGRS 2024"
    ),
    "grounding_dino_mobilesam": ModelInfo(
        name="Grounding DINO + MobileSAM Building Detector",
        version="1.0.0",
        license="Apache-2.0",
        weights_source="Open source weights adapter with high-precision edge fallback",
        repository="https://github.com/ChaoningZhang/MobileSAM",
        capabilities=["open_vocabulary_building_detection", "instance_segmentation", "candidate_bounding_boxes"],
        input_modality=["OPTICAL", "MULTISPECTRAL"],
        input_size="(3, H, W)",
        gpu_requirement="Medium (~2GB VRAM for live neural weights; CPU fallback available)",
        cpu_fallback=True,
        status="active",
        citation_provenance="Zhang et al., 'Faster Segment Anything: Towards Lightweight SAM', arXiv 2023"
    ),
    "geochat": ModelInfo(
        name="GeoChat 7B Remote Sensing VLM",
        version="7B-v1.0",
        license="Apache-2.0 / LLaVA Research",
        weights_source="HuggingFace mbzuai-oryx/GeoChat",
        repository="https://github.com/mbzuai-oryx/GeoChat",
        capabilities=["grounded_vqa", "scene_captioning", "spatial_region_reasoning"],
        input_modality=["OPTICAL", "MULTISPECTRAL"],
        input_size="(3, 512, 512)",
        gpu_requirement="High (14GB VRAM in FP16, 4.5GB in 4-bit)",
        cpu_fallback=True,
        status="adapter_only",
        citation_provenance="Kuckreja et al., 'GeoChat: Grounded Large Vision-Language Model for Remote Sensing', CVPR 2024"
    ),
    "changeformer": ModelInfo(
        name="ChangeFormer",
        version="v1.0",
        license="Apache-2.0",
        weights_source="wgcban/ChangeFormer GitHub",
        repository="https://github.com/wgcban/ChangeFormer",
        capabilities=["transformer_change_detection", "fine_grained_urban_change"],
        input_modality=["OPTICAL"],
        input_size="Dual (3, 256, 256)",
        gpu_requirement="Medium (4GB VRAM)",
        cpu_fallback=False,
        status="unavailable",
        citation_provenance="Bandara & Patel, 'A Transformer-Based Siamese Network for Change Detection', IEEE GRSL 2022"
    )
}


class ModelRegistry:
    @staticmethod
    def get_model(name: str) -> Optional[ModelInfo]:
        return MODEL_CATALOG.get(name.lower())

    @staticmethod
    def list_all_models() -> List[ModelInfo]:
        return list(MODEL_CATALOG.values())

    @staticmethod
    def list_active_models() -> List[ModelInfo]:
        return [m for m in MODEL_CATALOG.values() if m.status == "active"]
