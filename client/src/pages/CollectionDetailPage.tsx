import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Globe2, Lock, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { CollectionPicker } from '@/components/collections/CollectionPicker';
import { collectionService, Collection } from '@/services/collectionService';
import { toast } from 'react-hot-toast';
import { SEO } from '@/components/common/SEO';

const CollectionDetailPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [pickerCafeId, setPickerCafeId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { collectionService.get(slug).then(response => { setCollection(response.data); setDescription(response.data.description || ''); }).catch((error: any) => toast.error(error.message || 'Unable to load collection')); }, [slug]);

  const saveDescription = async () => {
    if (!collection) return;
    setSaving(true);
    try { const response = await collectionService.update(collection.id, { description }); setCollection(prev => prev ? { ...prev, ...response.data } : prev); toast.success('Collection updated'); } catch (error: any) { toast.error(error.message || 'Unable to update collection'); } finally { setSaving(false); }
  };

  const removeCafe = async (cafeId: string) => {
    if (!collection) return;
    try { await collectionService.removeCafe(collection.id, cafeId); setCollection(prev => prev ? { ...prev, itemCount: Math.max(0, prev.itemCount - 1), items: prev.items?.filter(item => item.cafeId !== cafeId) } : prev); } catch (error: any) { toast.error(error.message || 'Unable to remove cafe'); }
  };

  if (!collection) return <MainLayout><PageContainer><div className="py-20 text-center text-brand-muted">Loading collection...</div></PageContainer></MainLayout>;
  return <MainLayout><SEO title={collection.name} noindex /><PageContainer><div className="mx-auto max-w-5xl space-y-8 py-10">
    <Link to="/dashboard/collections" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-coffee"><ArrowLeft size={16} /> All collections</Link>
    <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-semibold text-brand-muted">{collection.visibility === 'PUBLIC' ? <Globe2 size={16} /> : <Lock size={16} />}{collection.visibility}</div><h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">{collection.name}</h1><p className="mt-2 text-brand-muted">{collection.itemCount} cafes</p></div>{collection.visibility === 'PUBLIC' && <Button asChild variant="outline"><a href={`/collections/${collection.slug}`} target="_blank" rel="noreferrer">View public page</a></Button>}</header>
    <section className="rounded-xl border border-brand-border bg-white p-5"><label className="block text-sm font-semibold text-brand-charcoal" htmlFor="collection-description">Description</label><textarea id="collection-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={500} rows={3} className="mt-2 w-full rounded-md border border-brand-border p-3" placeholder="What is this collection for?" /><Button className="mt-3" size="sm" onClick={saveDescription} isLoading={saving}>Save description</Button></section>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{collection.items?.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-brand-border bg-white"><img src={item.cafe.photos[0]?.url || '/assets/placeholder-cafe.jpg'} alt="" className="h-40 w-full object-cover" /><div className="p-4"><Link to={`/cafes/${item.cafe.slug}`} className="font-serif text-lg font-bold hover:text-brand-coffee">{item.cafe.name}</Link><p className="mt-1 text-sm text-brand-muted">{item.cafe.city}</p>{item.note && <p className="mt-3 text-sm italic text-brand-muted">{item.note}</p>}<div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => setPickerCafeId(item.cafeId)}>Save elsewhere</Button><button type="button" onClick={() => removeCafe(item.cafeId)} aria-label={`Remove ${item.cafe.name}`} className="rounded-md p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></div></div></article>)}</div>
    {!collection.items?.length && <div className="rounded-xl border border-dashed border-brand-border p-12 text-center text-brand-muted">No cafes saved here yet. Use Save to Collection from any cafe profile.</div>}
  </div><CollectionPicker cafeId={pickerCafeId || ''} open={Boolean(pickerCafeId)} onClose={() => setPickerCafeId(null)} /></PageContainer></MainLayout>;
};
export default CollectionDetailPage;
