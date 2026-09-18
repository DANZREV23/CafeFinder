import { CookieOptions } from 'express';
import crypto from 'crypto';

export const COOKIE_NAME = 'cafefinder_session';

export const getCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  const isAistudio = process.env.APPLICATION_ID !== undefined; // Detect if running in AI Studio

  return {
    httpOnly: true,
    // Enable secure cookies only in production OR when explicitly using HTTPS.
    // For local IP or tailscale (usually HTTP), this must be false.
    secure: isProd || isAistudio, 
    // sameSite 'none' requires 'secure: true'. 
    // For local HTTP, 'lax' is better.
    sameSite: (isProd || isAistudio) ? 'none' : 'lax',
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
