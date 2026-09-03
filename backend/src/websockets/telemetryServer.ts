/**
 * SatQuery AI — Real-time WebSocket Telemetry Broadcaster
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface TelemetryMessage {
  type: 'STEP_START' | 'STEP_COMPLETE' | 'EXECUTION_COMPLETE' | 'ERROR';
  investigationId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export class TelemetryBroadcaster {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/telemetry' });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      ws.send(JSON.stringify({
        type: 'CONNECTED',
        message: 'Connected to SatQuery AI Telemetry Stream',
        timestamp: new Date().toISOString(),
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  broadcast(message: TelemetryMessage) {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  broadcastStep(investigationId: string, stepNumber: number, toolName: string, status: string, details?: string) {
    this.broadcast({
      type: status === 'RUNNING' ? 'STEP_START' : 'STEP_COMPLETE',
      investigationId,
      data: { stepNumber, toolName, status, details },
      timestamp: new Date().toISOString(),
    });
  }
}

export const telemetryBroadcaster = new TelemetryBroadcaster();
