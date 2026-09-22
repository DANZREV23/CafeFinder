import { fetchApi } from './api';

export interface Reviewer {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface Review {
  id: string;
  reviewer: Reviewer;
  coffeeRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
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
}

export interface CreateReviewData {
  coffeeRating: number;
  ambianceRating: number;
  serviceRating: number;
  overallRating: number;
  comment: string;
}

const reviewService = {
  getCafeReviews: async (cafeId: string, page = 1, limit = 10) => {
    return fetchApi<any>(`/reviews/cafe/${cafeId}?page=${page}&limit=${limit}`);
  },

  getCafeRatingStats: async (cafeId: string) => {
    return fetchApi<any>(`/reviews/cafe/${cafeId}/stats`);
  },

  getMyReviewForCafe: async (cafeId: string) => {
    return fetchApi<any>(`/reviews/cafe/${cafeId}/my-review`);
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

  uploadPhoto: async (reviewId: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    
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
};

export default reviewService;
