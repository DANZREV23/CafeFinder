import { fetchApi } from './api';
import { RecommendationItem } from './recommendationService';

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
  recommendations: RecommendationItem[];
  recommendationItems?: RecommendationItem[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await fetchApi<{ success: boolean; data: DashboardData }>('/users/me/dashboard');
  return {
    ...response.data,
    recommendations: (response.data.recommendationItems || response.data.recommendations || []).map((item: any) => {
      if (item.cafe && item.reason) return item;
      return {
        cafe: item,
        reason: { type: 'HIGH_RATING' as const, data: { rating: item.ratingAverage } },
      };
    }),
  };
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
