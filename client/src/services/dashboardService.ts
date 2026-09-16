import { fetchApi } from './api';

export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  stats: {
    favoriteCount: number;
    reviewCount: number;
    submissionCount: number;
    unreadNotificationCount: number;
  };
  recentFavorites: any[];
  recentReviews: any[];
  recentSubmissions: any[];
  recentViews: any[];
  recommendations: any[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await fetchApi<{ success: boolean; data: DashboardData }>('/users/me/dashboard');
  return response.data;
};

export const getNotifications = async (page = 1, limit = 20) => {
  return fetchApi<any>(`/notifications?page=${page}&limit=${limit}`);
};

export const markNotificationAsRead = async (id: string) => {
  return fetchApi<any>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
};

export const markAllNotificationsAsRead = async () => {
  return fetchApi<any>('/notifications/read-all', {
    method: 'POST',
  });
};
