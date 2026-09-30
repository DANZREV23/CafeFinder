import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

interface CafePriceProps {
  priceRange: number | string;
  className?: string;
}

export function CafePrice({ priceRange, className }: CafePriceProps) {
  const { t } = useI18n();
  const range = typeof priceRange === 'string' ? parseInt(priceRange) : priceRange;
  const safeRange = Math.max(1, Math.min(4, range));
  
  return (
    <div 
      className={cn("text-xs font-medium text-brand-muted", className)}
      aria-label={`${t("cafe.priceRange")}: ${safeRange} out of 4`}
    >
      <span aria-hidden="true">
        {"₱".repeat(safeRange)}
        <span className="opacity-30">
          {"₱".repeat(4 - safeRange)}
        </span>
      </span>
    </div>
  );
}
