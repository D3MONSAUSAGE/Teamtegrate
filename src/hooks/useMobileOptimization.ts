
import { useEffect, useState, useCallback } from 'react';
import { useIsMobile } from './use-mobile';
import { androidOptimizations } from '@/utils/androidOptimizations';

interface MobileOptimizationOptions {
  enableViewportFix?: boolean;
  enableKeyboardHandling?: boolean;
  enableAndroidOptimization?: boolean;
  debugMode?: boolean;
}

interface ViewportState {
  height: number;
  width: number;
  isKeyboardOpen: boolean;
}

export function useMobileOptimization(options: MobileOptimizationOptions = {}) {
  const {
    enableViewportFix = true,
    enableKeyboardHandling = true,
    enableAndroidOptimization = true,
    debugMode = false
  } = options;

  const isMobile = useIsMobile();
  const [isOptimized, setIsOptimized] = useState(false);
  const [viewport, setViewport] = useState<ViewportState>({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    isKeyboardOpen: false,
  });

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
    console.log('🚀 Initializing NUCLEAR RESET mobile optimizations...', { 
      isMobile, 
      enableAndroidOptimization,
      debugMode
    });

    // Initialize Android optimizations (nuclear reset mode)
    if (enableAndroidOptimization) {
      androidOptimizations.enableDebugMode(debugMode);
      console.log('📱 Android nuclear reset applied');
    }

    // Minimal mobile optimizations only
    if (isMobile) {
      console.log('📱 Applying minimal mobile optimizations...');
      
      // Simple viewport handling without conflicts
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

        console.log('✅ Minimal viewport fix applied');

        return () => {
          window.removeEventListener('resize', setViewportHeight);
          window.removeEventListener('orientationchange', setViewportHeight);
          if (enableKeyboardHandling) {
            window.removeEventListener('focusin', detectKeyboard);
            window.removeEventListener('focusout', detectKeyboard);
          }
        };
      }
    }
  }, [isMobile, enableViewportFix, enableKeyboardHandling, enableAndroidOptimization, debugMode, detectKeyboard]);

  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-optimized');
      console.log('✅ Mobile optimization classes applied (nuclear reset mode)');
    } else {
      document.body.classList.remove('mobile-optimized');
    }

    setIsOptimized(true);
    console.log('🎯 Nuclear reset mobile optimization setup complete');

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

  return {
    isMobile,
    isOptimized,
    viewport,
    isKeyboardOpen: viewport.isKeyboardOpen,
    scrollToTop,
    preventBodyScroll,
    androidOptimizations: enableAndroidOptimization ? {
      getDeviceInfo: () => androidOptimizations.getDeviceInfo(),
      getCurrentLevel: () => androidOptimizations.getCurrentLevel(),
      enableDebug: (enable: boolean) => androidOptimizations.enableDebugMode(enable)
    } : null,
  };
}
