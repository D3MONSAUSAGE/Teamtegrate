
interface NetworkMetrics {
  requestCount: number;
  failureCount: number;
  totalResponseTime: number;
  lastFailureTime: number;
}

interface CircuitBreakerState {
  isOpen: boolean;
  openedAt: number;
  failureCount: number;
  lastFailureTime: number;
}

class NetworkManager {
  private metrics: NetworkMetrics = {
    requestCount: 0,
    failureCount: 0,
    totalResponseTime: 0,
    lastFailureTime: 0
  };

  private circuitBreaker: CircuitBreakerState = {
    isOpen: false,
    openedAt: 0,
    failureCount: 0,
    lastFailureTime: 0
  };

  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_CONCURRENT_REQUESTS = 10;
  private currentRequests = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  // Circuit breaker pattern
  private checkCircuitBreaker(): boolean {
    const now = Date.now();
    
    // If circuit is open, check if we should try to close it
    if (this.circuitBreaker.isOpen) {
      if (now - this.circuitBreaker.openedAt > this.RECOVERY_TIMEOUT) {
        console.log('NetworkManager: Attempting to close circuit breaker');
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failureCount = 0;
        return true;
      }
      return false;
    }
    
    return true;
  }

  private recordSuccess(responseTime: number): void {
    this.metrics.requestCount++;
    this.metrics.totalResponseTime += responseTime;
    
    // Reset circuit breaker on success
    if (this.circuitBreaker.failureCount > 0) {
      this.circuitBreaker.failureCount = Math.max(0, this.circuitBreaker.failureCount - 1);
    }
  }

  private recordFailure(): void {
    const now = Date.now();
    this.metrics.requestCount++;
    this.metrics.failureCount++;
    this.metrics.lastFailureTime = now;
    
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = now;
    
    // Open circuit breaker if failure threshold exceeded
    if (this.circuitBreaker.failureCount >= this.FAILURE_THRESHOLD) {
      console.warn('NetworkManager: Opening circuit breaker due to excessive failures');
      this.circuitBreaker.isOpen = true;
      this.circuitBreaker.openedAt = now;
    }
  }

  // Request queuing to prevent overwhelming the network
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.currentRequests < this.MAX_CONCURRENT_REQUESTS) {
      const request = this.requestQueue.shift();
      if (request) {
        this.currentRequests++;
        request().finally(() => {
          this.currentRequests--;
          this.processQueue(); // Process next item in queue
        });
      }
    }

    this.isProcessingQueue = false;
  }

  // Main method for making resilient network requests
  async withNetworkResilience<T>(
    requestKey: string,
    requestFn: () => Promise<T>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<T> {
    const { priority = 'normal', timeout = 15000, retries = 2 } = options;

    // Check circuit breaker
    if (!this.checkCircuitBreaker()) {
      throw new Error('Network requests are temporarily disabled due to repeated failures');
    }

    // Use request manager for deduplication
    return await requestManager.dedupe(requestKey, async () => {
      // If too many concurrent requests, queue this one (unless high priority)
      if (this.currentRequests >= this.MAX_CONCURRENT_REQUESTS && priority !== 'high') {
        return new Promise<T>((resolve, reject) => {
          this.requestQueue.push(async () => {
            try {
              const result = await this.executeRequest(requestFn, timeout, retries);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          });
          this.processQueue();
        });
      }

      return this.executeRequest(requestFn, timeout, retries);
    });
  }

  private async executeRequest<T>(
    requestFn: () => Promise<T>,
    timeout: number,
    retries: number
  ): Promise<T> {
    const startTime = Date.now();
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add timeout to request
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeout)
        );

        const result = await Promise.race([requestFn(), timeoutPromise]);
        const responseTime = Date.now() - startTime;
        
        this.recordSuccess(responseTime);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }

        // Don't retry if circuit breaker opened during request
        if (this.circuitBreaker.isOpen) {
          break;
        }

        // Wait before retry with exponential backoff
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await this.sleep(delay);
        }
      }
    }

    this.recordFailure();
    throw lastError!;
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('unauthorized') ||
           message.includes('forbidden') ||
           message.includes('not found') ||
           message.includes('invalid input syntax');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Metrics and monitoring
  getFailureRate(): number {
    if (this.metrics.requestCount === 0) return 0;
    return this.metrics.failureCount / this.metrics.requestCount;
  }

  getAverageResponseTime(): number {
    if (this.metrics.requestCount === 0) return 0;
    return this.metrics.totalResponseTime / this.metrics.requestCount;
  }

  getCurrentRequestCount(): number {
    return this.currentRequests;
  }

  getQueueLength(): number {
    return this.requestQueue.length;
  }

  getNetworkHealth(): {
    isHealthy: boolean;
    failureRate: number;
    avgResponseTime: number;
    circuitBreakerOpen: boolean;
    activeRequests: number;
    queuedRequests: number;
  } {
    return {
      isHealthy: !this.circuitBreaker.isOpen && this.getFailureRate() < 0.3,
      failureRate: this.getFailureRate(),
      avgResponseTime: this.getAverageResponseTime(),
      circuitBreakerOpen: this.circuitBreaker.isOpen,
      activeRequests: this.currentRequests,
      queuedRequests: this.requestQueue.length
    };
  }

  // Reset metrics (useful for testing or after network recovery)
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      failureCount: 0,
      totalResponseTime: 0,
      lastFailureTime: 0
    };
    
    this.circuitBreaker = {
      isOpen: false,
      openedAt: 0,
      failureCount: 0,
      lastFailureTime: 0
    };
  }
}

export const networkManager = new NetworkManager();
