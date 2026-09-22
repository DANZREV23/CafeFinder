import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { COOKIE_NAME, extractToken, getCookieOptions } from '../utils/auth.js';
import { Role } from '@prisma/client';

const authService = new AuthService();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl: string | null;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' },
    });
  }

  try {
    const user = await authService.validateSession(token);

    if (!user) {
      res.clearCookie(COOKIE_NAME, getCookieOptions());
      return res.status(401).json({
        success: false,
        error: { message: 'Session expired or invalid' },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const user = await authService.validateSession(token);
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token is invalid, we just treat it as no user
    next();
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'You do not have permission to access this resource' },
      });
    }

    next();
  };
};
