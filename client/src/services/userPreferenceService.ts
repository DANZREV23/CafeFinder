import { fetchApi } from './api';
import { ApiResponse } from '../types';

export interface UserPreferences {
  preferredCity?: string | null;
  preferredPriceRange?: number | null;
  preferredAmenities?: string[];
  preferredCoffeeTypes?: string[];
  preferredVibes?: string[];
}

export const userPreferenceService = {
  getPreferences: () => fetchApi<ApiResponse<UserPreferences>>('/users/preferences'),
  updatePreferences: (data: UserPreferences) =>
    fetchApi<ApiResponse<UserPreferences>>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetPreferences: () =>
    fetchApi<ApiResponse<any>>('/users/preferences', {
      method: 'DELETE',
    }),
};

export default userPreferenceService;
