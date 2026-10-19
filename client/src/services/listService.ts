import { fetchApi } from './api';
import { ApiResponse, CuratedList, CuratedListsResponse } from '../types';

export const listService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; featured?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.featured !== undefined) query.append('featured', params.featured.toString());
    const res = await fetchApi<any>(`/lists?${query.toString()}`);
    const rawLists = Array.isArray(res.data) ? res.data : (res.data?.lists || res.lists || []);
    const lists = Array.isArray(rawLists) ? rawLists : [];
    const pagination = res.data?.pagination || res.pagination || { page: 1, limit: 12, total: lists.length, totalPages: 1 };

    return {
      success: res.success ?? true,
      data: {
        lists,
        pagination,
      },
      lists,
      pagination,
    } as CuratedListsResponse;
  },

  getBySlug: async (slug: string) => {
    return fetchApi<ApiResponse<CuratedList>>(`/lists/${slug}`);
  }
};
