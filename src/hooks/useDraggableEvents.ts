
import { useCallback, useRef } from 'react';
import { Position, DragState } from './useDraggableTypes';

export const useDraggableEvents = (
  dragState: React.MutableRefObject<DragState>,
  elementRef: React.RefObject<HTMLDivElement>,
  constrainPosition: (pos: Position) => Position,
  updateElementPosition: (pos: Position) => void,
  onDragStart?: () => void
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

  const handleStart = useCallback((clientX: number, clientY: number, e: Event) => {
    if (!elementRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    dragState.current.isDragging = true;
    const rect = elementRef.current.getBoundingClientRect();
    dragState.current.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    // Call onDragStart callback
    if (onDragStart) {
      onDragStart();
    }
    
    // Add visual feedback and performance hints
    if (elementRef.current) {
      elementRef.current.style.cursor = 'grabbing';
      elementRef.current.style.willChange = 'transform';
      elementRef.current.style.userSelect = 'none';
    }
    document.body.style.userSelect = 'none';
    
    // Prevent default to avoid conflicts
    document.addEventListener('selectstart', preventDefault, { passive: false });
  }, [dragState, elementRef, onDragStart]);

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
    handleStart(e.clientX, e.clientY, e.nativeEvent);
  }, [handleStart]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, e.nativeEvent);
  }, [handleStart]);

  return {
    handleMove,
    handleEnd,
    onMouseDown,
    onTouchStart,
    animationFrameRef
  };
};
