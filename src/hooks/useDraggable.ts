
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  defaultPosition?: Position;
  storageKey?: string;
  boundaries?: {
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
}

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const location = useLocation();
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const elementRef = useRef<HTMLDivElement>(null);
  
  const getInitialPosition = useCallback((): Position => {
    // Smart positioning based on current route
    const isChatPage = location.pathname.includes('/chat');
    
    if (options.storageKey) {
      const stored = localStorage.getItem(options.storageKey);
      if (stored) {
        const position = JSON.parse(stored);
        // If on chat page and position is in bottom right, move to top left
        if (isChatPage && position.x > window.innerWidth - 200 && position.y > window.innerHeight - 200) {
          return { x: 20, y: 20 };
        }
        return position;
      }
    }
    
    // Default positions based on page type
    if (isChatPage) {
      return { x: 20, y: 20 }; // Top left for chat pages
    }
    
    return options.defaultPosition || { x: window.innerWidth - 80, y: window.innerHeight - 80 };
  }, [location.pathname, options.defaultPosition, options.storageKey]);

  const [position, setPosition] = useState<Position>(getInitialPosition);

  // Update position when route changes
  useEffect(() => {
    const newPosition = getInitialPosition();
    setPosition(newPosition);
  }, [getInitialPosition]);

  const constrainPosition = useCallback((pos: Position): Position => {
    if (!options.boundaries) return pos;
    
    return {
      x: Math.max(options.boundaries.left, Math.min(pos.x, options.boundaries.right)),
      y: Math.max(options.boundaries.top, Math.min(pos.y, options.boundaries.bottom))
    };
  }, [options.boundaries]);

  const savePosition = useCallback((pos: Position) => {
    if (options.storageKey) {
      localStorage.setItem(options.storageKey, JSON.stringify(pos));
    }
  }, [options.storageKey]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!elementRef.current) return;
    
    isDragging.current = true;
    const rect = elementRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    // Add visual feedback
    elementRef.current.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    
    const newPosition = constrainPosition({
      x: clientX - dragOffset.current.x,
      y: clientY - dragOffset.current.y
    });
    
    setPosition(newPosition);
  }, [constrainPosition]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    if (elementRef.current) {
      elementRef.current.style.cursor = 'grab';
    }
    document.body.style.userSelect = '';
    
    // Snap to edges if close
    const snapThreshold = 50;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    setPosition(prev => {
      let newPos = { ...prev };
      
      // Snap to edges
      if (newPos.x < snapThreshold) newPos.x = 20;
      if (newPos.x > viewportWidth - snapThreshold - 80) newPos.x = viewportWidth - 100;
      if (newPos.y < snapThreshold) newPos.y = 20;
      if (newPos.y > viewportHeight - snapThreshold - 80) newPos.y = viewportHeight - 100;
      
      savePosition(newPos);
      return newPos;
    });
  }, [savePosition]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  // Global event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    if (isDragging.current) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [handleMove, handleEnd]);

  const resetPosition = useCallback(() => {
    const defaultPos = getInitialPosition();
    setPosition(defaultPos);
    savePosition(defaultPos);
  }, [getInitialPosition, savePosition]);

  return {
    position,
    elementRef,
    onMouseDown,
    onTouchStart,
    resetPosition,
    isDragging: isDragging.current
  };
};
