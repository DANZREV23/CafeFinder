import React, { useState, useEffect } from 'react';
import { 
  FolderHeart, 
  Search, 
  Trash2, 
  Lock, 
  Globe, 
  User, 
  Calendar, 
  Loader2,
  MoreVertical,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';
import { Link } from 'react-router-dom';

export const AdminCollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  useEffect(() => {
    fetchCollections();
  }, [pagination.page, search, visibility]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await adminService.getCollections({
        page: pagination.page,
        search,
        visibility: visibility || undefined,
        limit: 20
      });
      if (res.success) {
        setCollections(res.data);
        setPagination(prev => ({ ...prev, totalPages: res.pagination.totalPages }));
      }
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection? This action cannot be undone.')) return;
    try {
      await adminService.deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
      toast.success('Collection deleted');
    } catch (error) {
      toast.error('Failed to delete collection');
    }
  };

  const handleToggleVisibility = async (id: string, current: string) => {
    const next = current === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
    try {
      await adminService.updateCollectionVisibility(id, next as any);
      setCollections(prev => prev.map(c => c.id === id ? { ...c, visibility: next } : c));
      toast.success(`Collection set to ${next}`);
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight mb-2">Community Collections</h1>
          <p className="text-stone-500">Monitor and moderate user-created discovery boards.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name, owner, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm"
            />
          </div>
          <select
            value={visibility}
            onChange={(e) => {
              setVisibility(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
          >
            <option value="">All Visibility</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-100">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">Collection</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">Owner</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">Stats</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">Visibility</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-stone-500">Last Updated</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-stone-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {loading && collections.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-stone-100 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-stone-500">
                    <FolderHeart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No collections found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                collections.map((col) => (
                  <tr key={col.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                          <FolderHeart size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-stone-900 truncate max-w-[200px]">{col.name}</p>
                          <p className="text-[10px] text-stone-500 truncate max-w-[200px]">{col.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/admin/users?id=${col.user.id}`} className="flex items-center gap-2 group">
                        <div className="w-6 h-6 rounded-full bg-stone-200 overflow-hidden flex items-center justify-center">
                          <User size={12} className="text-stone-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-stone-900 group-hover:text-amber-600 transition-colors">{col.user.name}</p>
                          <p className="text-[10px] text-stone-500">{col.user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-stone-700">{col._count?.items || 0} items</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        col.visibility === 'PUBLIC' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {col.visibility === 'PUBLIC' ? <Globe size={10} /> : <Lock size={10} />}
                        {col.visibility}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
                        <Calendar size={12} />
                        {format(new Date(col.updatedAt), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors text-stone-400">
                            <MoreVertical size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {col.visibility === 'PUBLIC' && (
                            <DropdownMenuItem asChild>
                              <a href={`/collections/${col.user.name}/${col.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                <ExternalLink size={14} />
                                <span>View Public Page</span>
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleToggleVisibility(col.id, col.visibility)} className="flex items-center gap-2">
                            <Lock size={14} />
                            <span>Force {col.visibility === 'PUBLIC' ? 'Private' : 'Public'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600 flex items-center gap-2"
                            onClick={() => handleDelete(col.id)}
                          >
                            <Trash2 size={14} />
                            <span>Delete Collection</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="p-6 border-t border-stone-100 flex items-center justify-between">
            <p className="text-xs text-stone-500 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Flagged/Reported warning placeholder */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Moderation Note</h4>
          <p className="text-xs text-amber-700 mt-1">
            Collections are visible based on user privacy settings. Private collections are only visible to the owner and admins.
            Deleting a collection will NOT remove the cafes from the platform, only from this specific board.
          </p>
        </div>
      </div>
    </div>
  );
};
