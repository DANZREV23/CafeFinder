import { SpecialRepository } from '../repositories/specialRepository.js';
import { PromotionService } from './promotionService.js';
import { Prisma, TimeSensitiveStatus } from '@prisma/client';

export class SpecialService {
  private repository = new SpecialRepository();
  private promotionService = new PromotionService();

  async getCafeSpecials(cafeId: string, status?: TimeSensitiveStatus) {
    return this.repository.findByCafeId(cafeId, status);
  }

  async getSpecialById(id: string) {
    return this.repository.findById(id);
  }

  async createSpecial(data: any) {
    const special = await this.repository.create({
      ...data,
      status: TimeSensitiveStatus.DRAFT
    });
    return special;
  }

  async updateSpecial(id: string, data: any) {
    return this.repository.update(id, data);
  }

  async publishSpecial(id: string) {
    return this.promotionService.publishSpecial(id);
  }

  async deleteSpecial(id: string) {
    return this.repository.delete(id);
  }
}
