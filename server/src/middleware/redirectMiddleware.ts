import { Request, Response, NextFunction } from 'express';
import { RedirectService } from '../services/redirectService.js';

const redirectService = new RedirectService();

export async function redirectMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only handle GET requests for redirects
  if (req.method !== 'GET') {
    return next();
  }

  // Skip API and Uploads
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }

  try {
    const redirect = await redirectService.getRedirect(req.path);
    if (redirect) {
      return res.redirect(redirect.statusCode, redirect.newPath);
    }
  } catch (error) {
    // Fail silently and proceed to next middleware if redirect check fails
    console.error('[RedirectMiddleware]: Error checking for redirect:', error);
  }

  next();
}
