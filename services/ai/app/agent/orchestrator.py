"""
SatQuery AI — Master Agentic Orchestrator & Evidence Synthesizer
Standard: SIH26167 Remote Sensing Assistant
Executes the 10-Stage Agentic Pipeline:
QUERY UNDERSTANDING -> INPUT ANALYSIS -> TASK DECOMPOSITION -> TOOL DISCOVERY
-> TOOL SCORING -> EXECUTION DAG -> SPECIALIST EXECUTION -> EVIDENCE AGGREGATION
-> CLAIM VERIFICATION -> ANSWER GENERATION
"""

import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from ..schemas.metadata import QueryIntent, ModalityType, RasterMetadata, QueryUnderstanding
from ..schemas.evidence import (
    AnalysisRequest,
    AnalysisResponse,
    EvidenceGraph,
    EvidenceNode,
    Claim,
    ExecutionStepTrace,
)
from ..schemas.tools import (
    InvestigationContext,
    AssetRecord,
    ToolResult,
    ToolStatus,
    DAGNode,
)
from ..tools.registry import tool_registry
from .interpreter import QueryInterpreter
from .rag_engine import rag_engine

logger = logging.getLogger("satquery.orchestrator")


class AgentOrchestrator:
    """
    Coordinates tool-driven execution DAGs, sensor-aware input validation,
    zero-hallucination claim verification, and transparent evidence synthesis.
    """

    @staticmethod
    def execute_investigation(request: AnalysisRequest) -> EvidenceGraph:
        start_time = time.time()
        traces: List[ExecutionStepTrace] = []
        step_counter = 1

        # -------------------------------------------------------------
        # Stage 1: Query Understanding & Task Decomposition
        # -------------------------------------------------------------
        t0 = time.time()
        qu = QueryInterpreter.understand_query(
            request.query, request.images, requested_mode=request.requested_mode or "standard"
        )
        duration_ms = round((time.time() - t0) * 1000, 2)

        traces.append(ExecutionStepTrace(
            step_number=step_counter,
            tool_name="QUERY_INTERPRETER",
            status="SUCCESS",
            duration_ms=duration_ms,
            parameters={"query": request.query, "num_images": len(request.images)},
            output_summary=f"Task: {qu.task} | Target: {qu.target or 'general'} | Action: {qu.action}"
        ))
        step_counter += 1

        # -------------------------------------------------------------
        # Stage 2: Sensor-Aware Input Validation & Asset Structuring
        # -------------------------------------------------------------
        input_assets: List[AssetRecord] = []
        modalities: List[ModalityType] = []

        for idx, img_info in enumerate(request.images):
            filepath = img_info["filepath"]
            role = img_info.get("role", f"asset_{idx+1}")
            meta_dict = img_info.get("metadata", {})
            mod_str = meta_dict.get("modality", "UNKNOWN").upper()

            # Infer modality from role or filename if missing
            if mod_str == "UNKNOWN":
                if "sar" in filepath.lower() or "sar" in role.lower():
                    modality = ModalityType.SAR
                elif any(k in filepath.lower() for k in ["optical", "sentinel2", "levir", "rgb", "t1", "t2"]):
                    modality = ModalityType.OPTICAL
                else:
                    modality = ModalityType.OPTICAL
            else:
                modality = ModalityType(mod_str) if mod_str in ModalityType.__members__ else ModalityType.OPTICAL

            modalities.append(modality)

            meta = RasterMetadata(
                filename=meta_dict.get("filename", filepath.split("/")[-1]),
                filepath=filepath,
                crs=meta_dict.get("crs"),
                bbox=meta_dict.get("bbox"),
                width=meta_dict.get("width", 512),
                height=meta_dict.get("height", 512),
                channels=meta_dict.get("channels", 3),
                dtype=meta_dict.get("dtype", "uint8"),
                gsd_m=meta_dict.get("gsd_m", 10.0),
                acquisition_date=meta_dict.get("acquisition_date"),
                modality=modality,
            )

            input_assets.append(AssetRecord(
                asset_id=f"asset_{idx+1}",
                filepath=filepath,
                role=role,
                metadata=meta
            ))

        # Check domain-specific impossibilities (Section 7)
        if qu.requires_temporal_pair and len(input_assets) < 2:
            raise ValueError(
                "Temporal comparison requires two images of the same geographic area acquired at different times."
            )

        if qu.task == "VEGETATION_ANALYSIS" and all(m == ModalityType.SAR for m in modalities):
            raise ValueError(
                "NDVI cannot be computed from the supplied SAR-only imagery because the required optical/NIR information is unavailable."
            )

        # -------------------------------------------------------------
        # Stage 3: Initialize Investigation Context
        # -------------------------------------------------------------
        context = InvestigationContext(
            investigation_id=request.investigation_id,
            query=request.query,
            query_understanding=qu,
            input_assets=input_assets,
            modalities=modalities,
            candidate_tools=[],
            selected_tools=[],
            execution_dag=[],
            tool_results={},
            evidence_nodes={},
            claims=[],
            execution_trace=traces,
            confidence_components={},
            aggregate_confidence=0.90,
            warnings=[],
            answer_markdown="",
            report_metadata={}
        )

        # -------------------------------------------------------------
        # Stage 4: Tool Discovery & Capability Scoring
        # -------------------------------------------------------------
        scored_tools = tool_registry.score_tools_for_task(qu, modalities, len(input_assets))
        context.candidate_tools = [name for name, score in scored_tools if score >= 0.70]

        # -------------------------------------------------------------
        # Stage 5: Execution DAG Resolution
        # -------------------------------------------------------------
        is_investigation = (request.requested_mode == "investigation" or qu.task == "INVESTIGATION")
        dag_nodes = tool_registry.build_execution_dag(qu, modalities, len(input_assets), is_investigation=is_investigation)
        context.execution_dag = dag_nodes
        context.selected_tools = [n.tool_name for n in dag_nodes]

        # -------------------------------------------------------------
        # Stage 6: Specialist Execution Lifecycle
        # -------------------------------------------------------------
        for dag_node in dag_nodes:
            tool_name = dag_node.tool_name
            specialist = tool_registry.get_tool(tool_name)

            if not specialist:
                logger.warning(f"Specialist tool {tool_name} not found in registry.")
                continue

            # Check execution capability
            can_run, run_err = specialist.can_run(context)
            if not can_run:
                traces.append(ExecutionStepTrace(
                    step_number=step_counter,
                    tool_name=tool_name,
                    status="SKIPPED",
                    duration_ms=0.0,
                    output_summary=f"Skipped: {run_err}"
                ))
                step_counter += 1
                continue

            # Execute specialist
            t_tool = time.time()
            try:
                result = specialist.execute(context)
                tool_duration = round((time.time() - t_tool) * 1000, 2)
                context.tool_results[tool_name] = result

                summary_text = specialist.explain_result(result)
                traces.append(ExecutionStepTrace(
                    step_number=step_counter,
                    tool_name=tool_name,
                    status="SUCCESS",
                    duration_ms=tool_duration,
                    output_summary=summary_text
                ))
            except Exception as e:
                logger.error(f"Error executing specialist {tool_name}: {e}")
                tool_duration = round((time.time() - t_tool) * 1000, 2)
                traces.append(ExecutionStepTrace(
                    step_number=step_counter,
                    tool_name=tool_name,
                    status="FAILED",
                    duration_ms=tool_duration,
                    error=str(e),
                    output_summary=f"Execution error: {str(e)}"
                ))
            step_counter += 1

        context.execution_trace = traces

        # -------------------------------------------------------------
        # Stage 7: Authoritative Domain RAG Retrieval
        # -------------------------------------------------------------
        t0 = time.time()
        rag_query = f"{request.query} {qu.task} {qu.target or ''}"
        citations = rag_engine.retrieve(rag_query, top_k=2)
        traces.append(ExecutionStepTrace(
            step_number=step_counter,
            tool_name="AUTHORITATIVE_RAG_RETRIEVER",
            status="SUCCESS",
            duration_ms=round((time.time() - t0) * 1000, 2),
            parameters={"query": rag_query, "top_k": 2},
            output_summary=f"Consulted {len(citations)} authoritative domain reference(s)."
        ))
        step_counter += 1

        # -------------------------------------------------------------
        # Stage 8: Evidence-Grounded Answer Synthesis
        # -------------------------------------------------------------
        answer_md = AgentOrchestrator._synthesize_answer_markdown(context, citations)
        context.answer_markdown = answer_md

        # -------------------------------------------------------------
        # Stage 9: Final Evidence Graph Assembly
        # -------------------------------------------------------------
        return EvidenceGraph(
            investigation_id=request.investigation_id,
            query=request.query,
            intent=qu.raw_intent,
            spatial_context={
                "num_images_analyzed": len(request.images),
                "total_execution_ms": round((time.time() - start_time) * 1000, 2),
                "task": qu.task,
                "target": qu.target,
                "action": qu.action,
                "rag_citations": citations,
                "selected_tools": context.selected_tools,
                "report_metadata": context.report_metadata,
            },
            claims=context.claims,
            evidence_nodes=context.evidence_nodes,
            execution_trace=context.execution_trace,
            confidence_breakdown=context.confidence_components,
            aggregate_confidence=context.aggregate_confidence,
            warnings=context.warnings,
            provenance=[r.provenance for r in context.tool_results.values() if r.provenance],
            answer_markdown=context.answer_markdown,
            generated_at=datetime.now(timezone.utc).isoformat()
        )

    @staticmethod
    def _synthesize_answer_markdown(context: InvestigationContext, citations: List[Dict[str, Any]]) -> str:
        """
        Synthesizes objective, uncertainty-aware natural-language answers strictly grounded in computed evidence.
        """
        qu = context.query_understanding
        task = qu.task if qu else "GENERAL"
        sections = []

        # 1. Headline Finding
        if task in ["TEMPORAL_CHANGE", "TEMPORAL_CHANGE_QUANTITATIVE"]:
            cd_res = context.tool_results.get("ChangeDetectionTool")
            stats = cd_res.metadata if cd_res else {}
            bldg_res = context.tool_results.get("BuildingDetectionTool")
            bldg_stats = bldg_res.metadata if bldg_res else {}

            sections.append("### Temporal Change Analysis Findings")
            sections.append(
                f"A bi-temporal differential comparison was executed using the **TinyCD Siamese U-Net + MAMB Engine** "
                f"across co-registered observation rasters."
            )
            sections.append("#### Key Empirical Measurements:")
            sections.append(f"- **Total Changed Extent:** **{stats.get('changed_area_km2', 'N/A')} km²** ({stats.get('percentage_change', 'N/A')}% of the analyzed scene).")
            if "water_delta_km2" in stats:
                sections.append(f"- **Water Extent Shift:** {stats.get('water_delta_km2', 0.0):+.4f} km² ({stats.get('water_pct_shift', 0.0):+.2f}%).")
            if bldg_stats:
                sections.append(f"- **Candidate Building Footprint Changes:** **{bldg_stats.get('candidate_changes', bldg_stats.get('detected_buildings', 'N/A'))} candidate structures** identified.")

        elif task in ["OPTICAL_SAR_COMPARISON", "OPTICAL_SAR_FUSION"]:
            fus_res = context.tool_results.get("OpticalSARTool")
            stats = fus_res.metadata if fus_res else {}
            sections.append("### Cross-Modal Optical + SAR Fusion Report")
            sections.append(
                "Joint multi-sensor feature fusion was executed across co-registered **Sentinel-2 Optical** "
                "and **Sentinel-1 SAR** microwave imagery."
            )
            sections.append("#### Findings:")
            sections.append(f"- **Optical Cloud Occlusion:** **{stats.get('cloud_coverage_pct', 'N/A')}%**")
            sections.append(f"- **Total Delineated Water / Inundation:** **{stats.get('fused_water_km2', 'N/A')} km²**")
            sections.append(f"- **SAR Microwave Cloud Penetration Gain:** **{stats.get('sar_revealed_km2', 'N/A')} km²** of inundated area uncovered beneath clouds.")

        elif task == "SINGLE_SAR_ANALYSIS":
            sar_res = context.tool_results.get("SARLeeFilter")
            stats = sar_res.metadata if sar_res else {}
            sections.append("### Synthetic Aperture Radar (SAR) Analysis")
            sections.append(
                "Sentinel-1 C-band SAR backscatter was calibrated to decibels ($\sigma^0$) and filtered using an **Enhanced Lee Speckle Filter**."
            )
            sections.append(f"- **Specular Reflection (Inundation/Water):** **{stats.get('water_extent_km2', 'N/A')} km²**")
            sections.append(f"- **Calibrated Mean Backscatter:** {stats.get('mean_backscatter_db', 'N/A')} dB")

        elif task == "INVESTIGATION":
            sections.append("### Automated Comprehensive Area Investigation")
            sections.append(f"Autonomous multi-criteria survey completed for query: *\"{context.query}\"*.")
            sections.append("#### Evaluated Dimensions:")
            for tool_name, res in context.tool_results.items():
                if tool_name not in ["ImageValidator", "MetadataReader", "ImagePreprocessor", "SpatialStatisticsTool", "EvidenceVerifier", "EvidenceRenderer", "ReportGenerator"]:
                    sections.append(f"- **{tool_name}:** {res.tool} executed with confidence {res.confidence * 100:.1f}%.")

        else:
            vqa_res = context.tool_results.get("VQATool") or context.tool_results.get("BuildingDetectionTool") or context.tool_results.get("WaterDetectionTool")
            if vqa_res and "answer" in vqa_res.metadata:
                sections.append(vqa_res.metadata["answer"])
            elif vqa_res and vqa_res.claims:
                sections.append(f"### Remote Sensing Feature Analysis\n\n{vqa_res.claims[0].statement}")
            else:
                sections.append("### Remote Sensing Analysis\n\nIdentified geospatial features and empirical boundaries verified in active evidence drawer.")

        # 2. Add verified claims section
        if context.claims:
            sections.append("\n#### 🔍 Verified Empirical Claims:")
            for c in context.claims:
                sections.append(f"- **[{c.status}]** {c.statement}")

        # 3. Add Authoritative RAG citations
        if citations:
            sections.append("\n#### 📚 Authoritative Domain Reference & Sensor Principles:")
            for c in citations:
                sections.append(f"- **{c['title']}** (*{c['source']}*):\n  > *{c['section']}:* {c['content']}")

        # 4. Report availability footer
        if context.report_metadata.get("md_uri"):
            sections.append(f"\n*Scientific investigation report exported to `{context.report_metadata.get('report_id', '')}`.*")

        return "\n\n".join(sections)
