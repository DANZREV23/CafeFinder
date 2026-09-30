import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Edit2, Trash2, ExternalLink, MoreVertical, Eye } from 'lucide-react';
import { adminBlogService } from '../../services/adminBlogService';
import { BlogPost, PostStatus } from '../../types';
import { format } from 'date-fns';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const AdminBlogPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PostStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPosts();
  }, [page, status]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await adminBlogService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined
      });
      if (response.success) {
        setPosts(response.data.posts);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: PostStatus) => {
    try {
      const response = await adminBlogService.updateStatus(id, newStatus);
      if (response.success) {
        setPosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p));
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const response = await adminBlogService.delete(id);
      if (response.success) {
        setPosts(posts.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'PUBLISHED': return 'success';
      case 'DRAFT': return 'warning';
      case 'ARCHIVED': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Blog Management</h1>
          <p className="text-neutral-500">Create and manage your cafe discovery articles.</p>
        </div>
        <Link to="/admin/blog/new">
          <Button leftIcon={<Plus className="w-5 h-5" />}>New Article</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
              />
            </div>
            <select
              className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus | '')}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          
          <div className="text-sm text-neutral-500 font-medium">
            Total Articles: {posts.length}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Article</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">Published</th>
                <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-12 bg-neutral-50 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={post.coverImage || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=100&q=80'}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-neutral-900 line-clamp-1">{post.title}</div>
                          <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{post.category || 'General'}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        className={`text-xs font-bold px-2 py-1 rounded-full border-none focus:ring-0 cursor-pointer ${
                          post.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' :
                          post.status === 'DRAFT' ? 'bg-yellow-50 text-yellow-700' :
                          post.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700' :
                          post.status === 'PENDING_REVIEW' ? 'bg-purple-50 text-purple-700' :
                          'bg-neutral-100 text-neutral-600'
                        }`}
                        value={post.status}
                        onChange={(e) => handleStatusChange(post.id, e.target.value as PostStatus)}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING_REVIEW">Pending Review</option>
                        <option value="SCHEDULED">Scheduled</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/blog/${post.slug}`} target="_blank">
                          <button className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </Link>
                        <Link to={`/admin/blog/${post.id}/edit`}>
                          <button className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                    No articles found. Start by creating one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

export default AdminBlogPage;