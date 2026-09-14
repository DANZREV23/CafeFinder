import * as React from "react";
import { Button } from "../ui/Button";
import { Check, X } from "lucide-react";

interface FilterPanelProps {
  filters: {
    city?: string;
    priceRange?: number;
    featured?: boolean;
    trending?: boolean;
    verified?: boolean;
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
  const priceRanges = [1, 2, 3, 4];

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
              {"$".repeat(price)}
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

      {/* Amenities (Coming Soon) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-brand-charcoal uppercase tracking-wider">
            Amenities
          </label>
          <span className="text-[10px] bg-brand-cream text-brand-coffee px-1.5 py-0.5 rounded font-bold uppercase">
            Soon
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 opacity-60">
          {[
            "Fast Wi-Fi",
            "Pet Friendly",
            "Outdoor Seating",
            "Vegan Options",
            "Power Outlets",
            "Quiet",
            "Air Conditioned",
            "Study Friendly",
          ].map((amenity) => (
            <div
              key={amenity}
              className="flex items-center gap-2 px-2 py-1.5 rounded bg-brand-cream/50 text-xs font-medium text-brand-muted cursor-not-allowed"
            >
              <div className="w-3 h-3 rounded-full border border-brand-border" />
              {amenity}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
