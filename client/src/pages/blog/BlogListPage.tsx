import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2 } from 'lucide-react';
import { blogService } from '../../services/blogService';
import { BlogPost, ListResponse } from '../../types';
import { BlogCard } from '../../components/blog/BlogCard';
import { SearchInput } from '../../components/ui/SearchInput';
import { MainLayout } from '../../components/layout/MainLayout';
import { SEO } from '../../components/common/SEO';

const CATEGORIES = ['All', 'Coffee Culture', 'Brewing Guides', 'Cafe Reviews', 'Industry News', 'Lifestyle'];

const BlogListPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ListResponse<BlogPost>['pagination'] | null>(null);

  useEffect(() => {
    loadPosts();
  }, [page, category]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const response = await blogService.getAll({
        page,
        limit: 12,
        category: category === 'All' ? undefined : category,
        search: search || undefined
      });
      if (response.success) {
        setPosts(response.data.posts);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to load blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPosts();
  };

  return (
    <MainLayout>
      <SEO 
        title="The Cafe Journal — Coffee Culture & Brewing Guides"
        description="Discover the best cafe experiences, brewing secrets, and coffee culture from around the world. Stay updated with the latest in the specialty coffee industry."
      />
      <div className="min-h-screen bg-neutral-50/50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4"
            >
              The Cafe Journal
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-neutral-600 max-w-2xl mx-auto"
            >
              Discover the best cafe experiences, brewing secrets, and coffee culture from around the world.
            </motion.p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setPage(1);
                  }}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    category === cat
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="relative w-full md:w-80">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full"
              />
            </form>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
              <p className="text-neutral-500 font-medium">Brewing articles...</p>
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post, idx) => (
                  <BlogCard key={post.id} post={post} index={idx} />
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
                          ? 'bg-primary-600 text-white'
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
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-200">
              <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-900 mb-2">No articles found</h3>
              <p className="text-neutral-500">Try adjusting your search or category filters.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BlogListPage;
