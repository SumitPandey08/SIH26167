"""
SatQuery AI — Regression Test Suite
Standard: SIH26167 Remote Sensing Assistant
Ensures core specialist algorithms and real satellite data processing never regress.
"""

import sys
import unittest
from pathlib import Path
import numpy as np

# Ensure services/ai is on sys.path
root_dir = Path(__file__).resolve().parent.parent
ai_root = root_dir / "services" / "ai"
if str(ai_root) not in sys.path:
    sys.path.insert(0, str(ai_root))

from app.schemas.metadata import RasterMetadata, ModalityType, QueryIntent
from app.models.adapters.tinycd import TinyCDModelAdapter, tinycd_adapter
from app.tools.spectral_engine import SpectralEngine
from app.tools.sar_processor import SARProcessor
from app.tools.optical_sar_fusion import OpticalSARFusionEngine
from app.tools.raster_preprocessor import RasterPreprocessor
from app.agent.interpreter import QueryInterpreter


class TestSatQueryRegression(unittest.TestCase):

    def setUp(self):
        self.dummy_opt = np.random.rand(3, 64, 64).astype(np.float32)
        self.dummy_sar = np.random.rand(1, 64, 64).astype(np.float32)
        self.meta_opt = RasterMetadata(
            filename="opt_test.png",
            filepath="opt_test.png",
            width=64,
            height=64,
            channels=3,
            dtype="float32",
            gsd_m=10.0,
            modality=ModalityType.OPTICAL
        )
        self.meta_sar = RasterMetadata(
            filename="sar_test.png",
            filepath="sar_test.png",
            width=64,
            height=64,
            channels=1,
            dtype="float32",
            gsd_m=10.0,
            modality=ModalityType.SAR
        )

    def test_01_tinycd_neural_forward_pass(self):
        """Verify TinyCD model runs tensor computation and outputs valid probabilities [0, 1]."""
        t1 = np.ones((3, 64, 64), dtype=np.float32) * 0.2
        t2 = np.ones((3, 64, 64), dtype=np.float32) * 0.8
        prob_map = tinycd_adapter.predict_change_probabilities(t1, t2)
        self.assertEqual(prob_map.shape, (64, 64))
        self.assertTrue(np.all(prob_map >= 0.0) and np.all(prob_map <= 1.0))
        self.assertGreater(float(np.mean(prob_map)), 0.0)

    def test_02_spectral_engine_indices(self):
        """Verify NDVI and NDWI are computed with valid values."""
        # Simulated NIR (ch 0), Red (ch 1), Green (ch 2)
        arr = np.zeros((3, 32, 32), dtype=np.float32)
        arr[0, :, :] = 0.8  # NIR high
        arr[1, :, :] = 0.2  # Red low
        arr[2, :, :] = 0.5  # Green med
        
        ndvi, veg_mask, _ = SpectralEngine.compute_ndvi(arr, self.meta_opt)
        self.assertEqual(ndvi.shape, (32, 32))
        self.assertTrue(np.all(ndvi >= -1.0) and np.all(ndvi <= 1.0))
        self.assertEqual(veg_mask.shape, (32, 32))

        ndwi, water_mask, _ = SpectralEngine.compute_ndwi(arr, self.meta_opt)
        self.assertEqual(ndwi.shape, (32, 32))
        self.assertTrue(np.all(ndwi >= -1.0) and np.all(ndwi <= 1.0))

    def test_03_sar_lee_filtering_and_calibration(self):
        """Verify Enhanced Lee Filter and decibel conversion on SAR data."""
        raw_sar = np.random.uniform(0.01, 2.0, (64, 64)).astype(np.float32)
        db = SARProcessor.calibrate_decibels(raw_sar)
        self.assertEqual(db.shape, (64, 64))
        filtered = SARProcessor.enhanced_lee_filter(db, window_size=5)
        self.assertEqual(filtered.shape, (64, 64))
        # Variance of filtered image should be less than or equal to raw noise
        self.assertLessEqual(np.var(filtered), np.var(db) + 1e-4)

    def test_04_optical_sar_fusion(self):
        """Verify cross-modal fusion delineates water and detects cloud occlusion."""
        opt_cloud = np.ones((3, 64, 64), dtype=np.float32) * 0.9  # bright clouds
        sar_water = np.ones((1, 64, 64), dtype=np.float32) * 0.001  # specular low backscatter
        ev_node, stats = OpticalSARFusionEngine.fuse_optical_sar(
            opt_cloud, sar_water, self.meta_opt, self.meta_sar, "test_investigation"
        )
        self.assertIsNotNone(ev_node)
        self.assertIn("cloud_coverage_pct", stats)
        self.assertIn("fused_water_km2", stats)
        self.assertIn("sar_revealed_km2", stats)
        self.assertGreater(stats["cloud_coverage_pct"], 50.0)

    def test_05_real_imagery_on_disk(self):
        """Verify real LEVIR and Sentinel-1/2 rasters on disk load properly."""
        storage_uploads = root_dir / "storage" / "uploads"
        real_levir = storage_uploads / "real_levir_t1_optical.png"
        real_sar = storage_uploads / "real_sentinel1_sar_vv.png"

        if real_levir.exists():
            arr, meta = RasterPreprocessor.load_raster_array(str(real_levir))
            self.assertEqual(len(arr.shape), 3)
            self.assertGreater(meta.width, 0)
            self.assertGreater(meta.height, 0)

        if real_sar.exists():
            arr, meta = RasterPreprocessor.load_raster_array(str(real_sar))
            self.assertEqual(len(arr.shape), 3)
            self.assertGreater(meta.width, 0)


if __name__ == "__main__":
    unittest.main()
