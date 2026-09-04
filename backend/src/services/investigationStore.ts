/**
 * SatQuery AI — Investigation Session Store & Pre-Packaged Demo Scenarios
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Investigation, InvestigationImage, ChatMessage, EvidenceGraph } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveStorageUpload(filename: string): string {
  const candidates = [
    path.resolve(__dirname, '../../../storage/uploads', filename),
    path.resolve(process.cwd(), '../storage/uploads', filename),
    path.resolve(process.cwd(), 'storage/uploads', filename),
    path.resolve(__dirname, '../../storage/uploads', filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  return path.resolve(__dirname, '../../../storage/uploads', filename);
}

class InvestigationStore {
  private investigations: Map<string, Investigation> = new Map();

  constructor() {
    this.seedDemoInvestigations();
  }

  getAll(): Investigation[] {
    return Array.from(this.investigations.values()).sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  getById(id: string): Investigation | undefined {
    return this.investigations.get(id);
  }

  create(title: string, description?: string): Investigation {
    const id = `inv_${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const inv: Investigation = {
      id,
      title: title || 'New Geospatial Investigation',
      description: description || 'Remote sensing multimodal investigation session',
      created_at: now,
      updated_at: now,
      images: [],
      messages: [
        {
          id: `msg_${uuidv4().substring(0, 8)}`,
          sender: 'assistant',
          content: `SatQuery AI initialized for investigation **${title}**. Upload optical, multispectral, or SAR rasters to begin analysis.`,
          timestamp: now,
        },
      ],
      evidence_graphs: [],
      tags: ['SIH26167', 'ISRO'],
    };

    this.investigations.set(id, inv);
    return inv;
  }

  addImage(investigationId: string, image: InvestigationImage): Investigation {
    const inv = this.getById(investigationId);
    if (!inv) throw new Error(`Investigation ${investigationId} not found`);

    inv.images.push(image);
    inv.updated_at = new Date().toISOString();

    // Add notification message
    inv.messages.push({
      id: `msg_${uuidv4().substring(0, 8)}`,
      sender: 'system',
      content: `Uploaded raster asset: **${image.original_name}** (${image.metadata.modality}, ${image.metadata.width}x${image.metadata.height}px, GSD: ~${image.metadata.gsd_m}m).`,
      timestamp: new Date().toISOString(),
    });

    return inv;
  }

  addMessage(investigationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const inv = this.getById(investigationId);
    if (!inv) throw new Error(`Investigation ${investigationId} not found`);

    const fullMessage: ChatMessage = {
      id: `msg_${uuidv4().substring(0, 8)}`,
      timestamp: new Date().toISOString(),
      ...message,
    };

    inv.messages.push(fullMessage);
    inv.updated_at = new Date().toISOString();

    if (message.evidence_graph) {
      inv.evidence_graphs.push(message.evidence_graph);
    }

    return fullMessage;
  }

  private seedDemoInvestigations() {
    const demo1Id = 'real_levir_urban_change';
    const now = new Date().toISOString();

    const demo1: Investigation = {
      id: demo1Id,
      title: 'Real Investigation 1: Sub-Meter Building Expansion (LEVIR-CD Optical)',
      description: 'Real bi-temporal satellite observation (0.5m GSD) from LEVIR-CD benchmark tracking real-world residential construction and land-cover transformation.',
      created_at: now,
      updated_at: now,
      images: [
        {
          id: 'img_levir_t1',
          role: 'before_t1',
          filename: 'real_levir_t1_optical.png',
          original_name: 'real_levir_t1_optical.png',
          filepath: resolveStorageUpload('real_levir_t1_optical.png'),
          preview_url: '/storage/uploads/real_levir_t1_optical.png',
          metadata: {
            filename: 'real_levir_t1_optical.png',
            filepath: resolveStorageUpload('real_levir_t1_optical.png'),
            crs: 'EPSG:32616',
            bbox: [-84.38, 33.74, -84.35, 33.77],
            width: 512,
            height: 512,
            channels: 3,
            dtype: 'uint8',
            gsd_m: 0.5,
            acquisition_date: '2016-08-10T10:30:00Z',
            modality: 'OPTICAL',
          },
          uploaded_at: now,
        },
        {
          id: 'img_levir_t2',
          role: 'after_t2',
          filename: 'real_levir_t2_optical.png',
          original_name: 'real_levir_t2_optical.png',
          filepath: resolveStorageUpload('real_levir_t2_optical.png'),
          preview_url: '/storage/uploads/real_levir_t2_optical.png',
          metadata: {
            filename: 'real_levir_t2_optical.png',
            filepath: resolveStorageUpload('real_levir_t2_optical.png'),
            crs: 'EPSG:32616',
            bbox: [-84.38, 33.74, -84.35, 33.77],
            width: 512,
            height: 512,
            channels: 3,
            dtype: 'uint8',
            gsd_m: 0.5,
            acquisition_date: '2021-09-14T10:45:00Z',
            modality: 'OPTICAL',
          },
          uploaded_at: now,
        },
      ],
      messages: [
        {
          id: 'msg_levir_welcome',
          sender: 'assistant',
          content: 'Welcome to the **Real LEVIR-CD High-Resolution Bi-Temporal Investigation**. These are real 0.5m GSD satellite observations from the official LEVIR-CD benchmark tracking newly constructed buildings, road paving, and vegetation removal. Ask: *"What changed between T1 and T2?"* or *"Analyze new building construction footprint."*',
          timestamp: now,
        },
      ],
      evidence_graphs: [],
      tags: ['Real-Satellite', 'LEVIR-CD', 'Bi-Temporal', 'Optical', 'High-Res'],
    };

    this.investigations.set(demo1Id, demo1);

    const demo2Id = 'real_sentinel_crossmodal';
    const demo2: Investigation = {
      id: demo2Id,
      title: 'Real Investigation 2: Maritime & Inundation (Sentinel-1 SAR + Sentinel-2 Optical)',
      description: 'Real co-registered European Space Agency (ESA) Sentinel-1 C-Band SAR and Sentinel-2 Multispectral True-Color scenes over coastal Gujarat.',
      created_at: now,
      updated_at: now,
      images: [
        {
          id: 'img_real_s2',
          role: 'optical',
          filename: 'real_sentinel2_optical.png',
          original_name: 'real_sentinel2_optical.png',
          filepath: resolveStorageUpload('real_sentinel2_optical.png'),
          preview_url: '/storage/uploads/real_sentinel2_optical.png',
          metadata: {
            filename: 'real_sentinel2_optical.png',
            filepath: resolveStorageUpload('real_sentinel2_optical.png'),
            crs: 'EPSG:32642',
            bbox: [68.12, 23.45, 68.25, 23.58],
            width: 512,
            height: 512,
            channels: 3,
            dtype: 'uint8',
            gsd_m: 10.0,
            acquisition_date: '2021-11-02T06:10:19Z',
            modality: 'OPTICAL',
          },
          uploaded_at: now,
        },
        {
          id: 'img_real_s1',
          role: 'sar',
          filename: 'real_sentinel1_sar_vv.png',
          original_name: 'real_sentinel1_sar_vv.png',
          filepath: resolveStorageUpload('real_sentinel1_sar_vv.png'),
          preview_url: '/storage/uploads/real_sentinel1_sar_vv.png',
          metadata: {
            filename: 'real_sentinel1_sar_vv.png',
            filepath: resolveStorageUpload('real_sentinel1_sar_vv.png'),
            crs: 'EPSG:32642',
            bbox: [68.12, 23.45, 68.25, 23.58],
            width: 512,
            height: 512,
            channels: 1,
            dtype: 'uint8',
            gsd_m: 10.0,
            acquisition_date: '2021-11-30T02:52:11Z',
            modality: 'SAR',
          },
          uploaded_at: now,
        },
      ],
      messages: [
        {
          id: 'msg_s1_welcome',
          sender: 'assistant',
          content: 'Welcome to the **Real Sentinel-1 C-Band SAR + Sentinel-2 Multispectral Investigation**. These are real level-1C and GRD satellite data products acquired by ESA Sentinel satellites. Ask: *"Compare the optical and SAR images to identify water bodies and radar reflectors."*',
          timestamp: now,
        },
      ],
      evidence_graphs: [],
      tags: ['Real-Satellite', 'Sentinel-1', 'Sentinel-2', 'SAR', 'Cross-Modal'],
    };

    this.investigations.set(demo2Id, demo2);

    const demo3Id = 'demo_nepal_hydrology';
    const demo3: Investigation = {
      id: demo3Id,
      title: 'Investigation 3: Himalayan River Inundation & Landslide (Bi-Temporal Sentinel-2)',
      description: 'Bi-temporal optical investigation tracking severe riverbed widening, sediment scouring, and alluvial fan alteration in Melamchi Valley, Nepal.',
      created_at: now,
      updated_at: now,
      images: [
        {
          id: 'img_nepal_t1',
          role: 'before_t1',
          filename: 'nepal_2020_t1_optical.png',
          original_name: 'nepal_2020_t1_optical.png',
          filepath: resolveStorageUpload('nepal_2020_t1_optical.png'),
          preview_url: '/storage/uploads/nepal_2020_t1_optical.png',
          metadata: {
            filename: 'nepal_2020_t1_optical.png',
            filepath: resolveStorageUpload('nepal_2020_t1_optical.png'),
            crs: 'EPSG:32644',
            bbox: [85.54, 27.81, 85.60, 27.86],
            width: 512,
            height: 512,
            channels: 3,
            dtype: 'uint8',
            gsd_m: 10.0,
            acquisition_date: '2020-10-15T04:45:00Z',
            modality: 'OPTICAL',
          },
          uploaded_at: now,
        },
        {
          id: 'img_nepal_t2',
          role: 'after_t2',
          filename: 'nepal_2026_t2_optical.png',
          original_name: 'nepal_2026_t2_optical.png',
          filepath: resolveStorageUpload('nepal_2026_t2_optical.png'),
          preview_url: '/storage/uploads/nepal_2026_t2_optical.png',
          metadata: {
            filename: 'nepal_2026_t2_optical.png',
            filepath: resolveStorageUpload('nepal_2026_t2_optical.png'),
            crs: 'EPSG:32644',
            bbox: [85.54, 27.81, 85.60, 27.86],
            width: 512,
            height: 512,
            channels: 3,
            dtype: 'uint8',
            gsd_m: 10.0,
            acquisition_date: '2026-06-20T04:50:00Z',
            modality: 'OPTICAL',
          },
          uploaded_at: now,
        },
      ],
      messages: [
        {
          id: 'msg_nepal_welcome',
          sender: 'assistant',
          content: 'SatQuery AI initialized for Himalayan River Inundation & Landslide. Specialist models TinyCD and spectral engines are primed to calculate bi-temporal water shifts and sediment displacement.',
          timestamp: now,
        },
      ],
      evidence_graphs: [
        {
          investigation_id: demo3Id,
          query: 'What changed between 2020 and 2026?',
          intent: 'TEMPORAL_CHANGE_QUANTITATIVE',
          claims: [
            {
              claim_id: 'claim_nepal_change_01',
              statement: 'Significant morphological change detected across 4.5896 km² of terrain (17.51% of scene area) due to river widening and debris scouring.',
              status: 'VERIFIED',
              supporting_evidence_nodes: ['node_nepal_change_map'],
            },
            {
              claim_id: 'claim_nepal_water_shift_02',
              statement: 'Active water surface area shifted by -5.86% along the main channel, with 46,080 pixels transitioning to gravel sediment bars.',
              status: 'VERIFIED',
              supporting_evidence_nodes: ['node_nepal_change_map'],
            },
          ],
          evidence_nodes: {
            node_nepal_change_map: {
              node_id: 'node_nepal_change_map',
              type: 'BINARY_SEGMENTATION_MASK',
              title: 'Bi-Temporal TinyCD Siamese Difference Mask',
              model_provenance: 'TinyCD Siamese U-Net + MAMB Attention (LEVIR-CD verified)',
              metric: {
                area_km2: 4.5896,
                delta_area_km2: -1.536,
                percentage_change: -5.86,
                pixel_count: 45896,
                mean_confidence: 0.942,
              },
              preview_png_uri: '/storage/masks/demo_nepal_hydrology_ev_change_244d28_change_map.png',
            },
          },
          execution_trace: [
            { step_number: 1, tool_name: 'RasterPreprocessor.normalize_and_align', status: 'SUCCESS', duration_ms: 18, parameters: { gsd: 10 } },
            { step_number: 2, tool_name: 'TinyCDAdapter.infer_change_mask', status: 'SUCCESS', duration_ms: 82, parameters: { threshold: 0.5 } },
            { step_number: 3, tool_name: 'SpectralEngine.calculate_ndwi_diff', status: 'SUCCESS', duration_ms: 24, parameters: { bands: ['green', 'nir'] } },
            { step_number: 4, tool_name: 'VectorExport.mask_to_polygons', status: 'SUCCESS', duration_ms: 10, parameters: { crs: 'EPSG:32644' } },
          ],
          aggregate_confidence: 0.942,
          answer_markdown: 'Analysis of bi-temporal Sentinel-2 optical imagery (2020 vs 2026) reveals 4.5896 km² of altered terrain (17.51% of total footprint). River channel scouring caused a -5.86% net shift in permanent water extent with extensive sediment deposition.',
          generated_at: now,
        },
      ],
      tags: ['Bi-Temporal', 'Sentinel-2', 'Hydrology', 'TinyCD', 'Optical'],
    };

    this.investigations.set(demo3Id, demo3);

    const demo4Id = 'demo_sar_flood';
    const demo4: Investigation = {
      id: demo4Id,
      title: 'Investigation 4: All-Weather Flood Mapping (Optical + Sentinel-1 SAR)',
      description: 'Overcoming 30% cloud blindness during monsoon flooding by fusing optical NDWI with Sentinel-1 C-band microwave radar specular backscatter.',
      created_at: now,
      updated_at: now,
      images: [
        {
          id: 'img_flood_optical',
          role: 'optical',
          filename: 'nepal_2026_cloud_covered_optical.png',
          original_name: 'nepal_2026_cloud_covered_optical.png',
          filepath: resolveStorageUpload('nepal_2026_cloud_covered_optical.png'),
          preview_url: '/storage/uploads/nepal_2026_cloud_covered_optical.png',
          metadata: {
            filename: 'nepal_2026_cloud_covered_optical.png',
            filepath: resolveStorageUpload('nepal_2026_cloud_covered_optical.png'),
            crs: 'EPSG:32644',
            bbox: [85.54, 27.81, 85.60, 27.86],
            width: 512,
            height: 512,
            channels: 3,
            dtype: 'uint8',
            gsd_m: 10.0,
            acquisition_date: '2026-07-02T05:00:00Z',
            modality: 'OPTICAL',
          },
          uploaded_at: now,
        },
        {
          id: 'img_flood_sar',
          role: 'sar',
          filename: 'sentinel1_2026_sar_flood.png',
          original_name: 'sentinel1_2026_sar_flood.png',
          filepath: resolveStorageUpload('sentinel1_2026_sar_flood.png'),
          preview_url: '/storage/uploads/sentinel1_2026_sar_flood.png',
          metadata: {
            filename: 'sentinel1_2026_sar_flood.png',
            filepath: resolveStorageUpload('sentinel1_2026_sar_flood.png'),
            crs: 'EPSG:32644',
            bbox: [85.54, 27.81, 85.60, 27.86],
            width: 512,
            height: 512,
            channels: 1,
            dtype: 'uint8',
            gsd_m: 10.0,
            acquisition_date: '2026-07-02T05:05:00Z',
            modality: 'SAR',
          },
          uploaded_at: now,
        },
      ],
      messages: [
        {
          id: 'msg_flood_welcome',
          sender: 'assistant',
          content: 'SatQuery AI initialized for Optical + SAR Fusion. Cloud-covered optical scenes can now be penetrated using Sentinel-1 C-band synthetic aperture radar.',
          timestamp: now,
        },
      ],
      evidence_graphs: [
        {
          investigation_id: demo4Id,
          query: 'Compare optical and SAR images to map flooded regions.',
          intent: 'OPTICAL_SAR_FUSION',
          claims: [
            {
              claim_id: 'claim_sar_flood_01',
              statement: 'Multimodal fusion delineated 20.3062 km² total water extent, recovering 2.644 km² of inundated land hidden beneath 30.04% optical cloud cover.',
              status: 'VERIFIED',
              supporting_evidence_nodes: ['node_sar_fusion_preview'],
            },
          ],
          evidence_nodes: {
            node_sar_fusion_preview: {
              node_id: 'node_sar_fusion_preview',
              type: 'SAR_BACKSCATTER_MAP',
              title: 'SEN12MS Cross-Modal Water Penetration Mask',
              model_provenance: 'SEN12MS Dual-Stream Radar-Optical Fusion + Lee Filter',
              metric: {
                area_km2: 20.3062,
                delta_area_km2: 2.644,
                percentage_change: 14.97,
                pixel_count: 203062,
                mean_confidence: 0.96,
              },
              preview_png_uri: '/storage/masks/demo_sar_optical_flood_ev_fusion_4b1fec_fused_preview.png',
            },
          },
          execution_trace: [
            { step_number: 1, tool_name: 'SARProcessor.enhanced_lee_filter', status: 'SUCCESS', duration_ms: 14, parameters: { kernel: 7 } },
            { step_number: 2, tool_name: 'SARProcessor.specular_thresholding', status: 'SUCCESS', duration_ms: 22, parameters: { db_threshold: -16.5 } },
            { step_number: 3, tool_name: 'OpticalSARFusion.cross_modal_blend', status: 'SUCCESS', duration_ms: 65, parameters: { cloud_mask_threshold: 0.25 } },
            { step_number: 4, tool_name: 'VectorExport.generate_inundation_polygons', status: 'SUCCESS', duration_ms: 15, parameters: {} },
          ],
          aggregate_confidence: 0.96,
          answer_markdown: 'Through cross-modal fusion of Sentinel-1 C-band SAR with Sentinel-2 optical imagery, 20.3062 km² of flooded terrain was identified. Radar backscatter penetrated 30.04% cloud cover to detect 2.644 km² of obscured water bodies.',
          generated_at: now,
        },
      ],
      tags: ['Multi-Sensor', 'SAR', 'Sentinel-1', 'Flood', 'Optical'],
    };

    this.investigations.set(demo4Id, demo4);
  }
}

export const investigationStore = new InvestigationStore();
