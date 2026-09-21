import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle2, 
  Eye, 
  Search, 
  XCircle, 
  FileText, 
  AlertCircle, 
  Coffee,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { adminChangeRequestService } from '../../services/adminChangeRequestService';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export default function AdminChangeRequestsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'PENDING';
  const search = params.get('search') || '';
  const page = parseInt(params.get('page') || '1');
  
  const [requests, setRequests] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminChangeRequestService.getRequests({ 
        status: status !== 'ALL' ? status : '', 
        search, 
        page: page.toString(), 
        limit: '20' 
      });
      if (res.success) {
        setRequests(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load change requests');
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleStatusChange = (newStatus: string) => {
    setParams({ status: newStatus, search, page: '1' });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get('search') as string;
    setParams({ status, search: searchValue, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setParams({ status, search, page: newPage.toString() });
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Rejection reason (at least 5 characters):');
    if (!reason || reason.trim().length < 5) return;
    try {
      await adminChangeRequestService.reject(id, reason.trim());
      loadRequests();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const approve = async (id: string) => {
    if (!window.confirm('Approve these cafe changes?')) return;
    try {
      await adminChangeRequestService.approve(id);
      loadRequests();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Cafe Change Requests</h1>
          <p className="text-stone-500 text-sm">Review owner-submitted modification requests for existing cafes.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'].map((s) => (
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
              placeholder="Search by cafe or owner..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
          <button onClick={() => void loadRequests()} className="text-xs font-bold text-red-600 hover:underline">
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-6 flex items-center gap-6 animate-pulse">
                <div className="w-12 h-12 bg-stone-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-stone-100 rounded w-1/4" />
                  <div className="h-4 bg-stone-100 rounded w-1/3" />
                </div>
                <div className="w-24 h-8 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">No requests found</h3>
            <p className="text-stone-500 max-w-sm mx-auto">
              There are no {status.toLowerCase()} change requests matching your criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {requests.map((request) => (
              <div key={request.id} className="p-5 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-stone-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 truncate">{request.cafe.name}</p>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span className="font-medium text-stone-700">{request.requestedBy.name}</span>
                        <span>•</span>
                        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">{request.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Date Requested</p>
                    <p className="text-sm text-stone-600">{format(new Date(request.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  
                  <div className="w-28 flex justify-center">
                    <AdminStatusBadge type="submission" status={request.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/admin/change-requests/${request.id}`} 
                      className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    
                    {request.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => approve(request.id)} 
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Approve Changes"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => reject(request.id)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject Changes"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
          
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }).map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === pagination.totalPages || (p >= page - 1 && p <= page + 1)) {
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={clsx(
                      "w-10 h-10 rounded-lg font-bold text-sm transition-all",
                      page === p 
                        ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" 
                        : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    {p}
                  </button>
                );
              }
              if (p === page - 2 || p === page + 2) {
                return <span key={p} className="text-stone-400 italic text-sm">...</span>;
              }
              return null;
            })}
          </div>

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
}
