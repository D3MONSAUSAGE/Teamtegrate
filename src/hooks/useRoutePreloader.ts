import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Route preloader to improve navigation performance
export const useRoutePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    // Preload likely next routes based on current route
    const preloadRoutes = () => {
      const currentPath = location.pathname;
      
      // Define likely navigation patterns
      const routeMap: Record<string, string[]> = {
        '/dashboard': ['/dashboard/tasks', '/dashboard/projects', '/dashboard/calendar'],
        '/dashboard/tasks': ['/dashboard/projects', '/dashboard/calendar', '/dashboard/reports'],
        '/dashboard/projects': ['/dashboard/tasks', '/dashboard/reports', '/dashboard/team'],
        '/dashboard/calendar': ['/dashboard/tasks', '/dashboard/focus', '/dashboard/reports'],
        '/dashboard/chat': ['/dashboard/team', '/dashboard/notifications'],
        '/dashboard/reports': ['/dashboard/tasks', '/dashboard/projects', '/dashboard/team'],
      };

      const routesToPreload = routeMap[currentPath] || [];
      
      // Preload routes after a short delay to avoid impacting current page load
      setTimeout(() => {
        routesToPreload.forEach(route => {
          // Create invisible link elements to trigger route preloading
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
          
          // Remove after a short time to keep DOM clean
          setTimeout(() => {
            if (document.head.contains(link)) {
              document.head.removeChild(link);
            }
          }, 5000);
        });
      }, 1000);
    };

    preloadRoutes();
  }, [location.pathname]);
};
