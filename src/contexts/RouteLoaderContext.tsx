import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouteChangeListener } from '@/hooks/useRouteChangeListener';
import loadingGif from '@/assets/loading-screen.gif';

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
  minLoadDuration = 1200,
  maxLoadDuration = 1800,
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

const GlobalRouteLoader: React.FC<GlobalRouteLoaderProps> = ({ isLoading }) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading && (
        <motion.div
          key="route-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeInOut' } }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-background"
          style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
        >
          <motion.img
            src={loadingGif}
            alt="Loading"
            className="w-32 h-32 object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

