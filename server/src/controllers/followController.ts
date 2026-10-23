import { Response } from 'express';
import { FollowService } from '../services/followService.js';
import { z } from 'zod';
import { AuthRequest } from '../middleware/authMiddleware.js';

const preferencesSchema = z.object({
  eventsEnabled: z.boolean().optional(),
  specialsEnabled: z.boolean().optional(),
  announcementsEnabled: z.boolean().optional(),
  menuUpdatesEnabled: z.boolean().optional(),
});

export class FollowController {
  private followService = new FollowService();

  follow = async (req: AuthRequest, res: Response) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      const userId = req.user!.id;
      const follow = await this.followService.followCafe(userId, cafeId);
      res.json({ success: true, data: follow });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  };

  unfollow = async (req: AuthRequest, res: Response) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      const userId = req.user!.id;
      const result = await this.followService.unfollowCafe(userId, cafeId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  };

  getStatus = async (req: AuthRequest, res: Response) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.json({ success: true, data: { isFollowing: false, preferences: null } });
      }

      const status = await this.followService.getFollowStatus(userId, cafeId);
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  };

  updatePreferences = async (req: AuthRequest, res: Response) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      const userId = req.user!.id;
      const preferences = preferencesSchema.parse(req.body);
      
      const updated = await this.followService.updatePreferences(userId, cafeId, preferences);
      res.json({ success: true, data: updated });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, errors: error.issues });
      }
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  };

  getMyFollowing = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;

      const result = await this.followService.getUserFollowing({ userId, page, limit });
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(error.status || 500).json({ success: false, message: error.message });
    }
  };
}
