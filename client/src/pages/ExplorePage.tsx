import * as React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { CafeCard } from "@/components/cafe/CafeCard";
import { CafeGrid, CafeGridSkeleton } from "@/components/cafe/CafeGrid";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { cafeService } from "@/services/api";
import { Cafe } from "@/types";
import { Filter, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cafes, setCafes] = React.useState<Cafe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const page = parseInt(searchParams.get("page") || "1");
  const query = searchParams.get("q") || "";
  const [totalPages, setTotalPages] = React.useState(1);

  const fetchCafes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cafeService.getAll(page, 12);
      if (response.success) {
        setCafes(response.data);
        setTotalPages(response.pagination.totalPages);
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
  }, [page, query]);

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
  ];

  return (
    <MainLayout>
      <PageHeader 
        title="Explore Cafes"
        description="Find coffee shops that match your mood, work style, and taste. Discover specialty brews and local favorites."
        breadcrumbs={breadcrumbs}
        background="cream"
      />

      <PageContainer className="pb-24">
        {/* Filters and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-12 -mt-8 relative z-10">
          <div className="flex-grow">
            <SearchInput 
              placeholder="Search by cafe name, location, or vibe..." 
              value={query}
              onChange={(e) => {
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) newParams.set("q", e.target.value);
                else newParams.delete("q");
                setSearchParams(newParams);
              }}
              onClear={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("q");
                setSearchParams(newParams);
              }}
              className="shadow-lg h-14 md:h-16"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="h-14 md:h-16 px-6 bg-white shadow-lg">
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="lg" className="h-14 md:h-16 px-6 bg-white shadow-lg">
              Sort
            </Button>
          </div>
        </div>

        {/* Filter Chips Placeholder */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
          {["Specialty Coffee", "Quiet Workspace", "Outdoor Seating", "Fast Wi-Fi", "Pet Friendly", "Vegan Options"].map(filter => (
            <button 
              key={filter}
              className="whitespace-nowrap px-4 py-2 rounded-full border border-brand-border bg-white text-sm font-medium text-brand-muted hover:border-brand-coffee hover:text-brand-coffee transition-all"
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <CafeGridSkeleton />
        ) : error ? (
          <ErrorState onRetry={fetchCafes} />
        ) : cafes.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-12">
            <div className="flex justify-between items-center border-b border-brand-border pb-4">
              <span className="text-sm font-medium text-brand-muted">
                Showing <span className="text-brand-charcoal">{cafes.length}</span> cafes
              </span>
              <div className="hidden md:flex gap-1">
                 {/* Grid/List toggle placeholder */}
              </div>
            </div>

            <CafeGrid>
              {cafes.map((cafe) => (
                <CafeCard key={cafe.id} cafe={cafe} />
              ))}
            </CafeGrid>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 pt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set("page", Math.max(1, page - 1).toString());
                    setSearchParams(newParams);
                  }}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-brand-charcoal">
                    {page}
                  </span>
                  <span className="text-sm text-brand-muted">
                    of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set("page", Math.min(totalPages, page + 1).toString());
                    setSearchParams(newParams);
                  }}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </MainLayout>
  );
}
