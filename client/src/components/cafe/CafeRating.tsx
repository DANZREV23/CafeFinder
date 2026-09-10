import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CafeRatingProps {
  rating: number | string;
  reviewCount?: number;
  showText?: boolean;
  className?: string;
}

export function CafeRating({ rating, reviewCount, showText = true, className }: CafeRatingProps) {
  const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5 text-brand-accent-warm">
        <Star className="h-4 w-4 fill-current" />
        <span className="font-semibold text-sm">{numericRating.toFixed(1)}</span>
      </div>
      {showText && reviewCount !== undefined && (
        <span className="text-brand-muted text-xs">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
