import React from 'react';
import { Review } from '@/services/reviewService';
import { StarRating } from './StarRating';
import { format } from 'date-fns';
import { Edit2, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ReviewCardProps {
  review: Review;
  isOwner?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  const {
    reviewer,
    overallRating,
    coffeeRating,
    ambianceRating,
    serviceRating,
    comment,
    photos,
    status,
    createdAt,
  } = review;

  const statusConfig = {
    PENDING: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-700' },
    APPROVED: { label: 'Published', icon: CheckCircle2, className: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-red-100 text-red-700' },
    HIDDEN: { label: 'Hidden', icon: XCircle, className: 'bg-gray-100 text-gray-700' },
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="p-6 bg-white border border-brand-border rounded-3xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={reviewer.avatarUrl || 'https://via.placeholder.com/40'} 
            alt={reviewer.name}
            className="w-10 h-10 rounded-full object-cover border border-brand-border"
          />
          <div>
            <div className="font-bold text-brand-charcoal">{reviewer.name}</div>
            <div className="text-xs text-brand-muted">{format(new Date(createdAt), 'MMM dd, yyyy')}</div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Badge className={currentStatus.className}>
              <currentStatus.icon className="w-3 h-3 mr-1" />
              {currentStatus.label}
            </Badge>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit?.(review)}
                className="w-8 h-8 rounded-full"
              >
                <Edit2 className="w-4 h-4 text-brand-muted" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete?.(review.id)}
                className="w-8 h-8 rounded-full hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4 text-brand-muted" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-4 mb-2">
          <StarRating rating={overallRating} readonly size="sm" />
          <div className="flex gap-3 text-[10px] uppercase tracking-wider font-bold text-brand-muted">
            <span>Coffee: {coffeeRating}</span>
            <span>Vibe: {ambianceRating}</span>
            <span>Service: {serviceRating}</span>
          </div>
        </div>
        {comment && (
          <p className="text-brand-charcoal text-sm leading-relaxed whitespace-pre-wrap italic">
            "{comment}"
          </p>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {photos.map((photo) => (
            <img 
              key={photo.id}
              src={photo.url} 
              alt="Review photo"
              className="w-20 h-20 rounded-xl object-cover border border-brand-border flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(photo.url, '_blank')}
            />
          ))}
        </div>
      )}
    </div>
  );
};
