import * as React from "react";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export const CafeMenuHighlights: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return (
    <section className="space-y-8 pt-8 border-t border-brand-border">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-brand-charcoal">Menu</h2>
        <UtensilsCrossed className="w-6 h-6 text-brand-coffee/20" />
      </div>
      
      <div className="p-10 rounded-3xl border border-brand-border bg-white shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex flex-col md:flex-row items-center gap-8 md:text-left text-center">
          <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center text-brand-coffee shrink-0">
            <UtensilsCrossed className="w-10 h-10" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-bold text-brand-charcoal">Explore our full menu</h3>
            <p className="text-brand-muted">Check out our signature brews, artisanal pastries, and seasonal specialties.</p>
          </div>
          <Button as={Link} to={`/cafes/${slug}/menu`} variant="primary" className="h-12 px-8 rounded-2xl group-hover:gap-4 transition-all">
            View Menu
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
