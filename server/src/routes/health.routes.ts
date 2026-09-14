import { Router } from 'express';
import { prisma } from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check database connection with a timeout
    const dbCheck = await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
    ]);
    
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('[HealthCheck]: Database connection error:', error.message || error);
    
    res.status(503).json({
      success: false,
      data: {
        status: 'error',
        database: 'disconnected',
        error: process.env.NODE_ENV === 'production' ? 'Database connection failed' : error.message || error,
        code: error.code || 'UNKNOWN'
      }
    });
  }
});

export default router;
