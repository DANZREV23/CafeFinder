// server/src/middleware/maintenanceMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { operationalService } from '../services/operationalService.js';

export function maintenanceMiddleware(req: Request, res: Response, next: NextFunction) {
  // Always allow health checks even in maintenance mode
  if (req.path.startsWith('/api/health') || 
      req.path.startsWith('/api/ready') || 
      req.path.startsWith('/api/live')) {
    return next();
  }

  // Always allow admin routes to disable maintenance mode
  // The route is protected by requireAuth and requireRole('ADMIN') anyway
  if (req.path.startsWith('/api/admin/auth') || 
      req.path.startsWith('/api/admin/system')) {
    return next();
  }

  if (operationalService.isMaintenanceMode()) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'MAINTENANCE_MODE',
        message: 'The system is currently undergoing maintenance. Please try again later.',
        requestId: req.id
      }
    });
  }

  next();
}
