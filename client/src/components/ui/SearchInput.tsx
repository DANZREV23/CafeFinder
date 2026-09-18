import * as React from "react";
import { Search, X, Loader2, MapPin, Coffee, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchService, SearchSuggestion } from "@/services/searchService";
import { useNavigate } from "react-router-dom";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
  onSearch?: (value: string) => void;
  isLoading?: boolean;
  showSuggestions?: boolean;
  suggestionType?: 'cafe' | 'city' | 'amenity' | 'all';
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, onSearch, isLoading: externalLoading, value, defaultValue, showSuggestions = true, suggestionType = 'all', onSuggestionSelect, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState(defaultValue || value || "");
    const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = React.useState(false);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const abortControllerRef = React.useRef<AbortController | null>(null);

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

    // Handle clicks outside dropdown
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setShowDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounced fetch suggestions
    React.useEffect(() => {
      if (!showSuggestions || inputValue.toString().length < 2) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      const timer = setTimeout(async () => {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setIsSuggestionsLoading(true);

        try {
          const response = await searchService.getSuggestions(
            inputValue.toString(), 
            8, 
            abortControllerRef.current.signal
          );
          
          if (response.success) {
            let filtered = response.data.suggestions;
            if (suggestionType !== 'all') {
              filtered = filtered.filter(s => s.type === suggestionType);
            }
            setSuggestions(filtered);
            setShowDropdown(filtered.length > 0);
            setActiveIndex(-1);
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Failed to fetch suggestions:', error);
          }
        } finally {
          setIsSuggestionsLoading(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [inputValue, showSuggestions]);

    const handleSearch = () => {
      setShowDropdown(false);
      if (onSearch) {
        onSearch(inputValue.toString());
      }
    };

    const selectSuggestion = (suggestion: SearchSuggestion) => {
      setShowDropdown(false);
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
        return;
      }

      // Default behavior
      if (suggestion.type === 'cafe' && suggestion.slug) {
        navigate(`/cafes/${suggestion.slug}`);
      } else if (suggestion.type === 'city') {
        navigate(`/explore?city=${encodeURIComponent(suggestion.label)}`);
      } else if (suggestion.type === 'amenity' && suggestion.slug) {
        navigate(`/explore?amenities=${suggestion.slug}`);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (showDropdown && suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Enter") {
          if (activeIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
          } else {
            handleSearch();
          }
        } else if (e.key === "Escape") {
          setShowDropdown(false);
        }
      } else if (e.key === "Enter") {
        handleSearch();
      }

      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    const handleClear = () => {
      setInputValue("");
      setSuggestions([]);
      setShowDropdown(false);
      if (onClear) onClear();
    };

    const highlightMatch = (text: string, query: string) => {
      if (!query) return text;
      const parts = text.split(new RegExp(`(${query})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) => 
            part.toLowerCase() === query.toLowerCase() 
              ? <span key={i} className="font-black text-brand-black">{part}</span> 
              : <span key={i}>{part}</span>
          )}
        </span>
      );
    };

    const getIcon = (type: string) => {
      switch (type) {
        case 'cafe': return <Coffee className="h-4 w-4" />;
        case 'city': return <MapPin className="h-4 w-4" />;
        case 'amenity': return <Zap className="h-4 w-4" />;
        default: return <Search className="h-4 w-4" />;
      }
    };

    return (
      <div className={cn("relative flex flex-col w-full group", className)} ref={dropdownRef}>
        <div className="relative flex items-center w-full">
          <Search className="absolute left-4 h-5 w-5 text-brand-muted group-focus-within:text-brand-coffee transition-colors" />
          <input
            {...props}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (props.onChange) props.onChange(e);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onKeyDown={handleKeyDown}
            ref={ref}
            className={cn(
              "flex h-12 md:h-14 w-full rounded-2xl border border-brand-border bg-white pl-12 pr-24 py-3 text-base transition-all focus:border-brand-coffee focus:ring-4 focus:ring-brand-coffee/5 focus:outline-hidden font-sans placeholder:text-brand-muted shadow-sm hover:border-brand-border/80",
              className
            )}
            role="combobox"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-autocomplete="list"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {inputValue && onClear && !externalLoading && !isSuggestionsLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-full p-2 hover:bg-brand-cream text-brand-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {(externalLoading || isSuggestionsLoading) ? (
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

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-brand-border shadow-xl z-50 overflow-hidden"
            role="listbox"
          >
            <ul className="py-2 max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={`${suggestion.type}-${suggestion.id || suggestion.label}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={cn(
                    "px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors",
                    index === activeIndex ? "bg-brand-cream text-brand-coffee" : "hover:bg-brand-background text-brand-black"
                  )}
                  onClick={() => selectSuggestion(suggestion)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    index === activeIndex ? "bg-white text-brand-coffee" : "bg-brand-background text-brand-muted"
                  )}>
                    {getIcon(suggestion.type)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">
                      {highlightMatch(suggestion.label, inputValue.toString())}
                    </span>
                    <span className="text-xs text-brand-muted truncate uppercase tracking-wider font-bold">
                      {suggestion.subtitle}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
