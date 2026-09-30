import { fetchApi } from './api';
import { ApiResponse, CuratedList, CuratedListsResponse, PostStatus, CuratedListCafe } from '../types';

export const adminListService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: PostStatus } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    
    return fetchApi<CuratedListsResponse>(`/admin/lists?${query.toString()}`);
  },

  getById: async (id: string) => {
    return fetchApi<ApiResponse<CuratedList>>(`/admin/lists/${id}`);
  },

  create: async (data: Partial<CuratedList>) => {
    return fetchApi<ApiResponse<CuratedList>>('/admin/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<CuratedList>) => {
    return fetchApi<ApiResponse<CuratedList>>(`/admin/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, status: PostStatus) => {
    return fetchApi<ApiResponse<CuratedList>>(`/admin/lists/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return fetchApi<ApiResponse<void>>(`/admin/lists/${id}`, {
      method: 'DELETE',
    });
  },

  addCafe: async (listId: string, data: { cafeId: string; sortOrder?: number; editorialNote?: string }) => {
    return fetchApi<ApiResponse<CuratedListCafe>>(`/admin/lists/${listId}/cafes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCafe: async (listId: string, cafeId: string, data: { sortOrder?: number; editorialNote?: string }) => {
    return fetchApi<ApiResponse<CuratedListCafe>>(`/admin/lists/${listId}/cafes/${cafeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  removeCafe: async (listId: string, cafeId: string) => {
    return fetchApi<ApiResponse<void>>(`/admin/lists/${listId}/cafes/${cafeId}`, {
      method: 'DELETE',
    });
  }
};
