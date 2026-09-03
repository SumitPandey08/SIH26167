# SatQuery AI — Specialist Model Catalog & Provenance Specification
## Official Technical Specifications for Remote Sensing Models in SatQuery AI
**Standard:** SIH26167 Compliance Specification  
**Version:** 1.0.0  
**Author:** SatQuery AI Architectural Team

---

## 1. Model Catalog Overview & Lifecycle Management

SatQuery AI does not rely on a monolithic AI model. Instead, it operates a **Model Abstraction Layer** with pluggable adapters conforming to standard input/output schemas.

### Model Lifecycle & Memory Hierarchy:
- **Level 0 (Always-on / Instant Edge):** Pure vectorized Python / NumPy spectral engines ($NDVI, NDWI$, Lee Filter) and lightweight Siamese models (**TinyCD** <2MB). Memory consumption: <50MB RAM. Inference time: <50ms on CPU.
- **Level 1 (Cached Local Neural Heads):** RemoteCLIP (ViT-B/32 or ResNet-50), RSVQA-HR, MobileSAM. Memory consumption: ~400MB - 1GB RAM. Loaded on-demand, persistent in memory during active investigation session.
- **Level 2 (GPU Accelerated / Quantized Large Models):** GeoChat 7B (4-bit QLoRA quantized or FP16), ChangeFormer (41M params). Loaded dynamically with LRU cache eviction and explicit VRAM garbage collection.

---

## 2. Detailed Model Specifications

### 2.1 TinyCD (Siamese Attention Change Detection Model)
- **Model Identifier:** `satquery-cd-tinycd-v1`
- **Task Category:** Bi-Temporal Binary & Semantic Change Detection
- **Primary Repository:** [`AndreaCodegoni/Tiny_model_4_CD`](https://github.com/AndreaCodegoni/Tiny_model_4_CD)
- **Scientific Paper:** *"A (Not So) Deep Learning Model For Change Detection"*, Codegoni et al., arXiv:2207.13159.
- **Source Code License:** MIT License
- **Pretrained Weights License:** MIT License
- **Backbone Architecture:** Siamese Convolutional Feature Extractor with Mix and Attention Mask Block (MAMB) and multi-scale feature cross-correlation.
- **Input Modality:** Dual co-registered Optical rasters $(T_1, T_2)$ in shape $(B, 3, H, W)$ normalized to $[0, 1]$.
- **Output Data Structure:** Binary change probability map $(B, 1, H, W)$ with values $\in [0, 1]$, thresholdable to binary change mask $\{0, 1\}$.
- **Parameter Count:** **310,000 parameters (0.31M)**
- **Model Weight Size:** **~1.24 MB** (`.pth` / `.onnx`)
- **Hardware Requirements:** 
  - RAM: <150 MB
  - VRAM: Optional (<500 MB if GPU available)
  - CPU Inference Supported: **YES (Full real-time execution)**
- **Inference Latency:**
  - CPU (Intel i5/AMD Ryzen 6-core): **~42 ms** for $512 \times 512$ tile
  - GPU (NVIDIA RTX 3060 / T4): **~8 ms**
- **Quantization & ONNX:** Fully exportable to INT8 ONNX; zero degradation in F1-score.
- **Fine-Tuning Feasibility:** High; full model can be retrained in <2 hours on standard consumer hardware.
- **Role in SatQuery:** **Default bi-temporal change detection engine** for fast local execution and CPU fallback.
- **Adapter Location:** `models/adapters/change/tinycd_adapter.py`

---

### 2.2 ChangeFormer (Transformer-Based Change Detection Model)
- **Model Identifier:** `satquery-cd-changeformer-v1`
- **Task Category:** High-Precision Bi-Temporal Change Detection
- **Primary Repository:** [`wgcban/ChangeFormer`](https://github.com/wgcban/ChangeFormer)
- **Scientific Paper:** *"ChangeFormer: A Transformer-Based Dual-Branch Network for Remote Sensing Change Detection"*, Bandara & Patel, IGARSS / CVPR Workshop.
- **Source Code License:** Apache 2.0
- **Pretrained Weights License:** Apache 2.0
- **Backbone Architecture:** Hierarchical Transformer encoder (MiT-b0/b1) in Siamese configuration with multi-layer perceptron (MLP) differential decoder.
- **Input Modality:** Dual co-registered optical rasters $(T_1, T_2)$ in shape $(B, 3, H, W)$.
- **Output Data Structure:** High-fidelity change segmentation map $(B, 1, H, W)$ with fine edge delineation.
- **Parameter Count:** **41.0 Million parameters**
- **Model Weight Size:** **~164 MB**
- **Hardware Requirements:**
  - RAM: 4 GB
  - VRAM: 4 GB (FP16/FP32)
  - CPU Fallback: Feasible (latency ~1.8s - 3.2s per scene)
- **Inference Latency:** GPU: ~45 ms; CPU: ~2200 ms.
- **Role in SatQuery:** **High-accuracy GPU change detection specialist** for complex urban, building, and infrastructure delineation.
- **Adapter Location:** `models/adapters/change/changeformer_adapter.py`

---

### 2.3 GeoChat (Grounded Remote Sensing Vision-Language Model)
- **Model Identifier:** `satquery-vlm-geochat-7b`
- **Task Category:** Single-Image RS VQA, Dense Scene Captioning, Text-Guided Referring Grounding
- **Primary Repository:** [`mbzuai-oryx/GeoChat`](https://github.com/mbzuai-oryx/GeoChat)
- **Scientific Paper:** *"GeoChat: Grounded Large Vision-Language Model for Remote Sensing"*, Kuckreja et al., CVPR 2024.
- **Source Code License:** Apache 2.0
- **Pretrained Weights License:** Research / LLaVA Open Weights
- **Backbone Architecture:** Vicuna-7B-v1.5 / LLaMA-2 language backbone + CLIP-ViT-L/14 visual encoder adapted via cross-attention projector for aerial/satellite overhead perspective.
- **Input Modality:** High-resolution optical raster $(H \times W \times 3)$ + natural language instruction prompt (e.g. *"Identify and locate all storage tanks in this scene"* or *"What type of terrain is present?"*).
- **Output Data Structure:** Textual reasoning answer string with embedded coordinate bounding tokens `[ymin, xmin, ymax, xmax]` normalized to $[0, 1000]$.
- **Parameter Count:** **7.0 Billion parameters**
- **Model Weight Size:** ~13.5 GB (FP16), ~3.9 GB (4-bit NF4 quantized via BitsAndBytes).
- **Hardware Requirements:**
  - GPU Mode: Minimum 6GB VRAM (4-bit QLoRA) or 16GB VRAM (FP16).
  - CPU Fallback: Supported via GGUF / llama.cpp or delegated to self-hosted API worker.
- **Fine-Tuning Feasibility:** Supported via LoRA / QLoRA parameter-efficient fine-tuning on BigEarthNet.txt or VRSBench.
- **Role in SatQuery:** **Flagship Remote Sensing Vision-Language Assistant** for deep conversational QA, reasoning, and visual grounding.
- **Adapter Location:** `models/adapters/vqa/geochat_adapter.py`

---

### 2.4 RemoteCLIP (Remote Sensing Cross-Modal Representation Model)
- **Model Identifier:** `satquery-repr-remoteclip-vitb32`
- **Task Category:** Zero-Shot Land Cover Classification, Image-Text Retrieval, Semantic Verification
- **Primary Repository:** [`ChenDelong1999/RemoteCLIP`](https://github.com/ChenDelong1999/RemoteCLIP)
- **Scientific Paper:** *"RemoteCLIP: A Vision Language Foundation Model for Remote Sensing"*, Chen et al., IEEE TGRS.
- **Source Code License:** Apache 2.0
- **Pretrained Weights License:** CC-BY-NC 4.0 / Research
- **Backbone Architecture:** Vision Transformer ViT-B/32 or ResNet-50 visual encoder + Transformer text encoder trained on 800,000+ remote sensing image-text pairs.
- **Input Modality:** Optical raster tile $(B, 3, 224, 224)$ + candidate category prompts (e.g., *["dense residential", "commercial port", "lake/reservoir", "agricultural field"]*).
- **Output Data Structure:** Cosine similarity scores, normalized embedding vectors $(B, 512)$, ranked zero-shot classification probabilities.
- **Parameter Count:** **87.8 Million parameters** (ViT-B/32)
- **Model Weight Size:** **~340 MB**
- **Hardware Requirements:**
  - RAM: 1 GB
  - VRAM: 1 GB
  - CPU Inference: **YES (<65 ms per batch)**
- **Role in SatQuery:** **Fast zero-shot land cover classifier & query intent validator**. Verifies whether user-asked concepts (e.g., "water body", "runway", "solar farm") actually exist in the raster before invoking heavier models.
- **Adapter Location:** `models/adapters/vqa/remoteclip_adapter.py`

---

### 2.5 RSVQA-HR Engine (Specialized High-Resolution RS VQA)
- **Model Identifier:** `satquery-vqa-rsvqahr-v1`
- **Task Category:** Fast Deterministic Visual Question Answering (Counting, Presence, Area comparison)
- **Primary Repository:** [`SylvainLobry/rsvqa`](https://github.com/SylvainLobry/rsvqa)
- **Source Code License:** MIT License
- **Pretrained Weights License:** Open Academic
- **Backbone Architecture:** ResNet-152 visual feature extractor + Multi-Layer BiLSTM text encoder + Bilinear feature fusion + multi-class classification head.
- **Input Modality:** Remote sensing image $(512 \times 512 \times 3)$ + formal question string.
- **Output Data Structure:** Discrete classification answer (e.g., `"yes"`, `"no"`, `"between 10 and 100"`, `"rural area"`) + softmax confidence score.
- **Parameter Count:** ~15 Million parameters
- **Model Weight Size:** **~60 MB**
- **Hardware Requirements:** Runs instantaneously on CPU (<30 ms).
- **Role in SatQuery:** **Lightweight deterministic VQA fallback head** when running on restricted hardware or verifying basic spatial questions.
- **Adapter Location:** `models/adapters/vqa/rsvqa_adapter.py`

---

### 2.6 SatQuery Dual-Stream Optical-SAR Fusion Engine
- **Model Identifier:** `satquery-fusion-opt-sar-v1`
- **Task Category:** Cross-Modal Joint Feature Extraction, Cloud-Resilient Land Cover & Water Delineation
- **Primary Repository:** SatQuery Original Architecture (trained on SEN12MS / BigEarthNet-MM)
- **License:** Apache 2.0
- **Backbone Architecture:**
  - *Stream 1 (Optical):* 3-band RGB/NIR ResNet/ConvNeXt branch.
  - *Stream 2 (SAR):* Sentinel-1 Dual-Pol (VV, VH, VV/VH ratio) branch with Lee speckle filtering.
  - *Cross-Attention Fusion Module:* Multi-head cross-attention weighting optical spectral reflectance against radar microwave backscatter roughness.
- **Input Modality:** Co-registered Optical GeoTIFF $(B, 3, H, W)$ + SAR GeoTIFF $(B, 2, H, W)$ in identical spatial reference frame.
- **Output Data Structure:** Multimodal semantic segmentation mask $(B, C, H, W)$ with explicit classes: `Water`, `Urban/Built-up`, `Forest`, `Crops`, `Barren`.
- **Parameter Count:** 14.2 Million parameters
- **Model Weight Size:** **~56 MB**
- **Hardware Requirements:** CPU (<180 ms) or GPU (<25 ms).
- **Role in SatQuery:** **Fulfills SIH26167 cross-modal optical+SAR requirement**, enabling flood mapping and urban detection under 100% cloud cover.
- **Adapter Location:** `models/adapters/fusion/optical_sar_adapter.py`

---

### 2.7 SatQuery Spectral & Spatial Vectorization Engine
- **Model Identifier:** `satquery-geo-spectral-v1`
- **Task Category:** Mathematical Spectral Index Generation, Morphological Filtering, Vector Polygonization
- **Implementation:** Pure vectorized Python / NumPy / Rasterio / Shapely / GeoPandas.
- **License:** MIT License
- **Algorithms:**
  - $NDWI = \frac{\text{Green} - \text{NIR}}{\text{Green} + \text{NIR}}$ (McFeeters water index)
  - $MNDWI = \frac{\text{Green} - \text{SWIR}}{\text{Green} + \text{SWIR}}$ (Modified water index, suppresses urban noise)
  - $NDVI = \frac{\text{NIR} - \text{Red}}{\text{NIR} + \text{Red}}$ (Vegetation index)
  - Sentinel-1 GRD Radiometric Calibration: $\sigma^0 (dB) = 10 \cdot \log_{10}(DN^2) - K$
  - Enhanced Lee Speckle Filtering ($5 \times 5$ moving kernel)
  - Raster-to-Polygon Vectorizer with Douglas-Peucker geodesic simplification.
- **Parameter Count:** 0 (Deterministic scientific mathematical formulations).
- **Hardware Requirements:** Minimal (<30MB RAM; instantaneous on any CPU).
- **Role in SatQuery:** **Calculates ground-truth physical evidence** (exact area in $m^2, km^2$, percentage shifts, spatial centroids).
- **Adapter Location:** `models/adapters/spectral/spectral_engine.py`

---

## 3. Model Adapter Interface Standard

Every specialist model in SatQuery implements a strict Python abstract base class ensuring complete modularity and swappability:

```python
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Dict, Any, Optional
import numpy as np

class ModelInput(BaseModel):
    image_paths: list[str]
    query: Optional[str] = None
    parameters: Dict[str, Any] = {}
    spatial_metadata: Optional[Dict[str, Any]] = None

class ModelResult(BaseModel):
    status: str
    model_name: str
    confidence: float
    output_text: Optional[str] = None
    masks: Optional[Dict[str, Any]] = None
    bounding_boxes: Optional[list[Dict[str, Any]]] = None
    metrics: Optional[Dict[str, float]] = None
    execution_time_ms: float

class BaseSpecialistAdapter(ABC):
    @abstractmethod
    def load(self, device: str = "cpu") -> None:
        """Load weights into memory/device."""
        pass

    @abstractmethod
    def analyze(self, inputs: ModelInput) -> ModelResult:
        """Execute deterministic inference and return structured result."""
        pass

    @abstractmethod
    def unload(self) -> None:
        """Evict model from memory during memory pressure."""
        pass
```
