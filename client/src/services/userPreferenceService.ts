import { fetchApi } from './api';
import { ApiResponse, UserPreference } from '../types';

export const userPreferenceService = {
  getPreferences: async () => {
    return fetchApi<ApiResponse<UserPreference>>('/users/preferences');
  },

  updatePreferences: async (preferences: Partial<UserPreference>) => {
    return fetchApi<ApiResponse<UserPreference>>('/users/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });
  },

  resetPreferences: async () => {
    return fetchApi<ApiResponse<UserPreference>>('/users/preferences', {
      method: 'DELETE',
    });
  },
};
