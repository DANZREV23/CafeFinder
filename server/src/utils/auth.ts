import { CookieOptions } from 'express';
import crypto from 'crypto';

export const COOKIE_NAME = 'cafefinder_session';

export const getCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  // APPLICATION_ID or any common AI Studio env var can be used for detection
  const isAistudio = true; // Default to true as we are running in the platform

  return {
    httpOnly: true,
    // Enable secure cookies in production OR AI Studio environment.
    // AI Studio uses HTTPS for its preview URLs.
    secure: true, 
    // sameSite 'none' is essential for cookies to be sent from the AI Studio iframe.
    // sameSite 'none' REQUIRES 'secure: true'.
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const extractToken = (req: any): string | null => {
  if (!req) return null;

  // 1. Check standard Authorization header (Bearer <token> or direct token)
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      return trimmed.substring(7).trim();
    }
    if (!trimmed.includes(' ')) {
      return trimmed;
    }
  }

  // 2. Check custom x-auth-token header
  const customHeader = req.headers?.['x-auth-token'];
  if (customHeader && typeof customHeader === 'string') {
    return customHeader.trim();
  }

  // 3. Check cookies
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }

  // 4. Check query string token parameter (safe fallback)
  if (req.query && typeof req.query.token === 'string') {
    return req.query.token.trim();
  }

  return null;
};
