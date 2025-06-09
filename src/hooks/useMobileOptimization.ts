
import { useEffect, useState } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileOptimizationOptions {
  enableReducedMotion?: boolean;
  optimizeScrolling?: boolean;
  enableTouchOptimization?: boolean;
}

export function useMobileOptimization(options: MobileOptimizationOptions = {}) {
  const {
    enableReducedMotion = true,
    optimizeScrolling = true,
    enableTouchOptimization = true,
  } = options;

  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mobile-specific optimizations
    if (isMobile) {
      // Prevent zoom on double tap
      let lastTouchEnd = 0;
      const preventZoom = (e: TouchEvent) => {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      };

      if (enableTouchOptimization) {
        document.addEventListener('touchend', preventZoom, { passive: false });
      }

      // Optimize scrolling performance
      if (optimizeScrolling) {
        document.body.style.webkitOverflowScrolling = 'touch';
        document.body.style.overscrollBehaviorY = 'none';
      }

      // Handle viewport height on mobile
      const setViewportHeight = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      setViewportHeight();
      window.addEventListener('resize', setViewportHeight);
      window.addEventListener('orientationchange', setViewportHeight);

      return () => {
        if (enableTouchOptimization) {
          document.removeEventListener('touchend', preventZoom);
        }
        window.removeEventListener('resize', setViewportHeight);
        window.removeEventListener('orientationchange', setViewportHeight);
      };
    }
  }, [isMobile, enableTouchOptimization, optimizeScrolling]);

  useEffect(() => {
    // Handle reduced motion preference
    if (enableReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleReducedMotion = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.body.style.setProperty('--animation-duration', '0.01ms');
        } else {
          document.body.style.removeProperty('--animation-duration');
        }
      };

      handleReducedMotion({ matches: mediaQuery.matches } as MediaQueryListEvent);
      mediaQuery.addEventListener('change', handleReducedMotion);

      return () => {
        mediaQuery.removeEventListener('change', handleReducedMotion);
      };
    }
  }, [enableReducedMotion]);

  useEffect(() => {
    // Simulate loading completion
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return {
    isMobile,
    isLoading,
    isOptimized: !isLoading
  };
}
