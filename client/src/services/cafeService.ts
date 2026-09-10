import { fetchApi } from './api.js';
import { Cafe, ApiResponse, ListResponse } from '../types/index.js';

export const getCafes = (page = 1, limit = 12) => {
  return fetchApi<ListResponse<Cafe>>(`/cafes?page=${page}&limit=${limit}`);
};

export const getCafeBySlug = (slug: string) => {
  return fetchApi<ApiResponse<Cafe>>(`/cafes/${slug}`);
};
