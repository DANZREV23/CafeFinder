import * as React from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  onSearch?: (value: string) => void;
  isLoading?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, onSearch, isLoading, value, defaultValue, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(defaultValue || value || "");

    React.useEffect(() => {
      if (value !== undefined) {
        setInputValue(value === null ? "" : value);
      }
    }, [value]);

    React.useEffect(() => {
      if (defaultValue !== undefined) {
        setInputValue(defaultValue === null ? "" : defaultValue);
      }
    }, [defaultValue]);

    const handleSearch = () => {
      if (onSearch) {
        onSearch(inputValue.toString());
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    const handleClear = () => {
      setInputValue("");
      if (onClear) onClear();
    };

    return (
      <div className={cn("relative flex items-center w-full group", className)}>
        <Search className="absolute left-4 h-5 w-5 text-brand-muted group-focus-within:text-brand-coffee transition-colors" />
        <input
          {...props}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (props.onChange) props.onChange(e);
          }}
          onKeyDown={handleKeyDown}
          ref={ref}
          className={cn(
            "flex h-12 md:h-14 w-full rounded-2xl border border-brand-border bg-white pl-12 pr-24 py-3 text-base transition-all focus:border-brand-coffee focus:ring-4 focus:ring-brand-coffee/5 focus:outline-hidden font-sans placeholder:text-brand-muted shadow-sm hover:border-brand-border/80",
            className
          )}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {inputValue && onClear && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-2 hover:bg-brand-cream text-brand-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isLoading ? (
            <div className="p-2">
              <Loader2 className="h-5 w-5 animate-spin text-brand-coffee" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSearch}
              className="hidden md:flex h-10 px-4 items-center justify-center bg-brand-coffee text-white rounded-xl text-sm font-bold hover:bg-brand-coffee/90 transition-all shadow-md shadow-brand-coffee/10 ml-1"
            >
              Search
            </button>
          )}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
