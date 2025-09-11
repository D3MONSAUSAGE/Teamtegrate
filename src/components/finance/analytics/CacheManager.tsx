import React, { createContext, useContext, useState, useEffect } from 'react';
import { SalesData } from '@/types/sales';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheManagerContextType {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, data: T, ttlMinutes?: number) => void;
  invalidate: (key: string) => void;
  clear: () => void;
  getStats: () => { size: number; hits: number; misses: number };
}

const CacheManagerContext = createContext<CacheManagerContextType | null>(null);

export const useCacheManager = () => {
  const context = useContext(CacheManagerContext);
  if (!context) {
    throw new Error('useCacheManager must be used within a CacheManagerProvider');
  }
  return context;
};

interface CacheManagerProviderProps {
  children: React.ReactNode;
  defaultTTL?: number; // Default TTL in minutes
  maxSize?: number; // Maximum number of entries
}

export const CacheManagerProvider: React.FC<CacheManagerProviderProps> = ({
  children,
  defaultTTL = 15, // 15 minutes default
  maxSize = 100
}) => {
  const [cache, setCache] = useState<Map<string, CacheEntry<any>>>(new Map());
  const [stats, setStats] = useState({ hits: 0, misses: 0 });

  // Cleanup expired entries
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        let changed = false;
        
        for (const [key, entry] of newCache.entries()) {
          if (now - entry.timestamp > entry.ttl) {
            newCache.delete(key);
            changed = true;
          }
        }
        
        return changed ? newCache : prevCache;
      });
    };

    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, []);

  const get = <T,>(key: string): T | null => {
    const entry = cache.get(key);
    
    if (!entry) {
      setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
      return null;
    }

    setStats(prev => ({ ...prev, hits: prev.hits + 1 }));
    return entry.data as T;
  };

  const set = <T,>(key: string, data: T, ttlMinutes: number = defaultTTL) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    };

    setCache(prev => {
      const newCache = new Map(prev);
      
      // Remove oldest entries if at max size
      if (newCache.size >= maxSize && !newCache.has(key)) {
        const oldestKey = newCache.keys().next().value;
        newCache.delete(oldestKey);
      }
      
      newCache.set(key, entry);
      return newCache;
    });
  };

  const invalidate = (key: string) => {
    setCache(prev => {
      if (!prev.has(key)) return prev;
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  };

  const clear = () => {
    setCache(new Map());
    setStats({ hits: 0, misses: 0 });
  };

  const getStats = () => ({
    size: cache.size,
    ...stats
  });

  const contextValue: CacheManagerContextType = {
    get,
    set,
    invalidate,
    clear,
    getStats
  };

  return (
    <CacheManagerContext.Provider value={contextValue}>
      {children}
    </CacheManagerContext.Provider>
  );
};

// Specialized hooks for common cache patterns
export const useSalesDataCache = () => {
  const cache = useCacheManager();
  
  const getSalesData = (teamId: string, dateRange: string): SalesData[] | null => {
    return cache.get<SalesData[]>(`sales_${teamId}_${dateRange}`);
  };

  const setSalesData = (teamId: string, dateRange: string, data: SalesData[]) => {
    cache.set(`sales_${teamId}_${dateRange}`, data, 10); // Cache for 10 minutes
  };

  const invalidateSalesData = (teamId?: string) => {
    if (teamId) {
      // Invalidate specific team data
      ['7d', '30d', '90d'].forEach(range => {
        cache.invalidate(`sales_${teamId}_${range}`);
      });
    } else {
      // Invalidate all sales data - more complex pattern matching needed
      cache.clear();
    }
  };

  return {
    getSalesData,
    setSalesData,
    invalidateSalesData
  };
};

export const useAnalyticsCache = () => {
  const cache = useCacheManager();
  
  const getKPIMetrics = (teamId: string, dateRange: string) => {
    return cache.get(`kpi_${teamId}_${dateRange}`);
  };

  const setKPIMetrics = (teamId: string, dateRange: string, data: any) => {
    cache.set(`kpi_${teamId}_${dateRange}`, data, 5); // Cache for 5 minutes
  };

  const getPerformanceInsights = (teamId: string) => {
    return cache.get(`insights_${teamId}`);
  };

  const setPerformanceInsights = (teamId: string, data: any) => {
    cache.set(`insights_${teamId}`, data, 30); // Cache for 30 minutes
  };

  return {
    getKPIMetrics,
    setKPIMetrics,
    getPerformanceInsights,
    setPerformanceInsights
  };
};

// Cache debugging component
export const CacheDebugger: React.FC = () => {
  const cache = useCacheManager();
  const [stats, setStats] = useState({ size: 0, hits: 0, misses: 0 });

  useEffect(() => {
    const updateStats = () => {
      setStats(cache.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    return () => clearInterval(interval);
  }, [cache]);

  const hitRate = stats.hits + stats.misses > 0 
    ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)
    : '0.0';

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-background border rounded-lg p-3 text-xs space-y-1 shadow-lg z-50">
      <div className="font-medium">Cache Stats</div>
      <div>Size: {stats.size} entries</div>
      <div>Hits: {stats.hits}</div>
      <div>Misses: {stats.misses}</div>
      <div>Hit Rate: {hitRate}%</div>
      <button
        onClick={() => cache.clear()}
        className="text-red-500 hover:underline"
      >
        Clear Cache
      </button>
    </div>
  );
};

export default CacheManagerProvider;