import { prisma } from '../config/database.js';
import { ClaimStatus, Prisma } from '@prisma/client';

const claimInclude = {
  cafe: { include: { photos: { where: { isCover: true }, take: 1 } } },
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } },
};

export class ClaimRepository {
  async findByUserId(userId: string) {
    return prisma.cafeOwnerClaim.findMany({
      where: { userId },
      include: claimInclude,
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findById(id: string) {
    return prisma.cafeOwnerClaim.findUnique({
      where: { id },
      include: claimInclude,
    });
  }

  async findByIdForUser(id: string, userId: string) {
    return prisma.cafeOwnerClaim.findFirst({
      where: { id, userId },
      include: claimInclude,
    });
  }

  async findAll(filters: { status?: ClaimStatus; search?: string; page: number; limit: number }) {
    const { status, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CafeOwnerClaimWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { cafe: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.cafeOwnerClaim.count({ where }),
      prisma.cafeOwnerClaim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: claimInclude,
      }),
    ]);

    return { total, data };
  }
}
