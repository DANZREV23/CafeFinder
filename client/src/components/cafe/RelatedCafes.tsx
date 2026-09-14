import * as React from "react";
import { Cafe } from "@/types";
import { CafeCard } from "./CafeCard";

interface RelatedCafesProps {
  cafes: Cafe[];
}

export const RelatedCafes: React.FC<RelatedCafesProps> = ({ cafes }) => {
  if (cafes.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif text-brand-charcoal">More Cafes to Explore</h2>
        <div className="h-px flex-1 bg-brand-border mx-8 hidden md:block" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} />
        ))}
      </div>
    </section>
  );
};
