import { ReviewRepository, ReviewFilters } from '../repositories/reviewRepository.js';
import { CafeRepository } from '../repositories/cafeRepository.js';
import { NotificationService } from './notificationService.js';
import { ReviewStatus, ReviewReportReason, ReportStatus, CafeStatus, Prisma } from '@prisma/client';
import { emailService } from './email/email.service.js';
import { prisma } from '../config/database.js';
import { validateReviewQuality } from '../utils/reviewQuality.js';

export class ReviewService {
  private reviewRepository: ReviewRepository;
  private cafeRepository: CafeRepository;
  private notificationService: NotificationService;

  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.cafeRepository = new CafeRepository();
    this.notificationService = new NotificationService();
  }

  // --- Public / General Review queries ---
  async getCafeReviews(cafeId: string, filters: Omit<ReviewFilters, 'cafeId'>) {
    return this.reviewRepository.findAll({
      ...filters,
      cafeId,
      status: ReviewStatus.APPROVED,
    });
  }

  async getReviewById(id: string, currentUserId?: string | null) {
    return this.reviewRepository.findById(id, currentUserId);
  }

  async getUserReviewForCafe(userId: string, cafeId: string) {
    return this.reviewRepository.findByUserAndCafe(userId, cafeId);
  }

  // --- Creation ---
  async createReview(userId: string, cafeId: string, data: {
    coffeeRating?: number;
    ambianceRating?: number;
    serviceRating?: number;
    overallRating: number;
    comment?: string | null;
  }) {
    // 1. Check if user already reviewed this cafe
    const existing = await this.reviewRepository.findByUserAndCafe(userId, cafeId);
    if (existing) {
      throw new Error('You have already reviewed this cafe. You can edit your existing review.');
    }

    // 2. Check if cafe exists and is published
    const cafe = await this.cafeRepository.findById(cafeId);
    if (!cafe || cafe.status !== CafeStatus.PUBLISHED) {
      throw new Error('Cafe not found or is not currently accepting public reviews.');
    }

    // 3. Quality & spam validation
    const qualityCheck = validateReviewQuality(data.comment);
    if (!qualityCheck.isValid) {
      throw new Error(qualityCheck.error || 'Review comment does not meet quality guidelines.');
    }

    // 4. Create review with PENDING status (ready for moderation)
    const review = await this.reviewRepository.create({
      user: { connect: { id: userId } },
      cafe: { connect: { id: cafeId } },
      coffeeRating: data.coffeeRating || 0,
      ambianceRating: data.ambianceRating || 0,
      serviceRating: data.serviceRating || 0,
      overallRating: data.overallRating,
      comment: qualityCheck.sanitizedComment,
      status: ReviewStatus.PENDING,
    });

    // 5. Notify cafe owner if owner exists
    if (cafe.ownerId && cafe.ownerId !== userId) {
      this.notificationService.createNotification(cafe.ownerId, {
        title: 'New Cafe Review',
        message: `A new review was submitted for ${cafe.name} and is currently in moderation.`,
        type: 'COMMUNITY_REVIEW',
      }).catch(err => console.error('[ReviewService] Notification error:', err));
    }

    return review;
  }

  // --- Editing ---
  async updateReview(userId: string, reviewId: string, data: {
    coffeeRating?: number;
    ambianceRating?: number;
    serviceRating?: number;
    overallRating: number;
    comment?: string | null;
  }) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Not authorized to update this review');
    }

    // Quality check
    const qualityCheck = validateReviewQuality(data.comment);
    if (!qualityCheck.isValid) {
      throw new Error(qualityCheck.error || 'Review comment does not meet quality guidelines.');
    }

    // Archive previous version in revision history
    await this.reviewRepository.createRevision({
      reviewId: review.id,
      userId: review.userId,
      overallRating: review.overallRating,
      coffeeRating: review.coffeeRating,
      ambianceRating: review.ambianceRating,
      serviceRating: review.serviceRating,
      comment: review.comment,
    });

    const previousStatus = review.status;

    // Return to PENDING for moderation re-check after edits
    const updatedReview = await this.reviewRepository.update(reviewId, {
      coffeeRating: data.coffeeRating || 0,
      ambianceRating: data.ambianceRating || 0,
      serviceRating: data.serviceRating || 0,
      overallRating: data.overallRating,
      comment: qualityCheck.sanitizedComment,
      status: ReviewStatus.PENDING,
    });

    // If the review was previously approved, recalculate aggregate ratings
    if (previousStatus === ReviewStatus.APPROVED) {
      await this.recalculateCafeRatings(review.cafeId);
    }

    return updatedReview;
  }

  // --- Deletion ---
  async deleteReview(userId: string, reviewId: string, isAdmin = false) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this review');
    }

    const previousStatus = review.status;
    const cafeId = review.cafeId;

    await this.reviewRepository.delete(reviewId);

    // Recalculate aggregates if the deleted review was approved
    if (previousStatus === ReviewStatus.APPROVED) {
      await this.recalculateCafeRatings(cafeId);
    }

    return true;
  }

  // --- Moderation Status Transitions ---
  async updateReviewStatus(reviewId: string, newStatus: ReviewStatus, adminId?: string, moderationNotes?: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const currentStatus = review.status;
    if (currentStatus === newStatus) {
      return review;
    }

    // Validate status transition matrix
    const allowedTransitions: Record<ReviewStatus, ReviewStatus[]> = {
      [ReviewStatus.PENDING]: [ReviewStatus.APPROVED, ReviewStatus.REJECTED, ReviewStatus.REMOVED],
      [ReviewStatus.APPROVED]: [ReviewStatus.HIDDEN, ReviewStatus.REMOVED],
      [ReviewStatus.REJECTED]: [ReviewStatus.APPROVED, ReviewStatus.REMOVED],
      [ReviewStatus.HIDDEN]: [ReviewStatus.APPROVED, ReviewStatus.REMOVED],
      [ReviewStatus.REMOVED]: [ReviewStatus.PENDING, ReviewStatus.APPROVED],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    const updated = await this.reviewRepository.update(reviewId, {
      status: newStatus,
      moderatedById: adminId,
      moderatedAt: new Date(),
      moderationNotes: moderationNotes !== undefined ? moderationNotes : review.moderationNotes,
    });

    // Recalculate cafe rating aggregates transactionally
    await this.recalculateCafeRatings(review.cafeId);

    // Send notifications to reviewer
    const reviewer = await prisma.user.findUnique({ where: { id: review.userId } });
    const cafe = await prisma.cafe.findUnique({ where: { id: review.cafeId } });

    if (reviewer && cafe) {
      if (newStatus === ReviewStatus.APPROVED) {
        this.notificationService.createNotification(reviewer.id, {
          title: 'Review Approved',
          message: `Your review for ${cafe.name} has been approved and published to the community!`,
          type: 'REVIEW_APPROVED',
        }).catch(err => console.error('[ReviewService] Notification error:', err));

        emailService.sendReviewApprovedEmail(
          { id: reviewer.id, name: reviewer.name, email: reviewer.email },
          { name: cafe.name, slug: cafe.slug }
        ).catch(err => console.error('[ReviewService] Email error:', err));
      } else if (newStatus === ReviewStatus.REJECTED) {
        this.notificationService.createNotification(reviewer.id, {
          title: 'Review Update',
          message: `Your review for ${cafe.name} could not be approved due to community guidelines.`,
          type: 'REVIEW_REJECTED',
        }).catch(err => console.error('[ReviewService] Notification error:', err));

        emailService.sendReviewRejectedEmail(
          { id: reviewer.id, name: reviewer.name, email: reviewer.email },
          cafe.name
        ).catch(err => console.error('[ReviewService] Email error:', err));
      } else if (newStatus === ReviewStatus.HIDDEN) {
        this.notificationService.createNotification(reviewer.id, {
          title: 'Review Notice',
          message: `Your review for ${cafe.name} was temporarily hidden for moderation review.`,
          type: 'REVIEW_HIDDEN',
        }).catch(err => console.error('[ReviewService] Notification error:', err));
      }
    }

    return updated;
  }

  // --- Helpful Reactions ---
  async toggleHelpfulReaction(userId: string, reviewId: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId === userId) {
      throw new Error('You cannot mark your own review as helpful');
    }

    if (review.status !== ReviewStatus.APPROVED) {
      throw new Error('Can only react to approved community reviews');
    }

    return this.reviewRepository.toggleHelpfulReaction(reviewId, userId);
  }

  // --- Reporting ---
  async reportReview(userId: string, reviewId: string, reason: ReviewReportReason, description?: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId === userId) {
      throw new Error('You cannot report your own review');
    }

    // Check for existing pending report
    const existing = await this.reviewRepository.findPendingReportByUser(reviewId, userId);
    if (existing) {
      throw new Error('You have already submitted a pending report for this review');
    }

    const report = await this.reviewRepository.createReport({
      reviewId,
      reporterId: userId,
      reason,
      description: description ? description.slice(0, 1000).trim() : undefined,
    });

    return report;
  }

  async getReports(filters: {
    status?: ReportStatus;
    reason?: ReviewReportReason;
    page?: number;
    limit?: number;
  }) {
    return this.reviewRepository.findReports(filters);
  }

  async resolveReport(reportId: string, adminId: string, actionTaken: 'DISMISS' | 'HIDE_REVIEW' | 'REMOVE_REVIEW' | 'RESTORE_REVIEW', notes?: string) {
    const report = await prisma.cafeReviewReport.findUnique({
      where: { id: reportId },
      include: { review: true },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== ReportStatus.PENDING) {
      throw new Error('Report has already been processed');
    }

    if (actionTaken === 'HIDE_REVIEW') {
      await this.updateReviewStatus(report.reviewId, ReviewStatus.HIDDEN, adminId, `Hidden via report ${reportId}`);
    } else if (actionTaken === 'REMOVE_REVIEW') {
      await this.updateReviewStatus(report.reviewId, ReviewStatus.REMOVED, adminId, `Removed via report ${reportId}`);
    } else if (actionTaken === 'RESTORE_REVIEW') {
      await this.updateReviewStatus(report.reviewId, ReviewStatus.APPROVED, adminId, `Restored via report ${reportId}`);
    }

    if (actionTaken === 'DISMISS') {
      return this.reviewRepository.dismissReport(reportId, adminId, notes);
    } else {
      return this.reviewRepository.resolveReport(reportId, adminId, actionTaken, notes);
    }
  }

  // --- Owner Responses ---
  async createOwnerResponse(userId: string, reviewId: string, content: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Verify authorized cafe ownership
    const isOwner = await this.verifyCafeOwnership(userId, review.cafeId);
    if (!isOwner) {
      throw new Error('Not authorized: You can only respond to reviews for cafes you own and manage');
    }

    if (review.response) {
      throw new Error('A response has already been submitted for this review. You can edit the existing response.');
    }

    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length < 5 || trimmedContent.length > 1500) {
      throw new Error('Response content must be between 5 and 1,500 characters.');
    }

    const response = await this.reviewRepository.createResponse(reviewId, userId, trimmedContent);

    // Notify reviewer about owner response
    const cafe = await this.cafeRepository.findById(review.cafeId);
    this.notificationService.createNotification(review.userId, {
      title: 'Owner Responded',
      message: `${cafe?.name || 'The cafe owner'} responded to your review.`,
      type: 'OWNER_RESPONSE',
    }).catch(err => console.error('[ReviewService] Notification error:', err));

    return response;
  }

  async updateOwnerResponse(userId: string, responseId: string, content: string, isAdmin = false) {
    const response = await prisma.cafeReviewResponse.findUnique({
      where: { id: responseId },
      include: { review: true },
    });

    if (!response) {
      throw new Error('Review response not found');
    }

    if (response.ownerId !== userId && !isAdmin) {
      throw new Error('Not authorized to edit this response');
    }

    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length < 5 || trimmedContent.length > 1500) {
      throw new Error('Response content must be between 5 and 1,500 characters.');
    }

    return this.reviewRepository.updateResponse(responseId, userId, trimmedContent);
  }

  async moderateOwnerResponse(responseId: string, status: ReviewStatus, adminId: string, moderationNotes?: string) {
    return this.reviewRepository.updateResponseStatus(responseId, status, adminId, moderationNotes);
  }

  async deleteOwnerResponse(userId: string, responseId: string, isAdmin = false) {
    const response = await prisma.cafeReviewResponse.findUnique({
      where: { id: responseId },
    });

    if (!response) {
      throw new Error('Review response not found');
    }

    if (response.ownerId !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this response');
    }

    return this.reviewRepository.deleteResponse(responseId);
  }

  // --- Photo Management ---
  async addReviewPhoto(userId: string, reviewId: string, url: string, caption?: string) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    if (review.userId !== userId) {
      throw new Error('Not authorized to add photos to this review');
    }

    if (review.photos.length >= 5) {
      throw new Error('Maximum of 5 photos per review reached');
    }

    return this.reviewRepository.addPhoto(reviewId, {
      url,
      caption: caption ? caption.slice(0, 200).trim() : undefined,
      status: ReviewStatus.APPROVED,
    });
  }

  async deleteReviewPhoto(userId: string, photoId: string, isAdmin = false) {
    const photo = await this.reviewRepository.getPhotoById(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    if (photo.review?.userId !== userId && !isAdmin) {
      throw new Error('Not authorized to delete this photo');
    }

    return this.reviewRepository.deletePhoto(photoId);
  }

  async moderatePhoto(photoId: string, status: ReviewStatus, adminId: string) {
    return this.reviewRepository.updatePhotoStatus(photoId, status, adminId);
  }

  async getVisitorPhotos(cafeId: string, page = 1, limit = 20) {
    return this.reviewRepository.getVisitorPhotos(cafeId, page, limit);
  }

  // --- Rating Calculation & Diagnostics ---
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

  async checkRatingsIntegrity(cafeId?: string) {
    const cafes = cafeId
      ? await prisma.cafe.findMany({ where: { id: cafeId } })
      : await prisma.cafe.findMany({ select: { id: true, name: true, ratingAverage: true, reviewCount: true } });

    const discrepancies = [];

    for (const cafe of cafes) {
      const aggregates = await this.reviewRepository.getAggregates(cafe.id);
      const isMismatch = (
        Math.abs(Number(cafe.ratingAverage) - aggregates.ratingAverage) > 0.05 ||
        Number(cafe.reviewCount) !== aggregates.reviewCount
      );

      if (isMismatch) {
        discrepancies.push({
          cafeId: cafe.id,
          name: cafe.name,
          current: {
            ratingAverage: Number(cafe.ratingAverage),
            reviewCount: Number(cafe.reviewCount),
          },
          expected: {
            ratingAverage: aggregates.ratingAverage,
            reviewCount: aggregates.reviewCount,
          },
        });
      }
    }

    return discrepancies;
  }

  async repairRatings(cafeId?: string) {
    const discrepancies = await this.checkRatingsIntegrity(cafeId);
    const repaired = [];

    for (const item of discrepancies) {
      await this.recalculateCafeRatings(item.cafeId);
      repaired.push(item.cafeId);
    }

    return {
      repairedCount: repaired.length,
      repairedCafeIds: repaired,
    };
  }

  // --- Helper to verify cafe ownership ---
  private async verifyCafeOwnership(userId: string, cafeId: string): Promise<boolean> {
    const cafe = await prisma.cafe.findUnique({
      where: { id: cafeId },
      select: { ownerId: true },
    });

    if (cafe && cafe.ownerId === userId) {
      return true;
    }

    // Also check verified owner claims
    const claim = await prisma.cafeOwnerClaim.findFirst({
      where: {
        cafeId,
        userId,
        status: 'APPROVED',
      },
    });

    return !!claim;
  }
}
