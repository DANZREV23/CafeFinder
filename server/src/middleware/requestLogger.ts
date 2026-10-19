import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      startTime?: number;
    }
  }
}

export function requestCorrelation(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  req.startTime = Date.now();
  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    const duration = req.startTime ? Date.now() - req.startTime : 0;
    if (res.statusCode >= 400) {
      logger.warn(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms) [${req.id || '-'}]`);
    } else {
      logger.info(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms) [${req.id || '-'}]`);
    }
  });
  next();
}
