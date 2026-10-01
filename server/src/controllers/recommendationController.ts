import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { recommendationService } from '../services/recommendationService.js';

export class RecommendationController {
  getRecommendations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || null;
      const limit = Math.min(24, Math.max(1, parseInt(req.query.limit as string) || 6));
      const city = req.query.city as string | undefined;

      const recommendations = await recommendationService.getRecommendations(userId, limit, city);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      next(error);
    }
  };

  getSimilarCafes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idOrSlug } = req.params;
      const limit = Math.min(12, Math.max(1, parseInt(req.query.limit as string) || 4));
      const currentUserId = (req as AuthRequest).user?.id;

      const similarCafes = await recommendationService.getSimilarCafes(idOrSlug, limit, currentUserId);
      res.json({ success: true, data: similarCafes });
    } catch (error) {
      next(error);
    }
  };

  getDiagnostics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const sampleUserId = req.query.userId as string | undefined;
      const diagnostics = await recommendationService.getAdminDiagnostics(sampleUserId);
      res.json({ success: true, data: diagnostics });
    } catch (error) {
      next(error);
    }
  };
}
