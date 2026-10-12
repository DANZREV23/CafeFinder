import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Inbox,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Search,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import {
  inquiryService,
  OwnerInquiryItem,
  INQUIRY_CATEGORIES,
} from '../services/inquiryService';
import { ownerService, OwnerCafeSummary } from '../services/ownerService';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Inquiries' },
  { key: 'NEW', label: 'New / Unread' },
  { key: 'READ', label: 'Read' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESPONDED', label: 'Responded' },
  { key: 'CLOSED', label: 'Closed' },
  { key: 'SPAM', label: 'Spam' },
];

export default function OwnerInquiriesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCafeId = searchParams.get('cafeId') || '';
  const initialStatus = searchParams.get('status') || 'ALL';

  const [inquiries, setInquiries] = useState<OwnerInquiryItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cafes, setCafes] = useState<OwnerCafeSummary[]>([]);

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [cafeFilter, setCafeFilter] = useState(initialCafeId);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ownerService
      .getOwnedCafes(1)
      .then((res) => {
        if (res.success) setCafes(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inquiryService.getOwnerInquiries({
        cafeId: cafeFilter || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: 20,
      });

      if (res.success) {
        setInquiries(res.data);
        setCounts(res.counts || {});
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, cafeFilter, categoryFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInquiries();
  };

  const getCategoryLabel = (cat: string) =>
    INQUIRY_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
            New
          </span>
        );
      case 'READ':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Read
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            In Progress
          </span>
        );
      case 'RESPONDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Responded
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
            Closed
          </span>
        );
      case 'SPAM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
            Spam
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-16 space-y-8">
        <div>
          <Link
            to="/owner"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Owner Dashboard
          </Link>
          <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">
                Owner Communication
              </p>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal mt-1">
                Customer Inquiries
              </h1>
              <p className="text-brand-muted mt-1">
                Respond to visitor questions about hours, menu options, reservations, and events.
              </p>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-brand-border pb-4">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === 'ALL'
                ? Object.values(counts).reduce((a: number, b: number) => a + b, 0)
                : counts[tab.key] || 0;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-brand-charcoal text-white shadow-sm'
                    : 'bg-white border border-brand-border text-brand-muted hover:text-brand-charcoal'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-brand-border">
          <div>
            <label htmlFor="owner-cafe-filter" className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1">
              Cafe
            </label>
            <select
              id="owner-cafe-filter"
              value={cafeFilter}
              onChange={(e) => {
                setCafeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm bg-white"
            >
              <option value="">All My Cafes</option>
              {cafes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="owner-category-filter" className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1">
              Category
            </label>
            <select
              id="owner-category-filter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-brand-border px-3 py-2 text-sm bg-white"
            >
              <option value="ALL">All Categories</option>
              {INQUIRY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearchSubmit}>
            <label htmlFor="owner-inquiry-search" className="block text-[10px] font-black uppercase tracking-widest text-brand-muted mb-1">
              Search Subject / Message
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="owner-inquiry-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inquiries..."
                  className="w-full rounded-xl border border-brand-border pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <Button type="submit" variant="outline" size="sm" className="rounded-xl">
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-brand-border text-center space-y-3">
            <Inbox className="w-10 h-10 text-brand-muted mx-auto" />
            <h3 className="text-lg font-bold text-brand-charcoal">No inquiries found</h3>
            <p className="text-sm text-brand-muted">
              There are no customer inquiries matching your current filters.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inq) => (
              <Link
                key={inq.id}
                to={`/owner/inquiries/${inq.id}`}
                className={`block p-5 rounded-2xl border transition-all group ${
                  inq.status === 'NEW'
                    ? 'bg-brand-cream/40 border-brand-coffee/40 shadow-sm'
                    : 'bg-white border-brand-border hover:border-brand-coffee'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(inq.status)}
                      {inq.priority === 'HIGH' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" /> High Priority
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-stone-100 text-stone-700">
                        {getCategoryLabel(inq.category)}
                      </span>
                      <span className="text-xs font-bold text-brand-coffee">
                        {inq.cafe.name}
                      </span>
                      {inq.event && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Calendar className="w-3 h-3" /> {inq.event.title}
                        </span>
                      )}
                      {inq.special && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" /> {inq.special.title}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-brand-charcoal group-hover:text-brand-coffee transition-colors truncate">
                      {inq.subject}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
                      <span>
                        From: <strong className="text-brand-charcoal">{inq.sender.name}</strong>{' '}
                        ({inq.sender.type === 'GUEST' ? 'Guest' : 'Member'})
                      </span>
                      <span>
                        Received: {new Date(inq.createdAt).toLocaleString()}
                      </span>
                      <span>
                        {inq.responseCount || 0} {inq.responseCount === 1 ? 'response' : 'responses'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-brand-coffee shrink-0">
                    Open <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-brand-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
