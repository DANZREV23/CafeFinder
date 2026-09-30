import React, { useState, useEffect } from 'react';
import { 
  History, 
  Plus, 
  Trash2, 
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useI18n } from '@/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { clsx } from 'clsx';
import { fetchApi } from '@/services/api';
import { ApiResponse } from '@/types';

interface Redirect {
  id: string;
  oldPath: string;
  newPath: string;
  statusCode: number;
  isActive: boolean;
  createdAt: string;
}

export const AdminRedirectsPage: React.FC = () => {
  const { t, formatDate } = useI18n();
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // New redirect form
  const [oldPath, setOldPath] = useState('');
  const [newPath, setNewPath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRedirects = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<ApiResponse<{ redirects: Redirect[] }>>(`/admin/redirects?search=${search}`);
      if (data.success && data.data) {
        setRedirects(data.data.redirects);
      }
    } catch (error) {
      toast.error('Failed to fetch redirects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedirects();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPath || !newPath) return;

    setIsSubmitting(true);
    try {
      const data = await fetchApi<ApiResponse<any>>('/admin/redirects', {
        method: 'POST',
        body: JSON.stringify({ oldPath, newPath, statusCode: 301 })
      });
      if (data.success) {
        toast.success('Redirect created');
        setOldPath('');
        setNewPath('');
        fetchRedirects();
      } else {
        toast.error(data.error?.message || 'Failed to create redirect');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Error creating redirect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const data = await fetchApi<ApiResponse<any>>(`/admin/redirects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (data.success) {
        toast.success(`Redirect ${!currentStatus ? 'activated' : 'deactivated'}`);
        fetchRedirects();
      }
    } catch (error) {
      toast.error('Failed to update redirect');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this redirect?')) return;
    try {
      const data = await fetchApi<ApiResponse<any>>(`/admin/redirects/${id}`, { method: 'DELETE' });
      if (data.success) {
        toast.success('Redirect deleted');
        fetchRedirects();
      }
    } catch (error) {
      toast.error('Failed to delete redirect');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">{t("admin.redirects")}</h1>
          <p className="text-stone-500">Manage URL redirections to prevent 404 errors when content moves.</p>
        </div>
        <Button variant="primary" size="sm" onClick={fetchRedirects}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-amber-600" />
              Add Redirect
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Old Path (Source)</label>
                <Input 
                  placeholder="/old-slug" 
                  value={oldPath}
                  onChange={(e) => setOldPath(e.target.value)}
                  required
                />
                <p className="text-[10px] text-stone-400">Include the leading slash.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">New Path (Destination)</label>
                <Input 
                  placeholder="/new-slug" 
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Redirect'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 flex items-center gap-4">
            <Search className="text-stone-400" size={18} />
            <Input 
              placeholder="Search redirects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none focus:ring-0"
            />
          </Card>

          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Mapping</th>
                  <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                      <RefreshCw className="mx-auto animate-spin mb-2" size={24} />
                      Loading redirects...
                    </td>
                  </tr>
                ) : redirects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                      <History className="mx-auto mb-2 opacity-20" size={48} />
                      No redirects found.
                    </td>
                  </tr>
                ) : (
                  redirects.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggle(r.id, r.isActive)}>
                          {r.isActive ? (
                            <CheckCircle2 className="text-green-500" size={20} />
                          ) : (
                            <XCircle className="text-stone-300" size={20} />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-stone-900 font-mono">{r.oldPath}</span>
                          <div className="flex items-center gap-1 text-xs text-stone-400 mt-1">
                            <span>redirects to</span>
                            <span className="font-mono text-stone-600">{r.newPath}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-stone-500">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={r.oldPath} target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={14} />
                          </a>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
};
