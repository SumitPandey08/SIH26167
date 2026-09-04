# SatQuery AI — Dataset Setup & Operational Guide

This document outlines how to configure, inspect, subset, and verify datasets within the SatQuery AI hub for remote-sensing vision-language model adaptation.

---

## 1. Quickstart: Zero-Terabyte Low-Spec Development

SatQuery includes a built-in streaming generator and offline fixtures, allowing developers to build models, run tests, and validate training pipelines without downloading massive multi-terabyte satellite archives.

```bash
# 1. List all 13 registered Earth Observation benchmarks
./scripts/satquery dataset list

# 2. Inspect metadata, license, sensor characteristics, and citations
./scripts/satquery dataset info VRSBench

# 3. Verify dataset integrity across all registered loaders
./scripts/satquery dataset verify

# 4. Extract a fast 20-sample curated development subset
./scripts/satquery dataset prepare VRSBench --max-samples 20 --split train
```

Curated subsets are saved to `data/cache/<dataset>/subset_<split>_<N>.jsonl`.

---

## 2. Directory Layout & Conventions

```
SatQuery/
└── data/
    ├── raw/              # Large downloaded/mounted datasets (gitignored)
    │   ├── bigearthnet_v2/
    │   ├── vrsbench/
    │   └── levir_cd/
    ├── manifests/        # Remote download manifests and checksums
    ├── cache/            # Tokenized samples and lightweight dev subsets
    ├── processed/        # Standardized intermediate rasters and masks
    ├── splits/           # Benchmark split identifiers (train/val/test)
    └── metadata/         # datasets.json, quality reports, manifests
```

---

## 3. Attaching Full External Benchmarks

When deploying on a cloud GPU instance or high-capacity storage node, place or symlink raw dataset directories under `data/raw/`:

### BigEarthNet-v2 (BigEarthNet-MM)
1. Download official archives from [bigearth.net](https://bigearth.net/).
2. Extract Sentinel-1 (`BigEarthNet-S1-v1.0.tar.gz`) and Sentinel-2 (`BigEarthNet-S2-v1.0.tar.gz`) into:
   ```text
   data/raw/bigearthnet_v2/
   ├── BigEarthNet-S1-v1.0/
   └── BigEarthNet-S2-v1.0/
   ```

### VRSBench
1. Clone or download from the [VRSBench repository](https://github.com/earth-observation-vlm/VRSBench).
2. Mount imagery and annotation JSONs into:
   ```text
   data/raw/vrsbench/
   ├── images/
   ├── annotations_caption.json
   ├── annotations_grounding.json
   └── annotations_vqa.json
   ```

### LEVIR-CD & LEVIR-CC
1. Download from [LEVIR Lab](https://justchenhao.github.io/LEVIR/).
2. Organize image pairs and masks:
   ```text
   data/raw/levir_cd/
   ├── A/       # Time 1 optical captures
   ├── B/       # Time 2 optical captures
   └── label/   # Binary change ground truth masks
   ```

---

## 4. Dataset Quality & Anomaly Detection

To run automated telemetry and anomaly checks (corrupt images, degenerate boxes, missing temporal partners, text quality):

```bash
./scripts/satquery dataset validate VRSBench --max-samples 50
```

This exports a detailed quality audit report to:
`data/metadata/data_quality_report.json`

---

## 5. Programmatic Python API

```python
from satquery.datasets import DatasetRegistry, DatasetValidator
from satquery.training import InstructionConverter

# 1. Retrieve an adapter
adapter = DatasetRegistry.get("VRSBench")

# 2. Stream normalized samples
for sample in adapter.iter_samples(split="train", max_samples=10):
    print(f"Sample: {sample.id}, Task: {sample.task.value}")
    
    # Convert to VLM conversational instruction format
    dialogue = InstructionConverter.to_llava_format(sample)
    print(dialogue["conversations"])
```
