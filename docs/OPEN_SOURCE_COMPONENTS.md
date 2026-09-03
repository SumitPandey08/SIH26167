# SatQuery AI — Open Source Components Evaluation & Reconnaissance
## Comprehensive Review of Candidate Repositories, Models, and Libraries for SIH26167
**Author:** SatQuery AI Architectural Team  
**Date:** September 2026  
**Status:** Approved for Integration Planning

---

## 1. Primary Reference Repositories Analysis

### 1.1 God's Eye View
- **Repository:** [`bilawalsidhu/gods-eye-view`](https://github.com/bilawalsidhu/gods-eye-view)
- **License:** MIT License
- **Primary Technology Stack:** CesiumJS, satellite.js, MGRS, WebGL, Next.js, OpenAI Realtime API.
- **Architectural Purpose in SatQuery:**
  - *What to Adopt:* The professional spatial-intelligence presentation paradigm; camera projection techniques; Cesium 3D globe coordinate targeting; mission-critical dark UI aesthetics; layer switching mechanics.
  - *What NOT to Adopt:* The product identity ("spy satellite simulator"); voice-only cockpit control; reliance on proprietary Google 3D Photorealistic Tiles API (which incurs heavy commercial API costs and lacks native multi-spectral GeoTIFF support); ungrounded conversational LLM guesses.
- **Verdict & Recommendation:** **ADAPT FOR 3D GLOBE UI LAYER ONLY**. SatQuery remains a scientific, evidence-based remote sensing investigation workbench, not a surveillance simulator.

### 1.2 AWS Geospatial Code Agent
- **Repository:** [`aws-samples/sample-geospatial-code-agent`](https://github.com/aws-samples/sample-geospatial-code-agent)
- **License:** Apache 2.0
- **Primary Technology Stack:** Python, Amazon Bedrock, Streamlit, Rasterio, Planetary Computer STAC API, Xarray.
- **Architectural Purpose in SatQuery:**
  - *What to Adopt:* Natural language translation into geospatial Python workflows; in-memory raster data passing patterns; token/cost observability concepts.
  - *What NOT to Adopt:* Blindly executing LLM-generated arbitrary Python code in production (violates security guideline Section 33); AWS Bedrock lock-in.
- **Verdict & Recommendation:** **REFERENCE FOR AGENT PIPELINE PATTERNS**. SatQuery will use a typed, deterministic tool registry and sandboxed DAG execution instead of arbitrary string code execution.

### 1.3 AWS Geospatial Agent on AWS
- **Repository:** [`aws-samples/sample-geospatial-agent-on-aws`](https://github.com/aws-samples/sample-geospatial-agent-on-aws)
- **License:** Apache 2.0
- **Primary Technology Stack:** React, MapLibre GL JS, TiTiler, FastAPI, AWS CDK, Sentinel-2 COGs.
- **Architectural Purpose in SatQuery:**
  - *What to Adopt:* MapLibre GL JS tile rendering; Cloud-Optimized GeoTIFF (COG) serving via TiTiler / FastAPI raster windowing; spectral index calculation logic ($NDVI, NDWI, NBR$).
  - *What NOT to Adopt:* Narrow focus on single-image spectral indices. SIH26167 requires deep multi-modal vision-language models, bi-temporal change VQA, and SAR analysis which this sample lacks.
- **Verdict & Recommendation:** **INTEGRATE MAPLIBRE & COG TILING PATTERNS**.

### 1.4 RS-Foundation-Models (Awesome List)
- **Repository:** [`wgcban/RS-Foundation-Models`](https://github.com/wgcban/RS-Foundation-Models)
- **Maintainer:** Wele Gedara Chaminda Bandara (Johns Hopkins / CVPR author)
- **License:** Apache 2.0 / CC-BY-4.0
- **Architectural Purpose in SatQuery:** Serves as our index for surveying peer-reviewed remote sensing foundation models (RingMo, RemoteCLIP, GeoChat, ChangeFormer, DDPM-CD).
- **Verdict & Recommendation:** **TAXONOMY & BENCHMARK INDEX REFERENCE**.

---

## 2. Remote Sensing Vision-Language & VQA Models

| Candidate Model | Repository / Source | License (Code / Weights) | Modality & Tasks | Hardware Footprint | Pros | Cons & Limitations | Recommendation |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **GeoChat** | [`mbzuai-oryx/GeoChat`](https://github.com/mbzuai-oryx/GeoChat) | Apache-2.0 / LLaVA Research | High-Res Optical; VQA, Grounding, Captioning | ~14GB VRAM (7B FP16); ~4.5GB (4-bit QLoRA) | First grounded RS VLM; outputs bounding boxes $[ymin, xmin, ymax, xmax]$; CVPR 2024. | Heavy for CPU-only local runs without quantization. | **PRIMARY RS VLM** (GPU/Colab/Quantized profile). |
| **RemoteCLIP** | [`ChenDelong1999/RemoteCLIP`](https://github.com/ChenDelong1999/RemoteCLIP) | Apache-2.0 / CC-BY-NC 4.0 | Multi-spectral Optical; Zero-shot classification, retrieval | ResNet-50: ~200MB, ViT-B/32: ~600MB; Runs easily on CPU! | Ultra-lightweight; OpenCLIP compatible; fast zero-shot land cover verification. | Cannot generate natural language text independently (embedding model). | **PRIMARY EMBEDDING & RETRIEVAL HEAD**. |
| **RSVQA-HR / LR** | [`SylvainLobry/rsvqa`](https://github.com/SylvainLobry/rsvqa) | MIT / Open Research | Low/High-Res Sentinel-2 / Aerial Optical; VQA | ~150MB weights; CPU real-time (<50ms) | Dedicated RS question answering benchmark; very low latency; deterministic. | Limited vocabulary compared to modern 7B VLMs; closed question types. | **DETERMINISTIC VQA FALLBACK HEAD**. |
| **EarthGPT** | Open-source RS VLM | Apache-2.0 / Research | Multi-sensor Optical, SAR, Infrared | ~15GB VRAM | Multi-sensor support | Codebase less modular than GeoChat; larger memory footprint. | Secondary reference. |

---

## 3. Remote Sensing Captioning & Text-Guided Grounding

| Candidate Model | Repository / Source | License | Modality & Tasks | Hardware Footprint | Recommendation |
|:---|:---|:---|:---|:---|:---|
| **VRSBench Suite** | [`lx709/VRSBench`](https://github.com/lx709/VRSBench) | Apache-2.0 | Optical; Dense Captioning, Visual Grounding, VQA | Standard PyTorch / HuggingFace; ~1-3GB | **CORE BENCHMARK & FINE-TUNING DATASET**. Used for adapting captioner and evaluating grounding accuracy. |
| **Grounding DINO + MobileSAM** | `IDEA-Research/GroundingDINO` + `ChaoningZhang/MobileSAM` | Apache-2.0 | Optical RS Images; Open-vocabulary object grounding + segmentation | MobileSAM: 40MB weights, CPU <200ms; Grounding DINO tiny: ~600MB | **PRIMARY LOCAL GROUNDING & SEGMENTATION HEAD**. Generates pixel-accurate binary masks from text prompts (e.g. "buildings", "ships", "aircraft", "storage tanks"). |

---

## 4. Bi-Temporal Remote Sensing Change Detection Models

| Candidate Model | Repository / Source | License | Architecture & Method | Weight Size & Hardware | Inference Speed | Recommendation |
|:---|:---|:---|:---|:---|:---|:---|
| **TinyCD** | [`AndreaCodegoni/Tiny_model_4_CD`](https://github.com/AndreaCodegoni/Tiny_model_4_CD) | MIT License | Siamese U-Net + Mix and Attention Mask Block (MAMB) | **~1.3 MB** (0.3M parameters!); Runs comfortably on 2GB RAM / CPU | **<45 ms** on CPU; real-time! | **PRIMARY PRODUCTION CHANGE MODEL**. Unmatched efficiency, zero cloud GPU dependency for standard change detection. |
| **ChangeFormer** | [`wgcban/ChangeFormer`](https://github.com/wgcban/ChangeFormer) | Apache-2.0 | Siamese Transformer encoder + MLP decoder | ~160 MB (41M params); 4GB VRAM | ~350 ms on GPU; ~2.5s on CPU | **ADVANCED GPU PROFILE CHANGE MODEL**. Delivers state-of-the-art boundary precision on complex urban change. |
| **Open-CD Toolbox** | [`likyoo/open-cd`](https://github.com/likyoo/open-cd) | Apache-2.0 | Modular benchmark suite (Changer, BIT, TinyCD, SNUNet) | Multi-model framework | Variable | **BENCHMARKING & VALIDATION RUNNER**. |

---

## 5. Change VQA & Change Captioning Models

| Candidate Component | Repository / Source | License | Focus Task | Dataset / Backbone | Recommendation |
|:---|:---|:---|:---|:---|:---|
| **CDVQA** | [`YZHJessica/CDVQA`](https://github.com/YZHJessica/CDVQA) | Apache-2.0 / Academic | Bi-temporal change question answering | Multi-temporal RS change QA | **PRIMARY CHANGE-VQA PROTOCOL & BENCHMARK**. Answers semantic questions: "Did buildings appear?", "What replaced the forest?". |
| **VisTA (CDQAG)** | [`like413/VisTA`](https://github.com/like413/VisTA) | Apache-2.0 | Change Detection QA + Visual Mask Grounding | Bi-temporal feature fusion + mask decoder | **GROUNDED CHANGE-QA ARCHITECTURE REFERENCE**. |
| **RSICC** | [`Chen-Yang-Liu/RSICC`](https://github.com/Chen-Yang-Liu/RSICC) | Apache-2.0 | Bi-temporal change captioning | Transformer encoder-decoder | **CHANGE DESCRIPTION GENERATION ENGINE**. |

---

## 6. Cross-Modal Optical + SAR Analysis Components

| Candidate Tool / Dataset | Repository / Source | License | Modality & Methodology | Recommendation |
|:---|:---|:---|:---|:---|
| **SEN12MS & SEN1-2** | [`schmitt-muc/SEN12MS`](https://github.com/schmitt-muc/SEN12MS) | CC-BY-SA 4.0 / Open Data | Sentinel-1 SAR (VV/VH) + Sentinel-2 Multispectral + MODIS Land Cover | **OFFICIAL MULTI-MODAL PRE-TRAINING & BENCHMARK BASELINE**. 180k georeferenced triplets. |
| **SAR Lee Filter & Calibrator** | Custom SatQuery Geospatial Engine (`scipy.signal` + `rasterio`) | MIT / SatQuery Original | Sentinel-1 GRD $\sigma^0$ conversion, local variance speckle reduction | **CORE SAR PREPROCESSING TOOL**. Pure vectorized Python/NumPy, zero external heavy dependencies. |
| **Dual-Stream Feature Fusion Network** | SatQuery Custom PyTorch Module | MIT / SatQuery Original | Cross-attention fusion between SAR texture/backscatter and Optical spectral indices | **CORE OPTICAL-SAR FUSION ENGINE**. Produces fused water and built-up masks under cloud cover. |

---

## 7. Geospatial & Visualization Stack

| Category | Component | License | Purpose in SatQuery | Justification |
|:---|:---|:---|:---|:---|
| **Raster I/O & Geometry** | **Rasterio & GDAL** | BSD-3-Clause / MIT | GeoTIFF reading, writing, windowed reads, CRS reprojection, affine transform | Industry gold standard for geospatial raster operations. |
| **Vector Processing** | **GeoPandas & Shapely** | BSD-3-Clause | Polygon conversion from masks, area calculation ($m^2, km^2$), GeoJSON export | Precise geodesic and projected area calculations without rounding errors. |
| **Spectral Engine** | **NumPy + Numba Vectorized** | BSD-3-Clause | $NDWI, NDVI, MNDWI, NBR, BSI$ computation | Blazingly fast, zero-copy array math. |
| **2D Map Engine** | **MapLibre GL JS** | BSD-3-Clause | 2D interactive raster/vector map, split-screen swipe, polygon highlights | High-performance WebGL, 100% open-source, no Mapbox token lock-in. |
| **3D Globe Engine** | **CesiumJS** | Apache-2.0 | 3D planetary context, terrain elevation, coordinate targeting | Rich 3D Earth visualization without proprietary API fees. |

---

## 8. Summary of Selected Stack for SatQuery AI

1. **Agent Reasoning & Plan Orchestration:** Custom Typed DAG State Machine with Pydantic v2 schemas and strict evidence validation.
2. **Single-Image VQA / VLM:** GeoChat (high-capacity profile) + RSVQA / RemoteCLIP (lightweight edge profile).
3. **Grounding & Captioning:** VRSBench adapter + MobileSAM / Grounding DINO.
4. **Bi-Temporal Change Detection:** TinyCD (default edge & CPU profile) + ChangeFormer (advanced GPU profile).
5. **Change VQA & Description:** CDVQA protocol + RSICC change captioning head.
6. **Cross-Modal Optical + SAR:** SEN12MS dual-stream feature fusion + vectorized SAR Lee filter and backscatter decibel calibrator.
7. **Remote Sensing Adaptation:** BigEarthNet.txt instruction fine-tuning using LoRA / PEFT.
8. **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, MapLibre GL JS, CesiumJS.
9. **Backend:** FastAPI (Python 3.12), Rasterio, GeoPandas, PyTorch, PostGIS, Uvicorn.
