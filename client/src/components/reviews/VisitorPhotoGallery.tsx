import React, { useState, useEffect } from 'react';
import reviewService from '@/services/reviewService';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';

interface VisitorPhotoGalleryProps {
  cafeId: string;
}

export const VisitorPhotoGallery: React.FC<VisitorPhotoGalleryProps> = ({ cafeId }) => {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const res = await reviewService.getVisitorPhotos(cafeId, 1, 16);
        if (res.success && res.data) {
          setPhotos(res.data);
        }
      } catch (err) {
        console.error('Failed to load visitor photos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [cafeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-brand-cream/20 rounded-3xl border border-brand-border">
        <Loader2 className="w-5 h-5 animate-spin text-brand-coffee" />
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  const lightboxPhotos = photos.map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption || (p.review?.user?.name ? `Shared by ${p.review.user.name}` : undefined),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-brand-coffee" />
          <h3 className="text-xl font-serif font-bold text-brand-charcoal">Photos from Visitors</h3>
        </div>
        <span className="text-xs font-semibold text-brand-muted bg-white px-3 py-1 rounded-full border border-brand-border">
          {photos.length} community {photos.length === 1 ? 'photo' : 'photos'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setActiveLightboxIndex(index)}
            className="group relative aspect-square rounded-2xl overflow-hidden border border-brand-border bg-stone-100 hover:shadow-md transition-all text-left focus:outline-none focus:ring-2 focus:ring-brand-coffee"
          >
            <img
              src={photo.url}
              alt={photo.caption || 'Visitor photo'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
              <span className="text-[11px] text-white font-medium truncate">
                {photo.review?.user?.name ? `By ${photo.review.user.name}` : 'Visitor Photo'}
              </span>
            </div>
          </button>
        ))}
      </div>

      <PhotoLightbox
        isOpen={activeLightboxIndex !== null}
        onClose={() => setActiveLightboxIndex(null)}
        photos={lightboxPhotos}
        initialIndex={activeLightboxIndex || 0}
      />
    </div>
  );
};
