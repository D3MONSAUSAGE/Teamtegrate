
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
        const position = JSON.parse(stored);
        if (isChatPage && position.x > window.innerWidth - 200 && position.y > window.innerHeight - 200) {
          return { x: 20, y: 20 };
        }
        return position;
      }
    }
    
    if (isChatPage) {
      return { x: 20, y: 20 };
    }
    
    return options.defaultPosition || { x: window.innerWidth - 80, y: window.innerHeight - 80 };
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
    
    let finalPosition = { ...currentPos };
    
    if (finalPosition.x < snapThreshold) finalPosition.x = 20;
    if (finalPosition.x > viewportWidth - snapThreshold - 80) finalPosition.x = viewportWidth - 100;
    if (finalPosition.y < snapThreshold) finalPosition.y = 20;
    if (finalPosition.y > viewportHeight - snapThreshold - 80) finalPosition.y = viewportHeight - 100;
    
    return finalPosition;
  }, []);

  return {
    getInitialPosition,
    constrainPosition,
    savePosition,
    snapToEdges
  };
};
