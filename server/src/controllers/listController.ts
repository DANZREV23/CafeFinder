import { Request, Response, NextFunction } from 'express';
import { CuratedListService } from '../services/listService.js';
import { z } from 'zod';

const getListsQuerySchema = z.object({
  featured: z.string().optional().transform((v) => v === 'true'),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : undefined)),
});

export class CuratedListController {
  private listService: CuratedListService;

  constructor() {
    this.listService = new CuratedListService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getListsQuerySchema.parse(req.query);
      const data = await this.listService.getLists(validatedQuery);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const data = await this.listService.getListBySlug(slug);
      
      if (!data) {
        return res.status(404).json({
          success: false,
          error: { message: 'List not found' }
        });
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };
}
