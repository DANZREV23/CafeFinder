import { prisma } from '../config/database.js';

export class TestimonialRepository {
  async findAll(limit?: number) {
    return prisma.testimonial.findMany({
      where: { status: 'ACTIVE' },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
  }
}
