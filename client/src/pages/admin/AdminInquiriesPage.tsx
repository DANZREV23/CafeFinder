import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import {
  inquiryService,
  OwnerInquiryItem,
  InquiryStatus,
  INQUIRY_CATEGORIES,
} from '../../services/inquiryService';

export const AdminInquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<OwnerInquiryItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inquiryService.getAdminInquiries({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: search.trim() || undefined,
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
    loadData();
  }, [statusFilter, categoryFilter, page]);

  const handleQuickStatus = async (id: string, status: InquiryStatus) => {
    try {
      await inquiryService.updateOwnerInquiry(id, { status });
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update inquiry status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Customer Inquiries Moderation</h1>
          <p className="text-sm text-stone-500">
            Monitor cafe inquiries, filter spam, and oversee owner-customer communications.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New ({counts.NEW || 0})</option>
            <option value="READ">Read ({counts.READ || 0})</option>
            <option value="IN_PROGRESS">In Progress ({counts.IN_PROGRESS || 0})</option>
            <option value="RESPONDED">Responded ({counts.RESPONDED || 0})</option>
            <option value="CLOSED">Closed ({counts.CLOSED || 0})</option>
            <option value="SPAM">Spam ({counts.SPAM || 0})</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
          >
            <option value="ALL">All Categories</option>
            {INQUIRY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            loadData();
          }}
        >
          <label className="block text-xs font-bold text-stone-500 uppercase mb-1">
            Search
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, message, cafe..."
                className="w-full rounded-xl border border-stone-200 pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-stone-200 text-center space-y-2">
          <Inbox className="w-10 h-10 text-stone-400 mx-auto" />
          <p className="font-bold text-stone-800">No inquiries found</p>
          <p className="text-sm text-stone-500">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase">
                  <th className="p-4">Subject & Sender</th>
                  <th className="p-4">Cafe</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-sm">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-stone-50/80">
                    <td className="p-4">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        {inq.priority === 'HIGH' && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <Link
                          to={`/owner/inquiries/${inq.id}`}
                          className="hover:text-amber-600 transition-colors"
                        >
                          {inq.subject}
                        </Link>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {inq.sender.name} ({inq.sender.type}) • {inq.responseCount || 0} replies
                      </div>
                    </td>
                    <td className="p-4 font-medium text-stone-800">{inq.cafe.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                        {inq.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          inq.status === 'SPAM'
                            ? 'bg-red-100 text-red-700'
                            : inq.status === 'RESPONDED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : inq.status === 'NEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {inq.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-stone-500">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/owner/inquiries/${inq.id}`}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700 inline-flex items-center gap-1"
                        >
                          Inspect <ExternalLink className="w-3 h-3" />
                        </Link>
                        {inq.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(inq.id, 'CLOSED')}
                            className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100"
                            title="Close Inquiry"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {inq.status !== 'SPAM' && (
                          <button
                            type="button"
                            onClick={() => handleQuickStatus(inq.id, 'SPAM')}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                            title="Mark as Spam"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquiriesPage;
