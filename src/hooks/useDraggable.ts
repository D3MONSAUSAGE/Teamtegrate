
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

export const useDraggable = (initialPosition?: Position) => {
  const [position, setPosition] = useState<Position>(initialPosition || { x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    hasMoved: false,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });

  const dragRef = useRef<HTMLDivElement>(null);
  const startPositionRef = useRef<Position>({ x: 0, y: 0 });

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current) return;

    const rect = dragRef.current.getBoundingClientRect();
    const startPos = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };

    startPositionRef.current = startPos;
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

    // Check if moved enough to be considered a drag
    const moved = Math.abs(constrainedX - position.x) > 3 || Math.abs(constrainedY - position.y) > 3;

    setPosition({ x: constrainedX, y: constrainedY });
    setDragState(prev => ({
      ...prev,
      hasMoved: moved || prev.hasMoved,
      currentPosition: { x: constrainedX, y: constrainedY }
    }));
  }, [dragState.isDragging, position]);

  const handleEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

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
