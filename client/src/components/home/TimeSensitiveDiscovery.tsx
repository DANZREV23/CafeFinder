import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Sparkles, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Tag, 
  Flame, 
  ChevronRight,
  Coffee
} from 'lucide-react';
import { eventService, CafeEvent, CafeSpecial } from '@/services/eventService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

export const TimeSensitiveDiscovery: React.FC = () => {
  const [events, setEvents] = useState<CafeEvent[]>([]);
  const [specials, setSpecials] = useState<CafeSpecial[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'specials'>('events');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [eventsRes, specialsRes] = await Promise.allSettled([
          eventService.getEvents({ upcoming: true, limit: 4 }),
          eventService.getSpecials({ active: true, limit: 4 }),
        ]);

        if (isMounted) {
          if (eventsRes.status === 'fulfilled' && eventsRes.value.data) {
            setEvents(eventsRes.value.data);
          }
          if (specialsRes.status === 'fulfilled' && specialsRes.value.data) {
            setSpecials(specialsRes.value.data);
          }
        }
      } catch (err) {
        console.error('Error fetching time-sensitive discovery data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getDaysUntil = (dateStr: string) => {
    try {
      const now = new Date();
      const target = new Date(dateStr);
      const diffTime = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays <= 7) return `In ${diffDays} days`;
      return null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-brand-cream/30 border-y border-brand-border/60">
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If both are empty, render an inviting callout to browse or host
  const hasItems = events.length > 0 || specials.length > 0;

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-brand-cream/40 via-white to-brand-cream/20 border-y border-brand-border/60 relative overflow-hidden">
      {/* Decorative subtle background coffee rings */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full border border-brand-coffee/5 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full border border-brand-coffee/5 pointer-events-none" />

      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Header with Switcher */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-brand-coffee font-medium text-xs md:text-sm tracking-wider uppercase mb-1.5">
              <Flame className="w-4 h-4 text-amber-600 animate-pulse" />
              <span>Time-Sensitive Discovery</span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-brand-charcoal">
              Happening Now & Coming Soon
            </h2>
            <p className="text-sm md:text-base text-brand-muted mt-1 max-w-2xl">
              From weekend coffee cuppings and latte art workshops to limited-run cascara drinks and seasonal happy hours.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Toggle tabs */}
            <div className="bg-brand-background p-1 rounded-xl border border-brand-border flex items-center shadow-xs">
              <button
                onClick={() => setActiveTab('events')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  activeTab === 'events'
                    ? 'bg-brand-coffee text-white shadow-xs'
                    : 'text-brand-charcoal hover:text-brand-coffee'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Events ({events.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('specials')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  activeTab === 'specials'
                    ? 'bg-brand-coffee text-white shadow-xs'
                    : 'text-brand-charcoal hover:text-brand-coffee'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Specials ({specials.length})</span>
              </button>
            </div>

            <Link to={activeTab === 'events' ? '/events?tab=events' : '/events?tab=specials'}>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex items-center gap-1.5">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Content list */}
        {activeTab === 'events' ? (
          events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {events.map((event) => {
                const countdown = getDaysUntil(event.startAt);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
                  >
                    {/* Cover photo or placeholder */}
                    <div className="relative h-44 bg-brand-cream/60 overflow-hidden">
                      {event.coverPhotoUrl ? (
                        <img
                          src={event.coverPhotoUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-900/10 via-brand-coffee/10 to-amber-700/20 text-brand-coffee">
                          <Coffee className="w-10 h-10 opacity-40 mb-1" />
                          <span className="text-xs font-serif font-medium opacity-70">Cafe Event</span>
                        </div>
                      )}

                      {/* Event badge */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="bg-brand-coffee text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                          {event.eventType.replace('_', ' ')}
                        </span>
                        {countdown && (
                          <span className="bg-amber-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {countdown}
                          </span>
                        )}
                      </div>

                      {/* Price badge */}
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-white/95 backdrop-blur-xs text-brand-charcoal text-xs font-bold px-2.5 py-1 rounded-md shadow-xs border border-brand-border">
                          {event.price && event.price > 0 ? `₱${event.price}` : 'Free Entry'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="text-xs text-brand-coffee font-medium flex items-center gap-1.5 mb-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(event.startAt)} • {formatTime(event.startAt)}</span>
                      </div>

                      <h3 className="font-serif font-bold text-brand-charcoal text-base line-clamp-1 group-hover:text-brand-coffee transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-xs text-brand-muted line-clamp-2 mt-1 mb-3 flex-1">
                        {event.shortDescription || event.description}
                      </p>

                      {/* Cafe info */}
                      {event.cafe && (
                        <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-brand-coffee shrink-0" />
                            <span className="truncate font-medium text-brand-charcoal">{event.cafe.name}</span>
                            <span className="text-[11px] text-brand-muted shrink-0">({event.cafe.city})</span>
                          </div>
                        </div>
                      )}

                      <Link
                        to={`/events?tab=events&event=${event.id}`}
                        className="mt-3 block w-full text-center py-2 px-3 bg-brand-background hover:bg-brand-coffee hover:text-white text-brand-charcoal text-xs font-medium rounded-xl border border-brand-border/80 transition-colors"
                      >
                        Event Details & RSVP
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-brand-border p-12 text-center max-w-xl mx-auto">
              <Calendar className="w-12 h-12 text-brand-coffee/40 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">No upcoming events right now</h3>
              <p className="text-sm text-brand-muted mt-1 mb-4">
                Be the first to know about weekend cuppings and workshops in your city.
              </p>
              <Link to="/events?tab=specials">
                <Button variant="outline" size="sm">Browse Active Specials</Button>
              </Link>
            </div>
          )
        ) : (
          specials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {specials.map((special) => (
                <motion.div
                  key={special.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group"
                >
                  {/* Cover photo or placeholder */}
                  <div className="relative h-44 bg-brand-cream/60 overflow-hidden">
                    {special.coverPhotoUrl ? (
                      <img
                        src={special.coverPhotoUrl}
                        alt={special.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-800/10 via-amber-600/10 to-brand-coffee/15 text-amber-800">
                        <Sparkles className="w-10 h-10 opacity-40 mb-1" />
                        <span className="text-xs font-serif font-medium opacity-70">Cafe Special</span>
                      </div>
                    )}

                    {/* Special badge */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-xs">
                        {special.specialType.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Discount or price badge */}
                    <div className="absolute bottom-3 right-3">
                      {special.discountPercent ? (
                        <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                          {special.discountPercent}% OFF
                        </span>
                      ) : special.price ? (
                        <span className="bg-white/95 backdrop-blur-xs text-brand-charcoal text-xs font-bold px-2.5 py-1 rounded-md shadow-xs border border-brand-border">
                          ₱{special.price}
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs">
                          Special Offer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Valid until {formatDate(special.endAt)}</span>
                    </div>

                    <h3 className="font-serif font-bold text-brand-charcoal text-base line-clamp-1 group-hover:text-brand-coffee transition-colors">
                      {special.title}
                    </h3>

                    <p className="text-xs text-brand-muted line-clamp-2 mt-1 mb-3 flex-1">
                      {special.shortDescription || special.description}
                    </p>

                    {/* Cafe info */}
                    {special.cafe && (
                      <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-brand-coffee shrink-0" />
                          <span className="truncate font-medium text-brand-charcoal">{special.cafe.name}</span>
                          <span className="text-[11px] text-brand-muted shrink-0">({special.cafe.city})</span>
                        </div>
                      </div>
                    )}

                    <Link
                      to={`/events?tab=specials&special=${special.id}`}
                      className="mt-3 block w-full text-center py-2 px-3 bg-brand-background hover:bg-brand-coffee hover:text-white text-brand-charcoal text-xs font-medium rounded-xl border border-brand-border/80 transition-colors"
                    >
                      View Special & Perks
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-brand-border p-12 text-center max-w-xl mx-auto">
              <Sparkles className="w-12 h-12 text-amber-600/40 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">No active specials at this moment</h3>
              <p className="text-sm text-brand-muted mt-1 mb-4">
                Check back soon or explore our upcoming cuppings and coffee events.
              </p>
              <Link to="/events?tab=events">
                <Button variant="outline" size="sm">Browse Events</Button>
              </Link>
            </div>
          )
        )}

        {/* Mobile footer link */}
        <div className="mt-8 text-center sm:hidden">
          <Link to={activeTab === 'events' ? '/events?tab=events' : '/events?tab=specials'}>
            <Button variant="outline" className="w-full">
              Explore All Events & Specials
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
