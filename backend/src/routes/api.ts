/**
 * SatQuery AI — Primary Express API Router
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { InvestigationController } from '../controllers/investigationController.js';
import { pythonClient } from '../services/pythonClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Configure storage directory for uploads
const storageDir = path.resolve(__dirname, '../../../storage/uploads');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname) || '.tif';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit for satellite scenes
});

// System Health
router.get('/system/health', async (req, res) => {
  try {
    const pyHealth = await pythonClient.checkHealth();
    res.json({
      node_status: 'online',
      python_service: pyHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      node_status: 'online',
      python_service: { status: 'offline', error: String(err) },
      timestamp: new Date().toISOString(),
    });
  }
});

// Investigations
router.get('/investigations', InvestigationController.getAll);
router.post('/investigations', InvestigationController.create);
router.get('/investigations/:id', InvestigationController.getById);
router.post('/investigations/:id/upload', upload.single('image'), InvestigationController.uploadImage);
router.post('/investigations/:id/query', InvestigationController.askQuery);
router.post('/investigations/:id/execute', InvestigationController.askQuery);
router.get('/investigations/:id/trace', InvestigationController.getTrace);
router.get('/investigations/:id/evidence', InvestigationController.getEvidence);
router.get('/investigations/:id/report', InvestigationController.getReport);

export default router;
