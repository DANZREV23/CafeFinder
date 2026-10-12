import { prisma } from '../config/database.js';
import { Prisma, TimeSensitiveStatus, EventType } from '@prisma/client';

export class EventRepository {
  async findById(id: string) {
    return prisma.cafeEvent.findUnique({
      where: { id },
      include: { cafe: true }
    });
  }

  async findByCafeId(cafeId: string, status?: TimeSensitiveStatus) {
    return prisma.cafeEvent.findMany({
      where: {
        cafeId,
        ...(status ? { status } : {})
      },
      orderBy: { startAt: 'asc' }
    });
  }

  async create(data: Prisma.CafeEventCreateInput) {
    return prisma.cafeEvent.create({ data });
  }

  async update(id: string, data: Prisma.CafeEventUpdateInput) {
    return prisma.cafeEvent.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.cafeEvent.delete({
      where: { id }
    });
  }
}
