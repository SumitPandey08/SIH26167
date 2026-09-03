/**
 * SatQuery AI — Primary Node.js / TypeScript Server Entrypoint
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { telemetryBroadcaster } from './websockets/telemetryServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const storagePath = path.resolve(__dirname, '../../storage');

// Initialize WebSockets
telemetryBroadcaster.initialize(server);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static storage (uploads, masks, previews, reports)
app.use('/storage', express.static(storagePath));

// Mount REST API
app.use('/api', apiRoutes);

// Root Information
app.get('/', (req, res) => {
  res.json({
    service: 'SatQuery AI Primary Backend Gateway',
    version: '1.0.0',
    spec: 'SIH26167 Remote Sensing Vision-Language Assistant',
    endpoints: {
      health: '/api/system/health',
      investigations: '/api/investigations',
      telemetry_ws: '/ws/telemetry',
      storage: '/storage',
    },
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SatQuery AI Node.js Backend listening on port ${PORT}`);
  console.log(`📡 WebSocket Telemetry active on ws://localhost:${PORT}/ws/telemetry`);
  console.log(`💾 Storage path mounted at: ${storagePath}`);
  console.log(`====================================================`);
});
