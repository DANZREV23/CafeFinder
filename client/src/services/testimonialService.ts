import { fetchApi } from './api';
import { ApiResponse, Testimonial } from '../types';

export const testimonialService = {
  getAll: async (limit = 6) => {
    return fetchApi<ApiResponse<Testimonial[]>>(`/testimonials?limit=${limit}`);
  },
  adminGetAll: async () => {
    return fetchApi<ApiResponse<Testimonial[]>>('/admin/testimonials');
  },
  adminGetById: async (id: string) => {
    return fetchApi<ApiResponse<Testimonial>>(`/admin/testimonials/${id}`);
  },
  adminCreate: async (data: Partial<Testimonial>) => {
    return fetchApi<ApiResponse<Testimonial>>('/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  adminUpdate: async (id: string, data: Partial<Testimonial>) => {
    return fetchApi<ApiResponse<Testimonial>>(`/admin/testimonials/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  adminDelete: async (id: string) => {
    return fetchApi<ApiResponse<{ message: string }>>(`/admin/testimonials/${id}`, {
      method: 'DELETE',
    });
  },
};
