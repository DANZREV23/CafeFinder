import * as React from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { getMapConfig, MapProviderType } from "@/services/mapService";

interface MapContextType {
  isLoaded: boolean;
  loadError: any;
  provider: MapProviderType | null;
  requestLoad: () => void;
}

const MapContext = React.createContext<MapContextType>({
  isLoaded: false,
  loadError: null,
  provider: null,
  requestLoad: () => {},
});

export const useMap = () => React.useContext(MapContext);

/**
 * Hook to be used by components that need the map to be initialized.
 * It will trigger the dynamic loading of the map provider's script.
 */
export const useMapLoad = () => {
  const { requestLoad } = useMap();
  React.useEffect(() => {
    requestLoad();
  }, [requestLoad]);
};

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

/**
 * Internal component that uses useJsApiLoader to actually load the Google Maps script.
 * By putting it in a separate component, we can conditionally render it to ensure
 * the script only starts loading when needed.
 */
const GoogleMapsScriptLoader: React.FC<{
  apiKey: string;
  onLoaded: (loaded: boolean) => void;
  onError: (error: any) => void;
}> = ({ apiKey, onLoaded, onError }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    id: 'google-map-script',
    libraries: LIBRARIES,
  });

  React.useEffect(() => {
    onLoaded(isLoaded);
  }, [isLoaded, onLoaded]);

  React.useEffect(() => {
    if (loadError) onError(loadError);
  }, [loadError, onError]);

  return null;
};

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = React.useMemo(() => getMapConfig(), []);
  const [loadRequested, setLoadRequested] = React.useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = React.useState(false);
  const [googleError, setGoogleError] = React.useState<any>(null);
  const [isTimedOut, setIsTimedOut] = React.useState(false);
  const [isAuthFailure, setIsAuthFailure] = React.useState(false);

  // Global handler for Google Maps authentication failures (e.g., BillingNotEnabledMapError)
  React.useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.error("Google Maps authentication failure detected.");
      setIsAuthFailure(true);
    };
    return () => {
      (window as any).gm_authFailure = null;
    };
  }, []);

  // Mapbox doesn't need a loader like Google, but we can track its status
  const [isMapboxReady, setIsMapboxReady] = React.useState(config.provider === 'mapbox');

  // Timeout detection for initializing state - only starts when loadRequested is true
  React.useEffect(() => {
    if (loadRequested && config.provider && !isGoogleLoaded && !googleError && !isMapboxReady && !isAuthFailure) {
      const timer = setTimeout(() => {
        setIsTimedOut(true);
      }, 10000); // 10 second timeout
      return () => clearTimeout(timer);
    }
  }, [loadRequested, config.provider, isGoogleLoaded, googleError, isMapboxReady, isAuthFailure]);

  // If we have a provider but no API key, it's effectively an error or unconfigured state
  // We also check if load was actually requested
  const isActuallyLoaded = loadRequested && !isAuthFailure && (config.provider === 'google' 
    ? (isGoogleLoaded && !!config.apiKey) 
    : (isMapboxReady && !!config.apiKey));

  const effectiveError = isAuthFailure 
    ? new Error("Google Maps Billing or Authentication Error. Please check your API key configuration.") 
    : googleError || 
    (loadRequested && config.provider && !config.apiKey ? new Error("Missing API Key") : null) ||
    (isTimedOut && !isActuallyLoaded ? new Error("Map initialization timed out") : null);

  const requestLoad = React.useCallback(() => {
    setLoadRequested(true);
  }, []);

  return (
    <MapContext.Provider value={{ 
      isLoaded: isActuallyLoaded, 
      loadError: effectiveError, 
      provider: config.provider,
      requestLoad
    }}>
      {children}
      {loadRequested && config.provider === 'google' && config.apiKey && (
        <GoogleMapsScriptLoader 
          apiKey={config.apiKey} 
          onLoaded={setIsGoogleLoaded} 
          onError={setGoogleError} 
        />
      )}
    </MapContext.Provider>
  );
};
