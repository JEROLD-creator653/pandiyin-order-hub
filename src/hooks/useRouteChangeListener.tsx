import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteChangeListenerOptions {
  onRouteChangeStart?: (path: string) => void;
  onRouteChangeComplete?: (path: string) => void;
  minLoadDuration?: number;
  excludePaths?: string[]; // Paths to exclude from loading screen
}

/**
 * Hook that automatically detects route changes and triggers callbacks
 * Works with React Router's navigation including browser back/forward
 */
export const useRouteChangeListener = ({
  onRouteChangeStart,
  onRouteChangeComplete,
  minLoadDuration = 2000,
  excludePaths = ['/auth'],
}: RouteChangeListenerOptions) => {
  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);
  const isInitialMount = useRef(true);
  const loadStartTime = useRef<number>(0);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLocationRef.current = location.pathname;
      return;
    }

    const currentPath = location.pathname;
    const prevPath = prevLocationRef.current;

    // Check if route actually changed
    if (currentPath === prevPath) {
      return;
    }

    // Check if path should be excluded
    const shouldExclude = excludePaths.some(
      (excludePath) => currentPath.startsWith(excludePath)
    );

    if (shouldExclude) {
      prevLocationRef.current = currentPath;
      return;
    }

    // Route change detected - trigger start callback
    loadStartTime.current = Date.now();
    onRouteChangeStart?.(currentPath);

    // Ensure minimum loading duration
    const timer = setTimeout(() => {
      const elapsed = Date.now() - loadStartTime.current;
      
      if (elapsed >= minLoadDuration) {
        onRouteChangeComplete?.(currentPath);
      } else {
        // Wait remaining time
        const remaining = minLoadDuration - elapsed;
        setTimeout(() => {
          onRouteChangeComplete?.(currentPath);
        }, remaining);
      }
    }, 0);

    // Update previous location
    prevLocationRef.current = currentPath;

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, onRouteChangeStart, onRouteChangeComplete, minLoadDuration, excludePaths]);
};
