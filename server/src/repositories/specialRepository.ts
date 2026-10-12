import { prisma } from '../config/database.js';
import { Prisma, TimeSensitiveStatus, SpecialType } from '@prisma/client';

export class SpecialRepository {
  async findById(id: string) {
    return prisma.cafeSpecial.findUnique({
      where: { id },
      include: { cafe: true }
    });
  }

  async findByCafeId(cafeId: string, status?: TimeSensitiveStatus) {
    return prisma.cafeSpecial.findMany({
      where: {
        cafeId,
        ...(status ? { status } : {})
      },
      orderBy: { startAt: 'asc' }
    });
  }

  async create(data: Prisma.CafeSpecialCreateInput) {
    return prisma.cafeSpecial.create({ data });
  }

  async update(id: string, data: Prisma.CafeSpecialUpdateInput) {
    return prisma.cafeSpecial.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.cafeSpecial.delete({
      where: { id }
    });
  }
}
