import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Image, ExternalLink, Calendar, Eye } from 'lucide-react';
import { adminBlogService } from '../../services/adminBlogService';
import { BlogPost, PostStatus } from '../../types';
import { Button } from '../../components/ui/Button';

export default function AdminBlogPostEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(isEdit ? true : false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImage: '',
    coverImageAlt: '',
    category: '',
    tags: [],
    status: 'DRAFT',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
  });

  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    try {
      const response = await adminBlogService.getById(id!);
      if (response.success && response.data) {
        setFormData(response.data);
        if (response.data.tags && Array.isArray(response.data.tags)) {
          setTagsInput(response.data.tags.join(', '));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!isEdit && !formData.slug) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, title, slug }));
    } else {
      setFormData((prev) => ({ ...prev, title }));
    }
  };

  const handleSave = async (statusOverride?: PostStatus) => {
    if (!formData.title?.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.content?.trim()) {
      alert('Content is required');
      return;
    }

    setSaving(true);
    setError(null);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      ...formData,
      tags,
      status: statusOverride || formData.status || 'DRAFT',
    };

    try {
      if (isEdit) {
        await adminBlogService.update(id!, payload);
      } else {
        await adminBlogService.create(payload);
      }
      navigate('/admin/blog');
    } catch (err: any) {
      setError(err.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/admin/blog"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog Posts
        </Link>
        <div className="flex items-center gap-2">
          {isEdit && formData.slug && (
            <a
              href={`/blog/${formData.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Live
            </a>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
          >
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave(formData.status === 'PUBLISHED' ? 'PUBLISHED' : 'PUBLISHED')}
            disabled={saving}
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {formData.status === 'PUBLISHED' ? 'Update Published' : 'Publish Post'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Post Title *
              </label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={handleTitleChange}
                placeholder="e.g. The Best Specialty Roasters in Downtown"
                className="w-full text-xl font-bold rounded-xl border border-stone-200 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                URL Slug *
              </label>
              <div className="flex items-center rounded-xl border border-stone-200 overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20">
                <span className="bg-stone-50 text-stone-400 px-3 py-2.5 text-sm font-mono border-r border-stone-200">
                  /blog/
                </span>
                <input
                  type="text"
                  required
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="post-slug"
                  className="w-full p-2.5 text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Excerpt / Summary
              </label>
              <textarea
                rows={2}
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Short teaser shown in cards and preview listings..."
                className="w-full text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
                Content (Markdown / HTML) *
              </label>
              <textarea
                rows={14}
                required
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your article body here in Markdown or clean HTML..."
                className="w-full font-mono text-sm rounded-xl border border-stone-200 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* SEO Metadata Box */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-stone-900 text-sm">SEO & Social Meta</h3>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Meta Title</label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder={formData.title || 'Page title in Google search results'}
                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Meta Description</label>
              <textarea
                rows={2}
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder={formData.excerpt || 'Brief description for search engines'}
                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Canonical URL (Optional)</label>
              <input
                type="url"
                value={formData.canonicalUrl || ''}
                onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
                placeholder="https://..."
                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-stone-900 text-sm">Publishing Options</h3>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Publication Status</label>
              <select
                value={formData.status || 'DRAFT'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PostStatus })}
                className="w-full rounded-xl border border-stone-200 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Category</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Guides, Culture, Roasting"
                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="espresso, filter, travel, workspace"
                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-stone-900 text-sm">Featured Cover Media</h3>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Cover Image URL</label>
              <input
                type="url"
                value={formData.coverImage || ''}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs text-stone-500 mb-1">Image Alt Text</label>
              <input
                type="text"
                value={formData.coverImageAlt || ''}
                onChange={(e) => setFormData({ ...formData, coverImageAlt: e.target.value })}
                placeholder="Descriptive text for accessibility"
                className="w-full text-sm rounded-xl border border-stone-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {formData.coverImage && (
              <div className="rounded-xl overflow-hidden border border-stone-200 aspect-video bg-stone-100">
                <img
                  src={formData.coverImage}
                  alt={formData.coverImageAlt || 'Cover preview'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
