import { Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { z } from 'zod';

import { userDataExportService } from '../services/userDataExportService.js';

const userService = new UserService();

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export class UserController {
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Not authenticated' },
        });
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const user = await userService.updateProfile(req.user.id, validatedData);

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadAvatar(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { message: 'Not authenticated' },
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' },
        });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await userService.updateProfile(req.user.id, { avatarUrl });

      res.json({
        success: true,
        data: { user, avatarUrl },
      });
    } catch (error) {
      next(error);
    }
  }

  async exportUserData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      }

      const data = await userDataExportService.exportUserData(req.user.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deactivateAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
      }

      await userService.updateStatus(req.user.id, 'INACTIVE');
      res.json({ success: true, message: 'Account deactivated' });
    } catch (error) {
      next(error);
    }
  }
}
