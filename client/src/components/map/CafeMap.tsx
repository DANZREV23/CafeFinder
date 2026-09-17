import * as React from "react";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap as useGoogleMapInstance } from "@vis.gl/react-google-maps";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Cafe } from "@/types";
import { useMap, useMapLoad } from "./MapProvider";
import { MapPopup } from "./MapPopup";
import { Coffee, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CafeMapProps {
  cafes: Cafe[];
  selectedCafeId?: string | null;
  onCafeSelect?: (cafeId: string | null) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

const DEFAULT_CENTER = { lat: 14.5995, lng: 120.9842 }; // Manila
const DEFAULT_ZOOM = 13;

const mapStyles = [
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e9e9e9" }, { "lightness": 17 }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }, { "lightness": 20 }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#ffffff" }, { "lightness": 17 }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#ffffff" }, { "lightness": 29 }, { "weight": 0.2 }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }, { "lightness": 18 }]
  },
  {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }, { "lightness": 16 }]
  }
];

const MapHandler: React.FC<{ 
  validCafes: Cafe[]; 
  selectedCafeId?: string | null;
  onInfoWindowCafeChange: (cafe: Cafe | null) => void;
}> = ({ validCafes, selectedCafeId, onInfoWindowCafeChange }) => {
  const map = useGoogleMapInstance();

  // Sync info window and pan to selected cafe
  React.useEffect(() => {
    if (selectedCafeId && map) {
      const cafe = validCafes.find(c => c.id === selectedCafeId);
      if (cafe) {
        onInfoWindowCafeChange(cafe);
        map.panTo({ lat: Number(cafe.latitude), lng: Number(cafe.longitude) });
      }
    }
  }, [selectedCafeId, validCafes, map, onInfoWindowCafeChange]);

  // Fit bounds when cafes change
  React.useEffect(() => {
    if (map && validCafes.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validCafes.forEach(cafe => {
        bounds.extend({ lat: Number(cafe.latitude), lng: Number(cafe.longitude) });
      });
      
      if (validCafes.length === 1) {
        map.setCenter({ lat: Number(validCafes[0].latitude), lng: Number(validCafes[0].longitude) });
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
      }
    }
  }, [validCafes, map]);

  return null;
};

export const CafeMap: React.FC<CafeMapProps> = ({
  cafes,
  selectedCafeId,
  onCafeSelect,
  center,
  zoom,
  className
}) => {
  // Trigger dynamic map script loading only when this component is mounted
  useMapLoad();

  const { isLoaded, loadError, provider, apiKey } = useMap();
  const [infoWindowCafe, setInfoWindowCafe] = React.useState<Cafe | null>(null);

  // Filter cafes with valid coordinates
  const validCafes = React.useMemo(() => 
    cafes.filter(c => c.latitude !== null && c.longitude !== null),
  [cafes]);

  if (loadError) {
    const isTimeout = loadError.message?.includes("timed out");
    const isMissingKey = loadError.message?.includes("Missing API Key");
    const isBillingError = loadError.message?.includes("Billing") || loadError.message?.includes("Authentication");

    return (
      <div className={cn("flex flex-col items-center justify-center bg-brand-background border-2 border-dashed border-brand-border rounded-3xl p-12 text-center", className)}>
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-2">
          {isTimeout ? "Connection Timed Out" : isMissingKey ? "Configuration Required" : isBillingError ? "Billing Required" : "Map Unavailable"}
        </h3>
        <p className="text-brand-muted max-w-xs mx-auto mb-4">
          {isTimeout 
            ? "The map is taking too long to load. Please check your internet connection or reload the page."
            : isMissingKey
            ? "The map provider is not correctly configured. Please check your API key settings."
            : isBillingError
            ? "Google Maps billing is not enabled for this project. Please enable billing in the Google Cloud Console."
            : "There was an error loading the map provider. Our team has been notified."}
        </p>
        {(isTimeout || !isMissingKey) && (
          <button 
            onClick={() => window.location.reload()}
            className="text-brand-coffee font-bold hover:underline text-sm"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  if (!isLoaded && provider) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-brand-background border-2 border-dashed border-brand-border rounded-3xl p-12 text-center", className)}>
        <Loader2 className="w-12 h-12 text-brand-coffee animate-spin mb-4" />
        <p className="text-brand-muted font-medium">Initializing Map...</p>
      </div>
    );
  }

  if (!provider || !apiKey) {
    return (
      <div className={cn("flex flex-col items-center justify-center bg-brand-cream/30 border-2 border-dashed border-brand-border rounded-[40px] p-12 text-center", className)}>
        <Coffee className="w-16 h-16 text-brand-muted mb-6" />
        <h3 className="text-2xl font-serif font-bold text-brand-charcoal mb-3">Map Discovery Disabled</h3>
        <p className="text-brand-muted max-w-sm mx-auto mb-8">Configure VITE_GOOGLE_MAPS_API_KEY in your environment to enable interactive location discovery.</p>
        <div className="bg-white p-6 rounded-2xl border border-brand-border text-left space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-coffee">Required Setup:</p>
          <code className="block p-3 bg-brand-background rounded-lg text-xs font-mono text-brand-charcoal">
            VITE_GOOGLE_MAPS_API_KEY=your_api_key
          </code>
        </div>
      </div>
    );
  }

  if (provider === 'google') {
    return (
      <APIProvider apiKey={apiKey}>
        <div className={cn("w-full h-full relative rounded-3xl overflow-hidden shadow-inner border border-brand-border", className)}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={center || DEFAULT_CENTER}
            defaultZoom={zoom || DEFAULT_ZOOM}
            styles={mapStyles}
            disableDefaultUI={false}
            clickableIcons={false}
            zoomControl={true}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            onClick={() => onCafeSelect?.(null)}
            {...({ internalUsageAttributionIds: ["gmp_mcp_codeassist_v1_aistudio"] } as any)}
          >
            <MapHandler 
              validCafes={validCafes} 
              selectedCafeId={selectedCafeId}
              onInfoWindowCafeChange={setInfoWindowCafe}
            />

            {validCafes.map(cafe => (
              <AdvancedMarker
                key={cafe.id}
                position={{ lat: Number(cafe.latitude), lng: Number(cafe.longitude) }}
                onClick={() => {
                  onCafeSelect?.(cafe.id);
                  setInfoWindowCafe(cafe);
                }}
                title={cafe.name}
              />
            ))}

            {infoWindowCafe && (
              <InfoWindow
                position={{ lat: Number(infoWindowCafe.latitude), lng: Number(infoWindowCafe.longitude) }}
                onCloseClick={() => {
                  setInfoWindowCafe(null);
                  onCafeSelect?.(null);
                }}
                pixelOffset={[0, -30]}
              >
                <MapPopup 
                  cafe={infoWindowCafe} 
                  onClose={() => {
                    setInfoWindowCafe(null);
                    onCafeSelect?.(null);
                  }} 
                />
              </InfoWindow>
            )}
          </Map>
        </div>
      </APIProvider>
    );
  }

  if (provider === 'mapbox') {
     return (
       <div className={cn("flex flex-col items-center justify-center bg-brand-background rounded-3xl p-12 text-center border border-brand-border", className)}>
         <AlertCircle className="w-12 h-12 text-brand-coffee mb-4" />
         <h3 className="text-xl font-serif font-bold text-brand-charcoal mb-2">Mapbox Support</h3>
         <p className="text-brand-muted max-w-xs mx-auto">Mapbox integration is currently being optimized. Please use Google Maps for full functionality.</p>
       </div>
     );
  }

  return (
    <div className={cn("flex items-center justify-center bg-brand-background border-2 border-dashed border-brand-border rounded-3xl p-12", className)}>
      <p className="text-brand-muted font-bold uppercase tracking-widest text-xs">Unsupported map provider</p>
    </div>
  );
};
