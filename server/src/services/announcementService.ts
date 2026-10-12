import { AnnouncementRepository } from '../repositories/announcementRepository.js';
import { PromotionService } from './promotionService.js';
import { Prisma, TimeSensitiveStatus } from '@prisma/client';

export class AnnouncementService {
  private repository = new AnnouncementRepository();
  private promotionService = new PromotionService();

  async getCafeAnnouncements(cafeId: string, status?: TimeSensitiveStatus) {
    return this.repository.findByCafeId(cafeId, status);
  }

  async getAnnouncementById(id: string) {
    return this.repository.findById(id);
  }

  async createAnnouncement(data: any) {
    const announcement = await this.repository.create({
      ...data,
      status: TimeSensitiveStatus.DRAFT
    });
    return announcement;
  }

  async updateAnnouncement(id: string, data: any) {
    return this.repository.update(id, data);
  }

  async publishAnnouncement(id: string) {
    return this.promotionService.publishAnnouncement(id);
  }

  async deleteAnnouncement(id: string) {
    return this.repository.delete(id);
  }
}
