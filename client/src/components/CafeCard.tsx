import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Clock, Heart, DollarSign } from 'lucide-react';
import { Cafe } from '../types/index.js';

interface CafeCardProps {
  cafe: Cafe;
  key?: React.Key;
}

export default function CafeCard({ cafe }: CafeCardProps) {
  const coverPhoto = cafe.photos?.find(p => p.isCover)?.url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80';

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-amber-200 hover:shadow-xl hover:shadow-amber-900/5 transition-all duration-300 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={coverPhoto}
          alt={cafe.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 right-4">
          <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full text-stone-400 hover:text-rose-500 transition-colors shadow-sm">
            <Heart className="h-5 w-5" />
          </button>
        </div>
        {cafe.featured && (
          <div className="absolute top-4 left-4 bg-amber-800 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
            Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/cafes/${cafe.slug}`} className="hover:text-amber-800 transition-colors">
            <h3 className="text-lg font-bold text-stone-900 leading-tight">{cafe.name}</h3>
          </Link>
          <div className="flex items-center space-x-1 bg-stone-50 px-2 py-1 rounded-lg">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-bold text-stone-900">{cafe.ratingAverage}</span>
          </div>
        </div>

        <div className="flex items-center text-stone-500 text-sm mb-4">
          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
          <span className="truncate">{cafe.city}, {cafe.state}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 mt-auto">
          {cafe.amenities?.slice(0, 3).map((ca) => (
            <span key={ca.amenityId} className="text-[10px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {ca.amenity.label}
            </span>
          ))}
          {(cafe.amenities?.length || 0) > 3 && (
            <span className="text-[10px] font-medium text-stone-400 px-1 py-0.5">
              +{(cafe.amenities?.length || 0) - 3} more
            </span>
          )}
        </div>

        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center text-xs font-semibold text-stone-400 uppercase tracking-wider">
            <span className="flex">
              {[...Array(4)].map((_, i) => (
                <DollarSign key={i} className={`h-3 w-3 ${i < cafe.priceRange ? 'text-stone-900' : 'text-stone-200'}`} />
              ))}
            </span>
          </div>
          <div className="flex items-center text-xs font-bold text-emerald-600 uppercase tracking-widest">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Open Now
          </div>
        </div>
      </div>
    </div>
  );
}
