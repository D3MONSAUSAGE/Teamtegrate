
interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  timestamp: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class RequestManager {
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private cache = new Map<string, CacheEntry<any>>();
  private maxCacheSize = 1000;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired cache entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredCache();
    }, 300000);
  }

  // Enhanced dedupe with timeout handling
  async dedupe<T>(key: string, requestFn: () => Promise<T>, timeout = 30000): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      const pending = this.pendingRequests.get(key)!;
      
      // Check if request has timed out
      if (Date.now() - pending.timestamp > timeout) {
        this.pendingRequests.delete(key);
      } else {
        return pending.promise;
      }
    }

    // Create a new request with timeout
    let resolve: (value: T) => void;
    let reject: (error: any) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const pendingRequest: PendingRequest<T> = {
      promise,
      resolve: resolve!,
      reject: reject!,
      timestamp: Date.now()
    };

    this.pendingRequests.set(key, pendingRequest);

    // Set timeout for the request
    const timeoutId = setTimeout(() => {
      if (this.pendingRequests.has(key)) {
        this.pendingRequests.delete(key);
        pendingRequest.reject(new Error(`Request timeout: ${key}`));
      }
    }, timeout);

    try {
      const result = await requestFn();
      clearTimeout(timeoutId);
      pendingRequest.resolve(result);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      pendingRequest.reject(error);
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // Enhanced cache with LRU eviction
  getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update hit count for LRU
    cached.hits++;
    cached.timestamp = now;
    
    return cached.data;
  }

  setCachedData<T>(key: string, data: T, ttl: number = 300000): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 1
    });
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < leastHits) {
        leastHits = entry.hits;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }

  // Batch operations for multiple cache operations
  batchCache<T>(operations: Array<{ key: string; data: T; ttl?: number }>): void {
    operations.forEach(({ key, data, ttl }) => {
      this.setCachedData(key, data, ttl);
    });
  }

  clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Smart invalidation based on patterns
  invalidateByPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      pendingRequests: this.pendingRequests.size,
      usage: (this.cache.size / this.maxCacheSize) * 100
    };
  }

  clearAll(): void {
    this.pendingRequests.forEach(request => {
      request.reject(new Error('Request manager cleared'));
    });
    this.pendingRequests.clear();
    this.cache.clear();
  }

  destroy(): void {
    this.clearAll();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Enhanced debounce utility with better performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): T => {
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let timerId: NodeJS.Timeout | undefined;
  let lastArgs: Parameters<T>;
  let lastThis: any;
  let result: ReturnType<T>;

  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined as any;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timerId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined as any;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined as any;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now());
  }

  function debounced(...args: Parameters<T>): ReturnType<T> {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait) {
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as T;
};

export const requestManager = new RequestManager();

// Export for cleanup on app unmount
export const destroyRequestManager = () => requestManager.destroy();
