import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

export class SessionRepository {
  async create(data: Prisma.SessionCreateInput) {
    return prisma.session.create({
      data,
    });
  }

  async findByTokenHash(tokenHash: string) {
    return prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            avatarUrl: true,
            bio: true,
            isProfilePublic: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.session.delete({
      where: { id },
    });
  }

  async deleteByTokenHash(tokenHash: string) {
    return prisma.session.delete({
      where: { tokenHash },
    });
  }

  async deleteExpired() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async deleteUserSessions(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }
}
