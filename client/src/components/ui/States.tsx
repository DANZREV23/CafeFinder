import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Coffee, AlertCircle, SearchX } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ 
  title = "No cafes found", 
  description = "Try changing your search or filters to find what you're looking for.", 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center px-4", className)}>
      <div className="bg-brand-cream p-6 rounded-full mb-6">
        <SearchX className="h-10 w-10 text-brand-muted" />
      </div>
      <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-2">{title}</h3>
      <p className="text-brand-muted max-w-sm mb-8">{description}</p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "We couldn't load the cafes at this moment. Please try again later.", 
  onRetry, 
  className 
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 text-center px-4", className)}>
      <div className="bg-brand-error/10 p-6 rounded-full mb-6 text-brand-error">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-2">{title}</h3>
      <p className="text-brand-muted max-w-sm mb-8">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Try Again
        </Button>
      )}
    </div>
  );
}
