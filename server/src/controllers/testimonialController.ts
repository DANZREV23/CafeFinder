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

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.testimonialService.getAllTestimonials();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.testimonialService.getTestimonialById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: 'Testimonial not found' });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.testimonialService.createTestimonial(req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.testimonialService.updateTestimonial(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.testimonialService.deleteTestimonial(req.params.id);
      res.json({ success: true, message: 'Testimonial deleted' });
    } catch (error) {
      next(error);
    }
  };
}
