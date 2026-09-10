import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
  centered?: boolean;
}

export function SectionHeading({ 
  title, 
  eyebrow, 
  description, 
  action, 
  className,
  centered = false
}: SectionHeadingProps) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 md:mb-12",
      centered && "text-center md:items-center",
      className
    )}>
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && (
          <span className="text-brand-accent-warm font-semibold text-xs tracking-widest uppercase mb-2 block">
            {eyebrow}
          </span>
        )}
        <h2 className="text-3xl md:text-4xl font-serif text-brand-charcoal mb-3">
          {title}
        </h2>
        {description && (
          <p className="text-brand-muted font-sans text-base md:text-lg">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link 
          to={action.href}
          className="group inline-flex items-center text-brand-coffee font-semibold text-sm hover:underline"
        >
          {action.label}
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
