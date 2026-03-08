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
  'hsl(120, 45%, 42%)',
  'hsl(85, 55%, 48%)',
  'hsl(50, 75%, 52%)',
  'hsl(25, 65%, 48%)',
  'hsl(10, 60%, 45%)',
  'hsl(140, 40%, 38%)',
];

// Multiple leaf shapes for variety
const LeafShape1 = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2C16 2 4 10 4 20c0 5.5 5.4 10 12 10s12-4.5 12-10C28 10 16 2 16 2z" fill={color} opacity={0.8} />
    <path d="M16 6v20M10 14c2 2 4 3 6 3M22 14c-2 2-4 3-6 3" stroke={color} strokeWidth="0.8" opacity={0.4} />
  </svg>
);

const LeafShape2 = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 8.68-3.93 9-12z" fill={color} opacity={0.85} />
    <path d="M17 8c.59-1.36.94-2.87 1-4.5C12.26 3.5 8.5 6.48 6 10c-.26.41-.5.81-.73 1.22C7.37 8.1 11.29 6.5 17 8z" fill={color} opacity={0.55} />
  </svg>
);

const LeafShape3 = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="12" rx="8" ry="11" transform="rotate(-30 14 14)" fill={color} opacity={0.75} />
    <path d="M14 3v22" stroke={color} strokeWidth="0.7" opacity={0.35} />
  </svg>
);

const LEAF_SHAPES = [LeafShape1, LeafShape2, LeafShape3];

const FallingLeaf = ({ delay, startX, color, size, shapeIdx, swayAmplitude, duration }: {
  delay: number; startX: number; color: string; size: number; shapeIdx: number; swayAmplitude: number; duration: number;
}) => {
  const Shape = LEAF_SHAPES[shapeIdx % LEAF_SHAPES.length];
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${startX}%`, top: -40 }}
      initial={{ y: -40, x: 0, rotate: 0, opacity: 0, scaleX: 1 }}
      animate={{
        y: ['-5vh', '110vh'],
        x: [
          0,
          swayAmplitude * 0.7,
          -swayAmplitude,
          swayAmplitude * 0.5,
          -swayAmplitude * 0.8,
          swayAmplitude * 0.3,
        ],
        rotate: [0, 45, 130, 200, 290, 360 + 60],
        opacity: [0, 0.9, 1, 1, 0.7, 0],
        scaleX: [1, 0.7, 1, 0.6, 1, 0.8],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Shape color={color} size={size} />
    </motion.div>
  );
};

const GlobalRouteLoader: React.FC<GlobalRouteLoaderProps> = ({ isLoading }) => {
  const leaves = React.useMemo(() =>
    Array.from({ length: 16 }).map((_, i) => ({
      id: i,
      delay: i * 0.25 + Math.random() * 0.3,
      startX: 2 + Math.random() * 96,
      color: LEAF_COLORS[i % LEAF_COLORS.length],
      size: 16 + Math.random() * 16,
      shapeIdx: Math.floor(Math.random() * 3),
      swayAmplitude: 30 + Math.random() * 50,
      duration: 4 + Math.random() * 3,
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
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md overflow-hidden"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          {/* Soft radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]" />

          {/* Falling leaves */}
          {leaves.map((leaf) => (
            <FallingLeaf key={leaf.id} {...leaf} />
          ))}

          {/* Center content */}
          <div className="relative flex flex-col items-center gap-5 z-10">
            {/* Breathing glow behind center leaf */}
            <motion.div
              className="absolute w-28 h-28 rounded-full bg-primary/15 blur-3xl"
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Central leaf with gentle float + spin */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              <motion.div
                animate={{
                  rotate: [0, 8, -8, 5, -5, 0],
                  y: [0, -6, 0, -4, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <LeafShape2 color="hsl(var(--primary))" size={52} />
              </motion.div>
            </motion.div>

            {/* Brand text */}
            <motion.p
              className="text-foreground/70 text-xs font-medium tracking-[0.2em] uppercase"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Loading
            </motion.p>

            {/* Animated progress dots */}
            <motion.div
              className="flex gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-primary/50"
                  animate={{
                    scale: [1, 1.6, 1],
                    opacity: [0.3, 1, 0.3],
                    backgroundColor: ['hsl(var(--primary) / 0.3)', 'hsl(var(--primary))', 'hsl(var(--primary) / 0.3)'],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
