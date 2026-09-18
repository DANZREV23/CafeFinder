import { prisma } from '../config/database.js';
import { Prisma, PostStatus, CafeStatus } from '@prisma/client';

export interface ListFilters {
  status?: PostStatus;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class CuratedListRepository {
  async findAll(filters: ListFilters = {}) {
    const { status, featured, search, limit = 12, offset = 0 } = filters;
    
    const where: Prisma.CuratedListWhereInput = {};
    
    if (status) where.status = status;
    if (featured !== undefined) where.featured = featured;
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [lists, total] = await Promise.all([
      prisma.curatedList.findMany({
        where,
        include: {
          _count: {
            select: { cafes: true }
          }
        },
        take: limit,
        skip: offset,
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.curatedList.count({ where })
    ]);

    return { lists, total };
  }

  async findBySlug(slug: string, publicOnly = true) {
    const where: Prisma.CuratedListWhereInput = { slug };
    if (publicOnly) where.status = PostStatus.PUBLISHED;

    return prisma.curatedList.findUnique({
      where: { slug },
      include: {
        cafes: {
          where: publicOnly ? {
            cafe: { status: CafeStatus.PUBLISHED }
          } : undefined,
          include: {
            cafe: {
              include: {
                photos: {
                  where: { isCover: true },
                  take: 1
                },
                amenities: {
                  include: { amenity: true }
                }
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.curatedList.findUnique({
      where: { id },
      include: {
        cafes: {
          include: {
            cafe: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async create(data: Prisma.CuratedListCreateInput) {
    return prisma.curatedList.create({
      data
    });
  }

  async update(id: string, data: Prisma.CuratedListUpdateInput) {
    return prisma.curatedList.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.curatedList.deleteMany({
      where: { id }
    });
  }

  async addCafe(listId: string, cafeId: string, sortOrder = 0, editorialNote?: string) {
    return prisma.curatedListCafe.create({
      data: {
        listId,
        cafeId,
        sortOrder,
        editorialNote
      }
    });
  }

  async removeCafe(listId: string, cafeId: string) {
    return prisma.curatedListCafe.deleteMany({
      where: {
        listId,
        cafeId
      }
    });
  }

  async updateCafeOrder(listId: string, cafeId: string, sortOrder: number, editorialNote?: string) {
    return prisma.curatedListCafe.update({
      where: {
        listId_cafeId: {
          listId,
          cafeId
        }
      },
      data: {
        sortOrder,
        editorialNote
      }
    });
  }
}
