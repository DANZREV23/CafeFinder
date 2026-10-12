import { EventRepository } from '../repositories/eventRepository.js';
import { PromotionService } from './promotionService.js';
import { Prisma, TimeSensitiveStatus } from '@prisma/client';

export class EventService {
  private repository = new EventRepository();
  private promotionService = new PromotionService();

  async getCafeEvents(cafeId: string, status?: TimeSensitiveStatus) {
    return this.repository.findByCafeId(cafeId, status);
  }

  async getEventById(id: string) {
    return this.repository.findById(id);
  }

  async createEvent(data: any) {
    const event = await this.repository.create({
      ...data,
      status: TimeSensitiveStatus.DRAFT
    });
    return event;
  }

  async updateEvent(id: string, data: any) {
    return this.repository.update(id, data);
  }

  async publishEvent(id: string) {
    return this.promotionService.publishEvent(id);
  }

  async deleteEvent(id: string) {
    return this.repository.delete(id);
  }
}
