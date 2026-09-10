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
  getAll: (page = 1, limit = 12) => {
    return fetchApi<any>(`/cafes?page=${page}&limit=${limit}`);
  },
  getBySlug: (slug: string) => {
    return fetchApi<any>(`/cafes/${slug}`);
  },
};
