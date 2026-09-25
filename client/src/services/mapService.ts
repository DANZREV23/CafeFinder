
export type MapProviderType = 'google' | 'mapbox';

export interface MapConfig {
  provider: MapProviderType | null;
  apiKey: string | null;
  isConfigured: boolean;
}

export const getMapConfig = (): MapConfig => {
  const provider = (import.meta.env.VITE_MAP_PROVIDER as MapProviderType) || 'google';
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_MAP_API_KEY || null;

  return {
    provider,
    apiKey,
    isConfigured: !!apiKey,
  };
};

export const getDirectionsUrl = (lat: number, lng: number, name?: string) => {
  const config = getMapConfig();
  
  if (config.provider === 'google') {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${name ? `&destination_place_id=${encodeURIComponent(name)}` : ''}`;
  }
  
  // Default to Google Maps as it's universally recognized for directions
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
};
