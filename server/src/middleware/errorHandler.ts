import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || 500;
  const errorCode = err.code || (status === 400 ? 'VALIDATION_ERROR' : 
                    status === 401 ? 'UNAUTHORIZED' : 
                    status === 403 ? 'FORBIDDEN' : 
                    status === 404 ? 'NOT_FOUND' : 
                    status === 409 ? 'CONFLICT' : 
                    status === 429 ? 'RATE_LIMITED' : 'INTERNAL_SERVER_ERROR');

  const logData = {
    requestId: req.id,
    userId: (req as any).user?.id,
    route: req.originalUrl,
    method: req.method,
    event: 'error.internal',
    errorCode,
    status
  };

  logger.error(err.message || 'Error caught by handler', err, logData);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.issues,
        requestId: req.id
      },
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { 
        code: 'CONFLICT',
        message: 'A record with this unique value already exists',
        requestId: req.id
      },
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      error: { 
        code: 'VALIDATION_ERROR',
        message: 'A related record is required or missing',
        requestId: req.id
      },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { 
        code: 'NOT_FOUND',
        message: 'Record not found',
        requestId: req.id
      },
    });
  }

  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: { 
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        dbCode: err.code,
        requestId: req.id,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
    });
  }

  // Handle Prisma Connection Errors
  if (err.message && (err.message.includes('Can\'t reach database server') || err.message.includes('connection due to administrator command'))) {
    return res.status(503).json({
      success: false,
      error: { 
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database service temporarily unavailable',
        requestId: req.id
      },
    });
  }

  // Generic internal error
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: { 
      code: errorCode,
      message,
      requestId: req.id
    },
  });
}
