import { ClaimStatus } from '@prisma/client';

export interface CreateClaimDto {
  cafeId: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessName: string;
  website?: string;
  message?: string;
  verificationInformation?: string;
}

export interface UpdateClaimDto extends Omit<CreateClaimDto, 'cafeId'> {}

export interface ClaimResponseDto {
  id: string;
  cafeId: string;
  cafe: { id: string; slug: string; name: string; city: string; address?: string; coverImage: string | null };
  userId: string;
  user?: { id: string; name: string; email: string };
  businessName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  message: string | null;
  verificationInformation: string | null;
  verificationNotes: string | null;
  rejectionReason: string | null;
  status: ClaimStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedById: string | null;
}
