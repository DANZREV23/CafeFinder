import { Request, Response, NextFunction } from 'express';
import { RedirectService } from '../services/redirectService.js';

const redirectService = new RedirectService();

const STATIC_EXTENSION_REGEX = /\.[a-zA-Z0-9]+$/;

export async function redirectMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only handle GET requests for redirects
  if (req.method !== 'GET') {
    return next();
  }

  // Skip API, Uploads, Vite internal/module paths, and static assets with file extensions
  const p = req.path;
  if (
    p === '/' ||
    p.startsWith('/api') ||
    p.startsWith('/uploads') ||
    p.startsWith('/src/') ||
    p.startsWith('/node_modules/') ||
    p.startsWith('/@') ||
    p.startsWith('/assets/') ||
    p.startsWith('/.well-known') ||
    STATIC_EXTENSION_REGEX.test(p)
  ) {
    return next();
  }

  try {
    const redirect = await redirectService.getRedirect(p);
    if (redirect) {
      return res.redirect(redirect.statusCode, redirect.newPath);
    }
  } catch (error) {
    // Fail silently and proceed to next middleware if redirect check fails
    console.error('[RedirectMiddleware]: Error checking for redirect:', error);
  }

  next();
}
