import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { RecommendationService } from '../services/recommendationService.js';

export class RecommendationController {
  private service = new RecommendationService();

  getRecommendations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 6;
      const items = await this.service.getRecommendations({
        userId: req.user?.id,
        limit,
        context: (req.query.context as 'home' | 'dashboard' | 'explore' | 'profile') || 'home',
        excludeCafeId: req.query.excludeCafeId as string | undefined,
        cafeId: req.query.cafeId as string | undefined,
        city: req.query.city as string | undefined,
        amenity: req.query.amenity as string | undefined,
      });
      res.json({ success: true, data: { items } });
    } catch (error) {
      next(error);
    }
  };

  getDiagnostics = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      res.json({ success: true, data: this.service.getDiagnostics() });
    } catch (error) {
      next(error);
    }
  };
}
