import React, { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout.js';
import CafeCard from '../components/CafeCard.js';
import { LoadingState, ErrorState, EmptyState } from '../components/States.js';
import { getCafes } from '../services/cafeService.js';
import { Cafe } from '../types/index.js';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ExplorePage() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCafes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCafes(page, 12);
      if (response.success) {
        setCafes(response.data);
        setTotalPages(response.pagination.totalPages);
      } else {
        setError(response.error?.message || 'Failed to load cafes');
      }
    } catch (err) {
      setError('Connection to the coffee server lost. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafes();
  }, [page]);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-stone-900 mb-4 tracking-tight">
            Explore the best <span className="text-amber-800">cafes</span>
          </h1>
          <p className="text-lg text-stone-500 max-w-2xl">
            Discover specialty coffee, quiet study spots, and vibrant social hubs in your neighborhood.
          </p>
        </header>

        {/* Search & Filter Placeholder */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name, city or vibes..."
              className="w-full bg-white border border-stone-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-amber-800 focus:border-transparent transition-all outline-none"
            />
          </div>
          <button className="flex items-center justify-center space-x-2 bg-white border border-stone-200 rounded-2xl px-6 py-4 font-bold text-stone-900 hover:bg-stone-50 transition-colors">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCafes} />
        ) : cafes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 disabled:opacity-50 hover:bg-stone-50 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <span className="text-sm font-bold text-stone-900">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-full bg-white border border-stone-200 text-stone-600 disabled:opacity-50 hover:bg-stone-50 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
