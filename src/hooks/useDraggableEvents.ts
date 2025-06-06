
import { useCallback, useRef } from 'react';
import { Position, DragState } from './useDraggableTypes';

export const useDraggableEvents = (
  dragState: React.MutableRefObject<DragState>,
  elementRef: React.RefObject<HTMLDivElement>,
  constrainPosition: (pos: Position) => Position,
  updateElementPosition: (pos: Position) => void
) => {
  const animationFrameRef = useRef<number>();

  const preventDefault = (e: Event) => e.preventDefault();

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!dragState.current.isDragging) return;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const newPosition = constrainPosition({
        x: clientX - dragState.current.dragOffset.x,
        y: clientY - dragState.current.dragOffset.y
      });
      
      dragState.current.currentPosition = newPosition;
      updateElementPosition(newPosition);
    });
  }, [constrainPosition, updateElementPosition, dragState]);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!elementRef.current) return;
    
    dragState.current.isDragging = true;
    const rect = elementRef.current.getBoundingClientRect();
    dragState.current.dragOffset = {
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
  }, [dragState, elementRef]);

  const handleEnd = useCallback((onEndCallback: () => void) => {
    if (!dragState.current.isDragging) return;
    
    dragState.current.isDragging = false;
    
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
    
    onEndCallback();
  }, [dragState, elementRef]);

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

  return {
    handleMove,
    handleEnd,
    onMouseDown,
    onTouchStart,
    animationFrameRef
  };
};
