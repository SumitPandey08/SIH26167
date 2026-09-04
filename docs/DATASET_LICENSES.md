# SatQuery AI — Dataset License & Attribution Matrix

This document provides a comprehensive legal and provenance audit of all Earth Observation datasets integrated into the SatQuery AI hub.

---

## 1. Master License Matrix

| Dataset | Tier | License | Commercial Use | Permitted Scope | Upstream Institution |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **BigEarthNet-v2** | 1 | CDLA-Permissive-1.0 | Yes | Pretraining, Evaluation, Commercialization | TU Berlin & European Space Agency |
| **VRSBench** | 1 | CC-BY-4.0 | Yes | Fine-Tuning, Benchmarking, Redistribution | Wuhan University & RSICD Consortium |
| **RSVQA** | 1 | CC-BY-NC-SA-4.0 | No (Non-commercial) | Research, Academic Evaluation, Benchmarks | University of Geneva (Sylvain Lobry et al.) |
| **LEVIR-CD** | 1 | CC-BY-4.0 | Yes | Building Change Detection, Fine-Tuning | Beihang University (LEVIR Lab) |
| **LEVIR-CC** | 1 | CC-BY-4.0 | Yes | Bi-temporal Change Captioning | Beihang University |
| **CDVQA** | 1 | CC-BY-4.0 | Yes | Change Detection VQA, Dialogue Tuning | Wuhan University / RSICD Consortium |
| **SEN12MS** | 2 | CC-BY-4.0 | Yes | Multimodal Optical-SAR Fusion | Technical University of Munich (TUM) |
| **BRIGHT** | 2 | CC-BY-4.0 | Yes | Disaster Building Damage Assessment | Disaster Response Consortium / Maxar Open Data |
| **UrbanSARFloods** | 2 | NASA Open Data / Public Domain | Yes | Flood Detection, Urban Inundation Mapping | NASA Jet Propulsion Laboratory (JPL) |
| **FloodNet** | 3 | CC-BY-NC-4.0 | No (Non-commercial) | High-Res UAV Flood Assessment & VQA | University of Maryland & EarthVision |
| **DIOR-RSVG** | 3 | CC-BY-4.0 | Yes | Visual Grounding, Referring Expressions | Northwestern Polytechnical University (NWPU) |
| **DOTA** | 3 | DOTA Academic License | No (Academic only) | Oriented Object Detection Benchmark | Wuhan University (CAPS Lab) |
| **FAIR1M** | 3 | FAIR1M Academic License | No (Academic only) | Fine-Grained Object Recognition | Chinese Academy of Sciences (AIRC) |

---

## 2. Attribution & Citation Guidelines

When using models fine-tuned with SatQuery or citing benchmark results, appropriate scholarly attribution must be maintained according to each dataset's license terms:

### BigEarthNet-v2
```bibtex
@article{sumbul2021bigearthnet,
  title={BigEarthNet-MM: A large-scale, multimodal, multilabel benchmark for remote sensing},
  author={Sumbul, Gencer and de Wall, Arne and Kreuziger, Tristan and et al.},
  journal={IEEE Geoscience and Remote Sensing Magazine},
  volume={9},
  number={3},
  pages={174--180},
  year={2021}
}
```

### VRSBench
```bibtex
@article{vrsbench2024,
  title={VRSBench: A Versatile Vision-Language Benchmark for Remote Sensing Image Understanding},
  author={Li, Xiang and Zhang, Chen and Chen, Jian and et al.},
  journal={IEEE Transactions on Geoscience and Remote Sensing},
  year={2024}
}
```

### LEVIR-CD & LEVIR-CC
```bibtex
@article{chen2020spatial,
  title={A spatial-temporal attention-based method and a new dataset for remote sensing image change detection},
  author={Chen, Hao and Shi, Zhenwei},
  journal={Remote Sensing},
  volume={12},
  number={10},
  pages={1662},
  year={2020}
}

@article{liu2022levircc,
  title={A bitemporal image captioning benchmark for remote sensing change interpretation},
  author={Liu, Chenyang and Zhao, Rui and Chen, Hao and Zou, Zhengxia and Shi, Zhenwei},
  journal={IEEE Transactions on Geoscience and Remote Sensing},
  volume={60},
  pages={1--13},
  year={2022}
}
```

---

## 3. Commercial Compliance Summary

- **Commercial Deployment Permitted**: BigEarthNet-v2, VRSBench, LEVIR-CD, LEVIR-CC, CDVQA, SEN12MS, BRIGHT, UrbanSARFloods, DIOR-RSVG.
- **Academic / Non-Commercial Research Only**: RSVQA, FloodNet, DOTA, FAIR1M. Models trained on non-commercial datasets must be designated for scientific evaluation and not incorporated into proprietary commercial SaaS offerings.
