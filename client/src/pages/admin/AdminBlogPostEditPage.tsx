import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Eye, Layout, Type, Image, Search as SearchIcon, Globe } from 'lucide-react';
import { adminBlogService } from '../../services/adminBlogService';
import { BlogPost, PostStatus } from '../../types';
import { Button } from '../../components/ui/Button';

const CATEGORIES = ['Coffee Culture', 'Brewing Guides', 'Cafe Reviews', 'Industry News', 'Lifestyle'];

const AdminBlogPostEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  
  const [loading, setLoading] = useState(isEdit ? true : false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  
  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    coverImageAlt: '',
    category: CATEGORIES[0],
    metaTitle: '',
    metaDescription: '',
    status: 'DRAFT'
  });

  useEffect(() => {
    if (isEdit) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const response = await adminBlogService.getAll(); // Actually need a getById
      // For now, let's assume we fetch all and find one, or update service
      const post = response.data.posts.find(p => p.id === id);
      if (post) {
        setFormData(post);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await adminBlogService.update(id!, formData);
      } else {
        await adminBlogService.create(formData);
      }
      navigate('/admin/blog');
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/admin/blog" className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <h1 className="text-3xl font-black text-neutral-900">
            {isEdit ? 'Edit Article' : 'Create New Article'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.open(`/blog/${formData.slug}`, '_blank')}
            disabled={!formData.slug}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex gap-1 mb-8 bg-neutral-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('content')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'content' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Layout className="w-4 h-4" />
          Content
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'seo' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          SEO & Meta
        </button>
      </div>

      <div className="space-y-8">
        {activeTab === 'content' ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-6">
              {/* Title & Excerpt */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Article Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter a catchy title..."
                    className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-neutral-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Short Excerpt</label>
                  <textarea
                    value={formData.excerpt || ''}
                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="A brief summary for cards and search results..."
                    rows={3}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Content (Markdown)</label>
                <textarea
                  value={formData.content || ''}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your story here... Markdown is supported!"
                  rows={20}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-6 text-base font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="space-y-6">
              {/* Cover Image */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Cover Image</label>
                <div className="aspect-video bg-neutral-50 rounded-xl overflow-hidden border border-neutral-100 mb-4">
                  {formData.coverImage ? (
                    <img src={formData.coverImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                      <Image className="w-8 h-8 mb-2" />
                      <span className="text-[10px] font-bold">No Image</span>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.coverImage || ''}
                  onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="Image URL"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
                />
                <input
                  type="text"
                  value={formData.coverImageAlt || ''}
                  onChange={e => setFormData({ ...formData, coverImageAlt: e.target.value })}
                  placeholder="Alt text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none"
                />
              </div>

              {/* Categorization */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Category</label>
                <select
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none font-bold"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm space-y-4">
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Status</label>
                <div className="flex flex-col gap-2">
                  {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as PostStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-left ${
                        formData.status === s 
                          ? 'bg-neutral-900 text-white' 
                          : 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-3xl border border-neutral-100 shadow-sm max-w-2xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-black text-neutral-900">SEO Settings</h2>
              <p className="text-neutral-500">Optimize how this article appears in search engines.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Meta Title</label>
                <input
                  type="text"
                  value={formData.metaTitle || ''}
                  onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="Appears in search results (max 70 chars)"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Meta Description</label>
                <textarea
                  value={formData.metaDescription || ''}
                  onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Briefly describe the article for search engines (max 160 chars)"
                  rows={4}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Canonical URL</label>
                <input
                  type="text"
                  value={formData.canonicalUrl || ''}
                  onChange={e => setFormData({ ...formData, canonicalUrl: e.target.value })}
                  placeholder="https://cafefinder.com/blog/..."
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>

            <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2">Search Preview</div>
              <div className="text-blue-600 text-lg font-medium mb-1 truncate">{formData.metaTitle || formData.title || 'Article Title'}</div>
              <div className="text-green-700 text-xs mb-1 truncate">cafefinder.com › blog › {formData.slug || 'slug'}</div>
              <div className="text-neutral-500 text-sm line-clamp-2">{formData.metaDescription || formData.excerpt || 'Article excerpt...'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBlogPostEditPage;
