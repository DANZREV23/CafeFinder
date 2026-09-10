import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface CafeLocationProps {
  location: string;
  distance?: string | number;
  className?: string;
}

export function CafeLocation({ location, distance, className }: CafeLocationProps) {
  return (
    <div className={cn("flex items-center gap-1 text-brand-muted truncate", className)}>
      <MapPin className="h-3.5 w-3.5 shrink-0" />
      <span className="text-xs truncate">{location}</span>
      {distance && (
        <>
          <span className="mx-0.5">•</span>
          <span className="text-xs">{distance} km</span>
        </>
      )}
    </div>
  );
}
