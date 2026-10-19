import React, { useState } from 'react';
import { Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CafeImageProps {
  src?: string | null;
  alt: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  className?: string;
  loading?: 'lazy' | 'eager';
}

export const CafeImage: React.FC<CafeImageProps> = ({
  src,
  alt,
  aspectRatio = 'video',
  className,
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState(false);

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-[16/10]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'aspect-[21/9]';

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'w-full bg-stone-100 flex flex-col items-center justify-center text-stone-400 select-none overflow-hidden',
          aspectClass,
          className
        )}
      >
        <Coffee className="w-10 h-10 stroke-[1.5] text-stone-300 mb-1" />
        <span className="text-xs text-stone-400 font-medium">{alt}</span>
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-hidden bg-stone-100 relative', aspectClass, className)}>
      <img
        src={src}
        alt={alt}
        loading={loading}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default CafeImage;
