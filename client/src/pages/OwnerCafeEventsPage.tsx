import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ChevronLeft, 
  Calendar, 
  Sparkles, 
  Megaphone, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Trash2,
  Globe,
  Send
} from 'lucide-react';
import { fetchApi } from '@/services/api';
import toast from 'react-hot-toast';

export default function OwnerCafeEventsPage() {
  const { id } = useParams<{ id: string }>();
  const [cafeName, setCafeName] = useState('');
  const [activeTab, setActiveTab] = useState<'events' | 'specials' | 'announcements'>('events');
  const [events, setEvents] = useState<any[]>([]);
  const [specials, setSpecials] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Event Form
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    eventType: 'TASTING',
    startAt: '',
    endAt: '',
    price: '',
    location: '',
    publishImmediately: true,
  });

  // New Special Form
  const [specialForm, setSpecialForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    specialType: 'SEASONAL',
    startAt: '',
    endAt: '',
    discountPercent: '',
    price: '',
    terms: '',
    publishImmediately: true,
  });

  // New Announcement Form
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'NORMAL',
    publishImmediately: true,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cafeRes, eventsRes, specialsRes, announcementsRes] = await Promise.all([
        fetchApi<{ success: boolean; data: any }>(`/owner/cafes/${id}`),
        fetchApi<{ success: boolean; data: any[] }>(`/owner/cafes/${id}/events`),
        fetchApi<{ success: boolean; data: any[] }>(`/owner/cafes/${id}/specials`),
        fetchApi<{ success: boolean; data: any[] }>(`/owner/cafes/${id}/announcements`),
      ]);

      setCafeName(cafeRes.data.name);
      setEvents(eventsRes.data || []);
      setSpecials(specialsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
    } catch (err: any) {
      toast.error('Failed to load cafe details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  // Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title || !eventForm.startAt || !eventForm.endAt) {
      toast.error('Title, start time, and end time are required');
      return;
    }

    try {
      setSubmitting(true);
      await fetchApi<{ success: boolean; data: any }>(`/owner/cafes/${id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          title: eventForm.title,
          description: eventForm.description || eventForm.title,
          shortDescription: eventForm.shortDescription,
          eventType: eventForm.eventType,
          startAt: new Date(eventForm.startAt).toISOString(),
          endAt: new Date(eventForm.endAt).toISOString(),
          price: eventForm.price ? parseFloat(eventForm.price) : undefined,
          location: eventForm.location || undefined,
          status: eventForm.publishImmediately ? 'PUBLISHED' : 'DRAFT',
          publishImmediately: eventForm.publishImmediately,
        }),
      });

      toast.success(eventForm.publishImmediately ? 'Event created and published!' : 'Event draft saved!');
      setShowEventModal(false);
      setEventForm({
        title: '',
        description: '',
        shortDescription: '',
        eventType: 'TASTING',
        startAt: '',
        endAt: '',
        price: '',
        location: '',
        publishImmediately: true,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish Event
  const handlePublishEvent = async (eventId: string) => {
    try {
      await fetchApi(`/owner/cafes/${id}/events/${eventId}/publish`, { method: 'POST' });
      toast.success('Event published successfully!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish event');
    }
  };

  // Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await fetchApi(`/owner/cafes/${id}/events/${eventId}`, { method: 'DELETE' });
      toast.success('Event deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete event');
    }
  };

  // Create Special
  const handleCreateSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialForm.title) {
      toast.error('Title is required');
      return;
    }

    try {
      setSubmitting(true);
      await fetchApi<{ success: boolean; data: any }>(`/owner/cafes/${id}/specials`, {
        method: 'POST',
        body: JSON.stringify({
          title: specialForm.title,
          description: specialForm.description || specialForm.title,
          shortDescription: specialForm.shortDescription,
          specialType: specialForm.specialType,
          startAt: specialForm.startAt ? new Date(specialForm.startAt).toISOString() : new Date().toISOString(),
          endAt: specialForm.endAt ? new Date(specialForm.endAt).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString(),
          discountPercent: specialForm.discountPercent ? parseInt(specialForm.discountPercent, 10) : undefined,
          price: specialForm.price ? parseFloat(specialForm.price) : undefined,
          terms: specialForm.terms || undefined,
          status: specialForm.publishImmediately ? 'PUBLISHED' : 'DRAFT',
          publishImmediately: specialForm.publishImmediately,
        }),
      });

      toast.success(specialForm.publishImmediately ? 'Special created and published!' : 'Special draft saved!');
      setShowSpecialModal(false);
      setSpecialForm({
        title: '',
        description: '',
        shortDescription: '',
        specialType: 'SEASONAL',
        startAt: '',
        endAt: '',
        discountPercent: '',
        price: '',
        terms: '',
        publishImmediately: true,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create special');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish Special
  const handlePublishSpecial = async (specialId: string) => {
    try {
      await fetchApi(`/owner/cafes/${id}/specials/${specialId}/publish`, { method: 'POST' });
      toast.success('Special published successfully!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish special');
    }
  };

  // Delete Special
  const handleDeleteSpecial = async (specialId: string) => {
    if (!confirm('Are you sure you want to delete this special offer?')) return;
    try {
      await fetchApi(`/owner/cafes/${id}/specials/${specialId}`, { method: 'DELETE' });
      toast.success('Special deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete special');
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title || !announcementForm.content) {
      toast.error('Title and message content are required');
      return;
    }

    try {
      setSubmitting(true);
      await fetchApi<{ success: boolean; data: any }>(`/owner/cafes/${id}/announcements`, {
        method: 'POST',
        body: JSON.stringify({
          title: announcementForm.title,
          content: announcementForm.content,
          priority: announcementForm.priority,
          status: announcementForm.publishImmediately ? 'PUBLISHED' : 'DRAFT',
          publishImmediately: announcementForm.publishImmediately,
        }),
      });

      toast.success(announcementForm.publishImmediately ? 'Announcement published!' : 'Announcement draft saved!');
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: '',
        content: '',
        priority: 'NORMAL',
        publishImmediately: true,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  // Publish Announcement
  const handlePublishAnnouncement = async (announcementId: string) => {
    try {
      await fetchApi(`/owner/cafes/${id}/announcements/${announcementId}/publish`, { method: 'POST' });
      toast.success('Announcement published successfully!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish announcement');
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await fetchApi(`/owner/cafes/${id}/announcements/${announcementId}`, { method: 'DELETE' });
      toast.success('Announcement deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete announcement');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-brand-muted mb-4">
            <Link to="/owner/cafes" className="hover:text-brand-coffee transition-colors">Cafes</Link>
            <span>/</span>
            <Link to={`/owner/cafes/${id}`} className="hover:text-brand-coffee transition-colors">{cafeName || 'Cafe Details'}</Link>
            <span>/</span>
            <span className="text-brand-charcoal font-medium">Events & Specials</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-brand-charcoal">Events, Specials & Promos</h1>
              <p className="text-brand-muted mt-1">Manage public happenings, cupping dates, seasonal drinks, and cafe promotions for {cafeName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to={`/owner/cafes/${id}`}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Details
                </Link>
              </Button>
              {activeTab === 'events' && (
                <Button onClick={() => setShowEventModal(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Event
                </Button>
              )}
              {activeTab === 'specials' && (
                <Button onClick={() => setShowSpecialModal(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Special
                </Button>
              )}
              {activeTab === 'announcements' && (
                <Button onClick={() => setShowAnnouncementModal(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  New Announcement
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-brand-border gap-6 mb-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`pb-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'events'
                ? 'border-brand-coffee text-brand-coffee font-semibold'
                : 'border-transparent text-brand-muted hover:text-brand-charcoal'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('specials')}
            className={`pb-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'specials'
                ? 'border-brand-coffee text-brand-coffee font-semibold'
                : 'border-transparent text-brand-muted hover:text-brand-charcoal'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Specials & Promos ({specials.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`pb-3 font-medium text-sm border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'announcements'
                ? 'border-brand-coffee text-brand-coffee font-semibold'
                : 'border-transparent text-brand-muted hover:text-brand-charcoal'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            Announcements ({announcements.length})
          </button>
        </div>

        {/* Tab Panels */}
        {loading ? (
          <div className="py-16 text-center text-brand-muted">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-coffee" />
            Loading listings...
          </div>
        ) : activeTab === 'events' ? (
          events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((ev) => (
                <div key={ev.id} className="bg-white rounded-2xl border border-brand-border p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-cream text-brand-coffee">
                        {ev.eventType}
                      </span>
                      <div className="flex items-center gap-2">
                        {ev.status === 'PUBLISHED' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            DRAFT
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1 text-brand-muted hover:text-red-600 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-brand-charcoal">{ev.title}</h3>
                    <p className="text-xs text-brand-coffee font-medium mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ev.startAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-brand-muted mt-2 line-clamp-3">
                      {ev.shortDescription || ev.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                    <span>Price: {ev.price ? `₱${ev.price}` : 'Free'}</span>
                    <div className="flex items-center gap-3">
                      {ev.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublishEvent(ev.id)}
                          className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Publish Now
                        </button>
                      )}
                      <Link to={`/events?tab=events&event=${ev.id}`} className="text-brand-coffee hover:underline font-medium flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Public Page →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-brand-border p-12 text-center">
              <Calendar className="w-12 h-12 text-brand-coffee/30 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">No events created yet</h3>
              <p className="text-sm text-brand-muted mt-1 mb-4">
                Host a coffee cupping, brewing workshop, or acoustic evening to attract coffee lovers.
              </p>
              <Button onClick={() => setShowEventModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            </div>
          )
        ) : activeTab === 'specials' ? (
          specials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specials.map((sp) => (
                <div key={sp.id} className="bg-white rounded-2xl border border-brand-border p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-800">
                        {sp.specialType}
                      </span>
                      <div className="flex items-center gap-2">
                        {sp.status === 'PUBLISHED' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            DRAFT
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteSpecial(sp.id)}
                          className="p-1 text-brand-muted hover:text-red-600 transition-colors"
                          title="Delete Special"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-brand-charcoal">{sp.title}</h3>
                    <p className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Valid through {new Date(sp.endAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-brand-muted mt-2 line-clamp-3">
                      {sp.shortDescription || sp.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-brand-border/60 flex items-center justify-between text-xs text-brand-muted">
                    <span>{sp.discountPercent ? `${sp.discountPercent}% OFF` : sp.price ? `₱${sp.price}` : 'Special Offer'}</span>
                    <div className="flex items-center gap-3">
                      {sp.status !== 'PUBLISHED' && (
                        <button
                          onClick={() => handlePublishSpecial(sp.id)}
                          className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Publish Now
                        </button>
                      )}
                      <Link to={`/events?tab=specials&special=${sp.id}`} className="text-brand-coffee hover:underline font-medium flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Public Page →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-brand-border p-12 text-center">
              <Sparkles className="w-12 h-12 text-amber-600/30 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">No specials created yet</h3>
              <p className="text-sm text-brand-muted mt-1 mb-4">
                Attract regulars with seasonal cascara cold brews, pastry combos, or afternoon happy hours.
              </p>
              <Button onClick={() => setShowSpecialModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Special
              </Button>
            </div>
          )
        ) : (
          announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {announcements.map((an) => (
                <div key={an.id} className="bg-white rounded-2xl border border-amber-200 bg-amber-50/40 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          {an.priority} PRIORITY
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {an.status === 'PUBLISHED' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            PUBLISHED
                          </span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                            DRAFT
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteAnnouncement(an.id)}
                          className="p-1 text-brand-muted hover:text-red-600 transition-colors"
                          title="Delete Announcement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-brand-charcoal">{an.title}</h3>
                    <p className="text-sm text-brand-muted mt-2 whitespace-pre-line">{an.content}</p>
                  </div>
                  {an.status !== 'PUBLISHED' && (
                    <div className="mt-4 pt-3 border-t border-amber-200/80 flex justify-end">
                      <button
                        onClick={() => handlePublishAnnouncement(an.id)}
                        className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Publish Now
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-brand-border p-12 text-center">
              <Megaphone className="w-12 h-12 text-amber-700/30 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-brand-charcoal">No announcements</h3>
              <p className="text-sm text-brand-muted mt-1 mb-4">
                Announcements keep coffee enthusiasts informed about holidays, renovations, and new origin beans.
              </p>
              <Button onClick={() => setShowAnnouncementModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Announcement
              </Button>
            </div>
          )
        )}

        {/* Modal: Create Event */}
        {showEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-serif font-bold text-brand-charcoal mb-4">Create Upcoming Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Title *</label>
                  <Input
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="e.g. Origin Coffee Cupping & Tasting"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">Event Type</label>
                    <select
                      className="w-full rounded-md border border-brand-border p-2 text-sm"
                      value={eventForm.eventType}
                      onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                    >
                      <option value="TASTING">Coffee Cupping & Tasting</option>
                      <option value="WORKSHOP">Brewing / Roasting Workshop</option>
                      <option value="COMPETITION">Latte Art / Barista Competition</option>
                      <option value="LIVE_MUSIC">Live Music & Arts</option>
                      <option value="COMMUNITY">Community / Social</option>
                      <option value="MEETUP">Meetup / Pop-up</option>
                      <option value="CLASS">Barista Class</option>
                      <option value="SEASONAL">Seasonal Special</option>
                      <option value="OTHER">Other Event</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">Price (₱) or 0 for Free</label>
                    <Input
                      type="number"
                      value={eventForm.price}
                      onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                      placeholder="0 for Free Entry"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">Start Date & Time *</label>
                    <Input
                      type="datetime-local"
                      required
                      value={eventForm.startAt}
                      onChange={(e) => setEventForm({ ...eventForm, startAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">End Date & Time *</label>
                    <Input
                      type="datetime-local"
                      required
                      value={eventForm.endAt}
                      onChange={(e) => setEventForm({ ...eventForm, endAt: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Location within Cafe / Area</label>
                  <Input
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="e.g. Brew Bar Station or Patio Lounge"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Short Summary</label>
                  <Input
                    value={eventForm.shortDescription}
                    onChange={(e) => setEventForm({ ...eventForm, shortDescription: e.target.value })}
                    placeholder="Catchy one-liner for search cards"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-brand-border p-2 text-sm"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Describe what guests can expect, gear provided, etc."
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="eventPublishNow"
                    checked={eventForm.publishImmediately}
                    onChange={(e) => setEventForm({ ...eventForm, publishImmediately: e.target.checked })}
                    className="rounded border-brand-border text-brand-coffee focus:ring-brand-coffee"
                  />
                  <label htmlFor="eventPublishNow" className="text-xs text-brand-charcoal cursor-pointer">
                    Publish immediately to public event discovery
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowEventModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : eventForm.publishImmediately ? 'Create & Publish' : 'Save Draft'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Special */}
        {showSpecialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-serif font-bold text-brand-charcoal mb-4">Create Special & Promotion</h2>
              <form onSubmit={handleCreateSpecial} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Title *</label>
                  <Input
                    required
                    value={specialForm.title}
                    onChange={(e) => setSpecialForm({ ...specialForm, title: e.target.value })}
                    placeholder="e.g. Afternoon Cascara Fizz & Croissant Deal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">Special Type</label>
                    <select
                      className="w-full rounded-md border border-brand-border p-2 text-sm"
                      value={specialForm.specialType}
                      onChange={(e) => setSpecialForm({ ...specialForm, specialType: e.target.value })}
                    >
                      <option value="SEASONAL">Seasonal Drink / Dish</option>
                      <option value="HAPPY_HOUR">Happy Hour</option>
                      <option value="COMBO">Pastry & Coffee Combo</option>
                      <option value="DISCOUNT">Discount Deal</option>
                      <option value="LIMITED_TIME">Limited Time Offer</option>
                      <option value="BOGO">Buy One Get One (BOGO)</option>
                      <option value="STUDENT">Student Discount</option>
                      <option value="OTHER">Other Promotion</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">Discount % or Price (₱)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={specialForm.discountPercent}
                        onChange={(e) => setSpecialForm({ ...specialForm, discountPercent: e.target.value })}
                        placeholder="% Off"
                      />
                      <Input
                        type="number"
                        value={specialForm.price}
                        onChange={(e) => setSpecialForm({ ...specialForm, price: e.target.value })}
                        placeholder="₱ Price"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={specialForm.startAt}
                      onChange={(e) => setSpecialForm({ ...specialForm, startAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-charcoal mb-1">End Date</label>
                    <Input
                      type="date"
                      value={specialForm.endAt}
                      onChange={(e) => setSpecialForm({ ...specialForm, endAt: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Terms & Conditions</label>
                  <Input
                    value={specialForm.terms}
                    onChange={(e) => setSpecialForm({ ...specialForm, terms: e.target.value })}
                    placeholder="e.g. Available weekdays 2PM - 5PM only. Dine-in only."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Short Summary</label>
                  <Input
                    value={specialForm.shortDescription}
                    onChange={(e) => setSpecialForm({ ...specialForm, shortDescription: e.target.value })}
                    placeholder="Punchy teaser for the card"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Description</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-brand-border p-2 text-sm"
                    value={specialForm.description}
                    onChange={(e) => setSpecialForm({ ...specialForm, description: e.target.value })}
                    placeholder="Describe what makes this special unique..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="specialPublishNow"
                    checked={specialForm.publishImmediately}
                    onChange={(e) => setSpecialForm({ ...specialForm, publishImmediately: e.target.checked })}
                    className="rounded border-brand-border text-brand-coffee focus:ring-brand-coffee"
                  />
                  <label htmlFor="specialPublishNow" className="text-xs text-brand-charcoal cursor-pointer">
                    Publish immediately to public specials discovery
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowSpecialModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : specialForm.publishImmediately ? 'Create & Publish' : 'Save Draft'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Announcement */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-serif font-bold text-brand-charcoal mb-4">Post Cafe Announcement</h2>
              <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Headline *</label>
                  <Input
                    required
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    placeholder="e.g. Mt. Apo Microlot Fresh Beans Arrived!"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Priority</label>
                  <select
                    className="w-full rounded-md border border-brand-border p-2 text-sm"
                    value={announcementForm.priority}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-charcoal mb-1">Announcement Message *</label>
                  <textarea
                    rows={4}
                    required
                    className="w-full rounded-md border border-brand-border p-2 text-sm"
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    placeholder="Write your announcement message for visitors and regulars..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="announcementPublishNow"
                    checked={announcementForm.publishImmediately}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, publishImmediately: e.target.checked })}
                    className="rounded border-brand-border text-brand-coffee focus:ring-brand-coffee"
                  />
                  <label htmlFor="announcementPublishNow" className="text-xs text-brand-charcoal cursor-pointer">
                    Publish immediately to cafe profile
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setShowAnnouncementModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : announcementForm.publishImmediately ? 'Post Announcement' : 'Save Draft'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
