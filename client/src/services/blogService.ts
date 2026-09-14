import { fetchApi } from './api';
import { ApiResponse, BlogPost } from '../types';

export const blogService = {
  getLatest: async (limit = 3) => {
    return fetchApi<ApiResponse<BlogPost[]>>(`/blog?limit=${limit}`);
  },

  getBySlug: async (slug: string) => {
    return fetchApi<ApiResponse<BlogPost>>(`/blog/${slug}`);
  }
};
