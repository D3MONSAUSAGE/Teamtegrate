
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
  const isMouseEvent = useRef(false);

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
    console.log('handleMove called', { isDragging: dragState.current.isDragging, clientX, clientY });
    
    // Only continue if we're dragging
    if (!dragState.current.isDragging) return;
    
    const deltaX = Math.abs(clientX - startPosition.current.x);
    const deltaY = Math.abs(clientY - startPosition.current.y);
    
    // Track if we've moved beyond threshold for click vs drag detection
    if (!hasMoved.current && (deltaX > MOVEMENT_THRESHOLD || deltaY > MOVEMENT_THRESHOLD)) {
      hasMoved.current = true;
      isDragOperation.current = true;
      console.log('Movement detected, marking as drag operation');
    }
    
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
      console.log('Updated position:', newPosition);
    });
  }, [constrainPosition, updateElementPosition, dragState]);

  const startDragging = useCallback(() => {
    if (!dragState.current.isDragging) {
      console.log('Starting drag operation');
      dragState.current.isDragging = true;
      if (onDragStart) {
        onDragStart();
      }
    }
  }, [dragState, onDragStart]);

  const handleStart = useCallback((clientX: number, clientY: number, e: Event) => {
    if (!elementRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('handleStart called', { type: e.type });
    
    // Reset state
    hasMoved.current = false;
    isDragOperation.current = false;
    isMouseEvent.current = e.type.startsWith('mouse');
    startPosition.current = { x: clientX, y: clientY };
    
    const rect = elementRef.current.getBoundingClientRect();
    dragState.current.dragOffset = {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
    
    // For mouse events, start dragging immediately
    if (isMouseEvent.current) {
      console.log('Mouse event - starting drag immediately');
      startDragging();
    } else {
      // For touch events, use long press
      console.log('Touch event - starting long press timer');
      setIsLongPressing?.(true);
      longPressTimer.current = window.setTimeout(() => {
        console.log('Long press timer fired');
        startDragging();
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
  }, [dragState, elementRef, startDragging, setIsLongPressing]);

  const handleEnd = useCallback((onEndCallback: () => void) => {
    console.log('handleEnd called', { wasDragging: dragState.current.isDragging });
    
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
    console.log('onMouseDown called');
    handleStart(e.clientX, e.clientY, e.nativeEvent);
  }, [handleStart]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    console.log('onTouchStart called');
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
