import { CuratedListRepository, ListFilters } from '../repositories/listRepository.js';
import { generateSlug } from '../utils/slug.js';
import { PostStatus, Prisma } from '@prisma/client';

export class CuratedListService {
  private listRepository: CuratedListRepository;

  constructor() {
    this.listRepository = new CuratedListRepository();
  }

  async getPublishedLists(filters: ListFilters = {}) {
    return this.listRepository.findAll({
      ...filters,
      status: PostStatus.PUBLISHED
    });
  }

  async getListBySlug(slug: string) {
    return this.listRepository.findBySlug(slug, true);
  }

  // Admin Methods
  async getAdminLists(filters: ListFilters) {
    return this.listRepository.findAll(filters);
  }

  async getListById(id: string) {
    return this.listRepository.findById(id);
  }

  async createList(data: any) {
    const slug = generateSlug(data.title);
    
    // Ensure slug uniqueness
    let finalSlug = slug;
    let count = 1;
    while (await this.listRepository.findBySlug(finalSlug, false)) {
      finalSlug = `${slug}-${++count}`;
    }

    return this.listRepository.create({
      title: data.title,
      slug: finalSlug,
      description: data.description,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      featured: data.featured || false,
      status: PostStatus.DRAFT,
      sortOrder: data.sortOrder || 0
    });
  }

  async updateList(id: string, data: any) {
    const updateData: Prisma.CuratedListUpdateInput = {
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      coverImageAlt: data.coverImageAlt,
      featured: data.featured,
      sortOrder: data.sortOrder,
      updatedAt: new Date()
    };

    if (data.title) {
      const list = await this.listRepository.findById(id);
      if (list && list.status === PostStatus.DRAFT) {
        updateData.slug = generateSlug(data.title);
      }
    }

    return this.listRepository.update(id, updateData);
  }

  async updateStatus(id: string, status: PostStatus) {
    return this.listRepository.update(id, { status });
  }

  async deleteList(id: string) {
    return this.listRepository.delete(id);
  }

  async addCafeToList(listId: string, cafeId: string, sortOrder = 0, editorialNote?: string) {
    return this.listRepository.addCafe(listId, cafeId, sortOrder, editorialNote);
  }

  async removeCafeFromList(listId: string, cafeId: string) {
    return this.listRepository.removeCafe(listId, cafeId);
  }

  async updateCafeAssociation(listId: string, cafeId: string, sortOrder: number, editorialNote?: string) {
    return this.listRepository.updateCafeOrder(listId, cafeId, sortOrder, editorialNote);
  }
}
