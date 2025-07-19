
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
  debugMode?: boolean;
  optimizationLevel?: 0 | 1 | 2 | 3;
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
    debugMode = false,
    optimizationLevel
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
    
    const isKeyboardOpen = heightDifference > 150;
    
    setViewport(prev => ({
      ...prev,
      height: currentHeight,
      width: window.innerWidth,
      isKeyboardOpen,
    }));

    if (isKeyboardOpen) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
  }, [isMobile, enableKeyboardHandling]);

  useEffect(() => {
    console.log('🚀 Initializing clean mobile optimizations...', { 
      isMobile, 
      enableAndroidOptimization,
      debugMode,
      optimizationLevel,
      options 
    });

    // Initialize Android optimizations
    if (enableAndroidOptimization) {
      const deviceInfo = androidOptimizations.getDeviceInfo();
      
      console.log('📱 Android optimization initialized:', { 
        deviceInfo,
        currentLevel: androidOptimizations.getCurrentLevel()
      });
      
      // Enable debug mode if requested
      androidOptimizations.enableDebugMode(debugMode);
      
      // Set custom optimization level if specified
      if (optimizationLevel !== undefined) {
        androidOptimizations.setOptimizationLevel(optimizationLevel);
        console.log(`🎛️ Custom optimization level set: ${optimizationLevel}`);
      }
    }

    // Mobile-specific optimizations (simplified)
    if (isMobile) {
      console.log('📱 Applying mobile-specific optimizations...');
      
      // Basic touch optimization without conflicts
      if (enableTouchOptimization) {
        let lastTouchEnd = 0;
        const preventZoom = (e: TouchEvent) => {
          const now = new Date().getTime();
          if (now - lastTouchEnd <= 300) {
            e.preventDefault();
          }
          lastTouchEnd = now;
        };

        document.addEventListener('touchend', preventZoom, { passive: false });
        document.body.style.touchAction = 'pan-y';
        console.log('✅ Touch optimization applied');
      }

      // Simple scroll optimization
      if (optimizeScrolling) {
        document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
        document.body.style.setProperty('overscroll-behavior-y', 'none');
        console.log('✅ Scroll optimization applied');
      }

      // Viewport handling
      if (enableViewportFix) {
        const setViewportHeight = () => {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
          detectKeyboard();
        };

        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
          setTimeout(setViewportHeight, 150);
        });

        if (enableKeyboardHandling) {
          window.addEventListener('focusin', detectKeyboard);
          window.addEventListener('focusout', detectKeyboard);
        }

        console.log('✅ Viewport fix applied');

        return () => {
          if (enableTouchOptimization) {
            const preventZoom = () => {};
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
  }, [isMobile, enableTouchOptimization, optimizeScrolling, enableViewportFix, enableKeyboardHandling, enableAndroidOptimization, debugMode, optimizationLevel, detectKeyboard]);

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
    // Add mobile optimization classes
    if (isMobile) {
      document.body.classList.add('mobile-optimized');
      
      // Add safe area support
      document.body.style.setProperty('padding-top', 'env(safe-area-inset-top)');
      document.body.style.setProperty('padding-bottom', 'env(safe-area-inset-bottom)');
      document.body.style.setProperty('padding-left', 'env(safe-area-inset-left)');
      document.body.style.setProperty('padding-right', 'env(safe-area-inset-right)');
      
      console.log('✅ Mobile optimization classes applied');
    } else {
      document.body.classList.remove('mobile-optimized');
    }

    setIsOptimized(true);
    console.log('🎯 Mobile optimization setup complete');

    return () => {
      document.body.classList.remove('mobile-optimized', 'keyboard-open');
    };
  }, [isMobile]);

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

  // Android-specific controls
  const setAndroidOptimizationLevel = useCallback((level: 0 | 1 | 2 | 3) => {
    if (enableAndroidOptimization) {
      androidOptimizations.setOptimizationLevel(level);
    }
  }, [enableAndroidOptimization]);

  const toggleAndroidDebug = useCallback(() => {
    if (enableAndroidOptimization) {
      androidOptimizations.enableDebugMode(!debugMode);
    }
  }, [enableAndroidOptimization, debugMode]);

  const testAllAndroidLevels = useCallback(() => {
    if (enableAndroidOptimization) {
      androidOptimizations.testAllLevels();
    }
  }, [enableAndroidOptimization]);

  const recalibrateAndroid = useCallback(() => {
    if (enableAndroidOptimization) {
      androidOptimizations.recalibrate();
    }
  }, [enableAndroidOptimization]);

  return {
    isMobile,
    isOptimized,
    viewport,
    isKeyboardOpen: viewport.isKeyboardOpen,
    scrollToTop,
    preventBodyScroll,
    // Android-specific controls
    androidOptimizations: enableAndroidOptimization ? {
      setLevel: setAndroidOptimizationLevel,
      toggleDebug: toggleAndroidDebug,
      testAllLevels: testAllAndroidLevels,
      recalibrate: recalibrateAndroid,
      getDeviceInfo: () => androidOptimizations.getDeviceInfo(),
      getCurrentLevel: () => androidOptimizations.getCurrentLevel()
    } : null,
  };
}
