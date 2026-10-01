import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { TimeSensitiveContent, timeSensitiveService } from '../../services/timeSensitiveService';

export function TimeSensitiveHighlights() {
  const [events, setEvents] = useState<TimeSensitiveContent[]>([]);
  const [specials, setSpecials] = useState<TimeSensitiveContent[]>([]);
  useEffect(() => {
    let alive = true;
    Promise.all([
      timeSensitiveService.list('events', { scope: 'upcoming', limit: 3 }),
      timeSensitiveService.list('specials', { scope: 'active', limit: 3 })
    ]).then(([eventResult, specialResult]) => {
      if (alive) { setEvents(eventResult.data); setSpecials(specialResult.data); }
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  if (!events.length && !specials.length) return null;
  return <section className="w-full border-y border-neutral-200 bg-[#f4f7f3] py-12 md:py-16" aria-labelledby="time-sensitive-highlights">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase text-emerald-800">Local cafe calendar</p><h2 id="time-sensitive-highlights" className="mt-1 text-2xl font-bold text-neutral-950">Happening soon</h2></div><Link to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:underline">All events <ArrowRight className="h-4 w-4" /></Link></div>
      <div className="grid gap-6 lg:grid-cols-2">
        {events.length > 0 && <div><h3 className="mb-3 text-sm font-semibold text-neutral-700">Upcoming events</h3><div className="divide-y divide-neutral-200 border-y border-neutral-200">{events.map(event => <Link key={event.id} to={`/events/${event.cafe.slug}/${event.slug}`} className="flex gap-3 py-4 hover:bg-white/70"><CalendarDays className="mt-1 h-5 w-5 shrink-0 text-emerald-900" /><span><strong className="block text-neutral-900">{event.title}</strong><span className="text-sm text-neutral-600">{event.cafe.name} · {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: event.timezone }).format(new Date(event.startAt))} ({event.timezone})</span></span></Link>)}</div></div>}
        {specials.length > 0 && <div><h3 className="mb-3 text-sm font-semibold text-neutral-700">Current specials</h3><div className="divide-y divide-neutral-200 border-y border-neutral-200">{specials.map(special => <Link key={special.id} to={`/specials/${special.cafe.slug}/${special.slug}`} className="flex gap-3 py-4 hover:bg-white/70"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-600" /><span><strong className="block text-neutral-900">{special.title}</strong><span className="text-sm text-neutral-600">{special.cafe.name} · {special.shortDescription || 'See details'}</span></span></Link>)}</div></div>}
      </div>
    </div>
  </section>;
}