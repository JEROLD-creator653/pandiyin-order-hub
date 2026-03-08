import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouteChangeListener } from '@/hooks/useRouteChangeListener';

interface RouteLoaderContextType {
  isLoading: boolean;
  startRouteLoad: (minDuration?: number) => Promise<void>;
  endRouteLoad: () => void;
  forceLoad: (duration: number) => Promise<void>;
  registerDataLoad: (promise: Promise<any>) => Promise<any>;
}

const RouteLoaderContext = createContext<RouteLoaderContextType | undefined>(undefined);

export const useRouteLoader = () => {
  const context = useContext(RouteLoaderContext);
  if (!context) {
    throw new Error('useRouteLoader must be used within RouteLoaderProvider');
  }
  return context;
};

interface RouteLoaderProviderProps {
  children: React.ReactNode;
  minLoadDuration?: number; // Forced minimum load time - OPTIMIZED: 700ms (was 2000ms)
  maxLoadDuration?: number; // Maximum time to wait for data - OPTIMIZED: 1200ms (was 3000ms)
  autoTrigger?: boolean; // Auto-trigger on route change
  excludePaths?: string[]; // Paths to exclude from loading
}

export const RouteLoaderProvider: React.FC<RouteLoaderProviderProps> = ({ 
  children,
  minLoadDuration = 700, // OPTIMIZED: 700ms (33% reduction from 2000ms)
  maxLoadDuration = 1200, // OPTIMIZED: 1200ms (60% reduction from 3000ms)
  autoTrigger = true,
  excludePaths = ['/auth']
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const loadingStartTime = useRef<number>(0);
  const minLoadDurationRef = useRef<number>(minLoadDuration);
  const loadingTimeout = useRef<NodeJS.Timeout>();
  const dataLoadPromises = useRef<Promise<any>[]>([]);
  const maxLoadTimeout = useRef<NodeJS.Timeout>();

  const startRouteLoad = useCallback(async (customMinDuration?: number) => {
    if (loadingTimeout.current) {
      clearTimeout(loadingTimeout.current);
    }
    if (maxLoadTimeout.current) {
      clearTimeout(maxLoadTimeout.current);
    }

    setIsLoading(true);
    loadingStartTime.current = Date.now();
    minLoadDurationRef.current = customMinDuration || minLoadDuration;
    dataLoadPromises.current = [];

    // Maximum timeout - force end loading after maxLoadDuration
    maxLoadTimeout.current = setTimeout(() => {
      setIsLoading(false);
      dataLoadPromises.current = [];
    }, maxLoadDuration);

    return new Promise<void>((resolve) => {
      loadingTimeout.current = setTimeout(() => {
        const elapsed = Date.now() - loadingStartTime.current;
        if (elapsed >= minLoadDurationRef.current && dataLoadPromises.current.length === 0) {
          setIsLoading(false);
          if (maxLoadTimeout.current) {
            clearTimeout(maxLoadTimeout.current);
          }
          resolve();
        }
      }, minLoadDurationRef.current);
    });
  }, [minLoadDuration, maxLoadDuration]);

  const endRouteLoad = useCallback(() => {
    const elapsed = Date.now() - loadingStartTime.current;
    
    if (elapsed >= minLoadDurationRef.current) {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      if (maxLoadTimeout.current) {
        clearTimeout(maxLoadTimeout.current);
      }
      setIsLoading(false);
      dataLoadPromises.current = [];
    } else {
      // Wait for minimum duration to complete
      const remaining = minLoadDurationRef.current - elapsed;
      setTimeout(() => {
        setIsLoading(false);
        dataLoadPromises.current = [];
        if (maxLoadTimeout.current) {
          clearTimeout(maxLoadTimeout.current);
        }
      }, remaining);
    }
  }, []);

  const forceLoad = useCallback(async (duration: number) => {
    setIsLoading(true);
    loadingStartTime.current = Date.now();
    minLoadDurationRef.current = duration;

    return new Promise<void>((resolve) => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      if (maxLoadTimeout.current) {
        clearTimeout(maxLoadTimeout.current);
      }
      loadingTimeout.current = setTimeout(() => {
        setIsLoading(false);
        dataLoadPromises.current = [];
        resolve();
      }, duration);
    });
  }, []);

  const registerDataLoad = useCallback((promise: Promise<any>): Promise<any> => {
    dataLoadPromises.current.push(promise);
    promise.finally(() => {
      dataLoadPromises.current = dataLoadPromises.current.filter(p => p !== promise);
      
      const elapsed = Date.now() - loadingStartTime.current;
      if (elapsed >= minLoadDurationRef.current && dataLoadPromises.current.length === 0 && isLoading) {
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
        }
        if (maxLoadTimeout.current) {
          clearTimeout(maxLoadTimeout.current);
        }
        setIsLoading(false);
      }
    });
    return promise;
  }, [isLoading]);

  // Auto-trigger loading on route changes
  useRouteChangeListener({
    onRouteChangeStart: (path) => {
      if (autoTrigger) {
        startRouteLoad();
      }
    },
    onRouteChangeComplete: (path) => {
      if (autoTrigger) {
        endRouteLoad();
      }
    },
    minLoadDuration,
    excludePaths,
  });

  useEffect(() => {
    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      if (maxLoadTimeout.current) {
        clearTimeout(maxLoadTimeout.current);
      }
    };
  }, []);

  const value: RouteLoaderContextType = {
    isLoading,
    startRouteLoad,
    endRouteLoad,
    forceLoad,
    registerDataLoad,
  };

  return (
    <RouteLoaderContext.Provider value={value}>
      {children}
      <GlobalRouteLoader isLoading={isLoading} />
    </RouteLoaderContext.Provider>
  );
};

interface GlobalRouteLoaderProps {
  isLoading: boolean;
}

/**
 * Nature-themed leaf loading overlay
 * A single green leaf gently spins and floats for a calm, brand-aligned experience
 */
const GlobalRouteLoader: React.FC<GlobalRouteLoaderProps> = ({ isLoading }) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/98"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          <div className="relative flex flex-col items-center gap-6">
            {/* Leaf SVG with floating + spinning animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                animate={{
                  y: [0, -8, 0, 6, 0],
                  x: [0, 4, 0, -4, 0],
                  rotate: [0, 15, 0, -15, 0],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-md"
                >
                  {/* Leaf body */}
                  <path
                    d="M32 4C32 4 8 20 8 40C8 52 18 60 32 60C46 60 56 52 56 40C56 20 32 4 32 4Z"
                    className="fill-primary/90"
                  />
                  {/* Leaf vein - center */}
                  <path
                    d="M32 14V52"
                    className="stroke-primary-foreground/40"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  {/* Leaf veins - left */}
                  <path
                    d="M32 24L20 32M32 32L18 40M32 40L22 46"
                    className="stroke-primary-foreground/30"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  {/* Leaf veins - right */}
                  <path
                    d="M32 24L44 32M32 32L46 40M32 40L42 46"
                    className="stroke-primary-foreground/30"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                  {/* Highlight */}
                  <path
                    d="M28 16C28 16 16 28 16 38C16 42 20 44 24 42"
                    className="fill-primary-foreground/10"
                  />
                </svg>
              </motion.div>
            </motion.div>

            {/* Branding text */}
            <motion.p
              className="text-muted-foreground text-sm font-medium tracking-wide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              Loading fresh homemade goodness…
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
