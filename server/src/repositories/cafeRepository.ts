import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';
import { normalizeSearchQuery } from '../utils/searchUtils.js';

export interface CafeFilters {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  priceRange?: number;
  featured?: boolean;
  trending?: boolean;
  verified?: boolean;
  amenities?: string[];
  sort?: 'rating' | 'latest' | 'name' | 'popular';
  status?: string;
  currentUserId?: string;
}

export class CafeRepository {
  async findAll(filters: CafeFilters) {
    const {
      page = 1,
      limit = 12,
      search,
      city,
      priceRange,
      featured,
      trending,
      verified,
      amenities,
      sort = 'latest',
      status = 'PUBLISHED',
      currentUserId
    } = filters;

    const safePage = Math.max(page, 1);
    const safeLimit = Math.max(limit, 1);
    const skip = (safePage - 1) * safeLimit;
    const normalizedSearch = search ? normalizeSearchQuery(search) : undefined;

    const where: Prisma.CafeWhereInput = {
      status: status as any,
    };

    if (normalizedSearch) {
      where.AND = [
        ...(where.AND as any[] || []),
        {
          OR: [
            { name: { contains: normalizedSearch, mode: 'insensitive' } },
            { shortDescription: { contains: normalizedSearch, mode: 'insensitive' } },
            { description: { contains: normalizedSearch, mode: 'insensitive' } },
            { city: { contains: normalizedSearch, mode: 'insensitive' } },
            { address: { contains: normalizedSearch, mode: 'insensitive' } },
            {
              amenities: {
                some: {
                  amenity: {
                    name: { contains: normalizedSearch, mode: 'insensitive' }
                  }
                }
              }
            }
          ]
        }
      ];
    }

    if (city) {
      where.city = { equals: city };
    }

    if (priceRange !== undefined) {
      where.priceRange = priceRange;
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    if (trending !== undefined) {
      where.trending = trending;
    }

    if (verified !== undefined) {
      where.verified = verified;
    }

    if (amenities && amenities.length > 0) {
      where.AND = [
        ...(where.AND as any[] || []),
        ...amenities.map(slug => ({
          amenities: {
            some: {
              amenity: { slug }
            }
          }
        }))
      ];
    }

    let orderBy: Prisma.CafeOrderByWithRelationInput = { createdAt: 'desc' };

    if (sort === 'rating') {
      orderBy = { ratingAverage: 'desc' };
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    } else if (sort === 'popular') {
      orderBy = { reviewCount: 'desc' };
    } else if (sort === 'latest') {
      orderBy = { createdAt: 'desc' };
    }

    const include: Prisma.CafeInclude = {
      photos: {
        where: { isCover: true },
        take: 1,
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
    };

    if (currentUserId) {
      include.favorites = {
        where: { userId: currentUserId },
        take: 1,
      };
    }

    const [data, total] = await Promise.all([
      prisma.cafe.findMany({
        where,
        include,
        skip,
        take: safeLimit,
        orderBy,
      }),
      prisma.cafe.count({ where }),
    ]);

    return { data, total };
  }

  async findBySlug(slug: string, currentUserId?: string) {
    const include: Prisma.CafeInclude = {
      photos: {
        orderBy: { sortOrder: 'asc' },
      },
      hours: {
        orderBy: { dayOfWeek: 'asc' },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
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
      },
      owner: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
        },
      },
    };

    if (currentUserId) {
      include.favorites = {
        where: { userId: currentUserId },
        take: 1,
      };
    }

    const cafe = await prisma.cafe.findUnique({
      where: { slug },
      include,
    });

    if (!cafe) return null;

    // Get related cafes (same city, excluding current)
    const relatedCafes = await prisma.cafe.findMany({
      where: {
        city: cafe.city,
        id: { not: cafe.id },
        status: 'PUBLISHED',
      },
      include: {
        photos: {
          where: { isCover: true },
          take: 1,
        },
      },
      take: 4,
    });

    return {
      ...cafe,
      relatedCafes,
    };
  }

  async findById(id: string) {
    return prisma.cafe.findUnique({
      where: { id },
      include: {
        photos: true,
        hours: true,
        amenities: true,
      },
    });
  }

  async create(data: Prisma.CafeCreateInput) {
    return prisma.cafe.create({ data });
  }

  async update(id: string, data: Prisma.CafeUpdateInput) {
    return prisma.cafe.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.cafe.deleteMany({
      where: { id },
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await prisma.cafe.count({
      where: { slug },
    });
    return count > 0;
  }
}
