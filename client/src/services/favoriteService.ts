import { fetchApi } from './api';
import { Cafe } from '../types';

export interface Favorite {
  id: string;
  createdAt: string;
  cafe: Cafe;
}

export interface FavoriteResponse {
  data: Favorite[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const favoriteService = {
  getFavorites: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    city?: string;
    priceRange?: number;
    minRating?: number;
    amenities?: string;
    sort?: string;
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value.toString());
      }
    });
    return fetchApi<any>(`/users/me/favorites?${query.toString()}`);
  },

  toggleFavorite: async (cafeId: string) => {
    return fetchApi<any>(`/cafes/${cafeId}/favorite`, {
      method: 'POST',
    });
  },

  removeFavorite: async (cafeId: string) => {
    return fetchApi<any>(`/cafes/${cafeId}/favorite`, {
      method: 'DELETE',
    });
  },

  getFavoriteStatus: async (cafeId: string) => {
    return fetchApi<any>(`/cafes/${cafeId}/favorite`);
  },
};

export default favoriteService;
