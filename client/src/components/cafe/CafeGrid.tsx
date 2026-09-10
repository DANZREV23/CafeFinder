import * as React from "react";
import { cn } from "@/lib/utils";

interface CafeGridProps {
  children: React.ReactNode;
  className?: string;
}

export function CafeGrid({ children, className }: CafeGridProps) {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8",
      className
    )}>
      {children}
    </div>
  );
}

export function CafeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <div className="aspect-video w-full bg-brand-border/30 animate-pulse rounded-xl" />
          <div className="space-y-2">
            <div className="h-5 w-2/3 bg-brand-border/30 animate-pulse rounded" />
            <div className="h-4 w-1/3 bg-brand-border/30 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
