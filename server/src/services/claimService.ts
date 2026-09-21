import { CreateClaimDto, UpdateClaimDto, ClaimResponseDto } from '../dtos/claimDto.js';
import { CafeStatus, ClaimStatus, Role, UserStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { ClaimRepository } from '../repositories/claimRepository.js';
import { ActivityLogService } from './activityLogService.js';
import { emailService } from './email/email.service.js';

const claimInclude = {
  cafe: { include: { photos: { where: { isCover: true }, take: 1 } } },
  user: { select: { id: true, name: true, email: true } },
  reviewedBy: { select: { id: true, name: true, email: true } }
};

const fail = (message: string, status: number) => Object.assign(new Error(message), { status });

export class ClaimService {
  private repository = new ClaimRepository();
  private activityLogs = new ActivityLogService();

  async submitClaim(userId: string, data: CreateClaimDto): Promise<ClaimResponseDto> {
    const result = await prisma.$transaction(async tx => {
      const cafe = await tx.cafe.findUnique({ where: { id: data.cafeId } });
      if (!cafe) throw fail('Cafe not found', 404);
      if (cafe.status !== CafeStatus.PUBLISHED) throw fail('Only published cafes can be claimed', 409);
      if (cafe.ownerId === userId) throw fail('This cafe is already claimed by your account.', 409);
      if (cafe.ownerId) throw fail('This cafe already has an owner. Please contact CafeFinder support if you believe this is incorrect.', 409);
      const existing = await tx.cafeOwnerClaim.findFirst({ where: { userId, cafeId: data.cafeId, status: ClaimStatus.PENDING } });
      if (existing) throw fail('You already have a pending claim for this cafe.', 409);
      return tx.cafeOwnerClaim.create({
        data: { cafe: { connect: { id: data.cafeId } }, user: { connect: { id: userId } }, businessName: data.businessName, contactName: data.contactName, contactEmail: data.contactEmail, contactPhone: data.contactPhone, website: data.website, message: data.message, verificationInformation: data.verificationInformation },
        include: claimInclude
      });
    });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CLAIM_CREATED', entityType: 'CafeOwnerClaim', entityId: result.id, description: `Submitted ownership claim for ${result.cafe.name}` });
    return this.mapToDto(result);
  }

  async getUserClaims(userId: string) { return (await this.repository.findByUserId(userId)).map(c => this.mapToDto(c)); }

  async getClaim(id: string, userId: string, isAdmin = false) {
    const claim = isAdmin ? await this.repository.findById(id) : await this.repository.findByIdForUser(id, userId);
    if (!claim) throw fail('Claim not found', 404);
    return this.mapToDto(claim);
  }

  async updateClaim(id: string, userId: string, data: UpdateClaimDto) {
    const claim = await this.repository.findByIdForUser(id, userId);
    if (!claim) throw fail('Claim not found', 404);
    if (claim.status !== ClaimStatus.PENDING) throw fail('Only pending claims can be edited', 409);
    const updated = await prisma.cafeOwnerClaim.update({ where: { id }, data, include: claimInclude });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CLAIM_UPDATED', entityType: 'CafeOwnerClaim', entityId: id, description: `Updated ownership claim for ${claim.cafe.name}` });
    return this.mapToDto(updated);
  }

  async cancelClaim(id: string, userId: string) {
    const claim = await this.repository.findByIdForUser(id, userId);
    if (!claim) throw fail('Claim not found', 404);
    if (claim.status !== ClaimStatus.PENDING) throw fail('Only pending claims can be cancelled', 409);
    const updated = await prisma.cafeOwnerClaim.update({ where: { id }, data: { status: ClaimStatus.CANCELLED }, include: claimInclude });
    await this.activityLogs.logAction({ userId, action: 'OWNER_CLAIM_CANCELLED', entityType: 'CafeOwnerClaim', entityId: id, description: `Cancelled ownership claim for ${claim.cafe.name}` });
    return this.mapToDto(updated);
  }

  async getAdminClaims(filters: { status?: ClaimStatus; search?: string; page: number; limit: number }) {
    const result = await this.repository.findAll(filters);
    return { data: result.data.map(c => this.mapToDto(c)), pagination: { page: filters.page, limit: filters.limit, total: result.total, totalPages: Math.ceil(result.total / filters.limit) } };
  }

  async approveClaim(id: string, adminId: string) {
    const result = await prisma.$transaction(async tx => {
      const claim = await tx.cafeOwnerClaim.findUnique({ where: { id }, include: { cafe: true, user: true } });
      if (!claim) throw fail('Claim not found', 404);
      if (claim.status !== ClaimStatus.PENDING) throw fail('This claim has already been processed', 409);
      if (claim.cafe.status !== CafeStatus.PUBLISHED) throw fail('Cafe is no longer eligible for ownership', 409);
      if (claim.cafe.ownerId) throw fail('Cafe already has an owner', 409);
      if (claim.user.status !== UserStatus.ACTIVE) throw fail('Claimant account is not active', 409);
      const competing = await tx.cafeOwnerClaim.findFirst({ where: { cafeId: claim.cafeId, status: ClaimStatus.APPROVED, id: { not: id } } });
      if (competing) throw fail('Another approved claim already owns this cafe', 409);
      const now = new Date();
      await tx.cafe.update({ where: { id: claim.cafeId, ownerId: null }, data: { ownerId: claim.userId } });
      const updated = await tx.cafeOwnerClaim.update({ where: { id, status: ClaimStatus.PENDING }, data: { status: ClaimStatus.APPROVED, reviewedById: adminId, reviewedAt: now }, include: claimInclude });
      if (claim.user.role === Role.USER) await tx.user.update({ where: { id: claim.userId }, data: { role: Role.OWNER } });
      await tx.activityLog.create({ data: { userId: adminId, action: 'ADMIN_APPROVED_OWNER_CLAIM', entityType: 'CafeOwnerClaim', entityId: id, description: `Approved claim ${id} for cafe ${claim.cafeId} and claimant ${claim.userId}` } });
      await tx.notification.create({ data: { userId: claim.userId, title: 'Owner claim approved', message: `Your claim for ${claim.cafe.name} has been approved.`, type: 'OWNER_CLAIM_APPROVED' } });
      
      // Send email (non-blocking)
      emailService.sendOwnerClaimApprovedEmail(
        { id: claim.user.id, name: claim.user.name, email: claim.user.email },
        claim.cafe.name
      ).catch(err => console.error('[ClaimService]: Failed to send claim approval email:', err));

      return updated;
    });
    return this.mapToDto(result);
  }

  async rejectClaim(id: string, adminId: string, reason: string) {
    const claim = await this.repository.findById(id);
    if (!claim) throw fail('Claim not found', 404);
    if (claim.status !== ClaimStatus.PENDING) throw fail('This claim has already been processed', 409);
    const updated = await prisma.$transaction(async tx => {
      const value = await tx.cafeOwnerClaim.update({ where: { id, status: ClaimStatus.PENDING }, data: { status: ClaimStatus.REJECTED, rejectionReason: reason, reviewedById: adminId, reviewedAt: new Date() }, include: claimInclude });
      await tx.activityLog.create({ data: { userId: adminId, action: 'ADMIN_REJECTED_OWNER_CLAIM', entityType: 'CafeOwnerClaim', entityId: id, description: `Rejected claim ${id} for cafe ${claim.cafeId}` } });
      await tx.notification.create({ data: { userId: claim.userId, title: 'Owner claim rejected', message: `Your claim for ${claim.cafe.name} was rejected: ${reason}`, type: 'OWNER_CLAIM_REJECTED' } });
      
      // Send email (non-blocking)
      const user = await tx.user.findUnique({ where: { id: claim.userId } });
      if (user) {
        emailService.sendOwnerClaimRejectedEmail(
          { id: user.id, name: user.name, email: user.email },
          claim.cafe.name,
          reason
        ).catch(err => console.error('[ClaimService]: Failed to send claim rejection email:', err));
      }

      return value;
    });
    return this.mapToDto(updated);
  }

  async reopenClaim(id: string, adminId: string) {
    const claim = await this.repository.findById(id);
    if (!claim) throw fail('Claim not found', 404);
    if (claim.status !== ClaimStatus.REJECTED && claim.status !== ClaimStatus.CANCELLED) throw fail('Only rejected or cancelled claims can be reopened', 409);
    const updated = await prisma.cafeOwnerClaim.update({ where: { id }, data: { status: ClaimStatus.PENDING, rejectionReason: null, reviewedById: null, reviewedAt: null }, include: claimInclude });
    await this.activityLogs.logAction({ userId: adminId, action: 'ADMIN_REOPENED_OWNER_CLAIM', entityType: 'CafeOwnerClaim', entityId: id, description: `Reopened ownership claim ${id}` });
    return this.mapToDto(updated);
  }

  private mapToDto(claim: any): ClaimResponseDto {
    return { id: claim.id, cafeId: claim.cafeId, cafe: { id: claim.cafe.id, slug: claim.cafe.slug, name: claim.cafe.name, city: claim.cafe.city, address: claim.cafe.address, coverImage: claim.cafe.photos?.[0]?.url || null }, userId: claim.userId, user: claim.user, businessName: claim.businessName, contactName: claim.contactName, contactEmail: claim.contactEmail, contactPhone: claim.contactPhone, website: claim.website, message: claim.message, verificationInformation: claim.verificationInformation, verificationNotes: claim.verificationNotes, rejectionReason: claim.rejectionReason, status: claim.status, submittedAt: claim.submittedAt, reviewedAt: claim.reviewedAt, reviewedById: claim.reviewedById };
  }
}
