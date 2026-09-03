"""
SatQuery AI — Compute Device Manager & Memory Profiler
"""

import logging
from typing import Dict, Any

logger = logging.getLogger("satquery.device")


class DeviceManager:
    _instance = None
    _device = "cpu"
    _cuda_available = False
    _vram_gb = 0.0

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DeviceManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        try:
            import torch
            if torch.cuda.is_available():
                self._cuda_available = True
                self._device = "cuda"
                device_props = torch.cuda.get_device_properties(0)
                self._vram_gb = device_props.total_memory / (1024 ** 3)
                logger.info(f"CUDA Hardware detected: {device_props.name} ({self._vram_gb:.2f} GB VRAM)")
            else:
                self._cuda_available = False
                self._device = "cpu"
                logger.info("Running on CPU profile (no CUDA GPU detected). Utilizing optimized edge models (TinyCD/NumPy).")
        except ImportError:
            self._cuda_available = False
            self._device = "cpu"
            logger.warning("PyTorch not yet installed in active environment. Operating in standard CPU mode.")

    @property
    def device(self) -> str:
        return self._device

    @property
    def is_cuda(self) -> bool:
        return self._cuda_available

    def get_system_summary(self) -> Dict[str, Any]:
        return {
            "device": self._device,
            "cuda_available": self._cuda_available,
            "vram_gb": round(self._vram_gb, 2),
        }


device_manager = DeviceManager()
