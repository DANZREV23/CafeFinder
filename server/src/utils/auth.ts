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
