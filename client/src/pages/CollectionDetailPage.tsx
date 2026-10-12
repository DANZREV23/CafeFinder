import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  GripVertical, 
  Plus, 
  Share2, 
  Globe, 
  Lock, 
  MoreHorizontal,
  Loader2,
  Calendar,
  MessageSquare,
  X,
  Check,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { collectionService, UserCollection, CollectionItem } from '@/services/collectionService';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/common/SEO';

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<UserCollection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<'PRIVATE' | 'PUBLIC'>('PRIVATE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCollection();
  }, [slug]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      // We need to find by slug for this user. 
      // Current API getOne uses ID. Let's list and find or update API.
      const res = await collectionService.getCollections();
      if (res.success) {
        const found = res.data.find(c => c.slug === slug);
        if (found) {
          setCollection(found);
          setEditName(found.name);
          setEditDescription(found.description || '');
          setEditVisibility(found.visibility);
          
          const itemsRes = await collectionService.getCollectionItems(found.id);
          if (itemsRes.success) {
            setItems(itemsRes.data);
          }
        } else {
          toast.error('Collection not found');
          navigate('/dashboard/collections');
        }
      }
    } catch (error) {
      toast.error('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collection) return;

    try {
      setSubmitting(true);
      const res = await collectionService.updateCollection(collection.id, {
        name: editName,
        description: editDescription,
        visibility: editVisibility
      });
      if (res.success) {
        setCollection(res.data);
        setIsSettingsOpen(false);
        toast.success('Collection updated');
        if (res.data.slug !== slug) {
          navigate(`/dashboard/collections/${res.data.slug}`);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (cafeId: string) => {
    if (!collection) return;
    try {
      await collectionService.removeCafeFromCollection(collection.id, cafeId);
      setItems(prev => prev.filter(item => item.cafeId !== cafeId));
      toast.success('Removed from collection');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove');
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!collection) return;
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    // Swap items
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    setItems(newItems);

    try {
      await collectionService.reorderItems(collection.id, newItems.map(item => item.id));
      toast.success('Order updated');
    } catch (error) {
      toast.error('Failed to save new order');
      // Revert if failed? Or just leave it. 
      // Ideally we'd fetch items again to be sure.
      fetchCollection();
    }
  };

  const handleSaveNote = async (cafeId: string) => {
    if (!collection) return;
    try {
      setSavingNote(true);
      await collectionService.updateItemNote(collection.id, cafeId, noteText);
      setItems(prev => prev.map(item => 
        item.cafeId === cafeId ? { ...item, note: noteText } : item
      ));
      setIsEditingNote(null);
      toast.success('Note saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <PageContainer className="py-20 flex justify-center">
          <Loader2 className="animate-spin w-10 h-10 text-brand-coffee" />
        </PageContainer>
      </MainLayout>
    );
  }

  if (!collection) return null;

  return (
    <MainLayout>
      <SEO title={`${collection.name} - My Collections`} />
      <PageContainer className="py-12">
        <Link 
          to="/dashboard/collections" 
          className="inline-flex items-center gap-2 text-brand-muted hover:text-brand-coffee transition-colors mb-8 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold uppercase tracking-widest text-[10px]">Back to Collections</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 mb-12">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal">{collection.name}</h1>
              <div className="px-2.5 py-1 bg-brand-cream border border-brand-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-brand-charcoal flex items-center gap-1.5 shrink-0">
                {collection.visibility === 'PUBLIC' ? <Globe size={12} /> : <Lock size={12} />}
                {collection.visibility}
              </div>
            </div>
            
            {collection.description && (
              <p className="text-lg text-brand-muted max-w-2xl">{collection.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm font-semibold text-brand-muted uppercase tracking-wider pt-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-coffee" />
                <span>Updated {format(new Date(collection.updatedAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 border-l border-brand-border pl-6">
                <span className="text-brand-charcoal">{items.length}</span>
                <span>Saved Cafes</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 shrink-0">
            {collection.visibility === 'PUBLIC' && (
              <Button 
                variant="outline" 
                className="rounded-full flex items-center gap-2"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/collections/${encodeURIComponent(collection.user?.name || 'user')}/${collection.slug}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast.success('Link copied!');
                }}
              >
                <Share2 size={18} />
                <span>Share</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="rounded-full flex items-center gap-2"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings size={18} />
              <span>Settings</span>
            </Button>
            <Link to="/explore">
              <Button className="rounded-full flex items-center gap-2">
                <Plus size={18} />
                <span>Add Cafes</span>
              </Button>
            </Link>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="space-y-6">
            {items.map((item, index) => (
              <Card key={item.id} className="p-0 overflow-hidden border-brand-border flex flex-col md:flex-row group">
                <div className="relative w-full md:w-64 lg:w-80 aspect-video md:aspect-square shrink-0 bg-brand-cream overflow-hidden">
                  <Link to={`/cafes/${item.cafe.slug}`}>
                    {item.cafe.photos?.[0]?.url ? (
                      <img 
                        src={item.cafe.photos[0].url} 
                        alt={item.cafe.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-coffee/20">
                        <Plus size={48} />
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-brand-charcoal">
                    #{index + 1}
                  </div>
                  
                  {/* Reorder Overlay */}
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 bg-white/90 backdrop-blur-sm text-brand-charcoal hover:text-brand-coffee rounded-lg shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button 
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      className="p-1.5 bg-white/90 backdrop-blur-sm text-brand-charcoal hover:text-brand-coffee rounded-lg shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Link to={`/cafes/${item.cafe.slug}`} className="block group/title">
                        <h3 className="text-xl font-serif font-bold text-brand-charcoal group-hover/title:text-brand-coffee transition-colors flex items-center gap-2">
                          {item.cafe.name}
                          <ExternalLink size={14} className="opacity-0 group-hover/title:opacity-100 transition-opacity" />
                        </h3>
                      </Link>
                      <p className="text-sm text-brand-muted mt-1">{item.cafe.city}, {item.cafe.address}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteItem(item.cafeId)}
                      className="p-2 text-brand-muted hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                      title="Remove from collection"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex-1 bg-brand-background/50 rounded-2xl p-4 border border-brand-border/50 relative">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
                      <MessageSquare size={12} className="text-brand-coffee" />
                      <span>My Notes</span>
                    </div>

                    {isEditingNote === item.id ? (
                      <div className="space-y-3">
                        <textarea 
                          autoFocus
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add a personal note about this cafe..."
                          className="w-full bg-white border border-brand-coffee rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-coffee outline-none min-h-[80px] resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setIsEditingNote(null)}
                            disabled={savingNote}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveNote(item.cafeId)}
                            disabled={savingNote}
                          >
                            {savingNote ? <Loader2 size={14} className="animate-spin" /> : 'Save Note'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => {
                          setNoteText(item.note || '');
                          setIsEditingNote(item.id);
                        }}
                        className="cursor-pointer group/note"
                      >
                        {item.note ? (
                          <p className="text-sm text-brand-charcoal italic leading-relaxed">&ldquo;{item.note}&rdquo;</p>
                        ) : (
                          <p className="text-sm text-brand-muted italic">Click to add a note about this spot...</p>
                        )}
                        <div className="absolute bottom-2 right-2 p-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                          <Plus size={14} className="text-brand-coffee" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white border border-brand-border border-dashed rounded-3xl">
            <p className="text-brand-muted mb-6">This collection is currently empty.</p>
            <Link to="/explore">
              <Button className="rounded-full px-8">Find Cafes to Add</Button>
            </Link>
          </div>
        )}

        {/* Settings Modal */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
              <form onSubmit={handleUpdate}>
                <div className="px-8 py-6 border-b border-brand-border flex items-center justify-between">
                  <h3 className="text-2xl font-serif font-bold text-brand-charcoal">Collection Settings</h3>
                  <button 
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
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
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-background border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">Description</label>
                    <textarea 
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-background border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider block">Visibility</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setEditVisibility('PRIVATE')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          editVisibility === 'PRIVATE' 
                            ? 'bg-brand-coffee text-white border-brand-coffee' 
                            : 'bg-white text-brand-charcoal border-brand-border hover:border-brand-coffee'
                        }`}
                      >
                        <Lock size={20} />
                        <span className="font-bold text-sm">Private</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditVisibility('PUBLIC')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                          editVisibility === 'PUBLIC' 
                            ? 'bg-brand-coffee text-white border-brand-coffee' 
                            : 'bg-white text-brand-charcoal border-brand-border hover:border-brand-coffee'
                        }`}
                      >
                        <Globe size={20} />
                        <span className="font-bold text-sm">Public</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-brand-background border-t border-brand-border flex justify-end gap-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsSettingsOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || !editName.trim()}
                    className="px-8"
                  >
                    {submitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
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
