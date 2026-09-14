import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { 
  Heart, 
  Search, 
  Filter, 
  MapPin, 
  Coffee, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Loader2
} from "lucide-react";
import { CafeCard } from "@/components/cafe/CafeCard";
import favoriteService, { Favorite } from "@/services/favoriteService";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = React.useState<Favorite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [sort, setSort] = React.useState("recently_saved");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFavorites = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await favoriteService.getFavorites({
        page,
        limit: 12,
        search: debouncedSearch,
        sort
      });
      if (response.success) {
        setFavorites(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch favorites", err);
    } finally {
      setLoading(true);
      // Extra delay for smoother transition
      setTimeout(() => setLoading(false), 300);
    }
  };

  React.useEffect(() => {
    fetchFavorites();
  }, [page, debouncedSearch, sort, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <PageContainer className="py-24 text-center">
          <div className="max-w-md mx-auto space-y-8">
            <div className="w-24 h-24 bg-brand-cream rounded-full flex items-center justify-center mx-auto text-brand-coffee">
              <Heart className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-serif font-bold text-brand-charcoal">Sign in to see your favorites</h1>
              <p className="text-brand-muted leading-relaxed">
                Keep track of all the cafes you want to visit and discover new favorites.
              </p>
            </div>
            <Button as={Link} to="/login?redirect=/favorites" variant="primary" className="h-14 px-12 rounded-2xl">
              Sign In
            </Button>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-brand-background">
        <PageContainer className="py-12 md:py-20">
          <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-brand-coffee font-bold uppercase tracking-widest text-xs">
                  <div className="h-px w-8 bg-brand-coffee" />
                  Your Collection
                </div>
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-brand-charcoal">Saved Cafes</h1>
                <p className="text-brand-muted text-lg">
                  {total === 0 
                    ? "Start building your personal coffee map." 
                    : `You have ${total} saved ${total === 1 ? 'cafe' : 'cafes'} in your collection.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted group-focus-within:text-brand-coffee transition-colors" />
                  <Input 
                    placeholder="Search your saved cafes..."
                    className="pl-11 h-12 w-full md:w-72 bg-white border-brand-border rounded-xl focus:ring-brand-coffee/20"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2 bg-white border border-brand-border p-1 rounded-xl">
                   <select 
                     value={sort}
                     onChange={(e) => setSort(e.target.value)}
                     className="h-10 px-4 bg-transparent text-sm font-bold text-brand-charcoal focus:outline-none cursor-pointer"
                   >
                     <option value="recently_saved">Recently Saved</option>
                     <option value="rating">Highest Rated</option>
                     <option value="name_asc">Name (A-Z)</option>
                     <option value="name_desc">Name (Z-A)</option>
                   </select>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading && favorites.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4 animate-pulse">
                    <div className="aspect-video bg-brand-border/10 rounded-3xl" />
                    <div className="h-6 w-3/4 bg-brand-border/10 rounded-lg" />
                    <div className="h-4 w-1/2 bg-brand-border/10 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : favorites.length > 0 ? (
              <div className="space-y-12">
                <div className={cn(
                  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 transition-opacity duration-300",
                  loading ? "opacity-50" : "opacity-100"
                )}>
                  {favorites.map((fav) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={fav.id}
                    >
                      <CafeCard 
                        cafe={{...fav.cafe, isFavorite: true}} 
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-8">
                    <Button 
                      variant="outline" 
                      disabled={page === 1}
                      onClick={() => setPage(prev => prev - 1)}
                      className="h-12 w-12 p-0 rounded-xl"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <span className="text-sm font-bold text-brand-charcoal">
                      Page {page} of {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      disabled={page === totalPages}
                      onClick={() => setPage(prev => prev + 1)}
                      className="h-12 w-12 p-0 rounded-xl"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-brand-border rounded-[40px] p-20 text-center space-y-8">
                <div className="w-20 h-20 bg-brand-background rounded-3xl flex items-center justify-center mx-auto text-brand-muted">
                  <Coffee className="w-10 h-10" />
                </div>
                <div className="space-y-4 max-w-sm mx-auto">
                  <h2 className="text-3xl font-serif font-bold text-brand-charcoal">
                    {search ? "No matches found" : "Your collection is empty"}
                  </h2>
                  <p className="text-brand-muted leading-relaxed">
                    {search 
                      ? `We couldn't find any saved cafes matching "${search}"` 
                      : "Start saving cafes you want to visit and they'll appear here."}
                  </p>
                </div>
                <Button as={Link} to="/explore" variant="primary" className="h-14 px-12 rounded-2xl">
                  Explore Cafes
                </Button>
              </div>
            )}
          </div>
        </PageContainer>
      </div>
    </MainLayout>
  );
}
