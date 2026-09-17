import * as React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsStatCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const AnalyticsStatCard: React.FC<AnalyticsStatCardProps> = ({
  title,
  value,
  previousValue,
  icon,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-brand-border animate-pulse">
        <div className="h-4 w-1/3 bg-brand-background rounded-full mb-4" />
        <div className="h-8 w-1/2 bg-brand-background rounded-full" />
      </div>
    );
  }

  const calcTrend = () => {
    if (previousValue === undefined || previousValue === null) return null;
    const curr = typeof value === 'string' ? parseFloat(value) : value;
    const prev = typeof previousValue === 'string' ? parseFloat(previousValue) : previousValue;
    
    if (prev === 0) return curr > 0 ? { percent: 100, up: true } : { percent: 0, up: false };
    
    const diff = curr - prev;
    const percent = Math.abs((diff / prev) * 100);
    
    return {
      percent: Math.round(percent),
      up: diff > 0,
      none: diff === 0
    };
  };

  const trend = calcTrend();

  return (
    <div className="bg-white p-8 rounded-3xl border border-brand-border hover:border-brand-coffee/30 transition-all shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold uppercase tracking-widest text-brand-muted">{title}</span>
        {icon && <div className="text-brand-coffee opacity-50">{icon}</div>}
      </div>
      <div className="space-y-2">
        <div className="text-4xl font-serif font-bold text-brand-charcoal">{value}</div>
        {trend && (
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {trend.none ? (
              <span className="text-brand-muted flex items-center gap-1">
                <Minus className="w-3 h-3" /> No change
              </span>
            ) : trend.up ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +{trend.percent}%
              </span>
            ) : (
              <span className="text-rose-600 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -{trend.percent}%
              </span>
            )}
            <span className="text-brand-muted font-normal">vs previous period</span>
          </div>
        )}
      </div>
    </div>
  );
};
