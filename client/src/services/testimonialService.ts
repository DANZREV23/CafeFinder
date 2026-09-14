import { fetchApi } from './api';
import { ApiResponse, Testimonial } from '../types';

export const testimonialService = {
  getAll: async (limit = 6) => {
    return fetchApi<ApiResponse<Testimonial[]>>(`/testimonials?limit=${limit}`);
  }
};
