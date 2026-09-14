import { ClaimStatus } from '@prisma/client';

export interface CreateClaimDto {
  cafeId: string;
  businessName: string;
  verificationInformation: string;
}

export interface ClaimResponseDto {
  id: string;
  cafeId: string;
  cafeName: string;
  userId: string;
  userName: string;
  businessName: string;
  verificationInformation: string | null;
  status: ClaimStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
}

export interface ReviewClaimDto {
  status: 'APPROVED' | 'REJECTED';
}
