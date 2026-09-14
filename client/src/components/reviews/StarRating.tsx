import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  readonly = false,
  onChange,
  className,
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleMouseEnter = (index: number) => {
    if (!readonly) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index);
    }
  };

  return (
    <div 
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {[...Array(maxRating)].map((_, i) => {
        const starIndex = i + 1;
        const isActive = hoverRating ? starIndex <= hoverRating : starIndex <= rating;
        
        return (
          <button
            key={i}
            type="button"
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95",
              isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-transparent"
            )}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            aria-label={`${starIndex} star${starIndex > 1 ? 's' : ''}`}
            disabled={readonly}
          >
            <Star className={starSizes[size]} />
          </button>
        );
      })}
    </div>
  );
};
