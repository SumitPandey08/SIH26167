/**
 * SatQuery AI — Core TypeScript Types & Schemas
 * Standard: SIH26167 Remote Sensing Vision-Language Assistant
 */

export type ModalityType = 'OPTICAL' | 'SAR' | 'MULTISPECTRAL' | 'UNKNOWN';

export type QueryIntent =
  | 'SINGLE_OPTICAL_ANALYSIS'
  | 'SINGLE_SAR_ANALYSIS'
  | 'SINGLE_IMAGE_VQA'
  | 'SCENE_CAPTIONING'
  | 'REGION_GROUNDING'
  | 'TEMPORAL_CHANGE_DETECTION'
  | 'TEMPORAL_CHANGE_QUANTITATIVE'
  | 'TEMPORAL_CHANGE_VQA'
  | 'OPTICAL_SAR_FUSION'
  | 'GENERAL_GEOSPATIAL_QUERY';

export interface BoundingBox {
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
}

export interface RasterMetadata {
  filename: string;
  filepath: string;
  crs?: string;
  bbox?: [number, number, number, number]; // [minx, miny, maxx, maxy]
  width: number;
  height: number;
  channels: number;
  dtype: string;
  gsd_m?: number; // Ground Sampling Distance in meters
  acquisition_date?: string;
  modality: ModalityType;
  nodata_value?: number | null;
  statistics?: {
    min?: number[];
    max?: number[];
    mean?: number[];
    std?: number[];
  };
}

export type EvidenceNodeType =
  | 'BINARY_SEGMENTATION_MASK'
  | 'SPATIAL_DIFFERENCE'
  | 'BOUNDING_BOX_GROUNDING'
  | 'SPECTRAL_INDEX_HEATMAP'
  | 'SAR_BACKSCATTER_MAP'
  | 'NUMERICAL_MEASUREMENT';

export interface SpatialMetric {
  pixel_count?: number;
  area_m2?: number;
  area_km2?: number;
  delta_area_km2?: number;
  percentage_change?: number;
  mean_confidence: number;
  centroid?: [number, number]; // [longitude, latitude] or [x, y]
  cluster_count?: number;
  additional_stats?: Record<string, number | string>;
}

export interface EvidenceNode {
  node_id: string;
  type: EvidenceNodeType;
  title: string;
  timestamp?: string;
  model_provenance: string;
  metric: SpatialMetric;
  raster_uri?: string;
  vector_geojson_uri?: string;
  preview_png_uri?: string;
  raw_bounding_box?: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
}

export interface Claim {
  claim_id: string;
  statement: string;
  status: 'VERIFIED' | 'LOW_CONFIDENCE' | 'UNSUPPORTED';
  supporting_evidence_nodes: string[]; // List of EvidenceNode node_ids
}

export interface ExecutionStepTrace {
  step_number: number;
  tool_name: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  duration_ms: number;
  parameters: Record<string, unknown>;
  output_summary?: string;
  error?: string;
}

export interface EvidenceGraph {
  investigation_id: string;
  query: string;
  intent: QueryIntent;
  spatial_context?: {
    crs?: string;
    bbox?: [number, number, number, number];
    ground_sample_distance_m?: number;
  };
  claims: Claim[];
  evidence_nodes: Record<string, EvidenceNode>;
  execution_trace: ExecutionStepTrace[];
  aggregate_confidence: number;
  answer_markdown: string;
  generated_at: string;
}

export interface InvestigationImage {
  id: string;
  role: 'primary' | 'before_t1' | 'after_t2' | 'optical' | 'sar' | 'auxiliary';
  filename: string;
  original_name: string;
  filepath: string;
  preview_url: string;
  metadata: RasterMetadata;
  uploaded_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  evidence_graph?: EvidenceGraph;
  execution_trace?: ExecutionStepTrace[];
  is_loading?: boolean;
}

export interface Investigation {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  images: InvestigationImage[];
  messages: ChatMessage[];
  evidence_graphs: EvidenceGraph[];
  tags?: string[];
}
