import React from 'react';
import { Review, ReviewFilterParams, ReviewResponse } from '@/services/reviewService';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/Button';
import { Loader2, Search, SlidersHorizontal, Image, Star } from 'lucide-react';

interface ReviewListProps {
  reviews: Review[];
  total: number;
  isLoading?: boolean;
  onLoadMore?: () => void;
  myReview?: Review | null;
  filters?: ReviewFilterParams;
  onFilterChange?: (filters: Partial<ReviewFilterParams>) => void;
  onEditReview?: (review: Review) => void;
  onDeleteReview?: (reviewId: string) => void;
  onHelpfulToggle?: (reviewId: string) => void;
  onReport?: (review: Review) => void;
  isCafeOwner?: boolean;
  cafeName?: string;
  onRespond?: (review: Review) => void;
  onEditResponse?: (response: ReviewResponse) => void;
  onDeleteResponse?: (responseId: string) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  total,
  isLoading = false,
  onLoadMore,
  myReview,
  filters = {},
  onFilterChange,
  onEditReview,
  onDeleteReview,
  onHelpfulToggle,
  onReport,
  isCafeOwner = false,
  cafeName,
  onRespond,
  onEditResponse,
  onDeleteResponse,
}) => {
  const hasMore = reviews.length < total;

  return (
    <div className="space-y-8">
      {/* My Review Section */}
      {myReview && (
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-bold text-brand-charcoal">Your Review</h3>
          <ReviewCard 
            review={myReview} 
            isOwner={true} 
            cafeName={cafeName}
            onEdit={onEditReview}
            onDelete={onDeleteReview}
          />
          <div className="h-px bg-brand-border" />
        </div>
      )}

      {/* Filter and Sort Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-serif font-bold text-brand-charcoal">
            {myReview ? 'Other Customer Reviews' : 'Customer Reviews'}
            <span className="text-sm font-sans font-normal text-brand-muted ml-2">
              ({total} {total === 1 ? 'review' : 'reviews'})
            </span>
          </h3>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-stone-500 tracking-wider">Sort:</span>
            <select
              value={filters.sort || 'newest'}
              onChange={(e) => onFilterChange?.({ sort: e.target.value as any, page: 1 })}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-brand-border bg-white text-brand-charcoal focus:ring-2 focus:ring-brand-coffee outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="most_helpful">Most Helpful</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
          {/* Star rating filters */}
          <button
            type="button"
            onClick={() => onFilterChange?.({ rating: undefined, page: 1 })}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              !filters.rating
                ? 'bg-brand-coffee text-white shadow-2xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => onFilterChange?.({ rating: filters.rating === stars ? undefined : stars, page: 1 })}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                filters.rating === stars
                  ? 'bg-brand-coffee text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{stars}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </button>
          ))}

          {/* Has Photos Filter */}
          <button
            type="button"
            onClick={() => onFilterChange?.({ hasPhotos: !filters.hasPhotos, page: 1 })}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ml-auto ${
              filters.hasPhotos
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>With Photos</span>
          </button>
        </div>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-brand-border rounded-3xl space-y-2">
            <p className="text-brand-charcoal font-semibold">No reviews found matching criteria</p>
            <p className="text-xs text-brand-muted">
              {filters.rating || filters.hasPhotos || filters.search
                ? 'Try adjusting your filters to see more community reviews.'
                : 'Be the first coffee lover to share your experience!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isOwner={review.reviewer.id === myReview?.reviewer.id}
                isCafeOwner={isCafeOwner}
                cafeName={cafeName}
                onHelpfulToggle={onHelpfulToggle}
                onReport={onReport}
                onRespond={onRespond}
                onEditResponse={onEditResponse}
                onDeleteResponse={onDeleteResponse}
                onEdit={onEditReview}
                onDelete={onDeleteReview}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={onLoadMore} 
              disabled={isLoading}
              className="min-w-[160px] rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Load More Reviews
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
