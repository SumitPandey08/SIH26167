/**
 * SatQuery AI — Investigation Session Store & Pre-Packaged Demo Scenarios
 */

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Investigation, InvestigationImage, ChatMessage, EvidenceGraph } from '../types/index.js';

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
          filepath: path.resolve(process.cwd(), 'storage/uploads/real_levir_t1_optical.png'),
          preview_url: '/storage/uploads/real_levir_t1_optical.png',
          metadata: {
            filename: 'real_levir_t1_optical.png',
            filepath: path.resolve(process.cwd(), 'storage/uploads/real_levir_t1_optical.png'),
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
          filepath: path.resolve(process.cwd(), 'storage/uploads/real_levir_t2_optical.png'),
          preview_url: '/storage/uploads/real_levir_t2_optical.png',
          metadata: {
            filename: 'real_levir_t2_optical.png',
            filepath: path.resolve(process.cwd(), 'storage/uploads/real_levir_t2_optical.png'),
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
      description: 'Real co-registered European Space Agency (ESA) Sentinel-1 C-Band SAR and Sentinel-2 Multispectral True-Color scenes.',
      created_at: now,
      updated_at: now,
      images: [
        {
          id: 'img_real_s2',
          role: 'optical',
          filename: 'real_sentinel2_optical.png',
          original_name: 'real_sentinel2_optical.png',
          filepath: path.resolve(process.cwd(), 'storage/uploads/real_sentinel2_optical.png'),
          preview_url: '/storage/uploads/real_sentinel2_optical.png',
          metadata: {
            filename: 'real_sentinel2_optical.png',
            filepath: path.resolve(process.cwd(), 'storage/uploads/real_sentinel2_optical.png'),
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
          filepath: path.resolve(process.cwd(), 'storage/uploads/real_sentinel1_sar_vv.png'),
          preview_url: '/storage/uploads/real_sentinel1_sar_vv.png',
          metadata: {
            filename: 'real_sentinel1_sar_vv.png',
            filepath: path.resolve(process.cwd(), 'storage/uploads/real_sentinel1_sar_vv.png'),
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
  }
}

export const investigationStore = new InvestigationStore();
