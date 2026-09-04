"""
SatQuery AI — FastAPI Application Router
Standard: SIH26167 Remote Sensing Assistant
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel

from ..schemas.metadata import RasterMetadata
from ..schemas.evidence import AnalysisRequest, AnalysisResponse, EvidenceGraph
from ..tools.raster_preprocessor import RasterPreprocessor
from ..agent.orchestrator import AgentOrchestrator
from ..tools.registry import tool_registry
from ..models.registry.catalog import ModelRegistry
from ..core.device import device_manager
from ..core.config import settings

logger = logging.getLogger("satquery.api")
router = APIRouter()

# In-memory investigation cache
_investigations_cache: Dict[str, EvidenceGraph] = {}


class InspectRequest(BaseModel):
    filepath: str


class CreateInvestigationRequest(BaseModel):
    investigation_id: Optional[str] = None
    title: Optional[str] = "Untitled Remote Sensing Investigation"
    description: Optional[str] = None


@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "SatQuery AI Specialist Engine",
        "compute": device_manager.get_system_summary(),
        "registered_tools_count": len(tool_registry.list_tools()),
        "active_models": [m.name for m in ModelRegistry.list_active_models()]
    }


@router.get("/api/v1/tools")
async def list_registered_tools():
    """Returns the capability profile of all 24 remote sensing specialist tools."""
    return {
        "count": len(tool_registry.list_tools()),
        "tools": tool_registry.list_tools()
    }


@router.get("/api/v1/models")
async def list_registered_models():
    """Returns the complete model registry with status and hardware requirements."""
    return {
        "models": [m.model_dump() for m in ModelRegistry.list_all_models()]
    }


@router.post("/api/v1/inspect", response_model=RasterMetadata)
async def inspect_raster(req: InspectRequest):
    """
    Inspect a raster file on disk and return its geospatial metadata.
    """
    try:
        meta = RasterPreprocessor.inspect_raster(req.filepath)
        return meta
    except FileNotFoundError as fnf:
        raise HTTPException(status_code=404, detail=str(fnf))
    except Exception as e:
        logger.error(f"Error inspecting raster {req.filepath}: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/v1/analyze", response_model=AnalysisResponse)
@router.post("/investigations/{investigation_id}/execute")
async def analyze_investigation(req: AnalysisRequest, investigation_id: Optional[str] = None):
    """
    Execute the agentic geospatial investigation pipeline.
    """
    if investigation_id:
        req.investigation_id = investigation_id

    try:
        evidence_graph = AgentOrchestrator.execute_investigation(req)
        _investigations_cache[req.investigation_id] = evidence_graph
        return AnalysisResponse(
            status="success",
            evidence_graph=evidence_graph
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.exception(f"Investigation execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")


@router.get("/investigations/{id}")
@router.get("/api/v1/investigations/{id}")
async def get_investigation(id: str):
    """Retrieves full investigation graph by ID."""
    if id in _investigations_cache:
        return _investigations_cache[id]
    raise HTTPException(status_code=404, detail=f"Investigation with ID '{id}' not found.")


@router.get("/investigations/{id}/trace")
@router.get("/api/v1/investigations/{id}/trace")
async def get_investigation_trace(id: str):
    """Retrieves step-by-step operational execution trace for an investigation."""
    if id not in _investigations_cache:
        raise HTTPException(status_code=404, detail=f"Investigation with ID '{id}' not found.")
    return {
        "investigation_id": id,
        "execution_trace": _investigations_cache[id].execution_trace
    }


@router.get("/investigations/{id}/evidence")
@router.get("/api/v1/investigations/{id}/evidence")
async def get_investigation_evidence(id: str):
    """Retrieves all visual and mathematical evidence nodes for an investigation."""
    if id not in _investigations_cache:
        raise HTTPException(status_code=404, detail=f"Investigation with ID '{id}' not found.")
    return {
        "investigation_id": id,
        "evidence_nodes": _investigations_cache[id].evidence_nodes,
        "claims": _investigations_cache[id].claims,
        "confidence_breakdown": _investigations_cache[id].confidence_breakdown,
        "aggregate_confidence": _investigations_cache[id].aggregate_confidence
    }


@router.get("/investigations/{id}/report")
@router.get("/api/v1/investigations/{id}/report")
async def get_investigation_report(id: str, format: str = "markdown"):
    """Downloads or views the scientific investigation report in Markdown or JSON format."""
    if id not in _investigations_cache:
        raise HTTPException(status_code=404, detail=f"Investigation with ID '{id}' not found.")

    graph = _investigations_cache[id]
    report_meta = graph.spatial_context.get("report_metadata", {}) if graph.spatial_context else {}

    if format == "json":
        json_path = report_meta.get("json_path")
        if json_path and Path(json_path).exists():
            return FileResponse(json_path, media_type="application/json", filename=f"SatQuery_{id}_Report.json")
        return graph.model_dump()

    md_path = report_meta.get("md_path")
    if md_path and Path(md_path).exists():
        with open(md_path, "r") as f:
            return PlainTextResponse(f.read(), media_type="text/markdown")

    return PlainTextResponse(graph.answer_markdown, media_type="text/markdown")
