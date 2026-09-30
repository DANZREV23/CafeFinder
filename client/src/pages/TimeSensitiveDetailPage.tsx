import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { timeSensitiveService, TimeSensitiveItem } from '@/services/timeSensitiveService';

export default function TimeSensitiveDetailPage({ kind }: { kind: 'events' | 'specials' }) {
  const { slug } = useParams(); const [item, setItem] = React.useState<TimeSensitiveItem | null>(null);
  React.useEffect(() => { if (slug) timeSensitiveService.get(kind, slug).then(response => setItem(response.data)).catch(() => setItem(null)); }, [kind, slug]);
  if (!item) return <main className="mx-auto max-w-4xl px-6 py-16"><p>Content not found.</p></main>;
  return <main className="mx-auto max-w-4xl space-y-6 px-6 py-12"><p className="text-sm font-semibold uppercase text-brand-coffee">{kind === 'events' ? item.eventType : item.specialType}</p><h1 className="text-4xl font-bold text-brand-charcoal">{item.title}</h1><p className="text-brand-muted"><Link className="hover:underline" to={`/cafes/${item.cafe.slug}`}>{item.cafe.name}</Link> · {item.cafe.address}</p><p className="text-sm text-brand-muted">{new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short', timeZone: item.timezone }).format(new Date(item.startAt))} – {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: item.timezone }).format(new Date(item.endAt))} ({item.timezone})</p><div className="prose max-w-none text-brand-charcoal whitespace-pre-wrap">{item.description}</div>{kind === 'specials' && item.discountPercent ? <p className="font-semibold text-brand-coffee">{item.discountPercent}% off</p> : null}</main>;
}