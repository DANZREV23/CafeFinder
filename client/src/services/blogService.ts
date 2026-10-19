import { fetchApi } from './api';
import { ApiResponse, BlogPost, BlogListResponse } from '../types';

export const blogService = {
  getAll: async (params: { page?: number; limit?: number; search?: string; category?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    const res = await fetchApi<any>(`/blog?${query.toString()}`);
    const rawPosts = Array.isArray(res.data) ? res.data : (res.data?.posts || res.posts || []);
    const posts = Array.isArray(rawPosts) ? rawPosts : [];
    const pagination = res.data?.pagination || res.pagination || { page: 1, limit: 12, total: posts.length, totalPages: 1 };

    return {
      success: res.success ?? true,
      data: {
        posts,
        pagination,
      },
      posts,
      pagination,
    } as BlogListResponse;
  },

  getBySlug: async (slug: string) => {
    return fetchApi<ApiResponse<{ post: BlogPost; relatedPosts: BlogPost[] }>>(`/blog/${slug}`);
  }
};
