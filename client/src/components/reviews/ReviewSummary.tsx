import React from 'react';
import { ReviewStats } from '@/services/reviewService';
import { StarRating } from './StarRating';
import { Progress } from '@/components/ui/Progress';
import { Camera, Coffee, Sparkles, Smile } from 'lucide-react';

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
    photoCount = 0,
  } = stats;

  const hasCategoryRatings = coffeeAverage > 0 || ambianceAverage > 0 || serviceAverage > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-white border border-brand-border rounded-3xl">
      {/* Overall Score */}
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-5xl font-serif font-bold text-brand-charcoal mb-2">
          {ratingAverage.toFixed(1)}
        </div>
        <StarRating rating={Math.round(ratingAverage)} readonly size="md" className="mb-2" />
        <div className="text-brand-muted text-sm font-medium">
          Based on {reviewCount} {reviewCount === 1 ? 'approved review' : 'approved reviews'}
        </div>
        {photoCount > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-full text-xs font-semibold">
            <Camera className="w-3.5 h-3.5 text-amber-700" />
            <span>{photoCount} {photoCount === 1 ? 'visitor photo' : 'visitor photos'}</span>
          </div>
        )}
      </div>

      {/* Star Distribution */}
      <div className="flex flex-col justify-center gap-2">
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

      {/* Category Averages (Strictly data-driven: no invented averages) */}
      <div className="flex flex-col justify-center gap-4">
        {hasCategoryRatings ? (
          <>
            {coffeeAverage > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-brand-charcoal flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-brand-coffee" />
                    Coffee Quality
                  </span>
                  <span className="font-bold text-brand-charcoal">{coffeeAverage.toFixed(1)} / 5</span>
                </div>
                <StarRating rating={Math.round(coffeeAverage)} readonly size="sm" />
              </div>
            )}
            
            {ambianceAverage > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-brand-charcoal flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Ambiance
                  </span>
                  <span className="font-bold text-brand-charcoal">{ambianceAverage.toFixed(1)} / 5</span>
                </div>
                <StarRating rating={Math.round(ambianceAverage)} readonly size="sm" />
              </div>
            )}
            
            {serviceAverage > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-brand-charcoal flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-emerald-600" />
                    Service
                  </span>
                  <span className="font-bold text-brand-charcoal">{serviceAverage.toFixed(1)} / 5</span>
                </div>
                <StarRating rating={Math.round(serviceAverage)} readonly size="sm" />
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500">
            Specific category breakdowns (coffee, ambiance, service) will appear as visitors rate these aspects.
          </div>
        )}
      </div>
    </div>
  );
};
