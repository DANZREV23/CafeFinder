import { fetchApi } from './api';
import { ApiResponse } from '../types';

export enum CafeSubmissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface CafeSubmission {
  id: string;
  submittedById: string;
  cafeId: string | null;
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  priceRange: number | null;
  status: CafeSubmissionStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  photos: {
    id: string;
    url: string;
    caption: string | null;
  }[];
  amenities: {
    id: string;
    name: string;
  }[];
}

export interface CreateSubmissionData {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  priceRange?: number;
  amenityIds?: string[];
}

export const cafeSubmissionService = {
  createSubmission: async (data: CreateSubmissionData) => {
    return fetchApi<ApiResponse<CafeSubmission>>('/cafe-submissions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  getMySubmissions: async () => {
    return fetchApi<ApiResponse<CafeSubmission[]>>('/cafe-submissions/me');
  },

  getSubmission: async (id: string) => {
    return fetchApi<ApiResponse<CafeSubmission>>(`/cafe-submissions/${id}`);
  },

  updateSubmission: async (id: string, data: Partial<CreateSubmissionData>) => {
    return fetchApi<ApiResponse<CafeSubmission>>(`/cafe-submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  cancelSubmission: async (id: string) => {
    return fetchApi<ApiResponse<CafeSubmission>>(`/cafe-submissions/${id}`, {
      method: 'DELETE'
    });
  },

  uploadPhoto: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);

    return fetchApi<ApiResponse<{ id: string; url: string }>>(`/cafe-submissions/${id}/photos`, {
      method: 'POST',
      body: formData,
      headers: {
        // fetchApi might need to handle multipart/form-data differently
        // usually we let the browser set it automatically for FormData
      }
    });
  },

  deletePhoto: async (id: string, photoId: string) => {
    return fetchApi<ApiResponse<{ message: string }>>(`/cafe-submissions/${id}/photos/${photoId}`, {
      method: 'DELETE'
    });
  },

  checkDuplicates: async (data: { name: string; city: string; address: string }) => {
    return fetchApi<ApiResponse<{ type: 'CAFE' | 'SUBMISSION'; data: any } | null>>('/cafe-submissions/check-duplicates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
