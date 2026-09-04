"""SatQuery Dataset Hub Unit & Integration Tests.

Validates:
1. Registry enumeration, tiering, and discovery
2. Unified remote sensing schema serialization & VLM dialogue conversion
3. Priority adapters across Tier 1, Tier 2, and Tier 3
4. DatasetValidator quality anomaly detection and pass/fail reports
5. SplitManager strict partition isolation and leak prevention
"""

import os
import unittest
from pathlib import Path

from satquery.datasets.schema import (
    BoundingBox,
    GeoReference,
    Modality,
    Sensor,
    TaskType,
    UnifiedRemoteSensingExample,
)
from satquery.datasets.registry import DatasetRegistry
from satquery.datasets.validator import DatasetValidator
from satquery.datasets.splits import SplitManager


class TestDatasetHub(unittest.TestCase):
    """Test suite for SatQuery Dataset Hub architecture."""

    def test_01_registry_enumeration(self):
        """Verify all 13 benchmarks are registered with valid tiers and metadata."""
        datasets = DatasetRegistry.list_datasets()
        self.assertGreaterEqual(len(datasets), 13)

        tier1 = [d["dataset"] for d in datasets if d["tier"] == 1]
        tier2 = [d["dataset"] for d in datasets if d["tier"] == 2]
        tier3 = [d["dataset"] for d in datasets if d["tier"] == 3]

        self.assertIn("BigEarthNet-v2", tier1)
        self.assertIn("VRSBench", tier1)
        self.assertIn("RSVQA", tier1)
        self.assertIn("LEVIR-CD", tier1)
        self.assertIn("LEVIR-CC", tier1)
        self.assertIn("CDVQA", tier1)

        self.assertIn("SEN12MS", tier2)
        self.assertIn("BRIGHT", tier2)
        self.assertIn("UrbanSARFloods", tier2)

        self.assertIn("FloodNet", tier3)
        self.assertIn("DIOR-RSVG", tier3)
        self.assertIn("DOTA", tier3)
        self.assertIn("FAIR1M", tier3)

    def test_02_unified_schema_and_dialogue_conversion(self):
        """Verify unified remote sensing example serialization and dialogue formatting."""
        bbox = BoundingBox(box_2d=[0.1, 0.2, 0.5, 0.6], label="hangar", is_normalized=True)
        self.assertEqual(bbox.to_xml_token(), "<box>[0.10, 0.20, 0.50, 0.60]</box>")

        example = UnifiedRemoteSensingExample(
            id="test_grounding_01",
            dataset="VRSBench",
            split="train",
            modalities=[Modality.OPTICAL],
            sensors=[Sensor.AIRBORNE_OPTICAL],
            task=TaskType.VISUAL_GROUNDING,
            optical_path="storage/uploads/real_levir_t1_optical.png",
            target_boxes=[bbox],
            labels=["hangar"],
            question="Locate the aircraft hangar."
        )

        dialogue = example.to_vlm_dialogue()
        self.assertEqual(dialogue["id"], "test_grounding_01")
        self.assertEqual(dialogue["task"], "visual_grounding")
        self.assertIn("<box>[0.10, 0.20, 0.50, 0.60]</box>", dialogue["conversations"][1]["value"])

    def test_03_tier1_adapters_streaming(self):
        """Verify Tier 1 adapters stream valid samples."""
        tier1_names = ["BigEarthNet-v2", "VRSBench", "RSVQA", "LEVIR-CD", "LEVIR-CC", "CDVQA"]
        for name in tier1_names:
            adapter = DatasetRegistry.get(name)
            self.assertEqual(adapter.tier, 1)
            samples = list(adapter.iter_samples(split="train", streaming=True, max_samples=3))
            self.assertEqual(len(samples), 3, f"Failed streaming for {name}")
            self.assertIsNotNone(samples[0].id)
            self.assertTrue(len(samples[0].get_primary_images()) > 0)

    def test_04_tier2_and_tier3_adapters_streaming(self):
        """Verify Tier 2 and Tier 3 adapters stream valid samples."""
        other_names = ["SEN12MS", "BRIGHT", "UrbanSARFloods", "FloodNet", "DIOR-RSVG", "DOTA", "FAIR1M"]
        for name in other_names:
            adapter = DatasetRegistry.get(name)
            samples = list(adapter.iter_samples(split="train", streaming=True, max_samples=2))
            self.assertEqual(len(samples), 2, f"Failed streaming for {name}")
            self.assertIsNotNone(samples[0].id)

    def test_05_dataset_subset_preparation(self):
        """Verify prepare_subset creates valid cached jsonl file."""
        adapter = DatasetRegistry.get("VRSBench")
        out_file = adapter.prepare_subset(max_samples=5, split="dev")
        self.assertTrue(os.path.exists(out_file))
        with open(out_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        self.assertEqual(len(lines), 5)

    def test_06_dataset_validator_anomaly_detection(self):
        """Verify DatasetValidator flags missing files, bad bboxes, and missing temporal pairs."""
        validator = DatasetValidator()

        # 1. Bad bbox (ymin > ymax)
        with self.assertRaises(ValueError):
            BoundingBox(box_2d=[0.8, 0.2, 0.4, 0.6], label="invalid")

        # 2. Missing temporal partner
        bad_sample = UnifiedRemoteSensingExample(
            id="bad_temporal_01",
            dataset="LEVIR-CD",
            split="train",
            task=TaskType.TEMPORAL_CHANGE,
            t1_path="storage/uploads/real_levir_t1_optical.png",
            t2_path=None  # Missing!
        )
        issues = validator.validate_sample(bad_sample)
        codes = [i["code"] for i in issues]
        self.assertIn("MISSING_TEMPORAL_PARTNER", codes)

        # 3. Clean sample
        adapter = DatasetRegistry.get("VRSBench")
        clean_samples = list(adapter.iter_samples(split="train", max_samples=5))
        report = validator.validate_dataset(clean_samples, "VRSBench")
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["errors"], 0)

    def test_07_split_manager_isolation(self):
        """Verify SplitManager detects leaks and passes isolated splits."""
        sm = SplitManager()
        adapter = DatasetRegistry.get("VRSBench")

        train_s = list(adapter.iter_samples(split="train", max_samples=10))
        val_s = list(adapter.iter_samples(split="val", max_samples=5))
        test_s = list(adapter.iter_samples(split="test", max_samples=5))

        # Check clean isolation
        report = sm.verify_split_isolation(train_s, val_s, test_s)
        self.assertEqual(report["status"], "PASS")
        self.assertTrue(report["is_isolated"])

        # Inject an intentional leak
        leak_report = sm.verify_split_isolation(train_s, train_s[:2], test_s)
        self.assertEqual(leak_report["status"], "FAIL")
        self.assertFalse(leak_report["is_isolated"])
        self.assertGreater(len(leak_report["id_leaks"]["train_val"]), 0)


if __name__ == "__main__":
    unittest.main()
