"""SatQuery Instruction Tuning Dataset Converter.

Translates UnifiedRemoteSensingExample instances across all 13 benchmarks into
standardized conversational instruction-tuning dialogues for remote-sensing VLMs.
"""

from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional

from satquery.datasets.schema import TaskType, UnifiedRemoteSensingExample

logger = logging.getLogger("satquery.training.converter")


class InstructionConverter:
    """Converts unified remote sensing examples into standard VLM conversational datasets."""

    @staticmethod
    def to_llava_format(sample: UnifiedRemoteSensingExample) -> Dict[str, Any]:
        """Convert sample into standard LLaVA-1.5 / LLaVA-NeXT multi-turn format."""
        images = sample.get_primary_images()
        conversations = []

        if sample.task in [TaskType.TEMPORAL_CHANGE, TaskType.CHANGE_CAPTIONING, TaskType.CHANGE_VQA]:
            # Bi-temporal dialogue
            t1_token = "<image>\n[Time 1 Observation]"
            t2_token = "<image>\n[Time 2 Observation]"
            
            if sample.task == TaskType.CHANGE_VQA:
                prompt = sample.question or "What features changed between the two observations?"
                user_msg = f"{t1_token}\n{t2_token}\n{prompt}"
                assistant_msg = sample.answer or "Surface change detected between Time 1 and Time 2."
            elif sample.task == TaskType.CHANGE_CAPTIONING:
                user_msg = f"{t1_token}\n{t2_token}\nDescribe the chronological modifications between Time 1 and Time 2."
                assistant_msg = sample.caption or "Between Time 1 and Time 2, new structures were built."
            else:
                user_msg = f"{t1_token}\n{t2_token}\nDelineate all surface modification extents between T1 and T2."
                assistant_msg = sample.caption or "Significant surface change identified across the central sector."

            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif sample.task == TaskType.OPTICAL_SAR:
            opt_token = "<image>\n[Sentinel-2 Optical Multispectral]"
            sar_token = "<image>\n[Sentinel-1 SAR Radar VV/VH]"
            user_msg = (
                f"{opt_token}\n{sar_token}\n"
                "Perform all-weather cross-modal terrain analysis. Use radar backscatter to assess "
                "surfaces obscured by optical cloud cover."
            )
            assistant_msg = (
                sample.caption
                or "Cross-modal fusion penetrates optical cloud cover, delineating underlying terrain."
            )
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif sample.task == TaskType.VISUAL_GROUNDING:
            target_label = sample.labels[0] if sample.labels else "target object"
            query = sample.question or f"Locate all occurrences of {target_label} in this satellite image."
            user_msg = f"<image>\n{query}"
            
            if sample.target_boxes:
                box_strs = [b.to_xml_token() for b in sample.target_boxes]
                assistant_msg = f"Detected {len(box_strs)} instance(s): {' '.join(box_strs)}"
            else:
                assistant_msg = "No instances detected in the scene."
            
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif sample.task == TaskType.VQA:
            query = sample.question or "Analyze this earth observation capture."
            user_msg = f"<image>\n{query}"
            assistant_msg = sample.answer or "Analysis complete."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        elif sample.task in [TaskType.CAPTIONING, TaskType.SCENE_DESCRIPTION]:
            user_msg = "<image>\nProvide an expert remote sensing interpretation of this scene."
            assistant_msg = sample.caption or "A remote sensing earth observation capture showing terrestrial features."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        else:
            labels_str = ", ".join(sample.labels) if sample.labels else "diverse land cover"
            user_msg = "<image>\nClassify the primary land cover categories in this satellite observation."
            assistant_msg = f"The primary land-cover categories identified are: {labels_str}."
            conversations.append({"from": "human", "value": user_msg})
            conversations.append({"from": "gpt", "value": assistant_msg})

        return {
            "id": sample.id,
            "dataset": sample.dataset,
            "split": sample.split,
            "task": sample.task.value,
            "image": images[0] if len(images) == 1 else images,
            "conversations": conversations
        }

    @classmethod
    def export_instruction_dataset(
        cls,
        samples: List[UnifiedRemoteSensingExample],
        output_jsonl_path: str
    ) -> str:
        """Serialize a collection of samples into an instruction JSONL file."""
        out = Path(output_jsonl_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        with open(out, "w", encoding="utf-8") as f:
            for s in samples:
                dialogue = cls.to_llava_format(s)
                f.write(json.dumps(dialogue) + "\n")

        logger.info(f"Exported {len(samples)} instruction dialogues to {out}")
        return str(out)
