import { CafeRepository, CafeFilters } from '../repositories/cafeRepository.js';
import { generateSlug } from '../utils/slug.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export class CafeService {
  private cafeRepository: CafeRepository;

  constructor() {
    this.cafeRepository = new CafeRepository();
  }

  async getPublishedCafes(filters: CafeFilters) {
    const { data, total } = await this.cafeRepository.findAll({
      ...filters,
      status: 'PUBLISHED',
    });

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getCafeBySlug(slug: string, currentUserId?: string) {
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

    if (!cafe || cafe.status !== 'PUBLISHED') {
      return null;
    }

    // Get related cafes (same city, excluding current)
    const relatedInclude: Prisma.CafeInclude = {
      photos: {
        where: { isCover: true },
        take: 1,
      },
    };

    if (currentUserId) {
      relatedInclude.favorites = {
        where: { userId: currentUserId },
        take: 1,
      };
    }

    const relatedCafes = await prisma.cafe.findMany({
      where: {
        city: cafe.city,
        id: { not: cafe.id },
        status: 'PUBLISHED',
      },
      include: relatedInclude,
      take: 4,
    });

    const pendingClaim = currentUserId && !cafe.ownerId
      ? await prisma.cafeOwnerClaim.findFirst({ where: { cafeId: cafe.id, userId: currentUserId, status: 'PENDING' } })
      : null;

    return {
      ...cafe,
      claimStatus: cafe.ownerId === currentUserId ? 'MANAGED' : cafe.ownerId ? 'OWNED' : pendingClaim ? 'PENDING' : 'AVAILABLE',
      relatedCafes,
    };
  }

  async createCafe(data: Prisma.CafeCreateInput) {
    let slug = data.slug || generateSlug(data.name);
    
    // Handle duplicate slugs
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.cafeRepository.existsBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }
    
    return this.cafeRepository.create({
      ...data,
      slug: uniqueSlug,
    });
  }

  async updateCafe(id: string, data: Prisma.CafeUpdateInput) {
    return this.cafeRepository.update(id, data);
  }

  async deleteCafe(id: string) {
    return this.cafeRepository.delete(id);
  }
}
