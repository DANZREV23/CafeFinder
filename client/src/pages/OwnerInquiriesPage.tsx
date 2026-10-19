import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircleQuestion,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  Calendar,
  Filter,
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/ui/Button';
import { inquiryService, INQUIRY_CATEGORIES } from '../services/inquiryService';

export default function OwnerInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const loadInquiries = async (currentPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await inquiryService.getOwnerInquiries({
        page: currentPage,
        limit: 20,
        status: statusFilter ? (statusFilter as any) : undefined,
      });
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
  }, [page, statusFilter]);

  const getCategoryLabel = (cat: string) =>
    INQUIRY_CATEGORIES.find((c) => c.value === cat)?.label || cat;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> New
          </span>
        );
      case 'RESPONDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Responded
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {status}
          </span>
        );
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-12">
        <Link to="/owner" className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-stone-900 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 flex items-center gap-3">
              <MessageCircleQuestion className="w-8 h-8 text-brand-coffee" />
              Customer Inquiries
            </h1>
            <p className="mt-2 text-stone-600">
              Manage and reply to customer inquiries sent to your cafes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-brand-border bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESPONDED">Responded</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
          </div>
        ) : inquiries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <MessageCircleQuestion className="mx-auto h-12 w-12 text-stone-400 mb-4" />
            <h3 className="text-lg font-serif font-semibold text-stone-900">No inquiries found</h3>
            <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
              When customers ask questions about your menu, hours, or events, they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inq) => (
              <Link
                key={inq.id}
                to={`/owner/inquiries/${inq.id}`}
                className="block rounded-2xl border border-brand-border bg-white p-6 shadow-xs hover:border-brand-coffee/40 hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(inq.status)}
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-stone-100 text-stone-700">
                        {getCategoryLabel(inq.category)}
                      </span>
                      {inq.cafe && (
                        <span className="text-xs font-semibold text-brand-coffee">
                          {inq.cafe.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-serif font-bold text-stone-900 line-clamp-1">
                      {inq.subject}
                    </h3>
                    <p className="text-sm text-stone-600 line-clamp-2">
                      {inq.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-stone-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(inq.createdAt).toLocaleDateString()}
                      </span>
                      {inq.customerName && <span>From: {inq.customerName}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-sm font-semibold text-brand-coffee shrink-0">
                    Reply <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="rounded-xl"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm font-medium text-stone-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
