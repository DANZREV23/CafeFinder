import * as React from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";

export function HeroSearch() {
  const { t } = useI18n();
  const [search, setSearch] = React.useState("");
  const [location, setLocation] = React.useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (location) params.append('city', location);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-2 md:p-3 rounded-2xl md:rounded-full shadow-2xl shadow-brand-coffee/10 border border-brand-border flex flex-col md:flex-row items-center gap-2" role="search" aria-label={t("accessibility.searchLabel")}>
      <div className="w-full md:flex-1 relative">
        <SearchInput 
          placeholder="Search by cafe, coffee, or vibe..." 
          className="border-none shadow-none focus:ring-0 h-12 md:h-14 bg-transparent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={handleSearch}
          suggestionType="all"
        />
      </div>
      
      <div className="hidden md:block w-px h-8 bg-brand-border mx-2" aria-hidden="true" />
      
      <div className="w-full md:flex-1 relative">
        <SearchInput 
          placeholder="Near me (City)" 
          className="border-none shadow-none focus:ring-0 h-12 md:h-14 bg-transparent"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          onSearch={handleSearch}
          suggestionType="city"
          onSuggestionSelect={(s) => {
            setLocation(s.label);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('city', s.label);
            navigate(`/explore?${params.toString()}`);
          }}
        />
      </div>
      
      <Button 
        size="lg" 
        className="w-full md:w-auto rounded-xl md:rounded-full h-12 md:h-14 px-8 bg-brand-coffee hover:bg-brand-coffee/90"
        onClick={handleSearch}
      >
        {t("common.search")}
        <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
