import { cafeRepository } from '../repositories/cafe.repository.js';

export class CafeService {
  async getAllCafes(page: number = 1, limit: number = 12) {
    const { data, total } = await cafeRepository.findAll(page, limit);
    
    return {
      cafes: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCafeBySlug(slug: string) {
    const cafe = await cafeRepository.findBySlug(slug);
    if (!cafe) {
      throw new Error('Cafe not found');
    }
    return cafe;
  }

  // Future methods for authenticated actions
  async createCafe(cafeData: any, userId: number) {
    // Logic for validation and ownership
    return await cafeRepository.create({ ...cafeData, ownerId: userId });
  }

  async updateCafe(id: number, cafeData: any, userId: number) {
    const cafe = await cafeRepository.findById(id);
    if (!cafe) throw new Error('Cafe not found');
    if (cafe.ownerId !== userId) throw new Error('Unauthorized');
    
    return await cafeRepository.update(id, cafeData);
  }
}

export const cafeService = new CafeService();
