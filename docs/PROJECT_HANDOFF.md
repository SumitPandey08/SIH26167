# SatQuery AI — Project Handoff & Session State Document
**Problem Statement:** SIH26167 | Indian Space Research Organisation (ISRO)  
**Project:** SatQuery AI — Interactive Vision-Language Assistant for Multimodal Remote Sensing  
**Last Updated:** September 2026 (Persistent Session Anchor)  
**Purpose:** Single source of truth to eliminate model confusion, prevent hallucinations across laptop restarts, and anchor future development.

---

## 🛑 1. Core Mandates & Hard Constraints (Read First)
1. **Never Hallucinate Visual Facts:** Natural language models (LLMs) MUST NEVER invent numbers, pixel areas, or visual detections. The LLM acts exclusively as the **Reasoning, Query-Planning, and Explanation Layer**.
2. **Specialist Models Perform Real GIS Computation:**
   - Change Detection: Authentic **TinyCD Siamese U-Net** (`services/ai/app/models/adapters/tinycd.py`).
   - Radar Processing: **Enhanced Lee speckle filter** and decibel calibration $\sigma^0$ (`services/ai/app/tools/sar_processor.py`).
   - Spectral Math: Vectorized NDWI, NDVI, MNDWI (`services/ai/app/tools/spectral_engine.py`).
   - Cross-Modal Fusion: Dual-stream optical NDWI + C-band SAR specular backscatter (`services/ai/app/tools/optical_sar_fusion.py`).
3. **Real Data Policy (No Fake Synthetic Noise):**
   - Synthetic PIL-drawn shapes (`generate_synthetic_demo_scenes.py`) were an initial offline stub and **MUST NOT** be used for evaluation or judging.
   - Real benchmark satellite data is stored in `datasets/real/` and mounted in `storage/uploads/`.
   - Full raw GeoTIFFs from Copernicus or ISRO Bhuvan can be dropped directly into `storage/uploads/`.

---

## 🏗️ 2. Architecture & Service Ports

| Subsystem | Tech Stack | Port / URL | Working Directory | Launch Command |
|:---|:---|:---|:---|:---|
| **Frontend UI** | Next.js 14, Tailwind CSS, MapLibre GL JS | `http://localhost:3000` | `frontend/` | `npm run dev` |
| **Primary Backend Gateway** | Node.js (ESM), TypeScript, Express, WebSockets | `http://localhost:5000` | `backend/` | `node dist/server.js` |
| **AI & Geospatial Service** | Python 3.12, PyTorch CPU, FastAPI, NumPy | `http://localhost:8000` | `services/ai/` | `PYTHONPATH=services/ai .venv/bin/python services/ai/main.py` |
| **All-in-One Startup** | Bash script running all 3 services | Ports 3000, 5000, 8000 | Root `/` | `./start.sh` |

---

## 📱 3. Multi-Page Apple-Style Frontend Map & UI Routes

The frontend has been decoupled from the old single-page split-screen into a clean **5-Page Apple-Style Workspace**:
* **Header Navigation:** `frontend/src/components/AppleNavbar.tsx` (Floating translucent pill dynamic island).
* **Routes:**
  1. **`/` (Overview):** VisionOS/Apple Health style glanceable metric cards (`20.31 km²` water, `-5.86%` delta, `0.00%` $\Delta A$, `134ms` speed), active investigation scenario cards, and launch buttons.
  2. **`/map` (Satellite Map):** Full-screen edge-to-edge MapLibre satellite canvas with Esri World Imagery, smooth draggable split-screen swipe curtain, floating Apple layer controls, and live coordinates telemetry (`27.8324°N, 85.5718°E`).
  3. **`/investigate` (AI Investigation):** Clean conversational reasoning interface with prompt pills, collapsible execution trace disclosure accordions, and verified claim badges.
  4. **`/evidence` (Evidence Vault):** Mathematical verification vault with live unit switcher ($km^2 \leftrightarrow \text{ha} \leftrightarrow \text{acres}$), model provenance tags, and direct GeoJSON/Markdown downloads.
  5. **`/sensors` (Sensors & Data):** Earth Observation catalog of Sentinel-1, Sentinel-2, Cartosat-3, NISAR, and the 10-Tier Dataset Taxonomy.

---

## 🛰️ 4. Ingested Datasets Status

### A. Real Satellite Data (Currently Ingested & Active):
* **`datasets/real/levir_cd/`:**
  * `levir_t1.png`: Real 0.5m GSD optical satellite scene (pre-construction baseline).
  * `levir_t2.png`: Real 0.5m GSD optical satellite scene (newly built residential homes & roads).
  * `levir_label.png`: Real ground-truth building change mask.
  * Active in Investigation: `real_levir_urban_change` (`Demo 1`).
* **`datasets/real/sentinel/`:**
  * `real_sentinel2_optical.png`: Real ESA Sentinel-2 MSI Level-1C True Color Image.
  * `real_sentinel1_sar_vv.png`: Real ESA Sentinel-1 C-Band SAR VV GRD backscatter image.
  * `real_sentinel1_sar_vh.png`: Real ESA Sentinel-1 C-Band SAR VH cross-polarization image.
  * Active in Investigation: `real_sentinel_crossmodal` (`Demo 2`).

### B. Top 10 Core Dataset Loaders Built (`datasets/core/`):
* `bigearthnet.py`: Multi-sensor Sentinel-1 SAR + Sentinel-2 multispectral patch loader.
* `vrsbench.py`: Dense captions, visual grounding bounding boxes, and QA pairs.
* `rsvqa.py`: Remote sensing visual question answering loader.
* `cdvqa.py`: Bi-temporal change visual question answering loader.
* `levir.py`: LEVIR-CD building change masks and LEVIR-CC change descriptions.
* `sen12ms.py`: Co-registered S1 SAR + S2 Optical triplets.
* `bright_urbansar.py`: Extreme disaster multimodal optical+SAR change loader.

---

## 📚 5. Authoritative RAG Knowledge Base (`services/ai/knowledge/`)

The agent does not guess sensor physics; it consults markdown documents indexed by `services/ai/app/agent/rag_engine.py`:
* `sensors/sentinel_1.md`: C-band SAR physics, $\sigma^0$ dB conversion, specular water scattering, Lee speckle filter.
* `sensors/sentinel_2.md`: 13 MSI spectral bands, NDWI $(B3-B8)/(B3+B8)$, NDVI $(B8-B4)/(B8+B4)$, MNDWI.
* `sensors/cartosat_risat.md`: ISRO Cartosat-2/3 ($<0.28m$), Resourcesat LISS-IV, RISAT/NISAR Dual-SAR.
* `remote_sensing/change_detection.md`: Sub-pixel co-registration, phenological vs structural change rules.
* `disasters/flood_sar_optical.md`: All-weather flood assessment, monsoon cloud penetration via SAR.

---

## ⚡ 6. How to Start Everything After a Laptop Reboot

If you turn off your machine and return later, run:

```bash
cd /home/sumit/Documents/SatQuery
./start.sh
```

Then open **`http://localhost:3000`** in your browser.

To stop the services, press `Ctrl+C` in that terminal.

### Manual Individual Commands (if debugging):
```bash
# 1. Python AI Service (Port 8000)
source .venv/bin/activate
PYTHONPATH=services/ai python services/ai/main.py

# 2. Node Backend (Port 5000)
cd backend
npm run build && node dist/server.js

# 3. Next.js Frontend (Port 3000)
cd frontend
npm run dev
```

---

## 📋 7. Next Actions for Future Development
1. **Full-Scale Real GeoTIFF Ingestion:**
   - Drop large multi-band `.tif` files into `storage/uploads/`.
   - Ingest real Sentinel-2 12-band products to compute true physical surface reflectance.
2. **Fine-Tuning / Evaluation Runs:**
   - Run `python evaluation/run_all_benchmarks.py` to produce benchmark reports in `evaluation/reports/`.
3. **Mobile & Demo Polish:**
   - Record video walkthrough for SIH evaluation showcasing real LEVIR-CD and Sentinel-1/2 data.
