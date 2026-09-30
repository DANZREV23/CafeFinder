import { fetchApi } from './api';

export interface TimeSensitiveItem {
  id: string; title: string; slug: string; shortDescription?: string | null; description: string;
  startAt: string; endAt: string; timezone: string; status: string; cafe: { id: string; name: string; slug: string; address: string; city: string };
  eventType?: string; specialType?: string; price?: string | number | null; currency?: string | null; discountPercent?: number | null;
}

export const timeSensitiveService = {
  list: (kind: 'events' | 'specials', params = '') => fetchApi<{ success: boolean; data: { items: TimeSensitiveItem[]; pagination: any } }>(`/time-sensitive/${kind}${params ? `?${params}` : ''}`),
  get: (kind: 'events' | 'specials', slug: string) => fetchApi<{ success: boolean; data: TimeSensitiveItem }>(`/time-sensitive/${kind}/${slug}`),
};