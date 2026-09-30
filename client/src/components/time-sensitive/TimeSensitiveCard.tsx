import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Tag } from 'lucide-react';
import { TimeSensitiveItem } from '@/services/timeSensitiveService';

export const TimeSensitiveCard: React.FC<{ item: TimeSensitiveItem; kind: 'events' | 'specials' }> = ({ item, kind }) => (
  <article className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-coffee">
      {kind === 'events' ? <CalendarDays size={15} aria-hidden="true" /> : <Tag size={15} aria-hidden="true" />}
      {kind === 'events' ? item.eventType : item.specialType}
    </div>
    <h2 className="text-xl font-bold text-brand-charcoal">{item.title}</h2>
    <p className="mt-1 text-sm text-brand-muted">{item.cafe.name} · {item.cafe.city}</p>
    <p className="mt-3 line-clamp-3 text-sm text-brand-charcoal">{item.shortDescription || item.description}</p>
    <p className="mt-4 text-sm text-brand-muted">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: item.timezone }).format(new Date(item.startAt))}</p>
    <Link className="mt-4 inline-flex text-sm font-semibold text-brand-coffee hover:underline" to={`/${kind}/${item.slug}`}>View details</Link>
  </article>
);