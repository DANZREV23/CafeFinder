import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  photos: { id: string; url: string; caption?: string | null }[];
  initialIndex?: number;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photos.length, onClose]);

  if (!photos.length || currentIndex < 0 || currentIndex >= photos.length) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 bg-stone-950/95 border-none text-white overflow-hidden shadow-2xl rounded-3xl">
        <div className="relative flex flex-col items-center justify-center min-h-[60vh] max-h-[85vh]">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            aria-label="Close photo preview"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Navigation left */}
          {photos.length > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          <div className="flex-1 flex items-center justify-center w-full p-4 overflow-hidden">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || `Cafe photo ${currentIndex + 1}`}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* Navigation right */}
          {photos.length > 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % photos.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Footer details */}
          <div className="w-full bg-stone-900/90 px-6 py-4 flex items-center justify-between border-t border-stone-800">
            <span className="text-xs text-stone-300 font-medium">
              {currentPhoto.caption || 'Community visitor photo'}
            </span>
            <span className="text-xs text-stone-400">
              {currentIndex + 1} of {photos.length}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
