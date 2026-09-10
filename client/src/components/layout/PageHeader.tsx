import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  className?: string;
  background?: "white" | "cream";
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs, 
  className,
  background = "white"
}: PageHeaderProps) {
  return (
    <div className={cn(
      "pt-12 pb-8 md:pt-16 md:pb-12",
      background === "cream" ? "bg-brand-cream" : "bg-white",
      className
    )}>
      <div className="container-custom">
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-xs text-brand-muted mb-6 overflow-x-auto no-scrollbar">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                <Link to={crumb.href} className="hover:text-brand-coffee transition-colors whitespace-nowrap">
                  {crumb.label}
                </Link>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-3 w-3 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-serif text-brand-charcoal mb-4">
            {title}
          </h1>
          {description && (
            <p className="text-lg md:text-xl text-brand-muted font-sans leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import * as React from "react";
