import React, { useEffect, useState, useCallback } from 'react';
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  History, 
  User, 
  Clock, 
  Calendar,
  AlertCircle,
  Database,
  Tag
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { ActivityLog, PaginatedResponse } from '../../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const AdminActivityLogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<ActivityLog>['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const action = searchParams.get('action') || '';
  const entityType = searchParams.get('entityType') || '';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getActivityLogs({ 
        action, 
        entityType, 
        search, 
        page, 
        limit: 50 
      });
      if (res.success) {
        setLogs(res.data);
        setPagination(res.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [action, entityType, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearchParams({ action, entityType, search: formData.get('search') as string, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ action, entityType, search, page: newPage.toString() });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">System Activity Logs</h1>
          <p className="text-stone-500 text-sm">Monitor all administrative actions and system changes.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Action Type</label>
            <select 
              value={action} 
              onChange={(e) => setSearchParams({ action: e.target.value, entityType, search, page: '1' })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Actions</option>
              <option value="APPROVE_SUBMISSION">Approve Submission</option>
              <option value="REJECT_SUBMISSION">Reject Submission</option>
              <option value="APPROVE_REVIEW">Approve Review</option>
              <option value="REJECT_REVIEW">Reject Review</option>
              <option value="HIDE_REVIEW">Hide Review</option>
              <option value="UPDATE_CAFE_STATUS">Update Cafe Status</option>
              <option value="UPDATE_USER_STATUS">Update User Status</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Entity Type</label>
            <select 
              value={entityType} 
              onChange={(e) => setSearchParams({ action, entityType: e.target.value, search, page: '1' })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg text-sm p-2 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Entities</option>
              <option value="CAFE">Cafe</option>
              <option value="CAFE_SUBMISSION">Cafe Submission</option>
              <option value="CAFE_REVIEW">Cafe Review</option>
              <option value="USER">User</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1">Search</label>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search by description..."
                className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-stone-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-stone-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-stone-100 rounded w-1/2" />
                  <div className="h-3 bg-stone-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center text-stone-400">No logs found.</div>
        ) : (
          <div className="divide-y divide-stone-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 sm:p-6 hover:bg-stone-50 transition-colors">
                 <div className="flex gap-4">
                    <div className="shrink-0 pt-1">
                       <div className={clsx(
                         "w-10 h-10 rounded-xl flex items-center justify-center border",
                         log.action.includes('REJECT') || log.action.includes('SUSPEND') || log.action.includes('HIDE')
                           ? "bg-red-50 text-red-600 border-red-100"
                           : log.action.includes('APPROVE') || log.action.includes('PUBLISH') || log.action.includes('ACTIVE')
                             ? "bg-green-50 text-green-600 border-green-100"
                             : "bg-stone-50 text-stone-600 border-stone-100"
                       )}>
                          <History className="w-5 h-5" />
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <p className="font-bold text-stone-900">{log.description || log.action}</p>
                          <div className="flex items-center gap-2 text-xs text-stone-400 whitespace-nowrap">
                             <Calendar className="w-3.5 h-3.5" />
                             {format(new Date(log.createdAt), 'MMM d, yyyy • p')}
                          </div>
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                             <User className="w-3.5 h-3.5 text-stone-400" />
                             By <span className="text-stone-900">{log.user?.name || 'System'}</span>
                          </div>
                          
                          {log.entityType && (
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                               <Database className="w-3.5 h-3.5 text-stone-400" />
                               {log.entityType} ID: <span className="font-mono text-stone-900">{log.entityId}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-bold uppercase tracking-widest px-2 py-0.5 bg-stone-100 rounded-full border border-stone-200">
                             <Tag className="w-2.5 h-2.5" />
                             {log.action}
                          </div>
                       </div>
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
