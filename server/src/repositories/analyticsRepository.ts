import { prisma } from '../config/database.js';
import { CafeAnalyticsEventType } from '@prisma/client';

export class AnalyticsRepository {
  async recordEvent(data: {
    cafeId: string;
    userId?: string;
    eventType: CafeAnalyticsEventType;
    visitorHash?: string;
  }) {
    return prisma.cafeAnalyticsEvent.create({
      data: {
        cafeId: data.cafeId,
        userId: data.userId,
        eventType: data.eventType,
        visitorHash: data.visitorHash,
      },
    });
  }

  async findRecentEvent(visitorHash: string, cafeId: string, eventType: CafeAnalyticsEventType, since: Date) {
    return prisma.cafeAnalyticsEvent.findFirst({
      where: {
        visitorHash,
        cafeId,
        eventType,
        createdAt: { gte: since },
      },
    });
  }

  async getAggregateCount(cafeId: string, eventType: CafeAnalyticsEventType, from: Date, to: Date) {
    return prisma.cafeAnalyticsEvent.count({
      where: {
        cafeId,
        eventType,
        createdAt: { gte: from, lte: to },
      },
    });
  }

  async getFavoriteStats(cafeId: string, from: Date, to: Date) {
    const [total, current] = await Promise.all([
      prisma.cafeFavorite.count({ where: { cafeId } }),
      prisma.cafeFavorite.count({
        where: {
          cafeId,
          createdAt: { gte: from, lte: to },
        },
      }),
    ]);
    return { total, current };
  }

  async getReviewStats(cafeId: string, from: Date, to: Date) {
    const reviews = await prisma.cafeReview.findMany({
      where: {
        cafeId,
        status: 'APPROVED',
        createdAt: { gte: from, lte: to },
      },
      select: { overallRating: true },
    });

    const count = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.overallRating, 0);
    const average = count > 0 ? sum / count : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const rounded = Math.round(r.overallRating);
      if (distribution[rounded] !== undefined) {
        distribution[rounded]++;
      }
    });

    return { count, average, distribution };
  }

  async getTimeSeries(cafeId: string, eventType: CafeAnalyticsEventType, from: Date, to: Date, _interval: string) {
    const events = await prisma.cafeAnalyticsEvent.findMany({
      where: {
        cafeId,
        eventType,
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    events.forEach((e) => {
      const dateStr = e.createdAt.toISOString().split('T')[0];
      grouped[dateStr] = (grouped[dateStr] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date: new Date(date).toISOString(),
      value: count,
    }));
  }

  async getHistoricalFavoritesCount(cafeId: string, from: Date, to: Date, _interval: string) {
    const favorites = await prisma.cafeFavorite.findMany({
      where: {
        cafeId,
        createdAt: { gte: from, lte: to },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    favorites.forEach((f) => {
      const dateStr = f.createdAt.toISOString().split('T')[0];
      grouped[dateStr] = (grouped[dateStr] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      date: new Date(date),
      value: count,
    }));
  }
}
