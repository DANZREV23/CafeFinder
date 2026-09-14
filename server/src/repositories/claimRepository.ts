import { prisma } from '../config/database.js';
import { ClaimStatus, CafeOwnerClaim } from '@prisma/client';

export class ClaimRepository {
  async create(data: {
    cafeId: string;
    userId: string;
    businessName: string;
    verificationInformation: string;
  }): Promise<CafeOwnerClaim> {
    return prisma.cafeOwnerClaim.create({
      data: {
        cafeId: data.cafeId,
        userId: data.userId,
        businessName: data.businessName,
        verificationInformation: data.verificationInformation,
        status: ClaimStatus.PENDING
      }
    });
  }

  async findById(id: string) {
    return prisma.cafeOwnerClaim.findUnique({
      where: { id },
      include: {
        cafe: true,
        user: true
      }
    });
  }

  async findPendingByCafeId(cafeId: string) {
    return prisma.cafeOwnerClaim.findFirst({
      where: {
        cafeId,
        status: ClaimStatus.PENDING
      }
    });
  }

  async findAllPending() {
    return prisma.cafeOwnerClaim.findMany({
      where: {
        status: ClaimStatus.PENDING
      },
      include: {
        cafe: true,
        user: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
  }

  async updateStatus(id: string, status: ClaimStatus, reviewedBy: string): Promise<CafeOwnerClaim> {
    return prisma.cafeOwnerClaim.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy
      }
    });
  }

  async findByUserId(userId: string) {
    return prisma.cafeOwnerClaim.findMany({
      where: { userId },
      include: {
        cafe: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
  }
}
