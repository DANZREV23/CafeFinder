import { ApiResponse, PaginatedResponse } from '../types';
import { fetchApi } from './api';

export interface UserCollection {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'PRIVATE' | 'PUBLIC';
  coverCafeId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  items?: CollectionItem[];
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  cafeId: string;
  note: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  cafe: any; // We'll use the cafe type here
}

export const collectionService = {
  getCollections: async (params?: { search?: string; page?: number; limit?: number; visibility?: string }): Promise<PaginatedResponse<UserCollection>> => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.visibility) query.append('visibility', params.visibility);
    
    return fetchApi<PaginatedResponse<UserCollection>>(`/collections?${query.toString()}`);
  },

  getCollection: async (id: string): Promise<ApiResponse<UserCollection>> => {
    return fetchApi<ApiResponse<UserCollection>>(`/collections/${id}`);
  },

  createCollection: async (data: { name: string; description?: string; visibility?: string }): Promise<ApiResponse<UserCollection>> => {
    return fetchApi<ApiResponse<UserCollection>>('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCollection: async (id: string, data: { name?: string; description?: string; visibility?: string; coverCafeId?: string }): Promise<ApiResponse<UserCollection>> => {
    return fetchApi<ApiResponse<UserCollection>>(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCollection: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<ApiResponse<void>>(`/collections/${id}`, {
      method: 'DELETE',
    });
  },

  getCollectionItems: async (id: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<CollectionItem>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    
    return fetchApi<PaginatedResponse<CollectionItem>>(`/collections/${id}/items?${query.toString()}`);
  },

  addCafeToCollection: async (collectionId: string, cafeId: string, note?: string): Promise<ApiResponse<CollectionItem>> => {
    return fetchApi<ApiResponse<CollectionItem>>(`/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ cafeId, note }),
    });
  },

  removeCafeFromCollection: async (collectionId: string, cafeId: string): Promise<ApiResponse<void>> => {
    return fetchApi<ApiResponse<void>>(`/collections/${collectionId}/items/${cafeId}`, {
      method: 'DELETE',
    });
  },

  updateItemNote: async (collectionId: string, cafeId: string, note: string): Promise<ApiResponse<CollectionItem>> => {
    return fetchApi<ApiResponse<CollectionItem>>(`/collections/${collectionId}/items/${cafeId}/note`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    });
  },

  reorderItems: async (collectionId: string, itemIds: string[]): Promise<ApiResponse<void>> => {
    return fetchApi<ApiResponse<void>>(`/collections/${collectionId}/items/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ itemIds }),
    });
  },

  getPublicCollection: async (username: string, slug: string): Promise<ApiResponse<UserCollection>> => {
    return fetchApi<ApiResponse<UserCollection>>(`/collections/public/${username}/${slug}`);
  }
};
