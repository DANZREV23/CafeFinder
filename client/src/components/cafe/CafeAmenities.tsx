import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { 
  Wifi, 
  Plug, 
  Dog, 
  Trees, 
  Wind, 
  Car, 
  Volume2, 
  VolumeX, 
  Coffee, 
  BookOpen,
  Leaf
} from "lucide-react";

const amenityIconMap: Record<string, any> = {
  wifi: Wifi,
  power: Plug,
  pet: Dog,
  outdoor: Trees,
  ac: Wind,
  parking: Car,
  quiet: VolumeX,
  noisy: Volume2,
  specialty: Coffee,
  study: BookOpen,
  vegan: Leaf
};

interface Amenity {
  id: number | string;
  name: string;
  label: string;
}

interface CafeAmenitiesProps {
  amenities: Amenity[];
  max?: number;
  className?: string;
}

export function CafeAmenities({ amenities, max = 3, className }: CafeAmenitiesProps) {
  if (!amenities || amenities.length === 0) return null;

  const displayAmenities = amenities.slice(0, max);
  const remainingCount = amenities.length - max;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {displayAmenities.map((amenity) => {
        const Icon = amenityIconMap[amenity.name.toLowerCase()];
        return (
          <Badge key={amenity.id} variant="secondary" className="flex items-center gap-1 font-normal py-0 px-2 h-6">
            {Icon && <Icon className="h-3 w-3" />}
            {amenity.label}
          </Badge>
        );
      })}
      {remainingCount > 0 && (
        <Badge variant="outline" className="font-normal py-0 px-2 h-6">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
