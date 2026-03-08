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

const LEAVES = [
  // 3 large leaves
  { size: 48, x: [0, 8, 14, 5, -10, -14, -7, 0], y: [0, -12, -5, 10, 3, -8, 2, 0], rotate: [0, 10, 20, 14, -8, -18, -6, 0], duration: 6.2, delay: 0, opacity: 0.9 },
  { size: 42, x: [0, -10, -6, 8, 12, 4, -5, 0], y: [0, 6, -8, -14, 0, 10, 4, 0], rotate: [0, -12, -22, -10, 6, 16, 8, 0], duration: 7.0, delay: 0.3, opacity: 0.85 },
  { size: 44, x: [0, 6, -4, -12, -8, 6, 10, 0], y: [0, -6, 8, 2, -10, -4, 6, 0], rotate: [0, 14, 8, -10, -20, -6, 12, 0], duration: 5.8, delay: 0.6, opacity: 0.88 },
  // 2 small accent leaves
  { size: 24, x: [0, -6, -12, -4, 8, 10, 4, 0], y: [0, 4, -4, -8, 2, 6, 0, 0], rotate: [0, -8, -16, -24, -12, 4, 10, 0], duration: 8.0, delay: 0.2, opacity: 0.5 },
  { size: 20, x: [0, 10, 6, -4, -10, -6, 2, 0], y: [0, -4, 6, 10, 4, -6, -2, 0], rotate: [0, 18, 28, 16, 4, -8, 6, 0], duration: 9.0, delay: 0.5, opacity: 0.4 },
];

const LEAF_POSITIONS = [
  'translate-x-0 translate-y-0',         // center
  '-translate-x-12 -translate-y-8',      // top-left
  'translate-x-14 translate-y-6',        // bottom-right
  '-translate-x-20 translate-y-14',      // far left low (small)
  'translate-x-18 -translate-y-16',      // far right high (small)
];

const LeafSVG = ({ size, detailed = true }: { size: number; detailed?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
    <path d="M32 4C32 4 8 20 8 40C8 52 18 60 32 60C46 60 56 52 56 40C56 20 32 4 32 4Z" className="fill-primary/85" />
    <path d="M32 14V52" className="stroke-primary-foreground/30" strokeWidth="1.5" strokeLinecap="round" />
    {detailed && (
      <>
        <path d="M32 24L20 32M32 32L18 40M32 40L22 46" className="stroke-primary-foreground/20" strokeWidth="1" strokeLinecap="round" />
        <path d="M32 24L44 32M32 32L46 40M32 40L42 46" className="stroke-primary-foreground/20" strokeWidth="1" strokeLinecap="round" />
        <path d="M28 16C28 16 16 28 16 38C16 42 20 44 24 42" className="fill-primary-foreground/8" />
      </>
    )}
  </svg>
);

/**
 * Nature-themed multi-leaf loading overlay
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
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(130 30% 95%) 40%, hsl(90 20% 92%) 70%, hsl(var(--background)) 100%)',
              backdropFilter: 'blur(8px)',
            }}
          />

          <div className="relative flex flex-col items-center gap-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {LEAVES.map((leaf, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${LEAF_POSITIONS[i]}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: leaf.opacity }}
                  transition={{ duration: 0.5, delay: leaf.delay, ease: "easeOut" }}
                >
                  <motion.div
                    animate={{ x: leaf.x, y: leaf.y, rotate: leaf.rotate }}
                    transition={{ duration: leaf.duration, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <LeafSVG size={leaf.size} detailed={i < 3} />
                  </motion.div>
                </motion.div>
              ))}
            </div>

            <motion.p
              className="text-muted-foreground/80 text-sm font-medium tracking-wide"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              Preparing fresh homemade goodness…
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
