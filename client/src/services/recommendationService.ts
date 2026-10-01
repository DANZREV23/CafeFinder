import { fetchApi } from './api';
import { ApiResponse, Cafe, RecommendationDiagnostics } from '../types';

export const recommendationService = {
  getPersonalized: async (limit = 6, city?: string) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (city) params.set('city', city);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<ApiResponse<Cafe[]>>(`/recommendations${query}`);
  },

  getSimilar: async (idOrSlug: string, limit = 4) => {
    return fetchApi<ApiResponse<Cafe[]>>(`/recommendations/similar/${idOrSlug}?limit=${limit}`);
  },

  getAdminDiagnostics: async (userId?: string) => {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return fetchApi<ApiResponse<RecommendationDiagnostics>>(`/recommendations/admin/diagnostics${query}`);
  },
};
