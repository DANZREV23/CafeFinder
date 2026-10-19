import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Globe, 
  Lock, 
  Calendar, 
  MapPin, 
  Star, 
  Coffee,
  MessageSquare,
  ExternalLink,
  User as UserIcon
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageContainer } from '@/components/layout/PageContainer';
import { collectionService, UserCollection, CollectionItem } from '@/services/collectionService';
import { SEO } from '@/components/common/SEO';
import { toast } from 'react-hot-toast';

export default function PublicCollectionPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();
  const [collection, setCollection] = useState<UserCollection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username && slug) {
      loadPublicCollection();
    }
  }, [username, slug]);

  const loadPublicCollection = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await collectionService.getPublicCollection(username!, slug!);
      if (res.success && res.data) {
        setCollection(res.data);
        setItems(res.data.items || []);
      } else {
        setError('Collection not found or is set to private.');
      }
    } catch (err: any) {
      setError(err.message || 'Collection not found or is set to private.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <MainLayout>
        <PageContainer className="py-16">
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-coffee"></div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  if (error || !collection) {
    return (
      <MainLayout>
        <PageContainer className="py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <Lock className="w-12 h-12 text-stone-400 mx-auto" />
            <h1 className="text-2xl font-serif font-bold text-stone-900">Collection Unavailable</h1>
            <p className="text-stone-500 text-sm">{error || 'This collection is private or does not exist.'}</p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-coffee text-white font-medium rounded-xl text-sm hover:bg-brand-coffee/90 transition-colors"
            >
              Explore Cafes
            </Link>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={`${collection.name} | Cafe Collection by ${collection.user?.name || username}`}
        description={collection.description || `Curated cafe list by ${collection.user?.name || username} on CafeFinder.`}
      />
      <PageContainer className="py-10 md:py-14 space-y-8">
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore More Cafes
          </Link>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 hover:bg-stone-50 shadow-sm transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Collection
          </button>
        </div>

        {/* Collection Hero */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-10 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <Globe className="w-4 h-4" /> Public Collection
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-stone-900 tracking-tight">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-stone-600 text-base md:text-lg max-w-2xl leading-relaxed">
              {collection.description}
            </p>
          )}

          {/* Curator Info */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between flex-wrap gap-4 text-sm text-stone-500">
            <div className="flex items-center gap-3">
              {collection.user?.avatarUrl ? (
                <img
                  src={collection.user.avatarUrl}
                  alt={collection.user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center font-bold text-xs">
                  {collection.user?.name?.[0] || 'U'}
                </div>
              )}
              <span>
                Curated by <strong className="text-stone-900">{collection.user?.name || username}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-stone-400" />
              <span>{items.length} {items.length === 1 ? 'cafe' : 'cafes'} saved</span>
            </div>
          </div>
        </div>

        {/* Cafes in Collection */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-stone-900">Cafes in this list</h2>

          {items.length === 0 ? (
            <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl text-stone-500">
              No cafes have been added to this collection yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item, index) => {
                const cafe = item.cafe || {};
                const cover = cafe.photos?.[0]?.url || cafe.coverImage;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex gap-4">
                      {cover ? (
                        <img
                          src={cover}
                          alt={cafe.name}
                          className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 flex-shrink-0">
                          <Coffee className="w-8 h-8" />
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-stone-400">#{index + 1}</span>
                          <Link
                            to={`/cafes/${cafe.slug || cafe.id}`}
                            className="font-bold text-stone-900 hover:text-brand-coffee transition-colors truncate block text-base"
                          >
                            {cafe.name}
                          </Link>
                        </div>

                        {cafe.city && (
                          <div className="flex items-center gap-1.5 text-xs text-stone-500">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{cafe.address ? `${cafe.address}, ` : ''}{cafe.city}</span>
                          </div>
                        )}

                        {cafe.ratingAverage > 0 && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-stone-700">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{Number(cafe.ratingAverage).toFixed(1)}</span>
                            <span className="text-stone-400">({cafe.reviewCount || 0})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Curator's Custom Note */}
                    {item.note && (
                      <div className="p-3 bg-amber-50/60 border border-amber-200/50 rounded-xl text-xs text-stone-700 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="italic">"{item.note}"</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex justify-end">
                      <Link
                        to={`/cafes/${cafe.slug || cafe.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-coffee hover:text-brand-coffee/80"
                      >
                        View cafe profile <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageContainer>
    </MainLayout>
  );
}
