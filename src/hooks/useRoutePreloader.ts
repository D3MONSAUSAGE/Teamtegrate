import { useEffect } from 'react';

export const useRoutePreloader = () => {
  useEffect(() => {
    // Preload common routes after initial load
    const preloadRoutes = () => {
      // This is a placeholder for route preloading logic
      // In a real implementation, you might preload route components
      console.log('Route preloader initialized');
    };

    // Delay preloading to not interfere with initial page load
    const timer = setTimeout(preloadRoutes, 1000);
    
    return () => clearTimeout(timer);
  }, []);
};
