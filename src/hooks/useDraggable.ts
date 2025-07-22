
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

interface UseDraggableOptions {
  x?: number;
  y?: number;
  threshold?: number; // Movement threshold to distinguish drag from click
}

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const threshold = options.threshold || 5; // 5px movement threshold
  
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
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.isDragging || !dragRef.current) return;

    // Calculate distance moved from initial position
    const deltaX = clientX - initialMousePositionRef.current.x;
    const deltaY = clientY - initialMousePositionRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only start actual dragging if moved beyond threshold
    if (distance < threshold && !dragState.hasMoved) {
      return;
    }

    const rect = dragRef.current.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const newX = clientX - rect.left - startPositionRef.current.x;
    const newY = clientY - rect.top - startPositionRef.current.y;

    // Boundary constraints
    const elementRect = dragRef.current.getBoundingClientRect();
    const maxX = window.innerWidth - elementRect.width;
    const maxY = window.innerHeight - elementRect.height;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: constrainedX, y: constrainedY });
    setDragState(prev => ({
      ...prev,
      hasMoved: true,
      currentPosition: { x: constrainedX, y: constrainedY }
    }));
  }, [dragState.isDragging, dragState.hasMoved, threshold]);

  const handleEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));
    
    // Reset hasMoved after a short delay to allow click handlers to check it
    setTimeout(() => {
      setDragState(prev => ({
        ...prev,
        hasMoved: false
      }));
    }, 50);
  }, []);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't prevent default immediately - let click events work
    handleStart(e.clientX, e.clientY);
  }, [handleStart]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't prevent default immediately - let click events work
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  }, [handleStart]);

  // Global mouse/touch move and end events
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault(); // Only prevent default during actual dragging
      handleMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Only prevent default if we're actually dragging (moved beyond threshold)
      if (dragState.hasMoved) {
        e.preventDefault();
      }
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
  }, [dragState.isDragging, dragState.hasMoved, handleMove, handleEnd]);

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
