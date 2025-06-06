
import { useState, useRef, useEffect, useCallback } from 'react';
import { Position, UseDraggableOptions, DragState } from './useDraggableTypes';
import { useDraggableUtils } from './useDraggableUtils';
import { useDraggableEvents } from './useDraggableEvents';

export const useDraggable = (options: UseDraggableOptions = {}) => {
  const dragState = useRef<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  });
  const elementRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  
  const {
    getInitialPosition,
    constrainPosition,
    savePosition,
    snapToEdges
  } = useDraggableUtils(options);

  const [position, setPosition] = useState<Position>(() => getInitialPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const updateElementPosition = useCallback((pos: Position) => {
    if (elementRef.current) {
      elementRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    // Snap to edges if close
    const finalPosition = snapToEdges(dragState.current.currentPosition);
    
    // Update all position references
    dragState.current.currentPosition = finalPosition;
    updateElementPosition(finalPosition);
    setPosition(finalPosition);
    savePosition(finalPosition);
    setIsDragging(false);
    setIsLongPressing(false);
  }, [snapToEdges, updateElementPosition, savePosition]);

  const {
    handleMove,
    handleEnd,
    onMouseDown,
    onTouchStart,
    animationFrameRef
  } = useDraggableEvents(
    dragState,
    elementRef,
    constrainPosition,
    updateElementPosition,
    () => setIsDragging(true),
    setIsLongPressing
  );

  // Global event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleMove(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleEnd(handleDragEnd);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleEnd(handleDragEnd);
    };

    if (dragState.current.isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false, capture: true });
      document.addEventListener('mouseup', handleMouseUp, { passive: false, capture: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
      document.addEventListener('touchcancel', handleTouchEnd, { passive: false, capture: true });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('mouseup', handleMouseUp, true);
      document.removeEventListener('touchmove', handleTouchMove, true);
      document.removeEventListener('touchend', handleTouchEnd, true);
      document.removeEventListener('touchcancel', handleTouchEnd, true);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMove, handleEnd, handleDragEnd, animationFrameRef]);

  // Initialize position only once
  useEffect(() => {
    if (!isInitialized.current && elementRef.current) {
      const initialPos = getInitialPosition();
      dragState.current.currentPosition = initialPos;
      updateElementPosition(initialPos);
      setPosition(initialPos);
      isInitialized.current = true;
    }
  }, [getInitialPosition, updateElementPosition]);

  const resetPosition = useCallback(() => {
    const defaultPos = getInitialPosition();
    dragState.current.currentPosition = defaultPos;
    updateElementPosition(defaultPos);
    setPosition(defaultPos);
    savePosition(defaultPos);
  }, [getInitialPosition, updateElementPosition, savePosition]);

  return {
    position,
    elementRef,
    onMouseDown,
    onTouchStart,
    resetPosition,
    isDragging,
    isLongPressing
  };
};
