// server/src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
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
  // They will still be logged in DEBUG
  const isHealthCheck = req.path.startsWith('/api/health') || 
                        req.path.startsWith('/api/ready') || 
                        req.path.startsWith('/api/live');

  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    
    const logData = {
      requestId: req.id,
      userId: (req as any).user?.id,
      method: req.method,
      route: req.originalUrl,
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
