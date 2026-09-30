import { fetchApi } from './api';
import { ApiResponse, Cafe } from '@/types';

export type RecommendationReasonType =
  | 'FAVORITE_SIMILARITY'
  | 'AMENITY_MATCH'
  | 'CITY_MATCH'
  | 'PRICE_MATCH'
  | 'VIEW_SIMILARITY'
  | 'PREFERENCE_MATCH'
  | 'TRENDING'
  | 'FEATURED'
  | 'CURATED_LIST'
  | 'HIGH_RATING';

export interface RecommendationItem {
  cafe: Cafe;
  reason: {
    type: RecommendationReasonType;
    data?: Record<string, string | number>;
  };
}

export interface RecommendationsResponse {
  items: RecommendationItem[];
}

export const getRecommendations = (params: {
  limit?: number;
  context?: 'home' | 'dashboard' | 'explore' | 'profile';
  excludeCafeId?: string;
  cafeId?: string;
  city?: string;
  amenity?: string;
} = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return fetchApi<ApiResponse<RecommendationsResponse>>(`/recommendations/cafes?${query.toString()}`);
};

export interface UserRecommendationPreferences {
  id: string;
  userId: string;
  preferredCity: string | null;
  preferredPriceRange: number | null;
  preferredAmenities: string[];
  preferredCoffeeTypes: string[];
  preferredVibes: string[];
}

export const getRecommendationPreferences = () =>
  fetchApi<ApiResponse<UserRecommendationPreferences | null>>('/users/me/preferences');

export const updateRecommendationPreferences = (preferences: Partial<Omit<UserRecommendationPreferences, 'id' | 'userId'>>) =>
  fetchApi<ApiResponse<UserRecommendationPreferences>>('/users/me/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });

export const resetRecommendationPreferences = () =>
  fetchApi<ApiResponse<null>>('/users/me/preferences', { method: 'DELETE' });
