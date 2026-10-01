import { prisma } from '../config/database.js';
import { generateSlug } from '../utils/slug.js';
import { sanitizePlain } from '../utils/sanitization.js';

const cafeInclude = {
  photos: { where: { isCover: true }, take: 1 },
} as const;

function mapCafe(cafe: any) {
  return {
    id: cafe.id,
    name: cafe.name,
    slug: cafe.slug,
    city: cafe.city,
    address: cafe.address,
    shortDescription: cafe.shortDescription,
    ratingAverage: Number(cafe.ratingAverage),
    reviewCount: cafe.reviewCount,
    photos: (cafe.photos || []).map((photo: any) => ({ url: photo.url, isCover: photo.isCover })),
  };
}

function mapCollection(collection: any, includeItems = true) {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    visibility: collection.visibility,
    coverCafeId: collection.coverCafeId,
    publishedAt: collection.publishedAt,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    itemCount: collection._count?.items ?? collection.items?.length ?? 0,
    items: includeItems ? (collection.items || []).map((item: any) => ({
      id: item.id,
      cafeId: item.cafeId,
      note: item.note,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      cafe: mapCafe(item.cafe),
    })) : undefined,
  };
}

export class CollectionService {
  private async uniqueSlug(name: string, existingId?: string) {
    const base = generateSlug(name) || 'collection';
    let slug = base;
    let suffix = 2;
    while (true) {
      const existing = await prisma.userCollection.findUnique({ where: { slug } });
      if (!existing || existing.id === existingId) return slug;
      slug = `${base}-${suffix++}`;
    }
  }

  private async getOwned(userId: string, id: string) {
    const collection = await prisma.userCollection.findFirst({ where: { id, userId } });
    if (!collection) throw { status: 404, message: 'Collection not found.' };
    return collection;
  }

  async listMine(userId: string) {
    const collections = await prisma.userCollection.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
        items: { select: { cafeId: true } },
        coverCafe: { include: cafeInclude },
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });

    return collections.map((collection: any) => ({
      ...mapCollection(collection, false),
      itemCafeIds: collection.items.map((item: any) => item.cafeId),
      coverCafe: collection.coverCafe?.status === 'PUBLISHED' ? mapCafe(collection.coverCafe) : null,
    }));
  }

  async create(userId: string, input: { name: string; description?: string | null; visibility?: 'PRIVATE' | 'PUBLIC' }) {
    const name = sanitizePlain(input.name).trim();
    if (!name) throw { status: 400, message: 'Collection name is required.' };
    const visibility = input.visibility || 'PRIVATE';
    const collection = await prisma.userCollection.create({
      data: {
        userId,
        name,
        slug: await this.uniqueSlug(name),
        description: input.description ? sanitizePlain(input.description).trim() : null,
        visibility,
        publishedAt: visibility === 'PUBLIC' ? new Date() : null,
      },
    });
    return mapCollection(collection, false);
  }

  async getMine(userId: string, id: string) {
    const collection = await prisma.userCollection.findFirst({
      where: { userId, OR: [{ id }, { slug: id }] },
      include: {
        items: {
          where: { cafe: { status: 'PUBLISHED' } },
          include: { cafe: { include: cafeInclude } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { items: true } },
      },
    });
    if (!collection) throw { status: 404, message: 'Collection not found.' };
    return mapCollection(collection);
  }

  async update(userId: string, id: string, input: { name?: string; description?: string | null; visibility?: 'PRIVATE' | 'PUBLIC'; coverCafeId?: string | null }) {
    const collection = await this.getOwned(userId, id);
    const data: any = {};
    if (input.name !== undefined) {
      const name = sanitizePlain(input.name).trim();
      if (!name) throw { status: 400, message: 'Collection name is required.' };
      data.name = name;
    }
    if (input.description !== undefined) data.description = input.description ? sanitizePlain(input.description).trim() : null;
    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
      data.publishedAt = input.visibility === 'PUBLIC' ? (collection.publishedAt || new Date()) : null;
    }
    if (input.coverCafeId !== undefined) {
      if (input.coverCafeId) {
        const item = await prisma.userCollectionItem.findUnique({ where: { collectionId_cafeId: { collectionId: id, cafeId: input.coverCafeId } } });
        if (!item) throw { status: 400, message: 'The cover cafe must belong to this collection.' };
      }
      data.coverCafeId = input.coverCafeId;
    }
    const updated = await prisma.userCollection.update({ where: { id }, data });
    return mapCollection(updated, false);
  }

  async remove(userId: string, id: string) {
    await this.getOwned(userId, id);
    await prisma.userCollection.delete({ where: { id } });
  }

  async addCafe(userId: string, id: string, cafeId: string, note?: string | null) {
    await this.getOwned(userId, id);
    const cafe = await prisma.cafe.findFirst({ where: { id: cafeId, status: 'PUBLISHED' }, include: cafeInclude });
    if (!cafe) throw { status: 404, message: 'Published cafe not found.' };
    const last = await prisma.userCollectionItem.findFirst({ where: { collectionId: id }, orderBy: { sortOrder: 'desc' } });
    const item = await prisma.userCollectionItem.upsert({
      where: { collectionId_cafeId: { collectionId: id, cafeId } },
      update: { note: note === undefined ? undefined : (note ? sanitizePlain(note).trim() : null) },
      create: { collectionId: id, cafeId, note: note ? sanitizePlain(note).trim() : null, sortOrder: (last?.sortOrder ?? -1) + 1 },
      include: { cafe: { include: cafeInclude } },
    });
    return { id: item.id, cafeId: item.cafeId, note: item.note, sortOrder: item.sortOrder, cafe: mapCafe(item.cafe) };
  }

  async updateItem(userId: string, id: string, itemId: string, note: string | null) {
    await this.getOwned(userId, id);
    const item = await prisma.userCollectionItem.updateMany({ where: { id: itemId, collectionId: id }, data: { note: note ? sanitizePlain(note).trim() : null } });
    if (!item.count) throw { status: 404, message: 'Collection item not found.' };
  }

  async removeCafe(userId: string, id: string, cafeId: string) {
    await this.getOwned(userId, id);
    await prisma.userCollectionItem.deleteMany({ where: { collectionId: id, cafeId } });
    await prisma.userCollection.updateMany({ where: { id, coverCafeId: cafeId }, data: { coverCafeId: null } });
  }

  async reorder(userId: string, id: string, itemIds: string[]) {
    await this.getOwned(userId, id);
    const items = await prisma.userCollectionItem.findMany({ where: { collectionId: id }, select: { id: true } });
    const allowed = new Set(items.map(item => item.id));
    if (itemIds.length !== items.length || new Set(itemIds).size !== itemIds.length || itemIds.some(itemId => !allowed.has(itemId))) {
      throw { status: 400, message: 'Reorder must include each collection item exactly once.' };
    }
    await prisma.$transaction(itemIds.map((itemId, index) => prisma.userCollectionItem.update({ where: { id: itemId }, data: { sortOrder: index } })));
  }

  async getPublic(slug: string) {
    const collection = await prisma.userCollection.findFirst({
      where: { slug, visibility: 'PUBLIC', user: { status: 'ACTIVE', isProfilePublic: true } },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        items: {
          where: { cafe: { status: 'PUBLISHED' } },
          include: { cafe: { include: cafeInclude } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!collection) throw { status: 404, message: 'Collection not found.' };
    return { ...mapCollection(collection), creator: collection.user };
  }
}
