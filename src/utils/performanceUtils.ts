
import React, { useCallback, useRef, useMemo } from 'react';

// Enhanced debounce utility with better memory management
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T, 
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);
  
  // Update callback ref when callback changes
  callbackRef.current = callback;

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
};

// Optimized throttle utility
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T, 
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);
  
  callbackRef.current = callback;

  return useCallback((...args: any[]) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callbackRef.current(...args);
    }
  }, [delay]) as T;
};

// Performance logging utility (only in development)
export const perfLog = (operation: string, startTime?: number) => {
  if (process.env.NODE_ENV === 'development') {
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`⚡ ${operation} took ${duration.toFixed(2)}ms`);
    } else {
      return performance.now();
    }
  }
};

// Enhanced memoization helper with better equality checking
export const createMemoizedSelector = <T, R>(
  selector: (input: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  let lastInput: T;
  let lastResult: R;
  let hasRun = false;

  const defaultEqualityFn = (a: R, b: R) => {
    // Better deep equality for objects and arrays
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return a === b;
  };
  
  const isEqual = equalityFn || defaultEqualityFn;

  return (input: T): R => {
    if (!hasRun || input !== lastInput) {
      const newResult = selector(input);
      
      if (!hasRun || !isEqual(lastResult, newResult)) {
        lastResult = newResult;
      }
      
      lastInput = input;
      hasRun = true;
    }
    
    return lastResult;
  };
};

// Enhanced batch updates utility
export const useBatchedUpdates = () => {
  const batchRef = useRef<Set<() => void>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addToBatch = useCallback((update: () => void) => {
    batchRef.current.add(update);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const updates = Array.from(batchRef.current);
      batchRef.current.clear();
      
      // Execute all batched updates
      React.startTransition(() => {
        updates.forEach(update => update());
      });
    }, 16); // Batch updates within a single frame
  }, []);

  return addToBatch;
};

// Virtual scrolling hook for large lists
export const useVirtualScrolling = (
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, itemCount]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleRange,
    onScroll,
    totalHeight: itemCount * itemHeight,
    offsetY: visibleRange.startIndex * itemHeight
  };
};

// Component performance wrapper with React.memo - simplified version
export const withPerformanceOptimization = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName: string,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const MemoizedComponent = React.memo(Component, areEqual);
  MemoizedComponent.displayName = `Optimized(${componentName})`;
  
  return MemoizedComponent;
};

// Smart dependency array optimization
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const memoizedDeps = useMemo(() => deps, deps);
  return useCallback(callback, memoizedDeps);
};

// Optimized effect with cleanup
export const useOptimizedEffect = (
  effect: React.EffectCallback,
  deps?: React.DependencyList
) => {
  const memoizedDeps = useMemo(() => deps, deps || []);
  
  React.useEffect(() => {
    const cleanup = effect();
    
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, memoizedDeps);
};
