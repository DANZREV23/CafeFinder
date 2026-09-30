import * as React from "react";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useI18n } from "@/i18n";

interface CafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait" | "wide" | "auto";
  fallback?: string;
}

export const CafeImage: React.FC<CafeImageProps> = ({ 
  src, 
  alt, 
  className, 
  aspectRatio = "video",
  fallback = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
  ...props 
}) => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const aspectRatios = {
    video: "aspect-video",
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    wide: "aspect-[21/9]",
    auto: "aspect-auto",
  };

  const finalAlt = alt ? t("accessibility.imageAlt", { name: alt }) : "Cafe image";

  return (
    <div className={cn("relative overflow-hidden bg-brand-cream/50", aspectRatios[aspectRatio], className)}>
      {isLoading && <Skeleton className="absolute inset-0 h-full w-full rounded-none" aria-hidden="true" />}
      
      {!error ? (
        <img
          src={src || fallback}
          alt={finalAlt}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-all duration-300",
            isLoading ? "scale-105 opacity-0" : "scale-100 opacity-100",
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
          {...props}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-muted">
          <ImageIcon className="h-8 w-8 opacity-20" aria-hidden="true" />
          <span className="text-xs">{t("common.noResults")}</span>
        </div>
      )}
    </div>
  );
}
