# SatQuery AI — Third-Party Software, Model & Data Licenses
## Comprehensive Legal, Ethical, and Compliance Audit for SIH26167
**Organization:** Indian Space Research Organisation (ISRO)  
**Standard:** Smart India Hackathon Compliance & Open-Source Attribution Guidelines  
**Status:** Audited and Compliant  
**Version:** 1.0.0

---

## 1. Compliance Statement & Legal Policy

SatQuery AI is built with strict adherence to intellectual property laws, competition regulations, and open-source licensing standards.

### Fundamental Compliance Rules:
1. **Separation of Source Code vs. Model Weights Licensing:** A permissive code license (e.g. Apache 2.0) does not automatically confer commercial rights to model weights trained on proprietary corpora. Each asset is audited independently.
2. **Competition & Hackathon Eligibility:** All libraries, foundation models, and datasets integrated into SatQuery AI permit use in academic competitions, research evaluations, and software demonstrations.
3. **Attribution Integrity:** Every third-party algorithm, dataset, and model architecture utilized within SatQuery AI is cited with complete provenance in this document and accessible via the user interface.
4. **No Proprietary Lock-In:** The system relies exclusively on open standards (GeoTIFF, STAC, COG, GeoJSON) and open-source engines without mandatory proprietary paid API keys.

---

## 2. Third-Party Code Libraries & Frameworks Audit

| Library / Tool | Primary Repository | Code License | Commercial / Competition Use | SatQuery Purpose | Attribution & Notes |
|:---|:---|:---|:---|:---|:---|
| **Rasterio** | [`rasterio/rasterio`](https://github.com/rasterio/rasterio) | BSD-3-Clause | Permitted | Geospatial raster I/O, windowed reads, geotransform manipulation | Mapbox / Sean Gillies et al. |
| **GDAL** | [`OSGeo/gdal`](https://github.com/OSGeo/gdal) | MIT / X11 | Permitted | Geospatial raster and vector abstraction library | Open Source Geospatial Foundation (OSGeo) |
| **GeoPandas** | [`geopandas/geopandas`](https://github.com/geopandas/geopandas) | BSD-3-Clause | Permitted | Geospatial vector processing, polygon simplification, area calculation | Jordahl et al. |
| **Shapely** | [`shapely/shapely`](https://github.com/shapely/shapely) | BSD-3-Clause | Permitted | Planar and geodesic geometric manipulations | Sean Gillies et al. |
| **PyTorch** | [`pytorch/pytorch`](https://github.com/pytorch/pytorch) | Modified BSD | Permitted | Core deep learning tensor computation and model runtime | Meta AI / Linux Foundation |
| **FastAPI** | [`tiangolo/fastapi`](https://github.com/tiangolo/fastapi) | MIT License | Permitted | Asynchronous REST and WebSocket API gateway | Sebastián Ramírez |
| **Next.js** | [`vercel/next.js`](https://github.com/vercel/next.js) | MIT License | Permitted | React-based frontend web framework | Vercel, Inc. |
| **MapLibre GL JS** | [`maplibre/maplibre-gl-js`](https://github.com/maplibre/maplibre-gl-js) | BSD-3-Clause | Permitted | Interactive 2D geospatial map visualization | MapLibre Community |
| **CesiumJS** | [`CesiumGS/cesium`](https://github.com/CesiumGS/cesium) | Apache 2.0 | Permitted | 3D interactive Earth globe and geospatial terrain viewer | Cesium GS, Inc. |
| **Pydantic** | [`pydantic/pydantic`](https://github.com/pydantic/pydantic) | MIT License | Permitted | Strongly typed schema validation across agent boundaries | Samuel Colvin et al. |

---

## 3. Specialist Machine Learning Models & Weights Audit

| Model Component | Source Repository / Paper | Code License | Weights License | Permitted Usage | Attribution Citation |
|:---|:---|:---|:---|:---|:---|
| **TinyCD** | [`AndreaCodegoni/Tiny_model_4_CD`](https://github.com/AndreaCodegoni/Tiny_model_4_CD) | MIT License | MIT License | Permitted (Research & Commercial) | Codegoni, Andrea, et al. *"A (Not So) Deep Learning Model For Change Detection."* arXiv:2207.13159 (2022). |
| **ChangeFormer** | [`wgcban/ChangeFormer`](https://github.com/wgcban/ChangeFormer) | Apache 2.0 | Apache 2.0 | Permitted | Bandara, Wele Gedara Chaminda, and Vishal M. Patel. *"A Transformer-Based Siamese Network for Change Detection."* IGARSS (2022). |
| **GeoChat** | [`mbzuai-oryx/GeoChat`](https://github.com/mbzuai-oryx/GeoChat) | Apache 2.0 | LLaVA Research / Non-Commercial Research | Permitted for SIH Academic/Hackathon evaluation | Kuckreja, Kartik, et al. *"GeoChat: Grounded Large Vision-Language Model for Remote Sensing."* CVPR (2024). |
| **RemoteCLIP** | [`ChenDelong1999/RemoteCLIP`](https://github.com/ChenDelong1999/RemoteCLIP) | Apache 2.0 | CC-BY-NC 4.0 | Permitted for SIH Academic/Hackathon evaluation | Chen, Delong, et al. *"RemoteCLIP: A Vision Language Foundation Model for Remote Sensing."* IEEE TGRS (2024). |
| **RSVQA-HR** | [`SylvainLobry/rsvqa`](https://github.com/SylvainLobry/rsvqa) | MIT License | Academic Open Access | Permitted | Lobry, Sylvain, et al. *"RSVQA: Visual Question Answering for Remote Sensing Data."* IEEE TGRS (2020). |
| **MobileSAM** | [`ChaoningZhang/MobileSAM`](https://github.com/ChaoningZhang/MobileSAM) | Apache 2.0 | Apache 2.0 | Permitted | Zhang, Chaoning, et al. *"Faster Segment Anything: Towards Lightweight SAM for Mobile Applications."* (2023). |

---

## 4. Benchmark & Training Datasets Audit

| Dataset | Provider / Authors | License | Usage Scope | Attribution Citation |
|:---|:---|:---|:---|:---|
| **BigEarthNet.txt** | TU Berlin (Prof. Begüm Demir et al.) | Open Access / CC-BY 4.0 | Fine-tuning & adaptation benchmark | Demir, Begüm, et al. *"BigEarthNet.txt: A Large-Scale Multi-Sensor Image-Text Dataset and Benchmark for Earth Observation."* arXiv:2603.29630 (2026). |
| **VRSBench** | Wuhan University (Xiang et al.) | Open Academic Access | Captioning, Grounding, and VQA evaluation | Xiang, et al. *"VRSBench: A Versatile Vision-Language Benchmark for Remote Sensing Image Understanding."* CVPR (2024). |
| **CDVQA / CDQAG** | Liu et al. | Research Open Access | Change-based VQA evaluation | Liu, et al. *"Change Detection Meets Visual Question Answering."* (2023). |
| **SEN12MS** | TU Munich (Prof. Michael Schmitt et al.) | CC-BY-SA 4.0 | Multimodal Optical-SAR evaluation | Schmitt, Michael, et al. *"SEN12MS — A Curated Dataset of Georeferenced Multi-Spectral Sentinel-1/2 Imagery."* ISPRS (2019). |
| **LEVIR-CD** | Beihang University (Chen & Shi) | Academic Research | Change detection benchmarking | Chen, Hao, and Zhenwei Shi. *"A Spatial-Temporal Attention-Based Method and a New Dataset for Remote Sensing Image Change Detection."* Remote Sensing (2020). |
| **ISRO Bhuvan / Bhoonidhi Sample Data** | NRSC / ISRO | Government Open Data Use | Demonstration and validation scenarios | Indian Space Research Organisation (ISRO), National Remote Sensing Centre (NRSC). |

---

## 5. Architectural Attribution to Reference Projects

In conformance with Section 8, 9, and 10 of the SIH26167 project mandate, we explicitly document conceptual inspiration from public reference codebases:

1. **God's Eye View (`bilawalsidhu/gods-eye-view`):**
   - Concept acknowledged: Tactical spatial-intelligence interface styling and 3D globe presentation.
   - Distinct Originality in SatQuery AI: SatQuery does not use the project's codebase, does not simulate surveillance, and replaces proprietary Google 3D Tiles with scientific multi-spectral and SAR GeoTIFF processing.
2. **AWS Geospatial Code Agent (`aws-samples/sample-geospatial-code-agent`):**
   - Concept acknowledged: Translating natural language to geospatial execution workflows.
   - Distinct Originality in SatQuery AI: SatQuery avoids arbitrary LLM code execution in favor of a sandboxed, typed DAG Tool Registry, and integrates bi-temporal change VQA, SAR cross-modal fusion, and an auditable evidence graph.
3. **AWS Geospatial Agent on AWS (`aws-samples/sample-geospatial-agent-on-aws`):**
   - Concept acknowledged: React + MapLibre GL JS raster tile display and COG handling.
   - Distinct Originality in SatQuery AI: SatQuery expands beyond simple spectral index calculations to encompass state-of-the-art RS VLMs, visual grounding, and change detection.
