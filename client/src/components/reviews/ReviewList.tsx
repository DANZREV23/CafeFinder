import React from 'react';
import { Review } from '@/services/reviewService';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface ReviewListProps {
  reviews: Review[];
  total: number;
  isLoading?: boolean;
  onLoadMore?: () => void;
  myReview?: Review | null;
  onEditReview?: (review: Review) => void;
  onDeleteReview?: (reviewId: string) => void;
}

export const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  total,
  isLoading = false,
  onLoadMore,
  myReview,
  onEditReview,
  onDeleteReview,
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
            onEdit={onEditReview}
            onDelete={onDeleteReview}
          />
          <div className="h-px bg-brand-border" />
        </div>
      )}

      {/* Public Reviews */}
      <div className="space-y-6">
        <h3 className="text-xl font-serif font-bold text-brand-charcoal">
          {myReview ? 'Other Reviews' : 'Customer Reviews'}
        </h3>
        
        {reviews.length === 0 && !myReview ? (
          <div className="text-center py-12 bg-white border border-dashed border-brand-border rounded-3xl">
            <p className="text-brand-muted">No reviews yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button 
              variant="outline" 
              onClick={onLoadMore} 
              disabled={isLoading}
              className="min-w-[150px]"
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
