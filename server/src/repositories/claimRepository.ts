import { ClaimStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

const claimInclude = {
  cafe: { include: { photos: { where: { isCover: true }, take: 1 } } },
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } }
} satisfies Prisma.CafeOwnerClaimInclude;

export class ClaimRepository {
  async findById(id: string) { return prisma.cafeOwnerClaim.findUnique({ where: { id }, include: claimInclude }); }
  async findByIdForUser(id: string, userId: string) { return prisma.cafeOwnerClaim.findFirst({ where: { id, userId }, include: claimInclude }); }
  async findByUserId(userId: string) { return prisma.cafeOwnerClaim.findMany({ where: { userId }, include: claimInclude, orderBy: { submittedAt: 'desc' } }); }
  async findAll(filters: { status?: ClaimStatus; search?: string; page: number; limit: number }) {
    const { status, search, page, limit } = filters;
    const where: Prisma.CafeOwnerClaimWhereInput = {
      ...(status && { status }),
      ...(search && { OR: [
        { cafe: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { businessName: { contains: search, mode: 'insensitive' } }
      ] })
    };
    const [data, total] = await Promise.all([
      prisma.cafeOwnerClaim.findMany({ where, include: claimInclude, orderBy: { submittedAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.cafeOwnerClaim.count({ where })
    ]);
    return { data, total };
  }
}
