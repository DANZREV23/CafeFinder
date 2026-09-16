import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Coffee, 
  User, 
  Calendar,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  EyeOff
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { CafeReview, PaginatedResponse } from '../../types';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const AdminReviewsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState<CafeReview[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<CafeReview>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = searchParams.get('status') || 'PENDING';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getReviews({ 
        status, 
        search, 
        page, 
        limit: 20 
      });
      if (res.success) {
        setReviews(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    setSearchParams({ status, search: searchValue, page: '1' });
  };

  const handleStatusChange = (newStatus: string) => {
    setSearchParams({ status: newStatus, search, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ status, search, page: newPage.toString() });
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await adminService.approveReview(id);
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve review');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Reject this review? It will not be visible publicly.')) return;
    try {
      const res = await adminService.rejectReview(id);
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject review');
    }
  };

  const handleHide = async (id: string) => {
    try {
      const res = await adminService.hideReview(id);
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'HIDDEN' } : r));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to hide review');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Review Moderation</h1>
          <p className="text-stone-500 text-sm">Approve or reject user reviews and photos.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'ALL'].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={clsx(
                  "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                  status === s 
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" 
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search cafe, user, or comment..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </form>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 flex items-center gap-6 animate-pulse">
                <div className="w-12 h-12 bg-stone-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-stone-100 rounded w-1/4" />
                  <div className="h-4 bg-stone-100 rounded w-3/4" />
                </div>
                <div className="w-32 h-8 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-1">Failed to load reviews</h3>
            <p className="text-stone-500 mb-6">{error}</p>
            <button 
              onClick={fetchReviews}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">No reviews found</h3>
            <p className="text-stone-500 max-w-sm mx-auto">
              No {status.toLowerCase()} reviews matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Cafe</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Reviewer</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Rating</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Comment</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded flex items-center justify-center shrink-0">
                          <Coffee className="w-4 h-4 text-amber-600" />
                        </div>
                        <p className="font-bold text-stone-900 text-sm truncate max-w-[150px]">{review.cafe?.name || 'Cafe'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-stone-400" />
                        <div className="min-w-0">
                          <p className="font-medium text-stone-900 truncate">{review.reviewer?.name || review.user?.name}</p>
                          <p className="text-[10px] text-stone-500 truncate">{review.reviewer?.email || review.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-0.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
                        {review.overallRating} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-600 line-clamp-1 max-w-[200px]">
                        {review.comment || <span className="italic opacity-50">No comment</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <AdminStatusBadge type="review" status={review.status as any} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {review.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleApprove(review.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleReject(review.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {review.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleHide(review.id)}
                            className="p-1.5 text-stone-400 hover:bg-stone-50 hover:text-stone-600 rounded-lg transition-colors"
                            title="Hide"
                          >
                            <EyeOff className="w-5 h-5" />
                          </button>
                        )}
                        <Link 
                          to={`/admin/reviews/${review.id}`}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-bold text-stone-600">
            Page {page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === pagination.totalPages}
            className="p-2 rounded-lg bg-white border border-stone-200 text-stone-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
