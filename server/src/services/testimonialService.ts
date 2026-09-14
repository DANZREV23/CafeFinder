import { TestimonialRepository } from '../repositories/testimonialRepository.js';

export class TestimonialService {
  private testimonialRepository: TestimonialRepository;

  constructor() {
    this.testimonialRepository = new TestimonialRepository();
  }

  async getActiveTestimonials(limit?: number) {
    return this.testimonialRepository.findAll(limit);
  }
}
