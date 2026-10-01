import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { fetchApi } from '../../services/api';
import { TimeSensitiveContent, TimeSensitiveKind } from '../../services/timeSensitiveService';

const kinds: TimeSensitiveKind[] = ['events', 'specials', 'announcements'];
const statuses = ['PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'ARCHIVED'];
const label = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase());

export default function AdminTimeSensitivePage() {
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<TimeSensitiveContent[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const kind = kinds.includes(params.get('kind') as TimeSensitiveKind) ? params.get('kind') as TimeSensitiveKind : 'events';
  const status = params.get('status') || 'PENDING_REVIEW';
  const query = params.get('q') || '';

  const load = () => {
    setLoading(true);
    const queryString = new URLSearchParams({ status, page: params.get('page') || '1', limit: '20', q: query }).toString();
    fetchApi<{ data: TimeSensitiveContent[]; pagination: { page: number; totalPages: number } }>(`/admin/time-sensitive/${kind}?${queryString}`)
      .then(result => { setItems(result.data); setPagination(result.pagination); setError(''); })
      .catch(reason => setError(reason.message || 'Could not load moderation queue.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [kind, status, params]);

  const updateStatus = async (item: TimeSensitiveContent, nextStatus: string) => {
    setError('');
    try {
      await fetchApi(`/admin/time-sensitive/${kind}/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      load();
    } catch (reason: any) { setError(reason.message || 'Moderation action failed.'); }
  };
  const toggleFeatured = async (item: TimeSensitiveContent & { isFeatured?: boolean }) => {
    try {
      await fetchApi(`/admin/time-sensitive/${kind}/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: item.status, isFeatured: !item.isFeatured }) });
      load();
    } catch (reason: any) { setError(reason.message || 'Feature update failed.'); }
  };

  return <div className="space-y-6">
    <header><p className="text-xs font-bold uppercase text-amber-700">Moderation</p><h1 className="mt-1 text-2xl font-bold text-stone-950">Time-sensitive cafe content</h1></header>
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div role="tablist" aria-label="Content type" className="flex border border-stone-300">{kinds.map(value => <button key={value} role="tab" aria-selected={kind === value} onClick={() => setParams({ kind: value, status })} className={`px-4 py-2 text-sm ${kind === value ? 'bg-stone-900 text-white' : 'bg-white text-stone-700'}`}>{label(value)}</button>)}</div>
      <label className="sr-only" htmlFor="moderation-status">Filter by status</label><select id="moderation-status" value={status} onChange={event => setParams({ kind, status: event.target.value })} className="h-10 border border-stone-300 bg-white px-3">{statuses.map(value => <option key={value} value={value}>{label(value)}</option>)}</select>
      <form className="flex" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); setParams({ kind, status, q: String(data.get('q') || '') }); }}><label className="sr-only" htmlFor="moderation-search">Search content and cafe</label><span className="flex items-center border border-r-0 border-stone-300 px-3"><Search className="h-4 w-4" /></span><input id="moderation-search" name="q" defaultValue={query} placeholder="Search" className="h-10 w-40 border border-stone-300 px-2" /><button className="bg-stone-900 px-3 text-sm font-semibold text-white">Search</button></form>
    </div>
    {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-red-800">{error}</p>}
    <div className="overflow-x-auto border border-stone-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-stone-100 text-stone-700"><tr><th className="p-3">Content</th><th className="p-3">Cafe</th><th className="p-3">Schedule</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody className="divide-y divide-stone-200">{loading ? <tr><td colSpan={5} className="p-8 text-center text-stone-500">Loading moderation queue…</td></tr> : items.map(item => <tr key={item.id}>
      <td className="p-3"><strong>{item.title}</strong><span className="mt-1 block text-xs text-stone-500">{label(kind)}</span></td><td className="p-3">{item.cafe.name}</td><td className="p-3">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: item.timezone }).format(new Date(item.startAt))}<span className="block text-xs text-stone-500">{item.timezone}</span></td><td className="p-3">{label(item.status)}</td><td className="p-3"><div className="flex flex-wrap gap-2">
        {item.status === 'PENDING_REVIEW' && <><button onClick={() => updateStatus(item, 'PUBLISHED')} className="bg-emerald-800 px-2 py-1 text-white">Approve</button><button onClick={() => updateStatus(item, 'REJECTED')} className="border border-stone-300 px-2 py-1">Reject</button></>}
        {item.status === 'PUBLISHED' && <><button onClick={() => updateStatus(item, 'CANCELLED')} className="border border-stone-300 px-2 py-1">Cancel</button>{kind !== 'announcements' && <button onClick={() => toggleFeatured(item)} className="border border-stone-300 px-2 py-1">{(item as any).isFeatured ? 'Unfeature' : 'Feature'}</button>}</>}
        {['EXPIRED', 'CANCELLED', 'REJECTED'].includes(item.status) && <button onClick={() => updateStatus(item, 'PENDING_REVIEW')} className="border border-stone-300 px-2 py-1">Restore</button>}
        {item.status !== 'ARCHIVED' && <button onClick={() => updateStatus(item, 'ARCHIVED')} className="border border-stone-300 px-2 py-1">Archive</button>}
      </div></td></tr>)}{!loading && !items.length && <tr><td colSpan={5} className="p-8 text-center text-stone-500">No matching content.</td></tr>}</tbody></table></div>
    {pagination.totalPages > 1 && <nav aria-label="Moderation pages" className="flex justify-end gap-2"><button disabled={pagination.page <= 1} onClick={() => setParams({ kind, status, q: query, page: String(pagination.page - 1) })} className="border border-stone-300 px-3 py-2 disabled:opacity-40">Previous</button><span className="py-2">{pagination.page} / {pagination.totalPages}</span><button disabled={pagination.page >= pagination.totalPages} onClick={() => setParams({ kind, status, q: query, page: String(pagination.page + 1) })} className="border border-stone-300 px-3 py-2 disabled:opacity-40">Next</button></nav>}
  </div>;
}