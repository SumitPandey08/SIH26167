# SatQuery AI — Evaluation Framework & Verification Protocols
## Rigorous Scientific Benchmarking for Remote Sensing Vision-Language AI
**Standard:** SIH26167 Compliance Specification  
**Version:** 1.0.0  
**Author:** SatQuery AI Architectural Team

---

## 1. Evaluation Philosophy

In alignment with **SIH26167** and scientific standards, SatQuery AI builds an automated, reproducible **Evaluation Framework from Day 1**. 

We explicitly evaluate three system tiers:
1. **Tier A (Baseline):** Generic off-the-shelf vision-language model (e.g. unadapted LLaVA / standard CLIP). Demonstrates why generic models fail on overhead geospatial imagery.
2. **Tier B (Domain-Adapted Specialist Models):** Specialist models fine-tuned / adapted with remote sensing data (e.g., GeoChat, TinyCD, BigEarthNet.txt LoRA adapter).
3. **Tier C (Full SatQuery AI System):** The complete agentic pipeline with deterministic tool planning, evidence graph constraints, and geospatial calculation verification.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   SatQuery AI 3-Tier Evaluation Matrix                │
├──────────────────────┬────────────────────┬────────────────────────────┤
│ Tier A: Baseline     │ Tier B: Adapted RS │ Tier C: Full SatQuery AI   │
│ (Generic VLM / Zero) │ (Specialist Heads) │ (Agent + Evidence Graph)   │
├──────────────────────┼────────────────────┼────────────────────────────┤
│ High Hallucination   │ High Accuracy      │ Zero Numerical Guessing    │
│ No Spatial Metrics   │ Pixel-Level Masks  │ Exact km² / Verified Geo   │
│ Fails on SAR         │ Adapted to Radar   │ Multi-modal Fusion + Trace │
└──────────────────────┴────────────────────┴────────────────────────────┘
```

---

## 2. Quantitative Task Metrics & Formulations

### 2.1 Single-Image Remote Sensing VQA
- **Benchmark Datasets:** RSVQA-HR, RSVQA-LR, VRSBench-VQA.
- **Metrics:**
  - **Overall Accuracy (OA):** Exact match percentage on categorical, numerical, and presence questions:
    $$\text{OA} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}(\hat{y}_i = y_i)$$
  - **ROUGE-L & BLEU-1/2:** For open-ended explanatory visual questions.
  - **Sensor Attribute Accuracy:** Specific accuracy on questions interrogating sensor modality (SAR vs Optical) and spatial resolution.

### 2.2 Remote Sensing Scene Captioning
- **Benchmark Dataset:** VRSBench Captioning Split.
- **Metrics:**
  - **BLEU-4:** $n$-gram precision with brevity penalty.
  - **METEOR:** Harmonic mean of precision and recall with stem matching.
  - **ROUGE-L:** Longest common subsequence matching.
  - **CIDEr:** Consensus-based image description evaluation weighted by TF-IDF on remote sensing corpora.

### 2.3 Text-Guided Visual Grounding
- **Benchmark Dataset:** VRSBench Grounding Split.
- **Metrics:**
  - **Mean Intersection over Union (mIoU):** Average overlap between predicted bounding box / mask and ground-truth annotation:
    $$\text{IoU} = \frac{\text{Area}(\mathcal{B}_{\text{pred}} \cap \mathcal{B}_{\text{gt}})}{\text{Area}(\mathcal{B}_{\text{pred}} \cup \mathcal{B}_{\text{gt}})}$$
  - **Box Accuracy @ 0.5 (Acc@0.5):** Percentage of queries where $\text{IoU} \ge 0.50$.

### 2.4 Bi-Temporal Change Detection
- **Benchmark Datasets:** LEVIR-CD, WHU-CD, SatQuery Disaster Benchmark.
- **Metrics:**
  - **Precision:** $\frac{TP}{TP + FP}$ (Suppression of false alarms / shadow artifacts).
  - **Recall:** $\frac{TP}{TP + FN}$ (Detection of actual land cover modifications).
  - **F1-Score:** Harmonic mean:
    $$F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$
  - **Change mIoU:** Intersection-over-union of the change class.

### 2.5 Change VQA & Change Description
- **Benchmark Datasets:** CDVQA, VisTA (CDQAG).
- **Metrics:**
  - **Semantic Change Accuracy:** Correct classification of change transitions (e.g., Construction, Demolition, Inundation).
  - **Grounded Change IoU:** Spatial accuracy of the visual mask supporting the change claim.

### 2.6 Cross-Modal Optical + SAR Analysis
- **Benchmark Dataset:** SEN12MS.
- **Metrics:**
  - **Cloud-Occluded Water Detection F1:** F1 score of water mapping on optical scenes with >60% cloud cover when fused with co-registered Sentinel-1 SAR.
  - **Mutual Information (MI):** Alignment between optical texture and SAR backscatter features.

### 2.7 Agent Orchestration & Tool Selection
- **Synthetic & Human Evaluation Benchmark:** 100 curated multi-turn geospatial queries.
- **Metrics:**
  - **Intent Classification Accuracy:** Correct mapping of natural language to DAG task type.
  - **Tool Selection Precision & Recall:** Ensuring necessary GIS/AI tools are invoked without superfluous model executions.
  - **Parameter Validity Rate:** Percentage of tool calls with syntactically and physically valid parameters.
  - **Execution Success Rate:** Percentage of multi-step plans that complete without unhandled exceptions.

### 2.8 Numerical & Evidence Fidelity (Anti-Hallucination)
- **Custom Metric:** **Area Discrepancy Percentage ($\Delta A$)**:
  $$\Delta A = \frac{|\text{Area}_{\text{textual\_claim}} - \text{Area}_{\text{GIS\_polygon\_calculation}}|}{\text{Area}_{\text{GIS\_polygon\_calculation}}} \times 100\%$$
- **Target in SatQuery AI:** **$\Delta A \equiv 0.0\%$**. Because the LLM explanation generator is mathematically constrained to copy numeric metrics directly from the evidence graph, numerical hallucination is mathematically prevented.

---

## 3. Automated Evaluation Harness Design

The evaluation framework is organized inside `evaluation/`:

```
evaluation/
├── README.md
├── run_all_benchmarks.py      # Master benchmark execution runner
├── runners/
│   ├── eval_vqa.py            # RSVQA & VRSBench-VQA runner
│   ├── eval_captioning.py     # VRSBench captioning runner
│   ├── eval_grounding.py      # Grounding Acc@0.5 runner
│   ├── eval_change.py         # TinyCD / ChangeFormer F1 runner
│   ├── eval_cdvqa.py          # CDVQA runner
│   ├── eval_fusion.py         # SEN12MS Optical-SAR runner
│   └── eval_agent_routing.py  # Intent and tool selection runner
├── metrics/
│   ├── classification.py      # Precision, Recall, F1, mIoU
│   ├── nlp_metrics.py         # BLEU, METEOR, ROUGE, CIDEr
│   └── spatial_metrics.py     # Area discrepancy, polygon overlap
└── reports/                   # Output JSON, CSV, and Markdown benchmark reports
```

---

## 4. Benchmark Reporting Format

Each benchmark run produces an auditable, timestamped JSON and Markdown report:

```json
{
  "benchmark_run_id": "bench_20260903_vqa_tinycd",
  "system_version": "SatQuery-v1.0.0",
  "hardware": {
    "device": "cpu",
    "cpu_cores": 6,
    "ram_gb": 7.2
  },
  "results": {
    "task": "BI_TEMPORAL_CHANGE_DETECTION",
    "model": "satquery-cd-tinycd-v1",
    "dataset": "LEVIR-CD-Val-Mini",
    "num_samples": 50,
    "metrics": {
      "precision": 0.894,
      "recall": 0.881,
      "f1_score": 0.887,
      "mIoU": 0.798,
      "mean_inference_latency_ms": 41.8
    }
  }
}
```
