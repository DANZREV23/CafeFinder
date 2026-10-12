import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  FolderHeart, 
  MoreVertical, 
  Lock, 
  Globe, 
  Calendar,
  Loader2,
  Trash2,
  Edit2,
  Share2
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { collectionService, UserCollection } from '@/services/collectionService';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/DropdownMenu';
import { SEO } from '@/components/common/SEO';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newVisibility, setNewVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await collectionService.getCollections();
      if (res.success) {
        setCollections(res.data);
      }
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      const res = await collectionService.createCollection({
        name: newName,
        description: newDescription,
        visibility: newVisibility
      });
      if (res.success) {
        setCollections(prev => [res.data, ...prev]);
        setIsCreateModalOpen(false);
        setNewName('');
        setNewDescription('');
        toast.success('Collection created!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection? All saved cafes will remain in your favorites but will be removed from this list.')) return;

    try {
      await collectionService.deleteCollection(id);
      setCollections(prev => prev.filter(c => c.id !== id));
      toast.success('Collection deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete collection');
    }
  };

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <SEO title="My Collections - CafeFinder" />
      <PageContainer className="py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-serif font-bold text-brand-charcoal mb-2">My Collections</h1>
            <p className="text-brand-muted">Organize your favorite cafes into discovery boards.</p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full px-6 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>New Collection</span>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <input 
              type="text"
              placeholder="Search your collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-brand-border rounded-2xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-brand-muted">
            <Loader2 className="animate-spin mb-4 w-10 h-10" />
            <p>Gathering your collections...</p>
          </div>
        ) : filteredCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCollections.map(collection => (
              <Card 
                key={collection.id}
                className="group overflow-hidden hover:shadow-lg transition-all border-brand-border"
              >
                <Link to={`/dashboard/collections/${collection.slug}`} className="block relative aspect-video bg-brand-cream overflow-hidden">
                  {collection.items && collection.items[0]?.cafe?.photos?.[0]?.url ? (
                    <img 
                      src={collection.items[0].cafe.photos[0].url} 
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-coffee/30">
                      <FolderHeart size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1">
                      {collection.visibility === 'PUBLIC' ? <Globe size={10} /> : <Lock size={10} />}
                      {collection.visibility}
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-brand-coffee text-white rounded-lg text-xs font-bold">
                    {collection._count?.items || 0} items
                  </div>
                </Link>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/dashboard/collections/${collection.slug}`} className="block">
                      <h3 className="font-serif font-bold text-lg text-brand-charcoal group-hover:text-brand-coffee transition-colors truncate pr-2">
                        {collection.name}
                      </h3>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-brand-background rounded-full transition-colors text-brand-muted">
                          <MoreVertical size={18} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuItem asChild>
                          <Link to={`/dashboard/collections/${collection.slug}`} className="flex items-center gap-2">
                            <Edit2 size={16} />
                            <span>Edit / Manage</span>
                          </Link>
                        </DropdownMenuItem>
                        {collection.visibility === 'PUBLIC' && (
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/collections/me/${collection.slug}`);
                            toast.success('Public link copied!');
                          }}>
                            <Share2 size={16} className="mr-2" />
                            <span>Share Link</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(collection.id)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          <span>Delete Collection</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <p className="text-sm text-brand-muted line-clamp-2 min-h-[40px] mb-4">
                    {collection.description || 'No description provided.'}
                  </p>

                  <div className="pt-4 border-t border-brand-border flex items-center justify-between text-[11px] text-brand-muted font-semibold uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Updated {format(new Date(collection.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white border border-brand-border border-dashed rounded-3xl">
            <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4 text-brand-coffee">
              <FolderHeart size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-brand-charcoal mb-2">No collections yet</h2>
            <p className="text-brand-muted mb-8 max-w-sm mx-auto">
              Start organizing your favorite coffee spots into custom lists for work, dates, or study sessions.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="rounded-full px-8">
              Create My First Collection
            </Button>
          </div>
        )}

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
              <form onSubmit={handleCreate}>
                <div className="px-8 py-6 border-b border-brand-border flex items-center justify-between">
                  <h3 className="text-2xl font-serif font-bold text-brand-charcoal">Create Collection</h3>
                  <button 
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-2 hover:bg-brand-background rounded-full transition-colors text-brand-muted"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Weekend Study Spots"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-background border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">Description (Optional)</label>
                    <textarea 
                      placeholder="What is this collection for?"
                      rows={3}
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-background border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider block">Visibility</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setNewVisibility('PRIVATE')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          newVisibility === 'PRIVATE' 
                            ? 'bg-brand-coffee text-white border-brand-coffee' 
                            : 'bg-white text-brand-charcoal border-brand-border hover:border-brand-coffee'
                        }`}
                      >
                        <Lock size={20} />
                        <span className="font-bold text-sm">Private</span>
                        <span className={`text-[10px] text-center ${newVisibility === 'PRIVATE' ? 'text-white/70' : 'text-brand-muted'}`}>
                          Only you can see this
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewVisibility('PUBLIC')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          newVisibility === 'PUBLIC' 
                            ? 'bg-brand-coffee text-white border-brand-coffee' 
                            : 'bg-white text-brand-charcoal border-brand-border hover:border-brand-coffee'
                        }`}
                      >
                        <Globe size={20} />
                        <span className="font-bold text-sm">Public</span>
                        <span className={`text-[10px] text-center ${newVisibility === 'PUBLIC' ? 'text-white/70' : 'text-brand-muted'}`}>
                          Anyone with link can see
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-brand-background border-t border-brand-border flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || !newName.trim()}
                    className="px-8"
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : 'Create Collection'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}

const X = ({ size }: { size: number }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
