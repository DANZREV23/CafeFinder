import { fetchApi } from './api';

export interface FollowPreferences {
  eventsEnabled?: boolean;
  specialsEnabled?: boolean;
  announcementsEnabled?: boolean;
  menuUpdatesEnabled?: boolean;
}

export interface FollowStatus {
  isFollowing: boolean;
  preferences: FollowPreferences | null;
}

export interface FollowResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: any;
}

export const followService = {
  follow: async (cafeId: string) => {
    return fetchApi<FollowResponse>(`/cafes/${cafeId}/follow`, {
      method: 'POST',
    });
  },

  unfollow: async (cafeId: string) => {
    return fetchApi<FollowResponse>(`/cafes/${cafeId}/follow`, {
      method: 'DELETE',
    });
  },

  getStatus: async (cafeId: string) => {
    return fetchApi<FollowResponse<FollowStatus>>(`/cafes/${cafeId}/follow`);
  },

  updatePreferences: async (cafeId: string, preferences: FollowPreferences) => {
    return fetchApi<FollowResponse>(`/cafes/${cafeId}/follow/preferences`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },

  getMyFollowing: async (params: { page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    
    return fetchApi<FollowResponse<any[]>>(`/users/me/following?${query.toString()}`);
  },
};
