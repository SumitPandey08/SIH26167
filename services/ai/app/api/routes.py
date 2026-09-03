"""
SatQuery AI — FastAPI Application Router
Standard: SIH26167 Remote Sensing Assistant
"""

import logging
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any

from ..schemas.metadata import RasterMetadata
from ..schemas.evidence import AnalysisRequest, AnalysisResponse
from ..tools.raster_preprocessor import RasterPreprocessor
from ..agent.orchestrator import AgentOrchestrator
from ..core.device import device_manager

logger = logging.getLogger("satquery.api")
router = APIRouter()


class InspectRequest(BaseModel):
    filepath: str


@router.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": "SatQuery AI Specialist Engine",
        "compute": device_manager.get_system_summary(),
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
async def analyze_investigation(req: AnalysisRequest):
    """
    Execute the agentic geospatial investigation pipeline.
    """
    try:
        evidence_graph = AgentOrchestrator.execute_investigation(req)
        return AnalysisResponse(
            status="success",
            investigation_id=req.investigation_id,
            evidence_graph=evidence_graph
        )
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.exception(f"Investigation execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis pipeline error: {str(e)}")
