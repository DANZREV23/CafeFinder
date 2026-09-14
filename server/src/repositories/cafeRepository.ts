import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export interface CafeFilters {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  priceRange?: number;
  featured?: boolean;
  trending?: boolean;
  verified?: boolean;
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
      sort = 'latest',
      status = 'PUBLISHED',
      currentUserId
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.CafeWhereInput = {
      status: status as any,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
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

    const [data, total] = await Promise.all([
      prisma.cafe.findMany({
        where,
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
          favorites: currentUserId ? {
            where: { userId: currentUserId },
            take: 1,
          } : false,
        },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.cafe.count({ where }),
    ]);

    return { data, total };
  }

  async findBySlug(slug: string) {
    const cafe = await prisma.cafe.findUnique({
      where: { slug },
      include: {
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
      },
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
    return prisma.cafe.delete({
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
