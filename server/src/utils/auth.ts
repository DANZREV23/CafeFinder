import { CookieOptions } from 'express';
import crypto from 'crypto';

export const COOKIE_NAME = 'cafefinder_session';

export const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  // In many dev environments (like AI Studio preview), the app is accessed via HTTPS
  // but the internal server runs on HTTP. trust-proxy handles this.
  // We should allow secure cookies if we are on HTTPS.
  secure: true, 
  sameSite: 'none', // Required for many iframe scenarios
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
