import React, { useEffect, useState } from 'react';
import { Check, FolderPlus, Loader2, Search, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { collectionService, Collection } from '@/services/collectionService';
import { Button } from '@/components/ui/Button';

interface CollectionPickerProps {
  cafeId: string;
  open: boolean;
  onClose: () => void;
}

export const CollectionPicker: React.FC<CollectionPickerProps> = ({ cafeId, open, onClose }) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    collectionService.list().then(response => setCollections(response.data)).catch(() => toast.error('Unable to load collections')).finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;
  const filtered = collections.filter(collection => collection.name.toLowerCase().includes(query.toLowerCase()));

  const toggle = async (collection: Collection) => {
    try {
      const contains = collection.itemCafeIds?.includes(cafeId) || false;
      if (contains) {
        await collectionService.removeCafe(collection.id, cafeId);
      } else {
        await collectionService.addCafe(collection.id, cafeId);
      }
      toast.success(contains ? `Removed from ${collection.name}` : `Saved to ${collection.name}`);
      setCollections(prev => prev.map(item => item.id === collection.id ? { ...item, itemCount: Math.max(0, item.itemCount + (contains ? -1 : 1)), itemCafeIds: contains ? item.itemCafeIds?.filter(id => id !== cafeId) : [...(item.itemCafeIds || []), cafeId] } : item));
    } catch (error: any) {
      toast.error(error.message || 'Unable to update collection');
    }
  };

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const response = await collectionService.create({ name: newName.trim() });
      await collectionService.addCafe(response.data.id, cafeId);
      setCollections(prev => [...prev, { ...response.data, itemCount: 1 }]);
      setNewName('');
      toast.success(`Saved to ${response.data.name}`);
    } catch (error: any) {
      toast.error(error.message || 'Unable to create collection');
    } finally {
      setCreating(false);
    }
  };

  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true" aria-labelledby="collection-picker-title">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 id="collection-picker-title" className="text-xl font-semibold text-brand-charcoal">Save to Collection</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-brand-cream"><X size={18} /></button>
      </div>
      <label className="mb-4 flex items-center gap-2 rounded-lg border border-brand-border px-3 py-2">
        <Search size={16} aria-hidden="true" /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Search collections" className="w-full outline-none" />
      </label>
      <div className="max-h-60 space-y-2 overflow-y-auto" aria-live="polite">
        {loading ? <Loader2 className="mx-auto animate-spin" /> : filtered.map(collection => <button key={collection.id} type="button" onClick={() => toggle(collection)} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left hover:bg-brand-cream">
          <span><span className="block font-medium">{collection.name}</span><span className="text-xs text-brand-muted">{collection.itemCount} cafes</span></span>
          {collection.itemCafeIds?.includes(cafeId) && <Check size={18} className="text-brand-coffee" aria-label="Saved" />}
        </button>)}
        {!loading && filtered.length === 0 && <p className="py-4 text-center text-sm text-brand-muted">No collections yet.</p>}
      </div>
      <div className="mt-5 flex gap-2 border-t border-brand-border pt-4">
        <input value={newName} onChange={event => setNewName(event.target.value)} onKeyDown={event => event.key === 'Enter' && create()} placeholder="New collection name" className="min-w-0 flex-1 rounded-md border border-brand-border px-3 py-2" />
        <Button type="button" size="sm" onClick={create} isLoading={creating} leftIcon={<FolderPlus size={16} />}>Create</Button>
      </div>
    </div>
  </div>;
};
