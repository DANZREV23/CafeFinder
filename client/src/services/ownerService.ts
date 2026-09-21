import { fetchApi } from './api';
import { ApiResponse } from '../types';

export interface OwnerDashboard {
  isAdministrativeAccess: boolean;
  claimedCafes: number;
  pendingClaims: number;
  publishedCafes: number;
  totalReviews: number;
  pendingChangeRequests: number;
  averageRating: number;
}

export interface OwnerCafeSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  status: string;
  verified: boolean;
  ratingAverage: number;
  reviewCount: number;
  coverImage: string | null;
}

export const ownerService = {
  getDashboard: () => fetchApi<ApiResponse<OwnerDashboard>>('/owner/dashboard'),
  getOwnedCafes: (page = 1) => fetchApi<ApiResponse<OwnerCafeSummary[]>>(`/owner/cafes?page=${page}&limit=20`),
  getOwnedCafe: (id: string) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}`),
  getAnalytics: (cafeId: string, params: { from: string; to: string; interval: 'day' | 'week' | 'month' }) => {
    const query = new URLSearchParams(params).toString();
    return fetchApi<ApiResponse<any>>(`/owner/cafes/${cafeId}/analytics?${query}`);
  },
  getChangeRequests: (cafeId: string) => fetchApi<ApiResponse<any[]>>(`/owner/cafes/${cafeId}/change-requests`),
  createChangeRequest: (cafeId: string, data: { type: string; payload: any; reason?: string }) => 
    fetchApi<ApiResponse<any>>(`/owner/cafes/${cafeId}/change-requests`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  cancelChangeRequest: (requestId: string) => 
    fetchApi<ApiResponse<any>>(`/owner/change-requests/${requestId}/cancel`, {
      method: 'POST'
    })
};
