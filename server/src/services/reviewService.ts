import { ReviewRepository, ReviewFilters } from '../repositories/reviewRepository.js';
import { CafeRepository } from '../repositories/cafeRepository.js';
import { ReviewStatus, Prisma, CafeStatus, ReportStatus } from '@prisma/client';
import { emailService } from './email/email.service.js';
import { prisma } from '../config/database.js';
import { sanitizePlain } from '../utils/sanitization.js';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private cafeRepository: CafeRepository;

  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.cafeRepository = new CafeRepository();
  }

  async getCafeReviews(cafeId: string, filters: ReviewFilters) {
    return this.reviewRepository.findAll({
      ...filters,
      cafeId,
      status: ReviewStatus.APPROVED,
    });
  }

  async getReviewById(id: string) {
    return this.reviewRepository.findById(id);
  }

  async getUserReviewForCafe(userId: string, cafeId: string) {
    return this.reviewRepository.findByUserAndCafe(userId, cafeId);
  }

  async createReview(userId: string, cafeId: string, data: any) {
    // Check if user already reviewed this cafe
    const existing = await this.reviewRepository.findByUserAndCafe(userId, cafeId);
    if (existing) {
      throw new Error('You have already reviewed this cafe');
    }

    // Check if cafe exists and is published
    const cafe = await this.cafeRepository.findById(cafeId);
    if (!cafe || cafe.status !== CafeStatus.PUBLISHED) {
      throw new Error('Cafe not found or not published');
    }

    const review = await this.reviewRepository.create({
      user: { connect: { id: userId } },
      cafe: { connect: { id: cafeId } },
      coffeeRating: data.coffeeRating,
      ambianceRating: data.ambianceRating,
      serviceRating: data.serviceRating,
      overallRating: data.overallRating,
      comment: sanitizePlain(data.comment),
      status: ReviewStatus.PENDING, // Reviews are pending by default
    });

    return review;
  }

  async updateReview(userId: string, reviewId: string, data: any) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Not authorized to update this review');
    }

    const updatedReview = await this.reviewRepository.update(reviewId, {
      coffeeRating: data.coffeeRating,
      ambianceRating: data.ambianceRating,
      serviceRating: data.serviceRating,
      overallRating: data.overallRating,
      comment: sanitizePlain(data.comment),
      status: ReviewStatus.PENDING, // Set back to pending after edit
    });

    // Recalculate aggregates if the review was previously approved
    if (review.status === ReviewStatus.APPROVED) {
      await this.recalculateCafeRatings(review.cafeId);
    }

    return updatedReview;
  }

  async deleteReview(userId: string, reviewId: string, isAdmin: boolean = false) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this review');
    }

    await this.reviewRepository.delete(reviewId);

    // Recalculate aggregates if the review was approved
    if (review.status === ReviewStatus.APPROVED) {
      await this.recalculateCafeRatings(review.cafeId);
    }

    return true;
  }

  private validateReviewStatusTransition(current: ReviewStatus, next: ReviewStatus) {
    const allowedTransitions: Record<ReviewStatus, ReviewStatus[]> = {
      [ReviewStatus.PENDING]: [ReviewStatus.APPROVED, ReviewStatus.REJECTED],
      [ReviewStatus.APPROVED]: [ReviewStatus.HIDDEN, ReviewStatus.REMOVED],
      [ReviewStatus.REJECTED]: [ReviewStatus.PENDING, ReviewStatus.REMOVED],
      [ReviewStatus.HIDDEN]: [ReviewStatus.APPROVED, ReviewStatus.REMOVED],
      [ReviewStatus.REMOVED]: [],
    };

    if (current === next) {
      return;
    }

    if (!allowedTransitions[current]?.includes(next)) {
      throw new Error(`Invalid review status transition: ${current} -> ${next}`);
    }
  }

  async updateReviewStatus(reviewId: string, status: ReviewStatus) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    this.validateReviewStatusTransition(review.status, status);

    const updated = await this.reviewRepository.update(reviewId, { status });
    
    if (status === ReviewStatus.APPROVED || status === ReviewStatus.REJECTED || status === ReviewStatus.HIDDEN || status === ReviewStatus.REMOVED) {
      await this.recalculateCafeRatings(review.cafeId);
    }

    // Send notification email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: review.userId } });
    const cafe = await prisma.cafe.findUnique({ where: { id: review.cafeId } });
    
    if (user && cafe) {
      if (status === ReviewStatus.APPROVED) {
        emailService.sendReviewApprovedEmail(
          { id: user.id, name: user.name, email: user.email },
          { name: cafe.name, slug: cafe.slug }
        ).catch(err => console.error('[ReviewService]: Failed to send review approved email:', err));
      } else if (status === ReviewStatus.REJECTED) {
        emailService.sendReviewRejectedEmail(
          { id: user.id, name: user.name, email: user.email },
          cafe.name
        ).catch(err => console.error('[ReviewService]: Failed to send review rejected email:', err));
      } else if (status === ReviewStatus.HIDDEN) {
        emailService.queueEmail('REVIEW_HIDDEN' as any, user.email, {
          name: user.name,
          cafeName: cafe.name,
        }, user.id).catch(err => console.error('[ReviewService]: Failed to send review hidden email:', err));
      }
    }

    return updated;
  }

  async recalculateCafeRatings(cafeId: string) {
    const aggregates = await this.reviewRepository.getAggregates(cafeId);
    
    await this.cafeRepository.update(cafeId, {
      ratingAverage: aggregates.ratingAverage,
      reviewCount: aggregates.reviewCount,
    });

    return aggregates;
  }

  async getCafeRatingStats(cafeId: string) {
    return this.reviewRepository.getAggregates(cafeId);
  }

  async addReviewPhoto(userId: string, reviewId: string, url: string, caption?: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Not authorized to add photos to this review');
    }

    const photoCount = review.photos.length;
    if (photoCount >= 5) {
      throw new Error('Maximum of 5 photos per review');
    }

    return this.reviewRepository.addPhoto(reviewId, { url, caption });
  }

  async deleteReviewPhoto(userId: string, photoId: string, isAdmin: boolean = false) {
    const photo = await this.reviewRepository.getPhotoById(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    const review = await this.reviewRepository.findById(photo.reviewId);
    if (!review) {
       // Should not happen if DB integrity is maintained, but handle anyway
       await this.reviewRepository.deletePhoto(photoId);
       return true;
    }

    if (review.userId !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this photo');
    }

    await this.reviewRepository.deletePhoto(photoId);
    return true;
  }

  async toggleHelpfulReaction(userId: string, reviewId: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const existingReaction = await prisma.cafeReviewHelpful.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
    });

    if (existingReaction) {
      const [, updatedReview] = await prisma.$transaction([
        prisma.cafeReviewHelpful.delete({ where: { id: existingReaction.id } }),
        prisma.cafeReview.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ]);

      return {
        helpful: false,
        helpfulCount: Math.max((updatedReview.helpfulCount ?? 0), 0),
      };
    }

    const [, updatedReview] = await prisma.$transaction([
      prisma.cafeReviewHelpful.create({
        data: { reviewId, userId },
      }),
      prisma.cafeReview.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);

    return {
      helpful: true,
      helpfulCount: updatedReview.helpfulCount,
    };
  }

  async reportReview(userId: string, reviewId: string, reason: string, description?: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId === userId) {
      throw new Error('You cannot report your own review');
    }

    const existing = await prisma.cafeReviewReport.findUnique({
      where: { reviewId_reporterId: { reviewId, reporterId: userId } },
    });

    if (existing) {
      if (existing.status === ReportStatus.PENDING || existing.status === ReportStatus.RESOLVED) {
        throw new Error('You have already reported this review');
      }
    }

    return prisma.cafeReviewReport.create({
      data: {
        reviewId,
        reporterId: userId,
        reason: reason as any,
        description: description ? sanitizePlain(description) : null,
        status: ReportStatus.PENDING,
      },
    });
  }

  async getReviewResponse(reviewId: string) {
    return prisma.cafeReviewResponse.findUnique({
      where: { reviewId },
      include: { owner: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async upsertReviewResponse(userId: string, reviewId: string, content: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const cafe = await prisma.cafe.findUnique({ where: { id: review.cafeId }, select: { ownerId: true } });
    if (!cafe || cafe.ownerId !== userId) {
      throw new Error('Only the cafe owner can respond to a review');
    }

    const cleanedContent = sanitizePlain(content).trim();
    if (!cleanedContent || cleanedContent.length < 10 || cleanedContent.length > 2000) {
      throw new Error('Review response must be between 10 and 2000 characters');
    }

    const existing = await prisma.cafeReviewResponse.findUnique({ where: { reviewId } });

    if (existing) {
      return prisma.cafeReviewResponse.update({
        where: { id: existing.id },
        data: { content: cleanedContent, status: ReviewStatus.APPROVED },
      });
    }

    return prisma.cafeReviewResponse.create({
      data: {
        reviewId,
        ownerId: userId,
        content: cleanedContent,
        status: ReviewStatus.APPROVED,
      },
    });
  }
}
