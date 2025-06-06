
import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Position, UseDraggableOptions } from './useDraggableTypes';

export const useDraggableUtils = (options: UseDraggableOptions) => {
  const location = useLocation();

  const getInitialPosition = useCallback((): Position => {
    const isChatPage = location.pathname.includes('/chat');
    
    if (options.storageKey) {
      const stored = localStorage.getItem(options.storageKey);
      if (stored) {
        try {
          const position = JSON.parse(stored);
          // Validate the stored position is still within bounds
          const elementWidth = 80;
          const elementHeight = 80;
          if (position.x >= 20 && 
              position.x <= window.innerWidth - elementWidth && 
              position.y >= 20 && 
              position.y <= window.innerHeight - elementHeight) {
            return position;
          }
        } catch (e) {
          // Invalid JSON, fall through to default
        }
      }
    }
    
    if (isChatPage) {
      return { x: 20, y: 20 };
    }
    
    return options.defaultPosition || { x: window.innerWidth - 100, y: window.innerHeight - 100 };
  }, [location.pathname, options.defaultPosition, options.storageKey]);

  const constrainPosition = useCallback((pos: Position): Position => {
    const elementWidth = 80;
    const elementHeight = 80;
    
    const bounds = options.boundaries || {
      top: 20,
      left: 20,
      right: window.innerWidth - elementWidth,
      bottom: window.innerHeight - elementHeight
    };
    
    return {
      x: Math.max(bounds.left, Math.min(pos.x, bounds.right)),
      y: Math.max(bounds.top, Math.min(pos.y, bounds.bottom))
    };
  }, [options.boundaries]);

  const savePosition = useCallback((pos: Position) => {
    if (options.storageKey) {
      localStorage.setItem(options.storageKey, JSON.stringify(pos));
    }
  }, [options.storageKey]);

  const snapToEdges = useCallback((currentPos: Position): Position => {
    const snapThreshold = 50;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const elementWidth = 80;
    const elementHeight = 80;
    
    let finalPosition = { ...currentPos };
    
    // Snap to left edge
    if (finalPosition.x < snapThreshold) {
      finalPosition.x = 20;
    }
    // Snap to right edge
    else if (finalPosition.x > viewportWidth - snapThreshold - elementWidth) {
      finalPosition.x = viewportWidth - elementWidth - 20;
    }
    
    // Snap to top edge
    if (finalPosition.y < snapThreshold) {
      finalPosition.y = 20;
    }
    // Snap to bottom edge
    else if (finalPosition.y > viewportHeight - snapThreshold - elementHeight) {
      finalPosition.y = viewportHeight - elementHeight - 20;
    }
    
    return finalPosition;
  }, []);

  return {
    getInitialPosition,
    constrainPosition,
    savePosition,
    snapToEdges
  };
};
