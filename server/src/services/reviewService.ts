import { ReviewRepository, ReviewFilters } from '../repositories/reviewRepository.js';
import { CafeRepository } from '../repositories/cafeRepository.js';
import { ReviewStatus, Prisma } from '@prisma/client';
import { emailService } from './email/email.service.js';
import { prisma } from '../config/database.js';

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
      status: 'APPROVED',
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
    if (!cafe || cafe.status !== 'PUBLISHED') {
      throw new Error('Cafe not found or not published');
    }

    const review = await this.reviewRepository.create({
      user: { connect: { id: userId } },
      cafe: { connect: { id: cafeId } },
      coffeeRating: data.coffeeRating,
      ambianceRating: data.ambianceRating,
      serviceRating: data.serviceRating,
      overallRating: data.overallRating,
      comment: data.comment,
      status: 'PENDING', // Reviews are pending by default
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
      comment: data.comment,
      status: 'PENDING', // Set back to pending after edit
    });

    // Recalculate aggregates if the review was previously approved
    if (review.status === 'APPROVED') {
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
    if (review.status === 'APPROVED') {
      await this.recalculateCafeRatings(review.cafeId);
    }

    return true;
  }

  async updateReviewStatus(reviewId: string, status: ReviewStatus) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    const updated = await this.reviewRepository.update(reviewId, { status });
    
    // Recalculate aggregates
    await this.recalculateCafeRatings(review.cafeId);

    // Send notification email (non-blocking)
    const user = await prisma.user.findUnique({ where: { id: review.userId } });
    const cafe = await prisma.cafe.findUnique({ where: { id: review.cafeId } });
    
    if (user && cafe) {
      if (status === 'APPROVED') {
        emailService.sendReviewApprovedEmail(
          { id: user.id, name: user.name, email: user.email },
          { name: cafe.name, slug: cafe.slug }
        ).catch(err => console.error('[ReviewService]: Failed to send review approved email:', err));
      } else if (status === 'REJECTED') {
        emailService.sendReviewRejectedEmail(
          { id: user.id, name: user.name, email: user.email },
          cafe.name
        ).catch(err => console.error('[ReviewService]: Failed to send review rejected email:', err));
      } else if (status === 'HIDDEN') {
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
}
