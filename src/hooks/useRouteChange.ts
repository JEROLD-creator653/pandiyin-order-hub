import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useRouteLoader } from '@/contexts/RouteLoaderContext';

export const useRouteChange = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startRouteLoad } = useRouteLoader();
  const currentPath = useRef(location.pathname);

  useEffect(() => {
    // Detect route change
    if (currentPath.current !== location.pathname) {
      currentPath.current = location.pathname;
      
      // Start loading for new route
      startRouteLoad(2500); // 2.5 seconds default
    }
  }, [location.pathname, startRouteLoad]);

  // Override navigate to trigger loading
  const originalPush = navigate;
  
  useEffect(() => {
    // This is a simplified approach - in production, you might want to use
    // a more sophisticated routing solution
    const handleNavigation = () => {
      startRouteLoad(2500);
    };

    // Listen for navigation events
    window.addEventListener('popstate', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, [startRouteLoad]);
};
