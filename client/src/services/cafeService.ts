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

  getAmenities: async () => {
    return fetchApi<ApiResponse<any[]>>('/amenities');
  }
};
