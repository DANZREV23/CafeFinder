import { fetchApi } from './api';
import { ApiResponse } from '../types';
import { OwnerClaim, ClaimStatus } from './ownerClaimService';

export const adminClaimService = {
  getClaims: (params: { status?: ClaimStatus | 'ALL'; search?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => { if (value && value !== 'ALL') query.set(key, String(value)); });
    return fetchApi<ApiResponse<OwnerClaim[]>>(`/admin/claims?${query}`);
  },
  getClaim: (id: string) => fetchApi<ApiResponse<OwnerClaim>>(`/admin/claims/${id}`),
  approveClaim: (id: string) => fetchApi<ApiResponse<OwnerClaim>>(`/admin/claims/${id}/approve`, { method: 'POST' }),
  rejectClaim: (id: string, reason: string) => fetchApi<ApiResponse<OwnerClaim>>(`/admin/claims/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reopenClaim: (id: string) => fetchApi<ApiResponse<OwnerClaim>>(`/admin/claims/${id}/reopen`, { method: 'POST' })
};
