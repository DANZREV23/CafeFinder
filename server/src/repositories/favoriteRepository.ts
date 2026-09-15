import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export interface FavoriteFilters {
  userId: string;
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  priceRange?: number;
  minRating?: number;
  amenities?: string[];
  sort?: 'recently_saved' | 'rating' | 'name_asc' | 'name_desc';
}

export class FavoriteRepository {
  async findFavorite(userId: string, cafeId: string) {
    return prisma.cafeFavorite.findUnique({
      where: {
        userId_cafeId: {
          userId,
          cafeId,
        },
      },
    });
  }

  async addFavorite(userId: string, cafeId: string) {
    return prisma.cafeFavorite.upsert({
      where: {
        userId_cafeId: {
          userId,
          cafeId,
        },
      },
      update: {},
      create: {
        userId,
        cafeId,
      },
    });
  }

  async removeFavorite(userId: string, cafeId: string) {
    return prisma.cafeFavorite.deleteMany({
      where: {
        userId,
        cafeId,
      },
    });
  }

  async findUserFavorites(filters: FavoriteFilters) {
    const {
      userId,
      page = 1,
      limit = 12,
      search,
      city,
      priceRange,
      minRating,
      amenities,
      sort = 'recently_saved',
    } = filters;

    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;

    const where: Prisma.CafeFavoriteWhereInput = {
      userId,
      cafe: {
        status: 'PUBLISHED',
      },
    };

    if (search || city || priceRange !== undefined || minRating !== undefined || amenities?.length) {
      const cafeWhere: Prisma.CafeWhereInput = {
        status: 'PUBLISHED',
      };

      if (search) {
        cafeWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { shortDescription: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { city: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (city) {
        cafeWhere.city = city;
      }

      if (priceRange !== undefined) {
        cafeWhere.priceRange = priceRange;
      }

      if (minRating !== undefined) {
        cafeWhere.ratingAverage = { gte: minRating };
      }

      if (amenities?.length) {
        cafeWhere.AND = [
          ...(cafeWhere.AND as any[] || []),
          ...amenities.map(slug => ({
            amenities: {
              some: {
                amenity: { slug }
              }
            }
          }))
        ];
      }

      where.cafe = cafeWhere;
    }

    let orderBy: Prisma.CafeFavoriteOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'rating') {
      orderBy = { cafe: { ratingAverage: 'desc' } };
    } else if (sort === 'name_asc') {
      orderBy = { cafe: { name: 'asc' } };
    } else if (sort === 'name_desc') {
      orderBy = { cafe: { name: 'desc' } };
    } else if (sort === 'recently_saved') {
      orderBy = { createdAt: 'desc' };
    }

    const include: Prisma.CafeFavoriteInclude = {
      cafe: {
        include: {
          photos: {
            where: { isCover: true },
            take: 1,
          },
          amenities: {
            include: {
              amenity: true,
            },
          },
        },
      },
    };

    const [data, total] = await Promise.all([
      prisma.cafeFavorite.findMany({
        where,
        include,
        skip,
        take: safeLimit,
        orderBy,
      }),
      prisma.cafeFavorite.count({ where }),
    ]);

    return { data, total };
  }
}
