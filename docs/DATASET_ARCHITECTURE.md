# SatQuery AI — Remote Sensing Dataset Hub Architecture

## 1. Architectural Overview

SatQuery AI's **Dataset Hub & Remote-Sensing Model Adaptation Infrastructure** is designed to support scalable multi-modal learning across optical, synthetic aperture radar (SAR), multispectral, and bi-temporal earth observation benchmarks without requiring massive multi-terabyte raw downloads on local development workstations.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SatQuery Dataset Hub (Unified API)                   │
├──────────────────┬──────────────────┬──────────────────┬───────────────┤
│  DatasetRegistry │  DatasetAdapter  │ DatasetValidator │ SplitManager  │
└────────┬─────────┴────────┬─────────┴────────┬─────────┴───────┬───────┘
         │                  │                  │                 │
         ▼                  ▼                  ▼                 ▼
 13 Benchmarks       Streaming Iter     Quality Report     Zero-Leak
 (Tier 1, 2, 3)     Unified Schema      Anomaly Checks     Integrity
         │                  │
         └──────────┬───────┘
                    ▼
 ┌───────────────────────────────────────────────────────────────────────┐
 │               VLM Adaptation & Multimodal Training Hub                │
 ├─────────────────────────┬──────────────────────────┬──────────────────┤
 │  InstructionConverter   │  RemoteSensingCollator   │ RS-VLM Trainer   │
 │  (LLaVA / XML Tokens)   │  (Dual-Image Stacks)     │ (6-Stage LoRA)   │
 └─────────────────────────┴──────────────────────────┴──────────────────┘
```

---

## 2. Directory Layout

The storage and code assets are structured with clear separation between code, configs, cache, and raw raster data:

```text
SatQuery/
├── data/
│   ├── raw/                 # Local mounted raw archives (gitignored)
│   ├── cache/               # Curated local dev subsets & tokenized caches (gitignored)
│   ├── processed/           # Filtered / transformed intermediate data (gitignored)
│   ├── manifests/           # Remote download manifests, URLs, and checksums
│   ├── splits/              # Benchmark train/val/test split manifests
│   └── metadata/            # Catalogs (datasets.json, quality reports)
├── configs/
│   └── datasets/            # dev.yaml, tier1.yaml, full.yaml configurations
├── training/
│   ├── configs/             # 6-Stage curriculum YAMLs + LoRA/QLoRA config
│   └── scripts/             # Fine-tuning and export entrypoints
├── satquery/
│   ├── datasets/            # Registry, base adapter, schema, validator, splits
│   │   └── adapters/        # 13 concrete dataset adapters
│   ├── training/            # Instruction converter, collator, trainer
│   └── evaluation/          # Unified remote sensing benchmark evaluator
└── scripts/
    └── satquery             # Central command-line interface executable
```

---

## 3. Canonical Schema: UnifiedRemoteSensingExample

Every dataset loader normalizes heterogeneous metadata into `UnifiedRemoteSensingExample`:

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `str` | Globally unique sample identifier |
| `dataset` | `str` | Name of originating benchmark (e.g. `VRSBench`) |
| `split` | `str` | `train`, `val`, `test`, or `dev` |
| `modalities` | `List[Modality]` | `optical`, `sar`, `multispectral`, `dem` |
| `sensors` | `List[Sensor]` | `Sentinel-1`, `Sentinel-2`, `Airborne-Optical`, etc. |
| `task` | `TaskType` | Primary task (VQA, Grounding, Change, Optical-SAR) |
| `spatial_resolution_m` | `float` | Ground Sampling Distance (GSD) in meters |
| `geo_reference` | `GeoReference` | Bounding box, center coordinates, and CRS |
| `optical_path` | `str` | Path to optical raster |
| `sar_path` | `str` | Path to SAR raster (VV/VH) |
| `t1_path` / `t2_path` | `str` | Pre- and post-event bi-temporal rasters |
| `target_boxes` | `List[BoundingBox]`| Normalized `[ymin, xmin, ymax, xmax]` coordinates |
| `question` / `answer` | `str` | VQA / Change VQA pair |
| `caption` | `str` | Scene description or bi-temporal change caption |

### Standard Conversational Dialogue Tokenization

`UnifiedRemoteSensingExample.to_vlm_dialogue()` serializes samples into conversation turns:
- **Single-Image (VQA & Captioning)**: `<image>\n{prompt}`
- **Visual Grounding**: `<image>\nLocate {label}` $\rightarrow$ `<box>[ymin, xmin, ymax, xmax]</box>`
- **Bi-Temporal (Change Captioning & Change VQA)**: `Time 1: <image>\nTime 2: <image>\n{query}`
- **Optical-SAR Cross-Modal**: `Optical: <image>\nSAR: <image>\n{fusion_query}`

---

## 4. Benchmark Tiering Strategy

| Tier | Focus | Datasets |
| :--- | :--- | :--- |
| **Tier 1** | Core Foundation & VLM Adaptation | `BigEarthNet-v2`, `VRSBench`, `RSVQA`, `LEVIR-CD`, `LEVIR-CC`, `CDVQA` |
| **Tier 2** | Disaster Response & Multi-Sensor | `SEN12MS`, `BRIGHT`, `UrbanSARFloods` |
| **Tier 3** | Fine-Grained Detection & UAV Grounding | `FloodNet`, `DIOR-RSVG`, `DOTA`, `FAIR1M` |

---

## 5. Quality Assurance Pipeline (`DatasetValidator`)

The quality validator inspects:
1. **Raster Health**: Header readability via PIL/rasterio, non-zero dimensions, channel consistency.
2. **Bounding Box Coherence**: Valid range $[0.0, 1.0]$, $y_{min} \le y_{max}$, $x_{min} \le x_{max}$.
3. **Bi-Temporal Integrity**: Guarantees both $T_1$ and $T_2$ exist and match spatial extents.
4. **Optical-SAR Alignment**: Validates paired optical and SAR spatial registrations.
5. **Split Isolation**: `SplitManager` guarantees zero leakage across train, val, and test partitions.
