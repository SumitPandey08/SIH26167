/**
 * SatQuery AI — Python AI & Geospatial Service HTTP Client
 * Bridges Node.js primary API gateway to Python FastAPI specialist microservice.
 */

import { RasterMetadata, EvidenceGraph } from '../types/index.js';

export class PythonClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Check health and hardware capabilities of the Python AI service.
   */
  async checkHealth(): Promise<{ status: string; service: string; compute: Record<string, unknown> }> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) {
        throw new Error(`Python service returned status ${res.status}`);
      }
      return await res.json() as { status: string; service: string; compute: Record<string, unknown> };
    } catch (err) {
      throw new Error(`Failed to connect to Python AI service at ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Send a raster path to Python service for deep geospatial & metadata inspection.
   */
  async inspectRaster(filepath: string): Promise<RasterMetadata> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Inspection failed (${res.status}): ${errText}`);
      }

      return await res.json() as RasterMetadata;
    } catch (err) {
      throw new Error(`Python raster inspection error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Execute agentic investigation pipeline over designated images and user query.
   */
  async executeAnalysis(payload: {
    investigation_id: string;
    query: string;
    images: Array<{ filepath: string; role: string; metadata?: RasterMetadata }>;
    parameters?: Record<string, unknown>;
  }): Promise<EvidenceGraph> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Analysis failed (${res.status}): ${errText}`);
      }

      const responseData = await res.json() as { status: string; investigation_id: string; evidence_graph: EvidenceGraph };
      return responseData.evidence_graph;
    } catch (err) {
      throw new Error(`Python analysis execution error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export const pythonClient = new PythonClient();
