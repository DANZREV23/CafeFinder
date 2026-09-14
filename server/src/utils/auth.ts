import { CookieOptions } from 'express';
import crypto from 'crypto';

export const COOKIE_NAME = 'cafefinder_session';

export const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
