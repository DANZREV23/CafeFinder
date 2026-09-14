import { fetchApi } from './api';
import { ApiResponse, CuratedList } from '../types';

export const listService = {
  getFeatured: async (limit = 6) => {
    return fetchApi<ApiResponse<CuratedList[]>>(`/lists?featured=true&limit=${limit}`);
  },
  
  getAll: async () => {
    return fetchApi<ApiResponse<CuratedList[]>>('/lists');
  },

  getBySlug: async (slug: string) => {
    return fetchApi<ApiResponse<CuratedList>>(`/lists/${slug}`);
  }
};
