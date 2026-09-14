import * as React from "react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CafePhoto } from "@/types";
import { cn } from "@/lib/utils";

interface CafeGalleryProps {
  photos: CafePhoto[];
  cafeName: string;
}

export const CafeGallery: React.FC<CafeGalleryProps> = ({ photos, cafeName }) => {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedImageIndex(index);
  const closeLightbox = () => setSelectedImageIndex(null);

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex + 1) % photos.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedImageIndex === null) return;
    setSelectedImageIndex((selectedImageIndex - 1 + photos.length) % photos.length);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex]);

  const displayPhotos = photos.slice(0, 4);
  const hasMore = photos.length > 4;

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-[2/1] bg-brand-cream/50 rounded-3xl flex items-center justify-center border-2 border-dashed border-brand-border">
        <p className="text-brand-muted font-medium italic">No photos available for this cafe</p>
      </div>
    );
  }

  return (
    <section className="relative group">
      {/* Grid Layout */}
      <div className={cn(
        "grid gap-4 h-[400px] md:h-[550px]",
        photos.length === 1 ? "grid-cols-1" : 
        photos.length === 2 ? "grid-cols-1 md:grid-cols-2" :
        "grid-cols-1 md:grid-cols-4"
      )}>
        {/* Main large image */}
        <div 
          className={cn(
            "relative overflow-hidden rounded-3xl cursor-pointer group/item",
            photos.length >= 3 ? "md:col-span-2" : "md:col-span-1"
          )}
          onClick={() => openLightbox(0)}
        >
          <img 
            src={displayPhotos[0].url} 
            alt={displayPhotos[0].altText || `${cafeName} cover`}
            loading="eager"
            className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-brand-charcoal/0 group-hover/item:bg-brand-charcoal/10 transition-colors duration-300" />
          <div className="absolute top-4 right-4 opacity-0 group-hover/item:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg">
            <Maximize2 className="w-5 h-5 text-brand-charcoal" />
          </div>
        </div>

        {/* Side images */}
        <div className="hidden md:grid grid-rows-2 gap-4 md:col-span-1">
          {displayPhotos.slice(1, 3).map((photo, i) => (
            <div 
              key={photo.id}
              className="relative overflow-hidden rounded-2xl cursor-pointer group/item"
              onClick={() => openLightbox(i + 1)}
            >
              <img 
                src={photo.url} 
                alt={photo.altText || `${cafeName} photo ${i + 2}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-brand-charcoal/0 group-hover/item:bg-brand-charcoal/10 transition-colors" />
            </div>
          ))}
        </div>

        {/* Last image or view all */}
        <div className="hidden md:block md:col-span-1 relative overflow-hidden rounded-2xl cursor-pointer group/item">
          {displayPhotos[3] && (
            <>
              <img 
                src={displayPhotos[3].url} 
                alt={displayPhotos[3].altText || `${cafeName} photo 4`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                referrerPolicy="no-referrer"
                onClick={() => openLightbox(3)}
              />
              <div 
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300",
                  hasMore ? "bg-brand-charcoal/40 group-hover/item:bg-brand-charcoal/50" : "bg-brand-charcoal/0 group-hover/item:bg-brand-charcoal/10"
                )}
                onClick={() => openLightbox(3)}
              >
                {hasMore && (
                  <div className="text-center text-white">
                    <span className="block text-2xl font-bold">+{photos.length - 4}</span>
                    <span className="text-sm font-medium uppercase tracking-wider">View All</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-charcoal/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 md:p-8"
            onClick={closeLightbox}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
              <div className="text-white">
                <span className="text-sm font-medium text-white/60 uppercase tracking-widest">{cafeName}</span>
                <p className="text-xs text-white/40">{selectedImageIndex + 1} of {photos.length}</p>
              </div>
              <button 
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={closeLightbox}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Image Container */}
            <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
              <button 
                className="absolute left-0 md:-left-16 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={prevImage}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <motion.img 
                key={selectedImageIndex}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={photos[selectedImageIndex].url}
                alt={photos[selectedImageIndex].altText || `Lightbox ${selectedImageIndex}`}
                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                referrerPolicy="no-referrer"
                onClick={(e) => e.stopPropagation()}
              />

              <button 
                className="absolute right-0 md:-right-16 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={nextImage}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Footer / Caption */}
            {photos[selectedImageIndex].caption && (
              <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                <p className="text-white/80 text-sm font-medium">{photos[selectedImageIndex].caption}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
