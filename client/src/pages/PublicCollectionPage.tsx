import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Globe, 
  Calendar,
  Loader2,
  ExternalLink,
  Coffee,
  MapPin,
  Clock
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { collectionService, UserCollection, CollectionItem } from '@/services/collectionService';
import { format } from 'date-fns';
import { SEO } from '@/components/common/SEO';

export default function PublicCollectionPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [collection, setCollection] = useState<UserCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicCollection = async () => {
      if (!username || !slug) return;
      try {
        setLoading(true);
        const res = await collectionService.getPublicCollection(username, slug);
        if (res.success) {
          setCollection(res.data);
        } else {
          setError('Collection not found or private');
        }
      } catch (err) {
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicCollection();
  }, [username, slug]);

  if (loading) {
    return (
      <MainLayout>
        <PageContainer className="py-20 flex justify-center">
          <Loader2 className="animate-spin w-10 h-10 text-brand-coffee" />
        </PageContainer>
      </MainLayout>
    );
  }

  if (error || !collection) {
    return (
      <MainLayout>
        <PageContainer className="py-20 text-center">
          <h1 className="text-3xl font-serif font-bold text-brand-charcoal mb-4">Collection Not Found</h1>
          <p className="text-brand-muted mb-8">{error || 'This collection might be private or deleted.'}</p>
          <Link to="/explore">
            <button className="px-6 py-2 bg-brand-coffee text-white rounded-xl font-semibold hover:bg-brand-coffee-dark transition-colors">
              Explore Other Cafes
            </button>
          </Link>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO 
        title={`${collection.name} by ${username} - CafeFinder`} 
        description={collection.description || `Check out this curated collection of cafes on CafeFinder.`}
      />
      <PageContainer className="py-12">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-brand-coffee" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Public Collection</span>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-charcoal leading-tight">
                {collection.name}
              </h1>
              <p className="text-sm text-brand-muted font-medium">
                Curated by <Link to={`/users/${collection.userId}`} className="text-brand-coffee hover:underline">@{username}</Link>
              </p>
            </div>

            {collection.description && (
              <p className="text-lg text-brand-muted leading-relaxed">
                {collection.description}
              </p>
            )}

            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-brand-muted pt-2 border-t border-brand-border/60">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span>Updated {format(new Date(collection.updatedAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Coffee size={14} />
                <span>{collection.items?.length || 0} Cafes</span>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-6">
            {collection.items?.map((item, index) => (
              <Card key={item.id} className="p-0 overflow-hidden border-brand-border flex flex-col sm:flex-row group bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-full sm:w-48 md:w-64 aspect-video sm:aspect-square shrink-0 bg-brand-cream overflow-hidden">
                  <Link to={`/cafes/${item.cafe.slug}`}>
                    {item.cafe.photos?.[0]?.url ? (
                      <img 
                        src={item.cafe.photos[0].url} 
                        alt={item.cafe.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-coffee/20">
                        <Coffee size={40} />
                      </div>
                    )}
                  </Link>
                  <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-brand-charcoal">
                    #{index + 1}
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <Link to={`/cafes/${item.cafe.slug}`} className="block group/title">
                        <h3 className="text-xl font-serif font-bold text-brand-charcoal group-hover/title:text-brand-coffee transition-colors flex items-center gap-2">
                          {item.cafe.name}
                          <ExternalLink size={14} className="opacity-0 group-hover/title:opacity-100 transition-opacity" />
                        </h3>
                      </Link>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-muted">
                      <MapPin size={12} className="text-brand-coffee" />
                      <span>{item.cafe.city}, {item.cafe.address}</span>
                    </div>
                  </div>

                  {item.note && (
                    <div className="mt-4 bg-brand-cream/40 p-4 rounded-2xl border border-brand-border/40 relative">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-brand-coffee mb-1 flex items-center gap-1.5">
                        <Clock size={10} />
                        <span>Curator's Note</span>
                      </div>
                      <p className="text-sm text-brand-charcoal italic leading-relaxed">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end">
                    <Link to={`/cafes/${item.cafe.slug}`}>
                      <button className="text-xs font-bold uppercase tracking-wider text-brand-coffee hover:text-brand-coffee-dark flex items-center gap-1.5 transition-colors">
                        View Cafe Details
                        <ArrowLeft size={12} className="rotate-180" />
                      </button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="pt-12 border-t border-brand-border text-center space-y-6">
            <div className="bg-brand-cream/30 p-8 rounded-3xl border border-brand-border space-y-4">
              <h2 className="text-2xl font-serif font-bold text-brand-charcoal">Want to create your own collections?</h2>
              <p className="text-brand-muted max-w-md mx-auto">Join CafeFinder to save your favorite coffee spots, write notes, and share your discovery boards with the world.</p>
              <div className="flex justify-center gap-4 pt-2">
                <Link to="/register">
                  <button className="px-8 py-3 bg-brand-coffee text-white rounded-xl font-bold shadow-lg shadow-brand-coffee/20 hover:bg-brand-coffee-dark transition-all">
                    Join Community
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </MainLayout>
  );
}
