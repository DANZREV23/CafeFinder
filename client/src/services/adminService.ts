import { fetchApi } from './api';
import { 
  AdminDashboardStats, 
  CafeSubmission, 
  CafeReview, 
  Cafe, 
  User, 
  ActivityLog,
  CafeStatus,
  ReviewStatus,
  UserStatus,
  PaginatedResponse,
  ApiResponse
} from '../types';

export const adminService = {
  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    return fetchApi<ApiResponse<AdminDashboardStats>>('/admin/dashboard');
  },

  // Cafe Submissions
  async getSubmissions(params: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<CafeSubmission[]>> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return fetchApi<ApiResponse<CafeSubmission[]>>(`/admin/cafe-submissions?${query.toString()}`);
  },

  async getSubmissionById(id: string): Promise<ApiResponse<CafeSubmission>> {
    return fetchApi<ApiResponse<CafeSubmission>>(`/admin/cafe-submissions/${id}`);
  },

  async approveSubmission(id: string): Promise<ApiResponse<Cafe>> {
    return fetchApi<ApiResponse<Cafe>>(`/admin/cafe-submissions/${id}/approve`, {
      method: 'POST'
    });
  },

  async rejectSubmission(id: string, reason: string): Promise<ApiResponse<CafeSubmission>> {
    return fetchApi<ApiResponse<CafeSubmission>>(`/admin/cafe-submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },

  async reopenSubmission(id: string): Promise<ApiResponse<CafeSubmission>> {
    return fetchApi<ApiResponse<CafeSubmission>>(`/admin/cafe-submissions/${id}/reopen`, {
      method: 'POST'
    });
  },

  // Reviews
  async getReviews(params: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<CafeReview[]>> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return fetchApi<ApiResponse<CafeReview[]>>(`/admin/reviews?${query.toString()}`);
  },

  async getReviewById(id: string): Promise<ApiResponse<CafeReview>> {
    return fetchApi<ApiResponse<CafeReview>>(`/admin/reviews/${id}`);
  },

  async approveReview(id: string): Promise<ApiResponse<CafeReview>> {
    return fetchApi<ApiResponse<CafeReview>>(`/admin/reviews/${id}/approve`, {
      method: 'POST'
    });
  },

  async rejectReview(id: string): Promise<ApiResponse<CafeReview>> {
    return fetchApi<ApiResponse<CafeReview>>(`/admin/reviews/${id}/reject`, {
      method: 'POST'
    });
  },

  async hideReview(id: string): Promise<ApiResponse<CafeReview>> {
    return fetchApi<ApiResponse<CafeReview>>(`/admin/reviews/${id}/hide`, {
      method: 'POST'
    });
  },

  async restoreReview(id: string): Promise<ApiResponse<CafeReview>> {
    return fetchApi<ApiResponse<CafeReview>>(`/admin/reviews/${id}/restore`, {
      method: 'POST'
    });
  },

  async deleteReviewPhoto(reviewId: string, photoId: string): Promise<ApiResponse<void>> {
    return fetchApi<ApiResponse<void>>(`/admin/reviews/${reviewId}/photos/${photoId}`, {
      method: 'DELETE'
    });
  },

  // Cafes
  async getCafes(params: { 
    status?: string; 
    verified?: boolean; 
    featured?: boolean; 
    trending?: boolean; 
    city?: string;
    search?: string; 
    sortBy?: string;
    page?: number; 
    limit?: number 
  }): Promise<ApiResponse<Cafe[]>> {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.verified !== undefined) query.append('verified', params.verified.toString());
    if (params.featured !== undefined) query.append('featured', params.featured.toString());
    if (params.trending !== undefined) query.append('trending', params.trending.toString());
    if (params.city) query.append('city', params.city);
    if (params.search) query.append('search', params.search);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return fetchApi<ApiResponse<Cafe[]>>(`/admin/cafes?${query.toString()}`);
  },

  async getCafeById(id: string): Promise<ApiResponse<Cafe>> {
    return fetchApi<ApiResponse<Cafe>>(`/admin/cafes/${id}`);
  },

  async updateCafeStatus(id: string, status: CafeStatus): Promise<ApiResponse<Cafe>> {
    return fetchApi<ApiResponse<Cafe>>(`/admin/cafes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async toggleCafeFlag(id: string, flag: 'verified' | 'featured' | 'trending', value: boolean): Promise<ApiResponse<Cafe>> {
    return fetchApi<ApiResponse<Cafe>>(`/admin/cafes/${id}/toggle-flag`, {
      method: 'PATCH',
      body: JSON.stringify({ flag, value })
    });
  },

  async updateCafeOwner(id: string, ownerId: string | null): Promise<ApiResponse<Cafe>> {
    return fetchApi<ApiResponse<Cafe>>(`/admin/cafes/${id}/owner`, {
      method: 'PATCH',
      body: JSON.stringify({ ownerId })
    });
  },

  // Users
  async getUsers(params: { role?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<User[]>> {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return fetchApi<ApiResponse<User[]>>(`/admin/users?${query.toString()}`);
  },

  async updateUserStatus(id: string, status: UserStatus): Promise<ApiResponse<User>> {
    return fetchApi<ApiResponse<User>>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  // Activity Logs
  async getActivityLogs(params: { 
    userId?: string; 
    action?: string; 
    entityType?: string; 
    entityId?: string; 
    search?: string; 
    page?: number; 
    limit?: number 
  }): Promise<ApiResponse<ActivityLog[]>> {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.action) query.append('action', params.action);
    if (params.entityType) query.append('entityType', params.entityType);
    if (params.entityId) query.append('entityId', params.entityId);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return fetchApi<ApiResponse<ActivityLog[]>>(`/admin/activity-logs?${query.toString()}`);
  },

  // System
  async getSystemStatus(): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>('/admin/system/status');
  },

  async toggleMaintenanceMode(enabled: boolean): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>('/admin/system/maintenance', {
      method: 'POST',
      body: JSON.stringify({ enabled })
    });
  },

  async runBackup(): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>('/admin/system/backup', {
      method: 'POST'
    });
  },

  async runCleanup(): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>('/admin/system/cleanup', {
      method: 'POST'
    });
  },

  async getDataIntegrityReport(): Promise<any> {
    const response = await fetchApi<ApiResponse<any>>('/admin/system/data-integrity');
    return response.data;
  },

  async recalculateCafeRatings(id: string): Promise<any> {
    const response = await fetchApi<ApiResponse<any>>(`/admin/system/cafes/${id}/recalculate-ratings`, {
      method: 'POST'
    });
    return response.data;
  },

  async repairOrphanedReviews(): Promise<any> {
    const response = await fetchApi<ApiResponse<any>>('/admin/system/reviews/repair-orphans', {
      method: 'POST'
    });
    return response.data;
  },

  async cleanupMedia(type: 'missing' | 'orphaned'): Promise<any> {
    const response = await fetchApi<ApiResponse<any>>(`/admin/system/media/cleanup?type=${type}`, {
      method: 'POST'
    });
    return response.data;
  },

  async findDuplicateCafes(params?: { name: string; city: string; address: string }): Promise<any> {
    const query = params ? new URLSearchParams(params).toString() : '';
    const response = await fetchApi<ApiResponse<any>>(`/admin/system/cafes/duplicates${query ? `?${query}` : ''}`);
    return response.data;
  },

  async getDeployments(params?: { page?: number; limit?: number }): Promise<ApiResponse<{ deployments: any[]; pagination: any }>> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    return fetchApi<ApiResponse<{ deployments: any[]; pagination: any }>>(`/admin/system/deployments?${query.toString()}`);
  },

  async getReleaseMetadata(): Promise<ApiResponse<any>> {
    return fetchApi<ApiResponse<any>>('/admin/system/release');
  }
};
