import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircleQuestion,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import {
  inquiryService,
  CustomerInquiryItem,
  INQUIRY_CATEGORIES,
} from '../services/inquiryService';

export default function CustomerInquiriesPage() {
  const [inquiries, setInquiries] = useState<CustomerInquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadInquiries = async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inquiryService.getMyInquiries(currentPage, 20);
      if (res.success) {
        setInquiries(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries(page);
  }, [page]);

  const getCategoryLabel = (cat: string) =>
    INQUIRY_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESPONDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Responded
          </span>
        );
      case 'IN_PROGRESS':
      case 'READ':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" /> In Review
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Sent
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12 md:py-16 space-y-8">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-coffee font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-brand-charcoal">
                My Cafe Inquiries
              </h1>
              <p className="text-brand-muted mt-1">
                Track questions you have sent to cafes and view owner responses.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link to="/explore">Explore Cafes</Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        ) : inquiries.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white border border-brand-border text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-cream text-brand-coffee flex items-center justify-center mx-auto">
              <MessageCircleQuestion className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-serif font-bold text-brand-charcoal">
              No inquiries yet
            </h2>
            <p className="text-sm text-brand-muted max-w-md mx-auto">
              Have a question about a cafe's hours, menu, Wi-Fi, or events? Use the "Contact Cafe" button on any cafe profile.
            </p>
            <Button asChild variant="primary" className="rounded-xl">
              <Link to="/explore">Browse Cafes</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <Link
                key={inq.id}
                to={`/dashboard/inquiries/${inq.id}`}
                className="block p-6 rounded-2xl bg-white border border-brand-border hover:border-brand-coffee transition-all shadow-sm hover:shadow-md group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {inq.hasUnreadResponse && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-600 text-white">
                          New Reply
                        </span>
                      )}
                      {getStatusBadge(inq.status)}
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-coffee bg-brand-cream px-2.5 py-1 rounded-full">
                        {getCategoryLabel(inq.category)}
                      </span>
                      {inq.event && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
                          <Calendar className="w-3 h-3" /> {inq.event.title}
                        </span>
                      )}
                      {inq.special && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" /> {inq.special.title}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-brand-charcoal group-hover:text-brand-coffee transition-colors truncate">
                      {inq.subject}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted">
                      {inq.cafe && (
                        <span className="font-semibold text-brand-charcoal">
                          Cafe: {inq.cafe.name} ({inq.cafe.city})
                        </span>
                      )}
                      <span>
                        Submitted {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        {inq.responseCount || 0} {inq.responseCount === 1 ? 'message' : 'messages'} in thread
                      </span>
                    </div>

                    {inq.latestResponse && (
                      <div className="mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-700 line-clamp-2">
                        <strong className="text-brand-charcoal">
                          {inq.latestResponse.senderRole === 'OWNER'
                            ? `${inq.cafe?.name || 'Cafe'} Response: `
                            : 'Latest Reply: '}
                        </strong>
                        {inq.latestResponse.message}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-brand-coffee shrink-0">
                    View Thread <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
