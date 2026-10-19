import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoItem {
  url: string;
  caption?: string | null;
  alt?: string;
  [key: string]: any;
}

interface PhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  photos: (PhotoItem | string)[];
  initialIndex?: number;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photos.length]);

  if (!isOpen || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];
  const url = typeof currentPhoto === 'string' ? currentPhoto : currentPhoto?.url;
  const caption = typeof currentPhoto === 'string' ? '' : currentPhoto?.caption || currentPhoto?.alt;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 z-50 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 z-50 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next photo"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      <div
        className="relative max-w-5xl max-h-[85vh] p-4 flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={caption || `Photo ${currentIndex + 1}`}
          className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
        {caption && (
          <p className="mt-3 text-sm text-stone-300 text-center max-w-xl">
            {caption}
          </p>
        )}
        {photos.length > 1 && (
          <span className="mt-2 text-xs text-stone-400">
            {currentIndex + 1} of {photos.length}
          </span>
        )}
      </div>
    </div>
  );
};
