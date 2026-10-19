import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Coffee, MapPin, Star, ArrowRight, Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageContainer } from '../components/layout/PageContainer';
import { SEO } from '../components/common/SEO';
import favoriteService, { Favorite } from '../services/favoriteService';
import { Button } from '../components/ui/Button';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const loadFavorites = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await favoriteService.getFavorites({ page: pageNum, limit: 12, search });
      if (res.success && res.data) {
        setFavorites(res.data.data || res.data || []);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites(page);
  }, [page]);

  const handleRemove = async (cafeId: string) => {
    try {
      await favoriteService.removeFavorite(cafeId);
      setFavorites((prev) => prev.filter((f) => f.cafe?.id !== cafeId));
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  return (
    <MainLayout>
      <SEO title="My Favorites - CafeFinder" description="View and manage your saved coffee shops on CafeFinder." />
      <PageContainer className="py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            Saved Cafes
          </h1>
          <p className="mt-2 text-stone-600">Your collection of favorite coffee spots across the city</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-brand-coffee" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
            <Coffee className="mx-auto h-12 w-12 text-stone-400 mb-4" />
            <h3 className="text-lg font-serif font-semibold text-stone-900">No favorites yet</h3>
            <p className="mt-1 text-sm text-stone-500 max-w-sm mx-auto">
              Explore our curated cafe directory and save the spots you'd love to visit!
            </p>
            <Link to="/explore" className="inline-block mt-6">
              <Button className="bg-brand-coffee hover:bg-brand-coffee-dark text-white rounded-xl">
                Explore Cafes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((fav) => {
              const cafe = fav.cafe;
              if (!cafe) return null;
              const photoUrl = cafe.coverImage || cafe.photos?.[0]?.url || '/placeholder-cafe.jpg';

              return (
                <div
                  key={fav.id || cafe.id}
                  className="group rounded-2xl border border-brand-border bg-white overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                      <img
                        src={photoUrl}
                        alt={cafe.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => handleRemove(cafe.id)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-rose-500 hover:bg-white shadow-xs transition-colors cursor-pointer"
                        title="Remove from favorites"
                      >
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-serif font-bold text-lg text-stone-900 line-clamp-1 group-hover:text-brand-coffee transition-colors">
                          <Link to={`/cafes/${cafe.slug}`}>{cafe.name}</Link>
                        </h3>
                        {cafe.ratingAverage !== undefined && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {cafe.ratingAverage ? Number(cafe.ratingAverage).toFixed(1) : 'New'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="line-clamp-1">{cafe.address || cafe.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-0">
                    <Link
                      to={`/cafes/${cafe.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-stone-700 hover:bg-brand-cream/60 transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="rounded-xl"
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm font-medium text-stone-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="rounded-xl"
            >
              Next
            </Button>
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
