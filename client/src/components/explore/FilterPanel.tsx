import * as React from "react";
import { Button } from "../ui/Button";
import { Check, X } from "lucide-react";
import { cafeService } from "@/services/cafeService";

interface FilterPanelProps {
  filters: {
    city?: string;
    priceRange?: number;
    featured?: boolean;
    trending?: boolean;
    verified?: boolean;
    amenities?: string[];
  };
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearAll,
  className = "",
}) => {
  const [availableAmenities, setAvailableAmenities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const priceRanges = [1, 2, 3, 4];

  React.useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const response = await cafeService.getAmenities();
        if (response.success) {
          setAvailableAmenities(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch amenities", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAmenities();
  }, []);

  const handleAmenityToggle = (slug: string) => {
    const current = filters.amenities || [];
    if (current.includes(slug)) {
      onFilterChange("amenities", current.filter(s => s !== slug));
    } else {
      onFilterChange("amenities", [...current, slug]);
    }
  };

  const vibeSlugs = ['study-friendly', 'work-friendly', 'quiet', 'late-night'];
  const vibes = availableAmenities.filter(a => vibeSlugs.includes(a.slug));
  const amenities = availableAmenities.filter(a => !vibeSlugs.includes(a.slug));

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-brand-charcoal">Filters</h3>
        <button
          onClick={onClearAll}
          className="text-sm text-brand-coffee hover:underline font-medium"
        >
          Clear all
        </button>
      </div>

      {/* City Filter */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
          City
        </label>
        <input
          type="text"
          placeholder="Filter by city..."
          value={filters.city || ""}
          onChange={(e) => onFilterChange("city", e.target.value)}
          className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
        />
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
          Price Range
        </label>
        <div className="flex gap-2">
          {priceRanges.map((price) => (
            <button
              key={price}
              onClick={() => onFilterChange("priceRange", filters.priceRange === price ? undefined : price)}
              className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all ${
                filters.priceRange === price
                  ? "bg-brand-coffee text-white border-brand-coffee shadow-sm"
                  : "bg-white text-brand-muted border-brand-border hover:border-brand-coffee hover:text-brand-coffee"
              }`}
            >
              {"₱".repeat(price)}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
          Status
        </label>
        <div className="space-y-2">
          {[
            { key: "verified", label: "Verified Only" },
            { key: "featured", label: "Featured Only" },
            { key: "trending", label: "Trending Only" },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                onClick={() => onFilterChange(item.key, !filters[item.key as keyof typeof filters])}
                className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                  filters[item.key as keyof typeof filters]
                    ? "bg-brand-coffee border-brand-coffee text-white"
                    : "bg-white border-brand-border group-hover:border-brand-coffee"
                }`}
              >
                {filters[item.key as keyof typeof filters] && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm text-brand-charcoal font-medium">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Vibes Filter */}
      {vibes.length > 0 && (
        <div className="space-y-3">
          <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
            Vibe
          </label>
          <div className="flex flex-wrap gap-2">
            {vibes.map((vibe) => (
              <button
                key={vibe.id}
                onClick={() => handleAmenityToggle(vibe.slug)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
                  (filters.amenities || []).includes(vibe.slug)
                    ? "bg-brand-coffee text-white border-brand-coffee shadow-md"
                    : "bg-brand-cream/30 text-brand-coffee border-brand-coffee/10 hover:border-brand-coffee/30"
                }`}
              >
                {vibe.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amenities Filter */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
          Amenities
        </label>
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-brand-cream/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {amenities.map((amenity) => (
              <button
                key={amenity.id}
                onClick={() => handleAmenityToggle(amenity.slug)}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg border text-left transition-all ${
                  (filters.amenities || []).includes(amenity.slug)
                    ? "bg-brand-coffee/5 border-brand-coffee text-brand-coffee"
                    : "bg-white border-brand-border hover:border-brand-coffee/30 text-brand-muted"
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all ${
                  (filters.amenities || []).includes(amenity.slug)
                    ? "bg-brand-coffee border-brand-coffee text-white"
                    : "bg-white border-brand-border"
                }`}>
                  {(filters.amenities || []).includes(amenity.slug) && <Check className="w-2.5 h-2.5" />}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-tight line-clamp-1">
                  {amenity.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

