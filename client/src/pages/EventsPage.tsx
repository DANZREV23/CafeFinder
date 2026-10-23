import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { eventService, CafeEvent, CafeSpecial } from '@/services/eventService';
import { 
  Calendar, 
  Sparkles, 
  Search, 
  MapPin, 
  Clock, 
  Tag, 
  ChevronRight, 
  Coffee, 
  Ticket, 
  Share2,
  CalendarCheck,
  Flame,
  Filter
} from 'lucide-react';
import { SEO } from '@/components/common/SEO';
import { ContactCafeModal } from '@/components/cafe/ContactCafeModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EVENT_TYPES = [
  { value: 'ALL', label: 'All Events' },
  { value: 'CUPPING', label: 'Coffee Cupping' },
  { value: 'WORKSHOP', label: 'Workshops & Brewing' },
  { value: 'LATTE_ART', label: 'Latte Art' },
  { value: 'LIVE_MUSIC', label: 'Live Music & Arts' },
  { value: 'COMMUNITY', label: 'Community & Social' },
  { value: 'POPUP', label: 'Pop-ups' },
];

const SPECIAL_TYPES = [
  { value: 'ALL', label: 'All Specials' },
  { value: 'SEASONAL', label: 'Seasonal Drinks' },
  { value: 'HAPPY_HOUR', label: 'Happy Hour' },
  { value: 'COMBO', label: 'Pastry & Coffee Combos' },
  { value: 'DISCOUNT', label: 'Discounts & Deals' },
  { value: 'LIMITED_EDITION', label: 'Limited Edition' },
];

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'specials' ? 'specials' : 'events';
  
  const [activeTab, setActiveTab] = useState<'events' | 'specials'>(initialTab);
  const [events, setEvents] = useState<CafeEvent[]>([]);
  const [specials, setSpecials] = useState<CafeSpecial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  // Contact / Inquiry modal
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean;
    cafeId: string;
    cafeName: string;
    eventContext?: { id: string; title: string };
    specialContext?: { id: string; title: string };
  } | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'events') {
        const res = await eventService.getEvents({
          search: search || undefined,
          city: selectedCity || undefined,
          type: selectedType !== 'ALL' ? selectedType : undefined,
          upcoming: true,
          limit: 24,
        });
        if (res.success) {
          setEvents(res.data || []);
        }
      } else {
        const res = await eventService.getSpecials({
          search: search || undefined,
          city: selectedCity || undefined,
          type: selectedType !== 'ALL' ? selectedType : undefined,
          active: true,
          limit: 24,
        });
        if (res.success) {
          setSpecials(res.data || []);
        }
      }
    } catch {
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab, search, selectedCity, selectedType]);

  const handleTabChange = (tab: 'events' | 'specials') => {
    setActiveTab(tab);
    setSelectedType('ALL');
    setSearchParams({ tab });
  };

  const isHappeningSoon = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 72; // within next 3 days
  };

  const formatEventDate = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const isSameDay = start.toDateString() === end.toDateString();

    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit' 
    };

    if (isSameDay) {
      return `${start.toLocaleDateString(undefined, dateOptions)} • ${start.toLocaleTimeString([], timeOptions)} - ${end.toLocaleTimeString([], timeOptions)}`;
    }
    return `${start.toLocaleDateString(undefined, dateOptions)} - ${end.toLocaleDateString(undefined, dateOptions)}`;
  };

  return (
    <MainLayout>
      <SEO
        title="Cafe Events, Specials & Promotions | CafeFinder"
        description="Discover upcoming coffee cuppings, latte art workshops, live acoustic sessions, seasonal drinks, and limited-time promotions at local cafes."
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-brand-cream/80 via-brand-cream/30 to-white border-b border-brand-border py-12 md:py-16">
        <PageContainer>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-coffee/10 text-brand-coffee font-medium text-xs mb-4">
              <Flame className="w-4 h-4 text-amber-600" />
              Time-Sensitive Cafe Discovery
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-coffee-dark mb-4">
              Events, Specials & Community Pop-Ups
            </h1>
            <p className="text-brand-muted text-base md:text-lg mb-8 leading-relaxed">
              Explore coffee cuppings, barista workshops, live music sessions, seasonal cascara creations, and exclusive limited-time deals happening at your neighborhood coffee shops.
            </p>

            {/* Main Tabs */}
            <div className="flex bg-brand-cream/80 p-1.5 rounded-2xl border border-brand-border/80 max-w-md shadow-xs">
              <button
                onClick={() => handleTabChange('events')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer",
                  activeTab === 'events'
                    ? "bg-brand-coffee text-white shadow-sm"
                    : "text-brand-coffee/80 hover:text-brand-coffee hover:bg-white/60"
                )}
              >
                <Calendar className="w-4 h-4" />
                Upcoming Events
              </button>
              <button
                onClick={() => handleTabChange('specials')}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer",
                  activeTab === 'specials'
                    ? "bg-brand-coffee text-white shadow-sm"
                    : "text-brand-coffee/80 hover:text-brand-coffee hover:bg-white/60"
                )}
              >
                <Sparkles className="w-4 h-4" />
                Active Specials
              </button>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="py-8 md:py-12">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
            <input
              type="text"
              placeholder={activeTab === 'events' ? "Search events or cafes..." : "Search specials, deals, or drinks..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20 shadow-xs"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-brand-border bg-white text-sm text-brand-coffee font-medium focus:outline-none focus:ring-2 focus:ring-brand-coffee/20 shadow-xs"
            >
              <option value="">All Locations</option>
              <option value="Manila">Manila</option>
              <option value="Quezon City">Quezon City</option>
              <option value="Makati">Makati</option>
              <option value="Taguig">Taguig</option>
              <option value="Davao">Davao</option>
              <option value="Cebu">Cebu</option>
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {(activeTab === 'events' ? EVENT_TYPES : SPECIAL_TYPES).map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border",
                selectedType === type.value
                  ? "bg-brand-coffee text-white border-brand-coffee shadow-xs"
                  : "bg-white text-brand-muted border-brand-border hover:border-brand-coffee hover:text-brand-coffee"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl border border-brand-border p-5 space-y-4">
                <div className="w-full h-44 bg-brand-cream/60 rounded-2xl" />
                <div className="h-4 bg-brand-cream rounded w-1/3" />
                <div className="h-6 bg-brand-cream rounded w-3/4" />
                <div className="h-10 bg-brand-cream rounded" />
              </div>
            ))}
          </div>
        ) : activeTab === 'events' ? (
          /* Events Grid */
          events.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-brand-border p-8 max-w-lg mx-auto">
              <Calendar className="w-12 h-12 text-brand-muted mx-auto mb-3" />
              <h3 className="text-xl font-serif font-bold text-brand-coffee-dark mb-2">No Upcoming Events Found</h3>
              <p className="text-sm text-brand-muted mb-6">
                No events match your current search filters. Check back soon for live cuppings, workshops, and music sessions!
              </p>
              <button
                onClick={() => { setSearch(''); setSelectedCity(''); setSelectedType('ALL'); }}
                className="px-5 py-2.5 rounded-xl bg-brand-coffee text-white text-xs font-semibold hover:bg-brand-coffee-dark transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const soon = isHappeningSoon(event.startAt);
                const coverImage = event.coverPhotoUrl || event.cafe?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800';

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-3xl border border-brand-border overflow-hidden shadow-xs hover:shadow-md hover:border-brand-coffee/40 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Banner */}
                      <div className="relative h-48 w-full overflow-hidden bg-brand-cream">
                        <img
                          src={coverImage}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-bold text-brand-coffee-dark uppercase tracking-wider shadow-xs">
                            {event.eventType.replace('_', ' ')}
                          </span>
                          {soon && (
                            <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                              <Flame className="w-3 h-3" /> Soon
                            </span>
                          )}
                        </div>

                        {event.price !== undefined && (
                          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-xs text-white text-xs font-bold">
                            {Number(event.price) === 0 ? 'Free Entry' : `₱${Number(event.price).toFixed(2)}`}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {event.cafe && (
                          <Link
                            to={`/cafes/${event.cafe.slug}`}
                            className="text-xs font-semibold text-brand-coffee hover:underline block mb-1.5"
                          >
                            {event.cafe.name} • {event.cafe.city}
                          </Link>
                        )}

                        <h3 className="text-xl font-bold text-brand-coffee-dark mb-2 line-clamp-2">
                          {event.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-brand-muted mb-3">
                          <Clock className="w-3.5 h-3.5 text-brand-coffee shrink-0" />
                          <span>{formatEventDate(event.startAt, event.endAt)}</span>
                        </div>

                        <p className="text-sm text-brand-muted line-clamp-3 mb-4 leading-relaxed">
                          {event.shortDescription || event.description}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-6 pt-0 border-t border-brand-border/40 mt-auto flex items-center justify-between gap-3 pt-4">
                      {event.cafe && (
                        <Link
                          to={`/cafes/${event.cafe.slug}`}
                          className="text-xs font-semibold text-brand-muted hover:text-brand-coffee flex items-center gap-1"
                        >
                          Cafe Profile <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      <div className="flex gap-2">
                        {event.cafe && (
                          <button
                            onClick={() =>
                              setContactModal({
                                isOpen: true,
                                cafeId: event.cafeId,
                                cafeName: event.cafe!.name,
                                eventContext: { id: event.id, title: event.title },
                              })
                            }
                            className="px-4 py-2 rounded-xl bg-brand-coffee text-white text-xs font-semibold hover:bg-brand-coffee-dark transition cursor-pointer shadow-xs"
                          >
                            RSVP / Inquire
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* Specials Grid */
          specials.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-brand-border p-8 max-w-lg mx-auto">
              <Sparkles className="w-12 h-12 text-brand-muted mx-auto mb-3" />
              <h3 className="text-xl font-serif font-bold text-brand-coffee-dark mb-2">No Active Specials Found</h3>
              <p className="text-sm text-brand-muted mb-6">
                No active cafe specials match your current search criteria. Check back soon for new happy hours and seasonal menu promos!
              </p>
              <button
                onClick={() => { setSearch(''); setSelectedCity(''); setSelectedType('ALL'); }}
                className="px-5 py-2.5 rounded-xl bg-brand-coffee text-white text-xs font-semibold hover:bg-brand-coffee-dark transition cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {specials.map((special) => {
                const coverImage = special.coverPhotoUrl || special.cafe?.photos?.[0]?.url || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800';

                return (
                  <div
                    key={special.id}
                    className="bg-white rounded-3xl border border-brand-border overflow-hidden shadow-xs hover:shadow-md hover:border-brand-coffee/40 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Banner */}
                      <div className="relative h-48 w-full overflow-hidden bg-brand-cream">
                        <img
                          src={coverImage}
                          alt={special.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-bold text-brand-coffee-dark uppercase tracking-wider shadow-xs">
                            {special.specialType.replace('_', ' ')}
                          </span>
                        </div>

                        {special.discountPercent ? (
                          <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-xs">
                            {special.discountPercent}% OFF
                          </div>
                        ) : special.price ? (
                          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-black/75 backdrop-blur-xs text-white text-xs font-bold">
                            ₱{Number(special.price).toFixed(2)}
                          </div>
                        ) : null}
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        {special.cafe && (
                          <Link
                            to={`/cafes/${special.cafe.slug}`}
                            className="text-xs font-semibold text-brand-coffee hover:underline block mb-1.5"
                          >
                            {special.cafe.name} • {special.cafe.city}
                          </Link>
                        )}

                        <h3 className="text-xl font-bold text-brand-coffee-dark mb-2 line-clamp-2">
                          {special.title}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-brand-muted mb-3">
                          <Clock className="w-3.5 h-3.5 text-brand-coffee shrink-0" />
                          <span>Valid through {new Date(special.endAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>

                        <p className="text-sm text-brand-muted line-clamp-3 mb-4 leading-relaxed">
                          {special.shortDescription || special.description}
                        </p>

                        {special.terms && (
                          <div className="bg-brand-cream/60 p-3 rounded-xl text-xs text-brand-muted mb-2">
                            <span className="font-semibold block mb-0.5">Terms:</span>
                            {special.terms}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-6 pt-0 border-t border-brand-border/40 mt-auto flex items-center justify-between gap-3 pt-4">
                      {special.cafe && (
                        <Link
                          to={`/cafes/${special.cafe.slug}`}
                          className="text-xs font-semibold text-brand-muted hover:text-brand-coffee flex items-center gap-1"
                        >
                          Cafe Profile <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}

                      {special.cafe && (
                        <button
                          onClick={() =>
                            setContactModal({
                              isOpen: true,
                              cafeId: special.cafeId,
                              cafeName: special.cafe!.name,
                              specialContext: { id: special.id, title: special.title },
                            })
                          }
                          className="px-4 py-2 rounded-xl bg-brand-coffee text-white text-xs font-semibold hover:bg-brand-coffee-dark transition cursor-pointer shadow-xs"
                        >
                          Claim / Inquire
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </PageContainer>

      {/* Inquiry Modal */}
      {contactModal && (
        <ContactCafeModal
          isOpen={contactModal.isOpen}
          onClose={() => setContactModal(null)}
          cafeId={contactModal.cafeId}
          cafeName={contactModal.cafeName}
          eventContext={contactModal.eventContext}
          specialContext={contactModal.specialContext}
          defaultCategory={contactModal.eventContext ? 'EVENT' : contactModal.specialContext ? 'SPECIAL' : 'GENERAL'}
          defaultSubject={
            contactModal.eventContext
              ? `RSVP / Inquiry: ${contactModal.eventContext.title}`
              : contactModal.specialContext
              ? `Special Offer Inquiry: ${contactModal.specialContext.title}`
              : undefined
          }
        />
      )}
    </MainLayout>
  );
}
