# SatQuery AI — Comprehensive Dataset Architecture & Evaluation Taxonomy
## 10-Tier Remote Sensing Dataset Classification & Implementation Strategy
**Standard:** SIH26167 Compliance Specification | ISRO / SAC  
**Version:** 2.0.0  
**Status:** Approved for Implementation

---

## 1. Architectural Strategy: The 3-Bucket Rule

To avoid the common hackathon trap of blindly downloading hundreds of gigabytes across 40+ disparate datasets without completing the end-to-end pipeline, SatQuery AI classifies all remote sensing datasets into **Three Pragmatic Implementation Buckets**:

```
🔴 BUCKET 1: CORE (Actually Implemented & Benchmarked)
   • BigEarthNet v2.0 (S1 + S2 Multi-Sensor)
   • VRSBench (Captioning, Grounding, VQA)
   • RSVQA (Single-image remote-sensing QA)
   • CDVQA (Bi-temporal change question-answering)
   • LEVIR-CD (Pixel-level building change detection)
   • LEVIR-CC (Change captioning: "What changed?")
   • FloodNet (Flood visual reasoning & damage)
   • SEN12MS (Sentinel-1 SAR + Sentinel-2 Optical pairs)
   • DOTA / DIOR / FAIR1M / RSVG (Object grounding & referring boxes)
   • BRIGHT / UrbanSARFloods (Optical + SAR semantic change detection)

🟡 BUCKET 2: EVALUATION & ROBUSTNESS (Validation Splits & OOD Testing)
   • SECOND (Old land cover -> New land cover semantic transition)
   • WHU-CD & DSIFN-CD (Independent building & multi-scale change)
   • DisasterM3 (Optical + SAR disaster damage assessment)
   • GDCLD (Global Distributed Coseismic Landslides)
   • NWPU-RESISC45 & EuroSAT (Scene & land cover classification)
   • RSICD & RSITMD (Image-text retrieval & caption baselines)
   • fMoW (Functional Map of the World)

🟢 BUCKET 3: LARGE-SCALE FOUNDATION PRETRAINING (Future Scaling)
   • RS5M & SkyScript (~5M RS image-text pretraining)
   • LHRS-Align & LHRS-Instruct (Geospatial instruction tuning)
   • GeoChat-Set & MMRS-1M (Multi-task unified instruction corpus)
   • SatCLIP / S2-100K & GeoCLIP (Geospatial coordinate representation)
```

---

## 2. Comprehensive 10-Tier Dataset Catalog

### Tier 1 — Must Have: Vision-Language & Core Foundations
1. **BigEarthNet v2.0 / BigEarthNet.txt (⭐⭐⭐⭐⭐):**
   - *Scale:* 549,488 Sentinel-1/Sentinel-2 paired image patches with 9.6M text annotations.
   - *Modality:* C-band SAR ($\sigma^0_{VV}, \sigma^0_{VH}$) + 12-band Multispectral.
   - *Role in SatQuery:* Primary foundation for remote-sensing adaptation via LoRA / PEFT.
2. **VRSBench (⭐⭐⭐⭐⭐):**
   - *Scale:* 29,614 images, 29,614 human-verified captions, 52,472 referring objects, 123,221 QA pairs.
   - *Role in SatQuery:* Powers single-image VQA, dense scene captioning, and text-guided visual grounding.
3. **RSVQA-LR / HR (⭐⭐⭐⭐⭐):**
   - *Scale:* Sentinel-2 and high-resolution aerial VQA covering object counting, presence, and spatial comparison.
   - *Role in SatQuery:* Deterministic benchmark for overhead natural-language visual QA.
4. **CDVQA / CDQAG (⭐⭐⭐⭐⭐):**
   - *Scale:* Multi-temporal image pairs with paired questions: $Image_{T1} + Image_{T2} + Question \to Answer + Mask$.
   - *Role in SatQuery:* Core dataset for the 2020 $\to$ 2026 temporal investigation workflow.

### Tier 2 — Change Detection & Change Captioning
5. **LEVIR-CD (⭐⭐⭐⭐⭐):**
   - *Task:* High-resolution ($0.5m$) building construction & demolition change detection.
   - *Role in SatQuery:* Ground-truth benchmark for TinyCD and ChangeFormer binary masks.
6. **LEVIR-CC (⭐⭐⭐⭐⭐):**
   - *Task:* Remote Sensing Image Change Captioning. Moves beyond "pixel changed" to explaining *"What changed?"* in natural language.
   - *Role in SatQuery:* Directly aligns with our conversational investigation experience.
7. **SECOND (⭐⭐⭐⭐):**
   - *Task:* Semantic Change Detection mapping transition matrices ($Class_{T1} \to Class_{T2}$).
8. **WHU-CD & DSIFN-CD (⭐⭐⭐⭐):**
   - *Task:* Independent benchmarks for building change and multi-sensor sensor shift resilience.

### Tier 3 — Disaster, Flood & Landslide Analysis
9. **FloodNet (⭐⭐⭐⭐⭐):**
   - *Task:* High-resolution UAV/satellite disaster assessment (submerged roads, flooded buildings, structural damage).
   - *Role in SatQuery:* Instruction reasoning on flood devastation.
10. **UrbanSARFloods (⭐⭐⭐⭐):**
    - *Task:* 8,879 Sentinel-1 SAR image patches specifically curated for flood semantic change detection.
    - *Role in SatQuery:* SAR-based all-weather flood validation.
11. **DisasterM3 (⭐⭐⭐⭐⭐):**
    - *Task:* Optical + SAR multimodal instruction dataset for disaster damage assessment.
12. **GDCLD (Global Distributed Coseismic Landslide Dataset):**
    - *Task:* Coseismic landslide scars, terrain disturbances, and mudflows.

### Tier 4 — Optical + SAR Multimodal Analysis
13. **SEN12MS (⭐⭐⭐⭐⭐):**
    - *Scale:* 180,662 georeferenced triplets (Sentinel-1 SAR dual-pol + Sentinel-2 multispectral + MODIS land cover).
    - *Role in SatQuery:* Core training and validation benchmark for cross-modal fusion under cloud cover.
14. **QXS-SAROPT (⭐⭐⭐⭐):**
    - *Task:* High-resolution SAR and optical paired patches for joint feature alignment.
15. **BRIGHT (⭐⭐⭐⭐⭐):**
    - *Scale:* 4,538 globally distributed image pairs.
    - *Task:* Optical + SAR semantic change detection across extreme disaster events.

### Tier 5 — Objects & Text-Guided Grounding
16. **DOTA v1.0 / v2.0 (⭐⭐⭐⭐⭐):**
    - *Scale:* Massive oriented bounding box dataset for aircraft, ships, storage tanks, bridges, harbors.
17. **DIOR & DIOR-RSVG (⭐⭐⭐⭐⭐):**
    - *Task:* Object detection and Remote Sensing Visual Grounding (RSVG) for referring expressions (*"Highlight the cargo ship near the western berth"*).
18. **FAIR1M (⭐⭐⭐⭐⭐):**
    - *Scale:* Fine-grained object recognition in high-resolution remote sensing imagery.

### Tier 6 — Image-to-Text & Captioning
19. **RSICD & RSITMD (⭐⭐⭐⭐):**
    - *Task:* Remote sensing image captioning and cross-modal image-text retrieval.
20. **UCM-Captions, Sydney-Captions, NWPU-Caption (⭐⭐⭐/⭐⭐⭐⭐):**
    - *Task:* Classical and large-scale scene captioning benchmarks.

### Tier 7 — Large Vision-Language Pretraining
21. **RS5M & SkyScript (⭐⭐⭐⭐⭐):**
    - *Scale:* ~5 million remote sensing image-text pairs.
22. **LHRS-Align & LHRS-Instruct (⭐⭐⭐⭐⭐):**
    - *Scale:* 1.15M image-location-text alignment and multi-turn instruction examples.
23. **GeoChat-Set & MMRS-1M (⭐⭐⭐⭐⭐):**
    - *Task:* Unified multi-task remote sensing instruction tuning corpus combining detection, VQA, classification, and captioning.

### Tier 8 — General Earth Observation
24. **EuroSAT & NWPU-RESISC45:**
    - *Task:* Sentinel-2 10-class land cover and 45-class aerial scene classification.
25. **fMoW & MillionAID:**
    - *Task:* Worldwide temporal and spatial scene representations.

### Tier 9 — Geolocation & Spatial Embeddings
26. **SatCLIP / S2-100K & GeoCLIP:**
    - *Task:* Coordinate-to-image semantic representation mapping $(\text{lat}, \text{lon}) \leftrightarrow \text{pixels}$.

### Tier 10 — Authoritative RAG Knowledge Sources (`knowledge/`)
Authoritative domain documentation consulted by the agent to explain findings:
- **ISRO / SAC Documentation:** Cartosat-2/3 sensor specifications, RISAT-1 radar modes, Bhuvan/Bhoonidhi metadata.
- **ESA Sentinel Handbooks:** Sentinel-1 C-Band SAR User Guide, Sentinel-2 MSI Spectral Band Specifications.
- **NASA Earthdata & USGS:** Landsat/MODIS spectral indices and reflectance calibrations.
- **OGC Standards:** GeoTIFF, STAC, COG, and WGS84/UTM projection guidelines.

---

## 3. Directory Layout in SatQuery AI

```
datasets/
├── README.md
├── abstraction.py                   # Unified PyTorch / NumPy Dataset loader interface
│
├── real/                            # Real Earth Observation Satellite Imagery
│   ├── levir_cd/                    # Real 0.5m Google Earth / aerial building change pairs
│   │   ├── levir_t1.png             # Pre-construction observation
│   │   ├── levir_t2.png             # Post-construction observation
│   │   └── levir_label.png          # Real ground truth change mask
│   └── sentinel/                    # Real European Space Agency (ESA) Satellite Imagery
│       ├── real_sentinel2_optical.png # Real Sentinel-2 MSI True Color Image (TCI)
│       ├── real_sentinel1_sar_vv.png  # Real Sentinel-1 C-Band SAR VV GRD backscatter
│       └── real_sentinel1_sar_vh.png  # Real Sentinel-1 C-Band SAR VH cross-polarization
│
├── core/                            # Top 10 Core Implemented Dataset Loaders
│   ├── bigearthnet.py               # Sentinel-1 & Sentinel-2 patch loader & metadata
│   ├── vrsbench.py                  # VQA, captioning, referring box parser
│   ├── rsvqa.py                     # Low/High-res RS VQA loader
│   ├── cdvqa.py                     # Bi-temporal change QA loader
│   ├── levir.py                     # Bi-temporal building change mask loader
│   ├── sen12ms.py                   # Sentinel-1 SAR + Sentinel-2 Optical pairs
│   └── bright_urbansar.py           # Extreme disaster multimodal optical+SAR change
│
└── raw/                             # Drop directory for external raw archives & full GeoTIFFs
```

## 4. Ingesting Your Own Satellite Data
To ingest your own GeoTIFFs or downloaded archives:
1. Place your satellite `.tif` or `.png` files in `datasets/raw/` or `storage/uploads/`.
2. For bi-temporal pairs, name them with timestamps or prefixes: `scene_2020_t1.tif` and `scene_2026_t2.tif`.
3. The Node.js and Python preprocessors will automatically inspect the spatial bounds, CRS projection, and radiometric channels.
