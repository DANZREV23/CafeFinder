import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Coffee, Search, Loader2 } from 'lucide-react';
import { listService } from '../../services/listService';
import { CuratedList, CuratedListsResponse, Pagination } from '../../types';
import { ListCard } from '../../components/lists/ListCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { MainLayout } from '../../components/layout/MainLayout';
import { SEO } from '../../components/common/SEO';

const ListsPage: React.FC = () => {
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    loadLists();
  }, [page]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const response = await listService.getAll({
        page,
        limit: 12,
        search: search || undefined
      });
      if (response.success) {
        setLists(response.data.lists);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to load curated lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLists();
  };

  return (
    <MainLayout>
      <SEO 
        title="Curated Collections — Hand-Picked Best Cafes"
        description="Hand-picked selections of the finest cafes, workspace spots, and hidden gems in the city. Explore our themed collections for every mood."
      />
      <div className="min-h-screen bg-neutral-50/50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-black text-neutral-900 mb-4"
            >
              Curated Collections
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-neutral-600 max-w-2xl mx-auto text-lg"
            >
              Hand-picked selections of the finest cafes, workspace spots, and hidden gems in the city.
            </motion.p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-16">
            <form onSubmit={handleSearch} className="relative">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a collection..."
                className="w-full shadow-lg"
              />
            </form>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
              <p className="text-neutral-500 font-medium">Brewing collections...</p>
            </div>
          ) : lists.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {lists.map((list, idx) => (
                  <ListCard key={list.id} list={list} index={idx} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center mt-16 gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-10 h-10 rounded-lg font-bold transition-all ${
                        page === p
                          ? 'bg-primary-600 text-white shadow-md scale-110'
                          : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-neutral-100 shadow-sm">
              <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coffee className="w-10 h-10 text-neutral-300" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">No collections found</h3>
              <p className="text-neutral-500 max-w-sm mx-auto">
                We couldn't find any curated lists matching your search. Try different keywords!
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ListsPage;
