import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { userPreferenceService } from '../services/userPreferenceService.js';

export class UserPreferenceController {
  getPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const preference = await userPreferenceService.get(req.user!.id);
      res.json({ success: true, data: preference });
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const preference = await userPreferenceService.update(req.user!.id, req.body || {});
      res.json({ success: true, data: preference });
    } catch (error) {
      next(error);
    }
  };

  resetPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await userPreferenceService.reset(req.user!.id);
      res.json({ success: true, data: null });
    } catch (error) {
      next(error);
    }
  };
}
