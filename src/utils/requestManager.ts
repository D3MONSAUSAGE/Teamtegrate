
interface PendingRequest<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestManager {
  private pendingRequests = new Map<string, PendingRequest<any>>();

  // Deduplicate identical requests
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!.promise;
    }

    // Create a new request
    let resolve: (value: T) => void;
    let reject: (error: any) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const pendingRequest: PendingRequest<T> = {
      promise,
      resolve: resolve!,
      reject: reject!
    };

    this.pendingRequests.set(key, pendingRequest);

    try {
      const result = await requestFn();
      pendingRequest.resolve(result);
      return result;
    } catch (error) {
      pendingRequest.reject(error);
      throw error;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  // Get the number of pending requests
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  // Clear all pending requests (useful for cleanup)
  clearAll(): void {
    this.pendingRequests.forEach(request => {
      request.reject(new Error('Request manager cleared'));
    });
    this.pendingRequests.clear();
  }
}

export const requestManager = new RequestManager();
