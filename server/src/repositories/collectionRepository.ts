import { prisma } from '../config/database.js';
import { CollectionVisibility, Prisma } from '@prisma/client';

export interface CollectionFilters {
  userId?: string;
  visibility?: CollectionVisibility;
  search?: string;
  page?: number;
  limit?: number;
}

export class CollectionRepository {
  async createCollection(data: Prisma.UserCollectionCreateInput) {
    return prisma.userCollection.create({
      data,
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  }

  async findCollectionById(id: string) {
    return prisma.userCollection.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }
        },
        _count: {
          select: { items: true }
        }
      }
    });
  }

  async findCollectionBySlug(userId: string, slug: string) {
    return prisma.userCollection.findUnique({
      where: {
        userId_slug: {
          userId,
          slug
        }
      },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  }

  async findPublicCollection(username: string, slug: string) {
    return prisma.userCollection.findFirst({
      where: {
        slug,
        visibility: 'PUBLIC',
        user: {
          name: username // Assuming name is used as slug part or we use name for now
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        items: {
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
        },
        _count: {
          select: { items: true }
        }
      }
    });
  }

  async updateCollection(id: string, data: Prisma.UserCollectionUpdateInput) {
    return prisma.userCollection.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { items: true }
        }
      }
    });
  }

  async deleteCollection(id: string) {
    return prisma.userCollection.delete({
      where: { id }
    });
  }

  async findUserCollections(filters: CollectionFilters) {
    const { userId, visibility, search, page = 1, limit = 12 } = filters;

    const where: Prisma.UserCollectionWhereInput = {
      userId,
      visibility,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [data, total] = await Promise.all([
      prisma.userCollection.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { items: true }
          },
          items: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
            include: {
              cafe: {
                include: {
                  photos: {
                    where: { isCover: true },
                    take: 1
                  }
                }
              }
            }
          }
        }
      }),
      prisma.userCollection.count({ where })
    ]);

    return { data, total };
  }

  async addItem(collectionId: string, cafeId: string, note?: string) {
    // Get current max sortOrder
    const lastItem = await prisma.userCollectionItem.findFirst({
      where: { collectionId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    });

    const nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

    return prisma.userCollectionItem.create({
      data: {
        collectionId,
        cafeId,
        note,
        sortOrder: nextSortOrder
      }
    });
  }

  async removeItem(collectionId: string, cafeId: string) {
    return prisma.userCollectionItem.delete({
      where: {
        collectionId_cafeId: {
          collectionId,
          cafeId
        }
      }
    });
  }

  async updateItem(itemId: string, data: Prisma.UserCollectionItemUpdateInput) {
    return prisma.userCollectionItem.update({
      where: { id: itemId },
      data
    });
  }

  async findCollectionItems(collectionId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      prisma.userCollectionItem.findMany({
        where: { collectionId },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          cafe: {
            include: {
              photos: {
                where: { isCover: true },
                take: 1
              }
            }
          }
        }
      }),
      prisma.userCollectionItem.count({ where: { collectionId } })
    ]);

    return { data, total };
  }

  async findItemByCafeId(collectionId: string, cafeId: string) {
    return prisma.userCollectionItem.findUnique({
      where: {
        collectionId_cafeId: {
          collectionId,
          cafeId
        }
      }
    });
  }

  async reorderItems(collectionId: string, itemIds: string[]) {
    return prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.userCollectionItem.update({
          where: { id, collectionId },
          data: { sortOrder: index }
        })
      )
    );
  }
}
