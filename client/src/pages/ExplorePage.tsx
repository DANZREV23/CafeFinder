import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { SearchInput } from "@/components/ui/SearchInput";
import { CafeCard } from "@/components/cafe/CafeCard";
import { CafeGrid, CafeGridSkeleton } from "@/components/cafe/CafeGrid";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cafeService } from "@/services/cafeService";
import { Cafe } from "@/types";
import { SlidersHorizontal } from "lucide-react";
import { ExploreHeader } from "@/components/explore/ExploreHeader";
import { FilterPanel } from "@/components/explore/FilterPanel";
import { SortSelect } from "@/components/explore/SortSelect";
import { ActiveFilters } from "@/components/explore/ActiveFilters";
import { ExplorePagination } from "@/components/explore/ExplorePagination";
import { MobileFilterDrawer } from "@/components/explore/MobileFilterDrawer";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { MapProvider } from "@/components/map/MapProvider";
import { CafeMap } from "@/components/map/CafeMap";
import { Map, List } from "lucide-react";

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cafes, setCafes] = React.useState<Cafe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);
  const [selectedCafeId, setSelectedCafeId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"list" | "map">("list");

  // Ref for result list container to handle scrolling
  const resultListRef = React.useRef<HTMLDivElement>(null);

  // Parse URL parameters
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "rating";
  const city = searchParams.get("city") || "";
  const priceRange = searchParams.get("priceRange") ? parseInt(searchParams.get("priceRange")!) : undefined;
  const featured = searchParams.get("featured") === "true";
  const trending = searchParams.get("trending") === "true";
  const verified = searchParams.get("verified") === "true";

  const filters = {
    city,
    priceRange,
    featured,
    trending,
    verified,
  };

  const fetchCafes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cafeService.getAll({
        page,
        limit: 12,
        search,
        sort,
        city,
        priceRange,
        featured,
        trending,
        verified,
      });
      if (response.success) {
        setCafes(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalItems(response.pagination?.total || 0);
      } else {
        setError(response.error?.message || "Failed to load cafes");
      }
    } catch (err) {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCafes();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, search, sort, city, priceRange, featured, trending, verified]);

  const updateParams = (updates: Record<string, any>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === false) {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });
    // Always reset to page 1 when filters change, unless page is explicitly being set
    if (!updates.page) {
      newParams.set("page", "1");
    }
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: any) => {
    updateParams({ [key]: value });
  };

  const handleRemoveFilter = (key: string) => {
    updateParams({ [key]: undefined });
  };

  const handleClearAll = () => {
    setSearchParams({});
  };

  const handleCafeSelect = (cafeId: string | null) => {
    setSelectedCafeId(cafeId);
    if (cafeId && resultListRef.current) {
      const element = document.getElementById(`cafe-card-${cafeId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-brand-background">
        {/* Header Area */}
          <header className="bg-white border-b border-brand-border px-6 py-4 z-20">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <SearchInput 
                  placeholder="Search cafes, cities, or vibes..." 
                  defaultValue={search}
                  onSearch={(val) => handleFilterChange("search", val)}
                  onClear={() => handleRemoveFilter("search")}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-brand-cream/50 p-1 rounded-xl border border-brand-border flex md:hidden">
                  <button 
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      viewMode === "list" ? "bg-white text-brand-coffee shadow-sm" : "text-brand-muted"
                    )}
                  >
                    <List className="w-4 h-4" />
                    List
                  </button>
                  <button 
                    onClick={() => setViewMode("map")}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      viewMode === "map" ? "bg-white text-brand-coffee shadow-sm" : "text-brand-muted"
                    )}
                  >
                    <Map className="w-4 h-4" />
                    Map
                  </button>
                </div>
                <Button
                  variant="outline"
                  className="h-10 px-4 border-brand-border flex items-center gap-2"
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
                <SortSelect 
                  value={sort}
                  onChange={(val) => handleFilterChange("sort", val)}
                />
              </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden relative">
            {/* Results Sidebar / List */}
            <aside 
              className={cn(
                "w-full lg:w-[40%] xl:w-[35%] border-r border-brand-border bg-white flex flex-col transition-all duration-300 z-10",
                viewMode === "map" ? "hidden lg:flex" : "flex"
              )}
            >
              {/* Active Filters Bar */}
              <div className="px-6 py-3 border-b border-brand-border bg-brand-background/30 overflow-x-auto no-scrollbar">
                <ActiveFilters 
                  search={search}
                  city={city}
                  priceRange={priceRange}
                  featured={featured}
                  trending={trending}
                  verified={verified}
                  onRemove={handleRemoveFilter}
                  onClearAll={handleClearAll}
                />
              </div>

              <div 
                ref={resultListRef}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-brand-border"
              >
                {loading ? (
                  <div className="space-y-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-[400px] bg-brand-border/10 animate-pulse rounded-3xl" />
                    ))}
                  </div>
                ) : error ? (
                  <ErrorState onRetry={fetchCafes} />
                ) : cafes.length === 0 ? (
                  <EmptyState 
                    title={search ? `No results for "${search}"` : "No cafes found"}
                    description="Try adjusting your filters to find what you're looking for."
                    action={<Button onClick={handleClearAll} variant="outline">Clear filters</Button>}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-brand-muted">
                        {totalItems} Cafes Found
                      </span>
                    </div>
                    <div className="space-y-6 pb-24 lg:pb-6">
                      {cafes.map((cafe) => (
                        <div 
                          key={cafe.id} 
                          id={`cafe-card-${cafe.id}`}
                          className={cn(
                            "transition-all duration-300",
                            selectedCafeId === cafe.id && "ring-2 ring-brand-coffee ring-offset-4 rounded-3xl"
                          )}
                          onClick={() => setSelectedCafeId(cafe.id)}
                        >
                          <CafeCard cafe={cafe} />
                        </div>
                      ))}
                      
                      <div className="pt-4">
                        <ExplorePagination 
                          currentPage={page}
                          totalPages={totalPages}
                          onPageChange={(p) => updateParams({ page: p })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </aside>

            {/* Map Area */}
            <main 
              className={cn(
                "flex-1 relative bg-brand-cream/10",
                viewMode === "list" ? "hidden lg:block" : "block"
              )}
            >
              <CafeMap 
                cafes={cafes}
                selectedCafeId={selectedCafeId}
                onCafeSelect={handleCafeSelect}
                className="rounded-none border-0"
              />
              
              {/* Floating Map Actions */}
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <Button 
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden bg-white text-brand-charcoal hover:bg-brand-background shadow-xl rounded-2xl h-12 px-6 border-brand-border"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>
            </main>
          </div>
        </div>

        <MobileFilterDrawer 
          isOpen={isMobileFiltersOpen}
          onClose={() => setIsMobileFiltersOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
          totalResults={totalItems}
        />
    </MainLayout>
  );
}

