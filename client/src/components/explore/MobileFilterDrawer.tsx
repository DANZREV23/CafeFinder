import * as React from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { FilterPanel } from "./FilterPanel";

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onFilterChange: (key: string, value: any) => void;
  onClearAll: () => void;
  totalResults: number;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onClearAll,
  totalResults,
}) => {
  // Prevent scrolling when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xs bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <h2 className="text-lg font-bold text-brand-charcoal">Filters</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-brand-cream rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-brand-muted" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <FilterPanel 
            filters={filters}
            onFilterChange={onFilterChange}
            onClearAll={onClearAll}
          />
        </div>
        
        <div className="p-4 border-t border-brand-border bg-brand-cream/30">
          <Button 
            className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-brand-coffee/20"
            onClick={onClose}
          >
            Show {totalResults} {totalResults === 1 ? 'Cafe' : 'Cafes'}
          </Button>
        </div>
      </div>
    </div>
  );
};
