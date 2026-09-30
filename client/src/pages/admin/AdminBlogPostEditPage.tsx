import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Eye, Layout, Type, Image, Search as SearchIcon, Globe, Bold, Italic, List, ListOrdered, Heading, Link2, History } from 'lucide-react';
import { adminBlogService } from '../../services/adminBlogService';
import { BlogPost, PostStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { RevisionHistoryDialog } from '../../components/admin/RevisionHistoryDialog';
import { ApiError } from '../../services/api';
import { toast } from 'react-hot-toast';

const CATEGORIES = ['Coffee Culture', 'Brewing Guides', 'Cafe Reviews', 'Industry News', 'Lifestyle'];

const formatDateTimeInput = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateVal)) {
    return dateVal.slice(0, 16);
  }
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
};

const RichTextEditor: React.FC<{ value: string; onChange: (value: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white p-3">
        <button type="button" onClick={() => execCommand('bold')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:border-primary-200 hover:text-primary-600" aria-label="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:border-primary-200 hover:text-primary-600" aria-label="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCommand('formatBlock', 'h2')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:border-primary-200 hover:text-primary-600" aria-label="Heading">
          <Heading className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:border-primary-200 hover:text-primary-600" aria-label="Bullet list">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:border-primary-200 hover:text-primary-600" aria-label="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => {
          const url = window.prompt('Enter link URL', 'https://');
          if (url) execCommand('createLink', url);
        }} className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 transition hover:border-primary-200 hover:text-primary-600" aria-label="Insert link">
          <Link2 className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        role="textbox"
        aria-label={placeholder || 'Post content'}
        className="min-h-[420px] max-h-[60vh] overflow-auto bg-white px-5 py-4 text-[15px] leading-7 text-neutral-700 outline-none focus:text-neutral-900"
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
};

const AdminBlogPostEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';
  
  const [loading, setLoading] = useState(isEdit ? true : false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [showRevisions, setShowRevisions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
      const response = await adminBlogService.getById(id!);
      if (response.success) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    try {
      const payload: any = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        coverImage: formData.coverImage,
        coverImageAlt: formData.coverImageAlt,
        category: formData.category,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        canonicalUrl: formData.canonicalUrl,
        status: formData.status || 'DRAFT',
        scheduledAt: formData.status === 'SCHEDULED' ? (formData.scheduledAt || null) : null,
      };

      if (isEdit) {
        await adminBlogService.update(id!, payload);
      } else {
        await adminBlogService.create(payload);
      }
      toast.success(`Article saved successfully as ${payload.status}`);
      navigate('/admin/blog');
    } catch (error: any) {
      console.error('Failed to save post:', error);
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const validationErrors: Record<string, string> = {};
        error.details?.forEach((issue: any) => {
          const path = issue.path.join('.');
          validationErrors[path] = issue.message;
        });
        setErrors(validationErrors);
        toast.error('Please fix the validation errors before saving.');
      } else {
        toast.error(error.message || 'Failed to save post');
      }
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
          {isEdit && (
            <Button
              variant="outline"
              onClick={() => setShowRevisions(true)}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          )}
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
                    className={`w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-neutral-200 ${errors.title ? 'text-red-500' : ''}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1 font-bold">{errors.title}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Short Excerpt</label>
                  <textarea
                    value={formData.excerpt || ''}
                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="A brief summary for cards and search results..."
                    rows={3}
                    className={`w-full bg-neutral-50 border rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none ${errors.excerpt ? 'border-red-500' : 'border-neutral-100'}`}
                  />
                  {errors.excerpt && <p className="text-xs text-red-500 mt-1 font-bold">{errors.excerpt}</p>}
                </div>
              </div>

              {/* Main Content */}
              <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">Content</label>
                <RichTextEditor
                  value={formData.content || ''}
                  onChange={value => setFormData({ ...formData, content: value })}
                  placeholder="Write your story here..."
                />
                {errors.content && <p className="text-xs text-red-500 mt-2 font-bold">{errors.content}</p>}
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black uppercase tracking-widest text-neutral-400">Status</label>
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Current: <span className="text-primary-600 font-black">{formData.status?.replace(/_/g, ' ') || 'DRAFT'}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {(['DRAFT', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'] as PostStatus[]).map(s => {
                    const isSelected = formData.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            status: s,
                            scheduledAt: s === 'SCHEDULED' ? (prev.scheduledAt || new Date(Date.now() + 86400000).toISOString()) : prev.scheduledAt
                          }));
                        }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-left flex items-center justify-between border ${
                          isSelected 
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm' 
                            : 'bg-neutral-50 text-neutral-500 border-neutral-100 hover:bg-neutral-100 hover:text-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            s === 'PUBLISHED' ? (isSelected ? 'bg-emerald-400' : 'bg-emerald-500') :
                            s === 'DRAFT' ? (isSelected ? 'bg-amber-400' : 'bg-amber-500') :
                            s === 'SCHEDULED' ? (isSelected ? 'bg-blue-400' : 'bg-blue-500') :
                            s === 'PENDING_REVIEW' ? (isSelected ? 'bg-purple-400' : 'bg-purple-500') :
                            'bg-neutral-400'
                          }`} />
                          <span>{s.replace(/_/g, ' ')}</span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white">Selected</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {(formData.status as string) === 'SCHEDULED' && (
                  <div className="pt-4 border-t border-neutral-50">
                    <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">Schedule For</label>
                    <input 
                      type="datetime-local"
                      value={formatDateTimeInput(formData.scheduledAt)}
                      onChange={e => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary-500 outline-none font-bold text-neutral-900"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">Post will automatically publish on this date and time.</p>
                  </div>
                )}
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

      {isEdit && (
        <RevisionHistoryDialog 
          entityType="BlogPost"
          entityId={id!}
          isOpen={showRevisions}
          onClose={() => setShowRevisions(false)}
          onRestore={(snapshot) => setFormData(snapshot)}
        />
      )}
    </div>
  );
};

export default AdminBlogPostEditPage;