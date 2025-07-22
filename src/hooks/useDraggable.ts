
import { useState, useRef, useCallback, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  hasMoved: boolean;
  startPosition: Position;
  currentPosition: Position;
}

interface BoundaryConstraints {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

interface UseDraggableOptions {
  x?: number;
  y?: number;
  threshold?: number;
  width?: number;
  height?: number;
  boundaries?: BoundaryConstraints;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const threshold = options.threshold || 8;
  const elementWidth = options.width || 56; // Default FAB size
  const elementHeight = options.height || 56;
  
  const [position, setPosition] = useState<Position>(() => ({
    x: options.x || 0,
    y: options.y || 0
  }));
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    hasMoved: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });

  const dragRef = useRef<HTMLDivElement>(null);
  const startPositionRef = useRef<Position>({ x: 0, y: 0 });
  const initialMousePositionRef = useRef<Position>({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update position when options change
  useEffect(() => {
    if (options.x !== undefined && options.y !== undefined) {
      setPosition({ x: options.x, y: options.y });
    }
  }, [options.x, options.y]);

  const getBoundaryConstraints = useCallback(() => {
    const defaults = {
      top: options.boundaries?.top || 16,
      bottom: options.boundaries?.bottom || 16,
      left: options.boundaries?.left || 16,
      right: options.boundaries?.right || 16
    };

    return {
      minX: defaults.left,
      maxX: window.innerWidth - elementWidth - defaults.right,
      minY: defaults.top,
      maxY: window.innerHeight - elementHeight - defaults.bottom
    };
  }, [elementWidth, elementHeight, options.boundaries]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;

    const rect = dragRef.current.getBoundingClientRect();
    const startPos = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    startPositionRef.current = startPos;
    initialMousePositionRef.current = { x: clientX, y: clientY };
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      hasMoved: false,
      startPosition: startPos,
      currentPosition: startPos
    }));

    options.onDragStart?.();
  }, [options]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;

    const deltaX = clientX - initialMousePositionRef.current.x;
    const deltaY = clientY - initialMousePositionRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only start actual dragging if moved beyond threshold
    if (distance < threshold && !dragState.hasMoved) {
      return;
    }

    const boundaries = getBoundaryConstraints();
    
    // Calculate new position relative to current position
    const newX = position.x + deltaX;
    const newY = position.y + deltaY;

    // Apply boundary constraints with buffer zones
    const constrainedX = Math.max(boundaries.minX, Math.min(newX, boundaries.maxX));
    const constrainedY = Math.max(boundaries.minY, Math.min(newY, boundaries.maxY));

    setPosition({ x: constrainedX, y: constrainedY });
    
    // Update initial mouse position for next move calculation
    initialMousePositionRef.current = { x: clientX, y: clientY };
    
    if (!dragState.hasMoved) {
      setDragState(prev => ({
        ...prev,
        hasMoved: true,
        currentPosition: { x: constrainedX, y: constrainedY }
      }));
    }
  }, [dragState.isDragging, dragState.hasMoved, threshold, position, getBoundaryConstraints]);

  const handleEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));
    
    options.onDragEnd?.();
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Reset hasMoved after a delay to allow click handlers to check it
    timeoutRef.current = setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        hasMoved: false
      }));
    }, 100);
  }, [options]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  // Global mouse/touch move and end events
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => handleEnd();
    const handleTouchEnd = () => handleEnd();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragState.isDragging, handleMove, handleEnd]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    dragRef,
    position,
    isDragging: dragState.isDragging,
    hasMoved: dragState.hasMoved,
    dragHandlers: {
      onMouseDown: handleMouseDown,
      onTouchStart: handleTouchStart,
    }
  };
};
