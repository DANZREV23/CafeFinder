import { fetchApi } from './api';

export type TimeSensitiveKind = 'events' | 'specials' | 'announcements';

export interface TimeSensitiveContent {
  id: string;
  cafeId: string;
  title: string;
  slug: string;
  shortDescription?: string | null;
  description?: string;
  content?: string;
  status: string;
  startAt: string;
  endAt: string;
  timezone: string;
  eventType?: string;
  specialType?: string;
  type?: string;
  priority?: string;
  allDay?: boolean;
  capacity?: number | null;
  location?: string | null;
  price?: number | string | null;
  discountPercent?: number | string | null;
  currency?: string | null;
  registrationUrl?: string | null;
  terms?: string | null;
  redemptionInstructions?: string | null;
  coverPhoto?: { url: string; thumbnailUrl?: string | null; altText?: string | null } | null;
  cafe: { id: string; name: string; slug: string; address: string; city: string; state: string; country: string };
}

export interface TimeSensitivePageResult {
  data: TimeSensitiveContent[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export const timeSensitiveService = {
  list: (kind: TimeSensitiveKind, params: Record<string, string | number | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
    return fetchApi<TimeSensitivePageResult & { success: boolean }>(`/${kind}?${query.toString()}`);
  },
  get: (kind: TimeSensitiveKind, cafeSlug: string, slug: string) =>
    fetchApi<{ success: boolean; data: TimeSensitiveContent }>(`/${kind}/${encodeURIComponent(cafeSlug)}/${encodeURIComponent(slug)}`),
  listOwned: (kind: TimeSensitiveKind) => fetchApi<TimeSensitivePageResult & { success: boolean }>(`/owner/${kind}?limit=50`),
  create: (kind: TimeSensitiveKind, data: Record<string, unknown>) => fetchApi<{ success: boolean; data: TimeSensitiveContent }>(`/owner/${kind}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (kind: TimeSensitiveKind, id: string, data: Record<string, unknown>) => fetchApi<{ success: boolean; data: TimeSensitiveContent }>(`/owner/${kind}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  submit: (kind: TimeSensitiveKind, id: string) => fetchApi<{ success: boolean; data: TimeSensitiveContent }>(`/owner/${kind}/${id}/submit`, { method: 'POST' }),
  cancel: (kind: TimeSensitiveKind, id: string) => fetchApi<{ success: boolean; data: TimeSensitiveContent }>(`/owner/${kind}/${id}/cancel`, { method: 'POST' })
  ,archive: (kind: TimeSensitiveKind, id: string) => fetchApi<{ success: boolean; data: TimeSensitiveContent }>(`/owner/${kind}/${id}/archive`, { method: 'POST' })
};