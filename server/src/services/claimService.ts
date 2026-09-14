import { ClaimRepository } from '../repositories/claimRepository.js';
import { CreateClaimDto, ClaimResponseDto } from '../dtos/claimDto.js';
import { ClaimStatus, Role } from '@prisma/client';
import { prisma } from '../config/database.js';

export class ClaimService {
  private claimRepository: ClaimRepository;

  constructor() {
    this.claimRepository = new ClaimRepository();
  }

  async submitClaim(userId: string, data: CreateClaimDto): Promise<ClaimResponseDto> {
    // Check if cafe already has an owner
    const cafe = await prisma.cafe.findUnique({
      where: { id: data.cafeId }
    });

    if (!cafe) {
      throw new Error('Cafe not found');
    }

    if (cafe.ownerId) {
      throw new Error('This cafe is already claimed and verified');
    }

    // Check if there's already a pending claim for this cafe by this user
    const existingClaim = await this.claimRepository.findPendingByCafeId(data.cafeId);
    if (existingClaim) {
      throw new Error('There is already a pending claim for this cafe');
    }

    const claim = await this.claimRepository.create({
      userId,
      ...data
    });

    return this.mapToDto(claim as any);
  }

  async getPendingClaims(): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.findAllPending();
    return claims.map(c => this.mapToDto(c));
  }

  async reviewClaim(adminId: string, claimId: string, status: ClaimStatus): Promise<ClaimResponseDto> {
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new Error('This claim has already been processed');
    }

    return await prisma.$transaction(async (tx) => {
      const updatedClaim = await tx.cafeOwnerClaim.update({
        where: { id: claimId },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy: adminId
        },
        include: {
          cafe: true,
          user: true
        }
      });

      if (status === ClaimStatus.APPROVED) {
        // Assign owner to cafe
        await tx.cafe.update({
          where: { id: claim.cafeId },
          data: {
            ownerId: claim.userId,
            verified: true,
            status: 'PUBLISHED' // Ensure it's published if approved
          }
        });

        // Update user role to OWNER if they are currently a USER
        if (claim.user.role === Role.USER) {
          await tx.user.update({
            where: { id: claim.userId },
            data: { role: Role.OWNER }
          });
        }
      }

      return this.mapToDto(updatedClaim);
    });
  }

  async getUserClaims(userId: string): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.findByUserId(userId);
    return claims.map(c => this.mapToDto(c));
  }

  private mapToDto(claim: any): ClaimResponseDto {
    return {
      id: claim.id,
      cafeId: claim.cafeId,
      cafeName: claim.cafe?.name || 'Unknown',
      userId: claim.userId,
      userName: claim.user?.name || 'Unknown',
      businessName: claim.businessName,
      verificationInformation: claim.verificationInformation,
      status: claim.status,
      submittedAt: claim.submittedAt,
      reviewedAt: claim.reviewedAt,
      reviewedBy: claim.reviewedBy
    };
  }
}
