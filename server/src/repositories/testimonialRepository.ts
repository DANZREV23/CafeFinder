import { prisma } from '../config/database.js';
import { Prisma, TestimonialStatus } from '@prisma/client';

export class TestimonialRepository {
  async findActive(limit?: number) {
    return prisma.testimonial.findMany({
      where: { status: TestimonialStatus.PUBLISHED },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findAll() {
    return prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.testimonial.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.TestimonialCreateInput) {
    return prisma.testimonial.create({
      data,
    });
  }

  async update(id: string, data: Prisma.TestimonialUpdateInput) {
    return prisma.testimonial.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.testimonial.delete({
      where: { id },
    });
  }
}
