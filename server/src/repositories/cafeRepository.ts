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
      status = 'PUBLISHED'
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.CafeWhereInput = {
      status: status as any,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortDescription: { contains: search } },
        { description: { contains: search } },
        { city: { contains: search } },
        { address: { contains: search } },
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
    return prisma.cafe.findUnique({
      where: { slug },
      include: {
        photos: true,
        hours: true,
        amenities: {
          include: {
            amenity: true,
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
