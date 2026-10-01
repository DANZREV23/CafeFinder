import * as React from "react";

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const SortSelect: React.FC<SortSelectProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm font-medium text-brand-muted whitespace-nowrap">
        Sort by:
      </label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 px-3 bg-white border border-brand-border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-coffee/20 appearance-none min-w-[140px] cursor-pointer"
      >
        <option value="recommended">Recommended For You</option>
        <option value="rating">Highest Rated</option>
        <option value="popular">Most Popular</option>
        <option value="latest">Newest</option>
        <option value="name">Name A–Z</option>
      </select>
    </div>
  );
};
