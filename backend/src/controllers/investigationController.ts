/**
 * SatQuery AI — Investigation Controller
 */

import { Request, Response } from 'express';
import { investigationStore } from '../services/investigationStore.js';
import { pythonClient } from '../services/pythonClient.js';
import { ReportGenerator } from '../services/reportGenerator.js';
import { telemetryBroadcaster } from '../websockets/telemetryServer.js';
import { InvestigationImage } from '../types/index.js';
import path from 'path';

export class InvestigationController {
  static getAll(req: Request, res: Response) {
    const list = investigationStore.getAll();
    res.json({ investigations: list });
  }

  static getById(req: Request, res: Response) {
    const inv = investigationStore.getById(req.params.id);
    if (!inv) {
      return res.status(404).json({ error: `Investigation ${req.params.id} not found` });
    }
    res.json({ investigation: inv });
  }

  static create(req: Request, res: Response) {
    const { title, description } = req.body;
    const inv = investigationStore.create(title, description);
    res.status(201).json({ investigation: inv });
  }

  static async uploadImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = (req.body.role as InvestigationImage['role']) || 'primary';
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }

      const inv = investigationStore.getById(id);
      if (!inv) {
        return res.status(404).json({ error: `Investigation ${id} not found` });
      }

      // Ask Python service to inspect the uploaded raster
      let metadata;
      try {
        metadata = await pythonClient.inspectRaster(file.path);
      } catch (err) {
        // Fallback default metadata if Python service isn't active
        metadata = {
          filename: file.filename,
          filepath: file.path,
          width: 512,
          height: 512,
          channels: 3,
          dtype: 'uint8',
          gsd_m: 10.0,
          modality: file.originalname.toLowerCase().includes('sar') ? 'SAR' as const : 'OPTICAL' as const,
        };
      }

      const newImage: InvestigationImage = {
        id: `img_${Date.now()}`,
        role,
        filename: file.filename,
        original_name: file.originalname,
        filepath: file.path,
        preview_url: `/storage/uploads/${file.filename}`,
        metadata,
        uploaded_at: new Date().toISOString(),
      };

      const updatedInv = investigationStore.addImage(id, newImage);
      res.status(201).json({ image: newImage, investigation: updatedInv });
    } catch (err) {
      res.status(500).json({ error: `Failed to upload and inspect raster: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  static async askQuery(req: Request, res: Response) {
    const { id } = req.params;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const inv = investigationStore.getById(id);
    if (!inv) {
      return res.status(404).json({ error: `Investigation ${id} not found` });
    }

    // 1. Record User Message
    investigationStore.addMessage(id, {
      sender: 'user',
      content: query,
    });

    // Notify telemetry stream that query processing started
    telemetryBroadcaster.broadcastStep(id, 1, 'AGENTIC_ORCHESTRATOR', 'RUNNING', `Processing query: "${query}"`);

    try {
      // 2. Prepare payload for Python AI Specialist Engine
      const payload = {
        investigation_id: id,
        query,
        images: inv.images.map(img => ({
          filepath: img.filepath,
          role: img.role,
          metadata: img.metadata,
        })),
      };

      // 3. Execute Analysis via Python Service
      const evidenceGraph = await pythonClient.executeAnalysis(payload);

      // Broadcast step completions
      for (const step of evidenceGraph.execution_trace) {
        telemetryBroadcaster.broadcastStep(id, step.step_number, step.tool_name, step.status, step.output_summary);
      }

      // 4. Save Assistant Response with Evidence Graph
      const assistantMessage = investigationStore.addMessage(id, {
        sender: 'assistant',
        content: evidenceGraph.answer_markdown,
        evidence_graph: evidenceGraph,
        execution_trace: evidenceGraph.execution_trace,
      });

      telemetryBroadcaster.broadcast({
        type: 'EXECUTION_COMPLETE',
        investigationId: id,
        data: {
          aggregateConfidence: evidenceGraph.aggregate_confidence,
          claimsCount: evidenceGraph.claims.length,
        },
        timestamp: new Date().toISOString(),
      });

      res.json({ message: assistantMessage, evidence_graph: evidenceGraph });
    } catch (err) {
      telemetryBroadcaster.broadcast({
        type: 'ERROR',
        investigationId: id,
        data: { error: String(err) },
        timestamp: new Date().toISOString(),
      });

      const errMessage = investigationStore.addMessage(id, {
        sender: 'assistant',
        content: `**Investigation Notice:** Analysis encountered an issue: ${err instanceof Error ? err.message : String(err)}. Please verify that raster images are uploaded and compatible.`,
      });

      res.status(500).json({ message: errMessage, error: String(err) });
    }
  }

  static getReport(req: Request, res: Response) {
    const { id } = req.params;
    const format = (req.query.format as string) || 'markdown';

    const inv = investigationStore.getById(id);
    if (!inv) {
      return res.status(404).json({ error: `Investigation ${id} not found` });
    }

    if (format === 'json') {
      return res.json(inv);
    } else if (format === 'geojson') {
      const geojson = ReportGenerator.generateGeoJSON(inv);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${id}_evidence.geojson"`);
      return res.send(JSON.stringify(geojson, null, 2));
    } else {
      const md = ReportGenerator.generateMarkdownReport(inv);
      res.setHeader('Content-Type', 'text/markdown');
      return res.send(md);
    }
  }
}
