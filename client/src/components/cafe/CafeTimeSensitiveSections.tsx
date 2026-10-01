import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Megaphone, Tag } from 'lucide-react';
import { TimeSensitiveContent, TimeSensitiveKind, timeSensitiveService } from '../../services/timeSensitiveService';

const sections: { kind: TimeSensitiveKind; title: string; scope: string; icon: typeof CalendarDays }[] = [
  { kind: 'events', title: 'Upcoming events', scope: 'upcoming', icon: CalendarDays },
  { kind: 'specials', title: 'Current specials', scope: 'active', icon: Tag },
  { kind: 'announcements', title: 'Cafe updates', scope: 'active', icon: Megaphone }
];

export function CafeTimeSensitiveSections({ cafeId }: { cafeId: string }) {
  const [content, setContent] = useState<Record<string, TimeSensitiveContent[]>>({});
  useEffect(() => {
    let alive = true;
    Promise.all(sections.map(async section => [section.kind, (await timeSensitiveService.list(section.kind, { cafeId, scope: section.scope, limit: 3 })).data] as const))
      .then(entries => { if (alive) setContent(Object.fromEntries(entries)); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [cafeId]);
  if (!Object.values(content).some(items => items.length)) return null;
  return <div className="space-y-10 border-t border-brand-border pt-8">{sections.map(section => {
    const items = content[section.kind] || [];
    if (!items.length) return null;
    const Icon = section.icon;
    return <section key={section.kind} aria-labelledby={`cafe-${section.kind}-heading`}><div className="mb-4 flex items-center justify-between gap-3"><h2 id={`cafe-${section.kind}-heading`} className="flex items-center gap-2 text-2xl font-serif font-bold text-brand-charcoal"><Icon className="h-5 w-5" />{section.title}</h2><Link to={`/${section.kind}?cafeId=${encodeURIComponent(cafeId)}&scope=${section.scope}`} className="text-sm font-semibold text-brand-coffee hover:underline">See all</Link></div><div className="divide-y divide-brand-border border-y border-brand-border">{items.map(item => <Link key={item.id} to={`/${section.kind}/${item.cafe.slug}/${item.slug}`} className="block py-4 hover:bg-white"><span className="font-semibold text-brand-charcoal">{item.title}</span><span className="mt-1 block text-sm text-brand-muted">{item.shortDescription || item.description || item.content}</span><span className="mt-2 block text-xs text-brand-muted">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: item.timezone }).format(new Date(item.startAt))} · {item.timezone}</span></Link>)}</div></section>;
  })}</div>;
}