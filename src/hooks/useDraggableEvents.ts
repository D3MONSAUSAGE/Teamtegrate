
import { useCallback, useRef } from 'react';
import { Position, DragState } from './useDraggableTypes';

export const useDraggableEvents = (
  dragState: React.MutableRefObject<DragState>,
  elementRef: React.RefObject<HTMLDivElement>,
  constrainPosition: (pos: Position) => Position,
  updateElementPosition: (pos: Position) => void,
  onDragStart?: () => void,
  setIsLongPressing?: (value: boolean) => void
) => {
  const animationFrameRef = useRef<number>();
  const longPressTimer = useRef<number>();
  const startPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const isDragOperation = useRef(false);

  const preventDefault = (e: Event) => e.preventDefault();

  const LONG_PRESS_DURATION = 500; // 500ms for long press
  const MOVEMENT_THRESHOLD = 5; // 5px movement threshold

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const deltaX = Math.abs(clientX - startPosition.current.x);
    const deltaY = Math.abs(clientY - startPosition.current.y);
    
    if (!hasMoved.current && (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD)) {
      hasMoved.current = true;
      isDragOperation.current = true;
      clearLongPressTimer();
      setIsLongPressing?.(false);
      
      // Start dragging on any movement
      if (!dragState.current.isDragging) {
        dragState.current.isDragging = true;
        if (onDragStart) {
          onDragStart();
        }
      }
    }
    
    // Only continue if we're dragging
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
  }, [constrainPosition, updateElementPosition, dragState, onDragStart, clearLongPressTimer, setIsLongPressing]);

  const handleStart = useCallback((clientX: number, clientY: number, e: Event) => {
    if (!elementRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Reset state
    hasMoved.current = false;
    isDragOperation.current = false;
    startPosition.current = { x: clientX, y: clientY };
    
    const rect = elementRef.current.getBoundingClientRect();
    dragState.current.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    // For touch devices, start long press timer
    if ('ontouchstart' in window && e.type.startsWith('touch')) {
      setIsLongPressing?.(true);
      longPressTimer.current = window.setTimeout(() => {
        if (!hasMoved.current) {
          dragState.current.isDragging = true;
          isDragOperation.current = true;
          if (onDragStart) {
            onDragStart();
          }
        }
        setIsLongPressing?.(false);
      }, LONG_PRESS_DURATION);
    }
    
    // Add visual feedback and performance hints
    if (elementRef.current) {
      elementRef.current.style.userSelect = 'none';
    }
    document.body.style.userSelect = 'none';
    
    // Prevent default to avoid conflicts
    document.addEventListener('selectstart', preventDefault, { passive: false });
  }, [dragState, elementRef, onDragStart, setIsLongPressing]);

  const handleEnd = useCallback((onEndCallback: () => void) => {
    clearLongPressTimer();
    setIsLongPressing?.(false);
    
    const wasDragging = dragState.current.isDragging;
    
    if (!wasDragging) {
      // Clean up if we never started dragging
      if (elementRef.current) {
        elementRef.current.style.userSelect = '';
      }
      document.body.style.userSelect = '';
      document.removeEventListener('selectstart', preventDefault);
      return;
    }
    
    dragState.current.isDragging = false;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (elementRef.current) {
      elementRef.current.style.userSelect = '';
    }
    document.body.style.userSelect = '';
    document.removeEventListener('selectstart', preventDefault);
    
    onEndCallback();
  }, [dragState, elementRef, clearLongPressTimer, setIsLongPressing]);

  // Check if the last interaction was a drag operation
  const wasLastInteractionDrag = useCallback(() => {
    return isDragOperation.current;
  }, []);

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
    animationFrameRef,
    wasLastInteractionDrag
  };
};
