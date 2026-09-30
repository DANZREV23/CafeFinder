import { fetchApi } from './api';
import { ApiResponse } from '../types';
import { OwnerCafeSummary } from './ownerService';

export interface OwnerHours { dayOfWeek: number; isClosed: boolean; openTime: string | null; closeTime: string | null; }
export const ownerCafeService = {
  updateBusiness: (id: string, data: Record<string, unknown>) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/business`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateHours: (id: string, hours: OwnerHours[]) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/hours`, { method: 'PUT', body: JSON.stringify({ hours }) }),
  updateAmenities: (id: string, amenityIds: string[]) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/amenities`, { method: 'PUT', body: JSON.stringify({ amenityIds }) }),
  getReviews: (id: string, page = 1) => fetchApi<ApiResponse<any[]>>(`/owner/cafes/${id}/reviews?page=${page}`),
  uploadPhoto: (id: string, file: File) => { const body = new FormData(); body.append('photo', file); return fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/photos`, { method: 'POST', body }); },
  deletePhoto: (id: string, photoId: string) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/photos/${photoId}`, { method: 'DELETE' }),
  updatePhotoMetadata: (id: string, photoId: string, data: { altText?: string; caption?: string }) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/photos/${photoId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  setCover: (id: string, photoId: string) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/photos/${photoId}/cover`, { method: 'POST' }),
  getChangeRequests: (id: string) => fetchApi<ApiResponse<any[]>>(`/owner/cafes/${id}/change-requests`),
  createChangeRequest: (id: string, data: { type: string; payload: Record<string, unknown>; reason?: string }) => fetchApi<ApiResponse<any>>(`/owner/cafes/${id}/change-requests`, { method: 'POST', body: JSON.stringify(data) }),
  cancelChangeRequest: (requestId: string) => fetchApi<ApiResponse<any>>(`/owner/change-requests/${requestId}/cancel`, { method: 'POST' })
};
