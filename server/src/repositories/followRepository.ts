import { prisma } from '../config/database.js';

export interface FollowFilters {
  userId?: string;
  cafeId?: string;
  page?: number;
  limit?: number;
}

export interface FollowPreferences {
  eventsEnabled?: boolean;
  specialsEnabled?: boolean;
  announcementsEnabled?: boolean;
  menuUpdatesEnabled?: boolean;
}

export class FollowRepository {
  async findFollow(userId: string, cafeId: string) {
    return prisma.cafeFollow.findUnique({
      where: {
        userId_cafeId: {
          userId,
          cafeId,
        },
      },
    });
  }

  async createFollow(userId: string, cafeId: string) {
    return prisma.$transaction(async (tx) => {
      const follow = await tx.cafeFollow.create({
        data: {
          userId,
          cafeId,
        },
      });

      await tx.cafe.update({
        where: { id: cafeId },
        data: { followerCount: { increment: 1 } },
      });

      return follow;
    });
  }

  async removeFollow(userId: string, cafeId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.cafeFollow.findUnique({
        where: {
          userId_cafeId: {
            userId,
            cafeId,
          },
        },
      });

      if (!existing) return null;

      await tx.cafeFollow.delete({
        where: {
          userId_cafeId: {
            userId,
            cafeId,
          },
        },
      });

      await tx.cafe.update({
        where: { id: cafeId },
        data: { followerCount: { decrement: 1 } },
      });

      return true;
    });
  }

  async updatePreferences(userId: string, cafeId: string, preferences: FollowPreferences) {
    return prisma.cafeFollow.update({
      where: {
        userId_cafeId: {
          userId,
          cafeId,
        },
      },
      data: preferences,
    });
  }

  async findUserFollowing(filters: FollowFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    const where: any = { userId: filters.userId };

    const [follows, total] = await Promise.all([
      prisma.cafeFollow.findMany({
        where,
        include: {
          cafe: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortDescription: true,
              city: true,
              ratingAverage: true,
              photos: {
                where: { isCover: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cafeFollow.count({ where }),
    ]);

    return { follows, total };
  }

  async findCafeFollowers(cafeId: string, type?: 'events' | 'specials' | 'announcements' | 'menu') {
    const where: any = { cafeId };
    if (type === 'events') where.eventsEnabled = true;
    if (type === 'specials') where.specialsEnabled = true;
    if (type === 'announcements') where.announcementsEnabled = true;
    if (type === 'menu') where.menuUpdatesEnabled = true;

    return prisma.cafeFollow.findMany({
      where,
      select: {
        userId: true,
      },
    });
  }
}
