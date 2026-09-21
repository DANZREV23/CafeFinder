import { ApiResponse, User } from '../types';
import { fetchApi } from './api';

export const userService = {
  updateProfile: async (data: { name?: string; email?: string; avatarUrl?: string }): Promise<ApiResponse<{ user: User }>> => {
    return fetchApi<ApiResponse<{ user: User }>>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  uploadAvatar: async (file: File): Promise<ApiResponse<{ user: User; avatarUrl: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);

    return fetchApi<ApiResponse<{ user: User; avatarUrl: string }>>('/users/profile/avatar', {
      method: 'POST',
      body: formData,
    });
  },
};
