import * as React from "react";
import { X } from "lucide-react";

interface ActiveFiltersProps {
  search?: string;
  city?: string;
  priceRange?: number;
  featured?: boolean;
  trending?: boolean;
  verified?: boolean;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  search,
  city,
  priceRange,
  featured,
  trending,
  verified,
  onRemove,
  onClearAll,
}) => {
  const activeCount = [search, city, priceRange, featured, trending, verified].filter(Boolean).length;

  if (activeCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm font-bold text-brand-charcoal mr-2">Active filters:</span>
      
      {search && (
        <FilterChip label={`Search: ${search}`} onRemove={() => onRemove("search")} />
      )}
      
      {city && (
        <FilterChip label={`City: ${city}`} onRemove={() => onRemove("city")} />
      )}
      
      {priceRange && (
        <FilterChip label={`Price: ${"$".repeat(priceRange)}`} onRemove={() => onRemove("priceRange")} />
      )}
      
      {verified && (
        <FilterChip label="Verified Only" onRemove={() => onRemove("verified")} />
      )}
      
      {featured && (
        <FilterChip label="Featured Only" onRemove={() => onRemove("featured")} />
      )}
      
      {trending && (
        <FilterChip label="Trending Only" onRemove={() => onRemove("trending")} />
      )}

      {activeCount > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs font-bold text-brand-coffee hover:underline px-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-cream border border-brand-coffee/20 rounded-full text-xs font-bold text-brand-coffee transition-all hover:border-brand-coffee/40">
    {label}
    <button onClick={onRemove} className="hover:text-brand-charcoal">
      <X className="w-3 h-3" />
    </button>
  </div>
);
