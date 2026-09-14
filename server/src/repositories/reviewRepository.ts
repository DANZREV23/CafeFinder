import { prisma } from '../config/database.js';
import { Prisma, ReviewStatus } from '@prisma/client';

export interface ReviewFilters {
  cafeId?: string;
  userId?: string;
  status?: ReviewStatus;
  page?: number;
  limit?: number;
}

export class ReviewRepository {
  async findAll(filters: ReviewFilters) {
    const { cafeId, userId, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CafeReviewWhereInput = {};
    if (cafeId) where.cafeId = cafeId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.cafeReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          photos: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cafeReview.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return prisma.cafeReview.findUnique({
      where: { id },
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findByUserAndCafe(userId: string, cafeId: string) {
    return prisma.cafeReview.findUnique({
      where: {
        cafeId_userId: {
          cafeId,
          userId,
        },
      },
      include: {
        photos: true,
      },
    });
  }

  async create(data: Prisma.CafeReviewCreateInput) {
    return prisma.cafeReview.create({
      data,
      include: {
        photos: true,
      },
    });
  }

  async update(id: string, data: Prisma.CafeReviewUpdateInput) {
    return prisma.cafeReview.update({
      where: { id },
      data,
      include: {
        photos: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.cafeReview.delete({
      where: { id },
    });
  }

  async getAggregates(cafeId: string) {
    const reviews = await prisma.cafeReview.findMany({
      where: {
        cafeId,
        status: 'APPROVED',
      },
      select: {
        overallRating: true,
        coffeeRating: true,
        ambianceRating: true,
        serviceRating: true,
      },
    });

    if (reviews.length === 0) {
      return {
        ratingAverage: 0,
        reviewCount: 0,
        coffeeAverage: 0,
        ambianceAverage: 0,
        serviceAverage: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const count = reviews.length;
    const sums = reviews.reduce(
      (acc, r) => {
        acc.overall += r.overallRating;
        acc.coffee += r.coffeeRating || 0;
        acc.ambiance += r.ambianceRating || 0;
        acc.service += r.serviceRating || 0;
        acc.dist[r.overallRating as 1 | 2 | 3 | 4 | 5] = (acc.dist[r.overallRating as 1 | 2 | 3 | 4 | 5] || 0) + 1;
        return acc;
      },
      {
        overall: 0,
        coffee: 0,
        ambiance: 0,
        service: 0,
        dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
      }
    );

    return {
      ratingAverage: parseFloat((sums.overall / count).toFixed(1)),
      reviewCount: count,
      coffeeAverage: parseFloat((sums.coffee / count).toFixed(1)),
      ambianceAverage: parseFloat((sums.ambiance / count).toFixed(1)),
      serviceAverage: parseFloat((sums.service / count).toFixed(1)),
      distribution: sums.dist,
    };
  }

  async addPhoto(reviewId: string, data: { url: string; caption?: string }) {
    return prisma.cafeReviewPhoto.create({
      data: {
        reviewId,
        ...data,
      },
    });
  }

  async deletePhoto(photoId: string) {
    return prisma.cafeReviewPhoto.delete({
      where: { id: photoId },
    });
  }

  async getPhotoById(photoId: string) {
    return prisma.cafeReviewPhoto.findUnique({
      where: { id: photoId },
    });
  }
}
