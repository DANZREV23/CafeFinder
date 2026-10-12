import { prisma } from '../config/database.js';
import { Prisma, TimeSensitiveStatus, AnnouncementPriority } from '@prisma/client';

export class AnnouncementRepository {
  async findById(id: string) {
    return prisma.cafeAnnouncement.findUnique({
      where: { id },
      include: { cafe: true }
    });
  }

  async findByCafeId(cafeId: string, status?: TimeSensitiveStatus) {
    return prisma.cafeAnnouncement.findMany({
      where: {
        cafeId,
        ...(status ? { status } : {})
      },
      orderBy: { startAt: 'desc' }
    });
  }

  async create(data: Prisma.CafeAnnouncementCreateInput) {
    return prisma.cafeAnnouncement.create({ data });
  }

  async update(id: string, data: Prisma.CafeAnnouncementUpdateInput) {
    return prisma.cafeAnnouncement.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return prisma.cafeAnnouncement.delete({
      where: { id }
    });
  }
}
