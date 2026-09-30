import { prisma } from '../config/database.js';
import { CafeStatus, ReviewStatus, CafeSubmissionStatus } from '@prisma/client';
import { RecommendationService } from './recommendationService.js';
import { UserCafeViewRepository } from '../repositories/userCafeViewRepository.js';
import { mapToPublicCafeSummary } from '../dtos/cafeDto.js';

export class DashboardService {
  private recommendationService = new RecommendationService();
  private userCafeViewRepository = new UserCafeViewRepository();

  async getDashboardData(userId: string) {
    const [
      user,
      favoriteCount,
      reviewCount,
      submissionCount,
      unreadNotificationCount,
      recentFavorites,
      recentReviews,
      recentSubmissions,
      recentViews,
      recommendations
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true
        }
      }),
      prisma.cafeFavorite.count({ where: { userId } }),
      prisma.cafeReview.count({ where: { userId } }),
      prisma.cafeSubmission.count({ where: { submittedById: userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.cafeFavorite.findMany({
        where: { 
          userId,
          cafe: { status: CafeStatus.PUBLISHED }
        },
        include: {
          cafe: {
            include: {
              photos: { where: { isCover: true }, take: 1 },
              amenities: { include: { amenity: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      }),
      prisma.cafeReview.findMany({
        where: { userId },
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.cafeSubmission.findMany({
        where: { submittedById: userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      this.userCafeViewRepository.findRecentByUserId(userId, 6),
      this.recommendationService.getCafeSummaries(userId, 6)
    ]);

    return {
      user,
      stats: {
        favoriteCount,
        reviewCount,
        submissionCount,
        unreadNotificationCount
      },
      recentFavorites: recentFavorites.map(f => mapToPublicCafeSummary(f.cafe)),
      recentReviews,
      recentSubmissions,
      recentViews: recentViews.map(v => mapToPublicCafeSummary(v.cafe)),
      recommendations
    };
  }
}
