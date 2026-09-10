import * as React from "react";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSearch() {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-2 md:p-3 rounded-2xl md:rounded-full shadow-2xl shadow-brand-coffee/10 border border-brand-border flex flex-col md:flex-row items-center gap-2">
      <div className="w-full md:flex-1 relative">
        <SearchInput 
          placeholder="Search by cafe, coffee, or vibe..." 
          className="border-none focus:ring-0 h-12 md:h-14 bg-transparent"
        />
      </div>
      
      <div className="hidden md:block w-px h-8 bg-brand-border mx-2" />
      
      <div className="w-full md:w-auto relative flex items-center px-4 py-2 md:py-0 border-t md:border-t-0 border-brand-border md:border-l-0">
        <MapPin className="h-5 w-5 text-brand-muted mr-2 shrink-0" />
        <input 
          type="text" 
          placeholder="Near me" 
          className="w-full md:w-40 bg-transparent border-none focus:outline-hidden text-sm font-medium placeholder:text-brand-muted"
        />
      </div>
      
      <Button size="lg" className="w-full md:w-auto rounded-xl md:rounded-full h-12 md:h-14 px-8">
        Find Cafes
      </Button>
    </div>
  );
}
