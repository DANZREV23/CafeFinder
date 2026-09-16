import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, ExternalLink, Coffee, Star, GripVertical } from 'lucide-react';
import { adminListService } from '../../services/adminListService';
import { CuratedList, PostStatus } from '../../types';
import { format } from 'date-fns';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const AdminListsPage: React.FC = () => {
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLists();
  }, [page]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const response = await adminListService.getAll({
        page,
        limit: 10,
        search: search || undefined
      });
      if (response.success) {
        setLists(response.data.lists);
        setTotalPages(response.data.pagination.totalPages);
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
        setLists(lists.map(l => l.id === id ? { ...l, status: newStatus } : l));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    try {
      const response = await adminListService.delete(id);
      if (response.success) {
        setLists(lists.filter(l => l.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Curated Collections</h1>
          <p className="text-neutral-500">Manage hand-picked cafe lists and themed discovery guides.</p>
        </div>
        <Link to="/admin/lists/new">
          <Button leftIcon={<Plus className="w-5 h-5" />}>New Collection</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search collections..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLists()}
            />
          </div>
          
          <div className="text-sm text-neutral-500 font-medium">
            Total Collections: {lists.length}
          </div>
        </div>

        {/* Grid of Collections */}
        <div className="p-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-neutral-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : lists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lists.map((list) => (
                <div key={list.id} className="group bg-white rounded-xl border border-neutral-100 overflow-hidden hover:border-primary-200 hover:shadow-md transition-all">
                  <div className="relative aspect-video overflow-hidden bg-neutral-100">
                    <img
                      src={list.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80'}
                      alt={list.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      {list.featured && (
                        <span className="bg-primary-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-tighter">
                          Featured
                        </span>
                      )}
                      <Badge variant={list.status === 'PUBLISHED' ? 'success' : list.status === 'DRAFT' ? 'warning' : 'outline'}>
                        {list.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-1">{list.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Coffee className="w-3 h-3" />
                        {list._count?.cafes || 0} Cafes
                      </span>
                      <span>Order: {list.sortOrder}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-neutral-50">
                      <div className="flex gap-1">
                        <select
                          className="text-[10px] font-black uppercase bg-neutral-50 border-none rounded px-2 py-1 cursor-pointer focus:ring-0"
                          value={list.status}
                          onChange={(e) => handleStatusChange(list.id, e.target.value as PostStatus)}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Publish</option>
                          <option value="ARCHIVED">Archive</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link to={`/lists/${list.slug}`} target="_blank">
                          <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link to={`/admin/lists/${list.id}/edit`}>
                          <button className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDelete(list.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-100">
              <p className="text-neutral-500">No collections found. Create your first themed cafe list!</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm font-bold transition-all ${
                  page === p ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 border border-neutral-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminListsPage;
