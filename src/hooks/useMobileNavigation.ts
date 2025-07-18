
import { useCallback, useEffect, useState } from 'react';
import { useIsMobile } from './use-mobile';

interface MobileNavigationOptions {
  enableSwipeGestures?: boolean;
  swipeThreshold?: number;
  enableBackButton?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwipping: boolean;
}

export function useMobileNavigation(options: MobileNavigationOptions = {}) {
  const {
    enableSwipeGestures = true,
    swipeThreshold = 50,
    enableBackButton = true,
  } = options;

  const isMobile = useIsMobile();
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwipping: false,
  });

  const [isNavigating, setIsNavigating] = useState(false);

  // Handle swipe gestures
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableSwipeGestures || !isMobile) return;
    
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwipping: true,
    });
  }, [enableSwipeGestures, isMobile]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enableSwipeGestures || !isMobile || !swipeState.isSwipping) return;
    
    const touch = e.touches[0];
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
    }));
  }, [enableSwipeGestures, isMobile, swipeState.isSwipping]);

  const handleTouchEnd = useCallback(() => {
    if (!enableSwipeGestures || !isMobile || !swipeState.isSwipping) return;
    
    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaY = swipeState.currentY - swipeState.startY;
    
    // Check if it's a horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      const direction = deltaX > 0 ? 'right' : 'left';
      
      // Dispatch custom event for swipe
      window.dispatchEvent(new CustomEvent('mobileSwipe', {
        detail: { direction, deltaX, deltaY }
      }));
    }
    
    setSwipeState(prev => ({ ...prev, isSwipping: false }));
  }, [enableSwipeGestures, isMobile, swipeState, swipeThreshold]);

  // Handle mobile back button
  const handleBackButton = useCallback((callback: () => void) => {
    if (!enableBackButton || !isMobile) return;
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      callback();
    };
    
    // Add state to history
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enableBackButton, isMobile]);

  // Setup touch event listeners
  useEffect(() => {
    if (!enableSwipeGestures || !isMobile) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableSwipeGestures, isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Prevent zoom on double tap
  useEffect(() => {
    if (!isMobile) return;
    
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    
    document.addEventListener('touchend', preventZoom, { passive: false });
    
    return () => {
      document.removeEventListener('touchend', preventZoom);
    };
  }, [isMobile]);

  // Navigation helper functions
  const safeNavigate = useCallback((callback: () => void, delay = 150) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    setTimeout(() => {
      callback();
      setIsNavigating(false);
    }, delay);
  }, [isNavigating]);

  return {
    isMobile,
    isSwipping: swipeState.isSwipping,
    isNavigating,
    safeNavigate,
    handleBackButton,
    swipeDirection: {
      deltaX: swipeState.currentX - swipeState.startX,
      deltaY: swipeState.currentY - swipeState.startY,
    },
  };
}
