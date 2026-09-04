"""SatQuery Training & VLM Adaptation Unit & Integration Tests.

Validates:
1. Instruction conversion across diverse tasks (VQA, caption, grounding, bi-temporal, optical-SAR)
2. RemoteSensingVLMCollator tensor batching and normalization
3. RemoteSensingVLMTrainer dry-run training loop and state persistence
4. UnifiedRemoteSensingEvaluator metric calculation and report export
"""

import os
import unittest
from pathlib import Path
import torch

from satquery.datasets.registry import DatasetRegistry
from satquery.datasets.schema import TaskType
from satquery.training.instruction_converter import InstructionConverter
from satquery.training.collator import RemoteSensingVLMCollator
from satquery.training.trainer import RemoteSensingVLMTrainer
from satquery.evaluation.evaluator import UnifiedRemoteSensingEvaluator


class TestTrainingAdaptation(unittest.TestCase):
    """Test suite for VLM adaptation and evaluation pipeline."""

    def test_01_instruction_conversion_formats(self):
        """Verify instruction conversion produces valid conversational structure for all tasks."""
        # 1. Bi-temporal Change Captioning (LEVIR-CC)
        levir_cc = DatasetRegistry.get("LEVIR-CC")
        sample_cc = next(levir_cc.iter_samples(split="train", max_samples=1))
        dialogue_cc = InstructionConverter.to_llava_format(sample_cc)
        self.assertIn("conversations", dialogue_cc)
        self.assertEqual(len(dialogue_cc["conversations"]), 2)
        self.assertIn("Time 1 Observation", dialogue_cc["conversations"][0]["value"])
        self.assertIn("Time 2 Observation", dialogue_cc["conversations"][0]["value"])

        # 2. Optical-SAR (SEN12MS)
        sen12ms = DatasetRegistry.get("SEN12MS")
        sample_sar = next(sen12ms.iter_samples(split="train", max_samples=1))
        dialogue_sar = InstructionConverter.to_llava_format(sample_sar)
        self.assertIn("Sentinel-1 SAR Radar", dialogue_sar["conversations"][0]["value"])

        # 3. Visual Grounding (VRSBench)
        vrs = DatasetRegistry.get("VRSBench")
        sample_grd = list(vrs.iter_samples(split="train", max_samples=10))[0]
        dialogue_grd = InstructionConverter.to_llava_format(sample_grd)
        self.assertEqual(dialogue_grd["task"], "visual_grounding")
        self.assertIn("<box>", dialogue_grd["conversations"][1]["value"])

    def test_02_data_collator_batching(self):
        """Verify collator processes single and dual images into torch tensors."""
        collator = RemoteSensingVLMCollator(image_size=128)
        batch_items = [
            {
                "id": "item_single",
                "task": "captioning",
                "image": "datasets/real/sentinel/real_sentinel2_optical.png",
                "conversations": [{"from": "human", "value": "<image>"}, {"from": "gpt", "value": "A satellite scene"}]
            },
            {
                "id": "item_dual",
                "task": "temporal_change",
                "image": [
                    "datasets/real/levir_cd/levir_t1.png",
                    "datasets/real/levir_cd/levir_t2.png"
                ],
                "conversations": [{"from": "human", "value": "<image><image>"}, {"from": "gpt", "value": "Changed area"}]
            }
        ]

        batch = collator(batch_items)
        self.assertEqual(batch["batch_size"], 2)
        self.assertEqual(batch["pixel_values"].shape, (2, 3, 128, 128))
        self.assertEqual(batch["temporal_pixel_values"].shape, (2, 3, 128, 128))
        self.assertIsInstance(batch["pixel_values"], torch.Tensor)

    def test_03_trainer_dry_run_execution(self):
        """Verify trainer executes training steps and saves checkpoint state."""
        vrs = DatasetRegistry.get("VRSBench")
        samples = list(vrs.iter_samples(split="train", max_samples=4))
        records = [InstructionConverter.to_llava_format(s) for s in samples]

        config = {
            "stage_name": "test_verification_stage",
            "batch_size": 2,
            "learning_rate": 1e-4,
            "image_size": 128,
            "epochs": 1,
            "force_cpu": True
        }

        trainer = RemoteSensingVLMTrainer(config=config)
        result = trainer.train_stage(records, dry_run=True)

        self.assertEqual(result["stage_name"], "test_verification_stage")
        self.assertEqual(result["total_steps"], 2)
        self.assertTrue(os.path.exists(trainer.output_dir / "trainer_state.json"))

    def test_04_evaluator_metrics(self):
        """Verify evaluator produces scientific benchmark metrics."""
        evaluator = UnifiedRemoteSensingEvaluator()
        report = evaluator.evaluate_dataset("VRSBench", split="test", max_samples=5)

        self.assertEqual(report["status"], "PASS")
        self.assertIn("vqa", report["metrics"])
        self.assertIn("accuracy", report["metrics"]["vqa"])


if __name__ == "__main__":
    unittest.main()
