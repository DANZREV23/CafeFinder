// server/src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

import { metricsService } from '../services/metricsService.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

/**
 * Normalizes routes for metrics grouping.
 * Replaces dynamic segments like IDs and slugs with placeholders.
 */
function normalizeRoute(path: string): string {
  // Replace cuid and uuid patterns
  let normalized = path.replace(/[a-z0-9]{24,36}/g, ':id');
  
  // Replace common slug patterns (more than 3 characters with hyphens/numbers)
  // This is a heuristic and might need refinement based on actual routes
  normalized = normalized.split('/').map(segment => {
    if (segment.includes('-') && segment.length > 5) return ':slug';
    return segment;
  }).join('/');

  // Special cases for known dynamic routes
  if (normalized.startsWith('/api/cafes/') && normalized.split('/').length === 4) {
    return '/api/cafes/:slug';
  }
  if (normalized.startsWith('/api/blog/') && normalized.split('/').length === 4) {
    return '/api/blog/:slug';
  }
  if (normalized.startsWith('/api/lists/') && normalized.split('/').length === 4) {
    return '/api/lists/:slug';
  }

  return normalized;
}

export function requestCorrelation(req: Request, res: Response, next: NextFunction) {
  req.id = uuidv4();
  req.startTime = Date.now();
  
  // Set response header
  res.setHeader('X-Request-ID', req.id);
  
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Don't log health/ready/live endpoints in INFO level to keep logs clean
  const isHealthCheck = req.path.startsWith('/api/health') || 
                        req.path.startsWith('/api/ready') || 
                        req.path.startsWith('/api/live');

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    const normalizedRoute = normalizeRoute(req.path);
    
    // Record metrics
    metricsService.recordRequest(normalizedRoute, statusCode, duration, req.id, req.method);

    const logData = {
      requestId: req.id,
      userId: (req as any).user?.id,
      role: (req as any).user?.role,
      method: req.method,
      route: req.originalUrl,
      normalizedRoute,
      statusCode,
      durationMs: duration,
      event: 'http.request'
    };

    const message = `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`;

    if (isHealthCheck) {
      logger.debug(message, logData);
    } else if (statusCode >= 500) {
      logger.error(message, null, logData);
    } else if (statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }
  });

  next();
}
