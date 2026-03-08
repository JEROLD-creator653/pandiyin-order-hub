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
 * Premium Apple/Stripe-style loading overlay
 * Full-screen loader with smooth animations and subtle effects
 */
const LEAF_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.7)',
  'hsl(120, 40%, 45%)',
  'hsl(90, 50%, 50%)',
  'hsl(45, 80%, 55%)',
  'hsl(30, 70%, 50%)',
];

const LeafSVG = ({ color, size = 24 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 8.68-3.93 9-12z"
      fill={color}
      opacity={0.85}
    />
    <path
      d="M17 8c.59-1.36.94-2.87 1-4.5C12.26 3.5 8.5 6.48 6 10c-.26.41-.5.81-.73 1.22C7.37 8.1 11.29 6.5 17 8z"
      fill={color}
      opacity={0.6}
    />
  </svg>
);

const FallingLeaf = ({ delay, startX, color, size }: { delay: number; startX: number; color: string; size: number }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${startX}%`, top: -30 }}
    initial={{ y: -30, x: 0, rotate: 0, opacity: 0 }}
    animate={{
      y: ['0vh', '105vh'],
      x: [0, Math.sin(startX) * 60, -Math.sin(startX) * 40, Math.sin(startX) * 30],
      rotate: [0, 120, 240, 360 + Math.random() * 180],
      opacity: [0, 1, 1, 0.6, 0],
    }}
    transition={{
      duration: 3.5 + Math.random() * 2,
      delay,
      repeat: Infinity,
      ease: 'easeIn',
    }}
  >
    <LeafSVG color={color} size={size} />
  </motion.div>
);

const GlobalRouteLoader: React.FC<GlobalRouteLoaderProps> = ({ isLoading }) => {
  const leaves = React.useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      delay: i * 0.3,
      startX: 5 + Math.random() * 90,
      color: LEAF_COLORS[i % LEAF_COLORS.length],
      size: 18 + Math.random() * 14,
    })),
  []);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md overflow-hidden"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          {/* Falling leaves */}
          {leaves.map((leaf) => (
            <FallingLeaf key={leaf.id} {...leaf} />
          ))}

          {/* Center content */}
          <div className="relative flex flex-col items-center gap-6 z-10">
            {/* Central leaf icon with pulse */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="relative"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-primary/20 blur-2xl w-20 h-20 -translate-x-2 -translate-y-2"
              />
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <LeafSVG color="hsl(var(--primary))" size={48} />
              </motion.div>
            </motion.div>

            {/* Loading text */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <p className="text-muted-foreground text-sm font-medium tracking-wide">
                Loading
              </p>
              <motion.div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/60"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
