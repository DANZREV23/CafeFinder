import { fetchApi } from './api';
import { ApiResponse, Cafe, PaginatedResponse } from '../types';

export const cafeService = {
  getTrending: async (limit = 4) => {
    return fetchApi<ApiResponse<Cafe[]>>(`/cafes?trending=true&limit=${limit}`);
  },
  
  getFeatured: async (limit = 4) => {
    return fetchApi<ApiResponse<Cafe[]>>(`/cafes?featured=true&limit=${limit}`);
  },

  getAll: async (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value.toString());
      }
    });
    return fetchApi<ApiResponse<Cafe[]>>(`/cafes?${query.toString()}`);
  },

  getBySlug: async (slug: string) => {
    return fetchApi<ApiResponse<Cafe>>(`/cafes/${slug}`);
  },

  search: async (q: string) => {
    return fetchApi<ApiResponse<Cafe[]>>(`/cafes?search=${encodeURIComponent(q)}&limit=10`);
  },

  getAmenities: async () => {
    return fetchApi<ApiResponse<any[]>>('/amenities');
  },
  
  trackInteraction: async (id: string, eventType: string) => {
    return fetchApi<ApiResponse<any>>(`/cafes/${id}/track/${eventType}`, {
      method: 'POST'
    });
  }
};
