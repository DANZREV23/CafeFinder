import { CafeAnalyticsEventType } from '@prisma/client';
import { AnalyticsRepository } from '../repositories/analyticsRepository.js';
import crypto from 'crypto';
import { subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export class AnalyticsService {
  private repository = new AnalyticsRepository();

  async trackEvent(data: {
    cafeId: string;
    userId?: string;
    eventType: CafeAnalyticsEventType;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { cafeId, userId, eventType, ipAddress, userAgent } = data;

    // Deduplication for PROFILE_VIEW
    if (eventType === 'PROFILE_VIEW' && (ipAddress || userAgent)) {
      const visitorHash = crypto
        .createHash('sha256')
        .update(`${ipAddress || ''}${userAgent || ''}stage19_salt`)
        .digest('hex');

      // Check if this visitor viewed this cafe in the last 24 hours
      const since = subDays(new Date(), 1);
      const existing = await this.repository.findRecentEvent(visitorHash, cafeId, eventType, since);

      if (existing) {
        return null; // Skip duplicate
      }

      return this.repository.recordEvent({
        cafeId,
        userId,
        eventType,
        visitorHash
      });
    }

    // Other events (clicks) - simpler deduplication or always record
    return this.repository.recordEvent({
      cafeId,
      userId,
      eventType
    });
  }

  async getCafeAnalytics(cafeId: string, options: { from: Date, to: Date, interval: 'day' | 'week' | 'month' }) {
    const { from, to, interval } = options;
    
    // Calculate previous period for comparison
    const daysDiff = differenceInDays(to, from) + 1;
    const prevTo = subDays(from, 1);
    const prevFrom = subDays(prevTo, daysDiff - 1);

    // Summary metrics
    const [
      views, 
      prevViews,
      favStats,
      prevFavCount,
      reviewStats,
      prevReviewStats
    ] = await Promise.all([
      this.repository.getAggregateCount(cafeId, 'PROFILE_VIEW', from, to),
      this.repository.getAggregateCount(cafeId, 'PROFILE_VIEW', prevFrom, prevTo),
      this.repository.getFavoriteStats(cafeId, from, to),
      this.repository.getAggregateCount(cafeId, 'FAVORITE_ADDED', prevFrom, prevTo), // Simplification
      this.repository.getReviewStats(cafeId, from, to),
      this.repository.getReviewStats(cafeId, prevFrom, prevTo)
    ]);

    // Time series
    const [viewSeries, favSeries] = await Promise.all([
      this.repository.getTimeSeries(cafeId, 'PROFILE_VIEW', from, to, interval),
      this.repository.getHistoricalFavoritesCount(cafeId, from, to, interval)
    ]);

    // Map favorites series to match format
    const formattedFavSeries = favSeries.map((f: any) => ({
      date: f.date.toISOString(),
      value: Number(f.value)
    }));

    return {
      summary: {
        profileViews: views,
        favorites: favStats.total,
        reviews: reviewStats.count,
        averageRating: Number(reviewStats.average.toFixed(1))
      },
      comparison: {
        profileViewsPrevious: prevViews,
        favoritesPrevious: favStats.total - favStats.current, // Approximation of total at end of prev period
        reviewsPrevious: prevReviewStats.count,
        averageRatingPrevious: Number(prevReviewStats.average.toFixed(1))
      },
      series: {
        profileViews: viewSeries,
        favorites: formattedFavSeries,
        // reviews series can be derived or specifically fetched
      },
      ratings: reviewStats.distribution
    };
  }
}
