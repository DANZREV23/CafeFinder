import { prisma } from '../config/database.js';
import { Prisma, ReviewStatus, ReviewReportReason, ReportStatus } from '@prisma/client';

export interface ReviewFilters {
  cafeId?: string;
  userId?: string;
  status?: ReviewStatus;
  rating?: number;
  hasPhotos?: boolean;
  search?: string;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful';
  currentUserId?: string | null;
  page?: number;
  limit?: number;
}

export class ReviewRepository {
  async findAll(filters: ReviewFilters) {
    const {
      cafeId,
      userId,
      status,
      rating,
      hasPhotos,
      search,
      sort = 'newest',
      currentUserId,
      page = 1,
      limit = 10,
    } = filters;

    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.CafeReviewWhereInput = {};
    if (cafeId) where.cafeId = cafeId;
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (rating) where.overallRating = rating;

    if (hasPhotos) {
      where.photos = {
        some: {
          status: ReviewStatus.APPROVED,
        },
      };
    }

    if (search && search.trim()) {
      where.comment = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    let orderBy: Prisma.CafeReviewOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'highest') {
      orderBy = { overallRating: 'desc' };
    } else if (sort === 'lowest') {
      orderBy = { overallRating: 'asc' };
    } else if (sort === 'most_helpful') {
      orderBy = { helpfulCount: 'desc' };
    }

    const [data, total] = await Promise.all([
      prisma.cafeReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              isProfilePublic: true,
            },
          },
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
            },
          },
          photos: {
            orderBy: { createdAt: 'desc' },
          },
          response: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          helpfulReactions: currentUserId ? {
            where: { userId: currentUserId },
            select: { userId: true },
          } : false,
        },
        orderBy,
        skip,
        take: safeLimit,
      }),
      prisma.cafeReview.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, currentUserId?: string | null) {
    return prisma.cafeReview.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isProfilePublic: true,
          },
        },
        cafe: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            ownerId: true,
          },
        },
        photos: {
          orderBy: { createdAt: 'desc' },
        },
        response: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        helpfulReactions: currentUserId ? {
          where: { userId: currentUserId },
          select: { userId: true },
        } : false,
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
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isProfilePublic: true,
          },
        },
        photos: true,
        response: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        helpfulReactions: {
          where: { userId },
          select: { userId: true },
        },
      },
    });
  }

  async create(data: Prisma.CafeReviewCreateInput) {
    return prisma.cafeReview.create({
      data,
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isProfilePublic: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.CafeReviewUpdateInput) {
    return prisma.cafeReview.update({
      where: { id },
      data,
      include: {
        photos: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            isProfilePublic: true,
          },
        },
        response: true,
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
        status: ReviewStatus.APPROVED,
      },
      select: {
        overallRating: true,
        coffeeRating: true,
        ambianceRating: true,
        serviceRating: true,
        photos: {
          where: { status: ReviewStatus.APPROVED },
          select: { id: true },
        },
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
        photoCount: 0,
      };
    }

    const count = reviews.length;
    let totalPhotos = 0;
    let coffeeCount = 0;
    let ambianceCount = 0;
    let serviceCount = 0;
    const sums = reviews.reduce(
      (acc, r) => {
        acc.overall += r.overallRating;
        if (r.coffeeRating && r.coffeeRating > 0) {
          acc.coffee += r.coffeeRating;
          coffeeCount++;
        }
        if (r.ambianceRating && r.ambianceRating > 0) {
          acc.ambiance += r.ambianceRating;
          ambianceCount++;
        }
        if (r.serviceRating && r.serviceRating > 0) {
          acc.service += r.serviceRating;
          serviceCount++;
        }
        acc.dist[r.overallRating as 1 | 2 | 3 | 4 | 5] = (acc.dist[r.overallRating as 1 | 2 | 3 | 4 | 5] || 0) + 1;
        totalPhotos += r.photos.length;
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
      coffeeAverage: coffeeCount > 0 ? parseFloat((sums.coffee / coffeeCount).toFixed(1)) : 0,
      ambianceAverage: ambianceCount > 0 ? parseFloat((sums.ambiance / ambianceCount).toFixed(1)) : 0,
      serviceAverage: serviceCount > 0 ? parseFloat((sums.service / serviceCount).toFixed(1)) : 0,
      distribution: sums.dist,
      photoCount: totalPhotos,
    };
  }

  // --- Photo methods ---
  async addPhoto(reviewId: string, data: { url: string; caption?: string; status?: ReviewStatus }) {
    return prisma.cafeReviewPhoto.create({
      data: {
        reviewId,
        url: data.url,
        caption: data.caption,
        status: data.status || ReviewStatus.APPROVED,
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
      include: {
        review: {
          include: {
            cafe: true,
          },
        },
      },
    });
  }

  async updatePhotoStatus(photoId: string, status: ReviewStatus, adminId?: string) {
    return prisma.cafeReviewPhoto.update({
      where: { id: photoId },
      data: {
        status,
        moderatedById: adminId,
        moderatedAt: new Date(),
      },
    });
  }

  async getVisitorPhotos(cafeId: string, page = 1, limit = 20) {
    const skip = (Math.max(page, 1) - 1) * limit;

    const [photos, total] = await Promise.all([
      prisma.cafeReviewPhoto.findMany({
        where: {
          status: ReviewStatus.APPROVED,
          review: {
            cafeId,
            status: ReviewStatus.APPROVED,
          },
        },
        include: {
          review: {
            select: {
              id: true,
              overallRating: true,
              comment: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cafeReviewPhoto.count({
        where: {
          status: ReviewStatus.APPROVED,
          review: {
            cafeId,
            status: ReviewStatus.APPROVED,
          },
        },
      }),
    ]);

    return { photos, total };
  }

  // --- Helpful Reactions ---
  async toggleHelpfulReaction(reviewId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.cafeReviewHelpful.findUnique({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      });

      if (existing) {
        // Remove helpful reaction
        await tx.cafeReviewHelpful.delete({
          where: { id: existing.id },
        });

        const updatedReview = await tx.cafeReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              decrement: 1,
            },
          },
          select: { helpfulCount: true },
        });

        // Ensure not negative
        const helpfulCount = Math.max(0, updatedReview.helpfulCount);
        if (updatedReview.helpfulCount < 0) {
          await tx.cafeReview.update({
            where: { id: reviewId },
            data: { helpfulCount: 0 },
          });
        }

        return { isHelpful: false, helpfulCount };
      } else {
        // Add helpful reaction
        await tx.cafeReviewHelpful.create({
          data: {
            reviewId,
            userId,
          },
        });

        const updatedReview = await tx.cafeReview.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              increment: 1,
            },
          },
          select: { helpfulCount: true },
        });

        return { isHelpful: true, helpfulCount: updatedReview.helpfulCount };
      }
    });
  }

  // --- Review Reporting ---
  async createReport(data: {
    reviewId: string;
    reporterId: string;
    reason: ReviewReportReason;
    description?: string;
  }) {
    return prisma.cafeReviewReport.create({
      data: {
        reviewId: data.reviewId,
        reporterId: data.reporterId,
        reason: data.reason,
        description: data.description,
        status: ReportStatus.PENDING,
      },
    });
  }

  async findPendingReportByUser(reviewId: string, reporterId: string) {
    return prisma.cafeReviewReport.findFirst({
      where: {
        reviewId,
        reporterId,
        status: ReportStatus.PENDING,
      },
    });
  }

  async findReports(filters: {
    status?: ReportStatus;
    reason?: ReviewReportReason;
    page?: number;
    limit?: number;
  }) {
    const { status, reason, page = 1, limit = 20 } = filters;
    const skip = (Math.max(page, 1) - 1) * limit;

    const where: Prisma.CafeReviewReportWhereInput = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;

    const [reports, total] = await Promise.all([
      prisma.cafeReviewReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
            },
          },
          review: {
            include: {
              cafe: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cafeReviewReport.count({ where }),
    ]);

    return { reports, total };
  }

  async resolveReport(reportId: string, adminId: string, actionTaken: string, resolutionNotes?: string) {
    return prisma.cafeReviewReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedById: adminId,
        actionTaken,
        resolutionNotes,
      },
    });
  }

  async dismissReport(reportId: string, adminId: string, resolutionNotes?: string) {
    return prisma.cafeReviewReport.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.DISMISSED,
        resolvedAt: new Date(),
        resolvedById: adminId,
        actionTaken: 'DISMISSED',
        resolutionNotes,
      },
    });
  }

  // --- Owner Responses ---
  async createResponse(reviewId: string, ownerId: string, content: string) {
    return prisma.cafeReviewResponse.create({
      data: {
        reviewId,
        ownerId,
        content,
        status: ReviewStatus.APPROVED,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateResponse(responseId: string, ownerId: string, content: string) {
    return prisma.cafeReviewResponse.update({
      where: { id: responseId },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async updateResponseStatus(responseId: string, status: ReviewStatus, adminId?: string, moderationNotes?: string) {
    return prisma.cafeReviewResponse.update({
      where: { id: responseId },
      data: {
        status,
        moderationNotes,
        updatedAt: new Date(),
      },
    });
  }

  async deleteResponse(responseId: string) {
    return prisma.cafeReviewResponse.delete({
      where: { id: responseId },
    });
  }

  // --- Revision History ---
  async createRevision(data: {
    reviewId: string;
    userId: string;
    overallRating: number;
    coffeeRating?: number | null;
    ambianceRating?: number | null;
    serviceRating?: number | null;
    comment?: string | null;
  }) {
    return prisma.cafeReviewRevision.create({
      data: {
        reviewId: data.reviewId,
        userId: data.userId,
        overallRating: data.overallRating,
        coffeeRating: data.coffeeRating,
        ambianceRating: data.ambianceRating,
        serviceRating: data.serviceRating,
        comment: data.comment,
      },
    });
  }

  async getRevisions(reviewId: string) {
    return prisma.cafeReviewRevision.findMany({
      where: { reviewId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
