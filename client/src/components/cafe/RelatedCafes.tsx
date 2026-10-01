import * as React from "react";
import { Cafe } from "@/types";
import { CafeCard } from "./CafeCard";
import { Sparkles } from "lucide-react";

interface RelatedCafesProps {
  cafes: Cafe[];
}

export const RelatedCafes: React.FC<RelatedCafesProps> = ({ cafes }) => {
  if (cafes.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Smart Match</span>
          </div>
          <h2 className="text-3xl font-serif text-brand-charcoal">Similar Cafes You Might Like</h2>
          <p className="text-sm text-brand-muted mt-1">
            Handpicked alternatives matched by shared amenities, atmosphere, and neighborhood.
          </p>
        </div>
        <div className="h-px flex-1 bg-brand-border mx-8 hidden lg:block" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </div>
    </section>
  );
};
