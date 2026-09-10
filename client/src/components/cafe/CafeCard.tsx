import * as React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CafeImage } from "./CafeImage";
import { CafeRating } from "./CafeRating";
import { CafeLocation } from "./CafeLocation";
import { CafePrice } from "./CafePrice";
import { CafeAmenities } from "./CafeAmenities";
import { Cafe } from "@/types";

interface CafeCardProps {
  cafe: Cafe;
  className?: string;
  isFeatured?: boolean;
}

export const CafeCard: React.FC<CafeCardProps> = ({ cafe, className, isFeatured = false }) => {
  const [isFavorited, setIsFavorited] = React.useState(false);

  return (
    <Card 
      variant="interactive" 
      className={cn("group flex flex-col h-full bg-white", className)}
    >
      <div className="relative overflow-hidden">
        <Link to={`/cafes/${cafe.slug}`}>
          <CafeImage 
            src={cafe.photos?.find(p => p.isCover)?.url} 
            alt={cafe.name}
            aspectRatio="video"
            className="group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {cafe.featured && (
            <Badge variant="accent" className="shadow-sm uppercase tracking-wider px-2 py-0.5">
              Featured
            </Badge>
          )}
          {cafe.trending && (
            <Badge variant="green" className="shadow-sm uppercase tracking-wider px-2 py-0.5">
              Trending
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            setIsFavorited(!isFavorited);
          }}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm z-10",
            isFavorited 
              ? "bg-rose-500 text-white" 
              : "bg-white/80 text-brand-charcoal hover:bg-white hover:text-rose-500"
          )}
        >
          <Heart className={cn("h-4 w-4", isFavorited && "fill-current")} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/cafes/${cafe.slug}`} className="hover:text-brand-coffee transition-colors flex-grow">
            <h3 className="font-serif font-bold text-lg text-brand-charcoal leading-tight">
              {cafe.name}
            </h3>
          </Link>
          <CafeRating 
            rating={cafe.ratingAverage} 
            reviewCount={cafe.reviewCount} 
            className="shrink-0 ml-2" 
          />
        </div>

        <CafeLocation 
          location={`${cafe.city}, ${cafe.state}`} 
          className="mb-3" 
        />

        <div className="flex items-center gap-3 mb-4">
          <CafePrice priceRange={cafe.priceRange} />
          <span className="text-[10px] uppercase tracking-widest text-brand-muted font-bold">
            {cafe.coffeeType || "Specialty Coffee"}
          </span>
        </div>

        <div className="mt-auto pt-4 border-t border-brand-border flex flex-col gap-3">
          <CafeAmenities amenities={cafe.amenities?.map(a => a.amenity) || []} max={2} />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-success animate-pulse" />
              <span className="text-[10px] font-bold text-brand-success uppercase tracking-widest">
                Open Now
              </span>
            </div>
            {cafe.verified && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-brand-border/50 text-brand-muted font-medium">
                Verified
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
