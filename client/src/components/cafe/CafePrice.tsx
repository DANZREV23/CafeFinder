import { cn } from "@/lib/utils";

interface CafePriceProps {
  priceRange: number | string;
  className?: string;
}

export function CafePrice({ priceRange, className }: CafePriceProps) {
  const range = typeof priceRange === 'string' ? parseInt(priceRange) : priceRange;
  
  return (
    <div className={cn("text-xs font-medium text-brand-muted", className)}>
      {"$".repeat(Math.max(1, Math.min(4, range)))}
      <span className="opacity-30">
        {"$".repeat(4 - Math.max(1, Math.min(4, range)))}
      </span>
    </div>
  );
}
