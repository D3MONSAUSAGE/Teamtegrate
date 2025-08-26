import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  messageCount: number;
  roomId: string;
}

export function useMessagePerformance(roomId: string | null, messageCount: number, loading: boolean) {
  const startTimeRef = useRef<number | null>(null);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    if (loading && roomId) {
      startTimeRef.current = performance.now();
    } else if (!loading && startTimeRef.current && roomId) {
      const loadTime = performance.now() - startTimeRef.current;
      
      const metrics: PerformanceMetrics = {
        loadTime,
        messageCount,
        roomId
      };

      metricsRef.current.push(metrics);

      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MESSAGE_PERF] Room ${roomId}: ${messageCount} messages loaded in ${loadTime.toFixed(2)}ms`);
        
        // Warn if loading is slow
        if (loadTime > 1000) {
          console.warn(`[MESSAGE_PERF] Slow loading detected: ${loadTime.toFixed(2)}ms for ${messageCount} messages`);
        }
      }

      startTimeRef.current = null;
    }
  }, [loading, messageCount, roomId]);

  const getAverageLoadTime = () => {
    if (metricsRef.current.length === 0) return 0;
    const total = metricsRef.current.reduce((sum, metric) => sum + metric.loadTime, 0);
    return total / metricsRef.current.length;
  };

  const getMetrics = () => metricsRef.current;

  return {
    getAverageLoadTime,
    getMetrics
  };
}