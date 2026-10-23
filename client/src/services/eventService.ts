import { fetchApi } from './api';

export type EventType =
  | 'LIVE_MUSIC'
  | 'WORKSHOP'
  | 'CUPPING'
  | 'LATTE_ART'
  | 'BOOK_CLUB'
  | 'COMMUNITY'
  | 'OPEN_MIC'
  | 'POPUP';

export type SpecialType =
  | 'HAPPY_HOUR'
  | 'SEASONAL'
  | 'COMBO'
  | 'DISCOUNT'
  | 'LIMITED_EDITION'
  | 'HOLIDAY';

export interface CafeEvent {
  id: string;
  cafeId: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  eventType: EventType;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  startAt: string;
  endAt: string;
  timezone: string;
  allDay: boolean;
  location?: string;
  capacity?: number;
  registrationUrl?: string;
  price?: number;
  currency: string;
  coverPhotoUrl?: string;
  isFeatured: boolean;
  createdAt: string;
  cafe?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    address: string;
    phone?: string;
    photos?: { url: string }[];
  };
}

export interface CafeSpecial {
  id: string;
  cafeId: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description: string;
  specialType: SpecialType;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  startAt: string;
  endAt: string;
  timezone: string;
  terms?: string;
  redemptionInstructions?: string;
  price?: number;
  discountPercent?: number;
  currency: string;
  coverPhotoUrl?: string;
  isFeatured: boolean;
  createdAt: string;
  cafe?: {
    id: string;
    name: string;
    slug: string;
    city: string;
    address: string;
    phone?: string;
    photos?: { url: string }[];
  };
}

export interface CafeAnnouncement {
  id: string;
  cafeId: string;
  title: string;
  slug: string;
  content: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  startAt: string;
  endAt?: string;
  coverPhotoUrl?: string;
  createdAt: string;
}

export const eventService = {
  getEvents: async (params?: {
    city?: string;
    type?: string;
    search?: string;
    upcoming?: boolean;
    featured?: boolean;
    cafeId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.set('city', params.city);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.upcoming !== undefined) searchParams.set('upcoming', String(params.upcoming));
    if (params?.featured !== undefined) searchParams.set('featured', String(params.featured));
    if (params?.cafeId) searchParams.set('cafeId', params.cafeId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    return fetchApi<{ success: boolean; data: CafeEvent[]; pagination?: any }>(`/events${qs ? `?${qs}` : ''}`);
  },

  getEventById: async (id: string) => {
    return fetchApi<{ success: boolean; data: CafeEvent }>(`/events/${id}`);
  },

  getSpecials: async (params?: {
    city?: string;
    type?: string;
    search?: string;
    active?: boolean;
    featured?: boolean;
    cafeId?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.city) searchParams.set('city', params.city);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.active !== undefined) searchParams.set('active', String(params.active));
    if (params?.featured !== undefined) searchParams.set('featured', String(params.featured));
    if (params?.cafeId) searchParams.set('cafeId', params.cafeId);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const qs = searchParams.toString();
    return fetchApi<{ success: boolean; data: CafeSpecial[]; pagination?: any }>(`/specials${qs ? `?${qs}` : ''}`);
  },

  getSpecialById: async (id: string) => {
    return fetchApi<{ success: boolean; data: CafeSpecial }>(`/specials/${id}`);
  },

  getCafeEvents: async (cafeId: string) => {
    return fetchApi<{ success: boolean; data: CafeEvent[] }>(`/cafes/${cafeId}/events`);
  },

  getCafeSpecials: async (cafeId: string) => {
    return fetchApi<{ success: boolean; data: CafeSpecial[] }>(`/cafes/${cafeId}/specials`);
  },

  getCafeAnnouncements: async (cafeId: string) => {
    return fetchApi<{ success: boolean; data: CafeAnnouncement[] }>(`/cafes/${cafeId}/announcements`);
  },
};
