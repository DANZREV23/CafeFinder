import * as React from "react";
import { getMapConfig, MapProviderType } from "@/services/mapService";

interface MapContextType {
  isLoaded: boolean;
  loadError: any;
  provider: MapProviderType | null;
  apiKey: string | null;
  requestLoad: () => void;
}

const MapContext = React.createContext<MapContextType>({
  isLoaded: false,
  loadError: null,
  provider: null,
  apiKey: null,
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

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = React.useMemo(() => getMapConfig(), []);
  const [loadRequested, setLoadRequested] = React.useState(false);
  const [isAuthFailure, setIsAuthFailure] = React.useState(false);

  // Global handler for Google Maps authentication failures (e.g., BillingNotEnabledMapError)
  React.useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps authentication or billing notice detected (gm_authFailure).");
      setIsAuthFailure(true);
    };

    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (
        msg.includes('BillingNotEnabledMapError') ||
        msg.includes('ApiNotActivatedMapError') ||
        msg.includes('Google Maps JavaScript API error')
      ) {
        console.warn('[MapProvider]: Handled Google Maps billing notice:', ...args);
        setIsAuthFailure(true);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    const handleWindowError = (event: ErrorEvent) => {
      if (
        typeof event?.message === 'string' &&
        (event.message.includes('BillingNotEnabledMapError') ||
         event.message.includes('ApiNotActivatedMapError') ||
         event.message.includes('Google Maps JavaScript API error'))
      ) {
        console.warn("Google Maps error captured:", event.message);
        setIsAuthFailure(true);
      }
    };
    window.addEventListener('error', handleWindowError);

    return () => {
      (window as any).gm_authFailure = null;
      console.error = originalConsoleError;
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  const requestLoad = React.useCallback(() => {
    setLoadRequested(true);
  }, []);

  const effectiveError = isAuthFailure 
    ? new Error("Google Maps Billing or Authentication Error. Please check your API key configuration.") 
    : null;

  return (
    <MapContext.Provider value={{ 
      isLoaded: loadRequested && !isAuthFailure && !!config.apiKey, 
      loadError: effectiveError, 
      provider: config.provider,
      apiKey: config.apiKey,
      requestLoad
    }}>
      {children}
    </MapContext.Provider>
  );
};
