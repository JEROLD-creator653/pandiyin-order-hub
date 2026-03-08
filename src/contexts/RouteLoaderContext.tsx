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

// Leaf config for falling leaves
const FALLING_LEAVES = [
  { delay: 0, size: 1.2, left: '20%', dur: 4.2 },
  { delay: 0.6, size: 0.85, left: '35%', dur: 3.8 },
  { delay: 1.1, size: 1.4, left: '50%', dur: 4.8 },
  { delay: 0.3, size: 0.95, left: '65%', dur: 3.5 },
  { delay: 0.9, size: 1.1, left: '78%', dur: 4.1 },
];

const LeafIcon = ({ size = 1 }: { size?: number }) => (
  <svg width={28 * size} height={28 * size} viewBox="0 0 48 48" fill="none">
    <path d="M24 4C24 4 6 16 6 30C6 39 13 44 24 44C35 44 42 39 42 30C42 16 24 4 24 4Z" className="fill-primary/80" />
    <path d="M24 10V38" className="stroke-primary-foreground/20" strokeWidth="1" strokeLinecap="round" />
    <path d="M24 18L16 24M24 24L14 30M24 30L18 34" className="stroke-primary-foreground/15" strokeWidth="0.7" strokeLinecap="round" />
    <path d="M24 18L32 24M24 24L34 30M24 30L30 34" className="stroke-primary-foreground/15" strokeWidth="0.7" strokeLinecap="round" />
  </svg>
);

const CenterLeafIcon = () => (
  <svg width={56} height={56} viewBox="0 0 64 64" fill="none">
    <path d="M32 4C32 4 6 22 6 40C6 52 16 60 32 60C48 60 58 52 58 40C58 22 32 4 32 4Z" className="fill-primary/85" />
    <path d="M32 12V52" className="stroke-primary-foreground/25" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 22L20 30M32 30L16 38M32 38L22 44" className="stroke-primary-foreground/18" strokeWidth="1" strokeLinecap="round" />
    <path d="M32 22L44 30M32 30L48 38M32 38L42 44" className="stroke-primary-foreground/18" strokeWidth="1" strokeLinecap="round" />
    <path d="M26 14C26 14 14 26 14 36C14 40 18 42 22 40" className="fill-primary-foreground/6" />
    {/* Stem curving down */}
    <path d="M32 56C32 56 30 62 28 64" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 56C32 56 34 62 36 64" className="stroke-primary/40" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

/**
 * Premium leaf loading screen — falling leaves, particles, progress bar, bloom finish
 */
const GlobalRouteLoader: React.FC<GlobalRouteLoaderProps> = ({ isLoading }) => {
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState<'loading' | 'done'>('loading');
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setPhase('loading');
      startRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const duration = 2800;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(elapsed / duration, 1);
      const eased = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      setProgress(Math.round(eased * 100));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('done');
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isLoading]);

  // Particle positions (random-ish but stable)
  const particles = React.useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      left: `${10 + (i * 8.3) % 80}%`,
      top: `${20 + (i * 13.7) % 60}%`,
      size: 3 + (i % 3) * 2,
      delay: i * 0.4,
      dur: 2 + (i % 3),
    })), []);

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] overflow-hidden"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, hsl(130 30% 94%) 0%, hsl(var(--background)) 70%)',
            }}
          />

          {/* Ambient floating particles */}
          {particles.map((p, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                background: 'hsl(var(--primary) / 0.25)',
              }}
              initial={{ opacity: 0, y: 0, scale: 1 }}
              animate={{ opacity: [0, 0.6, 0], y: -60, scale: 0.4 }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Falling leaves */}
          {FALLING_LEAVES.map((leaf, i) => (
            <motion.div
              key={`fall-${i}`}
              className="absolute"
              style={{ left: leaf.left, top: -40 }}
              initial={{ y: -80, rotate: -20, scale: 0.7 * leaf.size, opacity: 0 }}
              animate={{
                y: ['-80px', '110vh'],
                rotate: [-20, 30],
                scale: [0.7 * leaf.size, leaf.size],
                opacity: [0, 1, 0.85, 0],
                x: [0, 22, -18, 0],
              }}
              transition={{
                duration: leaf.dur,
                delay: leaf.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <LeafIcon size={leaf.size} />
            </motion.div>
          ))}

          {/* Main centered content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              {/* Central leaf with glow */}
              <motion.div
                className="relative"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={phase === 'done'
                  ? { scale: [0.8, 1.05, 1], y: [10, -3, 0], opacity: 1 }
                  : { scale: 1, opacity: 1 }
                }
                transition={phase === 'done'
                  ? { duration: 0.7, ease: [0.23, 1, 0.32, 1] }
                  : { duration: 0.6, ease: "easeOut" }
                }
              >
                {/* Pulse glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'hsl(var(--primary) / 0.08)',
                    filter: 'blur(16px)',
                    margin: -16,
                  }}
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.4, 0.7, 0.4],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  animate={{ rotate: [0, 4, -3, 2, -4, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CenterLeafIcon />
                </motion.div>
              </motion.div>

              {/* Title text */}
              <motion.p
                className="text-foreground/70 text-sm font-semibold tracking-widest uppercase"
                initial={{ opacity: 0, letterSpacing: '0.5em' }}
                animate={{ opacity: 1, letterSpacing: '0.2em' }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                {phase === 'done' ? 'Ready!' : 'Growing your experience'}
              </motion.p>

              {/* Progress bar */}
              <div className="w-48 flex flex-col items-center gap-2">
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'hsl(var(--primary) / 0.12)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'hsl(var(--primary) / 0.6)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                  />
                </div>
                <motion.span
                  className="text-xs font-medium text-muted-foreground/60 tracking-wider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {phase === 'done' ? (
                    <span className="text-primary/70">✦ Ready</span>
                  ) : (
                    <>{progress}<span className="text-muted-foreground/40">%</span></>
                  )}
                </motion.span>
              </div>

              {/* Ground stem decoration */}
              <motion.div
                className="flex items-end gap-0.5 mt-2"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                style={{ transformOrigin: 'bottom' }}
              >
                {[14, 20, 28, 20, 14].map((h, i) => (
                  <div
                    key={i}
                    className="rounded-t-full"
                    style={{
                      width: 3,
                      height: h,
                      background: `hsl(var(--primary) / ${0.15 + i * 0.05})`,
                    }}
                  />
                ))}
              </motion.div>
            </div>
          </div>

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 60%, hsl(var(--background) / 0.4) 100%)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
