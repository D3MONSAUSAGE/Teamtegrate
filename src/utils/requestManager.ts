
interface RequestCache {
  [key: string]: {
    promise: Promise<any>;
    timestamp: number;
    data?: any;
  };
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

class RequestManager {
  private cache: RequestCache = {};
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000
  };

  // Deduplicate requests by key
  async dedupe<T>(key: string, requestFn: () => Promise<T>, ttl = this.CACHE_TTL): Promise<T> {
    const now = Date.now();
    const cached = this.cache[key];

    // Return cached promise if it's still pending and not expired
    if (cached && (now - cached.timestamp) < ttl) {
      try {
        return await cached.promise;
      } catch (error) {
        // Remove failed cache entry and continue with new request
        delete this.cache[key];
        console.warn('Cached request failed, retrying with new request:', error);
      }
    }

    // Create new request with timeout and retry logic
    const promise = this.withRetryAndTimeout(requestFn);
    this.cache[key] = {
      promise,
      timestamp: now
    };

    try {
      const result = await promise;
      this.cache[key].data = result;
      return result;
    } catch (error) {
      delete this.cache[key];
      throw error;
    }
  }

  // Retry logic with exponential backoff and timeout
  private async withRetryAndTimeout<T>(
    requestFn: () => Promise<T>, 
    config = this.DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Add timeout to each attempt
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 15000)
        );

        const result = await Promise.race([
          requestFn(),
          timeoutPromise
        ]);

        return result;
      } catch (error) {
        lastError = error as Error;
        
        console.warn(`Request attempt ${attempt + 1} failed:`, lastError.message);
        
        if (attempt === config.maxRetries) {
          break;
        }

        // Don't retry on certain error types
        if (this.isNonRetryableError(lastError)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const baseDelay = config.baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
        const delay = Math.min(baseDelay + jitter, config.maxDelay);

        console.log(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // Enhance error message for user-facing errors
    if (this.isNetworkError(lastError!)) {
      throw new Error('Network connection issue. Please check your connection and try again.');
    }

    throw lastError!;
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') ||
           message.includes('forbidden') ||
           message.includes('not found') ||
           message.includes('invalid input syntax') ||
           message.includes('permission');
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('failed to fetch') ||
           message.includes('network error') ||
           message.includes('timeout') ||
           message.includes('connection');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Clear cache for a specific key
  clearCache(key: string): void {
    delete this.cache[key];
  }

  // Clear all expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > this.CACHE_TTL) {
        delete this.cache[key];
      }
    });
  }

  // Check if we have cached data
  hasCachedData(key: string): boolean {
    const cached = this.cache[key];
    return cached && cached.data !== undefined;
  }

  // Get cached data without making a request
  getCachedData<T>(key: string): T | null {
    const cached = this.cache[key];
    return cached?.data || null;
  }

  // Clear all cache
  clearAllCache(): void {
    this.cache = {};
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: Object.keys(this.cache).length,
      keys: Object.keys(this.cache)
    };
  }
}

export const requestManager = new RequestManager();

// Enhanced debounce utility with cleanup
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for rate limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
