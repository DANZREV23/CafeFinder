import { Request, Response, NextFunction } from 'express';
import { CafeService } from '../services/cafeService.js';
import { z } from 'zod';

// Validation Schemas
export const getCafesQuerySchema = z.object({
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(parseInt(v), 50) : 12)),
  search: z.string().optional(),
  city: z.string().optional(),
  priceRange: z.string().optional().transform((v) => (v ? parseInt(v) : undefined)),
  featured: z.string().optional().transform((v) => v === 'true'),
  trending: z.string().optional().transform((v) => v === 'true'),
  verified: z.string().optional().transform((v) => v === 'true'),
  sort: z.enum(['rating', 'latest', 'name', 'popular']).optional(),
});

export class CafeController {
  private cafeService: CafeService;

  constructor() {
    this.cafeService = new CafeService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getCafesQuerySchema.parse(req.query);
      const result = await this.cafeService.getPublishedCafes(validatedQuery);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const cafe = await this.cafeService.getCafeBySlug(slug);
      
      if (!cafe) {
        return res.status(404).json({
          success: false,
          error: { message: 'Cafe not found' }
        });
      }

      res.json({
        success: true,
        data: cafe
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
