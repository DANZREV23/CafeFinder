import { Request, Response, NextFunction } from 'express';
import { CafeService } from '../services/cafeService.js';
import { z } from 'zod';
import { mapToPublicCafeProfile, mapToPublicCafeSummary } from '../dtos/cafeDto.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const emptyToUndefined = (val: any) => (val === '' || val === null ? undefined : val);

// Validation Schemas
export const getCafesQuerySchema = z.object({
  page: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  })),
  limit: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : 12;
    return isNaN(parsed) || parsed < 1 ? 12 : Math.min(parsed, 50);
  })),
  search: z.preprocess(emptyToUndefined, z.string().optional()),
  city: z.preprocess(emptyToUndefined, z.string().optional()),
  priceRange: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => {
    const parsed = v ? parseInt(v) : undefined;
    return parsed === undefined || isNaN(parsed) ? undefined : parsed;
  })),
  featured: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => v === undefined ? undefined : v === 'true')),
  trending: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => v === undefined ? undefined : v === 'true')),
  verified: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => v === undefined ? undefined : v === 'true')),
  amenities: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => v ? v.split(',') : undefined)),
  sort: z.preprocess(emptyToUndefined, z.enum(['rating', 'latest', 'name', 'popular']).optional()),
});

export class CafeController {
  private cafeService: CafeService;

  constructor() {
    this.cafeService = new CafeService();
  }

  getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getCafesQuerySchema.parse(req.query);
      const result = await this.cafeService.getPublishedCafes({
        ...validatedQuery,
        currentUserId: req.user?.id
      });
      
      res.json({
        success: true,
        data: result.data.map(mapToPublicCafeSummary),
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const cafe = await this.cafeService.getCafeBySlug(slug, req.user?.id);
      
      if (!cafe) {
        return res.status(404).json({
          success: false,
          error: { message: 'Cafe not found' }
        });
      }

      res.json({
        success: true,
        data: mapToPublicCafeProfile(cafe)
      });
    } catch (error) {
      next(error);
    }
  };

  // Stubs for mutations (requires auth in later stages)
  create = async (req: Request, res: Response) => {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  };

  update = async (req: Request, res: Response) => {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  };

  delete = async (req: Request, res: Response) => {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  };
}
