"""
SatQuery AI — End-to-End Scenarios Verification Suite
Standard: SIH26167 Remote Sensing Assistant
Verifies all 6 core production scenarios specified in Definition of Done:
1. Single Optical Scene Description / Captioning
2. Single Optical Building Grounding & Detection
3. Bi-Temporal TinyCD Change Detection
4. Target-Specific Building Change Intersection
5. Cross-Modal Optical + SAR Cloud-Penetrating Inundation Mapping
6. Autonomous Investigation Mode with Full Dossier Generation
"""

import sys
import unittest
from pathlib import Path

# Ensure services/ai is on sys.path
root_dir = Path(__file__).resolve().parent.parent
ai_root = root_dir / "services" / "ai"
if str(ai_root) not in sys.path:
    sys.path.insert(0, str(ai_root))

from app.schemas.evidence import AnalysisRequest
from app.agent.orchestrator import AgentOrchestrator
from app.tools.raster_preprocessor import RasterPreprocessor

uploads_dir = root_dir / "storage" / "uploads"
levir_t1 = str(uploads_dir / "real_levir_t1_optical.png")
levir_t2 = str(uploads_dir / "real_levir_t2_optical.png")
sentinel_opt = str(uploads_dir / "real_sentinel2_optical.png")
sentinel_sar = str(uploads_dir / "real_sentinel1_sar_vv.png")


class TestSatQueryProductionScenarios(unittest.TestCase):

    def test_scenario_1_single_optical_captioning(self):
        """Scenario 1: Upload one optical image -> Ask 'Describe this scene.'"""
        meta_t1 = RasterPreprocessor.inspect_raster(levir_t1)
        req = AnalysisRequest(
            investigation_id="scen_1_caption",
            query="Describe this scene.",
            images=[{"filepath": levir_t1, "role": "primary", "metadata": meta_t1.model_dump()}],
        )
        graph = AgentOrchestrator.execute_investigation(req)
        self.assertIsNotNone(graph)
        self.assertGreater(len(graph.execution_trace), 0)
        self.assertGreater(len(graph.claims), 0)
        self.assertIn("terrain", graph.answer_markdown.lower())
        self.assertGreater(graph.aggregate_confidence, 0.70)
        print("  ✓ Scenario 1 Passed: Single optical captioning & land-cover analysis.")

    def test_scenario_2_single_optical_building_grounding(self):
        """Scenario 2: Upload one optical image -> Ask 'Where are the buildings?'"""
        meta_t1 = RasterPreprocessor.inspect_raster(levir_t1)
        req = AnalysisRequest(
            investigation_id="scen_2_grounding",
            query="Where are the buildings?",
            images=[{"filepath": levir_t1, "role": "primary", "metadata": meta_t1.model_dump()}],
        )
        graph = AgentOrchestrator.execute_investigation(req)
        self.assertIsNotNone(graph)
        # Should have run BuildingDetectionTool
        tools_run = [t.tool_name for t in graph.execution_trace]
        self.assertIn("BuildingDetectionTool", tools_run)
        self.assertGreater(len(graph.evidence_nodes), 0)
        # Check building count
        bldg_node = list(graph.evidence_nodes.values())[0]
        self.assertGreater(bldg_node.metric.cluster_count or 0, 0)
        print(f"  ✓ Scenario 2 Passed: Building detection located {bldg_node.metric.cluster_count} candidate structures.")

    def test_scenario_3_bitemporal_tinycd_change(self):
        """Scenario 3: Upload T1 + T2 -> Ask 'What changed between these two images?'"""
        meta_t1 = RasterPreprocessor.inspect_raster(levir_t1)
        meta_t2 = RasterPreprocessor.inspect_raster(levir_t2)
        req = AnalysisRequest(
            investigation_id="scen_3_change",
            query="What changed between these two images?",
            images=[
                {"filepath": levir_t1, "role": "t1", "metadata": meta_t1.model_dump()},
                {"filepath": levir_t2, "role": "t2", "metadata": meta_t2.model_dump()},
            ],
        )
        graph = AgentOrchestrator.execute_investigation(req)
        self.assertIsNotNone(graph)
        tools_run = [t.tool_name for t in graph.execution_trace]
        self.assertIn("ChangeDetectionTool", tools_run)
        self.assertIn("CoRegistrationValidator", tools_run)
        self.assertGreater(len(graph.evidence_nodes), 0)
        self.assertEqual(graph.claims[0].status, "VERIFIED")
        print("  ✓ Scenario 3 Passed: Bi-temporal TinyCD change detection & area statistics verified.")

    def test_scenario_4_building_specific_change(self):
        """Scenario 4: Upload T1 + T2 -> Ask 'What changed specifically in buildings?'"""
        meta_t1 = RasterPreprocessor.inspect_raster(levir_t1)
        meta_t2 = RasterPreprocessor.inspect_raster(levir_t2)
        req = AnalysisRequest(
            investigation_id="scen_4_bldg_change",
            query="What changed specifically in buildings?",
            images=[
                {"filepath": levir_t1, "role": "t1", "metadata": meta_t1.model_dump()},
                {"filepath": levir_t2, "role": "t2", "metadata": meta_t2.model_dump()},
            ],
        )
        graph = AgentOrchestrator.execute_investigation(req)
        self.assertIsNotNone(graph)
        tools_run = [t.tool_name for t in graph.execution_trace]
        self.assertIn("ChangeDetectionTool", tools_run)
        self.assertIn("BuildingDetectionTool", tools_run)
        # Claim must contain candidate building changes
        self.assertTrue(any("candidate building changes" in c.statement.lower() for c in graph.claims))
        print("  ✓ Scenario 4 Passed: Building detection intersected with change mask.")

    def test_scenario_5_optical_sar_cloud_penetration(self):
        """Scenario 5: Upload Optical + SAR -> Ask 'Where is flooding visible despite cloud cover?'"""
        meta_opt = RasterPreprocessor.inspect_raster(sentinel_opt)
        meta_sar = RasterPreprocessor.inspect_raster(sentinel_sar)
        req = AnalysisRequest(
            investigation_id="scen_5_crossmodal",
            query="Where is flooding visible despite cloud cover?",
            images=[
                {"filepath": sentinel_opt, "role": "optical", "metadata": meta_opt.model_dump()},
                {"filepath": sentinel_sar, "role": "sar", "metadata": meta_sar.model_dump()},
            ],
        )
        graph = AgentOrchestrator.execute_investigation(req)
        self.assertIsNotNone(graph)
        tools_run = [t.tool_name for t in graph.execution_trace]
        self.assertIn("OpticalSARTool", tools_run)
        self.assertIn("Cross-Modal", graph.answer_markdown)
        print("  ✓ Scenario 5 Passed: Cross-modal optical + SAR cloud penetration.")

    def test_scenario_6_autonomous_investigation_mode(self):
        """Scenario 6: Click 'INVESTIGATE' -> Autonomous multi-criteria survey and dossier export"""
        meta_t1 = RasterPreprocessor.inspect_raster(levir_t1)
        meta_t2 = RasterPreprocessor.inspect_raster(levir_t2)
        req = AnalysisRequest(
            investigation_id="scen_6_investigate",
            query="Investigate this area",
            requested_mode="investigation",
            images=[
                {"filepath": levir_t1, "role": "t1", "metadata": meta_t1.model_dump()},
                {"filepath": levir_t2, "role": "t2", "metadata": meta_t2.model_dump()},
            ],
        )
        graph = AgentOrchestrator.execute_investigation(req)
        self.assertIsNotNone(graph)
        tools_run = [t.tool_name for t in graph.execution_trace]
        self.assertIn("ReportGenerator", tools_run)
        # Verify reports generated on disk
        report_meta = graph.spatial_context.get("report_metadata", {})
        self.assertIn("json_path", report_meta)
        self.assertIn("md_path", report_meta)
        self.assertTrue(Path(report_meta["json_path"]).exists())
        self.assertTrue(Path(report_meta["md_path"]).exists())
        print(f"  ✓ Scenario 6 Passed: Autonomous investigation executed with dossier at {report_meta['md_path']}.")


if __name__ == "__main__":
    unittest.main()
