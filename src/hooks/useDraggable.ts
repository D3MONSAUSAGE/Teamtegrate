
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
  const animationFrameRef = useRef<number>();
  const currentPosition = useRef({ x: 0, y: 0 });
  
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

  const [position, setPosition] = useState<Position>(getInitialPosition);

  useEffect(() => {
    const newPosition = getInitialPosition();
    setPosition(newPosition);
    currentPosition.current = newPosition;
  }, [getInitialPosition]);

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

  const updateElementPosition = useCallback((pos: Position) => {
    if (elementRef.current) {
      elementRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const newPosition = constrainPosition({
        x: clientX - dragOffset.current.x,
        y: clientY - dragOffset.current.y
      });
      
      currentPosition.current = newPosition;
      updateElementPosition(newPosition);
    });
  }, [constrainPosition, updateElementPosition]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!elementRef.current) return;
    
    isDragging.current = true;
    const rect = elementRef.current.getBoundingClientRect();
    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    // Add visual feedback and performance hints
    if (elementRef.current) {
      elementRef.current.style.cursor = 'grabbing';
      elementRef.current.style.willChange = 'transform';
      elementRef.current.style.userSelect = 'none';
    }
    document.body.style.userSelect = 'none';
    
    // Prevent default to avoid conflicts
    document.addEventListener('selectstart', preventDefault, { passive: false });
  }, []);

  const preventDefault = (e: Event) => e.preventDefault();

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    isDragging.current = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (elementRef.current) {
      elementRef.current.style.cursor = 'grab';
      elementRef.current.style.willChange = 'auto';
      elementRef.current.style.userSelect = '';
    }
    document.body.style.userSelect = '';
    document.removeEventListener('selectstart', preventDefault);
    
    // Snap to edges if close
    const snapThreshold = 50;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalPosition = { ...currentPosition.current };
    
    if (finalPosition.x < snapThreshold) finalPosition.x = 20;
    if (finalPosition.x > viewportWidth - snapThreshold - 80) finalPosition.x = viewportWidth - 100;
    if (finalPosition.y < snapThreshold) finalPosition.y = 20;
    if (finalPosition.y > viewportHeight - snapThreshold - 80) finalPosition.y = viewportHeight - 100;
    
    // Update both the visual position and React state
    currentPosition.current = finalPosition;
    updateElementPosition(finalPosition);
    setPosition(finalPosition);
    savePosition(finalPosition);
  }, [updateElementPosition, savePosition]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  // Global event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      handleEnd();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleEnd();
    };

    if (isDragging.current) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMove, handleEnd]);

  // Initialize position with transform
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      currentPosition.current = position;
    }
  }, [position]);

  const resetPosition = useCallback(() => {
    const defaultPos = getInitialPosition();
    setPosition(defaultPos);
    currentPosition.current = defaultPos;
    updateElementPosition(defaultPos);
    savePosition(defaultPos);
  }, [getInitialPosition, updateElementPosition, savePosition]);

  return {
    position,
    elementRef,
    onMouseDown,
    onTouchStart,
    resetPosition,
    isDragging: isDragging.current
  };
};
