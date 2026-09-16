import { Request, Response, NextFunction } from 'express';
import { TestimonialService } from '../services/testimonialService.js';
import { z } from 'zod';

const emptyToUndefined = (val: any) => (val === '' ? undefined : val);

const getTestimonialsQuerySchema = z.object({
  limit: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => (v ? parseInt(v) : undefined))),
});

export class TestimonialController {
  private testimonialService: TestimonialService;

  constructor() {
    this.testimonialService = new TestimonialService();
  }

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = getTestimonialsQuerySchema.parse(req.query);
      const data = await this.testimonialService.getActiveTestimonials(validatedQuery.limit);
      
      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  };
}
