import { fetchApi } from './api';
import { ApiResponse, CuratedList, ListResponse } from '../types';

export const listService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; featured?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.featured !== undefined) query.append('featured', params.featured.toString());
    
    return fetchApi<ListResponse<CuratedList>>(`/lists?${query.toString()}`);
  },

  getBySlug: async (slug: string) => {
    return fetchApi<ApiResponse<CuratedList>>(`/lists/${slug}`);
  }
};
