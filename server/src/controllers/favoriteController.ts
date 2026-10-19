import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { FavoriteService } from '../services/favoriteService.js';
import { mapToFavoriteDto } from '../dtos/favoriteDto.js';

export class FavoriteController {
  private service = new FavoriteService();

  getMyFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;

      const result = await this.service.getUserFavorites({ userId, page, limit });
      res.json({
        success: true,
        data: result.data.map(mapToFavoriteDto),
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      if (!req.user) {
        return res.json({ success: true, isFavorite: false, data: { isFavorite: false } });
      }
      const status = await this.service.getFavoriteStatus(req.user.id, cafeId);
      res.json({ success: true, data: status, ...status });
    } catch (error) {
      next(error);
    }
  };

  toggle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      const result = await this.service.toggleFavorite(req.user!.id, cafeId);
      res.json({ success: true, data: result, ...result });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeId = req.params.cafeId || req.params.id;
      const result = await this.service.removeFavorite(req.user!.id, cafeId);
      res.json({ success: true, data: result, ...result });
    } catch (error) {
      next(error);
    }
  };
}
