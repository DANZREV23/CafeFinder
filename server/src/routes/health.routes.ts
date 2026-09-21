import { Router } from 'express';
import { prisma } from '../config/database.js';
import { operationalService } from '../services/operationalService.js';

const router = Router();

// Liveness: Process is alive
router.get('/live', (req, res) => {
  res.status(200).json({ success: true, status: 'alive' });
});

// Readiness: App is ready to handle requests
router.get('/ready', async (req, res) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, status: 'ready' });
  } catch (error) {
    res.status(503).json({ success: false, status: 'not-ready', reason: 'Database unavailable' });
  }
});

// Health: Detailed health info
router.get('/', async (req, res) => {
  try {
    const status = await operationalService.getStatus();
    
    const isHealthy = status.database.status === 'connected';
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'ok' : 'degraded',
        database: status.database.status,
        timestamp: new Date().toISOString(),
        version: status.application.version,
        uptime: status.application.uptime
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: {
        status: 'error',
        error: error.message || 'Health check failed'
      }
    });
  }
});

export default router;
