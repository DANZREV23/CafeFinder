import { CafeAnalyticsEventType } from '@prisma/client';
import { prisma } from '../config/database.js';

export interface AnalyticsSeriesPoint {
  date: string;
  value: number;
}

export interface RatingDistribution {
  one: number;
  two: number;
  three: number;
  four: number;
  five: number;
}

export class AnalyticsRepository {
  async recordEvent(data: {
    cafeId: string;
    userId?: string;
    eventType: CafeAnalyticsEventType;
    visitorHash?: string;
  }) {
    return prisma.cafeAnalyticsEvent.create({
      data
    });
  }

  async findRecentEvent(hash: string, cafeId: string, eventType: CafeAnalyticsEventType, since: Date) {
    return prisma.cafeAnalyticsEvent.findFirst({
      where: {
        visitorHash: hash,
        cafeId,
        eventType,
        createdAt: {
          gt: since
        }
      }
    });
  }

  async getAggregateCount(cafeId: string, eventType: CafeAnalyticsEventType, from: Date, to: Date) {
    return prisma.cafeAnalyticsEvent.count({
      where: {
        cafeId,
        eventType,
        createdAt: {
          gte: from,
          lte: to
        }
      }
    });
  }

  async getTimeSeries(cafeId: string, eventType: CafeAnalyticsEventType, from: Date, to: Date, interval: 'day' | 'week' | 'month') {
    // PostgreSQL compatible date grouping
    let dateFormat = 'YYYY-MM-DD'; // default for day
    if (interval === 'week') dateFormat = 'IYYY-IW';
    if (interval === 'month') dateFormat = 'YYYY-MM';
    
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR("createdAt", '${dateFormat}') as "dateStr",
        MIN("createdAt") as date,
        COUNT(*) as value
      FROM cafe_analytics_events
      WHERE "cafeId" = $1 AND "eventType" = $2::"CafeAnalyticsEventType" AND "createdAt" >= $3 AND "createdAt" <= $4
      GROUP BY "dateStr"
      ORDER BY "dateStr" ASC
    `, cafeId, eventType, from, to);

    return results.map(r => ({
      date: r.date instanceof Date ? r.date.toISOString() : new Date(r.date).toISOString(),
      value: Number(r.value)
    }));
  }

  async getFavoriteStats(cafeId: string, from: Date, to: Date) {
    const current = await prisma.cafeFavorite.count({
      where: {
        cafeId,
        createdAt: {
          gte: from,
          lte: to
        }
      }
    });

    const total = await prisma.cafeFavorite.count({
      where: {
        cafeId
      }
    });

    return { current, total };
  }

  async getReviewStats(cafeId: string, from: Date, to: Date) {
    const reviews = await prisma.cafeReview.findMany({
      where: {
        cafeId,
        status: 'APPROVED',
        createdAt: {
          gte: from,
          lte: to
        }
      },
      select: {
        overallRating: true,
        createdAt: true
      }
    });

    const distribution = await prisma.cafeReview.groupBy({
      by: ['overallRating'],
      where: {
        cafeId,
        status: 'APPROVED'
      },
      _count: {
        overallRating: true
      }
    });

    const distObj: RatingDistribution = { one: 0, two: 0, three: 0, four: 0, five: 0 };
    distribution.forEach(d => {
      if (d.overallRating === 1) distObj.one = d._count.overallRating;
      if (d.overallRating === 2) distObj.two = d._count.overallRating;
      if (d.overallRating === 3) distObj.three = d._count.overallRating;
      if (d.overallRating === 4) distObj.four = d._count.overallRating;
      if (d.overallRating === 5) distObj.five = d._count.overallRating;
    });

    return {
      count: reviews.length,
      average: reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length : 0,
      distribution: distObj,
      reviews // returning for manual time series grouping if needed
    };
  }

  async getHistoricalFavoritesCount(cafeId: string, from: Date, to: Date, interval: 'day' | 'week' | 'month') {
    // PostgreSQL compatible date grouping
    let dateFormat = 'YYYY-MM-DD';
    if (interval === 'week') dateFormat = 'IYYY-IW';
    if (interval === 'month') dateFormat = 'YYYY-MM';
    
    return prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        TO_CHAR("createdAt", '${dateFormat}') as "dateStr",
        MIN("createdAt") as date,
        COUNT(*) as value
      FROM cafe_favorites
      WHERE "cafeId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
      GROUP BY "dateStr"
      ORDER BY "dateStr" ASC
    `, cafeId, from, to);
  }
}
