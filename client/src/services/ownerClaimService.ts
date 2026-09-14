import { fetchApi } from './api';
import { ApiResponse } from '../types';

export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export interface OwnerClaim {
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
  rejectionReason: string | null;
  status: ClaimStatus;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface ClaimInput {
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  businessName: string;
  website?: string;
  message?: string;
}

export const ownerClaimService = {
  createClaim: (cafeId: string, data: ClaimInput) => fetchApi<ApiResponse<OwnerClaim>>(`/cafes/${cafeId}/claim`, { method: 'POST', body: JSON.stringify(data) }),
  getMyClaims: () => fetchApi<ApiResponse<OwnerClaim[]>>('/cafe-owner-claims/me'),
  getClaim: (id: string) => fetchApi<ApiResponse<OwnerClaim>>(`/cafe-owner-claims/${id}`),
  updateClaim: (id: string, data: ClaimInput) => fetchApi<ApiResponse<OwnerClaim>>(`/cafe-owner-claims/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancelClaim: (id: string) => fetchApi<ApiResponse<OwnerClaim>>(`/cafe-owner-claims/${id}/cancel`, { method: 'POST' })
};
