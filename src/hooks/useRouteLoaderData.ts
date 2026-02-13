import { useEffect } from 'react';

// Hook to register data loading with route loader
export const useRouteLoaderData = <T>(promise: Promise<T> | (() => Promise<T>), deps: any[] = []) => {
  useEffect(() => {
    const loadPromise = typeof promise === 'function' ? promise() : promise;
    
    // Register with the route loader context
    if ((window as any).__routeLoaderRegister) {
      (window as any).__routeLoaderRegister(loadPromise);
    }
  }, deps);
};

// Alternative approach using a custom hook
export const useRegisterDataLoad = () => {
  const registerDataLoad = <T>(promise: Promise<T>) => {
    // This will be replaced by the context provider
    if ((React as any).useRouteLoader?.registerDataLoad) {
      return (React as any).useRouteLoader.registerDataLoad(promise);
    }
    return promise;
  };

  return { registerDataLoad };
};
