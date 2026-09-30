import { fetchApi } from './api';
import { ApiResponse, BlogPost, BlogListResponse, PostStatus } from '../types';

export const adminBlogService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; status?: PostStatus; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    
    return fetchApi<BlogListResponse>(`/admin/blog?${query.toString()}`);
  },

  getById: async (id: string) => {
    return fetchApi<ApiResponse<BlogPost>>(`/admin/blog/${id}`);
  },

  create: async (data: Partial<BlogPost>) => {
    return fetchApi<ApiResponse<BlogPost>>('/admin/blog', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: Partial<BlogPost>) => {
    return fetchApi<ApiResponse<BlogPost>>(`/admin/blog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  updateStatus: async (id: string, status: PostStatus) => {
    return fetchApi<ApiResponse<BlogPost>>(`/admin/blog/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return fetchApi<ApiResponse<void>>(`/admin/blog/${id}`, {
      method: 'DELETE',
    });
  }
};
