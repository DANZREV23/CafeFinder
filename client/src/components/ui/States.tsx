import * as React from "react";
import { AlertCircle, FileQuestion, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No results found",
  description = "Try adjusting your filters or search criteria.",
  icon,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500 mb-4">
        {icon || <FileQuestion className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-stone-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an issue loading this data. Please try again.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-5">
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
