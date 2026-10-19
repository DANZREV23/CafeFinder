import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-stone-900 text-stone-50 hover:bg-stone-900/80 dark:bg-stone-50 dark:text-stone-900",
        secondary:
          "border-transparent bg-stone-100 text-stone-900 hover:bg-stone-100/80",
        accent:
          "border-transparent bg-amber-600 text-white hover:bg-amber-700",
        green:
          "border-transparent bg-emerald-700 text-white hover:bg-emerald-800",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "text-stone-950 border-stone-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export default Badge;
