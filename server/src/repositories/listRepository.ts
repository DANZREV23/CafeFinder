import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export interface ListFilters {
  featured?: boolean;
  limit?: number;
}

export class CuratedListRepository {
  async findAll(filters: ListFilters = {}) {
    const { featured, limit } = filters;
    
    const where: Prisma.CuratedListWhereInput = {};
    
    if (featured !== undefined) {
      where.featured = featured;
    }

    return prisma.curatedList.findMany({
      where,
      include: {
        _count: {
          select: { cafes: true }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findBySlug(slug: string) {
    return prisma.curatedList.findUnique({
      where: { slug },
      include: {
        cafes: {
          include: {
            cafe: {
              include: {
                photos: {
                  where: { isCover: true },
                  take: 1
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }
}
