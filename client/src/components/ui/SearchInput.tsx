import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  onSearch?: (value: string) => void;
  isLoading?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, onSearch, isLoading, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && onSearch) {
        onSearch(e.currentTarget.value);
      }
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    return (
      <div className={cn("relative flex items-center w-full", className)}>
        <Search className="absolute left-3 h-4 w-4 text-brand-muted" />
        <input
          {...props}
          onKeyDown={handleKeyDown}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-full border border-brand-border bg-white pl-10 pr-10 py-2 text-sm transition-all focus:border-brand-coffee focus:ring-2 focus:ring-brand-coffee/10 focus:outline-hidden font-sans placeholder:text-brand-muted",
            className
          )}
        />
        <div className="absolute right-3 flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-muted" />
          ) : props.value && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full p-1 hover:bg-brand-cream text-brand-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
