# 🤖 AGENTS.md — SatQuery AI System Context & Agent Operations Manual

> **FOR ANY AI AGENT (Antigravity, Cursor, Claude Code, Copilot, Windsurf, Aider, Devin):**  
> Read this document completely before modifying or running any code. It is the single source of truth regarding the architecture, operational constraints, execution commands, and **What to Do Next**.

---

## 🛰️ 1. Project Identity & Purpose

- **Project Name:** SatQuery AI
- **Initiative:** Smart India Hackathon (SIH) 2026
- **Problem Statement:** **SIH26167** — Interactive Vision-Language Geospatial Investigation Platform
- **Organization:** Indian Space Research Organisation (ISRO) / Department of Space
- **Core Problem:** Standard Large Language Models (LLMs) hallucinate visual facts, invent metrics, and cannot process raw Earth Observation (EO) satellite sensor physics (SAR backscatter, multi-band multispectral reflectances, sub-meter bi-temporal changes).
- **SatQuery Solution:** A deterministic, multi-agent geospatial reasoning platform where natural language models act **exclusively as the Query Planning and Reasoning Layer**, while specialist neural networks (PyTorch TinyCD U-Net, RemoteCLIP, SciPy Lee speckle filter, Vectorized Spectral Index Engine) perform the empirical GIS mathematics.

---

## 🛑 2. Non-Negotiable Core Mandates (Zero-Hallucination Axiom)

1. **NEVER Invent Numerical Values or Detections:**
   - Any physical area ($km^2$, hectares, percentage changes), count of buildings, or coordinates MUST originate from a deterministic specialist tool output (`services/ai/app/tools/specialists/`).
   - The LLM explains and contextualizes; it never creates facts.
2. **Every Claim Must Link to an Evidence Node:**
   - All assertions are compiled into the `EvidenceGraph` (`services/ai/app/schemas/evidence.py`).
   - If an evidence node does not contain a verified mask or bounding box, mark confidence as uncertain.
3. **Real Satellite Imagery Only:**
   - Synthetic toy shapes (`generate_synthetic_demo_scenes.py`) were an initial offline stub.
   - All benchmarking, testing, and production runs use real satellite data (`datasets/real/` and `storage/uploads/`), including official LEVIR-CD pairs and Sentinel-1/2 scenes.

---

## 🏗️ 3. Architecture & Service Ports

SatQuery AI runs as a 3-tier decoupled stack:

```
┌─────────────────────────────────────────────────────────────┐
│                 FRONTEND (Next.js 14 + Tailwind)            │
│   • Directory: frontend/                                    │
│   • Port: 3000 (http://localhost:3000)                      │
│   • Key Tech: App Router, MapLibre GL JS, Framer Motion     │
│   • Pages: / (Overview), /map, /investigate, /evidence,     │
│            /sensors                                         │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST / WebSockets (Port 5000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            PRIMARY BACKEND (Node.js / TypeScript)           │
│   • Directory: backend/                                     │
│   • Port: 5000 (http://localhost:5000)                      │
│   • Key Tech: Express (ESM), TypeScript, ws (WebSockets)    │
│   • Purpose: API Gateway, Investigation Store, Telemetry    │
│              Stream, Static Storage Mounter                 │
└──────────────────────────────┬──────────────────────────────┘
                               │  Internal HTTP (Port 8000)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          AI SPECIALIST SERVICE (Python 3.12 / FastAPI)      │
│   • Directory: services/ai/                                 │
│   • Port: 8000 (http://localhost:8000)                      │
│   • Key Tech: PyTorch, FastAPI, NumPy, SciPy, Pydantic      │
│   • Purpose: 10-Stage DAG Orchestrator, TinyCD Siamese      │
│              U-Net, SAR Lee Filter, Spectral NDWI/NDVI,     │
│              Optical-SAR Cross-Modal Fusion, RAG Engine     │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ 4. How to Run Everything

### A. One-Command Complete Startup
From the repository root:
```bash
./start.sh
```
This automatically launches all three services in parallel, with graceful shutdown on `Ctrl+C`.

### B. Running Services Individually

```bash
# 1. Python AI Service (Port 8000)
source .venv/bin/activate
PYTHONPATH=services/ai python services/ai/main.py

# 2. Node.js Gateway Backend (Port 5000)
cd backend
npm run build
node dist/server.js

# 3. Next.js Frontend (Port 3000)
cd frontend
npm run dev
```

### C. SatQuery CLI Tool
SatQuery includes a unified CLI executable in `scripts/satquery`:
```bash
# View available commands
./scripts/satquery --help

# List all 13 supported scientific benchmark datasets
./scripts/satquery dataset list

# Inspect dataset details
./scripts/satquery dataset info VRSBench

# Run scientific benchmark evaluation
./scripts/satquery eval --benchmark levir_cd
```

---

## 🧪 5. Testing & Verification Commands

Whenever you make changes, verify the entire system with these commands:

```bash
# 1. Run all 6 End-to-End ISRO Scenarios (Definition of Done)
PYTHONPATH=. .venv/bin/python tests/test_all_scenarios.py

# 2. Run Dataset Hub Tests (Adapters, Manifests, Splits)
PYTHONPATH=. .venv/bin/python tests/test_dataset_hub.py

# 3. Run VLM Training Adaptation & Collator Tests
PYTHONPATH=. .venv/bin/python tests/test_training_adaptation.py

# 4. Run System Regression Tests
PYTHONPATH=. .venv/bin/python tests/test_regression.py

# 5. Verify Backend TypeScript Build
npm --prefix backend run build

# 6. Verify Frontend Production Build
npm --prefix frontend run build
```

---

## 📁 6. Repository Layout & Map

```
SatQuery/
├── AGENTS.md                  # <-- You are here (AI Context & Agent Guidelines)
├── README.md                  # Project overview & quickstart
├── start.sh                   # One-command startup script
├── .cursorrules               # Cursor IDE agent instructions
├── CLAUDE.md                  # Claude Code agent instructions
├── satquery/                  # Unified Python core package
│   ├── cli.py                 # SatQuery CLI implementation
│   ├── datasets/              # Registry, schema, and 13 benchmark adapters
│   │   ├── adapters/          # VRSBench, LEVIR-CD, SEN12MS, BigEarthNet, etc.
│   │   ├── registry.py        # Dataset discovery and metadata catalog
│   │   ├── schema.py          # UnifiedRemoteSensingExample canonical model
│   │   └── validator.py       # Quality assurance checks
│   ├── training/              # VLM training adaptation & collators
│   └── evaluation/            # Benchmark evaluator & metrics
├── services/ai/               # Python AI & Geospatial Microservice
│   ├── main.py                # FastAPI entrypoint (Port 8000)
│   ├── app/
│   │   ├── agent/             # Orchestrator DAG, Interpreter, RAG Engine
│   │   ├── models/            # Model adapters (TinyCD Siamese MAMB, RemoteCLIP)
│   │   ├── schemas/           # Pydantic contracts (Evidence, Claims, Metadata)
│   │   └── tools/             # Specialist GIS tools (SAR, Spectral, Change, Fusion)
│   └── knowledge/             # Authoritative RAG markdown documents (Sentinel, ISRO)
├── backend/                   # Primary Node.js / TypeScript Gateway
│   ├── src/
│   │   ├── server.ts          # Express + WebSocket server (Port 5000)
│   │   ├── controllers/       # Investigation controller
│   │   ├── routes/api.ts      # REST endpoints
│   │   └── services/          # Python HTTP client & Investigation Store
│   └── package.json
├── frontend/                  # Next.js 14 Multi-Page Web App
│   ├── src/app/
│   │   ├── page.tsx           # / (Overview / Glanceable metrics)
│   │   ├── map/page.tsx       # /map (MapLibre Satellite Canvas with temporal slider)
│   │   ├── investigate/page.tsx # /investigate (Agent Reasoning & Chat)
│   │   ├── evidence/page.tsx  # /evidence (Mathematical Evidence Vault)
│   │   └── sensors/page.tsx   # /sensors (Earth Observation sensor catalog)
│   ├── src/components/        # Reusable UI (AppleNavbar, EvidenceDrawer, etc.)
│   └── package.json
├── data/                      # Dataset catalogs & splits
│   └── metadata/              # datasets.json, dataset_build_manifest.json
├── storage/                   # File storage
│   ├── uploads/               # Real satellite rasters (LEVIR, Sentinel)
│   ├── masks/                 # Output binary masks & visualizations (.gitignored)
│   └── reports/               # Output investigation dossiers (.gitignored)
├── tests/                     # Test suite (all scenarios & regression)
└── docs/                      # Architectural Decision Records & Specs
    ├── PROJECT_HANDOFF.md     # Persistent session anchor
    ├── IMPLEMENTATION_STATUS.md # Detailed status matrix
    └── DATASET_ARCHITECTURE.md # 13-benchmark dataset hub design
```

---

## 🎯 7. WHAT TO DO NEXT (Roadmap & Prioritized Backlog)

If you are an AI agent or contributor joining this project, here is the exact list of prioritized next steps:

### 🟢 Priority 1: High-Resolution Real GeoTIFF Ingestion & COG Streaming
- **Current State:** The system handles `.png`, `.jpg`, and standard `.tif` formats through PIL and NumPy, with graceful fallback if `rasterio` is uninstalled.
- **Next Action:**
  1. Add native Cloud-Optimized GeoTIFF (COG) tiling and windowed reading using `rasterio` and `rio-tiler`.
  2. Ingest full 12-band Sentinel-2 Level-2A surface reflectance rasters directly into `storage/uploads/` to calculate true physical reflectance indices ($B2, B3, B4, B8, B11, B12$).
  3. Extract real geospatial bounding box CRS (EPSG:4326 / UTM) dynamically from GeoTIFF headers so MapLibre automatically centers on the exact real-world coordinates of uploaded rasters.

### 🟢 Priority 2: VLM Fine-Tuning Execution via `satquery train`
- **Current State:** The training pipeline infrastructure is 100% complete (`satquery/training/` with `RemoteSensingCollator`, `InstructionConverter`, and `configs/training/`).
- **Next Action:**
  1. Connect a GPU instance (e.g. NVIDIA A100 or RTX 4090) with CUDA enabled.
  2. Run the 6-stage adaptation curriculum:
     ```bash
     ./scripts/satquery train --stage stage4_grounding --dataset VRSBench
     ```
  3. Save exported LoRA adapter weights to `storage/checkpoints/` and wire them into `services/ai/app/models/adapters/geochat.py`.

### 🟡 Priority 3: Ingest ISRO Indian Sensor Data (Cartosat-3 & RISAT/NISAR)
- **Current State:** Sentinel-1, Sentinel-2, and aerial LEVIR-CD data are active. The RAG knowledge base already has complete documentation for Cartosat-3 ($0.28m$ GSD) and RISAT/NISAR ($L$-band & $S$-band SAR).
- **Next Action:**
  1. Download sample open Cartosat / Bhuvan tiles and place them in `datasets/real/cartosat/`.
  2. Ingest dual-frequency $L$-band + $S$-band SAR polarimetry data (HH, HV, VV, VH) to enable soil moisture and canopy penetration analysis alongside Sentinel-1 $C$-band.

### 🟡 Priority 4: Production Containerization (Docker Compose)
- **Current State:** Startup is handled via `./start.sh` on Ubuntu Linux.
- **Next Action:**
  1. Create a root `docker-compose.yml` defining three services:
     - `satquery-frontend`: Node 20 Alpine building Next.js.
     - `satquery-backend`: Node 20 Alpine running Express.
     - `satquery-ai`: Python 3.12 Slim with PyTorch CPU or CUDA.
  2. Include health checks matching `/api/system/health` on Port 5000 and `/docs` on Port 8000.

### ⚪ Priority 5: Advanced UI Enhancements
- **Current State:** Next.js frontend has a 5-page Apple-style layout with MapLibre GL JS, swipe curtain, and evidence vault.
- **Next Action:**
  1. Add a multi-timestamp scrubber slider to `/map` to scrub across $>2$ time intervals (T1, T2, T3, T4).
  2. Implement real-time bounding box drawing on `/map` to allow users to draw a polygon on the map and click *"Query this Area"*.

---

## 💡 8. Key Coding Conventions & Gotchas

1. **Python Imports:**
   - Always ensure `PYTHONPATH=.` or `PYTHONPATH=services/ai` when executing scripts from terminal.
   - Python version: `>= 3.10` (tested on `3.12`).
2. **Node.js Backend:**
   - The backend uses ES Modules (`"type": "module"` in `backend/package.json`).
   - In TypeScript source files under `backend/src/`, always append `.js` to relative imports (e.g. `import apiRoutes from './routes/api.js';`).
3. **Next.js Frontend:**
   - Next.js 14 App Router is used (`frontend/src/app/`).
   - Client components must start with `'use client';`.
   - MapLibre GL must be loaded dynamically (`dynamic(() => import(...), { ssr: false })`) to avoid server-side `window is not defined` errors.
4. **Git Hygiene:**
   - Never commit raw datasets (>50MB), checkpoints, `.env` files, or `storage/reports/*.json` test outputs.
   - Respect `.gitignore`.
