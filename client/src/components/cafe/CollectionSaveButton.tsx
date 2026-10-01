import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { CollectionPicker } from '@/components/collections/CollectionPicker';

export const CollectionSaveButton: React.FC<{ cafeId: string }> = ({ cafeId }) => {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-brand-border px-3 py-2 text-sm font-semibold text-brand-charcoal hover:border-brand-coffee hover:text-brand-coffee" aria-label="Save to collection"><Bookmark size={16} />Save to Collection</button><CollectionPicker cafeId={cafeId} open={open} onClose={() => setOpen(false)} /></>;
};
