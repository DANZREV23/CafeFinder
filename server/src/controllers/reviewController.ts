import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/reviewService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { z } from 'zod';
import { mapToReviewDto } from '../dtos/reviewDto.js';
import { ReviewStatus } from '@prisma/client';

const reviewSchema = z.object({
  coffeeRating: z.number().int().min(1).max(5),
  ambianceRating: z.number().int().min(1).max(5),
  serviceRating: z.number().int().min(1).max(5),
  overallRating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(2000),
});

const updateReviewStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN']),
});

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  getCafeReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const parsedPage = req.query.page ? parseInt(req.query.page as string) : 1;
      const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
      const parsedLimit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 100);

      const result = await this.reviewService.getCafeReviews(cafeId, { page, limit });

      res.json({
        success: true,
        data: result.data.map(mapToReviewDto),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getCafeRatingStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const stats = await this.reviewService.getCafeRatingStats(cafeId);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserReviewForCafe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.json({ success: true, data: null });
      }

      const review = await this.reviewService.getUserReviewForCafe(userId, cafeId);
      res.json({
        success: true,
        data: review ? mapToReviewDto(review) : null,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const parsedPage = req.query.page ? parseInt(req.query.page as string) : 1;
      const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
      const parsedLimit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 50);
      const sort = (req.query.sort as string) || 'newest';

      const filters: any = {
        userId,
        page,
        limit,
      };

      if (sort === 'oldest') filters.orderBy = { createdAt: 'asc' };
      if (sort === 'highest-rated') filters.orderBy = { overallRating: 'desc' };
      if (sort === 'lowest-rated') filters.orderBy = { overallRating: 'asc' };

      const result = await this.reviewService.getCafeReviews(undefined as any, filters);
      
      res.json({
        success: true,
        data: result.data.map(mapToReviewDto),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user!.id;
      const validatedData = reviewSchema.parse(req.body);

      const review = await this.reviewService.createReview(userId, cafeId, validatedData);

      res.status(201).json({
        success: true,
        data: mapToReviewDto(review),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const validatedData = reviewSchema.parse(req.body);

      const review = await this.reviewService.updateReview(userId, id, validatedData);

      res.json({
        success: true,
        data: mapToReviewDto(review),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      await this.reviewService.deleteReview(userId, id, isAdmin);

      res.json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = updateReviewStatusSchema.parse(req.body);

      const review = await this.reviewService.updateReviewStatus(id, status as ReviewStatus);

      res.json({
        success: true,
        data: mapToReviewDto(review),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  uploadPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      }

      // Generate a public URL for the photo
      // For now, we'll use a relative path that will be served by express.static
      const photoUrl = `/uploads/reviews/${req.file.filename}`;

      const photo = await this.reviewService.addReviewPhoto(userId, id, photoUrl);

      res.json({
        success: true,
        data: photo,
      });
    } catch (error) {
      next(error);
    }
  };

  deletePhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, photoId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      await this.reviewService.deleteReviewPhoto(userId, photoId, isAdmin);

      res.json({
        success: true,
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
