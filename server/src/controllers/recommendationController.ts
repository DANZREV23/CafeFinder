import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { RecommendationService } from '../services/recommendationService.js';
import { mapToPublicCafeSummary } from '../dtos/cafeDto.js';

export class RecommendationController {
  private service = new RecommendationService();

  getRecommendations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 6;
      const recommendations = await this.service.getRecommendations(userId, limit);
      res.json({ success: true, data: recommendations.map(mapToPublicCafeSummary) });
    } catch (error) {
      next(error);
    }
  };
}
