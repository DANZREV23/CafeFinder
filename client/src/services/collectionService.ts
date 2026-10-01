import { fetchApi } from './api';

export interface CollectionCafe {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  shortDescription: string | null;
  ratingAverage: number;
  reviewCount: number;
  photos: { url: string; isCover: boolean }[];
}

export interface CollectionItem {
  id: string;
  cafeId: string;
  note: string | null;
  sortOrder: number;
  cafe: CollectionCafe;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'PRIVATE' | 'PUBLIC';
  coverCafeId: string | null;
  itemCount: number;
  updatedAt: string;
  createdAt: string;
  publishedAt: string | null;
  items?: CollectionItem[];
  coverCafe?: CollectionCafe | null;
  itemCafeIds?: string[];
  creator?: { name: string; avatarUrl: string | null };
}

export const collectionService = {
  list: () => fetchApi<{ success: boolean; data: Collection[] }>('/collections'),
  get: (slug: string) => fetchApi<{ success: boolean; data: Collection }>(`/collections/${slug}`),
  getPublic: (slug: string) => fetchApi<{ success: boolean; data: Collection }>(`/collections/public/${slug}`),
  create: (data: { name: string; description?: string; visibility?: 'PRIVATE' | 'PUBLIC' }) => fetchApi<{ success: boolean; data: Collection }>('/collections', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Pick<Collection, 'name' | 'description' | 'visibility' | 'coverCafeId'>>) => fetchApi<{ success: boolean; data: Collection }>(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => fetchApi(`/collections/${id}`, { method: 'DELETE' }),
  addCafe: (id: string, cafeId: string, note?: string) => fetchApi(`/collections/${id}/cafes`, { method: 'POST', body: JSON.stringify({ cafeId, note }) }),
  removeCafe: (id: string, cafeId: string) => fetchApi(`/collections/${id}/cafes/${cafeId}`, { method: 'DELETE' }),
};
