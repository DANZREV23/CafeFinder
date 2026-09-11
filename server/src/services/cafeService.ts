import { CafeRepository, CafeFilters } from '../repositories/cafeRepository.js';
import { generateSlug } from '../utils/slug.js';
import { Prisma } from '@prisma/client';

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

  async getCafeBySlug(slug: string) {
    const cafe = await this.cafeRepository.findBySlug(slug);
    if (!cafe || cafe.status !== 'PUBLISHED') {
      return null;
    }
    return cafe;
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
