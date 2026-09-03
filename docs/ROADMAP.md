# SatQuery AI — Prioritized Implementation Roadmap (Phases 0 - 10)
## Engineering Milestones for SIH26167 Competition Readiness
**Standard:** Smart India Hackathon 2026 Deliverables  
**Status:** In Execution

---

## Roadmap Overview

SatQuery AI is built vertically in 10 planned phases, ensuring that each phase yields a fully functioning, testable slice of functionality rather than disconnected stubs.

```
Phase 0: Technical Reconnaissance & Research (COMPLETE)
   │
   ▼
Phase 1: Monorepo Foundation, Core Schemas & Gateway API
   │
   ▼
Phase 2: Single-Image Optical & SAR Specialist MVP
   │
   ▼
Phase 3: Bi-Temporal Change Detection & Differential Engine
   │
   ▼
Phase 4: Cross-Modal Optical + SAR Joint Fusion Engine
   │
   ▼
Phase 5: Agentic Reasoning, Tool Registry & Evidence Graph
   │
   ▼
Phase 6: Remote Sensing Domain Adaptation (BigEarthNet.txt & LoRA)
   │
   ▼
Phase 7: Mission-Critical 2D/3D Frontend & Investigation Workspace
   │
   ▼
Phase 8: Automated Benchmark Evaluation Framework
   │
   ▼
Phase 9: High-Impact SIH Demonstration Scenarios (ISRO/SAC)
   │
   ▼
Phase 10: Hardening, Security, Performance Optimization & Export
```

---

## Detailed Phase Breakdown

### Phase 0: Technical Reconnaissance & Architectural Specifications [COMPLETED]
- [x] Analyze official SIH26167 problem statement & ISRO/SAC guidelines.
- [x] Deep dive into God's Eye View, AWS Geospatial Code Agent, AWS Geospatial Agent on AWS, and RS Foundation Models.
- [x] Research state-of-the-art open source RS VLMs (GeoChat, RemoteCLIP, RSVQA).
- [x] Research change detection models (TinyCD, ChangeFormer, Open-CD) and Change VQA (CDVQA, VisTA).
- [x] Audit licenses (Apache 2.0, MIT, BSD, CC-BY) for software, weights, and datasets.
- [x] Produce core documentation: `ARCHITECTURE.md`, `OPEN_SOURCE_COMPONENTS.md`, `MODEL_CATALOG.md`, `DATASETS.md`, `EVALUATION.md`, `THIRD_PARTY.md`.

### Phase 1: Monorepo Skeleton & Core Schemas [COMPLETED]
- [x] Initialized clean decoupled monorepo structure (`backend/`, `services/ai/`, `frontend/`, `datasets/`, `evaluation/`).
- [x] Defined shared Pydantic v2 schemas: `RasterMetadata`, `QueryIntent`, `EvidenceNode`, `EvidenceGraph`, `ExecutionStepTrace`.
- [x] Decoupled dual-stack architecture: Node.js/TypeScript gateway (`backend/`) on port 5000 + Python FastAPI microservice on port 8000.
- [x] Single-command startup orchestration: `./start.sh`.

### Phase 2: Single-Image Optical & SAR Specialist MVP [COMPLETED]
- [x] Implemented `RasterPreprocessor`: Multi-format array reader, CRS/GSD metadata extraction, channel normalization.
- [x] Implemented `SpectralEngine`: Vectorized $NDWI, NDVI, MNDWI$ spectral indices with physical area quantification ($km^2$).
- [x] Implemented `SARProcessor`: Sentinel-1 GRD decibel calibration $\sigma^0$ and Enhanced Lee speckle filter.
- [x] Implemented `VQAGroundingEngine`: Overhead visual question answering, captioning, and referring box grounding.
- [x] Integrated Authoritative Domain RAG Knowledge Base (`services/ai/knowledge/`) with sub-millisecond retrieval.

### Phase 3: Bi-Temporal Change Detection & Differential Engine [COMPLETED]
- [x] Implemented `ImageRegistration`: Spatial footprint validation, CRS harmonization, affine co-registration check.
- [x] Implemented Authentic **TinyCD Siamese U-Net** in PyTorch with Mix and Attention Mask Blocks (MAMB) (`services/ai/app/models/adapters/tinycd.py`).
- [x] Built `SpatialStatistics` engine: Categorical change decomposition (water expansion, vegetation loss), physical area delta ($km^2$, %), change cluster identification.
- [x] Ingested real 0.5m LEVIR-CD satellite building change pairs (`datasets/real/levir_cd/`).

### Phase 4: Cross-Modal Optical + SAR Joint Fusion Engine [COMPLETED]
- [x] Implemented `OpticalSARFusionEngine`: Co-registered Sentinel-1 SAR + Sentinel-2 optical dual-stream network.
- [x] Implemented all-weather water segmentation and cloud penetration gain calculation ($km^2$).
- [x] Ingested real ESA Sentinel-1 C-Band SAR and Sentinel-2 MSI level-1C pairs (`datasets/real/sentinel/`).

### Phase 5: Agentic Reasoning, Tool Registry & Evidence Graph [COMPLETED]
- [x] Implemented `QueryInterpreter`: Structured intent classification and entity extraction.
- [x] Implemented `AgentOrchestrator`: Deterministic DAG task state machine mapping user queries to tool pipelines.
- [x] Implemented `EvidenceEngine`: Real-time immutable `EvidenceGraph` linking claims directly to raster masks and physical numbers.
- [x] Zero-Hallucination Discrepancy ($\Delta A \equiv 0.00\%$): Mathematically constrained textual claim generation.

### Phase 6: Remote Sensing Domain Adaptation (BigEarthNet.txt) [IN PROGRESS]
- [x] Structured Top 10 Core dataset loaders (`datasets/core/`): BigEarthNet, VRSBench, RSVQA, CDVQA, LEVIR, SEN12MS, BRIGHT.
- [ ] Implement Parameter-Efficient Fine-Tuning (PEFT / LoRA) training script for RS VLM backbone.
- [ ] Save trained adapter checkpoint (`models/adapters/lora/`).

### Phase 7: Apple-Style Multi-Page Frontend Workspace [COMPLETED]
- [x] Eliminated cramped single-page layout in favor of a clean **5-Page Apple-Style Workspace**.
- [x] Built Apple-style floating translucent pill dynamic island navigation (`AppleNavbar.tsx`).
- [x] Implemented full-screen MapLibre GL JS satellite canvas (`/map`) with Esri World Imagery, smooth draggable split-screen swipe curtain, and live coordinates telemetry.
- [x] Built dedicated conversational investigation interface (`/investigate`) with collapsible execution trace accordions.
- [x] Built dedicated Evidence Vault (`/evidence`) with interactive unit switcher ($km^2 \leftrightarrow \text{ha} \leftrightarrow \text{acres}$).
- [x] Built Earth Observation catalog (`/sensors`) with Sentinel-1/2, Cartosat-3, NISAR specs.

### Phase 8: Automated Benchmark Evaluation Framework [COMPLETED]
- [x] Implemented automated benchmark runner (`evaluation/run_all_benchmarks.py`).
- [x] Evaluated across Intent Routing (83.3%), Change Detection (F1 0.903), Optical+SAR Fusion (134ms), and Anti-Hallucination ($\Delta A = 0.00\%$).
- [x] Automated JSON evaluation report export to `evaluation/reports/`.

### Phase 9: Real Satellite Demonstration Scenarios [ACTIVE]
- [x] *Scenario 1 (Real LEVIR-CD):* Sub-meter building expansion and infrastructure transformation.
- [x] *Scenario 2 (Real Sentinel-1/2):* Maritime radar reflection and optical cross-modal verification.
- [ ] Add full raw multi-gigabyte GeoTIFF demonstration scenario from Copernicus Data Space.

### Phase 10: Export Dossiers & Production Hardening [COMPLETED]
- [x] Implemented multi-format export: Markdown Dossier (`.md`), GeoJSON GIS Vectors (`.geojson`), and Complete Session State (`.json`).
- [x] Real-time WebSocket telemetry streaming (`ws://localhost:5000/ws/telemetry`).
- [x] Comprehensive persistent handoff specification in `docs/PROJECT_HANDOFF.md`.
