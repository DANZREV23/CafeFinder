import React, { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, ExternalLink, Loader2, MapPin, Search, Tag } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { SEO } from '../components/common/SEO';
import { ownerService, OwnerCafeSummary } from '../services/ownerService';
import { TimeSensitiveContent, TimeSensitiveKind, timeSensitiveService } from '../services/timeSensitiveService';

const titles: Record<TimeSensitiveKind, string> = { events: 'Cafe Events', specials: 'Cafe Specials', announcements: 'Cafe Announcements' };
const types: Record<TimeSensitiveKind, string[]> = {
  events: ['WORKSHOP', 'TASTING', 'LIVE_MUSIC', 'OPEN_MIC', 'COMMUNITY', 'MEETUP', 'CLASS', 'COMPETITION', 'SEASONAL', 'OTHER'],
  specials: ['DISCOUNT', 'BOGO', 'HAPPY_HOUR', 'SEASONAL', 'COMBO', 'STUDENT', 'MEMBERSHIP', 'NEW_MENU', 'LIMITED_TIME', 'OTHER'],
  announcements: ['TEMPORARY_CLOSURE', 'HOLIDAY_HOURS', 'OPENING', 'RENOVATION', 'MENU_UPDATE', 'OTHER']
};
const itemType = (item: TimeSensitiveContent, kind: TimeSensitiveKind) => kind === 'events' ? item.eventType : kind === 'specials' ? item.specialType : item.type;
const humanize = (value?: string) => (value || '').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase());
const formatDate = (value: string, timezone: string, locale = navigator.language) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(new Date(value));
const dateWindow = (item: TimeSensitiveContent) => `${formatDate(item.startAt, item.timezone)} – ${formatDate(item.endAt, item.timezone)} (${item.timezone})`;
const pathFor = (kind: TimeSensitiveKind, item: TimeSensitiveContent) => `/${kind}/${item.cafe.slug}/${item.slug}`;
const contentStatus = (item: TimeSensitiveContent) => {
  const now = Date.now();
  if (now > new Date(item.endAt).getTime()) return 'Ended';
  if (now >= new Date(item.startAt).getTime()) return 'Happening now';
  const today = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeZone: item.timezone }).format(new Date());
  const startDay = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeZone: item.timezone }).format(new Date(item.startAt));
  return today === startDay ? 'Today' : 'Upcoming';
};
const formatCurrency = (price: number | string, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(price));

function ContentCard({ kind, item }: { kind: TimeSensitiveKind; item: TimeSensitiveContent }) {
  return <article className="overflow-hidden border border-neutral-200 bg-white">
    {item.coverPhoto?.url && <img src={item.coverPhoto.url} alt={item.coverPhoto.altText || ''} className="h-48 w-full object-cover" loading="lazy" />}
    <div className="space-y-3 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{humanize(itemType(item, kind))}</p>
      <h2 className="text-xl font-semibold text-neutral-900"><Link to={pathFor(kind, item)} className="hover:underline">{item.title}</Link></h2>
      <p className="line-clamp-2 text-sm text-neutral-600">{item.shortDescription || item.description || item.content}</p>
      <div className="flex items-start gap-2 text-sm text-neutral-600"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0" /><span>{dateWindow(item)}</span></div>
      <Link to={`/cafes/${item.cafe.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-900 hover:underline">{item.cafe.name}<ArrowRight className="h-4 w-4" /></Link>
    </div>
  </article>;
}

export function TimeSensitiveDirectoryPage({ kind }: { kind: TimeSensitiveKind }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<TimeSensitiveContent[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const page = Number(searchParams.get('page')) || 1;
  const scope = searchParams.get('scope') || (kind === 'specials' ? 'active' : 'upcoming');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    timeSensitiveService.list(kind, { page, limit: 12, scope, q: searchParams.get('q') || undefined, type: searchParams.get('type') || undefined })
      .then(result => { if (alive) { setItems(result.data); setTotalPages(result.pagination.totalPages); setError(''); } })
      .catch(reason => { if (alive) setError(reason.message || 'Could not load content.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [kind, page, scope, searchParams]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  return <MainLayout><SEO title={titles[kind]} description={`Find current and upcoming ${titles[kind].toLowerCase()} at local cafes.`} />
    <PageContainer className="py-10 md:py-14">
      <header className="mb-8 border-b border-neutral-200 pb-7">
        <p className="text-sm font-semibold uppercase text-emerald-800">Time-sensitive discovery</p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-950">{titles[kind]}</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">{kind === 'events' ? 'Workshops, tastings, and community gatherings at cafes near you.' : kind === 'specials' ? 'Current and upcoming cafe offers, menus, and seasonal finds.' : 'Useful cafe updates, holiday hours, and local notices.'}</p>
      </header>
      <section aria-label="Content filters" className="mb-7 flex flex-col gap-3 md:flex-row">
        <form className="flex flex-1 gap-2" onSubmit={event => { event.preventDefault(); updateFilter('q', query.trim()); }}>
          <label htmlFor="time-sensitive-search" className="sr-only">Search {titles[kind].toLowerCase()}</label>
          <div className="flex min-w-0 flex-1 items-center gap-2 border border-neutral-300 bg-white px-3"><Search className="h-4 w-4 text-neutral-500" /><input id="time-sensitive-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by title, cafe, or place" className="h-11 w-full outline-none" /></div>
          <button className="bg-neutral-900 px-4 text-sm font-semibold text-white">Search</button>
        </form>
        <label className="sr-only" htmlFor="time-sensitive-type">Filter by type</label>
        <select id="time-sensitive-type" value={selectedType} onChange={event => { setSelectedType(event.target.value); updateFilter('type', event.target.value); }} className="h-11 border border-neutral-300 bg-white px-3 text-sm">
          <option value="">All types</option>{types[kind].map(type => <option key={type} value={type}>{humanize(type)}</option>)}
        </select>
        <div className="flex border border-neutral-300" aria-label="Time window">
          {(['active', 'upcoming'] as const).map(value => <button key={value} onClick={() => updateFilter('scope', value)} aria-pressed={scope === value} className={`px-3 text-sm ${scope === value ? 'bg-emerald-900 text-white' : 'bg-white text-neutral-700'}`}>{value === 'active' ? 'Active' : 'Upcoming'}</button>)}
        </div>
      </section>
      {error && <p role="alert" className="mb-5 border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 aria-label="Loading" className="h-8 w-8 animate-spin text-emerald-900" /></div>
        : items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <ContentCard key={item.id} kind={kind} item={item} />)}</div>
        : <div className="border border-dashed border-neutral-300 py-16 text-center"><Tag className="mx-auto mb-3 h-8 w-8 text-neutral-400" /><h2 className="font-semibold text-neutral-900">No {titles[kind].toLowerCase()} found</h2><p className="mt-1 text-sm text-neutral-600">Try another search or filter.</p></div>}
      {totalPages > 1 && <nav aria-label="Pagination" className="mt-8 flex justify-center gap-2">{Array.from({ length: totalPages }, (_, index) => index + 1).map(number => <button key={number} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(number)); setSearchParams(next); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={page === number ? 'page' : undefined} className={`h-10 min-w-10 border px-3 ${page === number ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white'}`}>{number}</button>)}</nav>}
    </PageContainer>
  </MainLayout>;
}

export function TimeSensitiveDetailPage({ kind }: { kind: TimeSensitiveKind }) {
  const { cafeSlug = '', slug = '' } = useParams();
  const [item, setItem] = useState<TimeSensitiveContent | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    timeSensitiveService.get(kind, cafeSlug, slug).then(response => { if (alive) setItem(response.data); }).catch(reason => { if (alive) setError(reason.message || 'Content unavailable.'); });
    return () => { alive = false; };
  }, [kind, cafeSlug, slug]);
  const description = item?.shortDescription || item?.description || item?.content || '';
  const eventJsonLd = kind === 'events' && item ? { '@context': 'https://schema.org', '@type': 'Event', name: item.title, description, startDate: item.startAt, endDate: item.endAt, eventStatus: 'https://schema.org/EventScheduled', eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode', location: { '@type': 'Place', name: item.location || item.cafe.name, address: item.cafe.address }, organizer: { '@type': 'Organization', name: item.cafe.name }, url: window.location.href } : undefined;
  return <MainLayout><SEO title={item?.title || titles[kind]} description={description} ogImage={item?.coverPhoto?.url} jsonLd={eventJsonLd} />
    <PageContainer className="py-9 md:py-14">
      <Link to={`/${kind}`} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-neutral-700 hover:underline"><ArrowLeft className="h-4 w-4" />All {titles[kind].toLowerCase()}</Link>
      {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
      {!item && !error && <div className="flex min-h-60 items-center justify-center"><Loader2 aria-label="Loading" className="h-8 w-8 animate-spin" /></div>}
      {item && <article className="mx-auto max-w-4xl">
        {item.coverPhoto?.url && <img src={item.coverPhoto.url} alt={item.coverPhoto.altText || ''} className="mb-8 max-h-[28rem] w-full object-cover" />}
        <p className="text-sm font-semibold uppercase text-emerald-800">{humanize(itemType(item, kind))}</p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-950 md:text-4xl">{item.title}</h1>
        {kind === 'events' && <p role="status" className="mt-3 inline-block border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-950">{contentStatus(item)}</p>}
        <p className="mt-4 text-lg text-neutral-600">{item.shortDescription}</p>
        <div className="my-7 grid gap-4 border-y border-neutral-200 py-5 sm:grid-cols-2">
          <p className="flex gap-3 text-sm text-neutral-700"><CalendarDays className="h-5 w-5 shrink-0 text-emerald-900" /><span>{dateWindow(item)}</span></p>
          <p className="flex gap-3 text-sm text-neutral-700"><MapPin className="h-5 w-5 shrink-0 text-emerald-900" /><span>{item.location ? `${item.location}, ` : ''}{item.cafe.address}, {item.cafe.city}</span></p>
          {kind === 'events' && item.capacity && <p className="text-sm text-neutral-700">Capacity: {new Intl.NumberFormat().format(item.capacity)}</p>}
          {kind !== 'announcements' && item.price != null && <p className="text-sm text-neutral-700">Price: {formatCurrency(item.price, item.currency || 'PHP')}</p>}
          {kind === 'specials' && item.discountPercent != null && <p className="text-sm text-neutral-700">Discount: {new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(item.discountPercent))}%</p>}
          {kind === 'specials' && <p className="text-sm font-medium text-neutral-700">Valid through {formatDate(item.endAt, item.timezone)} ({item.timezone})</p>}
        </div>
        {(item.description || item.content) && <div className="prose max-w-none whitespace-pre-wrap text-neutral-800">{item.description || item.content}</div>}
        {kind === 'events' && item.registrationUrl && <a href={item.registrationUrl} target="_blank" rel="noopener noreferrer" className="mt-7 inline-flex items-center gap-2 bg-neutral-900 px-5 py-3 font-semibold text-white">Registration details <ExternalLink className="h-4 w-4" /></a>}
        {kind === 'specials' && (item.terms || item.redemptionInstructions) && <div className="mt-8 grid gap-5 border-t border-neutral-200 pt-6 sm:grid-cols-2">{item.terms && <section><h2 className="font-semibold">Terms</h2><p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{item.terms}</p></section>}{item.redemptionInstructions && <section><h2 className="font-semibold">How to redeem</h2><p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{item.redemptionInstructions}</p></section>}</div>}
        <Link to={`/cafes/${item.cafe.slug}`} className="mt-9 flex items-center justify-between border-t border-neutral-200 py-5 font-semibold text-emerald-950 hover:underline"><span>{item.cafe.name}<span className="mt-1 block text-sm font-normal text-neutral-600">{item.cafe.address}, {item.cafe.city}</span></span><ArrowRight className="h-5 w-5" /></Link>
      </article>}
    </PageContainer>
  </MainLayout>;
}

function wallTimeToIso(value: string, timezone: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new Error('Enter a valid local date and time.');
  const desired = match.slice(1).map(Number);
  const target = Date.UTC(desired[0], desired[1] - 1, desired[2], desired[3], desired[4]);
  let candidate = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(candidate));
    const values = Object.fromEntries(parts.map(part => [part.type, Number(part.value)]));
    const observed = Date.UTC(values.year, values.month - 1, values.day, values.hour, values.minute);
    candidate += target - observed;
  }
  return new Date(candidate).toISOString();
}

export function OwnerTimeSensitivePage({ kind }: { kind: TimeSensitiveKind }) {
  const { id } = useParams();
  const location = useLocation();
  const creatingNew = location.pathname.endsWith('/new');
  const [items, setItems] = useState<TimeSensitiveContent[]>([]);
  const [cafes, setCafes] = useState<OwnerCafeSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [timezone, setTimezone] = useState(defaultZone);
  const [form, setForm] = useState({ cafeId: '', title: '', shortDescription: '', description: '', type: types[kind][0], startAt: '', endAt: '', location: '', price: '', discountPercent: '', currency: 'PHP', capacity: '', allDay: false, registrationUrl: '' });
  const load = () => Promise.all([timeSensitiveService.listOwned(kind), ownerService.getOwnedCafes()]).then(([content, cafeResponse]) => { setItems(content.data); setCafes(cafeResponse.data); }).catch(reason => setMessage(reason.message || 'Could not load owner content.'));
  useEffect(() => { load(); }, [kind]);
  useEffect(() => {
    setShowForm(creatingNew || Boolean(id));
    if (!id) return;
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    const localValue = (value: string) => {
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: item.timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
      const fields = Object.fromEntries(parts.map(part => [part.type, part.value]));
      return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}`;
    };
    setTimezone(item.timezone);
    setForm({
      cafeId: item.cafeId,
      title: item.title,
      shortDescription: item.shortDescription || '',
      description: item.description || item.content || '',
      type: item.eventType || item.specialType || item.type || types[kind][0],
      startAt: localValue(item.startAt),
      endAt: localValue(item.endAt),
      location: item.location || '',
      price: item.price == null ? '' : String(item.price),
      discountPercent: item.discountPercent == null ? '' : String(item.discountPercent),
      currency: item.currency || 'PHP',
      capacity: item.capacity == null ? '' : String(item.capacity),
      allDay: Boolean(item.allDay),
      registrationUrl: item.registrationUrl || ''
    });
  }, [creatingNew, id, items, kind]);

  const submitNew = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      const payload: Record<string, unknown> = {
        ...(!id ? { cafeId: form.cafeId } : {}),
        title: form.title,
        ...(kind !== 'announcements' && form.shortDescription ? { shortDescription: form.shortDescription } : {}),
        timezone,
        startAt: wallTimeToIso(form.startAt, timezone),
        endAt: wallTimeToIso(form.endAt, timezone),
        ...(kind === 'events' ? { description: form.description, eventType: form.type, location: form.location || undefined, registrationUrl: form.registrationUrl || undefined, price: form.price ? Number(form.price) : undefined, currency: form.price ? form.currency.toUpperCase() : undefined, capacity: form.capacity ? Number(form.capacity) : undefined, allDay: form.allDay } : kind === 'specials' ? { description: form.description, specialType: form.type, price: form.price ? Number(form.price) : undefined, discountPercent: form.discountPercent ? Number(form.discountPercent) : undefined, currency: form.price ? form.currency.toUpperCase() : undefined } : { content: form.description, type: form.type })
      };
      if (id) await timeSensitiveService.update(kind, id, payload);
      else await timeSensitiveService.create(kind, payload);
      setMessage(id ? 'Changes saved. Published content changes require review.' : 'Draft saved. Submit it for review when it is ready.');
      setShowForm(false);
      setForm({ ...form, title: '', shortDescription: '', description: '', startAt: '', endAt: '', location: '', price: '', discountPercent: '', capacity: '', allDay: false, registrationUrl: '' });
      await load();
    } catch (reason: any) { setMessage(reason.message || 'Could not save content.'); }
    finally { setBusy(false); }
  };

  const doAction = async (action: 'submit' | 'cancel' | 'archive', id: string) => {
    setBusy(true); setMessage('');
    try { await timeSensitiveService[action](kind, id); await load(); }
    catch (reason: any) { setMessage(reason.message || 'Action failed.'); }
    finally { setBusy(false); }
  };

  return <MainLayout><PageContainer className="py-10 md:py-14">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-6"><div><p className="text-sm font-semibold uppercase text-emerald-800">Owner workspace</p><h1 className="mt-1 text-3xl font-bold">Manage {titles[kind].toLowerCase()}</h1><nav aria-label="Owner content" className="mt-4 flex flex-wrap gap-4 text-sm">{(['events', 'specials', 'announcements'] as TimeSensitiveKind[]).map(section => <Link key={section} to={`/owner/${section}`} aria-current={kind === section ? 'page' : undefined} className={kind === section ? 'font-bold text-emerald-900 underline' : 'text-neutral-600 hover:underline'}>{section === 'events' ? 'Events' : section === 'specials' ? 'Specials' : 'Announcements'}</Link>)}</nav></div><Link to={`/owner/${kind}/new`} className="inline-flex min-h-11 items-center justify-center bg-neutral-900 px-4 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800">Create {kind === 'events' ? 'event' : kind === 'specials' ? 'special' : 'announcement'}</Link></header>
    {message && <p role="status" className="mb-5 border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">{message}</p>}
    {showForm && <form onSubmit={submitNew} className="mb-8 grid gap-4 border border-neutral-200 bg-white p-5 md:grid-cols-2">
      {!id && <label className="grid gap-1 text-sm font-medium">Cafe<select required value={form.cafeId} onChange={event => setForm({ ...form, cafeId: event.target.value })} className="h-11 border border-neutral-300 px-3"><option value="">Choose a cafe</option>{cafes.map(cafe => <option key={cafe.id} value={cafe.id}>{cafe.name}</option>)}</select></label>}
      <label className="grid gap-1 text-sm font-medium">Title<input required maxLength={160} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Type<select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })} className="h-11 border border-neutral-300 px-3">{types[kind].map(type => <option key={type} value={type}>{humanize(type)}</option>)}</select></label>
      <label className="grid gap-1 text-sm font-medium">Timezone<input required value={timezone} onChange={event => setTimezone(event.target.value)} placeholder="Asia/Manila" className="h-11 border border-neutral-300 px-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Starts at (cafe local time)<input required type="datetime-local" value={form.startAt} onChange={event => setForm({ ...form, startAt: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>
      <label className="grid gap-1 text-sm font-medium">Ends at (cafe local time)<input required type="datetime-local" value={form.endAt} onChange={event => setForm({ ...form, endAt: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>
      {kind !== 'announcements' && <label className="grid gap-1 text-sm font-medium md:col-span-2">Short description<input maxLength={240} value={form.shortDescription} onChange={event => setForm({ ...form, shortDescription: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>}
      <label className="grid gap-1 text-sm font-medium md:col-span-2">Description<textarea required rows={4} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="border border-neutral-300 p-3" /></label>
      {kind === 'events' && <label className="grid gap-1 text-sm font-medium">Event location<input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>}
      {kind === 'events' && <label className="grid gap-1 text-sm font-medium">Capacity<input type="number" min="1" max="100000" value={form.capacity} onChange={event => setForm({ ...form, capacity: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>}
      {kind === 'events' && <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={form.allDay} onChange={event => setForm({ ...form, allDay: event.target.checked })} />All-day event</label>}
      {kind !== 'announcements' && <label className="grid gap-1 text-sm font-medium">Price<input type="number" min="0" step="0.01" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>}
      {kind === 'specials' && <label className="grid gap-1 text-sm font-medium">Discount percent<input type="number" min="0.01" max="100" step="0.01" value={form.discountPercent} onChange={event => setForm({ ...form, discountPercent: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>}
      {kind !== 'announcements' && <label className="grid gap-1 text-sm font-medium">Currency<input required={Boolean(form.price)} maxLength={3} value={form.currency} onChange={event => setForm({ ...form, currency: event.target.value })} className="h-11 border border-neutral-300 px-3 uppercase" /></label>}
      {kind === 'events' && <label className="grid gap-1 text-sm font-medium">Registration URL<input type="url" placeholder="https://" value={form.registrationUrl} onChange={event => setForm({ ...form, registrationUrl: event.target.value })} className="h-11 border border-neutral-300 px-3" /></label>}
      <div className="flex items-center justify-end gap-3 md:col-span-2"><button disabled={busy} className="bg-emerald-900 px-5 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : id ? 'Save changes' : 'Save draft'}</button></div>
    </form>}
    {!items.length ? <p className="border border-dashed border-neutral-300 py-14 text-center text-neutral-600">No managed content yet.</p> : <div className="divide-y divide-neutral-200 border-y border-neutral-200">{items.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-neutral-600">{item.cafe.name} · {humanize(item.status)} · {dateWindow(item)}</p></div><div className="flex gap-2"><Link to={`/owner/${kind}/${item.id}/edit`} className="border border-neutral-300 px-3 py-2 text-sm">Edit</Link>{['DRAFT', 'REJECTED'].includes(item.status) && <button disabled={busy} onClick={() => doAction('submit', item.id)} className="border border-neutral-300 px-3 py-2 text-sm">Submit</button>}{['PUBLISHED', 'PENDING_REVIEW'].includes(item.status) && <button disabled={busy} onClick={() => doAction('cancel', item.id)} className="border border-neutral-300 px-3 py-2 text-sm">Cancel</button>}{['DRAFT', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(item.status) && <button disabled={busy} onClick={() => doAction('archive', item.id)} className="border border-neutral-300 px-3 py-2 text-sm">Archive</button>}</div></article>)}</div>}
  </PageContainer></MainLayout>;
}