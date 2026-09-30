import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Coffee, 
  MapPin, 
  User, 
  Calendar,
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { CafeSubmission, PaginatedResponse } from '../../types';
import { AdminStatusBadge } from '../../components/admin/AdminStatusBadge';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

import { Tabs, TabsList, TabsTrigger } from "../../components/ui/Tabs";

export const AdminSubmissionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<CafeSubmission[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<CafeSubmission>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = searchParams.get('status') || 'PENDING';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getSubmissions({ 
        status, 
        search, 
        page, 
        limit: 20 
      });
      if (res.success) {
        setSubmissions(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Cafe Submissions</h1>
          <p className="text-stone-500 text-sm">Review and moderate community-submitted cafes.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <Tabs value={status} onValueChange={handleStatusChange} className="w-full md:w-auto">
            <TabsList className="w-full flex-wrap justify-start h-auto bg-stone-100 p-1.5 gap-1">
              {['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'].map((s) => (
                <TabsTrigger 
                  key={s} 
                  value={s}
                  className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-white data-[state=active]:text-brand-coffee data-[state=active]:shadow-sm"
                >
                  {s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" aria-hidden="true" />
            <label htmlFor="search-submissions" className="sr-only">Search submissions</label>
            <input
              id="search-submissions"
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search by name, city, or submitter..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all focus:outline-none"
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
                <div className="w-12 h-12 bg-stone-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-stone-100 rounded w-1/4" />
                  <div className="h-4 bg-stone-100 rounded w-1/3" />
                </div>
                <div className="w-24 h-8 bg-stone-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-stone-900 mb-1">Failed to load submissions</h3>
            <p className="text-stone-500 mb-6">{error}</p>
            <button 
              onClick={fetchSubmissions}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-amber-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Coffee className="w-10 h-10 text-stone-300" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">No submissions found</h3>
            <p className="text-stone-500 max-w-sm mx-auto">
              There are no {status.toLowerCase()} submissions matching your search criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Cafe</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Submitted By</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                            <Coffee className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate">{sub.name}</p>
                            <p className="text-xs text-stone-500 truncate">{sub.shortDescription}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="truncate">{sub.city}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-stone-600">
                          <User className="w-4 h-4 text-stone-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-stone-900 truncate">{sub.submittedBy?.name}</p>
                            <p className="text-[10px] text-stone-500 truncate">{sub.submittedBy?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-600 whitespace-nowrap">
                        {format(new Date(sub.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <AdminStatusBadge type="submission" status={sub.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/admin/submissions/${sub.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-stone-100">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{sub.name}</p>
                        <AdminStatusBadge type="submission" status={sub.status} size="sm" />
                      </div>
                    </div>
                    <Link to={`/admin/submissions/${sub.id}`} className="p-2 text-stone-400">
                      <MoreVertical className="w-5 h-5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Location</p>
                      <p className="text-stone-700 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" /> {sub.city}
                      </p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Submitted By</p>
                      <p className="text-stone-700">{sub.submittedBy?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</p>
                      <p className="text-stone-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {format(new Date(sub.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <Link 
                    to={`/admin/submissions/${sub.id}`}
                    className="block w-full text-center py-2.5 bg-stone-100 text-stone-700 text-sm font-bold rounded-xl hover:bg-stone-200 transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </>
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
              // Show only first, last, and pages around current
              if (
                p === 1 || 
                p === pagination.totalPages || 
                (p >= page - 1 && p <= page + 1)
              ) {
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
};
