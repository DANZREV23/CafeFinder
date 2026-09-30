import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

interface CafeRatingProps {
  rating: number | string;
  reviewCount?: number;
  showText?: boolean;
  className?: string;
}

export function CafeRating({ rating, reviewCount, showText = true, className }: CafeRatingProps) {
  const { t } = useI18n();
  const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      aria-label={t("accessibility.ratingLabel", { rating: numericRating.toFixed(1) })}
    >
      <div className="flex items-center gap-0.5 text-brand-accent-warm" aria-hidden="true">
        <Star className="h-4 w-4 fill-current" />
        <span className="font-semibold text-sm">{numericRating.toFixed(1)}</span>
      </div>
      {showText && reviewCount !== undefined && (
        <span className="text-brand-muted text-xs">
          <span className="sr-only">{t("accessibility.reviewsLabel", { count: reviewCount })}</span>
          <span aria-hidden="true">({reviewCount})</span>
        </span>
      )}
    </div>
  );
}
