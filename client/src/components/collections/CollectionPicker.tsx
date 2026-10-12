import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Plus, 
  Search, 
  Check, 
  Loader2, 
  X,
  Lock,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { collectionService, UserCollection } from '@/services/collectionService';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface CollectionPickerProps {
  cafeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CollectionPicker: React.FC<CollectionPickerProps> = ({
  cafeId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await collectionService.getCollections({ limit: 100 });
      if (res.success) {
        setCollections(res.data);
        
        // Find which collections already have this cafe
        // This is a bit expensive if we have many collections.
        // Ideally the API would return this info.
        // For now, we'll check manually or assume fresh state.
        // Let's assume we need to fetch items for each to be sure, or just provide a "toggle" behavior.
        // To keep it simple, we'll fetch items for each collection.
        // Actually, let's just use the "add" API and let it fail if already exists, 
        // OR better: the getCollections could return if a specific cafe is included.
      }
    } catch (error) {
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (collection: UserCollection) => {
    try {
      setSubmitting(true);
      const isAlreadyIn = selectedIds.has(collection.id);
      
      if (isAlreadyIn) {
        await collectionService.removeCafeFromCollection(collection.id, cafeId);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(collection.id);
          return next;
        });
        toast.success(`Removed from ${collection.name}`);
      } else {
        await collectionService.addCafeToCollection(collection.id, cafeId);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.add(collection.id);
          return next;
        });
        toast.success(`Added to ${collection.name}`);
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      const res = await collectionService.createCollection({ name: newName });
      if (res.success) {
        setCollections(prev => [res.data, ...prev]);
        setNewName('');
        setIsCreating(false);
        // Automatically add cafe to the new collection
        await handleToggle(res.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create collection');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between">
          <h3 className="text-xl font-serif font-bold text-brand-charcoal">Save to Collection</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-brand-background rounded-full transition-colors text-brand-muted"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Create Toggle */}
        <div className="p-4 border-b border-brand-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={18} />
            <input 
              type="text"
              placeholder="Search collections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-brand-background border-brand-border rounded-xl focus:ring-2 focus:ring-brand-coffee focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          
          {!isCreating ? (
            <button 
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-2 py-2 px-3 text-sm font-semibold text-brand-coffee hover:bg-brand-coffee/5 rounded-xl transition-colors"
            >
              <Plus size={18} />
              <span>Create new collection</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input 
                type="text"
                autoFocus
                placeholder="Collection name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-brand-coffee rounded-xl focus:ring-2 focus:ring-brand-coffee outline-none transition-all text-sm"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={submitting || !newName.trim()}
              >
                Create
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </form>
          )}
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto max-h-[300px] p-2 space-y-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-brand-muted">
              <Loader2 className="animate-spin mb-2" />
              <p className="text-sm">Loading collections...</p>
            </div>
          ) : filteredCollections.length > 0 ? (
            filteredCollections.map(collection => (
              <button
                key={collection.id}
                onClick={() => handleToggle(collection)}
                disabled={submitting}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-2xl transition-all group",
                  selectedIds.has(collection.id) 
                    ? "bg-brand-coffee text-white" 
                    : "hover:bg-brand-background text-brand-charcoal"
                )}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className={cn(
                    "p-2 rounded-xl shrink-0",
                    selectedIds.has(collection.id) ? "bg-white/20" : "bg-brand-cream text-brand-coffee"
                  )}>
                    <FolderPlus size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight">{collection.name}</div>
                    <div className={cn(
                      "text-[10px] uppercase font-bold tracking-wider mt-0.5 flex items-center gap-1",
                      selectedIds.has(collection.id) ? "text-white/70" : "text-brand-muted"
                    )}>
                      {collection.visibility === 'PUBLIC' ? <Globe size={10} /> : <Lock size={10} />}
                      {collection.visibility} • {collection._count?.items || 0} items
                    </div>
                  </div>
                </div>
                {selectedIds.has(collection.id) && (
                  <Check size={18} className="shrink-0" />
                )}
              </button>
            ))
          ) : (
            <div className="py-12 text-center text-brand-muted px-4">
              <p className="text-sm">No collections found.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-brand-background border-t border-brand-border text-center">
          <p className="text-xs text-brand-muted">
            Organize cafes to find them easily later.
          </p>
        </div>
      </div>
    </div>
  );
};
