import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { COOKIE_NAME, getCookieOptions } from '../utils/auth.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { emailService } from '../services/email/email.service.js';

const authService = new AuthService();

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const { user, token } = await authService.register(validatedData);

      res.cookie(COOKIE_NAME, token, getCookieOptions());
      
      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail({
        id: user.id,
        name: user.name,
        email: user.email,
      }).catch(err => console.error('[AuthController]: Failed to send welcome email:', err));

      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, token } = await authService.login(validatedData);

      res.cookie(COOKIE_NAME, token, getCookieOptions());

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies[COOKIE_NAME];
      if (token) {
        await authService.logout(token);
      }
      
      res.clearCookie(COOKIE_NAME, getCookieOptions());
      
      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Not authenticated' },
        });
      }

      res.json({
        success: true,
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  }
}
