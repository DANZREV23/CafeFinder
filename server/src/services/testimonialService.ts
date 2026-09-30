import { TestimonialRepository } from '../repositories/testimonialRepository.js';
import { TestimonialStatus } from '@prisma/client';

export class TestimonialService {
  private testimonialRepository: TestimonialRepository;

  constructor() {
    this.testimonialRepository = new TestimonialRepository();
  }

  async getActiveTestimonials(limit?: number) {
    return this.testimonialRepository.findActive(limit);
  }

  async getAllTestimonials() {
    return this.testimonialRepository.findAll();
  }

  async getTestimonialById(id: string) {
    return this.testimonialRepository.findById(id);
  }

  async createTestimonial(data: any) {
    return this.testimonialRepository.create(data);
  }

  async updateTestimonial(id: string, data: any) {
    return this.testimonialRepository.update(id, data);
  }

  async deleteTestimonial(id: string) {
    return this.testimonialRepository.delete(id);
  }
}
