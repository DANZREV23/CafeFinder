import { CafeRepository, CafeFilters } from '../repositories/cafeRepository.js';
import { generateSlug } from '../utils/slug.js';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { UserCafeViewRepository } from '../repositories/userCafeViewRepository.js';
import { sanitizePlain } from '../utils/sanitization.js';
import { EditorialService } from './editorialService.js';
import { recommendationService } from './recommendationService.js';

const editorialService = new EditorialService();

export class CafeService {
  private cafeRepository: CafeRepository;
  private userCafeViewRepository = new UserCafeViewRepository();

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
      curatedList: {
        where: {
          list: { status: 'PUBLISHED' }
        },
        include: {
          list: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true
            }
          }
        }
      },
      events: {
        where: {
          status: 'PUBLISHED',
          endAt: { gte: new Date() },
        },
        orderBy: { startAt: 'asc' },
        take: 10,
      },
      specials: {
        where: {
          status: 'PUBLISHED',
          endAt: { gte: new Date() },
        },
        orderBy: { startAt: 'asc' },
        take: 10,
      },
      announcements: {
        where: {
          status: 'PUBLISHED',
          OR: [{ endAt: null }, { endAt: { gte: new Date() } }],
        },
        orderBy: [{ priority: 'desc' }, { startAt: 'desc' }],
        take: 5,
      },
      loyaltyProgram: true,
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

    // Record view if user is logged in
    let userView = null;
    if (currentUserId) {
      userView = await this.userCafeViewRepository.upsert(currentUserId, cafe.id);
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

    const relatedCafes = await recommendationService.getSimilarCafes(cafe.id, 4, currentUserId);

    const userClaim = currentUserId
      ? await prisma.cafeOwnerClaim.findFirst({
          where: { cafeId: cafe.id, userId: currentUserId },
          orderBy: { submittedAt: 'desc' },
        })
      : null;

    const userCheckIn = currentUserId
      ? await prisma.cafeVisitCheckIn.findFirst({
          where: {
            program: { cafeId: cafe.id },
            account: { userId: currentUserId },
          },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    let claimStatus: 'MANAGED' | 'OWNED' | 'PENDING' | 'AVAILABLE' = 'AVAILABLE';
    if (cafe.ownerId && cafe.ownerId === currentUserId) {
      claimStatus = 'MANAGED';
    } else if (userClaim?.status === 'PENDING') {
      claimStatus = 'PENDING';
    } else if (cafe.ownerId) {
      claimStatus = 'OWNED';
    } else {
      claimStatus = 'AVAILABLE';
    }

    return {
      ...cafe,
      claimStatus,
      isVisited: Boolean(userView || userCheckIn),
      visitedAt: userCheckIn?.createdAt || userView?.viewedAt || null,
      relatedCafes,
    };
  }

  async getCafeById(id: string) {
    return this.cafeRepository.findById(id);
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
      name: sanitizePlain(data.name),
      shortDescription: data.shortDescription ? sanitizePlain(data.shortDescription) : undefined,
      description: data.description ? sanitizePlain(data.description) : undefined,
      address: sanitizePlain(data.address),
      city: sanitizePlain(data.city),
      slug: uniqueSlug,
    });
  }

  async updateCafe(id: string, data: Prisma.CafeUpdateInput, authorId?: string) {
    const sanitizedData = { ...data };
    if (typeof data.name === 'string') sanitizedData.name = sanitizePlain(data.name);
    if (typeof data.shortDescription === 'string') sanitizedData.shortDescription = sanitizePlain(data.shortDescription);
    if (typeof data.description === 'string') sanitizedData.description = sanitizePlain(data.description);
    if (typeof data.address === 'string') sanitizedData.address = sanitizePlain(data.address);
    if (typeof data.city === 'string') sanitizedData.city = sanitizePlain(data.city);

    const updatedCafe = await this.cafeRepository.update(id, sanitizedData);

    // Create revision
    await editorialService.createRevision({
      entityType: 'Cafe',
      entityId: id,
      snapshot: updatedCafe,
      authorId
    });

    return updatedCafe;
  }

  async deleteCafe(id: string) {
    return this.cafeRepository.delete(id);
  }
}
