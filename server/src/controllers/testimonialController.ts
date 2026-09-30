import { Request, Response, NextFunction } from 'express';
import { TestimonialService } from '../services/testimonialService.js';
import { z } from 'zod';
import { TestimonialStatus } from '@prisma/client';

const emptyToUndefined = (val: any) => (val === '' ? undefined : val);

const getTestimonialsQuerySchema = z.object({
  limit: z.preprocess(emptyToUndefined, z.string().optional().transform((v) => (v ? parseInt(v) : undefined))),
});

const testimonialSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.preprocess(emptyToUndefined, z.string().max(100).optional().nullable()),
  avatarUrl: z.preprocess(emptyToUndefined, z.string().optional().nullable()),
  content: z.string().min(1, 'Content is required'),
  rating: z.preprocess((val) => (val !== undefined && val !== null ? parseInt(String(val), 10) : 5), z.number().int().min(1).max(5)),
  status: z.preprocess(emptyToUndefined, z.nativeEnum(TestimonialStatus).optional().default(TestimonialStatus.PUBLISHED)),
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
      const validated = testimonialSchema.parse(req.body);
      const data = await this.testimonialService.createTestimonial(validated);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = testimonialSchema.partial().parse(req.body);
      const data = await this.testimonialService.updateTestimonial(req.params.id, validated);
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