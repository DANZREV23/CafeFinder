import { fetchApi } from './api';
import { ApiResponse, PaginatedResponse } from '../types';

export type InquiryCategory =
  | 'GENERAL'
  | 'HOURS'
  | 'MENU'
  | 'RESERVATION'
  | 'EVENT'
  | 'SPECIAL'
  | 'WIFI'
  | 'AMENITIES'
  | 'PRIVATE_EVENT'
  | 'ACCESSIBILITY'
  | 'OTHER';

export type InquiryStatus =
  | 'NEW'
  | 'READ'
  | 'IN_PROGRESS'
  | 'RESPONDED'
  | 'CLOSED'
  | 'SPAM';

export type InquiryPriority = 'NORMAL' | 'HIGH';

export type InquirySource =
  | 'CAFE_PROFILE'
  | 'EVENT'
  | 'SPECIAL'
  | 'EXPLORE'
  | 'OTHER';

export interface CreateInquiryPayload {
  subject: string;
  message: string;
  category: InquiryCategory;
  source?: InquirySource;
  guestName?: string;
  guestEmail?: string;
  eventId?: string;
  specialId?: string;
}

export interface InquiryResponseItem {
  id: string;
  senderRole: 'OWNER' | 'CUSTOMER' | 'ADMIN';
  message: string;
  createdAt: string;
  senderName?: string;
  responder?: {
    name: string;
    role: string;
    avatarUrl?: string | null;
  };
}

export interface CustomerInquiryItem {
  id: string;
  subject: string;
  message?: string;
  category: InquiryCategory;
  status: InquiryStatus;
  source: InquirySource;
  hasUnreadResponse: boolean;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string | null;
  closedAt?: string | null;
  cafe?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    status?: string;
    coverImage?: string | null;
  };
  event?: {
    id: string;
    title: string;
    slug: string;
    startAt?: string;
    endAt?: string;
  } | null;
  special?: {
    id: string;
    title: string;
    slug: string;
    startAt?: string;
    endAt?: string;
  } | null;
  responseCount?: number;
  maxReplies?: number;
  latestResponse?: {
    id: string;
    message: string;
    senderRole: string;
    createdAt: string;
  } | null;
  responses?: InquiryResponseItem[];
}

export interface OwnerInquiryItem {
  id: string;
  subject: string;
  message?: string;
  category: InquiryCategory;
  status: InquiryStatus;
  priority: InquiryPriority;
  source: InquirySource;
  createdAt: string;
  updatedAt: string;
  readAt?: string | null;
  respondedAt?: string | null;
  closedAt?: string | null;
  cafe: {
    id: string;
    name: string;
    slug: string;
  };
  event?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  special?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  responseCount?: number;
  maxReplies?: number;
  sender: {
    type: 'USER' | 'GUEST';
    id?: string;
    name: string;
    avatarUrl?: string | null;
  };
  responses?: InquiryResponseItem[];
}

export const INQUIRY_CATEGORIES: { value: InquiryCategory; label: string }[] = [
  { value: 'GENERAL', label: 'General Question' },
  { value: 'HOURS', label: 'Operating Hours' },
  { value: 'MENU', label: 'Menu & Dietary Options' },
  { value: 'RESERVATION', label: 'Reservations & Seating' },
  { value: 'WIFI', label: 'Wi-Fi & Remote Work' },
  { value: 'AMENITIES', label: 'Amenities & Parking' },
  { value: 'EVENT', label: 'Upcoming Event' },
  { value: 'SPECIAL', label: 'Special Offer / Promotion' },
  { value: 'PRIVATE_EVENT', label: 'Private Event Inquiry' },
  { value: 'ACCESSIBILITY', label: 'Accessibility' },
  { value: 'OTHER', label: 'Other' },
];

export const inquiryService = {
  submitInquiry: (cafeId: string, payload: CreateInquiryPayload) =>
    fetchApi<ApiResponse<CustomerInquiryItem>>(`/cafes/${cafeId}/inquiries`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Customer endpoints
  getMyInquiries: (page = 1, limit = 20) =>
    fetchApi<PaginatedResponse<CustomerInquiryItem> & { unreadCount?: number }>(
      `/users/me/inquiries?page=${page}&limit=${limit}`
    ),

  getMyInquiryById: (id: string) =>
    fetchApi<ApiResponse<CustomerInquiryItem>>(`/users/me/inquiries/${id}`),

  replyToMyInquiry: (id: string, message: string) =>
    fetchApi<ApiResponse<CustomerInquiryItem>>(`/users/me/inquiries/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  reopenMyInquiry: (id: string) =>
    fetchApi<ApiResponse<CustomerInquiryItem>>(`/users/me/inquiries/${id}/reopen`, {
      method: 'POST',
    }),

  // Owner endpoints
  getOwnerInquiries: (params: {
    cafeId?: string;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.cafeId) query.append('cafeId', params.cafeId);
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.priority) query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    return fetchApi<PaginatedResponse<OwnerInquiryItem> & { counts: Record<string, number> }>(
      `/owner/inquiries?${query.toString()}`
    );
  },

  getOwnerInquiryById: (id: string) =>
    fetchApi<ApiResponse<OwnerInquiryItem>>(`/owner/inquiries/${id}`),

  updateOwnerInquiry: (
    id: string,
    data: { status?: InquiryStatus; priority?: InquiryPriority }
  ) =>
    fetchApi<ApiResponse<OwnerInquiryItem>>(`/owner/inquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  respondToOwnerInquiry: (id: string, message: string) =>
    fetchApi<ApiResponse<OwnerInquiryItem>>(`/owner/inquiries/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Admin endpoints
  getAdminInquiries: (params: {
    cafeId?: string;
    status?: string;
    category?: string;
    priority?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.cafeId) query.append('cafeId', params.cafeId);
    if (params.status) query.append('status', params.status);
    if (params.category) query.append('category', params.category);
    if (params.priority) query.append('priority', params.priority);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    return fetchApi<PaginatedResponse<OwnerInquiryItem> & { counts: Record<string, number> }>(
      `/admin/inquiries?${query.toString()}`
    );
  },
};
