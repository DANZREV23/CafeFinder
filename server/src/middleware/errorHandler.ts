import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.issues,
      },
    });
  }

  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: { message: 'Conflict: A record with this unique value already exists' },
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { message: 'Record not found' },
    });
  }

  // Handle Prisma Connection Errors
  if (err.message && (err.message.includes('Can\'t reach database server') || err.message.includes('connection due to administrator command'))) {
    return res.status(503).json({
      success: false,
      error: { message: 'Database service temporarily unavailable. Please try again in a moment.' },
    });
  }

  // Generic internal error
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    error: { message },
  });
}
