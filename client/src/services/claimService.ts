import { fetchApi } from './api';
import { ApiResponse } from '../types';

export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Claim {
  id: string;
  cafeId: string;
  cafeName: string;
  userId: string;
  userName: string;
  businessName: string;
  verificationInformation: string | null;
  status: ClaimStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface CreateClaimData {
  cafeId: string;
  businessName: string;
  verificationInformation: string;
}

export const claimService = {
  submitClaim: async (data: CreateClaimData) => {
    return fetchApi<ApiResponse<Claim>>('/claims', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMyClaims: async () => {
    return fetchApi<ApiResponse<Claim[]>>('/claims/me');
  },

  getPendingClaims: async () => {
    return fetchApi<ApiResponse<Claim[]>>('/claims/pending');
  },

  reviewClaim: async (claimId: string, status: 'APPROVED' | 'REJECTED') => {
    return fetchApi<ApiResponse<Claim>>(`/claims/${claimId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};
