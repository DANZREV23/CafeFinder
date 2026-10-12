import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { collectionService } from '@/services/collectionService';
import { UserCollection } from '@/types';
import { Eye, Lock, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardCollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadCollections = async () => {
    try {
      const result = await collectionService.getMyCollections();
      setCollections(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to load collections', error);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const response = await collectionService.createCollection({ name: name.trim(), visibility: 'PRIVATE' });
      const created = response.data;
      setName('');
      await loadCollections();
      toast.success('Collection created');
      if (created?.slug) {
        navigate(`/dashboard/collections/${created.slug}`);
      }
    } catch (error) {
      console.error('Failed to create collection', error);
      toast.error(error instanceof Error ? error.message : 'Unable to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this collection?')) return;
    try {
      await collectionService.deleteCollection(id);
      await loadCollections();
    } catch (error) {
      console.error('Failed to delete collection', error);
    }
  };

  return (
    <MainLayout>
      <PageContainer className="py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-coffee">Dashboard</p>
            <h1 className="mt-2 text-4xl font-serif font-bold text-brand-charcoal">Collections</h1>
          </div>
          <form
            className="flex gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreate();
            }}
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Create a collection"
              aria-label="Collection name"
              className="rounded-xl border border-brand-border bg-white px-4 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-coffee px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-brand-border bg-white p-8 text-brand-muted">Loading your collections...</div>
        ) : !Array.isArray(collections) || collections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center text-brand-muted">
            You have not created any collections yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {collections.map((collection) => (
              <div key={collection.id} className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-muted">
                    {collection.visibility === 'PUBLIC' ? <Eye className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                    {collection.visibility}
                  </div>
                  <span className="text-xs text-brand-muted">{collection.items?.length || 0} cafes</span>
                </div>

                <div className="mb-4">
                  <h2 className="text-2xl font-serif font-bold text-brand-charcoal">{collection.name}</h2>
                  {collection.description && <p className="mt-2 text-sm text-brand-muted">{collection.description}</p>}
                </div>

                <div className="mb-5 flex items-center justify-between text-xs text-brand-muted">
                  <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Link to={`/dashboard/collections/${collection.slug}`} className="flex-1 rounded-xl bg-brand-background px-3 py-2 text-center text-sm font-semibold text-brand-charcoal">
                    Open
                  </Link>
                  <button type="button" onClick={() => handleDelete(collection.id)} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
