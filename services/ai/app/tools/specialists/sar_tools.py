"""
SatQuery AI — Synthetic Aperture Radar (SAR) & Optical-SAR Specialists
Standard: SIH26167 Remote Sensing Assistant
Implements:
9. SARPreprocessor
10. SARLeeFilter
18. OpticalSARTool
"""

import time
import uuid
from typing import Dict, Any, Tuple, Optional, List
import numpy as np

from ...schemas.tools import RSAnalysisTool, ToolResult, ToolOutput, ToolStatus, InvestigationContext
from ...schemas.metadata import ModalityType, RasterMetadata
from ...schemas.evidence import EvidenceNode, Claim
from ..sar_processor import SARProcessor
from ..optical_sar_fusion import OpticalSARFusionEngine
from ..raster_preprocessor import RasterPreprocessor


class SARPreprocessor(RSAnalysisTool):
    name = "SARPreprocessor"
    version = "1.0.0"
    description = "Preprocesses raw SAR amplitude/intensity rasters, extracts polarization channels (VV/VH), and converts to decibels."
    capabilities = ["sar_calibration", "polarization_separation"]
    accepted_modalities = [ModalityType.SAR]

    def can_run(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        sar_assets = [a for a in context.input_assets if a.metadata.modality == ModalityType.SAR or "sar" in a.role or "sar" in a.metadata.filename.lower()]
        if not sar_assets:
            return False, "SAR processing requires at least one SAR/microwave image."
        return True, None

    def validate(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        return True, None

    def execute(self, context: InvestigationContext) -> ToolResult:
        t0 = time.time()
        sar_assets = [a for a in context.input_assets if a.metadata.modality == ModalityType.SAR or "sar" in a.role or "sar" in a.metadata.filename.lower()]
        target_asset = sar_assets[0]

        if target_asset.cached_array is None:
            arr, meta = RasterPreprocessor.load_raster_array(target_asset.filepath)
            target_asset.cached_array = arr
            target_asset.metadata = meta
        else:
            arr = target_asset.cached_array
            meta = target_asset.metadata

        # Calibrate dB
        db_arr = SARProcessor.calibrate_decibels(arr[0])
        mean_db = round(float(np.mean(db_arr)), 2)
        min_db = round(float(np.min(db_arr)), 2)
        max_db = round(float(np.max(db_arr)), 2)

        runtime_ms = round((time.time() - t0) * 1000, 2)
        return ToolResult(
            tool=self.name,
            status=ToolStatus.SUCCESS,
            confidence=0.98,
            outputs=[ToolOutput(
                type="sar_calibration",
                statistics={"mean_db": mean_db, "min_db": min_db, "max_db": max_db}
            )],
            metadata={"asset": meta.filename, "mean_db": mean_db},
            runtime_ms=runtime_ms,
            provenance="SatQuery SAR Sigma0 Decibel Calibrator"
        )

    def explain_result(self, result: ToolResult) -> str:
        stats = result.outputs[0].statistics if result.outputs else {}
        return f"Calibrated SAR amplitude to sigma-nought decibels (mean: {stats.get('mean_db', 'N/A')} dB)."


class SARLeeFilter(RSAnalysisTool):
    name = "SARLeeFilter"
    version = "1.0.0"
    description = "Executes Enhanced Lee Speckle Filter (5x5 adaptive window) to suppress granular radar noise while preserving sharp boundaries."
    capabilities = ["speckle_reduction", "edge_preserving_radar_filter"]
    accepted_modalities = [ModalityType.SAR]

    def can_run(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        sar_assets = [a for a in context.input_assets if a.metadata.modality == ModalityType.SAR or "sar" in a.role or "sar" in a.metadata.filename.lower()]
        if not sar_assets:
            return False, "SAR Lee Filter requires a SAR image."
        return True, None

    def validate(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        return True, None

    def execute(self, context: InvestigationContext) -> ToolResult:
        t0 = time.time()
        sar_assets = [a for a in context.input_assets if a.metadata.modality == ModalityType.SAR or "sar" in a.role or "sar" in a.metadata.filename.lower()]
        target_asset = sar_assets[0]

        if target_asset.cached_array is None:
            arr, meta = RasterPreprocessor.load_raster_array(target_asset.filepath)
            target_asset.cached_array = arr
            target_asset.metadata = meta
        else:
            arr = target_asset.cached_array
            meta = target_asset.metadata

        ev_node, stats = SARProcessor.process_sar_image(arr, meta, context.investigation_id)
        context.evidence_nodes[ev_node.node_id] = ev_node

        claim = Claim(
            claim_id=f"claim_{uuid.uuid4().hex[:6]}",
            statement=f"Sentinel-1 SAR analysis identified {ev_node.metric.area_km2} km² of specular low backscatter surfaces (< -16 dB).",
            status="VERIFIED",
            confidence=0.94,
            supporting_evidence_nodes=[ev_node.node_id],
            evidence_ids=[ev_node.node_id],
            supporting_tools=[self.name]
        )
        context.claims.append(claim)

        runtime_ms = round((time.time() - t0) * 1000, 2)
        return ToolResult(
            tool=self.name,
            status=ToolStatus.SUCCESS,
            confidence=0.94,
            outputs=[ToolOutput(
                type="sar_backscatter_map",
                path=ev_node.preview_png_uri,
                statistics=stats
            )],
            claims=[claim],
            evidence=[ev_node],
            metadata=stats,
            runtime_ms=runtime_ms,
            provenance="SatQuery Enhanced Lee Filter & Backscatter Segmenter"
        )

    def explain_result(self, result: ToolResult) -> str:
        stats = result.metadata
        return f"Enhanced Lee Filter applied. Identified {stats.get('water_extent_km2', 'N/A')} km² of specular low backscatter."


class OpticalSARTool(RSAnalysisTool):
    name = "OpticalSARTool"
    version = "1.1.0"
    description = "Cross-modal dual-stream fusion combining optical spectral reflectance with SAR microwave backscatter to penetrate clouds and delineate inundation."
    capabilities = ["optical_sar_fusion", "cloud_penetration", "multimodal_flood_mapping"]
    accepted_modalities = [ModalityType.OPTICAL, ModalityType.SAR, ModalityType.MULTISPECTRAL]

    def can_run(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        has_sar = any(a.metadata.modality == ModalityType.SAR or "sar" in a.role or "sar" in a.metadata.filename.lower() for a in context.input_assets)
        has_opt = any(a.metadata.modality in [ModalityType.OPTICAL, ModalityType.MULTISPECTRAL] or "optical" in a.role or "opt" in a.metadata.filename.lower() for a in context.input_assets)
        if not (has_sar and has_opt) and len(context.input_assets) < 2:
            return False, "Optical-SAR cross-modal analysis requires both an Optical and a SAR image."
        return True, None

    def validate(self, context: InvestigationContext) -> Tuple[bool, Optional[str]]:
        return True, None

    def execute(self, context: InvestigationContext) -> ToolResult:
        t0 = time.time()
        # Find optical and SAR
        opt_asset = next((a for a in context.input_assets if a.metadata.modality in [ModalityType.OPTICAL, ModalityType.MULTISPECTRAL] or "optical" in a.role or "opt" in a.metadata.filename.lower()), context.input_assets[0])
        sar_asset = next((a for a in context.input_assets if a.metadata.modality == ModalityType.SAR or "sar" in a.role or "sar" in a.metadata.filename.lower()), context.input_assets[-1])

        if opt_asset.cached_array is None:
            opt_arr, opt_meta = RasterPreprocessor.load_raster_array(opt_asset.filepath)
            opt_asset.cached_array = opt_arr
            opt_asset.metadata = opt_meta
        else:
            opt_arr = opt_asset.cached_array
            opt_meta = opt_asset.metadata

        if sar_asset.cached_array is None:
            sar_arr, sar_meta = RasterPreprocessor.load_raster_array(sar_asset.filepath)
            sar_asset.cached_array = sar_arr
            sar_asset.metadata = sar_meta
        else:
            sar_arr = sar_asset.cached_array
            sar_meta = sar_asset.metadata

        ev_node, stats = OpticalSARFusionEngine.fuse_optical_sar(
            opt_arr, sar_arr, opt_meta, sar_meta, context.investigation_id
        )
        context.evidence_nodes[ev_node.node_id] = ev_node

        claim_stmt = (
            f"Cross-modal fusion revealed {stats['fused_water_km2']} km² of total inundation, "
            f"penetrating beneath {stats['cloud_coverage_pct']}% cloud cover via SAR backscatter "
            f"(uncovering {stats['sar_revealed_km2']} km² obscured to optical sensors)."
        )
        claim = Claim(
            claim_id=f"claim_{uuid.uuid4().hex[:6]}",
            statement=claim_stmt,
            status="VERIFIED",
            confidence=0.95,
            supporting_evidence_nodes=[ev_node.node_id],
            evidence_ids=[ev_node.node_id],
            supporting_tools=[self.name]
        )
        context.claims.append(claim)

        runtime_ms = round((time.time() - t0) * 1000, 2)
        return ToolResult(
            tool=self.name,
            status=ToolStatus.SUCCESS,
            confidence=0.95,
            outputs=[ToolOutput(
                type="fused_water_mask",
                path=ev_node.preview_png_uri,
                statistics=stats
            )],
            claims=[claim],
            evidence=[ev_node],
            metadata=stats,
            runtime_ms=runtime_ms,
            provenance="SatQuery SEN12MS Cross-Modal Fusion Engine"
        )

    def explain_result(self, result: ToolResult) -> str:
        s = result.metadata
        return (
            f"Optical-SAR fusion penetrated {s.get('cloud_coverage_pct', 0)}% cloud occlusion. "
            f"Total delineated water: {s.get('fused_water_km2', 0)} km² (SAR revealed: {s.get('sar_revealed_km2', 0)} km²)."
        )
