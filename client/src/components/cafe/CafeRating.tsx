import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

interface CafeRatingProps {
  rating?: number | string | null;
  reviewCount?: number;
  showText?: boolean;
  className?: string;
}

export function CafeRating({ rating, reviewCount, showText = true, className }: CafeRatingProps) {
  const { t } = useI18n();
  const rawNum = typeof rating === 'string' ? parseFloat(rating) : Number(rating ?? 0);
  const numericRating = isNaN(rawNum) ? 0 : rawNum;
  const hasRating = numericRating > 0;
  const displayRating = hasRating ? numericRating.toFixed(1) : 'New';

  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      aria-label={t("accessibility.ratingLabel", { rating: displayRating })}
    >
      <div className="flex items-center gap-0.5 text-brand-accent-warm" aria-hidden="true">
        <Star className={cn("h-4 w-4", hasRating ? "fill-current" : "text-stone-300")} />
        <span className="font-semibold text-sm">{displayRating}</span>
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
