import * as React from "react";
import { UtensilsCrossed } from "lucide-react";

export const CafeMenuHighlights: React.FC = () => {
  return (
    <section className="space-y-8 pt-8 border-t border-brand-border">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal">Menu Highlights</h2>
        <UtensilsCrossed className="w-6 h-6 text-brand-coffee/20" />
      </div>
      
      <div className="p-12 text-center rounded-3xl border-2 border-dashed border-brand-border bg-brand-cream/10">
        <p className="text-brand-muted font-medium italic">
          Menu highlights and signature items will be available soon.
        </p>
      </div>
    </section>
  );
};
