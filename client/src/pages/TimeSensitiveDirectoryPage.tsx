import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { timeSensitiveService, TimeSensitiveItem } from '@/services/timeSensitiveService';
import { TimeSensitiveCard } from '@/components/time-sensitive/TimeSensitiveCard';

export default function TimeSensitiveDirectoryPage({ kind }: { kind: 'events' | 'specials' }) {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = React.useState<TimeSensitiveItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { setLoading(true); timeSensitiveService.list(kind, params.toString()).then(response => setItems(response.data.items)).catch(() => setItems([])).finally(() => setLoading(false)); }, [kind, params]);
  return <main className="mx-auto max-w-7xl space-y-8 px-6 py-12"><div><h1 className="text-4xl font-bold text-brand-charcoal">{kind === 'events' ? 'Cafe Events' : 'Cafe Specials'}</h1><p className="mt-2 text-brand-muted">Discover timely cafe experiences and offers.</p></div><div className="flex gap-3"><input value={params.get('search') || ''} onChange={event => { const next = new URLSearchParams(params); next.set('search', event.target.value); setParams(next); }} placeholder={`Search ${kind}`} className="rounded-xl border border-brand-border px-4 py-2" aria-label={`Search ${kind}`} /></div>{loading ? <p>Loading...</p> : items.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <TimeSensitiveCard key={item.id} item={item} kind={kind} />)}</div> : <p className="rounded-2xl border border-dashed border-brand-border p-8 text-brand-muted">No {kind} found.</p>}</main>;
}