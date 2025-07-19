
import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';
import { androidOptimizations } from '@/utils/androidOptimizations';

interface MobileOptimizationOptions {
  enableReducedMotion?: boolean;
  optimizeScrolling?: boolean;
  enableTouchOptimization?: boolean;
  enableViewportFix?: boolean;
  enableKeyboardHandling?: boolean;
  enableAndroidOptimization?: boolean;
}

interface ViewportState {
  height: number;
  width: number;
  isKeyboardOpen: boolean;
}

export function useMobileOptimization(options: MobileOptimizationOptions = {}) {
  const {
    enableReducedMotion = true,
    optimizeScrolling = true,
    enableTouchOptimization = true,
    enableViewportFix = true,
    enableKeyboardHandling = true,
    enableAndroidOptimization = true,
  } = options;

  const isMobile = useIsMobile();
  const [isOptimized, setIsOptimized] = useState(false);
  const [viewport, setViewport] = useState<ViewportState>({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    isKeyboardOpen: false,
  });

  // Detect virtual keyboard on mobile
  const detectKeyboard = useCallback(() => {
    if (!isMobile || !enableKeyboardHandling) return;

    const initialHeight = window.screen.height;
    const currentHeight = window.innerHeight;
    const heightDifference = initialHeight - currentHeight;
    
    // If height difference is significant, keyboard is likely open
    const isKeyboardOpen = heightDifference > 150;
    
    setViewport(prev => ({
      ...prev,
      height: currentHeight,
      width: window.innerWidth,
      isKeyboardOpen,
    }));

    // Add class to body for keyboard state
    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
  }, [isMobile, enableKeyboardHandling]);

  useEffect(() => {
    // Initialize Android optimizations if enabled
    if (enableAndroidOptimization) {
      const deviceInfo = androidOptimizations.getDeviceInfo();
      const strategy = androidOptimizations.getRenderingStrategy();
      
      console.log('Android optimization initialized:', { deviceInfo, strategy });
      
      // Apply device-specific classes
      if (deviceInfo.isAndroid) {
        document.body.classList.add('android-optimized');
        
        if (deviceInfo.isWebView) {
          document.body.classList.add('webview-optimized');
        }
        
        // Apply manufacturer-specific optimizations
        if (deviceInfo.manufacturer) {
          document.body.classList.add(`${deviceInfo.manufacturer}-optimized`);
        }
      }
    }

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
        
        // Add touch-action CSS for better scroll performance
        document.body.style.touchAction = 'pan-y';
      }

      // Optimize scrolling performance
      if (optimizeScrolling) {
        document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
        document.body.style.setProperty('overscroll-behavior-y', 'none');
        document.body.style.setProperty('scroll-behavior', 'smooth');
      }

      // Handle viewport height on mobile
      if (enableViewportFix) {
        const setViewportHeight = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
          detectKeyboard();
        };

        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
          // Delay viewport calculation after orientation change
          setTimeout(setViewportHeight, 150);
        });

        // Listen for keyboard events
        if (enableKeyboardHandling) {
          window.addEventListener('focusin', detectKeyboard);
          window.addEventListener('focusout', detectKeyboard);
        }

        return () => {
          if (enableTouchOptimization) {
            document.removeEventListener('touchend', preventZoom);
          }
          window.removeEventListener('resize', setViewportHeight);
          window.removeEventListener('orientationchange', setViewportHeight);
          if (enableKeyboardHandling) {
            window.removeEventListener('focusin', detectKeyboard);
            window.removeEventListener('focusout', detectKeyboard);
          }
        };
      }
    }
  }, [isMobile, enableTouchOptimization, optimizeScrolling, enableViewportFix, enableKeyboardHandling, enableAndroidOptimization, detectKeyboard]);

  useEffect(() => {
    // Handle reduced motion preference
    if (enableReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handleReducedMotion = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.body.style.setProperty('--animation-duration', '0.01ms');
          document.body.classList.add('reduce-motion');
        } else {
          document.body.style.removeProperty('--animation-duration');
          document.body.classList.remove('reduce-motion');
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
    // Add mobile optimization classes to body
    if (isMobile) {
      document.body.classList.add('mobile-optimized');
      
      // Add safe area support
      document.body.style.setProperty('padding-top', 'env(safe-area-inset-top)');
      document.body.style.setProperty('padding-bottom', 'env(safe-area-inset-bottom)');
      document.body.style.setProperty('padding-left', 'env(safe-area-inset-left)');
      document.body.style.setProperty('padding-right', 'env(safe-area-inset-right)');
    } else {
      document.body.classList.remove('mobile-optimized');
    }

    setIsOptimized(true);

    return () => {
      document.body.classList.remove('mobile-optimized', 'keyboard-open', 'android-optimized', 'webview-optimized');
    };
  }, [isMobile]);

  // Utility functions for mobile optimization
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const preventBodyScroll = useCallback((prevent: boolean) => {
    if (prevent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, []);

  const enableHardwareAccelerationForElement = useCallback((element: HTMLElement) => {
    // Only apply hardware acceleration selectively based on Android optimization strategy
    const deviceInfo = androidOptimizations.getDeviceInfo();
    const strategy = androidOptimizations.getRenderingStrategy();
    
    if (strategy.useHardwareAcceleration) {
      element.classList.add('hw-accelerated');
    }
  }, []);

  return {
    isMobile,
    isOptimized,
    viewport,
    isKeyboardOpen: viewport.isKeyboardOpen,
    scrollToTop,
    preventBodyScroll,
    enableHardwareAccelerationForElement,
    androidOptimizations: enableAndroidOptimization ? androidOptimizations : null,
  };
}
