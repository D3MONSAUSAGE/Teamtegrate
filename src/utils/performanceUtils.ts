
import { useCallback, useRef } from 'react';

// Debounce utility for preventing rapid function calls
export const useDebounce = (callback: (...args: any[]) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Throttle utility for limiting function execution frequency
export const useThrottle = (callback: (...args: any[]) => void, delay: number) => {
  const lastCallRef = useRef<number>(0);

  return useCallback((...args: any[]) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};

// Performance logging utility (only in development)
export const perfLog = (operation: string, startTime?: number) => {
  if (process.env.NODE_ENV === 'development') {
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`${operation} took ${duration.toFixed(2)}ms`);
    } else {
      return performance.now();
    }
  }
};

// Memoization helper for expensive calculations
export const createMemoizedSelector = <T, R>(
  selector: (input: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) => {
  let lastInput: T;
  let lastResult: R;
  let hasRun = false;

  const defaultEqualityFn = (a: R, b: R) => a === b;
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

// Component performance wrapper
export const withPerformanceLogging = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return (props: P) => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now();
      
      React.useEffect(() => {
        const endTime = performance.now();
        console.log(`${componentName} render took ${(endTime - startTime).toFixed(2)}ms`);
      });
    }
    
    return React.createElement(Component, props);
  };
};
