import { fetchApi } from './api';
import { ApiResponse, BlogPost, BlogListResponse } from '../types';

export const blogService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    
    return fetchApi<BlogListResponse>(`/blog?${query.toString()}`);
  },

  getBySlug: async (slug: string) => {
    return fetchApi<ApiResponse<{ post: BlogPost; relatedPosts: BlogPost[] }>>(`/blog/${slug}`);
  }
};
