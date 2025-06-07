
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { Position, UseDraggableOptions } from './useDraggableTypes';

export const useDraggableUtils = (options: UseDraggableOptions) => {
  const location = useLocation();
  const isMobile = useIsMobile();

  const getInitialPosition = useCallback((): Position => {
    const isChatPage = location.pathname.includes('/chat');
    const buttonSize = 48; // Actual button size (h-12 w-12)
    
    if (options.storageKey) {
      const stored = localStorage.getItem(options.storageKey);
      if (stored) {
        try {
          const position = JSON.parse(stored);
          // Validate the stored position is still within bounds
          const margin = isMobile ? 0 : 20;
          if (position.x >= margin && 
              position.x <= window.innerWidth - buttonSize - margin && 
              position.y >= margin && 
              position.y <= window.innerHeight - buttonSize - margin) {
            return position;
          }
        } catch (e) {
          // Invalid JSON, fall through to default
        }
      }
    }
    
    const margin = isMobile ? 0 : 20;
    
    if (isChatPage) {
      return { x: margin, y: margin };
    }
    
    return options.defaultPosition || { 
      x: window.innerWidth - buttonSize - margin, 
      y: window.innerHeight - buttonSize - margin 
    };
  }, [location.pathname, options.defaultPosition, options.storageKey, isMobile]);

  const constrainPosition = useCallback((pos: Position): Position => {
    const buttonSize = 48; // Actual button size
    const margin = isMobile ? 0 : 20;
    
    const bounds = options.boundaries || {
      top: margin,
      left: margin,
      right: window.innerWidth - buttonSize - margin,
      bottom: window.innerHeight - buttonSize - margin
    };
    
    return {
      x: Math.max(bounds.left, Math.min(pos.x, bounds.right)),
      y: Math.max(bounds.top, Math.min(pos.y, bounds.bottom))
    };
  }, [options.boundaries, isMobile]);

  const savePosition = useCallback((pos: Position) => {
    if (options.storageKey) {
      localStorage.setItem(options.storageKey, JSON.stringify(pos));
    }
  }, [options.storageKey]);

  const snapToEdges = useCallback((currentPos: Position): Position => {
    const snapThreshold = 50;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonSize = 48; // Actual button size
    const margin = isMobile ? 0 : 20; // No margin on mobile, 20px on desktop
    
    let finalPosition = { ...currentPos };
    
    // Snap to left edge
    if (finalPosition.x < snapThreshold) {
      finalPosition.x = margin;
    }
    // Snap to right edge
    else if (finalPosition.x > viewportWidth - snapThreshold - buttonSize) {
      finalPosition.x = viewportWidth - buttonSize - margin;
    }
    
    // Snap to top edge
    if (finalPosition.y < snapThreshold) {
      finalPosition.y = margin;
    }
    // Snap to bottom edge
    else if (finalPosition.y > viewportHeight - snapThreshold - buttonSize) {
      finalPosition.y = viewportHeight - buttonSize - margin;
    }
    
    return finalPosition;
  }, [isMobile]);

  return {
    getInitialPosition,
    constrainPosition,
    savePosition,
    snapToEdges
  };
};
