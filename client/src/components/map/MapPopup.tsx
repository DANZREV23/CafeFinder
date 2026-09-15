import * as React from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Navigation, ExternalLink, ShieldCheck, X } from "lucide-react";
import { Cafe } from "@/types";
import { CafePrice } from "@/components/cafe/CafePrice";
import { getDirectionsUrl } from "@/services/mapService";
import { Button } from "@/components/ui/Button";

interface MapPopupProps {
  cafe: Cafe;
  onClose: () => void;
}

export const MapPopup: React.FC<MapPopupProps> = ({ cafe, onClose }) => {
  const directionsUrl = getDirectionsUrl(
    Number(cafe.latitude), 
    Number(cafe.longitude), 
    cafe.name
  );

  const coverPhoto = cafe.photos?.find(p => p.isCover)?.url || cafe.photos?.[0]?.url;

  return (
    <div className="w-[280px] bg-white rounded-2xl overflow-hidden shadow-2xl border border-brand-border animate-in fade-in zoom-in duration-200">
      <div className="relative h-32">
        <img 
          src={coverPhoto} 
          alt={cafe.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-brand-charcoal hover:bg-white transition-colors shadow-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {cafe.verified && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg flex items-center gap-1 shadow-md">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Verified</span>
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif font-bold text-brand-charcoal truncate flex-1">{cafe.name}</h3>
            <CafePrice priceRange={cafe.priceRange} className="text-[10px] shrink-0" />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 fill-brand-accent-warm text-brand-accent-warm" />
            <span className="text-xs font-bold text-brand-charcoal">{Number(cafe.ratingAverage).toFixed(1)}</span>
            <span className="text-[10px] text-brand-muted font-medium">({cafe.reviewCount})</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-brand-muted font-medium">
          <MapPin className="w-3 h-3 text-brand-coffee shrink-0" />
          <span className="truncate">{cafe.city}, {cafe.state}</span>
        </div>

        {cafe.shortDescription && (
          <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed italic">
            "{cafe.shortDescription}"
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button 
            asChild
            variant="outline" 
            size="sm"
            className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-xl border-brand-border hover:bg-brand-background"
          >
            <Link to={`/cafes/${cafe.slug}`}>
              <ExternalLink className="w-3 h-3 mr-1" />
              View Detail
            </Link>
          </Button>
          <Button 
            asChild
            variant="primary" 
            size="sm"
            className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md"
          >
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="w-3 h-3 mr-1" />
              Directions
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};
