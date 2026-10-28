import { fetchApi } from './api';
import { ApiResponse } from '../types';

export interface CollectionItem {
  id: string;
  collectionId: string;
  cafeId: string;
  note?: string | null;
  sortOrder: number;
  createdAt: string;
  cafe: any;
}

export interface UserCollection {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility: 'PRIVATE' | 'PUBLIC';
  itemCount?: number;
  items?: CollectionItem[];
  user?: {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    items: number;
  };
}

export const collectionService = {
  getCollections: async (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query.append(k, String(v));
      });
    }
    const qStr = query.toString();
    return fetchApi<ApiResponse<UserCollection[]>>(`/collections${qStr ? `?${qStr}` : ''}`);
  },

  getMyCollections: async (params?: Record<string, any>) => {
    return collectionService.getCollections(params);
  },

  getCollection: async (id: string) => {
    return fetchApi<ApiResponse<UserCollection>>(`/collections/${id}`);
  },

  getPublicCollection: async (username: string, slug: string) => {
    return fetchApi<ApiResponse<UserCollection>>(`/collections/public/${username}/${slug}`);
  },

  createCollection: async (data: { name: string; description?: string; visibility?: 'PRIVATE' | 'PUBLIC' }) => {
    return fetchApi<ApiResponse<UserCollection>>('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCollection: async (id: string, data: { name?: string; description?: string; visibility?: 'PRIVATE' | 'PUBLIC' }) => {
    return fetchApi<ApiResponse<UserCollection>>(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCollection: async (id: string) => {
    return fetchApi<ApiResponse<void>>(`/collections/${id}`, {
      method: 'DELETE',
    });
  },

  getItems: async (collectionId: string) => {
    return fetchApi<ApiResponse<CollectionItem[]>>(`/collections/${collectionId}/items`);
  },

  addItem: async (collectionId: string, cafeId: string, note?: string) => {
    return fetchApi<ApiResponse<CollectionItem>>(`/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ cafeId, note }),
    });
  },

  removeItem: async (collectionId: string, cafeId: string) => {
    return fetchApi<ApiResponse<void>>(`/collections/${collectionId}/items/${cafeId}`, {
      method: 'DELETE',
    });
  },

  updateNote: async (collectionId: string, cafeId: string, note: string) => {
    return fetchApi<ApiResponse<CollectionItem>>(`/collections/${collectionId}/items/${cafeId}/note`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    });
  },

  reorderItems: async (collectionId: string, itemIds: string[]) => {
    return fetchApi<ApiResponse<void>>(`/collections/${collectionId}/items/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ itemIds }),
    });
  },

  getCafeCollections: async (cafeId: string) => {
    return fetchApi<ApiResponse<UserCollection[]>>(`/collections?cafeId=${cafeId}`);
  },

  getCollectionItems: async (collectionId: string) => {
    return fetchApi<ApiResponse<CollectionItem[]>>(`/collections/${collectionId}/items`);
  },

  removeCafeFromCollection: async (collectionId: string, cafeId: string) => {
    return fetchApi<ApiResponse<void>>(`/collections/${collectionId}/items/${cafeId}`, {
      method: 'DELETE',
    });
  },

  updateItemNote: async (collectionId: string, cafeId: string, note: string) => {
    return fetchApi<ApiResponse<CollectionItem>>(`/collections/${collectionId}/items/${cafeId}/note`, {
      method: 'PUT',
      body: JSON.stringify({ note }),
    });
  },

  addCafeToCollection: async (collectionId: string, cafeId: string, note?: string) => {
    return fetchApi<ApiResponse<CollectionItem>>(`/collections/${collectionId}/items`, {
      method: 'POST',
      body: JSON.stringify({ cafeId, note }),
    });
  },
};

export default collectionService;
