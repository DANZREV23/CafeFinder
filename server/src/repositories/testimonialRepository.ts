import { prisma } from '../config/database.js';
import { TestimonialStatus } from '@prisma/client';

export class TestimonialRepository {
  async findActive(limit: number = 10) {
    const safeLimit = Math.max(limit, 1);
    return prisma.testimonial.findMany({
      where: { status: TestimonialStatus.PUBLISHED },
      take: safeLimit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAll() {
    return prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string) {
    return prisma.testimonial.findUnique({
      where: { id }
    });
  }

  async create(data: any) {
    return prisma.testimonial.create({
      data: {
        ...data,
        status: data.status || TestimonialStatus.DRAFT
      }
    });
  }

  async update(id: string, data: any) {
    return prisma.testimonial.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.testimonial.delete({
      where: { id }
    });
  }
}
