# SatQuery AI — System Audit & Technical Reconnaissance Report
**Standard:** ISRO / Smart India Hackathon 2026 (SIH26167)  
**Date:** September 2026  
**Auditor:** Principal Software Engineer & Remote Sensing Architect  

---

## Executive Summary

This audit establishes an objective, evidence-based baseline of the SatQuery AI repository prior to the core architectural hardening. Each major subsystem is cataloged and classified strictly according to operational reality:
- **A. REAL + EXECUTING:** Fully implemented, actively imported, executes native tensor/array computation on live data.
- **B. REAL + PARTIALLY INTEGRATED:** Core algorithmic code is functional, but lacks end-to-end tool contracts or automated DAG scheduling.
- **C. ADAPTER ONLY:** Software interface/wrapper implemented with external weights not bundled locally due to hardware constraints.
- **D. FALLBACK ONLY:** Heuristic, rule-based, or deterministic statistical pathway used when primary heavyweight models/libraries are unavailable.
- **E. REFERENCE ONLY:** Architectural or algorithmic designs documented from open-source literature, not imported or executed.
- **F. DEAD / UNUSED:** Code present on disk that is not reachable from active routes or execution pipelines.
- **G. BROKEN:** Components that fail on import or execution.

---

## 1. Component Classification Matrix

| Component | Path | Category | Status & Implementation Notes |
| :--- | :--- | :---: | :--- |
| **TinyCD Siamese U-Net** | `services/ai/app/models/adapters/tinycd.py` | **A** | **REAL + EXECUTING**. Authentic PyTorch Siamese U-Net with Spatial/Channel Attention and Mix-and-Attention Mask Blocks (MAMB, 0.31M params). Executes tensor forward pass on CPU in sub-second latency. |
| **SAR Lee Filter & Calibrator** | `services/ai/app/tools/sar_processor.py` | **A** | **REAL + EXECUTING**. Vectorized NumPy/SciPy local variance speckle filtering (5x5 kernel) and $\sigma^0$ dB conversion. Runs live on real Sentinel-1 GRD scenes. |
| **Spectral Engine (NDVI/NDWI)** | `services/ai/app/tools/spectral_engine.py` | **A** | **REAL + EXECUTING**. Exact vectorized green/NIR/SWIR band math with physical area integration ($m^2, km^2$) via GSD ground sampling distance. |
| **Optical-SAR Cross-Modal Fusion** | `services/ai/app/tools/optical_sar_fusion.py` | **A** | **REAL + EXECUTING**. Dual-stream fusion combining optical cloud detection with radar backscatter roughness to delineate water obscured by atmospheric cloud cover. |
| **LEVIR-CD Image Assets** | `storage/uploads/`, `datasets/real/levir_cd/` | **A** | **REAL + EXECUTING**. Real sub-meter bi-temporal optical crops (`real_levir_t1_optical.png`, `real_levir_t2_optical.png`) and masks on disk. |
| **Sentinel-1 & Sentinel-2 Assets** | `storage/uploads/`, `datasets/real/sentinel/` | **A** | **REAL + EXECUTING**. Real ESA Sentinel-1 VV/VH SAR and Sentinel-2 optical crops on disk. |
| **Domain RAG Engine** | `services/ai/app/agent/rag_engine.py` | **A** | **REAL + EXECUTING**. TF-IDF + cosine similarity engine over ISRO/ESA sensor knowledge base. |
| **MapLibre GL 2D/Swipe Map** | `frontend/src/app/map/page.tsx` | **A** | **REAL + EXECUTING**. Interactive WebGL map with bi-temporal split-screen slider, layer opacity controls, and raster overlay rendering. |
| **Node.js Gateway Server** | `backend/src/server.ts` | **A** | **REAL + EXECUTING**. Express + Socket.IO server handling asset upload, path resolution, and API gateway routing to Python service. |
| **Next.js Frontend Shell** | `frontend/src/` | **A** | **REAL + EXECUTING**. Next.js 14 App Router, Tailwind CSS, Lucide icons, Framer Motion. Successfully builds with 0 errors. |
| **RasterIO Preprocessor** | `services/ai/app/tools/raster_preprocessor.py` | **B** | **REAL + PARTIALLY INTEGRATED**. Implements rasterio GeoTIFF affine and CRS extraction with PIL fallback. When rasterio C-bindings are not installed in minimal container, falls back cleanly to PIL. |
| **Agent Orchestrator** | `services/ai/app/agent/orchestrator.py` | **B** | **REAL + PARTIALLY INTEGRATED**. Monolithic router executes investigation pipelines, but lacks dynamic DAG sequencing, capability scoring, and a standardized tool contract. |
| **Query Interpreter** | `services/ai/app/agent/interpreter.py` | **B** | **REAL + PARTIALLY INTEGRATED**. Keyword-based intent classification. Needs refactoring into structured query understanding with explicit target/action/modality extraction. |
| **Benchmark Suite** | `evaluation/run_all_benchmarks.py` | **A** | **REAL + EXECUTING**. Quantitative benchmark measuring F1-score, optical-SAR cloud penetration, intent routing latency, and anti-hallucination metric $\Delta A$. Passes 100%. |
| **Building Detection & Segmentation** | `services/ai/app/tools/vqa_grounding.py` | **D** | **FALLBACK ONLY**. Currently uses thresholded spectral/contrast heuristics rather than a dedicated building detector or segmentation network. |
| **GeoChat / Remote Sensing VLM** | `services/ai/app/tools/vqa_grounding.py` | **C** | **ADAPTER ONLY**. Full 7B model weights (~14GB VRAM) not hosted on local CPU machine; operates via adapter schema with deterministic grounding rules. |
| **MobileSAM / Grounding DINO** | `docs/OPEN_SOURCE_COMPONENTS.md` | **C** | **ADAPTER ONLY**. Referenced and adapter-ready, but not instantiated in a typed tool interface. |
| **RemoteCLIP** | `docs/OPEN_SOURCE_COMPONENTS.md` | **C** | **ADAPTER ONLY**. Listed in documentation catalog; requires programmatic integration for semantic similarity and concept grounding. |
| **Benchmark Dataset Loaders** | `datasets/core/*.py` | **B** | **REAL + PARTIALLY INTEGRATED**. Functional Python ingestion classes conforming to `BaseRemoteSensingDataset`. The multi-hundred-GB raw external datasets are not downloaded locally; they target representative crops in `datasets/demo` and `datasets/real`. |
| **God's Eye View** | `docs/OPEN_SOURCE_COMPONENTS.md` | **E** | **REFERENCE ONLY**. Architectural reference for 3D globe presentation and dark cockpit UI; not imported or bundled as a dependency. |
| **AWS Geospatial Repositories** | `docs/OPEN_SOURCE_COMPONENTS.md` | **E** | **REFERENCE ONLY**. Studied for MapLibre tiling patterns; AWS Bedrock / CDK code intentionally excluded. |
| **Synthetic Demo Generator** | `scripts/generate_synthetic_demo_scenes.py`| **A** | **REAL + EXECUTING**. Helper script generating synthetic multi-spectral arrays for headless testing. |

---

## 2. Technical Debt & Immediate Architectural Refactor Goals

1. **Uniform Tool Interface (`RSAnalysisTool`):**
   - Disparate static helper methods (`ChangeEngine.detect_change`, `SARProcessor.process_sar_image`) must be encapsulated into uniform, typed tool classes conforming to `can_run()`, `validate()`, `execute()`, and `explain_result()`.
2. **Centralized Capability Registry:**
   - A declarative tool registry must register all 24 required capabilities with capability scoring and resource requirement tracking.
3. **10-Stage Agentic Pipeline & `InvestigationContext`:**
   - Replace the static if/else branching in `AgentOrchestrator` with an end-to-end `InvestigationContext` and execution DAG.
4. **Target-Specific Building Detection & Change Intersection:**
   - Build a real object-level change pipeline that isolates building footprints, counts candidates on T1 vs T2, and intersects them with the TinyCD change mask.
5. **Traceable Confidence Calculation:**
   - Eliminate hardcoded `aggregate_confidence = 0.94` in favor of a mathematical composite of model confidence, registration quality, sensor compatibility, and evidence agreement.
6. **Rule-Based Claim Verifier:**
   - Claims must be validated against computed evidence nodes before being marked `VERIFIED`, `PARTIALLY_SUPPORTED`, or `INSUFFICIENT_EVIDENCE`.
7. **REST APIs & Report Generation:**
   - Provide standard endpoints for investigation creation, execution, execution trace, evidence retrieval, and structured markdown/JSON report export.
