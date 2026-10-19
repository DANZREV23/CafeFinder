import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, Trash2, ExternalLink, MoreVertical, Eye, Sparkles } from 'lucide-react';
import { adminListService } from '../../services/adminListService';
import { CuratedList, PostStatus } from '../../types';
import { format } from 'date-fns';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function AdminListsPage() {
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PostStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLists();
  }, [page, status]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const response = await adminListService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      });
      if (response && response.lists) {
        setLists(response.lists);
        setTotalPages(response.pagination?.totalPages || 1);
      } else if (response && response.data) {
        const items = Array.isArray(response.data) ? response.data : (response.data as any).lists || [];
        setLists(items);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to load curated lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: PostStatus) => {
    try {
      const response = await adminListService.updateStatus(id, newStatus);
      if (response.success) {
        setLists(lists.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
      }
    } catch (error) {
      console.error('Failed to update list status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this curated list?')) return;
    try {
      const response = await adminListService.delete(id);
      if (response.success) {
        setLists(lists.filter((l) => l.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLists();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">Curated Lists</h1>
          <p className="text-stone-500 mt-1">
            Create, edit, and organize featured themed cafe guides.
          </p>
        </div>
        <Link to="/admin/lists/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create Curated List
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lists by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-stone-400" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as PostStatus | '');
                setPage(1);
              }}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lists Table */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-stone-500">Loading curated lists...</div>
        ) : lists.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            No curated lists found. Create your first list using the button above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Cafes</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Featured</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {lists.map((list) => (
                  <tr key={list.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900 line-clamp-1">{list.title}</div>
                      <div className="text-xs text-stone-400 font-mono">/lists/{list.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-stone-700">
                        {list.cafes?.length ?? list._count?.cafes ?? 0} cafes
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={list.status}
                        onChange={(e) => handleStatusChange(list.id, e.target.value as PostStatus)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border border-transparent cursor-pointer ${
                          list.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 hover:border-emerald-200'
                            : list.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 hover:border-amber-200'
                            : 'bg-stone-100 text-stone-700 hover:border-stone-200'
                        }`}
                      >
                        <option value="DRAFT">DRAFT</option>
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {list.featured ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" /> Featured
                        </span>
                      ) : (
                        <span className="text-stone-400 text-xs">Standard</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-xs">
                      {list.updatedAt ? format(new Date(list.updatedAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {list.status === 'PUBLISHED' && (
                          <Link
                            to={`/lists/${list.slug}`}
                            target="_blank"
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                            title="View public page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          to={`/admin/lists/${list.id}`}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
                          title="Edit list"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(list.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete list"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 bg-stone-50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm bg-white border border-stone-200 rounded-lg font-medium text-stone-700 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-stone-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm bg-white border border-stone-200 rounded-lg font-medium text-stone-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
