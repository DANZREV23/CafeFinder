import { Request, Response, NextFunction } from 'express';
import { BlogPostService } from '../services/blogService.js';
import { z } from 'zod';

const emptyToUndefined = (val: any) => (val === '' ? undefined : val);

const getBlogQuerySchema = z.object({
  limit: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => (v ? parseInt(v) : 3))),
});

export class BlogPostController {
  private blogService: BlogPostService;

  constructor() {
    this.blogService = new BlogPostService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getBlogQuerySchema.parse(req.query);
      const data = await this.blogService.getPublishedPosts(validatedQuery.limit);
      
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
      const data = await this.blogService.getPostBySlug(slug);
      
      if (!data) {
        return res.status(404).json({
          success: false,
          error: { message: 'Blog post not found' }
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
