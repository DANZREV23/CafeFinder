import { prisma } from '../config/database.js';

export class TestimonialRepository {
  async findAll(limit: number = 10) {
    const safeLimit = Math.max(limit, 1);
    return prisma.testimonial.findMany({
      where: { status: 'ACTIVE' },
      take: safeLimit,
      orderBy: { createdAt: 'desc' }
    });
  }
}
