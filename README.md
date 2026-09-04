# SatQuery AI — Interactive Vision-Language Geospatial Investigation Platform
### Smart India Hackathon 2026 | Problem Statement: SIH26167
**Organization:** Indian Space Research Organisation (ISRO)  
**Department:** Department of Space / ISRO  
**Theme:** Space Technology | **Category:** Software  

> **🤖 AI Agents & LLM Pair Programmers (Antigravity, Cursor, Claude, Windsurf, Copilot):**  
> For complete codebase architecture, zero-hallucination guardrails, execution commands, and the prioritized **"What to Do Next"** backlog, read **[AGENTS.md](AGENTS.md)** and **[docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md)**.

---

## 🛰️ 1. Project Overview & Vision

**SatQuery AI** is an AI-powered geospatial investigation assistant tailored to the rigorous scientific and operational demands of ISRO problem statement **SIH26167**.

Rather than wrapping an ungrounded LLM that guesses visual facts, SatQuery AI implements a **deterministic, evidence-grounded agentic architecture**:
- **Zero-Hallucination Axiom:** Natural language models serve strictly as the **Reasoning, Query-Planning, and Explanation Layer**. They are mathematically constrained to never invent numbers or visual facts.
- **Specialist Remote Sensing Models & GIS Engines:** Specialist vision-language models (GeoChat, RemoteCLIP, RSVQA), change detection engines (TinyCD, ChangeFormer), and radar processors execute the physical feature extraction.
- **Auditable Evidence Graph:** Every answer produced is bound to spatial segmentation masks, bounding boxes, and physical area metrics ($km^2$, hectares, percentage shifts).

---

## 🏗️ 2. Dual-Stack Architecture (ADR 004)

```
┌─────────────────────────────────────────────────────────────┐
│                 APPLE-STYLE MULTI-PAGE FRONTEND             │
│   • /          Overview / Mission Hub (Glanceable metrics)  │
│   • /map       Full-Screen MapLibre Satellite Canvas        │
│   • /investigate AI Spatial Reasoning & Chat Workspace      │
│   • /evidence  Mathematical Evidence Vault & Exporter       │
│   • /sensors   Earth Observation Payloads & Datasets        │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST / WebSockets (Port 5000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            PRIMARY BACKEND (Node.js / TypeScript)           │
│   • API Gateway & Session Management                        │
│   • High-concurrency I/O & WebSocket Telemetry Stream       │
│   • Shared TypeScript / Zod types with Frontend             │
│   • Multi-Format Exporter (GeoJSON, Markdown, JSON)         │
└──────────────────────────────┬──────────────────────────────┘
                               │  Internal REST (Port 8000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          AI & GEOSPATIAL MICROSERVICE (Python 3.12)         │
│   • Agentic Orchestrator (DAG State Machine)                │
│   • Authentic TinyCD Siamese U-Net + MAMB Attention Block   │
│   • SAR Processor (Lee Speckle Filter + Decibel Calibrator) │
│   • Spectral Index Engine (Vectorized NDWI, NDVI, MNDWI)    │
│   • Cross-Modal Optical + SAR Fusion Engine (SEN12MS)       │
│   • Authoritative Domain RAG Engine (ESA, ISRO, IEEE GRSS)  │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ 3. Key Capabilities & SIH26167 Compliance

| Mandatory SIH Requirement | SatQuery AI Implementation | Primary Model / Specialist Engine |
|:---|:---|:---|
| **Single Optical / Multispectral** | Full multi-band raster analysis, RGB/NIR rendering, NDWI/NDVI spectral indices | `SpectralEngine` (Vectorized NumPy) |
| **Single SAR Analysis** | Sentinel-1 GRD $\sigma^0$ (dB) calibration, Enhanced Lee speckle filter, specular water detection | `SARProcessor` |
| **Single-Image RS VQA** | RS-adapted question answering on land cover, water presence, infrastructure | `VQAGroundingEngine` (GeoChat / RSVQA protocol) |
| **Captioning & Grounding** | Human-verified scene captions & text-guided region bounding boxes $[ymin, xmin, ymax, xmax]$ | `VQAGroundingEngine` (VRSBench standard) |
| **Bi-Temporal Change Analysis** | Real 0.5m LEVIR-CD pre/post observations, physical area delta ($km^2$, %), change VQA | `ChangeEngine` (PyTorch TinyCD Siamese MAMB) |
| **Cross-Modal Optical + SAR** | Co-registered Sentinel-2 and Sentinel-1 fusion, cloud-penetrating water detection | `OpticalSARFusionEngine` (SEN12MS dual-stream) |
| **Agentic Orchestration** | Autonomous query understanding, input validation, tool selection, auditable execution trace | `AgentOrchestrator` (DAG State Machine) |
| **Domain RAG Integration** | Authoritative citations from ESA Sentinel Handbooks and ISRO Cartosat/RISAT guides | `services/ai/app/agent/rag_engine.py` |
| **Evidence Graph & Tracing** | Zero-hallucination constraint tying claims to raster masks and polygons | `EvidenceGraph` & Evidence Drawer |
| **Downloadable Reports** | Mission dossiers with verified claims, metadata tables, and GIS vectors | Markdown, GeoJSON, JSON |

---

## 🚀 4. Quickstart Guide

### One-Command Startup:
```bash
./start.sh
```
This automatically initializes:
* **Python AI Specialist Service:** `http://localhost:8000`
* **Node.js Primary Backend Gateway:** `http://localhost:5000`
* **Next.js 14 Apple-Style Multi-Page UI:** `http://localhost:3000`
* **WebSocket Telemetry Stream:** `ws://localhost:5000/ws/telemetry`

---

## 📂 5. Ingested Real Datasets

Real satellite imagery is stored in `datasets/real/` and mounted in `storage/uploads/`:
- **`datasets/real/levir_cd/`**: Real 0.5m Google Earth / aerial satellite pairs from the official LEVIR-CD building change benchmark (`levir_t1.png`, `levir_t2.png`, `levir_label.png`).
- **`datasets/real/sentinel/`**: Real ESA Sentinel-1 C-band SAR (`real_sentinel1_sar_vv.png`, `vh.png`) and Sentinel-2 optical imagery (`real_sentinel2_optical.png`).

---

## ⚖️ 6. Open-Source Licenses & Attribution

All libraries and specialist models integrated into SatQuery AI have been audited for academic, competition, and research compliance in [THIRD_PARTY.md](docs/THIRD_PARTY.md).
- Source code: Apache-2.0
- Model weights: MIT / Apache-2.0 / Open Academic Research

---

## 🛠️ 7. CLI & Testing

SatQuery provides a unified dataset and training CLI via `./scripts/satquery`:
```bash
./scripts/satquery dataset list     # List 13 benchmark datasets
./scripts/satquery eval             # Run scientific benchmark evaluation
```

Run test suite:
```bash
PYTHONPATH=. .venv/bin/python tests/test_all_scenarios.py     # 6 End-to-end ISRO scenarios
PYTHONPATH=. .venv/bin/python tests/test_dataset_hub.py       # Dataset adapters & split manager
PYTHONPATH=. .venv/bin/python tests/test_training_adaptation.py # VLM collators & trainers
npm --prefix backend run build                               # Backend TypeScript check
npm --prefix frontend run build                              # Frontend Next.js build
```

---

## 🧭 8. What to Do Next (Roadmap)

See **[AGENTS.md](AGENTS.md)** for detailed implementation instructions for each item:
1. **High-Res GeoTIFF / COG Streaming:** Ingest 12-band Sentinel-2 L2A rasters and compute physical surface reflectances using windowed `rasterio`.
2. **LoRA Fine-Tuning Execution:** Run the 6-stage VLM adaptation curriculum with `satquery train` on GPU.
3. **ISRO Indian Sensor Integration:** Ingest Cartosat-3 high-resolution panchromatic & multispectral imagery and RISAT/NISAR L-band & S-band polarimetric SAR data.
4. **Production Containerization:** Add `docker-compose.yml` for unified single-command deployment.
5. **MapLibre Multi-Temporal Slider:** Enhance `/map` with multi-date temporal scrubber and polygon drawing queries.
