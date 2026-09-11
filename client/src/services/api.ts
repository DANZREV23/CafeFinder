import { ApiResponse, Cafe } from "../types";

const API_URL = '/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || 'Something went wrong');
  }

  return result;
}

export const cafeService = {
  getAll: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value.toString());
      }
    });
    return fetchApi<ApiResponse<Cafe[]>>(`/cafes?${query.toString()}`);
  },
  getBySlug: (slug: string) => {
    return fetchApi<ApiResponse<Cafe>>(`/cafes/${slug}`);
  },
};
