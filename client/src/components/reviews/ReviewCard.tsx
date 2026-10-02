import React, { useState } from 'react';
import { Review, ReviewResponse } from '@/services/reviewService';
import { StarRating } from './StarRating';
import { format } from 'date-fns';
import { Edit2, Trash2, Clock, CheckCircle2, XCircle, ThumbsUp, Flag, MessageSquare, CornerDownRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PhotoLightbox } from './PhotoLightbox';
import { Link } from 'react-router-dom';

interface ReviewCardProps {
  review: Review;
  isOwner?: boolean;
  isCafeOwner?: boolean;
  cafeName?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onHelpfulToggle?: (reviewId: string) => void;
  onReport?: (review: Review) => void;
  onRespond?: (review: Review) => void;
  onEditResponse?: (response: ReviewResponse) => void;
  onDeleteResponse?: (responseId: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isOwner = false,
  isCafeOwner = false,
  cafeName,
  onEdit,
  onDelete,
  onHelpfulToggle,
  onReport,
  onRespond,
  onEditResponse,
  onDeleteResponse,
}) => {
  const {
    id,
    reviewer,
    overallRating,
    coffeeRating,
    ambianceRating,
    serviceRating,
    comment,
    photos,
    status,
    helpfulCount,
    isHelpful,
    response,
    createdAt,
  } = review;

  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);

  const statusConfig = {
    PENDING: { label: 'Pending Moderation', icon: Clock, className: 'bg-amber-100 text-amber-800 border-amber-200' },
    APPROVED: { label: 'Published', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    REJECTED: { label: 'Rejected', icon: XCircle, className: 'bg-rose-100 text-rose-800 border-rose-200' },
    HIDDEN: { label: 'Hidden', icon: XCircle, className: 'bg-stone-100 text-stone-700 border-stone-200' },
    REMOVED: { label: 'Removed', icon: XCircle, className: 'bg-red-100 text-red-800 border-red-200' },
  };

  const currentStatus = statusConfig[status] || statusConfig.PENDING;

  const lightboxPhotos = photos.map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption || `Photo by ${reviewer.name}`,
  }));

  return (
    <div className="p-6 bg-white border border-brand-border rounded-3xl shadow-xs space-y-4 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Link
            to={`/users/${reviewer.id}`}
            className="group block shrink-0"
            title={`View ${reviewer.name}'s profile`}
          >
            <img
              src={reviewer.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'}
              alt={reviewer.name}
              className="w-10 h-10 rounded-full object-cover border border-brand-border group-hover:ring-2 group-hover:ring-brand-coffee transition-all"
            />
          </Link>
          <div>
            <Link
              to={`/users/${reviewer.id}`}
              className="font-bold text-brand-charcoal text-sm hover:text-brand-coffee transition-colors block"
            >
              {reviewer.name}
            </Link>
            <div className="text-xs text-brand-muted">
              {format(new Date(createdAt), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Badge className={currentStatus.className}>
              <currentStatus.icon className="w-3 h-3 mr-1" />
              {currentStatus.label}
            </Badge>
          )}

          {isOwner ? (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit?.(review)}
                className="w-8 h-8 rounded-full"
                title="Edit review"
                aria-label="Edit review"
              >
                <Edit2 className="w-4 h-4 text-brand-muted" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete?.(id)}
                className="w-8 h-8 rounded-full hover:bg-red-50 hover:text-red-600"
                title="Delete review"
                aria-label="Delete review"
              >
                <Trash2 className="w-4 h-4 text-brand-muted" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onReport?.(review)}
              className="w-8 h-8 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50"
              title="Report this review"
              aria-label="Report this review"
            >
              <Flag className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Ratings & Comment */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <StarRating rating={overallRating} readonly size="sm" />
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-brand-muted uppercase tracking-wider">
            {coffeeRating > 0 && <span className="bg-stone-50 px-2 py-0.5 rounded border border-stone-200/60">Coffee: {coffeeRating}★</span>}
            {ambianceRating > 0 && <span className="bg-stone-50 px-2 py-0.5 rounded border border-stone-200/60">Vibe: {ambianceRating}★</span>}
            {serviceRating > 0 && <span className="bg-stone-50 px-2 py-0.5 rounded border border-stone-200/60">Service: {serviceRating}★</span>}
          </div>
        </div>

        {comment && (
          <p className="text-brand-charcoal text-sm leading-relaxed whitespace-pre-wrap">
            "{comment}"
          </p>
        )}
      </div>

      {/* Review Photos */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide pt-1">
          {photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setActivePhotoIndex(index)}
              className="w-20 h-20 rounded-xl overflow-hidden border border-brand-border shrink-0 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-coffee transition-all"
            >
              <img
                src={photo.url}
                alt={photo.caption || 'Review photo'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Bottom Action Bar: Helpful reaction + Owner reply action */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-brand-muted">
        <div className="flex items-center gap-3">
          {/* Helpful reaction button */}
          <button
            type="button"
            onClick={() => onHelpfulToggle?.(id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
              isHelpful
                ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 shadow-2xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-transparent'
            }`}
            aria-pressed={isHelpful}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${isHelpful ? 'fill-current text-amber-800' : ''}`} />
            <span>
              {helpfulCount > 0
                ? `${helpfulCount} found helpful`
                : 'Helpful'}
            </span>
          </button>
        </div>

        {/* Cafe Owner reply trigger */}
        {isCafeOwner && !response && onRespond && (
          <button
            type="button"
            onClick={() => onRespond(review)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-coffee hover:text-brand-coffee-dark hover:underline"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Respond as Owner</span>
          </button>
        )}
      </div>

      {/* Owner Response Box (Part 22) */}
      {response && (
        <div className="mt-3 p-4 bg-brand-cream/40 border border-brand-coffee/15 rounded-2xl space-y-2 relative">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-brand-coffee font-bold">
              <CornerDownRight className="w-4 h-4 text-brand-coffee shrink-0" />
              <span>Response from {cafeName || response.ownerName || 'Cafe Owner'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-stone-500">
                {format(new Date(response.createdAt), 'MMM dd, yyyy')}
              </span>
              {isCafeOwner && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditResponse?.(response)}
                    className="p-1 text-stone-500 hover:text-brand-coffee"
                    title="Edit response"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteResponse?.(response.id)}
                    className="p-1 text-stone-500 hover:text-red-600"
                    title="Delete response"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-stone-800 leading-relaxed pl-6 whitespace-pre-wrap">
            {response.content}
          </p>
        </div>
      )}

      {/* Lightbox for review photos */}
      <PhotoLightbox
        isOpen={activePhotoIndex !== null}
        onClose={() => setActivePhotoIndex(null)}
        photos={lightboxPhotos}
        initialIndex={activePhotoIndex || 0}
      />
    </div>
  );
};
