import React from 'react';
import { ReviewStats } from '@/services/reviewService';
import { StarRating } from './StarRating';
import { Progress } from '@/components/ui/Progress';

interface ReviewSummaryProps {
  stats: ReviewStats;
}

export const ReviewSummary: React.FC<ReviewSummaryProps> = ({ stats }) => {
  const {
    ratingAverage,
    reviewCount,
    coffeeAverage,
    ambianceAverage,
    serviceAverage,
    distribution,
  } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-white border border-brand-border rounded-3xl">
      {/* Overall Score */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-5xl font-serif font-bold text-brand-charcoal mb-2">
          {ratingAverage.toFixed(1)}
        </div>
        <StarRating rating={Math.round(ratingAverage)} readonly size="md" className="mb-2" />
        <div className="text-brand-muted text-sm">
          Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
        </div>
      </div>

      {/* Star Distribution */}
      <div className="flex flex-col gap-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = distribution[star] || 0;
          const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-3">
              <span className="text-sm font-medium text-brand-charcoal w-12">{star} stars</span>
              <Progress value={percentage} className="h-2 flex-1" />
              <span className="text-xs text-brand-muted w-8">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Category Averages */}
      <div className="flex flex-col justify-center gap-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-brand-charcoal">Coffee Quality</span>
            <span className="text-brand-muted">{coffeeAverage.toFixed(1)}</span>
          </div>
          <StarRating rating={Math.round(coffeeAverage)} readonly size="sm" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-brand-charcoal">Ambiance</span>
            <span className="text-brand-muted">{ambianceAverage.toFixed(1)}</span>
          </div>
          <StarRating rating={Math.round(ambianceAverage)} readonly size="sm" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-brand-charcoal">Service</span>
            <span className="text-brand-muted">{serviceAverage.toFixed(1)}</span>
          </div>
          <StarRating rating={Math.round(serviceAverage)} readonly size="sm" />
        </div>
      </div>
    </div>
  );
};
