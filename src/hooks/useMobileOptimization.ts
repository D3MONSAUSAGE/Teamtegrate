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
    console.log('🚀 Initializing mobile optimizations with blur fixes...', { 
      isMobile, 
      enableAndroidOptimization,
      options 
    });

    // Initialize Android optimizations with blur fixes if enabled
    if (enableAndroidOptimization) {
      const deviceInfo = androidOptimizations.getDeviceInfo();
      const strategy = androidOptimizations.getRenderingStrategy();
      
      console.log('📱 Android blur fix optimization initialized:', { 
        deviceInfo, 
        strategy,
        blurFixApplied: deviceInfo.isAndroid 
      });
      
      // Apply device-specific classes immediately for blur prevention
      if (deviceInfo.isAndroid) {
        document.body.classList.add('android-blur-fix');
        console.log('✅ Android blur fix class applied immediately');
        
        if (deviceInfo.isWebView) {
          document.body.classList.add('webview-blur-fix');
          console.log('✅ WebView blur fix class applied immediately');
        }
        
        // Apply manufacturer-specific blur fixes
        if (deviceInfo.manufacturer === 'samsung') {
          document.body.classList.add('samsung-blur-fix');
          console.log('✅ Samsung blur fix class applied immediately');
        }
        
        // Force recalibration to ensure all blur fixes are applied
        setTimeout(() => {
          androidOptimizations.recalibrate();
          console.log('🔄 Android blur fixes recalibrated after initialization');
        }, 100);
      }
    }

    // Mobile-specific optimizations
    if (isMobile) {
      console.log('📱 Applying mobile-specific optimizations with blur prevention...');
      
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
        document.body.style.touchAction = 'pan-y';
        console.log('✅ Touch optimization applied (blur-safe)');
      }

      // Optimize scrolling performance without causing blur
      if (optimizeScrolling) {
        document.body.style.setProperty('-webkit-overflow-scrolling', 'touch');
        document.body.style.setProperty('overscroll-behavior-y', 'none');
        // Use smooth scrolling only if not on problematic Android devices
        const deviceInfo = androidOptimizations.getDeviceInfo();
        if (!deviceInfo.isAndroid || deviceInfo.chromeVersion >= 80) {
          document.body.style.setProperty('scroll-behavior', 'smooth');
        }
        console.log('✅ Scroll optimization applied (Android-safe)');
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
          setTimeout(setViewportHeight, 150);
        });

        if (enableKeyboardHandling) {
          window.addEventListener('focusin', detectKeyboard);
          window.addEventListener('focusout', detectKeyboard);
        }

        console.log('✅ Viewport fix applied');

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
    // Add mobile optimization classes to body with blur fix integration
    if (isMobile) {
      document.body.classList.add('mobile-optimized');
      
      // Ensure Android blur fixes are maintained
      if (enableAndroidOptimization) {
        const deviceInfo = androidOptimizations.getDeviceInfo();
        if (deviceInfo.isAndroid && !document.body.classList.contains('android-blur-fix')) {
          console.log('🔄 Re-applying Android blur fix classes...');
          androidOptimizations.recalibrate();
        }
      }
      
      // Add safe area support
      document.body.style.setProperty('padding-top', 'env(safe-area-inset-top)');
      document.body.style.setProperty('padding-bottom', 'env(safe-area-inset-bottom)');
      document.body.style.setProperty('padding-left', 'env(safe-area-inset-left)');
      document.body.style.setProperty('padding-right', 'env(safe-area-inset-right)');
      
      console.log('✅ Mobile optimization classes applied with blur fix integration');
    } else {
      document.body.classList.remove('mobile-optimized');
    }

    setIsOptimized(true);
    console.log('🎯 Mobile optimization with blur fixes setup complete');

    return () => {
      document.body.classList.remove(
        'mobile-optimized', 
        'keyboard-open', 
        'android-blur-fix', 
        'webview-blur-fix',
        'samsung-blur-fix'
      );
    };
  }, [isMobile, enableAndroidOptimization]);

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
    
    if (strategy.useHardwareAcceleration && !deviceInfo.isAndroid) {
      element.classList.add('hw-accelerated');
      console.log('🚀 Hardware acceleration enabled for element');
    } else {
      console.log('⏭️ Hardware acceleration skipped to prevent blur');
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
