import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-brand-coffee focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-coffee text-white",
        secondary: "border-transparent bg-brand-cream text-brand-coffee",
        outline: "text-brand-muted border-brand-border",
        success: "border-transparent bg-brand-success text-white",
        warning: "border-transparent bg-brand-warning text-white",
        error: "border-transparent bg-brand-error text-white",
        accent: "border-transparent bg-brand-accent-warm text-white",
        green: "border-transparent bg-brand-accent-green text-white",
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

const Badge: React.FC<BadgeProps> = ({ className, variant, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
};

export { Badge, badgeVariants };
