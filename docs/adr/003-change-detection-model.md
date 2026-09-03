# ADR 003: Dual-Tier Change Detection Architecture (TinyCD Edge Fallback + ChangeFormer GPU)
**Status:** Accepted  
**Date:** September 2026  
**Deciders:** SatQuery AI Architectural Team

---

## Context
SIH26167 mandates robust bi-temporal remote sensing change detection. Modern change detection literature features a spectrum of architectures, ranging from massive vision transformers (e.g. ChangeFormer, 41M parameters) to ultra-compact Siamese models (e.g. TinyCD, 0.3M parameters).

Our system must support both:
1. Local development and deployment on resource-constrained hardware (e.g. laptops, CPU servers with <8GB RAM).
2. High-precision GPU-accelerated inference for detailed urban and infrastructure change delineation.

## Decision
We adopt a **Dual-Tier Model Fallback Architecture**:
- **Tier 1 (Default / Edge Profile):** **TinyCD** (Siamese U-Net with Mix and Attention Mask Block).
- **Tier 2 (High-Accuracy GPU Profile):** **ChangeFormer** (Hierarchical Transformer Encoder + MLP Decoder).

Both models implement the standardized `BaseChangeModelAdapter` interface, allowing runtime hot-swapping based on detected hardware (CUDA vs CPU) or user configuration.

## Rationale & Tradeoffs

### TinyCD Advantages:
- **Ultra-Lightweight Footprint:** ~310,000 parameters and a weight file of only **~1.24 MB**.
- **Real-Time CPU Execution:** Runs in **~42 ms** on a modern 6-core CPU. Eliminates the need for expensive cloud GPUs during initial testing, hackathon judging booths, and offline demos.
- **Proven Accuracy:** Achieves >0.88 F1-score on LEVIR-CD and WHU-CD benchmarks, outperforming many models 100x its size.

### ChangeFormer Advantages:
- **State-of-the-Art Spatial Fidelity:** Long-range Transformer self-attention excels at fine-grained architectural boundaries and subtle texture variations in complex scenes.

### Fallback Mechanism:
The model manager queries `torch.cuda.is_available()`. If CUDA is absent or VRAM is below 4GB, the system seamlessly initializes TinyCD. If GPU acceleration is detected, ChangeFormer is loaded as the primary high-resolution engine.
