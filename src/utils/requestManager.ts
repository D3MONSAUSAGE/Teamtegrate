
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

    // Return cached promise if it's still pending
    if (cached && (now - cached.timestamp) < ttl) {
      try {
        return await cached.promise;
      } catch (error) {
        // Remove failed cache entry
        delete this.cache[key];
        throw error;
      }
    }

    // Create new request
    const promise = this.withRetry(requestFn);
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

  // Retry logic with exponential backoff
  private async withRetry<T>(
    requestFn: () => Promise<T>, 
    config = this.DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );

        await this.sleep(delay);
      }
    }

    throw lastError!;
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
}

export const requestManager = new RequestManager();

// Debounce utility
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
