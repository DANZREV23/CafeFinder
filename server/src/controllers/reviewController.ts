import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/reviewService.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { z } from 'zod';
import { mapToReviewDto, ReviewReportDto } from '../dtos/reviewDto.js';
import { ReviewStatus, ReviewReportReason } from '@prisma/client';

const reviewSchema = z.object({
  coffeeRating: z.number().int().min(1).max(5).optional(),
  ambianceRating: z.number().int().min(1).max(5).optional(),
  serviceRating: z.number().int().min(1).max(5).optional(),
  overallRating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(2000),
});

const updateReviewStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'REMOVED']),
  moderationNotes: z.string().max(1000).optional(),
});

const reportReviewSchema = z.object({
  reason: z.enum(['SPAM', 'HARASSMENT', 'OFFENSIVE_CONTENT', 'FALSE_INFORMATION', 'DUPLICATE', 'IRRELEVANT', 'OTHER']),
  description: z.string().max(1000).optional(),
});

const resolveReportSchema = z.object({
  actionTaken: z.enum(['DISMISS', 'HIDE_REVIEW', 'REMOVE_REVIEW', 'RESTORE_REVIEW']),
  resolutionNotes: z.string().max(1000).optional(),
});

const ownerResponseSchema = z.object({
  content: z.string().trim().min(5).max(1500),
});

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  getCafeReviews = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const parsedPage = req.query.page ? parseInt(req.query.page as string) : 1;
      const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
      const parsedLimit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 100);

      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      const hasPhotos = req.query.hasPhotos === 'true';
      const search = req.query.search ? String(req.query.search) : undefined;
      const sort = req.query.sort as 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful' | undefined;
      const currentUserId = req.user?.id || null;

      const result = await this.reviewService.getCafeReviews(cafeId, {
        page,
        limit,
        rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
        hasPhotos: hasPhotos || undefined,
        search,
        sort,
        currentUserId,
      });

      res.json({
        success: true,
        data: result.data.map(r => mapToReviewDto(r, currentUserId)),
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
        data: review ? mapToReviewDto(review, userId) : null,
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

      let sortKey: 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful' = 'newest';
      if (sort === 'oldest') sortKey = 'oldest';
      if (sort === 'highest-rated' || sort === 'highest') sortKey = 'highest';
      if (sort === 'lowest-rated' || sort === 'lowest') sortKey = 'lowest';
      if (sort === 'most_helpful') sortKey = 'most_helpful';

      const result = await this.reviewService.getCafeReviews(undefined as any, {
        userId,
        page,
        limit,
        sort: sortKey,
        currentUserId: userId,
      });

      res.json({
        success: true,
        data: result.data.map(r => mapToReviewDto(r, userId)),
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

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const userId = req.user!.id;
      const validatedData = reviewSchema.parse(req.body);

      const review = await this.reviewService.createReview(userId, cafeId, validatedData);

      res.status(201).json({
        success: true,
        data: mapToReviewDto(review, userId),
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
        data: mapToReviewDto(review, userId),
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

  // --- Helpful Reaction ---
  toggleHelpful = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const result = await this.reviewService.toggleHelpfulReaction(userId, id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Review Reporting ---
  report = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { reason, description } = reportReviewSchema.parse(req.body);

      const report = await this.reviewService.reportReview(
        userId,
        id,
        reason as ReviewReportReason,
        description
      );

      res.status(201).json({
        success: true,
        message: 'Review report submitted successfully for moderation.',
        data: { id: report.id },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  // --- Owner Responses ---
  createResponse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { content } = ownerResponseSchema.parse(req.body);

      const response = await this.reviewService.createOwnerResponse(userId, id, content);

      res.status(201).json({
        success: true,
        data: response,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  updateResponse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { responseId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';
      const { content } = ownerResponseSchema.parse(req.body);

      const response = await this.reviewService.updateOwnerResponse(userId, responseId, content, isAdmin);

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  deleteResponse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { responseId } = req.params;
      const userId = req.user!.id;
      const isAdmin = req.user!.role === 'ADMIN';

      await this.reviewService.deleteOwnerResponse(userId, responseId, isAdmin);

      res.json({
        success: true,
        message: 'Owner response removed',
      });
    } catch (error) {
      next(error);
    }
  };

  // --- Visitor Photos Gallery ---
  getVisitorPhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cafeId } = req.params;
      const parsedPage = req.query.page ? parseInt(req.query.page as string) : 1;
      const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
      const parsedLimit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 50);

      const result = await this.reviewService.getVisitorPhotos(cafeId, page, limit);

      res.json({
        success: true,
        data: result.photos,
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

  uploadPhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const caption = req.body.caption ? String(req.body.caption) : undefined;

      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
      }

      const photoUrl = `/uploads/reviews/${req.file.filename}`;
      const photo = await this.reviewService.addReviewPhoto(userId, id, photoUrl, caption);

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

  // --- Admin Moderation Endpoints ---
  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const adminId = req.user!.id;
      const { status, moderationNotes } = updateReviewStatusSchema.parse(req.body);

      const review = await this.reviewService.updateReviewStatus(id, status as ReviewStatus, adminId, moderationNotes);

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

  getReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const parsedPage = req.query.page ? parseInt(req.query.page as string) : 1;
      const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
      const parsedLimit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 20 : Math.min(parsedLimit, 50);

      const status = req.query.status as any;
      const reason = req.query.reason as any;

      const result = await this.reviewService.getReports({
        status,
        reason,
        page,
        limit,
      });

      const formattedReports: ReviewReportDto[] = result.reports.map((r: any) => ({
        id: r.id,
        reviewId: r.reviewId,
        reporterId: r.reporterId,
        reporterName: r.reporter?.name,
        reason: r.reason,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        resolvedByName: r.resolvedBy?.name,
        actionTaken: r.actionTaken,
        resolutionNotes: r.resolutionNotes,
        reviewPreview: r.review ? {
          id: r.review.id,
          cafeName: r.review.cafe?.name,
          reviewerName: r.review.user?.name,
          overallRating: r.review.overallRating,
          comment: r.review.comment,
          status: r.review.status,
        } : undefined,
      }));

      res.json({
        success: true,
        data: formattedReports,
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

  resolveReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { reportId } = req.params;
      const adminId = req.user!.id;
      const { actionTaken, resolutionNotes } = resolveReportSchema.parse(req.body);

      const report = await this.reviewService.resolveReport(reportId, adminId, actionTaken, resolutionNotes);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  moderatePhoto = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { photoId } = req.params;
      const adminId = req.user!.id;
      const { status } = updateReviewStatusSchema.parse(req.body);

      const photo = await this.reviewService.moderatePhoto(photoId, status as ReviewStatus, adminId);

      res.json({
        success: true,
        data: photo,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ success: false, error: { message: 'Validation failed', details: error.issues } });
      }
      next(error);
    }
  };

  checkRatingsIntegrity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeId = req.query.cafeId ? String(req.query.cafeId) : undefined;
      const discrepancies = await this.reviewService.checkRatingsIntegrity(cafeId);

      res.json({
        success: true,
        data: discrepancies,
      });
    } catch (error) {
      next(error);
    }
  };

  repairRatings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const cafeId = req.body.cafeId ? String(req.body.cafeId) : undefined;
      const result = await this.reviewService.repairRatings(cafeId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
