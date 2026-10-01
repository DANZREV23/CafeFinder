import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Globe2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { collectionService, Collection } from '@/services/collectionService';
import { SEO } from '@/components/common/SEO';

const PublicCollectionPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { collectionService.getPublic(slug).then(response => setCollection(response.data)).catch(() => setError('This collection is unavailable.')); }, [slug]);
  if (error) return <MainLayout><PageContainer><div className="py-20 text-center text-brand-muted">{error}</div></PageContainer></MainLayout>;
  if (!collection) return <MainLayout><PageContainer><div className="py-20 text-center text-brand-muted">Loading collection...</div></PageContainer></MainLayout>;
  return <MainLayout><SEO title={`${collection.name} | CafeFinder`} description={collection.description || `A public cafe collection by ${collection.creator?.name || 'a CafeFinder member'}`} /><PageContainer><div className="mx-auto max-w-5xl space-y-8 py-10"><header className="border-b border-brand-border pb-8"><div className="flex items-center gap-2 text-sm font-semibold text-brand-coffee"><Globe2 size={16} /> Public collection</div><h1 className="mt-3 text-4xl font-serif font-bold text-brand-charcoal">{collection.name}</h1>{collection.description && <p className="mt-3 max-w-2xl text-brand-muted">{collection.description}</p>}<p className="mt-4 text-sm text-brand-muted">Curated by {collection.creator?.name || 'CafeFinder member'} · {collection.itemCount} cafes</p></header><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{collection.items?.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-brand-border bg-white"><img src={item.cafe.photos[0]?.url || '/assets/placeholder-cafe.jpg'} alt="" className="h-44 w-full object-cover" /><div className="p-4"><Link to={`/cafes/${item.cafe.slug}`} className="font-serif text-lg font-bold hover:text-brand-coffee">{item.cafe.name}</Link><p className="mt-1 text-sm text-brand-muted">{item.cafe.city}</p>{item.note && <p className="mt-3 text-sm italic text-brand-muted">{item.note}</p>}</div></article>)}</div></div></PageContainer></MainLayout>;
};
export default PublicCollectionPage;
