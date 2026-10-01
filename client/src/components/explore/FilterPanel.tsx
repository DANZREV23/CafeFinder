import * as React from "react";
import { Check, X } from "lucide-react";
import { cafeService } from "@/services/cafeService";
import { useI18n } from "@/i18n";
import { Checkbox } from "../ui/Checkbox";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";

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
  const { t } = useI18n();
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
        <h3 className="font-bold text-brand-charcoal">{t("common.filter")}</h3>
        <button
          onClick={onClearAll}
          className="text-sm text-brand-coffee hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-brand-coffee focus:ring-offset-2 rounded"
        >
          {t("common.clear")} {t("common.all")}
        </button>
      </div>

      {/* City Filter */}
      <div className="space-y-3">
        <Label htmlFor="city-filter" className="uppercase tracking-wider">
          {t("cafe.location")}
        </Label>
        <Input
          id="city-filter"
          type="text"
          placeholder={t("accessibility.filterLabel")}
          value={filters.city || ""}
          onChange={(e) => onFilterChange("city", e.target.value)}
          className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-coffee/20"
        />
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label className="uppercase tracking-wider">
          {t("cafe.priceRange")}
        </Label>
        <div className="flex gap-2" role="group" aria-label={t("cafe.priceRange")}>
          {priceRanges.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() => onFilterChange("priceRange", filters.priceRange === price ? undefined : price)}
              aria-pressed={filters.priceRange === price}
              className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-coffee focus:ring-offset-2 ${
                filters.priceRange === price
                  ? "bg-brand-coffee text-white border-brand-coffee shadow-sm"
                  : "bg-white text-brand-muted border-brand-border hover:border-brand-coffee hover:text-brand-coffee"
              }`}
            >
              <span className="sr-only">{price} {t("cafe.priceRange")}</span>
              <span aria-hidden="true">{"₱".repeat(price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="space-y-3">
        <Label className="uppercase tracking-wider">
          {t("cafe.status.published")}
        </Label>
        <div className="space-y-4" role="group" aria-label="Status Filters">
          {[
            { key: "verified", label: t("cafe.verified") },
            { key: "featured", label: t("cafe.featured") },
            { key: "trending", label: t("cafe.trending") },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center space-x-3"
            >
              <Checkbox 
                id={`status-${item.key}`}
                checked={!!filters[item.key as keyof typeof filters]}
                onCheckedChange={(checked) => onFilterChange(item.key, checked)}
              />
              <Label 
                htmlFor={`status-${item.key}`}
                className="text-sm text-brand-charcoal font-medium cursor-pointer"
              >
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Vibes Filter */}
      {vibes.length > 0 && (
        <div className="space-y-3">
          <Label className="uppercase tracking-wider">
            Vibe
          </Label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Vibe Filters">
            {vibes.map((vibe) => (
              <button
                key={vibe.id}
                type="button"
                onClick={() => handleAmenityToggle(vibe.slug)}
                aria-pressed={(filters.amenities || []).includes(vibe.slug)}
                className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-brand-coffee focus:ring-offset-2 ${
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
        <Label className="uppercase tracking-wider">
          {t("cafe.amenities")}
        </Label>
        {loading ? (
          <div className="grid grid-cols-2 gap-2" aria-busy="true">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-8 bg-brand-cream/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Amenity Filters">
            {amenities.map((amenity) => (
              <div
                key={amenity.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  (filters.amenities || []).includes(amenity.slug)
                    ? "bg-brand-coffee/5 border-brand-coffee"
                    : "bg-white border-brand-border hover:border-brand-coffee/30"
                }`}
              >
                <Checkbox 
                  id={`amenity-${amenity.slug}`}
                  checked={(filters.amenities || []).includes(amenity.slug)}
                  onCheckedChange={() => handleAmenityToggle(amenity.slug)}
                />
                <Label 
                  htmlFor={`amenity-${amenity.slug}`}
                  className="text-[11px] font-bold uppercase tracking-tight line-clamp-1 cursor-pointer text-brand-charcoal"
                >
                  {amenity.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

