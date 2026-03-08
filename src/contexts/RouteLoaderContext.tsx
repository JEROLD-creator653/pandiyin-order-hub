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
  minLoadDuration?: number;
  maxLoadDuration?: number;
  autoTrigger?: boolean;
  excludePaths?: string[];
}

export const RouteLoaderProvider: React.FC<RouteLoaderProviderProps> = ({ 
  children,
  minLoadDuration = 700,
  maxLoadDuration = 1200,
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
    if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
    if (maxLoadTimeout.current) clearTimeout(maxLoadTimeout.current);

    setIsLoading(true);
    loadingStartTime.current = Date.now();
    minLoadDurationRef.current = customMinDuration || minLoadDuration;
    dataLoadPromises.current = [];

    maxLoadTimeout.current = setTimeout(() => {
      setIsLoading(false);
      dataLoadPromises.current = [];
    }, maxLoadDuration);

    return new Promise<void>((resolve) => {
      loadingTimeout.current = setTimeout(() => {
        const elapsed = Date.now() - loadingStartTime.current;
        if (elapsed >= minLoadDurationRef.current && dataLoadPromises.current.length === 0) {
          setIsLoading(false);
          if (maxLoadTimeout.current) clearTimeout(maxLoadTimeout.current);
          resolve();
        }
      }, minLoadDurationRef.current);
    });
  }, [minLoadDuration, maxLoadDuration]);

  const endRouteLoad = useCallback(() => {
    const elapsed = Date.now() - loadingStartTime.current;
    
    if (elapsed >= minLoadDurationRef.current) {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (maxLoadTimeout.current) clearTimeout(maxLoadTimeout.current);
      setIsLoading(false);
      dataLoadPromises.current = [];
    } else {
      const remaining = minLoadDurationRef.current - elapsed;
      setTimeout(() => {
        setIsLoading(false);
        dataLoadPromises.current = [];
        if (maxLoadTimeout.current) clearTimeout(maxLoadTimeout.current);
      }, remaining);
    }
  }, []);

  const forceLoad = useCallback(async (duration: number) => {
    setIsLoading(true);
    loadingStartTime.current = Date.now();
    minLoadDurationRef.current = duration;

    return new Promise<void>((resolve) => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (maxLoadTimeout.current) clearTimeout(maxLoadTimeout.current);
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
        if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
        if (maxLoadTimeout.current) clearTimeout(maxLoadTimeout.current);
        setIsLoading(false);
      }
    });
    return promise;
  }, [isLoading]);

  useRouteChangeListener({
    onRouteChangeStart: (path) => {
      if (autoTrigger) startRouteLoad();
    },
    onRouteChangeComplete: (path) => {
      if (autoTrigger) endRouteLoad();
    },
    minLoadDuration,
    excludePaths,
  });

  useEffect(() => {
    return () => {
      if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
      if (maxLoadTimeout.current) clearTimeout(maxLoadTimeout.current);
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

/* ─── Premium Orbital Loading Animation ─── */

const Particle = ({ index, total }: { index: number; total: number }) => {
  const angle = (index / total) * 360;
  const radius = 80 + Math.random() * 40;
  const size = 2 + Math.random() * 3;
  const duration = 2 + Math.random() * 2;
  const delay = (index / total) * 2;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: `hsl(var(--primary) / ${0.3 + Math.random() * 0.5})`,
        boxShadow: `0 0 ${size * 2}px hsl(var(--primary) / 0.4)`,
      }}
      animate={{
        x: [
          Math.cos((angle * Math.PI) / 180) * radius,
          Math.cos(((angle + 180) * Math.PI) / 180) * (radius * 0.6),
          Math.cos(((angle + 360) * Math.PI) / 180) * radius,
        ],
        y: [
          Math.sin((angle * Math.PI) / 180) * radius,
          Math.sin(((angle + 180) * Math.PI) / 180) * (radius * 0.6),
          Math.sin(((angle + 360) * Math.PI) / 180) * radius,
        ],
        opacity: [0, 1, 0.6, 1, 0],
        scale: [0.5, 1.5, 0.8, 1.2, 0.5],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
};

const OrbitRing = ({ radius, duration, thickness, opacity, reverse }: {
  radius: number; duration: number; thickness: number; opacity: number; reverse?: boolean;
}) => (
  <motion.div
    className="absolute rounded-full border"
    style={{
      width: radius * 2,
      height: radius * 2,
      borderColor: `hsl(var(--primary) / ${opacity})`,
      borderWidth: thickness,
    }}
    animate={{ rotate: reverse ? [360, 0] : [0, 360] }}
    transition={{ duration, repeat: Infinity, ease: 'linear' }}
  />
);

const GlowDot = ({ radius, duration, size, delay }: {
  radius: number; duration: number; size: number; delay: number;
}) => (
  <motion.div
    className="absolute"
    style={{ width: radius * 2, height: radius * 2 }}
    animate={{ rotate: [0, 360] }}
    transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
  >
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top: 0,
        left: '50%',
        marginLeft: -size / 2,
        background: 'hsl(var(--primary))',
        boxShadow: `0 0 ${size * 4}px hsl(var(--primary) / 0.8), 0 0 ${size * 8}px hsl(var(--primary) / 0.4)`,
      }}
      animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  </motion.div>
);

const GlobalRouteLoader: React.FC<GlobalRouteLoaderProps> = ({ isLoading }) => {
  const particles = React.useMemo(
    () => Array.from({ length: 20 }, (_, i) => i),
    []
  );

  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            touchAction: 'none',
            overscrollBehavior: 'contain',
            background: 'radial-gradient(ellipse at center, hsl(var(--background)) 0%, hsl(var(--background) / 0.98) 100%)',
          }}
        >
          {/* Ambient glow */}
          <motion.div
            className="absolute w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-64 h-64 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 60%)' }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />

          {/* Floating particles */}
          <div className="absolute flex items-center justify-center">
            {particles.map((i) => (
              <Particle key={i} index={i} total={particles.length} />
            ))}
          </div>

          {/* Orbit rings */}
          <div className="absolute flex items-center justify-center">
            <OrbitRing radius={65} duration={8} thickness={1} opacity={0.15} />
            <OrbitRing radius={85} duration={12} thickness={1} opacity={0.1} reverse />
            <OrbitRing radius={105} duration={16} thickness={0.5} opacity={0.06} />
          </div>

          {/* Glowing orbit dots */}
          <div className="absolute flex items-center justify-center">
            <GlowDot radius={65} duration={3} size={6} delay={0} />
            <GlowDot radius={85} duration={4.5} size={4} delay={1} />
            <GlowDot radius={105} duration={6} size={3} delay={0.5} />
          </div>

          {/* Center content */}
          <div className="relative flex flex-col items-center gap-6 z-10">
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Inner glow ring */}
              <motion.div
                className="absolute w-20 h-20 rounded-full"
                style={{
                  border: '2px solid hsl(var(--primary) / 0.3)',
                  boxShadow: '0 0 30px hsl(var(--primary) / 0.15), inset 0 0 30px hsl(var(--primary) / 0.1)',
                }}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Core dot */}
              <motion.div
                className="w-4 h-4 rounded-full"
                style={{
                  background: 'hsl(var(--primary))',
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--primary) / 0.3), 0 0 60px hsl(var(--primary) / 0.1)',
                }}
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Loading text + animated bar */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-foreground/60 text-[11px] font-medium tracking-[0.25em] uppercase">
                Loading
              </p>
              <div className="w-32 h-[2px] bg-muted/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)' }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
