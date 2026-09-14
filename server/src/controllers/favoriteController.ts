import { Request, Response, NextFunction } from 'express';
import { FavoriteService } from '../services/favoriteService.js';
import { z } from 'zod';
import { mapToFavoriteDto } from '../dtos/favoriteDto.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getFavoritesQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(parseInt(v), 50) : 12)),
  search: z.string().optional(),
  city: z.string().optional(),
  priceRange: z.string().optional().transform((v) => (v ? parseInt(v) : undefined)),
  minRating: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
  amenities: z.string().optional().transform((v) => (v ? v.split(',') : undefined)),
  sort: z.enum(['recently_saved', 'rating', 'name_asc', 'name_desc']).optional(),
});

export class FavoriteController {
  private favoriteService = new FavoriteService();

  toggle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user!.id;
      
      const result = await this.favoriteService.toggleFavorite(userId, cafeId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.json({
          success: true,
          data: { isFavorite: false }
        });
      }

      const result = await this.favoriteService.getFavoriteStatus(userId, cafeId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getMyFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const validatedQuery = getFavoritesQuerySchema.parse(req.query);
      
      const result = await this.favoriteService.getUserFavorites({
        ...validatedQuery,
        userId,
      });
      
      res.json({
        success: true,
        data: result.data.map(mapToFavoriteDto),
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  add = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user!.id;
      
      const result = await this.favoriteService.addFavorite(userId, cafeId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user!.id;
      
      const result = await this.favoriteService.removeFavorite(userId, cafeId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
