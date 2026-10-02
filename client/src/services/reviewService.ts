import { fetchApi } from './api';

export interface Reviewer {
  id: string;
  name: string;
  avatarUrl: string | null;
  isProfilePublic?: boolean;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  caption: string | null;
  status?: string;
  createdAt?: string;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  ownerId: string;
  ownerName: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  cafeId: string;
  cafeName?: string;
  cafeSlug?: string;
  reviewer: Reviewer;
  coffeeRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'REMOVED';
  helpfulCount: number;
  isHelpful?: boolean;
  response?: ReviewResponse | null;
  photos: ReviewPhoto[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  ratingAverage: number;
  reviewCount: number;
  coffeeAverage: number;
  ambianceAverage: number;
  serviceAverage: number;
  distribution: Record<number, number>;
  photoCount?: number;
}

export interface CreateReviewData {
  coffeeRating?: number;
  ambianceRating?: number;
  serviceRating?: number;
  overallRating: number;
  comment: string;
}

export interface ReviewFilterParams {
  page?: number;
  limit?: number;
  rating?: number;
  hasPhotos?: boolean;
  search?: string;
  sort?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful';
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reporterId: string;
  reporterName?: string;
  reason: 'SPAM' | 'HARASSMENT' | 'OFFENSIVE_CONTENT' | 'FALSE_INFORMATION' | 'DUPLICATE' | 'IRRELEVANT' | 'OTHER';
  description: string | null;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt: string | null;
  resolvedByName?: string | null;
  actionTaken: string | null;
  resolutionNotes: string | null;
  reviewPreview?: {
    id: string;
    cafeName?: string;
    reviewerName?: string;
    overallRating: number;
    comment: string | null;
    status: string;
  };
}

const reviewService = {
  getCafeReviews: async (cafeId: string, params: ReviewFilterParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.rating) query.append('rating', params.rating.toString());
    if (params.hasPhotos) query.append('hasPhotos', 'true');
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);

    return fetchApi<any>(`/reviews/cafe/${cafeId}?${query.toString()}`);
  },

  getCafeRatingStats: async (cafeId: string) => {
    return fetchApi<any>(`/reviews/cafe/${cafeId}/stats`);
  },

  getVisitorPhotos: async (cafeId: string, page = 1, limit = 20) => {
    return fetchApi<any>(`/reviews/cafe/${cafeId}/photos?page=${page}&limit=${limit}`);
  },

  getMyReviewForCafe: async (cafeId: string) => {
    return fetchApi<any>(`/reviews/cafe/${cafeId}/my-review`);
  },

  getMyReviews: async (page = 1, limit = 10, sort = 'newest') => {
    return fetchApi<any>(`/reviews/me?page=${page}&limit=${limit}&sort=${sort}`);
  },

  createReview: async (cafeId: string, data: CreateReviewData) => {
    return fetchApi<any>(`/reviews/cafe/${cafeId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateReview: async (id: string, data: CreateReviewData) => {
    return fetchApi<any>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteReview: async (id: string) => {
    return fetchApi<any>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },

  toggleHelpful: async (reviewId: string) => {
    return fetchApi<any>(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
    });
  },

  reportReview: async (reviewId: string, reason: string, description?: string) => {
    return fetchApi<any>(`/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    });
  },

  createResponse: async (reviewId: string, content: string) => {
    return fetchApi<any>(`/reviews/${reviewId}/response`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  updateResponse: async (responseId: string, content: string) => {
    return fetchApi<any>(`/reviews/responses/${responseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  deleteResponse: async (responseId: string) => {
    return fetchApi<any>(`/reviews/responses/${responseId}`, {
      method: 'DELETE',
    });
  },

  uploadPhoto: async (reviewId: string, file: File, caption?: string) => {
    const formData = new FormData();
    formData.append('photo', file);
    if (caption) formData.append('caption', caption);

    return fetchApi<any>(`/reviews/${reviewId}/photos`, {
      method: 'POST',
      body: formData,
    });
  },

  deletePhoto: async (reviewId: string, photoId: string) => {
    return fetchApi<any>(`/reviews/${reviewId}/photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  // Admin moderation endpoints
  getReports: async (params: { page?: number; limit?: number; status?: string; reason?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);
    if (params.reason) query.append('reason', params.reason);

    return fetchApi<any>(`/admin/review-reports?${query.toString()}`);
  },

  resolveReport: async (reportId: string, actionTaken: string, resolutionNotes?: string) => {
    return fetchApi<any>(`/admin/review-reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ actionTaken, resolutionNotes }),
    });
  },

  dismissReport: async (reportId: string, resolutionNotes?: string) => {
    return fetchApi<any>(`/admin/review-reports/${reportId}/dismiss`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes }),
    });
  },

  getReviewPhotosAdmin: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);

    return fetchApi<any>(`/admin/review-photos?${query.toString()}`);
  },

  updatePhotoStatus: async (photoId: string, status: string) => {
    return fetchApi<any>(`/admin/review-photos/${photoId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getReviewResponsesAdmin: async (params: { page?: number; limit?: number; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);

    return fetchApi<any>(`/admin/review-responses?${query.toString()}`);
  },

  updateResponseStatus: async (responseId: string, status: string, moderationNotes?: string) => {
    return fetchApi<any>(`/admin/review-responses/${responseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, moderationNotes }),
    });
  },

  checkRatingsIntegrity: async (cafeId?: string) => {
    const query = cafeId ? `?cafeId=${cafeId}` : '';
    return fetchApi<any>(`/admin/integrity/ratings${query}`);
  },

  repairRatings: async (cafeId?: string) => {
    return fetchApi<any>(`/admin/integrity/ratings/repair`, {
      method: 'POST',
      body: JSON.stringify({ cafeId }),
    });
  },

  getCommunityStats: async () => {
    return fetchApi<any>(`/admin/community/stats`);
  },

  updateReviewStatus: async (reviewId: string, status: string, moderationNotes?: string) => {
    return fetchApi<any>(`/reviews/${reviewId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, moderationNotes }),
    });
  },
};

export default reviewService;
