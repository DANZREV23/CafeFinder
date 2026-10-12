import { CollectionRepository, CollectionFilters } from '../repositories/collectionRepository.js';
import { CafeRepository } from '../repositories/cafeRepository.js';
import { prisma } from '../config/database.js';
import { CollectionVisibility } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class CollectionService {
  private repository = new CollectionRepository();
  private cafeRepository = new CafeRepository();

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || uuidv4().split('-')[0];
  }

  async createCollection(userId: string, data: { name: string; description?: string; visibility?: CollectionVisibility }) {
    const slug = this.generateSlug(data.name);
    
    // Check for slug collision for this user
    let finalSlug = slug;
    let counter = 1;
    while (await this.repository.findCollectionBySlug(userId, finalSlug)) {
      finalSlug = `${slug}-${counter++}`;
    }

    const collection = await this.repository.createCollection({
      name: data.name,
      slug: finalSlug,
      description: data.description,
      visibility: data.visibility || 'PRIVATE',
      user: { connect: { id: userId } }
    });

    return collection;
  }

  async getCollection(userId: string, id: string) {
    const collection = await this.repository.findCollectionById(id);
    if (!collection || collection.userId !== userId) {
      throw { status: 404, message: 'Collection not found.' };
    }
    return collection;
  }

  async updateCollection(userId: string, id: string, data: { name?: string; description?: string; visibility?: CollectionVisibility; coverCafeId?: string }) {
    const collection = await this.getCollection(userId, id);

    const updateData: any = { ...data };
    if (data.name && data.name !== collection.name) {
      // Slugs are stable once public? The requirement says "If a collection becomes public, changing its title should not automatically break existing public links."
      // So maybe we only generate slug on creation or when it's still private?
      if (collection.visibility === 'PRIVATE') {
        const slug = this.generateSlug(data.name);
        let finalSlug = slug;
        let counter = 1;
        while (await this.repository.findCollectionBySlug(userId, finalSlug)) {
          if (finalSlug === collection.slug) break;
          finalSlug = `${slug}-${counter++}`;
        }
        updateData.slug = finalSlug;
      }
    }

    const updated = await this.repository.updateCollection(id, updateData);

    return updated;
  }

  async deleteCollection(userId: string, id: string) {
    await this.getCollection(userId, id);
    return this.repository.deleteCollection(id);
  }

  async getUserCollections(userId: string, filters: CollectionFilters) {
    return this.repository.findUserCollections({ ...filters, userId });
  }

  async addCafeToCollection(userId: string, collectionId: string, cafeId: string, note?: string) {
    await this.getCollection(userId, collectionId);
    
    const cafe = await this.cafeRepository.findById(cafeId);
    if (!cafe || cafe.status !== 'PUBLISHED') {
      throw { status: 404, message: 'Cafe not found or not published.' };
    }

    const existing = await this.repository.findItemByCafeId(collectionId, cafeId);
    if (existing) {
      throw { status: 400, message: 'Cafe already in collection.' };
    }

    const item = await this.repository.addItem(collectionId, cafeId, note);

    return item;
  }

  async removeCafeFromCollection(userId: string, collectionId: string, cafeId: string) {
    await this.getCollection(userId, collectionId);
    
    const item = await this.repository.removeItem(collectionId, cafeId);

    return item;
  }

  async getCollectionItems(userId: string, collectionId: string, page?: number, limit?: number) {
    await this.getCollection(userId, collectionId);
    return this.repository.findCollectionItems(collectionId, page, limit);
  }

  async reorderCollectionItems(userId: string, collectionId: string, itemIds: string[]) {
    await this.getCollection(userId, collectionId);
    return this.repository.reorderItems(collectionId, itemIds);
  }

  async updateItemNote(userId: string, collectionId: string, cafeId: string, note: string) {
    await this.getCollection(userId, collectionId);
    const item = await this.repository.findItemByCafeId(collectionId, cafeId);
    if (!item) throw { status: 404, message: 'Item not found in collection.' };
    
    return this.repository.updateItem(item.id, { note });
  }

  async getPublicCollection(username: string, slug: string) {
    const collection = await this.repository.findPublicCollection(username, slug);
    if (!collection) {
      throw { status: 404, message: 'Collection not found.' };
    }

    // Filter out unpublished cafes (already handled by repo findMany if we want, but repo is doing include)
    // Actually, repo findPublicCollection includes items. Let's make sure only published cafes are shown.
    collection.items = collection.items.filter(item => item.cafe.status === 'PUBLISHED');

    return collection;
  }
}
