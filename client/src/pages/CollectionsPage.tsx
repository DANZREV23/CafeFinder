import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, Lock, Globe2, Loader2, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { collectionService, Collection } from '@/services/collectionService';
import { toast } from 'react-hot-toast';
import { SEO } from '@/components/common/SEO';

const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try { setCollections((await collectionService.list()).data); } catch (error: any) { toast.error(error.message || 'Unable to load collections'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try { const response = await collectionService.create({ name: name.trim() }); setCollections(prev => [response.data, ...prev]); setName(''); toast.success('Private collection created'); } catch (error: any) { toast.error(error.message || 'Unable to create collection'); } finally { setCreating(false); }
  };

  const remove = async (collection: Collection) => {
    if (!window.confirm(`Delete ${collection.name}?`)) return;
    try { await collectionService.remove(collection.id); setCollections(prev => prev.filter(item => item.id !== collection.id)); toast.success('Collection deleted'); } catch (error: any) { toast.error(error.message || 'Unable to delete collection'); }
  };

  return <MainLayout><SEO title="Collections" noindex /><PageContainer><div className="mx-auto max-w-5xl space-y-8 py-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-brand-coffee">Saved places</p><h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">Collections</h1><p className="mt-2 text-brand-muted">Organize cafes for the next outing, work session, or slow morning.</p></div><Link to="/dashboard" className="text-sm font-semibold text-brand-coffee hover:underline">Back to dashboard</Link></div>
    <form onSubmit={create} className="flex flex-col gap-3 rounded-xl border border-brand-border bg-white p-5 shadow-sm sm:flex-row"><input value={name} onChange={event => setName(event.target.value)} placeholder="Name a new collection" maxLength={100} className="min-w-0 flex-1 rounded-md border border-brand-border px-3 py-2" aria-label="New collection name" /><Button type="submit" isLoading={creating} leftIcon={<FolderPlus size={17} />}>Create private collection</Button></form>
    {loading ? <Loader2 className="mx-auto animate-spin" /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{collections.map(collection => <article key={collection.id} className="rounded-xl border border-brand-border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-xl font-bold text-brand-charcoal"><Link to={`/dashboard/collections/${collection.slug}`} className="hover:text-brand-coffee">{collection.name}</Link></h2><p className="mt-1 text-sm text-brand-muted">{collection.itemCount} cafes</p></div><span className="flex items-center gap-1 text-xs font-semibold text-brand-muted">{collection.visibility === 'PUBLIC' ? <Globe2 size={14} /> : <Lock size={14} />}{collection.visibility}</span></div><div className="mt-6 flex items-center justify-between"><Link to={`/dashboard/collections/${collection.slug}`} className="text-sm font-semibold text-brand-coffee hover:underline">Open collection</Link><button type="button" onClick={() => remove(collection)} aria-label={`Delete ${collection.name}`} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 size={16} /></button></div></article>)}</div>}
    {!loading && collections.length === 0 && <div className="rounded-xl border border-dashed border-brand-border p-12 text-center text-brand-muted">Create your first private collection to start saving cafes.</div>}
  </div></PageContainer></MainLayout>;
};
export default CollectionsPage;
