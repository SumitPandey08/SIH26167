"""SatQuery Remote Sensing VLM Data Collator.

Batches multimodal earth observation imagery (optical, SAR, bi-temporal pairs)
and conversational dialogues for PyTorch training and evaluation.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from PIL import Image
import numpy as np
import torch


class RemoteSensingVLMCollator:
    """Collator for single-image, bi-temporal, and optical-SAR multimodal batches."""

    def __init__(
        self,
        image_size: int = 224,
        tokenizer: Optional[Any] = None,
        max_token_length: int = 512
    ):
        self.image_size = image_size
        self.tokenizer = tokenizer
        self.max_token_length = max_token_length

    def _load_and_preprocess_image(self, img_path: str) -> torch.Tensor:
        """Load an image from disk and convert to normalized (C, H, W) float32 tensor."""
        try:
            with Image.open(img_path) as img:
                img_rgb = img.convert("RGB")
                img_resized = img_rgb.resize((self.image_size, self.image_size))
                arr = np.array(img_resized, dtype=np.float32) / 255.0  # (H, W, C)
                tensor = torch.from_numpy(arr).permute(2, 0, 1)  # (3, H, W)
                # Standard ImageNet normalization
                mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
                std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
                return (tensor - mean) / std
        except Exception:
            # Safe blank tensor fallback if image is missing/unreadable
            return torch.zeros((3, self.image_size, self.image_size), dtype=torch.float32)

    def __call__(self, batch: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Collate a batch of instruction items."""
        batch_ids = []
        batch_tasks = []
        batch_images = []
        batch_temporal_images = []
        batch_texts = []

        for item in batch:
            batch_ids.append(item.get("id", "unknown"))
            batch_tasks.append(item.get("task", "general"))

            imgs = item.get("image")
            if isinstance(imgs, list) and len(imgs) >= 2:
                # Dual image (T1 + T2 or Optical + SAR)
                t1 = self._load_and_preprocess_image(imgs[0])
                t2 = self._load_and_preprocess_image(imgs[1])
                batch_images.append(t1)
                batch_temporal_images.append(t2)
            elif isinstance(imgs, str):
                t1 = self._load_and_preprocess_image(imgs)
                batch_images.append(t1)
                batch_temporal_images.append(torch.zeros_like(t1))
            else:
                blank = torch.zeros((3, self.image_size, self.image_size), dtype=torch.float32)
                batch_images.append(blank)
                batch_temporal_images.append(blank)

            # Extract dialogue text
            convs = item.get("conversations", [])
            text_repr = " | ".join([f"{c['from']}: {c['value']}" for c in convs])
            batch_texts.append(text_repr)

        collated = {
            "ids": batch_ids,
            "tasks": batch_tasks,
            "pixel_values": torch.stack(batch_images, dim=0),
            "temporal_pixel_values": torch.stack(batch_temporal_images, dim=0),
            "texts": batch_texts,
            "batch_size": len(batch)
        }

        return collated
